"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Play, Download, Copy, Loader2 } from "lucide-react";
import { GeminiLiveCodeExecution, CodeExecutionResult } from "@/lib/gemini/liveCodeExecution";
import { useToast } from "@/components/ui/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";

interface CodeExecutorProps {
  apiKey?: string;
}

export function CodeExecutor({ apiKey }: CodeExecutorProps) {
  const [prompt, setPrompt] = useState("");
  const [isExecuting, setIsExecuting] = useState(false);
  const [results, setResults] = useState<CodeExecutionResult[]>([]);
  const [code, setCode] = useState("");
  const [output, setOutput] = useState("");
  const { toast } = useToast();

  const executeCode = async () => {
    if (!prompt.trim()) {
      toast({
        title: "Error",
        description: "Please enter a prompt",
        variant: "destructive",
      });
      return;
    }

    const key = apiKey || process.env.NEXT_PUBLIC_GOOGLE_GENERATIVE_AI_API_KEY;
    if (!key) {
      toast({
        title: "Error",
        description: "API key not configured",
        variant: "destructive",
      });
      return;
    }

    setIsExecuting(true);
    setResults([]);
    setCode("");
    setOutput("");

    try {
      const executor = new GeminiLiveCodeExecution(key);
      
      const executionResults = await executor.executeCode({
        prompt,
        onUpdate: (result) => {
          setResults(prev => [...prev, result]);
          if (result.code) {
            setCode(prev => prev + (prev ? "\n\n" : "") + result.code);
          }
          if (result.output) {
            setOutput(prev => prev + (prev ? "\n" : "") + result.output);
          }
        },
        onComplete: (finalResults) => {
          const allCode = GeminiLiveCodeExecution.extractCode(finalResults);
          const allOutput = GeminiLiveCodeExecution.extractOutput(finalResults);
          setCode(allCode);
          setOutput(allOutput);
        },
        onError: (error) => {
          toast({
            title: "Execution Error",
            description: error.message,
            variant: "destructive",
          });
        },
      });

      toast({
        title: "Success",
        description: "Code executed successfully",
      });
    } catch (error) {
      console.error("Code execution error:", error);
    } finally {
      setIsExecuting(false);
    }
  };

  const downloadCode = () => {
    if (!code) {
      toast({
        title: "No code to download",
        description: "Execute a prompt first to generate code",
        variant: "destructive",
      });
      return;
    }

    const blob = new Blob([code], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `gemini-code-${Date.now()}.py`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    toast({
      title: "Downloaded",
      description: "Code downloaded successfully",
    });
  };

  const copyCode = () => {
    if (!code) return;
    
    navigator.clipboard.writeText(code);
    toast({
      title: "Copied",
      description: "Code copied to clipboard",
    });
  };

  return (
    <Card className="p-6 space-y-4">
      <div>
        <h3 className="text-lg font-semibold mb-2">Gemini Code Executor</h3>
        <p className="text-sm text-muted-foreground mb-4">
          Enter a prompt to generate and execute code using Gemini Live API
        </p>
      </div>

      <div className="space-y-4">
        <Textarea
          placeholder="Enter your prompt (e.g., 'Compute the largest prime palindrome under 100000')"
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          className="min-h-[100px]"
        />

        <div className="flex gap-2">
          <Button
            onClick={executeCode}
            disabled={isExecuting || !prompt.trim()}
            className="flex-1"
          >
            {isExecuting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Executing...
              </>
            ) : (
              <>
                <Play className="mr-2 h-4 w-4" />
                Execute
              </>
            )}
          </Button>
        </div>
      </div>

      {(code || output || results.length > 0) && (
        <Tabs defaultValue="code" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="code">Code</TabsTrigger>
            <TabsTrigger value="output">Output</TabsTrigger>
            <TabsTrigger value="conversation">Conversation</TabsTrigger>
          </TabsList>

          <TabsContent value="code" className="space-y-2">
            <div className="flex justify-between items-center">
              <h4 className="text-sm font-medium">Generated Code</h4>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={copyCode}
                  disabled={!code}
                >
                  <Copy className="h-4 w-4 mr-1" />
                  Copy
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={downloadCode}
                  disabled={!code}
                >
                  <Download className="h-4 w-4 mr-1" />
                  Download
                </Button>
              </div>
            </div>
            <ScrollArea className="h-[400px] w-full rounded-md border p-4">
              <pre className="text-sm">
                <code>{code || "No code generated yet"}</code>
              </pre>
            </ScrollArea>
          </TabsContent>

          <TabsContent value="output" className="space-y-2">
            <h4 className="text-sm font-medium">Execution Output</h4>
            <ScrollArea className="h-[400px] w-full rounded-md border p-4">
              <pre className="text-sm whitespace-pre-wrap">
                {output || "No output yet"}
              </pre>
            </ScrollArea>
          </TabsContent>

          <TabsContent value="conversation" className="space-y-2">
            <h4 className="text-sm font-medium">Full Conversation</h4>
            <ScrollArea className="h-[400px] w-full rounded-md border p-4">
              <div className="space-y-4">
                {results.map((result, index) => (
                  <div key={index} className="space-y-2">
                    {result.text && (
                      <div className="text-sm">
                        <span className="font-medium text-muted-foreground">Text:</span>
                        <p className="mt-1">{result.text}</p>
                      </div>
                    )}
                    {result.code && (
                      <div className="text-sm">
                        <span className="font-medium text-muted-foreground">Code:</span>
                        <pre className="mt-1 p-2 bg-muted rounded text-xs overflow-x-auto">
                          <code>{result.code}</code>
                        </pre>
                      </div>
                    )}
                    {result.output && (
                      <div className="text-sm">
                        <span className="font-medium text-muted-foreground">Output:</span>
                        <pre className="mt-1 p-2 bg-muted rounded text-xs">
                          {result.output}
                        </pre>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </ScrollArea>
          </TabsContent>
        </Tabs>
      )}
    </Card>
  );
}