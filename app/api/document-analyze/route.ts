import { NextRequest, NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";

const genAI = new GoogleGenAI({ apiKey: process.env.GOOGLE_GENERATIVE_AI_API_KEY! });

export async function POST(request: NextRequest) {
  try {
    const { 
      documentId, 
      task, 
      prompt, 
      previousAnalysis 
    } = await request.json();

    if (!documentId || !task || !prompt) {
      return NextResponse.json(
        { error: "Missing required fields: documentId, task, and prompt are required" },
        { status: 400 }
      );
    }

    // Initialize the Gemini model
    const model = genAI.chats.create({
      model: "gemini-2.0-flash-exp", 
      config: {
        temperature: 0.4,
        topP: 0.9,
        topK: 40,
        maxOutputTokens: 4096,
      },
    });

    // Create context-aware prompt based on task type
    let systemPrompt = "";
    let analysisPrompt = "";

    const documentContext = previousAnalysis ? `
      Document Context:
      - Summary: ${previousAnalysis.summary}
      - Key Points: ${previousAnalysis.keyPoints?.join(", ")}
      - Topics: ${previousAnalysis.topics?.join(", ")}
      - Complexity: ${previousAnalysis.complexity}
      - Document Type: ${previousAnalysis.documentType}
      - Page Count: ${previousAnalysis.pageCount}
    ` : "";

    switch (task) {
      case "summarize":
        systemPrompt = `You are an expert document analyst specializing in creating comprehensive summaries. 
        Focus on capturing the main arguments, key findings, and essential information.`;
        analysisPrompt = `${documentContext}
        
        Task: Create a comprehensive summary of this document.
        User Request: ${prompt}
        
        Please provide:
        1. A detailed summary (3-5 paragraphs)
        2. Main conclusions or outcomes
        3. Key statistics or data points mentioned
        4. Recommendations or next steps (if any)
        
        Format your response clearly with sections.`;
        break;

      case "extract":
        systemPrompt = `You are an expert at extracting specific information from documents. 
        Focus on identifying and organizing the requested data points accurately.`;
        analysisPrompt = `${documentContext}
        
        Task: Extract specific information from this document.
        User Request: ${prompt}
        
        Please extract and organize the requested information in a clear, structured format.
        Use bullet points, tables, or lists as appropriate to make the information easily scannable.`;
        break;

      case "analyze":
        systemPrompt = `You are a senior analyst capable of deep document analysis. 
        Focus on providing insights, critical evaluation, and deeper understanding.`;
        analysisPrompt = `${documentContext}
        
        Task: Perform deep analysis of this document.
        User Request: ${prompt}
        
        Please provide:
        1. Critical analysis of the content
        2. Strengths and weaknesses identified
        3. Potential implications or consequences
        4. Connections to broader topics or trends
        5. Your expert assessment and insights`;
        break;

      case "questions":
        systemPrompt = `You are an educational expert who creates thoughtful, relevant questions 
        that help people better understand and engage with document content.`;
        analysisPrompt = `${documentContext}
        
        Task: Generate questions based on this document.
        User Request: ${prompt}
        
        Please create:
        1. 5-7 comprehension questions about the main content
        2. 3-4 analytical questions that require deeper thinking
        3. 2-3 application questions about how to use this information
        4. Discussion questions for group conversations (if applicable)
        
        Format each set of questions clearly with appropriate headers.`;
        break;

      case "chat":
        systemPrompt = `You are GorbaganaAI, an intelligent document assistant with deep understanding 
        of the document content. You provide helpful, accurate responses based on the document context.
        Be conversational but precise, and always ground your responses in the document content.`;
        analysisPrompt = `${documentContext}
        
        User Question: ${prompt}
        
        Please answer the user's question based on the document content. If the question cannot be 
        answered from the document, clearly state that and offer to help with related topics that 
        are covered in the document.`;
        break;

      default:
        return NextResponse.json(
          { error: "Invalid task type" },
          { status: 400 }
        );
    }

    // For document analysis, we need to reference the original document
    // In a real implementation, you would store and retrieve the document data
    // For now, we'll work with the provided context and prompt
    
    const parts = [
      { 
        text: `${systemPrompt}

${analysisPrompt}

Please provide a comprehensive response that directly addresses the user's request.` 
      }
    ];

    const result = await model.sendMessage({ message: parts });
    const responseText = result.text || "";

    // For chat responses, we return the direct response
    if (task === "chat") {
      return NextResponse.json({
        success: true,
        response: responseText,
        task,
      });
    }

    // For other analysis tasks, we can extract structured information
    let analysisResults = {};

    try {
      // Try to extract structured data based on task type
      switch (task) {
        case "summarize":
          analysisResults = {
            summary: responseText,
            insights: extractInsights(responseText),
          };
          break;

        case "extract":
          analysisResults = {
            extractedData: responseText,
            structuredData: parseExtractedData(responseText),
          };
          break;

        case "analyze":
          analysisResults = {
            analysis: responseText,
            insights: extractInsights(responseText),
            recommendations: extractRecommendations(responseText),
          };
          break;

        case "questions":
          analysisResults = {
            questions: parseQuestions(responseText),
            formattedQuestions: responseText,
          };
          break;
      }
    } catch (parseError) {
      console.log("Could not parse structured data, returning raw response");
      analysisResults = { rawResponse: responseText };
    }

    return NextResponse.json({
      success: true,
      response: responseText,
      task,
      analysis: analysisResults,
    });

  } catch (error) {
    console.error("Document analysis error:", error);
    return NextResponse.json(
      { 
        error: "Failed to analyze document", 
        details: error instanceof Error ? error.message : "Unknown error" 
      },
      { status: 500 }
    );
  }
}

// Helper functions for parsing structured data
function extractInsights(text: string): string[] {
  const insights: string[] = [];
  const patterns = [
    /insights?[:\s]*([^\n]+)/gi,
    /key findings?[:\s]*([^\n]+)/gi,
    /conclusions?[:\s]*([^\n]+)/gi,
  ];

  patterns.forEach(pattern => {
    const matches = text.matchAll(pattern);
    for (const match of matches) {
      if (match[1]) {
        insights.push(match[1].trim());
      }
    }
  });

  return insights.slice(0, 5); // Limit to 5 insights
}

function extractRecommendations(text: string): string[] {
  const recommendations: string[] = [];
  const patterns = [
    /recommendations?[:\s]*([^\n]+)/gi,
    /suggestions?[:\s]*([^\n]+)/gi,
    /next steps?[:\s]*([^\n]+)/gi,
  ];

  patterns.forEach(pattern => {
    const matches = text.matchAll(pattern);
    for (const match of matches) {
      if (match[1]) {
        recommendations.push(match[1].trim());
      }
    }
  });

  return recommendations.slice(0, 5); // Limit to 5 recommendations
}

function parseQuestions(text: string): Array<{category: string; questions: string[]}> {
  const questionCategories = [
    { name: "Comprehension", patterns: [/comprehension questions?[:\s]*([\s\S]*?)(?=\n\n|analytical|application|discussion|$)/i] },
    { name: "Analytical", patterns: [/analytical questions?[:\s]*([\s\S]*?)(?=\n\n|application|discussion|$)/i] },
    { name: "Application", patterns: [/application questions?[:\s]*([\s\S]*?)(?=\n\n|discussion|$)/i] },
    { name: "Discussion", patterns: [/discussion questions?[:\s]*([\s\S]*?)(?=\n\n|$)/i] },
  ];

  const categorizedQuestions: Array<{category: string; questions: string[]}> = [];

  questionCategories.forEach(category => {
    category.patterns.forEach(pattern => {
      const match = text.match(pattern);
      if (match && match[1]) {
        const questions = match[1]
          .split(/\n/)
          .map(q => q.trim().replace(/^\d+\.\s*/, '').replace(/^[\-\*•]\s*/, ''))
          .filter(q => q.length > 10 && q.includes('?'))
          .slice(0, 7);

        if (questions.length > 0) {
          categorizedQuestions.push({
            category: category.name,
            questions
          });
        }
      }
    });
  });

  return categorizedQuestions;
}

function parseExtractedData(text: string): any {
  // Try to identify structured data in the response
  const data: any = {};

  // Look for common data patterns
  const patterns = {
    dates: /(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4}|\d{4}[\/\-]\d{1,2}[\/\-]\d{1,2})/g,
    numbers: /\d+(?:,\d{3})*(?:\.\d+)?/g,
    percentages: /\d+(?:\.\d+)?%/g,
    currencies: /\$\d+(?:,\d{3})*(?:\.\d{2})?/g,
  };

  Object.entries(patterns).forEach(([key, pattern]) => {
    const matches = text.match(pattern);
    if (matches) {
      data[key] = [...new Set(matches)]; // Remove duplicates
    }
  });

  return data;
}