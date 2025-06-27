"use client";

import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Mic, 
  MicOff, 
  Search, 
  Palette, 
  Globe, 
  Code, 
  Link,
  Volume2,
  VolumeX,
  Loader2,
  Copy,
  Download,
  ExternalLink
} from "lucide-react";
import { EnhancedGeminiLiveClient, LiveResponse } from "@/lib/gemini/enhancedLiveClient";
import { useToast } from "@/components/ui/use-toast";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";

interface VoiceSearchProps {
  apiKey?: string;
}

export function VoiceSearch({ apiKey }: VoiceSearchProps) {
  const [isListening, setIsListening] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [results, setResults] = useState<LiveResponse[]>([]);
  const [searchType, setSearchType] = useState<"search" | "art" | "code">("search");
  const [urlInput, setUrlInput] = useState("");
  const [urls, setUrls] = useState<string[]>([]);
  const [textInput, setTextInput] = useState("");
  const [isTextMode, setIsTextMode] = useState(false);
  const [currentSession, setCurrentSession] = useState<any>(null);
  
  const clientRef = useRef<EnhancedGeminiLiveClient | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    const key = apiKey || process.env.NEXT_PUBLIC_GOOGLE_GENERATIVE_AI_API_KEY;
    if (key) {
      clientRef.current = new EnhancedGeminiLiveClient(key);
    }
  }, [apiKey]);

  const startVoiceCapture = async () => {
    if (!clientRef.current) {
      toast({
        title: "Error",
        description: "API key not configured",
        variant: "destructive",
      });
      return;
    }

    setIsProcessing(true);
    setResults([]);

    try {
      if (searchType === "search") {
        await clientRef.current.startVoiceSearch({
          onListening: setIsListening,
          onResults: (responses) => {
            setResults(responses);
            setIsProcessing(false);
          },
          onError: (error) => {
            toast({
              title: "Voice Search Error",
              description: error.message,
              variant: "destructive",
            });
            setIsProcessing(false);
          }
        });
      } else if (searchType === "art") {
        await clientRef.current.generateArtFromVoice({
          onListening: setIsListening,
          onResults: (responses) => {
            setResults(responses);
            setIsProcessing(false);
            // Trigger image generation after getting the prompt
            generateImageFromVoiceResult(responses);
          },
          onError: (error) => {
            toast({
              title: "Voice Art Error",
              description: error.message,
              variant: "destructive",
            });
            setIsProcessing(false);
          }
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to start voice capture",
        variant: "destructive",
      });
      setIsProcessing(false);
    }
  };

  const generateImageFromVoiceResult = async (responses: LiveResponse[]) => {
    const textContent = responses.filter(r => r.text).map(r => r.text).join(' ');
    if (textContent) {
      try {
        // Call image generation API
        const response = await fetch('/api/image', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            prompt: textContent,
            aspectRatio: '1:1'
          })
        });

        if (response.ok) {
          const data = await response.json();
          const imageResponse: LiveResponse = {
            text: "Generated image from voice prompt",
            imageUrl: data.imageUrl
          };
          setResults(prev => [...prev, imageResponse]);
        }
      } catch (error) {
        console.error("Image generation error:", error);
      }
    }
  };

  const handleTextSearch = async () => {
    if (!clientRef.current || !textInput.trim()) return;

    setIsProcessing(true);
    setResults([]);

    try {
      let responses: LiveResponse[] = [];

      if (searchType === "search") {
        responses = await clientRef.current.enhancedSearch(textInput, {
          useSearch: true,
          useCode: true,
          useUrls: urls.length > 0,
          urls: urls
        });
      } else if (searchType === "code") {
        await clientRef.current.createSession({ 
          useCodeExecution: true, 
          useGoogleSearch: true 
        });
        responses = await clientRef.current.sendMessage(
          `Please help with this code-related query: ${textInput}`, 
          { waitForComplete: true }
        );
      } else if (searchType === "art") {
        // Generate image directly from text
        try {
          const response = await fetch('/api/image', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              prompt: textInput,
              aspectRatio: '1:1'
            })
          });

          if (response.ok) {
            const data = await response.json();
            responses = [{
              text: `Generated image for: "${textInput}"`,
              imageUrl: data.imageUrl
            }];
          }
        } catch (error) {
          console.error("Image generation error:", error);
        }
      }

      setResults(responses);
    } catch (error) {
      toast({
        title: "Search Error",
        description: error instanceof Error ? error.message : "Search failed",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const addUrl = () => {
    if (urlInput.trim() && !urls.includes(urlInput.trim())) {
      setUrls([...urls, urlInput.trim()]);
      setUrlInput("");
    }
  };

  const removeUrl = (index: number) => {
    setUrls(urls.filter((_, i) => i !== index));
  };

  const copyResult = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied",
      description: "Result copied to clipboard",
    });
  };

  const downloadResult = (content: string, filename: string) => {
    const blob = new Blob([content], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <Card className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Enhanced Voice & Search</h3>
        <div className="flex gap-2">
          <Button
            variant={isTextMode ? "default" : "outline"}
            size="sm"
            onClick={() => setIsTextMode(!isTextMode)}
          >
            {isTextMode ? "Text Mode" : "Voice Mode"}
          </Button>
        </div>
      </div>

      {/* Search Type Tabs */}
      <Tabs value={searchType} onValueChange={(value) => setSearchType(value as any)}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="search" className="flex items-center gap-2">
            <Search className="w-4 h-4" />
            Search
          </TabsTrigger>
          <TabsTrigger value="art" className="flex items-center gap-2">
            <Palette className="w-4 h-4" />
            Art
          </TabsTrigger>
          <TabsTrigger value="code" className="flex items-center gap-2">
            <Code className="w-4 h-4" />
            Code
          </TabsTrigger>
        </TabsList>

        <TabsContent value="search" className="space-y-4">
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Search the web with Google, analyze URLs, and get grounded responses
            </p>
            
            {/* URL Context */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Add URLs for context (optional)</label>
              <div className="flex gap-2">
                <Input
                  placeholder="https://example.com"
                  value={urlInput}
                  onChange={(e) => setUrlInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && addUrl()}
                />
                <Button onClick={addUrl} size="sm">
                  <Link className="w-4 h-4" />
                </Button>
              </div>
              {urls.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {urls.map((url, index) => (
                    <Badge key={index} variant="secondary" className="flex items-center gap-1">
                      {new URL(url).hostname}
                      <button onClick={() => removeUrl(index)} className="ml-1">×</button>
                    </Badge>
                  ))}
                </div>
              )}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="art" className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Describe artwork with your voice or text, and generate images
          </p>
        </TabsContent>

        <TabsContent value="code" className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Ask coding questions, get code examples, and execute code live
          </p>
        </TabsContent>
      </Tabs>

      {/* Input Methods */}
      <div className="space-y-4">
        {isTextMode ? (
          <div className="space-y-4">
            <Textarea
              placeholder={`Enter your ${searchType} query here...`}
              value={textInput}
              onChange={(e) => setTextInput(e.target.value)}
              className="min-h-[100px]"
            />
            <Button
              onClick={handleTextSearch}
              disabled={isProcessing || !textInput.trim()}
              className="w-full"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <Search className="mr-2 h-4 w-4" />
                  Search
                </>
              )}
            </Button>
          </div>
        ) : (
          <div className="flex flex-col items-center space-y-4">
            <Button
              onClick={startVoiceCapture}
              disabled={isListening || isProcessing}
              size="lg"
              className={`w-20 h-20 rounded-full ${
                isListening 
                  ? "bg-red-500 hover:bg-red-600 animate-pulse" 
                  : "bg-primary hover:bg-primary/90"
              }`}
            >
              {isListening ? (
                <MicOff className="w-8 h-8" />
              ) : (
                <Mic className="w-8 h-8" />
              )}
            </Button>
            
            <div className="text-center">
              {isListening && (
                <p className="text-sm text-muted-foreground animate-pulse">
                  Listening... Speak now
                </p>
              )}
              {isProcessing && (
                <p className="text-sm text-muted-foreground">
                  Processing your request...
                </p>
              )}
              {!isListening && !isProcessing && (
                <p className="text-sm text-muted-foreground">
                  Click to start {searchType === "art" ? "art generation" : searchType}
                </p>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Results */}
      {results.length > 0 && (
        <div className="space-y-4">
          <h4 className="font-medium">Results</h4>
          <ScrollArea className="h-[400px] w-full rounded-md border p-4">
            <div className="space-y-4">
              {results.map((result, index) => (
                <Card key={index} className="p-4 space-y-3">
                  {result.text && (
                    <div>
                      <div className="flex justify-between items-start mb-2">
                        <Badge variant="outline">Response</Badge>
                        <div className="flex gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => copyResult(result.text!)}
                          >
                            <Copy className="w-3 h-3" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => downloadResult(result.text!, `response-${index}.txt`)}
                          >
                            <Download className="w-3 h-3" />
                          </Button>
                        </div>
                      </div>
                      <p className="text-sm whitespace-pre-wrap">{result.text}</p>
                    </div>
                  )}

                  {result.code && (
                    <div>
                      <div className="flex justify-between items-start mb-2">
                        <Badge variant="outline">Code</Badge>
                        <div className="flex gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => copyResult(result.code!)}
                          >
                            <Copy className="w-3 h-3" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => downloadResult(result.code!, `code-${index}.py`)}
                          >
                            <Download className="w-3 h-3" />
                          </Button>
                        </div>
                      </div>
                      <pre className="text-xs bg-muted p-3 rounded overflow-x-auto">
                        <code>{result.code}</code>
                      </pre>
                    </div>
                  )}

                  {result.codeOutput && (
                    <div>
                      <Badge variant="outline">Output</Badge>
                      <pre className="text-xs bg-muted p-3 rounded mt-2 overflow-x-auto">
                        {result.codeOutput}
                      </pre>
                    </div>
                  )}

                  {result.imageUrl && (
                    <div>
                      <Badge variant="outline">Generated Image</Badge>
                      <div className="mt-2">
                        <img 
                          src={result.imageUrl} 
                          alt="Generated artwork"
                          className="max-w-full h-auto rounded-lg"
                        />
                      </div>
                    </div>
                  )}

                  {result.urlContextMetadata && (
                    <div>
                      <Badge variant="outline">Sources</Badge>
                      <div className="mt-2 space-y-1">
                        {result.urlContextMetadata.url_metadata?.map((meta: any, i: number) => (
                          <a
                            key={i}
                            href={meta.retrieved_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1 text-xs text-blue-600 hover:underline"
                          >
                            <ExternalLink className="w-3 h-3" />
                            {new URL(meta.retrieved_url).hostname}
                          </a>
                        ))}
                      </div>
                    </div>
                  )}
                </Card>
              ))}
            </div>
          </ScrollArea>
        </div>
      )}
    </Card>
  );
}