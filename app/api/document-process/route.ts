import { NextRequest, NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";

const genAI = new GoogleGenAI({ apiKey: process.env.GOOGLE_GENERATIVE_AI_API_KEY! });

export async function POST(request: NextRequest) {
  try {
    const { type, data, url } = await request.json();

    if (!type || (type !== "upload" && type !== "url")) {
      return NextResponse.json(
        { error: "Invalid document type. Must be 'upload' or 'url'" },
        { status: 400 }
      );
    }

    // Initialize the Gemini model with PDF vision capabilities
    const model = genAI.chats.create({
      model: "gemini-2.0-flash-exp",
      config: {
        temperature: 0.3,
        topP: 0.8,
        topK: 40,
        maxOutputTokens: 4096,
      },
    });

    const analysisPrompt = `
      Please analyze this PDF document comprehensively and provide the following information in a structured format:

      1. **Summary**: A concise 2-3 sentence summary of the document's main purpose and content
      2. **Key Points**: Extract 5-7 main points or findings from the document
      3. **Topics**: Identify 3-5 main topics or themes covered
      4. **Sentiment**: Overall tone (positive, neutral, negative, mixed)
      5. **Complexity**: Assess complexity level (simple, intermediate, complex)
      6. **Language**: Primary language of the document
      7. **Document Type**: Identify the type of document (research paper, report, manual, etc.)
      8. **Page Count**: Estimate the number of pages
      9. **Word Count**: Estimate the total word count

      Please format your response as JSON with the following structure:
      {
        "summary": "...",
        "keyPoints": ["point1", "point2", ...],
        "topics": ["topic1", "topic2", ...],
        "sentiment": "...",
        "complexity": "...",
        "language": "...",
        "documentType": "...",
        "pageCount": number,
        "wordCount": number,
        "extractedText": "First 500 characters of the document text..."
      }
    `;

    let result;

    if (type === "upload") {
      // Process uploaded file (base64 data)
      if (!data) {
        return NextResponse.json(
          { error: "No file data provided" },
          { status: 400 }
        );
      }

      const parts = [
        { text: analysisPrompt },
        {
          inlineData: {
            mimeType: "application/pdf",
            data: data,
          },
        },
      ];

      result = await model.sendMessage({ message: parts });

    } else if (type === "url") {
      // Process document from URL
      if (!url) {
        return NextResponse.json(
          { error: "No URL provided" },
          { status: 400 }
        );
      }

      // For URL processing, we'll fetch the PDF and then process it
      try {
        const pdfResponse = await fetch(url);
        if (!pdfResponse.ok) {
          throw new Error(`Failed to fetch PDF: ${pdfResponse.statusText}`);
        }

        const pdfBuffer = await pdfResponse.arrayBuffer();
        const base64Data = Buffer.from(pdfBuffer).toString('base64');

        const parts = [
          { text: analysisPrompt },
          {
            inlineData: {
              mimeType: "application/pdf",
              data: base64Data,
            },
          },
        ];

        result = await model.sendMessage({ message: parts });

      } catch (fetchError) {
        console.error("Error fetching PDF from URL:", fetchError);
        return NextResponse.json(
          { error: "Failed to fetch PDF from the provided URL" },
          { status: 400 }
        );
      }
    }

    if (!result) {
      return NextResponse.json(
        { error: "Failed to process document" },
        { status: 500 }
      );
    }

    const responseText = result.text || "";
    
    // Try to parse JSON response, fallback to structured parsing if needed
    let analysis;
    try {
      // Clean the response to extract JSON
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        analysis = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error("No JSON found in response");
      }
    } catch (parseError) {
      // Fallback parsing if JSON parsing fails
      console.log("JSON parsing failed, using fallback parsing");
      
      analysis = {
        summary: extractSection(responseText, "summary") || "Document analysis completed",
        keyPoints: extractListItems(responseText, "key points") || ["Analysis completed"],
        topics: extractListItems(responseText, "topics") || ["General"],
        sentiment: extractSection(responseText, "sentiment") || "neutral",
        complexity: extractSection(responseText, "complexity") || "intermediate",
        language: extractSection(responseText, "language") || "English",
        documentType: extractSection(responseText, "document type") || "Document",
        pageCount: parseInt(extractSection(responseText, "page count") || "1"),
        wordCount: parseInt(extractSection(responseText, "word count") || "1000"),
        extractedText: responseText.slice(0, 500),
      };
    }

    // Ensure all required fields are present with defaults
    const finalAnalysis = {
      summary: analysis.summary || "Document processed successfully",
      keyPoints: Array.isArray(analysis.keyPoints) ? analysis.keyPoints : ["Content analyzed"],
      topics: Array.isArray(analysis.topics) ? analysis.topics : ["General"],
      sentiment: analysis.sentiment || "neutral",
      complexity: ["simple", "intermediate", "complex"].includes(analysis.complexity) 
        ? analysis.complexity : "intermediate",
      language: analysis.language || "English",
      documentType: analysis.documentType || "Document",
      pageCount: typeof analysis.pageCount === "number" ? analysis.pageCount : 1,
      wordCount: typeof analysis.wordCount === "number" ? analysis.wordCount : 1000,
      extractedText: analysis.extractedText || responseText.slice(0, 500),
    };

    return NextResponse.json({
      success: true,
      analysis: finalAnalysis,
      rawResponse: responseText,
    });

  } catch (error) {
    console.error("Document processing error:", error);
    return NextResponse.json(
      { 
        error: "Failed to process document", 
        details: error instanceof Error ? error.message : "Unknown error" 
      },
      { status: 500 }
    );
  }
}

// Helper functions for fallback parsing
function extractSection(text: string, sectionName: string): string | null {
  const patterns = [
    new RegExp(`${sectionName}[:\\s]*([^\\n]+)`, 'i'),
    new RegExp(`\\*\\*${sectionName}\\*\\*[:\\s]*([^\\n]+)`, 'i'),
    new RegExp(`${sectionName.toUpperCase()}[:\\s]*([^\\n]+)`, 'i'),
  ];

  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match && match[1]) {
      return match[1].trim().replace(/["\[\]]/g, '');
    }
  }
  return null;
}

function extractListItems(text: string, sectionName: string): string[] | null {
  const sectionRegex = new RegExp(`${sectionName}[:\\s]*([\\s\\S]*?)(?=\\n\\n|\\n[A-Z]|$)`, 'i');
  const match = text.match(sectionRegex);
  
  if (match && match[1]) {
    const items = match[1]
      .split(/[\n\-\*•]/)
      .map(item => item.trim().replace(/^[\d\.\)\-\*•\s]+/, ''))
      .filter(item => item.length > 0 && !item.match(/^\d+$/))
      .slice(0, 7); // Limit to 7 items
    
    return items.length > 0 ? items : null;
  }
  return null;
}