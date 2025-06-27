"use client";

import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AnimatedReveal } from "@/components/AnimatedReveal";
import { Badge } from "@/components/ui/badge";
import { 
  Terminal, 
  Send, 
  Trash2, 
  Bot, 
  User, 
  Zap, 
  Mic, 
  MicOff, 
  Search,
  Palette,
  Code,
  Globe,
  Link,
  Copy,
  Download,
  ExternalLink,
  Volume2,
  Settings
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { EnhancedGeminiLiveClient, LiveResponse } from "@/lib/gemini/enhancedLiveClient";
import { VoiceSearch } from "./VoiceSearch";
import { useToast } from "@/components/ui/use-toast";

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
  timestamp: number;
  type?: "text" | "code" | "image" | "search";
  metadata?: any;
}

export function EnhancedGorbaganaTerminal() {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: "assistant",
      content: "👋 Welcome to Enhanced GorbaganaAI! I now have superpowers: Google Search, Code Execution, Voice Commands, and Art Generation! What would you like to explore today?",
      timestamp: Date.now(),
    },
  ]);
  const [inputMessage, setInputMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"chat" | "voice" | "settings">("chat");
  const [isListening, setIsListening] = useState(false);
  const [liveClient, setLiveClient] = useState<EnhancedGeminiLiveClient | null>(null);
  const [useGroundedSearch, setUseGroundedSearch] = useState(true);
  const [useCodeExecution, setUseCodeExecution] = useState(true);
  const [useUrlContext, setUseUrlContext] = useState(true);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  // Initialize enhanced client
  useEffect(() => {
    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_GENERATIVE_AI_API_KEY;
    if (apiKey) {
      setLiveClient(new EnhancedGeminiLiveClient(apiKey));
    }
  }, []);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Focus input on mount
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!inputMessage.trim() || isLoading) return;

    const userMessage: ChatMessage = {
      role: "user",
      content: inputMessage.trim(),
      timestamp: Date.now(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage("");
    setIsLoading(true);
    setError(null);

    try {
      // Try enhanced live client first
      if (liveClient && (useGroundedSearch || useCodeExecution || useUrlContext)) {
        await liveClient.createSession({
          useGoogleSearch: useGroundedSearch,
          useCodeExecution: useCodeExecution,
          useUrlContext: useUrlContext
        });

        const responses = await liveClient.sendMessage(userMessage.content, { 
          waitForComplete: true,
          onUpdate: (response) => {
            // Real-time updates during processing
            console.log("Live update:", response);
          }
        });

        // Process responses
        for (const response of responses) {
          const assistantMessage: ChatMessage = {
            role: "assistant",
            content: response.text || "Processing...",
            timestamp: Date.now(),
            type: response.code ? "code" : response.imageUrl ? "image" : "text",
            metadata: {
              code: response.code,
              codeOutput: response.codeOutput,
              imageUrl: response.imageUrl,
              urlContextMetadata: response.urlContextMetadata,
              functionResults: response.functionResults
            }
          };

          setMessages(prev => [...prev, assistantMessage]);
        }

        if (responses.length === 0) {
          throw new Error("No response from enhanced client");
        }
      } else {
        // Fallback to regular chat API
        const response = await fetch("/api/chat-enhanced", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            message: userMessage.content,
            history: messages.map(msg => ({
              role: msg.role,
              content: msg.content,
            })),
            useGroundedSearch,
            useCodeExecution,
            useUrlContext
          }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || "Failed to get response");
        }

        const data = await response.json();

        const assistantMessage: ChatMessage = {
          role: "assistant",
          content: data.response,
          timestamp: Date.now(),
          type: data.type || "text",
          metadata: data.metadata
        };

        setMessages(prev => [...prev, assistantMessage]);
      }

    } catch (err) {
      console.error("Chat error:", err);
      setError(err instanceof Error ? err.message : "Failed to send message");
      
      const errorMessage: ChatMessage = {
        role: "assistant",
        content: "Sorry, I encountered an error. Please try again.",
        timestamp: Date.now(),
      };
      
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
      inputRef.current?.focus();
    }
  };

  const startVoiceCommand = async () => {
    if (!liveClient) {
      toast({
        title: "Error",
        description: "Voice features not available",
        variant: "destructive",
      });
      return;
    }

    try {
      await liveClient.startVoiceSearch({
        onListening: setIsListening,
        onResults: (responses) => {
          for (const response of responses) {
            const assistantMessage: ChatMessage = {
              role: "assistant",
              content: response.text || "Voice command processed",
              timestamp: Date.now(),
              type: response.code ? "code" : response.imageUrl ? "image" : "search",
              metadata: {
                code: response.code,
                codeOutput: response.codeOutput,
                imageUrl: response.imageUrl,
                urlContextMetadata: response.urlContextMetadata
              }
            };
            setMessages(prev => [...prev, assistantMessage]);
          }
        },
        onError: (error) => {
          toast({
            title: "Voice Error",
            description: error.message,
            variant: "destructive",
          });
        }
      });
    } catch (error) {
      toast({
        title: "Voice Error",
        description: "Failed to start voice command",
        variant: "destructive",
      });
    }
  };

  const clearChat = () => {
    setMessages([
      {
        role: "assistant",
        content: "👋 Chat cleared! I'm ready with enhanced capabilities: Google Search, Code Execution, and Voice Commands. How can I help you?",
        timestamp: Date.now(),
      },
    ]);
    setError(null);
  };

  const formatTime = (timestamp: number) => {
    return new Date(timestamp).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied",
      description: "Content copied to clipboard",
    });
  };

  const downloadContent = (content: string, filename: string) => {
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

  const quickActions = [
    { text: "Search the web for latest AI news", icon: Search },
    { text: "Generate art with voice command", icon: Palette },
    { text: "Write and execute Python code", icon: Code },
    { text: "Analyze a website URL", icon: Globe },
  ];

  const renderMessage = (message: ChatMessage) => (
    <div className="space-y-3">
      <div className="text-sm whitespace-pre-wrap break-words">
        {message.content}
      </div>

      {/* Code Block */}
      {message.metadata?.code && (
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <Badge variant="outline">Generated Code</Badge>
            <div className="flex gap-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => copyToClipboard(message.metadata.code)}
              >
                <Copy className="w-3 h-3" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => downloadContent(message.metadata.code, "code.py")}
              >
                <Download className="w-3 h-3" />
              </Button>
            </div>
          </div>
          <pre className="text-xs bg-muted p-3 rounded overflow-x-auto">
            <code>{message.metadata.code}</code>
          </pre>
        </div>
      )}

      {/* Code Output */}
      {message.metadata?.codeOutput && (
        <div className="space-y-2">
          <Badge variant="outline">Execution Output</Badge>
          <pre className="text-xs bg-muted p-3 rounded overflow-x-auto">
            {message.metadata.codeOutput}
          </pre>
        </div>
      )}

      {/* Generated Image */}
      {message.metadata?.imageUrl && (
        <div className="space-y-2">
          <Badge variant="outline">Generated Image</Badge>
          <img 
            src={message.metadata.imageUrl} 
            alt="Generated content"
            className="max-w-full h-auto rounded-lg"
          />
        </div>
      )}

      {/* URL Sources */}
      {message.metadata?.urlContextMetadata?.url_metadata && (
        <div className="space-y-2">
          <Badge variant="outline">Sources</Badge>
          <div className="space-y-1">
            {message.metadata.urlContextMetadata.url_metadata.map((meta: any, i: number) => (
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
    </div>
  );

  return (
    <div className="space-y-4 sm:space-y-6">
      <AnimatedReveal>
        <Card className="h-[700px] flex flex-col">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
            <CardTitle className="flex items-center gap-2">
              <div className="p-2 rounded-full bg-gradient-to-r from-blue-500 to-purple-600">
                <Terminal className="w-5 h-5 text-white" />
              </div>
              <div>
                <span className="text-lg font-bold">Enhanced GorbaganaAI</span>
                <div className="flex items-center gap-2 mt-1">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                  <span className="text-xs text-muted-foreground">
                    Gemini Live 2.5 Flash + Enhanced Features
                  </span>
                </div>
              </div>
            </CardTitle>
            <div className="flex gap-2">
              <Button
                variant={isListening ? "destructive" : "outline"}
                size="sm"
                onClick={startVoiceCommand}
                className="h-8"
              >
                {isListening ? <MicOff className="w-4 h-4 mr-1" /> : <Mic className="w-4 h-4 mr-1" />}
                {isListening ? "Stop" : "Voice"}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={clearChat}
                className="h-8"
              >
                <Trash2 className="w-4 h-4 mr-1" />
                Clear
              </Button>
            </div>
          </CardHeader>

          <CardContent className="flex-1 flex flex-col p-4 space-y-4">
            <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as any)}>
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="chat">Chat</TabsTrigger>
                <TabsTrigger value="voice">Voice</TabsTrigger>
                <TabsTrigger value="settings">Settings</TabsTrigger>
              </TabsList>

              <TabsContent value="chat" className="flex-1 flex flex-col space-y-4">
                {/* Messages Area */}
                <div className="flex-1 overflow-y-auto space-y-4 pr-2">
                  <AnimatePresence>
                    {messages.map((message, index) => (
                      <motion.div
                        key={index}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        transition={{ duration: 0.3 }}
                        className={`flex gap-3 ${
                          message.role === "user" ? "justify-end" : "justify-start"
                        }`}
                      >
                        {message.role === "assistant" && (
                          <div className="w-8 h-8 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center flex-shrink-0">
                            <Bot className="w-4 h-4 text-white" />
                          </div>
                        )}
                        
                        <div
                          className={`max-w-[80%] rounded-lg p-3 ${
                            message.role === "user"
                              ? "bg-primary text-primary-foreground"
                              : "bg-muted"
                          }`}
                        >
                          {renderMessage(message)}
                          <div
                            className={`text-xs mt-2 opacity-70 ${
                              message.role === "user" ? "text-right" : "text-left"
                            }`}
                          >
                            {formatTime(message.timestamp)}
                            {message.type && message.type !== "text" && (
                              <Badge variant="secondary" className="ml-2 text-xs">
                                {message.type}
                              </Badge>
                            )}
                          </div>
                        </div>

                        {message.role === "user" && (
                          <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center flex-shrink-0">
                            <User className="w-4 h-4 text-primary-foreground" />
                          </div>
                        )}
                      </motion.div>
                    ))}
                  </AnimatePresence>

                  {/* Loading indicator */}
                  {isLoading && (
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="flex gap-3 justify-start"
                    >
                      <div className="w-8 h-8 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center">
                        <Bot className="w-4 h-4 text-white" />
                      </div>
                      <div className="bg-muted rounded-lg p-3">
                        <div className="flex space-x-1">
                          <div className="w-2 h-2 bg-primary rounded-full animate-bounce" />
                          <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: "0.1s" }} />
                          <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: "0.2s" }} />
                        </div>
                      </div>
                    </motion.div>
                  )}

                  <div ref={messagesEndRef} />
                </div>

                {/* Quick Actions */}
                {messages.length === 1 && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="space-y-2"
                  >
                    <p className="text-xs text-muted-foreground">Enhanced quick actions:</p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {quickActions.map((action, index) => (
                        <Button
                          key={index}
                          variant="outline"
                          size="sm"
                          className="text-xs h-8 justify-start"
                          onClick={() => setInputMessage(action.text)}
                        >
                          <action.icon className="w-3 h-3 mr-1" />
                          {action.text}
                        </Button>
                      ))}
                    </div>
                  </motion.div>
                )}

                {/* Error Display */}
                {error && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="p-2 bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded text-xs text-red-700 dark:text-red-300"
                  >
                    {error}
                  </motion.div>
                )}

                {/* Input Area */}
                <form onSubmit={sendMessage} className="flex gap-2">
                  <Input
                    ref={inputRef}
                    value={inputMessage}
                    onChange={(e) => setInputMessage(e.target.value)}
                    placeholder="Ask anything with enhanced AI capabilities..."
                    disabled={isLoading}
                    className="flex-1 text-sm"
                    maxLength={1000}
                  />
                  <Button
                    type="submit"
                    disabled={!inputMessage.trim() || isLoading}
                    size="icon"
                    className="h-10 w-10"
                  >
                    <Send className="w-4 h-4" />
                  </Button>
                </form>

                {/* Character count */}
                <div className="text-xs text-muted-foreground text-right">
                  {inputMessage.length}/1000
                </div>
              </TabsContent>

              <TabsContent value="voice" className="flex-1">
                <VoiceSearch />
              </TabsContent>

              <TabsContent value="settings" className="space-y-4">
                <div className="space-y-4">
                  <h4 className="font-medium">Enhanced Features</h4>
                  
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="space-y-1">
                        <div className="text-sm font-medium">Google Search</div>
                        <div className="text-xs text-muted-foreground">
                          Enable web search for current information
                        </div>
                      </div>
                      <Button
                        variant={useGroundedSearch ? "default" : "outline"}
                        size="sm"
                        onClick={() => setUseGroundedSearch(!useGroundedSearch)}
                      >
                        {useGroundedSearch ? "Enabled" : "Disabled"}
                      </Button>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="space-y-1">
                        <div className="text-sm font-medium">Code Execution</div>
                        <div className="text-xs text-muted-foreground">
                          Run Python code and see results
                        </div>
                      </div>
                      <Button
                        variant={useCodeExecution ? "default" : "outline"}
                        size="sm"
                        onClick={() => setUseCodeExecution(!useCodeExecution)}
                      >
                        {useCodeExecution ? "Enabled" : "Disabled"}
                      </Button>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="space-y-1">
                        <div className="text-sm font-medium">URL Context</div>
                        <div className="text-xs text-muted-foreground">
                          Analyze content from URLs
                        </div>
                      </div>
                      <Button
                        variant={useUrlContext ? "default" : "outline"}
                        size="sm"
                        onClick={() => setUseUrlContext(!useUrlContext)}
                      >
                        {useUrlContext ? "Enabled" : "Disabled"}
                      </Button>
                    </div>
                  </div>

                  <div className="pt-4 border-t">
                    <p className="text-xs text-muted-foreground">
                      These features use the enhanced Gemini Live 2.5 Flash model with additional capabilities.
                    </p>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </AnimatedReveal>
    </div>
  );
}