import { GoogleGenAI, Modality } from '@google/genai';

export interface CodeExecutionResult {
  text?: string;
  code?: string;
  output?: string;
  error?: string;
}

export interface LiveCodeExecutionOptions {
  prompt: string;
  onUpdate?: (result: CodeExecutionResult) => void;
  onComplete?: (results: CodeExecutionResult[]) => void;
  onError?: (error: Error) => void;
}

export class GeminiLiveCodeExecution {
  private ai: GoogleGenAI;
  private model = 'gemini-live-2.5-flash-preview';
  private responseQueue: any[] = [];
  
  constructor(apiKey: string) {
    this.ai = new GoogleGenAI({ apiKey });
  }

  async executeCode(options: LiveCodeExecutionOptions): Promise<CodeExecutionResult[]> {
    const { prompt, onUpdate, onComplete, onError } = options;
    
    const tools = [{ codeExecution: {} }];
    const config = {
      responseModalities: [Modality.TEXT],
      tools: tools
    };

    try {
      const session = await this.ai.live.connect({
        model: this.model,
        callbacks: {
          onopen: () => {
            console.debug('Gemini Live session opened');
          },
          onmessage: (message) => {
            this.responseQueue.push(message);
          },
          onerror: (e) => {
            console.error('Gemini Live error:', e.message);
            onError?.(new Error(e.message));
          },
          onclose: (e) => {
            console.debug('Gemini Live session closed:', e.reason);
          },
        },
        config: config,
      });

      // Send the prompt
      session.sendClientContent({ turns: prompt });

      // Handle the response
      const results = await this.handleTurn(onUpdate);
      
      session.close();
      
      onComplete?.(results);
      return results;
      
    } catch (error) {
      const err = error instanceof Error ? error : new Error('Unknown error');
      onError?.(err);
      throw err;
    }
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

  private async handleTurn(onUpdate?: (result: CodeExecutionResult) => void): Promise<CodeExecutionResult[]> {
    const results: CodeExecutionResult[] = [];
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
          const result: CodeExecutionResult = {};
          
          if (part.text) {
            result.text = part.text;
            console.debug('Received text:', part.text);
          }
          
          if (part.executableCode) {
            result.code = part.executableCode.code;
            console.debug('Executable code:', part.executableCode.code);
          }
          
          if (part.codeExecutionResult) {
            result.output = part.codeExecutionResult.output;
            console.debug('Code execution result:', part.codeExecutionResult.output);
          }
          
          if (Object.keys(result).length > 0) {
            results.push(result);
            onUpdate?.(result);
          }
        }
      }
    }

    return results;
  }

  // Utility function to extract all code from results
  static extractCode(results: CodeExecutionResult[]): string {
    return results
      .filter(r => r.code)
      .map(r => r.code)
      .join('\n\n');
  }

  // Utility function to extract all output from results
  static extractOutput(results: CodeExecutionResult[]): string {
    return results
      .filter(r => r.output)
      .map(r => r.output)
      .join('\n');
  }
}