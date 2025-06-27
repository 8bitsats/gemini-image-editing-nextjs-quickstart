import { NextRequest, NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";

interface VideoRequest {
  prompt: string;
  image?: string;
  aspectRatio?: "16:9" | "9:16";
  durationSeconds?: number;
  numberOfVideos?: number;
  personGeneration?: "dont_allow" | "allow_adult" | "allow_all";
}

export async function POST(request: NextRequest) {
  try {
    const body: VideoRequest = await request.json();
    const { 
      prompt, 
      image, 
      aspectRatio = "16:9", 
      durationSeconds = 5, 
      numberOfVideos = 1,
      personGeneration = "dont_allow"
    } = body;

    if (!prompt || prompt.trim().length === 0) {
      return NextResponse.json(
        { error: "Prompt is required" },
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

    console.log("Starting video generation with Veo 2...");

    // Prepare generation request
    const generateRequest: any = {
      model: "veo-2.0-generate-001",
      prompt: prompt,
      config: {
        personGeneration,
        aspectRatio,
        numberOfVideos,
        durationSeconds,
      },
    };

    // Add image if provided
    if (image) {
      generateRequest.image = {
        imageBytes: image,
        mimeType: "image/png",
      };
    }

    // Start video generation operation
    let operation = await ai.models.generateVideos(generateRequest);

    console.log("Video generation started, waiting for completion...");

    // Poll for completion (this can take 2-3 minutes)
    while (!operation.done) {
      await new Promise((resolve) => setTimeout(resolve, 10000)); // Wait 10 seconds
      operation = await ai.operations.getVideosOperation({
        operation: operation,
      });
      console.log("Checking operation status...");
    }

    console.log("Video generation completed!");

    // Process the generated videos
    const videos = [];
    if (operation.response?.generatedVideos) {
      for (let i = 0; i < operation.response.generatedVideos.length; i++) {
        const generatedVideo = operation.response.generatedVideos[i];
        if (generatedVideo.video?.uri) {
          videos.push({
            index: i,
            uri: generatedVideo.video.uri,
            downloadUrl: `${generatedVideo.video.uri}&key=${apiKey}`,
          });
        }
      }
    }

    return NextResponse.json({
      success: true,
      videos,
      prompt,
      config: {
        aspectRatio,
        durationSeconds,
        numberOfVideos,
        personGeneration,
      },
    });

  } catch (error) {
    console.error("Video generation error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to generate video" },
      { status: 500 }
    );
  }
}