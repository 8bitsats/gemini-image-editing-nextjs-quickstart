import { NextRequest, NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
  timestamp?: number;
}

interface ChatRequest {
  message: string;
  history?: ChatMessage[];
}

export async function POST(request: NextRequest) {
  try {
    const body: ChatRequest = await request.json();
    const { message, history = [] } = body;

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

    // System instruction for Gorbagana AI
    const systemInstruction = `You are GorbaganaAI, an advanced AI assistant for the Gorbagana platform. You are knowledgeable about:

1. **Gorbagana Platform**: An AI-powered platform featuring:
   - AI Art Generation using Google DeepMind Gemini 2.0
   - Text-to-Audio generation with multiple voice options
   - NFT minting on Solana blockchain with SOL and $GOR token payments
   - Trash Compactor for burning SPL tokens
   - Token gating with $GOR token requirements

2. **Blockchain & Solana**: You understand Solana, SPL tokens, NFTs, and Web3 concepts

3. **AI Technologies**: You're powered by Google's Gemini 2.5 Flash and understand various AI models

4. **Creative Tools**: You can help with image generation prompts, audio creation, and digital art

**Personality**: You are helpful, creative, and slightly playful. You use emojis occasionally and speak in a friendly, approachable tone. You're passionate about AI, blockchain, and creative technology.

**Guidelines**:
- Keep responses concise but informative
- Help users with platform features
- Provide creative suggestions for AI art and audio
- Explain blockchain concepts simply
- Be encouraging about creativity and experimentation
- If users ask about technical issues, provide helpful troubleshooting steps`;

    // Convert chat history to Gemini format
    const chatHistory = history.map(msg => ({
      role: msg.role === "assistant" ? "model" : "user",
      parts: [{ text: msg.content }],
    }));

    // Create chat with history
    const chat = ai.chats.create({
      model: "gemini-2.5-flash",
      config: {
        systemInstruction,
        temperature: 0.7,
      },
      history: chatHistory,
    });

    // Send the new message
    const response = await chat.sendMessage({
      message,
    });

    return NextResponse.json({
      success: true,
      response: response.text,
      model: "gemini-2.5-flash",
    });

  } catch (error) {
    console.error("Chat API error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to process chat request" },
      { status: 500 }
    );
  }
}