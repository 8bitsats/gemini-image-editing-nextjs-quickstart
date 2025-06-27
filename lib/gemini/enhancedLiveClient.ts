import { GoogleGenAI, Modality, Behavior, FunctionResponseScheduling } from '@google/genai';

export interface LiveSessionConfig {
  useGoogleSearch?: boolean;
  useCodeExecution?: boolean;
  useUrlContext?: boolean;
  responseModalities?: string[];
  customFunctions?: any[];
}

export interface LiveResponse {
  text?: string;
  code?: string;
  codeOutput?: string;
  searchResults?: string;
  imageUrl?: string;
  functionResults?: any[];
  urlContextMetadata?: any;
}

export interface VoiceSearchOptions {
  onResults?: (results: LiveResponse[]) => void;
  onError?: (error: Error) => void;
  onListening?: (isListening: boolean) => void;
}

export class EnhancedGeminiLiveClient {
  private ai: GoogleGenAI;
  private model = 'gemini-live-2.5-flash-preview';
  private responseQueue: any[] = [];
  private currentSession: any = null;
  
  constructor(apiKey: string) {
    this.ai = new GoogleGenAI({ apiKey });
  }

  async createSession(config: LiveSessionConfig = {}) {
    const tools = [];
    
    // Add Google Search if enabled
    if (config.useGoogleSearch) {
      tools.push({ googleSearch: {} });
    }
    
    // Add Code Execution if enabled
    if (config.useCodeExecution) {
      tools.push({ codeExecution: {} });
    }
    
    // Add URL Context if enabled
    if (config.useUrlContext) {
      tools.push({ urlContext: {} });
    }
    
    // Add custom functions
    if (config.customFunctions?.length) {
      tools.push({ functionDeclarations: config.customFunctions });
    }

    const sessionConfig = {
      responseModalities: config.responseModalities || [Modality.TEXT],
      tools: tools.length > 0 ? tools : undefined
    };

    this.currentSession = await this.ai.live.connect({
      model: this.model,
      callbacks: {
        onopen: () => {
          console.debug('Enhanced Gemini Live session opened');
        },
        onmessage: (message) => {
          this.responseQueue.push(message);
        },
        onerror: (e) => {
          console.error('Gemini Live error:', e.message);
        },
        onclose: (e) => {
          console.debug('Gemini Live session closed:', e.reason);
        },
      },
      config: sessionConfig,
    });

    return this.currentSession;
  }

  async sendMessage(prompt: string, options: { 
    waitForComplete?: boolean,
    onUpdate?: (response: LiveResponse) => void 
  } = {}): Promise<LiveResponse[]> {
    if (!this.currentSession) {
      throw new Error('No active session. Call createSession() first.');
    }

    this.responseQueue = []; // Clear previous responses
    this.currentSession.sendClientContent({ turns: prompt });

    if (options.waitForComplete) {
      return await this.handleTurn(options.onUpdate);
    }

    return [];
  }

  private async waitMessage(): Promise<any> {
    let done = false;
    let message = undefined;
    while (!done) {
      message = this.responseQueue.shift();
      if (message) {
        done = true;
      } else {
        await new Promise((resolve) => setTimeout(resolve, 100));
      }
    }
    return message;
  }

  private async handleTurn(onUpdate?: (response: LiveResponse) => void): Promise<LiveResponse[]> {
    const responses: LiveResponse[] = [];
    const turns = [];
    let done = false;
    
    while (!done) {
      const message = await this.waitMessage();
      turns.push(message);
      
      if (message.serverContent && message.serverContent.turnComplete) {
        done = true;
      } else if (message.toolCall) {
        done = true;
      }
    }

    for (const turn of turns) {
      if (turn.serverContent && turn.serverContent.modelTurn && turn.serverContent.modelTurn.parts) {
        for (const part of turn.serverContent.modelTurn.parts) {
          const response: LiveResponse = {};
          
          if (part.text) {
            response.text = part.text;
            console.debug('Received text:', part.text);
          }
          
          if (part.executableCode) {
            response.code = part.executableCode.code;
            console.debug('Executable code:', part.executableCode.code);
          }
          
          if (part.codeExecutionResult) {
            response.codeOutput = part.codeExecutionResult.output;
            console.debug('Code execution result:', part.codeExecutionResult.output);
          }

          if (part.functionCall) {
            console.debug('Function call:', part.functionCall);
          }

          if (part.functionResponse) {
            response.functionResults = response.functionResults || [];
            response.functionResults.push(part.functionResponse);
            console.debug('Function response:', part.functionResponse);
          }
          
          if (Object.keys(response).length > 0) {
            responses.push(response);
            onUpdate?.(response);
          }
        }
      }

      // Handle URL context metadata
      if (turn.urlContextMetadata) {
        const lastResponse = responses[responses.length - 1] || {};
        lastResponse.urlContextMetadata = turn.urlContextMetadata;
        console.debug('URL context metadata:', turn.urlContextMetadata);
      }
    }

    return responses;
  }

  // Voice search functionality
  async startVoiceSearch(options: VoiceSearchOptions = {}): Promise<void> {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      throw new Error('Speech recognition not supported in this browser');
    }

    const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
    const recognition = new SpeechRecognition();
    
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = 'en-US';

    recognition.onstart = () => {
      options.onListening?.(true);
      console.debug('Voice recognition started');
    };

    recognition.onresult = async (event: any) => {
      const transcript = event.results[0][0].transcript;
      console.debug('Voice transcript:', transcript);
      
      try {
        // Create session with Google Search enabled for voice queries
        await this.createSession({ 
          useGoogleSearch: true, 
          useCodeExecution: true,
          useUrlContext: true
        });
        
        const results = await this.sendMessage(transcript, { waitForComplete: true });
        options.onResults?.(results);
      } catch (error) {
        options.onError?.(error instanceof Error ? error : new Error('Voice search failed'));
      }
    };

    recognition.onerror = (event: any) => {
      options.onError?.(new Error(`Speech recognition error: ${event.error}`));
      options.onListening?.(false);
    };

    recognition.onend = () => {
      options.onListening?.(false);
      console.debug('Voice recognition ended');
    };

    recognition.start();
  }

  // Voice-to-art generation
  async generateArtFromVoice(options: VoiceSearchOptions = {}): Promise<void> {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      throw new Error('Speech recognition not supported in this browser');
    }

    const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
    const recognition = new SpeechRecognition();
    
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = 'en-US';

    recognition.onstart = () => {
      options.onListening?.(true);
      console.debug('Voice art generation started');
    };

    recognition.onresult = async (event: any) => {
      const transcript = event.results[0][0].transcript;
      console.debug('Voice art prompt:', transcript);
      
      try {
        // Create session for art generation
        await this.createSession({ 
          useCodeExecution: true,
          customFunctions: [this.getImageGenerationFunction()]
        });
        
        const artPrompt = `Generate an artistic image based on this description: "${transcript}". Create a detailed prompt for image generation and then call the generateImage function.`;
        const results = await this.sendMessage(artPrompt, { waitForComplete: true });
        options.onResults?.(results);
      } catch (error) {
        options.onError?.(error instanceof Error ? error : new Error('Voice art generation failed'));
      }
    };

    recognition.onerror = (event: any) => {
      options.onError?.(new Error(`Speech recognition error: ${event.error}`));
      options.onListening?.(false);
    };

    recognition.onend = () => {
      options.onListening?.(false);
      console.debug('Voice art generation ended');
    };

    recognition.start();
  }

  // Custom function for image generation
  private getImageGenerationFunction() {
    return {
      name: "generateImage",
      description: "Generate an image based on a text prompt",
      behavior: Behavior.NON_BLOCKING,
      parameters: {
        type: "object",
        properties: {
          prompt: {
            type: "string",
            description: "The text prompt for image generation"
          },
          style: {
            type: "string",
            description: "The artistic style (optional)",
            enum: ["realistic", "artistic", "abstract", "cartoon", "photographic"]
          }
        },
        required: ["prompt"]
      }
    };
  }

  // URL Context search
  async searchWithUrls(query: string, urls: string[] = []): Promise<LiveResponse[]> {
    await this.createSession({ 
      useGoogleSearch: true, 
      useUrlContext: true,
      useCodeExecution: true
    });

    let prompt = query;
    if (urls.length > 0) {
      prompt += `\n\nPlease also consider information from these URLs: ${urls.join(', ')}`;
    }

    return await this.sendMessage(prompt, { waitForComplete: true });
  }

  // Enhanced search with all tools
  async enhancedSearch(query: string, options: {
    useSearch?: boolean,
    useCode?: boolean,
    useUrls?: boolean,
    urls?: string[]
  } = {}): Promise<LiveResponse[]> {
    await this.createSession({
      useGoogleSearch: options.useSearch !== false,
      useCodeExecution: options.useCode !== false,
      useUrlContext: options.useUrls !== false
    });

    let prompt = query;
    if (options.urls && options.urls.length > 0) {
      prompt += `\n\nAdditional context from URLs: ${options.urls.join(', ')}`;
    }

    return await this.sendMessage(prompt, { waitForComplete: true });
  }

  async closeSession() {
    if (this.currentSession) {
      this.currentSession.close();
      this.currentSession = null;
    }
  }

  // Function response helpers
  async sendFunctionResponse(functionCall: any, result: any, scheduling: string = FunctionResponseScheduling.INTERRUPT) {
    if (!this.currentSession) {
      throw new Error('No active session');
    }

    const functionResponse = {
      id: functionCall.id,
      name: functionCall.name,
      response: {
        result: result,
        scheduling: scheduling
      }
    };

    this.currentSession.sendClientContent({ functionResponse });
  }
}