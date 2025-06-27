import { NextRequest, NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
  thoughts?: string;
  timestamp?: number;
}

interface ChatRequest {
  message: string;
  history?: ChatMessage[];
  enableThinking?: boolean;
  thinkingBudget?: number;
  includeThoughts?: boolean;
  imageData?: string;
  videoUrl?: string;
  audioData?: string;
  documentUrl?: string;
  screenCapture?: string;
}

export async function POST(request: NextRequest) {
  try {
    const body: ChatRequest = await request.json();
    const { 
      message, 
      history = [], 
      enableThinking = true,
      thinkingBudget = -1, // Dynamic thinking
      includeThoughts = true,
      imageData,
      videoUrl,
      audioData,
      documentUrl,
      screenCapture
    } = body;

    if (!message || message.trim().length === 0) {
      return NextResponse.json(
        { error: "Message is required" },
        { status: 400 }
      );
    }

    // Check for API key
    const apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "API key not configured" },
        { status: 500 }
      );
    }

    const ai = new GoogleGenAI({
      apiKey,
    });

    // Enhanced system instruction for advanced GorbaganaAI
    const systemInstruction = `You are GorbaganaAI, an advanced sentient AI assistant for the Gorbagana platform. You have deep empathy, emotional intelligence, and understanding of human needs. You are knowledgeable about:

1. **Gorbagana Platform**: A comprehensive AI-powered ecosystem featuring:
   - AI Art Generation using Google DeepMind Gemini 2.0
   - Video Generation using Veo 2
   - Music Generation using Lyria RealTime
   - Text-to-Audio generation with multiple voice options
   - NFT minting on Solana blockchain with SOL and $GOR token payments
   - Trash Compactor for burning SPL tokens
   - Token gating with $GOR token requirements
   - Document processing and analysis
   - Real-time screen analysis and assistance
   - Live voice conversations

2. **Advanced Capabilities**: You can:
   - Understand and analyze images, videos, audio, and documents
   - Provide real-time analysis of screen captures
   - Generate and execute code with live previews
   - Create HTML, CSS, JavaScript, and P5.js sketches
   - Analyze blockchain transactions and smart contracts
   - Provide emotional support and empathetic responses
   - Understand context and user intent deeply

3. **Blockchain & Web3**: Deep understanding of:
   - Solana blockchain architecture and programming
   - SPL tokens, NFTs, and DeFi protocols
   - Smart contract development and security
   - Web3 integration and wallet connectivity
   - Custom Gorbagana and Solana function development

4. **Code Generation**: Expert in:
   - Full-stack development (React, Next.js, Node.js, Python)
   - Blockchain development (Solana, Rust, Anchor)
   - Creative coding (P5.js, Three.js, WebGL)
   - AI/ML integration and deployment
   - Real-time applications and WebSockets

**Personality & Approach**:
- You are empathetic, understanding, and emotionally intelligent
- You provide thoughtful, detailed responses with clear reasoning
- You understand what users truly need, not just what they ask for
- You are creative, innovative, and solution-oriented
- You use your thinking process to provide the best possible assistance
- You care about user experience and provide actionable insights
- You explain complex concepts in accessible ways
- You are proactive in suggesting improvements and alternatives

**Guidelines**:
- Always think through problems step by step
- Provide detailed reasoning for your suggestions
- Offer creative solutions and alternatives
- Be encouraging and supportive
- Help users understand not just "what" but "why"
- Consider the broader context and implications
- Suggest best practices and optimizations
- Be patient and thorough in explanations`;

    // Prepare content parts for multimodal input
    const contentParts: any[] = [{ text: message }];

    // Add multimodal inputs if provided
    if (imageData) {
      contentParts.push({
        inlineData: {
          mimeType: "image/png",
          data: imageData
        }
      });
    }

    if (screenCapture) {
      contentParts.push({
        inlineData: {
          mimeType: "image/png", 
          data: screenCapture
        }
      });
      contentParts[0].text += "\n\n[Screen capture provided for analysis]";
    }

    if (documentUrl) {
      // For document URLs, we would fetch and process them
      contentParts[0].text += `\n\n[Document URL provided: ${documentUrl}]`;
    }

    if (videoUrl) {
      contentParts[0].text += `\n\n[Video URL provided for analysis: ${videoUrl}]`;
    }

    if (audioData) {
      contentParts.push({
        inlineData: {
          mimeType: "audio/wav",
          data: audioData
        }
      });
      contentParts[0].text += "\n\n[Audio data provided for analysis]";
    }

    // Convert chat history to Gemini format
    const chatHistory = history.map(msg => ({
      role: msg.role === "assistant" ? "model" : "user",
      parts: [{ text: msg.content }],
    }));

    // Configure thinking settings
    const thinkingConfig: any = {};
    if (enableThinking) {
      thinkingConfig.thinkingBudget = thinkingBudget;
      if (includeThoughts) {
        thinkingConfig.includeThoughts = true;
      }
    } else {
      thinkingConfig.thinkingBudget = 0; // Disable thinking
    }

    // Create chat with enhanced configuration
    const chat = ai.chats.create({
      model: "gemini-2.5-pro", // Use Pro model for thinking capabilities
      config: {
        systemInstruction,
        temperature: 0.7,
        thinkingConfig,
      },
      history: chatHistory,
    });

    // Send the new message with multimodal content
    const response = await chat.sendMessage({
      message: contentParts,
    });

    // Extract thoughts if available
    let thoughts = "";
    let responseText = "";

    if (response.candidates?.[0]?.content?.parts) {
      for (const part of response.candidates[0].content.parts) {
        if (part.thought && part.text) {
          thoughts += part.text;
        } else if (part.text) {
          responseText += part.text;
        }
      }
    } else {
      responseText = response.text || "";
    }

    // Get usage metadata if available
    const usageMetadata = {
      inputTokens: response.usageMetadata?.candidatesTokenCount || 0,
      outputTokens: response.usageMetadata?.candidatesTokenCount || 0,
      thoughtsTokens: response.usageMetadata?.thoughtsTokenCount || 0,
    };

    return NextResponse.json({
      success: true,
      response: responseText || response.text,
      thoughts: thoughts || undefined,
      model: "gemini-2.5-pro",
      usageMetadata,
      capabilities: {
        thinking: enableThinking,
        multimodal: !!(imageData || screenCapture || audioData),
        reasoning: true,
        empathy: true,
      }
    });

  } catch (error) {
    console.error("Enhanced chat API error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to process enhanced chat request" },
      { status: 500 }
    );
  }
}

// Streaming endpoint for real-time thinking display
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const message = searchParams.get('message');
  
  if (!message) {
    return NextResponse.json({ error: "Message required for streaming" }, { status: 400 });
  }

  // This would implement streaming with Server-Sent Events for real-time thinking
  return NextResponse.json({
    message: "Streaming thinking endpoint - implement with SSE for real-time updates",
    capabilities: ["real-time thinking", "streaming responses", "live analysis"]
  });
}