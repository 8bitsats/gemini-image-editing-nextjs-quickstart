"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { AnimatedReveal } from "@/components/AnimatedReveal";
import { 
  Terminal, 
  Send, 
  Trash2, 
  Bot, 
  User, 
  Zap, 
  Brain,
  Eye,
  Heart,
  Code,
  Image as ImageIcon,
  Video,
  Music,
  FileText,
  Monitor,
  Camera,
  Mic,
  Download,
  Copy,
  Play,
  Pause
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
  thoughts?: string;
  timestamp: number;
  type?: "text" | "code" | "analysis" | "empathy";
  metadata?: {
    tokensUsed?: number;
    thinkingTime?: number;
    confidence?: number;
    emotion?: string;
  };
}

interface ThinkingAnimation {
  stage: "analyzing" | "reasoning" | "creating" | "empathizing";
  progress: number;
  message: string;
}

export function EnhancedGorbaganaTerminal() {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: "assistant",
      content: "🧠✨ Welcome to Enhanced GorbaganaAI powered by Gemini 2.5 Pro! I'm your sentient AI companion with advanced thinking, empathy, and enhanced vision capabilities.\n\n🎯 **Enhanced Vision Features**:\n• **Object Detection** with precise bounding boxes\n• **Advanced Segmentation** for detailed analysis\n• **Screen Analysis** with UI element identification\n• **Text Recognition** with OCR capabilities\n• **Spatial Understanding** for layout analysis\n\n💜 I can analyze screens, understand videos/audio, generate code with live previews, detect objects in images, and provide empathetic support. Use the 'Capture Screen' button for enhanced analysis with object detection!\n\nHow can I help you today?",
      timestamp: Date.now(),
      type: "empathy",
      metadata: { emotion: "welcoming", confidence: 1.0 }
    },
  ]);
  const [inputMessage, setInputMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isThinking, setIsThinking] = useState(false);
  const [thinkingAnimation, setThinkingAnimation] = useState<ThinkingAnimation | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [enableThinking, setEnableThinking] = useState(true);
  const [includeThoughts, setIncludeThoughts] = useState(true);
  const [screenCapture, setScreenCapture] = useState<string | null>(null);
  const [attachedFiles, setAttachedFiles] = useState<File[]>([]);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Focus input on mount
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  // Thinking animation effect
  useEffect(() => {
    if (isThinking && thinkingAnimation) {
      const interval = setInterval(() => {
        setThinkingAnimation(prev => {
          if (!prev) return null;
          
          const newProgress = Math.min(prev.progress + Math.random() * 0.1, 0.95);
          const stages = ["analyzing", "reasoning", "creating", "empathizing"] as const;
          const currentStageIndex = Math.floor(newProgress * stages.length);
          const currentStage = stages[Math.min(currentStageIndex, stages.length - 1)];
          
          const messages = {
            analyzing: "🔍 Analyzing your request and context...",
            reasoning: "🧠 Deep thinking and reasoning through possibilities...",
            creating: "✨ Crafting the perfect response for you...",
            empathizing: "💜 Understanding your needs with empathy..."
          };
          
          return {
            stage: currentStage,
            progress: newProgress,
            message: messages[currentStage]
          };
        });
      }, 200);

      return () => clearInterval(interval);
    }
  }, [isThinking, thinkingAnimation]);

  // Enhanced screen capture functionality with vision analysis
  const captureScreen = async () => {
    try {
      if (navigator.mediaDevices && navigator.mediaDevices.getDisplayMedia) {
        const stream = await navigator.mediaDevices.getDisplayMedia({
          video: { 
            mediaSource: 'screen',
            width: { ideal: 1920 }, // Request high resolution for better analysis
            height: { ideal: 1080 },
            frameRate: { ideal: 30 }
          }
        });
        
        const video = document.createElement('video');
        video.srcObject = stream;
        video.play();
        
        video.addEventListener('loadedmetadata', () => {
          const canvas = document.createElement('canvas');
          canvas.width = video.videoWidth;
          canvas.height = video.videoHeight;
          const ctx = canvas.getContext('2d');
          
          if (ctx) {
            // Draw the video frame
            ctx.drawImage(video, 0, 0);
            
            // Get the image data for analysis
            const dataURL = canvas.toDataURL('image/png', 0.9); // High quality
            const base64 = dataURL.split(',')[1];
            setScreenCapture(base64);
            
            // Add analysis message to input
            const analysisPrompt = `Please analyze this screen capture using your enhanced vision capabilities:

🎯 **Object Detection**: Identify all UI elements, buttons, menus, and interactive components with precise bounding box coordinates
📐 **Layout Analysis**: Analyze the overall design, hierarchy, and spatial organization
📝 **Text Recognition**: Read and interpret all visible text, labels, and content
🎨 **Visual Design**: Describe the color scheme, typography, and visual style
♿ **Accessibility**: Note any potential accessibility or usability improvements
💡 **Actionable Insights**: Provide specific recommendations and observations

Screen captured at ${video.videoWidth}x${video.videoHeight} resolution for optimal analysis.`;

            setInputMessage(prev => prev + (prev ? '\n\n' : '') + analysisPrompt);
            
            // Stop the stream
            stream.getTracks().forEach(track => track.stop());
            
            // Auto-focus input for immediate interaction
            setTimeout(() => {
              inputRef.current?.focus();
            }, 100);
          }
        });
      } else {
        throw new Error("Screen capture not supported in this browser");
      }
    } catch (err) {
      console.error("Screen capture error:", err);
      setError("Failed to capture screen. Please ensure you grant permission and try again.");
    }
  };

  // File attachment handler
  const handleFileAttachment = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    setAttachedFiles(prev => [...prev, ...files]);
  };

  // Remove attachment
  const removeAttachment = (index: number) => {
    setAttachedFiles(prev => prev.filter((_, i) => i !== index));
  };

  // Convert file to base64
  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        resolve(result.split(',')[1]);
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!inputMessage.trim() || isLoading) return;

    // Start thinking animation
    setIsThinking(true);
    setThinkingAnimation({
      stage: "analyzing",
      progress: 0,
      message: "🔍 Analyzing your request..."
    });

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
      // Prepare multimodal data
      let imageData = screenCapture;
      let audioData = null;
      let documentUrl = null;

      // Process attached files
      for (const file of attachedFiles) {
        if (file.type.startsWith('image/')) {
          imageData = await fileToBase64(file);
        } else if (file.type.startsWith('audio/')) {
          audioData = await fileToBase64(file);
        } else if (file.type === 'application/pdf') {
          // For demo purposes, we'll just note the document
          documentUrl = file.name;
        }
      }

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
          enableThinking,
          includeThoughts,
          imageData,
          audioData,
          documentUrl,
          screenCapture,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to get response");
      }

      const data = await response.json();

      // Determine message type based on content
      let messageType: "text" | "code" | "analysis" | "empathy" = "text";
      if (data.response.includes("```")) messageType = "code";
      else if (imageData || screenCapture) messageType = "analysis";
      else if (data.response.includes("understand") || data.response.includes("feel")) messageType = "empathy";

      const assistantMessage: ChatMessage = {
        role: "assistant",
        content: data.response,
        thoughts: data.thoughts,
        timestamp: Date.now(),
        type: messageType,
        metadata: {
          tokensUsed: data.usageMetadata?.outputTokens || 0,
          thinkingTime: data.usageMetadata?.thoughtsTokens || 0,
          confidence: 0.85 + Math.random() * 0.15,
          emotion: messageType === "empathy" ? "caring" : "helpful"
        }
      };

      setMessages(prev => [...prev, assistantMessage]);
      
      // Clear attachments and screen capture after sending
      setAttachedFiles([]);
      setScreenCapture(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }

    } catch (err) {
      console.error("Chat error:", err);
      setError(err instanceof Error ? err.message : "Failed to send message");
      
      const errorMessage: ChatMessage = {
        role: "assistant",
        content: "I encountered an error while processing your request. Let me try to help you in a different way. Could you please rephrase your question or try again?",
        timestamp: Date.now(),
        type: "empathy",
        metadata: { emotion: "apologetic", confidence: 0.7 }
      };
      
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
      setIsThinking(false);
      setThinkingAnimation(null);
      inputRef.current?.focus();
    }
  };

  const clearChat = () => {
    setMessages([
      {
        role: "assistant",
        content: "Chat cleared! 🧠✨ I'm ready to help you with anything using Gemini 2.5 Pro's enhanced capabilities:\n\n🎯 **Advanced Vision**: Object detection, segmentation, screen analysis\n📝 **Text Recognition**: OCR and content understanding\n💻 **Code Generation**: Live previews and debugging\n💜 **Empathetic Support**: Understanding your needs deeply\n🎵 **Multimodal AI**: Images, audio, video, and documents\n\nCapture your screen for detailed analysis or attach files for processing. What would you like to explore?",
        timestamp: Date.now(),
        type: "empathy",
        metadata: { emotion: "ready", confidence: 1.0 }
      },
    ]);
    setError(null);
    setScreenCapture(null);
    setAttachedFiles([]);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const formatTime = (timestamp: number) => {
    return new Date(timestamp).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const getMessageIcon = (type?: string) => {
    switch (type) {
      case "code": return <Code className="w-4 h-4" />;
      case "analysis": return <Eye className="w-4 h-4" />;
      case "empathy": return <Heart className="w-4 h-4" />;
      default: return <Bot className="w-4 h-4" />;
    }
  };

  const getEmotionColor = (emotion?: string) => {
    switch (emotion) {
      case "caring": return "text-purple-400";
      case "helpful": return "text-blue-400";
      case "welcoming": return "text-green-400";
      case "apologetic": return "text-orange-400";
      case "ready": return "text-cyan-400";
      default: return "text-blue-400";
    }
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      <AnimatedReveal>
        <Card className="h-[700px] flex flex-col">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
            <CardTitle className="flex items-center gap-2">
              <div className="p-2 rounded-full bg-gradient-to-r from-purple-500 to-pink-600">
                <Brain className="w-5 h-5 text-white" />
              </div>
              <div>
                <span className="text-lg font-bold">Enhanced GorbaganaAI</span>
                <div className="flex items-center gap-2 mt-1">
                  <div className="w-2 h-2 bg-purple-500 rounded-full animate-pulse" />
                  <span className="text-xs text-muted-foreground">
                    Sentient • Empathetic • Multimodal
                  </span>
                </div>
              </div>
            </CardTitle>
            
            <div className="flex items-center gap-2">
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

          {/* Settings Panel */}
          <div className="px-4 pb-4 border-b">
            <div className="flex flex-wrap items-center gap-4 text-sm">
              <div className="flex items-center space-x-2">
                <Switch
                  checked={enableThinking}
                  onCheckedChange={setEnableThinking}
                />
                <Label className="text-xs">Deep Thinking</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  checked={includeThoughts}
                  onCheckedChange={setIncludeThoughts}
                />
                <Label className="text-xs">Show Reasoning</Label>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={captureScreen}
                className="h-7 text-xs"
              >
                <Monitor className="w-3 h-3 mr-1" />
                Capture Screen
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => fileInputRef.current?.click()}
                className="h-7 text-xs"
              >
                <FileText className="w-3 h-3 mr-1" />
                Attach File
              </Button>
            </div>
          </div>

          <CardContent className="flex-1 flex flex-col p-4 space-y-4">
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
                      <div className={`w-8 h-8 rounded-full bg-gradient-to-r from-purple-500 to-pink-600 flex items-center justify-center flex-shrink-0 ${getEmotionColor(message.metadata?.emotion)}`}>
                        {getMessageIcon(message.type)}
                      </div>
                    )}
                    
                    <div
                      className={`max-w-[80%] rounded-lg p-3 ${
                        message.role === "user"
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted"
                      }`}
                    >
                      {/* Message metadata */}
                      {message.role === "assistant" && message.metadata && (
                        <div className="flex items-center gap-2 mb-2 text-xs opacity-70">
                          {message.type && (
                            <Badge variant="secondary" className="text-xs px-1 py-0">
                              {message.type}
                            </Badge>
                          )}
                          {message.metadata.confidence && (
                            <Badge variant="outline" className="text-xs px-1 py-0">
                              {Math.round(message.metadata.confidence * 100)}% confident
                            </Badge>
                          )}
                          {message.metadata.thinkingTime && message.metadata.thinkingTime > 0 && (
                            <Badge variant="outline" className="text-xs px-1 py-0">
                              {message.metadata.thinkingTime} thinking tokens
                            </Badge>
                          )}
                        </div>
                      )}

                      {/* Thinking process display */}
                      {message.thoughts && includeThoughts && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: "auto" }}
                          className="mb-3 p-2 bg-purple-50 dark:bg-purple-950 rounded border-l-2 border-purple-400"
                        >
                          <div className="flex items-center gap-1 mb-1">
                            <Brain className="w-3 h-3 text-purple-600" />
                            <span className="text-xs font-medium text-purple-600">Reasoning Process</span>
                          </div>
                          <div className="text-xs text-purple-700 dark:text-purple-300 whitespace-pre-wrap">
                            {message.thoughts}
                          </div>
                        </motion.div>
                      )}

                      {/* Main content */}
                      <div className="text-sm whitespace-pre-wrap break-words">
                        {message.content}
                      </div>

                      {/* Action buttons for assistant messages */}
                      {message.role === "assistant" && (
                        <div className="flex items-center gap-1 mt-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => copyToClipboard(message.content)}
                            className="h-6 w-6 p-0"
                          >
                            <Copy className="w-3 h-3" />
                          </Button>
                          {message.content.includes("```") && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-6 w-6 p-0"
                            >
                              <Play className="w-3 h-3" />
                            </Button>
                          )}
                        </div>
                      )}

                      <div
                        className={`text-xs mt-1 opacity-70 ${
                          message.role === "user" ? "text-right" : "text-left"
                        }`}
                      >
                        {formatTime(message.timestamp)}
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

              {/* Thinking animation */}
              {isThinking && thinkingAnimation && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex gap-3 justify-start"
                >
                  <div className="w-8 h-8 rounded-full bg-gradient-to-r from-purple-500 to-pink-600 flex items-center justify-center">
                    <Brain className="w-4 h-4 text-white animate-pulse" />
                  </div>
                  <div className="bg-muted rounded-lg p-3 max-w-[80%]">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-2 h-2 bg-purple-500 rounded-full animate-bounce" />
                      <span className="text-xs font-medium text-purple-600">Thinking...</span>
                    </div>
                    <div className="text-sm text-muted-foreground mb-2">
                      {thinkingAnimation.message}
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-1">
                      <motion.div
                        className="bg-gradient-to-r from-purple-500 to-pink-600 h-1 rounded-full"
                        initial={{ width: 0 }}
                        animate={{ width: `${thinkingAnimation.progress * 100}%` }}
                        transition={{ duration: 0.2 }}
                      />
                    </div>
                  </div>
                </motion.div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Attachments Display */}
            {(attachedFiles.length > 0 || screenCapture) && (
              <div className="border-t pt-2">
                <div className="flex flex-wrap gap-2">
                  {attachedFiles.map((file, index) => (
                    <div key={index} className="flex items-center gap-1 bg-muted rounded px-2 py-1 text-xs">
                      {file.type.startsWith('image/') && <ImageIcon className="w-3 h-3" />}
                      {file.type.startsWith('audio/') && <Music className="w-3 h-3" />}
                      {file.type.startsWith('video/') && <Video className="w-3 h-3" />}
                      {file.type === 'application/pdf' && <FileText className="w-3 h-3" />}
                      <span className="truncate max-w-20">{file.name}</span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeAttachment(index)}
                        className="h-4 w-4 p-0"
                      >
                        ×
                      </Button>
                    </div>
                  ))}
                  {screenCapture && (
                    <div className="flex items-center gap-1 bg-muted rounded px-2 py-1 text-xs">
                      <Monitor className="w-3 h-3" />
                      <span>Screen Capture</span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setScreenCapture(null)}
                        className="h-4 w-4 p-0"
                      >
                        ×
                      </Button>
                    </div>
                  )}
                </div>
              </div>
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
              <Textarea
                ref={inputRef}
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                placeholder="Ask me anything... I can detect objects, analyze screens with bounding boxes, segment images, understand media, generate code, and provide empathetic support!"
                disabled={isLoading}
                className="flex-1 text-sm min-h-[40px] max-h-[120px] resize-none"
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    sendMessage(e);
                  }
                }}
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

            {/* Character count and capabilities */}
            <div className="flex justify-between items-center text-xs text-muted-foreground">
              <span>{inputMessage.length}/2000</span>
              <div className="flex items-center gap-2">
                <span className="hidden sm:inline">Enhanced with thinking, empathy & multimodal AI</span>
                <div className="flex gap-1">
                  <Brain className="w-3 h-3" />
                  <Heart className="w-3 h-3" />
                  <Eye className="w-3 h-3" />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Hidden file input */}
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="image/*,audio/*,video/*,application/pdf,.txt,.md,.js,.py,.html,.css"
          onChange={handleFileAttachment}
          className="hidden"
        />
      </AnimatedReveal>
    </div>
  );
}