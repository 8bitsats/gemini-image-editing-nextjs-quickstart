import { NextRequest, NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";


interface AudioRequest {
  text: string;
  voice?: string;
  isSingleSpeaker?: boolean;
  speakers?: Array<{
    speaker: string;
    voice: string;
  }>;
}

interface WavConversionOptions {
  numChannels: number;
  sampleRate: number;
  bitsPerSample: number;
}

function parseMimeType(mimeType: string): WavConversionOptions {
  const [fileType, ...params] = mimeType.split(';').map(s => s.trim());
  const [, format] = fileType.split('/');

  const options: Partial<WavConversionOptions> = {
    numChannels: 1,
  };

  if (format && format.startsWith('L')) {
    const bits = parseInt(format.slice(1), 10);
    if (!isNaN(bits)) {
      options.bitsPerSample = bits;
    }
  }

  for (const param of params) {
    const [key, value] = param.split('=').map(s => s.trim());
    if (key === 'rate') {
      options.sampleRate = parseInt(value, 10);
    }
  }

  return options as WavConversionOptions;
}

function createWavHeader(dataLength: number, options: WavConversionOptions): Buffer {
  const { numChannels, sampleRate, bitsPerSample } = options;

  const byteRate = sampleRate * numChannels * bitsPerSample / 8;
  const blockAlign = numChannels * bitsPerSample / 8;
  const buffer = Buffer.alloc(44);

  buffer.write('RIFF', 0);
  buffer.writeUInt32LE(36 + dataLength, 4);
  buffer.write('WAVE', 8);
  buffer.write('fmt ', 12);
  buffer.writeUInt32LE(16, 16);
  buffer.writeUInt16LE(1, 20);
  buffer.writeUInt16LE(numChannels, 22);
  buffer.writeUInt32LE(sampleRate, 24);
  buffer.writeUInt32LE(byteRate, 28);
  buffer.writeUInt16LE(blockAlign, 32);
  buffer.writeUInt16LE(bitsPerSample, 34);
  buffer.write('data', 36);
  buffer.writeUInt32LE(dataLength, 40);

  return buffer;
}

function convertToWav(rawData: string, mimeType: string): Buffer {
  const options = parseMimeType(mimeType);
  const buffer = Buffer.from(rawData, 'base64');
  const wavHeader = createWavHeader(buffer.length, options);
  
  return Buffer.concat([wavHeader, buffer]);
}

export async function POST(request: NextRequest) {
  try {
    const body: AudioRequest = await request.json();
    const { text, voice = "Zephyr", isSingleSpeaker = true, speakers } = body;

    if (!text || text.trim().length === 0) {
      return NextResponse.json(
        { error: "Text is required" },
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

    // Configure speech settings
    let speechConfig: Record<string, unknown> = {};
    
    if (isSingleSpeaker || !speakers) {
      // Single speaker mode
      speechConfig = {
        voiceConfig: {
          prebuiltVoiceConfig: {
            voiceName: voice
          }
        }
      };
    } else {
      // Multi-speaker mode
      speechConfig = {
        multiSpeakerVoiceConfig: {
          speakerVoiceConfigs: speakers.map(s => ({
            speaker: s.speaker,
            voiceConfig: {
              prebuiltVoiceConfig: {
                voiceName: s.voice
              }
            }
          }))
        }
      };
    }

    const config = {
      temperature: 1,
      responseModalities: ['audio'],
      speechConfig,
    };

    const model = 'gemini-2.5-pro-preview-tts';
    const contents = [
      {
        role: 'user',
        parts: [
          {
            text: text,
          },
        ],
      },
    ];

    console.log("Generating audio with config:", JSON.stringify(config, null, 2));

    const response = await ai.models.generateContentStream({
      model,
      config,
      contents,
    });

    const audioBuffers: Buffer[] = [];
    let mimeType = '';

    for await (const chunk of response) {
      if (!chunk.candidates || !chunk.candidates[0].content || !chunk.candidates[0].content.parts) {
        continue;
      }
      
      if (chunk.candidates?.[0]?.content?.parts?.[0]?.inlineData) {
        const inlineData = chunk.candidates[0].content.parts[0].inlineData;
        mimeType = inlineData.mimeType || 'audio/L16;rate=24000';
        
        let buffer: Buffer;
        if (mimeType.includes('wav')) {
          buffer = Buffer.from(inlineData.data || '', 'base64');
        } else {
          buffer = convertToWav(inlineData.data || '', mimeType);
        }
        
        audioBuffers.push(buffer);
      }
    }

    if (audioBuffers.length === 0) {
      return NextResponse.json(
        { error: "No audio generated" },
        { status: 500 }
      );
    }

    // Concatenate all audio buffers
    const finalAudioBuffer = Buffer.concat(audioBuffers);

    // Return the audio file
    return new NextResponse(finalAudioBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'audio/wav',
        'Content-Length': finalAudioBuffer.length.toString(),
        'Cache-Control': 'no-cache',
      },
    });

  } catch (error) {
    console.error("Audio generation error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to generate audio" },
      { status: 500 }
    );
  }
}