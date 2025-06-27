import { NextRequest, NextResponse } from "next/server";

interface MusicRequest {
  prompt: string;
  bpm?: number;
  density?: number;
  brightness?: number;
  temperature?: number;
  guidance?: number;
  scale?: string;
  muteBass?: boolean;
  muteDrums?: boolean;
  onlyBassAndDrums?: boolean;
}

export async function POST(request: NextRequest) {
  try {
    const body: MusicRequest = await request.json();
    const { 
      prompt,
      bpm = 120,
      density = 0.5,
      brightness = 0.5,
      temperature = 1.1,
      guidance = 4.0,
      scale = "SCALE_UNSPECIFIED",
      muteBass = false,
      muteDrums = false,
      onlyBassAndDrums = false
    } = body;

    if (!prompt || prompt.trim().length === 0) {
      return NextResponse.json(
        { error: "Music prompt is required" },
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

    // Note: This is a simplified implementation for demonstration
    // Real Lyria RealTime requires WebSocket connections for streaming
    // This endpoint returns configuration for the client-side WebSocket connection
    
    const sessionConfig = {
      model: "lyria-realtime-exp",
      weightedPrompts: [
        {
          text: prompt,
          weight: 1.0
        }
      ],
      musicGenerationConfig: {
        bpm,
        density,
        brightness,
        temperature,
        guidance,
        scale,
        muteBass,
        muteDrums,
        onlyBassAndDrums,
      },
      apiKey, // This would normally be handled more securely
    };

    return NextResponse.json({
      success: true,
      message: "Music generation session configured",
      sessionConfig,
      prompt,
      instructions: "Use the returned configuration to establish a WebSocket connection with Lyria RealTime for streaming music generation."
    });

  } catch (error) {
    console.error("Music generation error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to configure music generation" },
      { status: 500 }
    );
  }
}

// WebSocket endpoint for real-time music streaming
// Note: This would typically be implemented as a separate WebSocket server
// or using Next.js API routes with WebSocket support
export async function GET() {
  return NextResponse.json({
    message: "Music WebSocket endpoint - use WebSocket connection for real-time streaming",
    endpoints: {
      websocket: "wss://generativelanguage.googleapis.com/ws/live/v1alpha/sessions/connect",
      documentation: "https://ai.google.dev/gemini-api/docs/lyria-realtime"
    }
  });
}