"use client";

import { useState, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AnimatedReveal } from "@/components/AnimatedReveal";
import { MobileLoadingAnimation } from "@/components/LoadingAnimation";
import { 
  FileText, 
  Upload, 
  Link as LinkIcon, 
  Download, 
  Copy, 
  RotateCcw, 
  Zap,
  Brain,
  Eye,
  Search,
  BookOpen,
  FileSearch,
  MessageSquare,
  Lightbulb,
  CheckCircle,
  AlertCircle,
  ExternalLink,
  Trash2,
  Send
} from "lucide-react";
import { motion } from "framer-motion";

interface DocumentAnalysis {
  summary: string;
  keyPoints: string[];
  topics: string[];
  sentiment: string;
  complexity: "simple" | "intermediate" | "complex";
  wordCount: number;
  pageCount: number;
  language: string;
  extractedText?: string;
  questions?: string[];
  insights?: string[];
}

interface ProcessedDocument {
  id: string;
  name: string;
  type: "upload" | "url";
  source: string;
  analysis: DocumentAnalysis;
  timestamp: number;
  chatHistory: Array<{
    role: "user" | "assistant";
    content: string;
    timestamp: number;
  }>;
}

interface AnalysisTask {
  type: "summarize" | "extract" | "analyze" | "questions" | "chat";
  prompt?: string;
}

export function DocumentStudio() {
  const [documents, setDocuments] = useState<ProcessedDocument[]>([]);
  const [activeDocumentId, setActiveDocumentId] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [uploadMethod, setUploadMethod] = useState<"file" | "url">("file");
  const [pdfUrl, setPdfUrl] = useState("");
  const [analysisType, setAnalysisType] = useState<"summarize" | "extract" | "analyze" | "questions" | "chat">("summarize");
  const [customPrompt, setCustomPrompt] = useState("");
  const [chatMessage, setChatMessage] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("upload");
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);

  const analysisTypes = [
    { value: "summarize", label: "Summarize Document", icon: BookOpen },
    { value: "extract", label: "Extract Key Information", icon: FileSearch },
    { value: "analyze", label: "Deep Analysis", icon: Brain },
    { value: "questions", label: "Generate Questions", icon: MessageSquare },
    { value: "chat", label: "Chat with Document", icon: MessageSquare },
  ];

  const samplePrompts = {
    summarize: [
      "Provide a comprehensive summary of this document",
      "Summarize the main arguments and conclusions",
      "Create an executive summary with key takeaways",
    ],
    extract: [
      "Extract all important dates, names, and numbers",
      "List all technical specifications mentioned",
      "Extract action items and recommendations",
    ],
    analyze: [
      "Analyze the document's main themes and arguments",
      "Evaluate the credibility and bias of the content",
      "Compare different viewpoints presented in the document",
    ],
    questions: [
      "Generate study questions based on this content",
      "Create discussion questions for a team meeting",
      "Prepare interview questions based on this information",
    ],
    chat: [
      "What are the key findings in this document?",
      "Can you explain the methodology used?",
      "What are the implications of these results?",
    ],
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

  // Handle file upload
  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (file.type !== "application/pdf") {
      setError("Please upload a PDF file");
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setError("File size must be less than 10MB");
      return;
    }

    await processDocument(file, "upload", file.name);
  };

  // Process document (file or URL)
  const processDocument = async (source: File | string, type: "upload" | "url", name: string) => {
    setIsProcessing(true);
    setError(null);

    try {
      let documentData = "";
      
      if (type === "upload" && source instanceof File) {
        documentData = await fileToBase64(source);
      } else if (type === "url" && typeof source === "string") {
        documentData = source;
      }

      const response = await fetch("/api/document-process", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          type,
          data: documentData,
          url: type === "url" ? source : undefined,
          fileName: name,
          analysisType: "initial",
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to process document");
      }

      const result = await response.json();

      const newDocument: ProcessedDocument = {
        id: `doc-${Date.now()}`,
        name,
        type,
        source: type === "url" ? source as string : name,
        analysis: result.analysis,
        timestamp: Date.now(),
        chatHistory: [],
      };

      setDocuments(prev => [newDocument, ...prev]);
      setActiveDocumentId(newDocument.id);
      setActiveTab("analysis");

      // Reset form
      if (type === "upload" && fileInputRef.current) {
        fileInputRef.current.value = "";
      }
      if (type === "url") {
        setPdfUrl("");
      }

    } catch (err) {
      console.error("Document processing error:", err);
      setError(err instanceof Error ? err.message : "Failed to process document");
    } finally {
      setIsProcessing(false);
    }
  };

  // Handle URL submission
  const handleUrlSubmit = () => {
    if (!pdfUrl.trim()) {
      setError("Please enter a PDF URL");
      return;
    }

    // Basic URL validation
    try {
      const url = new URL(pdfUrl);
      if (!url.pathname.toLowerCase().endsWith('.pdf')) {
        setError("URL must point to a PDF file");
        return;
      }
    } catch {
      setError("Please enter a valid URL");
      return;
    }

    const fileName = pdfUrl.split('/').pop() || "document.pdf";
    processDocument(pdfUrl, "url", fileName);
  };

  // Perform custom analysis
  const performAnalysis = async (task: AnalysisTask) => {
    const activeDoc = documents.find(doc => doc.id === activeDocumentId);
    if (!activeDoc) return;

    setIsProcessing(true);
    setError(null);

    try {
      const response = await fetch("/api/document-analyze", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          documentId: activeDoc.id,
          documentType: activeDoc.type,
          documentSource: activeDoc.source,
          task: task.type,
          prompt: task.prompt || customPrompt,
          previousAnalysis: activeDoc.analysis,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to analyze document");
      }

      const result = await response.json();

      // Update document with new analysis results
      setDocuments(prev => prev.map(doc => 
        doc.id === activeDoc.id 
          ? { 
              ...doc, 
              analysis: { 
                ...doc.analysis, 
                ...result.analysis 
              } 
            }
          : doc
      ));

      if (task.type === "chat") {
        // Add to chat history
        const userMessage = {
          role: "user" as const,
          content: task.prompt || customPrompt,
          timestamp: Date.now(),
        };

        const assistantMessage = {
          role: "assistant" as const,
          content: result.response,
          timestamp: Date.now(),
        };

        setDocuments(prev => prev.map(doc => 
          doc.id === activeDoc.id 
            ? { 
                ...doc, 
                chatHistory: [...doc.chatHistory, userMessage, assistantMessage]
              }
            : doc
        ));

        setChatMessage("");
      }

    } catch (err) {
      console.error("Analysis error:", err);
      setError(err instanceof Error ? err.message : "Failed to analyze document");
    } finally {
      setIsProcessing(false);
    }
  };

  // Send chat message
  const sendChatMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatMessage.trim() || isProcessing) return;

    performAnalysis({
      type: "chat",
      prompt: chatMessage,
    });
  };


  // Delete document
  const deleteDocument = (docId: string) => {
    setDocuments(prev => prev.filter(doc => doc.id !== docId));
    if (activeDocumentId === docId) {
      setActiveDocumentId(null);
      setActiveTab("upload");
    }
  };

  // Get active document
  const activeDocument = documents.find(doc => doc.id === activeDocumentId);

  return (
    <div className="space-y-6">
      <AnimatedReveal>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <div className="p-2 rounded-full bg-gradient-to-r from-blue-500 to-purple-600">
                <FileText className="w-5 h-5 text-white" />
              </div>
              <div>
                <span className="text-lg font-bold">Document Studio</span>
                <div className="flex items-center gap-2 mt-1">
                  <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
                  <span className="text-xs text-muted-foreground">
                    AI-Powered PDF Analysis • Q&A • Extraction
                  </span>
                </div>
              </div>
            </CardTitle>
          </CardHeader>

          <CardContent>
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="upload">Upload</TabsTrigger>
                <TabsTrigger value="analysis" disabled={!activeDocument}>
                  Analysis
                </TabsTrigger>
                <TabsTrigger value="chat" disabled={!activeDocument}>
                  Chat
                </TabsTrigger>
                <TabsTrigger value="documents">
                  Library ({documents.length})
                </TabsTrigger>
              </TabsList>

              <TabsContent value="upload" className="space-y-6">
                {/* Error Display */}
                {error && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="p-4 bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded-lg"
                  >
                    <div className="flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 text-red-600" />
                      <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
                    </div>
                  </motion.div>
                )}

                {/* Upload Method Selection */}
                <div className="space-y-4">
                  <Label>Upload Method</Label>
                  <div className="flex gap-2">
                    <Button
                      variant={uploadMethod === "file" ? "default" : "outline"}
                      onClick={() => setUploadMethod("file")}
                      className="flex-1"
                    >
                      <Upload className="w-4 h-4 mr-2" />
                      Upload File
                    </Button>
                    <Button
                      variant={uploadMethod === "url" ? "default" : "outline"}
                      onClick={() => setUploadMethod("url")}
                      className="flex-1"
                    >
                      <LinkIcon className="w-4 h-4 mr-2" />
                      From URL
                    </Button>
                  </div>
                </div>

                {/* File Upload */}
                {uploadMethod === "file" && (
                  <div className="space-y-4">
                    <div
                      className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-8 text-center hover:border-muted-foreground/50 transition-colors cursor-pointer"
                      onClick={() => fileInputRef.current?.click()}
                    >
                      <FileText className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                      <h3 className="text-lg font-semibold mb-2">Upload PDF Document</h3>
                      <p className="text-sm text-muted-foreground mb-4">
                        Click to browse or drag and drop your PDF file here
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Supports PDF files up to 10MB
                      </p>
                    </div>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".pdf,application/pdf"
                      onChange={handleFileUpload}
                      className="hidden"
                      disabled={isProcessing}
                    />
                  </div>
                )}

                {/* URL Input */}
                {uploadMethod === "url" && (
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="pdf-url">PDF URL</Label>
                      <div className="flex gap-2">
                        <Input
                          id="pdf-url"
                          type="url"
                          placeholder="https://example.com/document.pdf"
                          value={pdfUrl}
                          onChange={(e) => setPdfUrl(e.target.value)}
                          disabled={isProcessing}
                        />
                        <Button
                          onClick={handleUrlSubmit}
                          disabled={!pdfUrl.trim() || isProcessing}
                        >
                          Load PDF
                        </Button>
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Enter a direct URL to a PDF file. The document will be downloaded and processed.
                    </p>
                  </div>
                )}

                {/* Sample Documents */}
                <div className="space-y-2">
                  <Label>Try Sample Documents</Label>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {[
                      { name: "Research Paper Sample", url: "https://arxiv.org/pdf/2301.00001.pdf" },
                      { name: "Technical Documentation", url: "https://example.com/tech-doc.pdf" },
                    ].map((sample, index) => (
                      <Button
                        key={index}
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setPdfUrl(sample.url);
                          setUploadMethod("url");
                        }}
                        disabled={isProcessing}
                        className="text-xs justify-start"
                      >
                        <ExternalLink className="w-3 h-3 mr-2" />
                        {sample.name}
                      </Button>
                    ))}
                  </div>
                </div>

                {/* Processing Animation */}
                {isProcessing && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="py-8"
                  >
                    <MobileLoadingAnimation />
                    <div className="text-center mt-4 space-y-2">
                      <p className="text-sm font-medium flex items-center justify-center gap-2">
                        <Brain className="w-4 h-4 animate-pulse" />
                        Processing document with AI...
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Analyzing content, extracting text, and generating insights.
                      </p>
                    </div>
                  </motion.div>
                )}
              </TabsContent>

              <TabsContent value="analysis" className="space-y-6">
                {activeDocument && (
                  <>
                    {/* Document Info */}
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <FileText className="w-5 h-5" />
                            <span>{activeDocument.name}</span>
                          </div>
                          <div className="flex gap-2">
                            <Badge variant="secondary">
                              {activeDocument.analysis.pageCount} pages
                            </Badge>
                            <Badge variant="outline">
                              {activeDocument.analysis.complexity}
                            </Badge>
                          </div>
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        {/* Document Summary */}
                        <div>
                          <Label className="text-sm font-medium">Summary</Label>
                          <p className="text-sm text-muted-foreground mt-1">
                            {activeDocument.analysis.summary}
                          </p>
                        </div>

                        {/* Key Points */}
                        {activeDocument.analysis.keyPoints.length > 0 && (
                          <div>
                            <Label className="text-sm font-medium">Key Points</Label>
                            <ul className="list-disc list-inside space-y-1 mt-1">
                              {activeDocument.analysis.keyPoints.map((point, index) => (
                                <li key={index} className="text-sm text-muted-foreground">
                                  {point}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}

                        {/* Topics */}
                        {activeDocument.analysis.topics.length > 0 && (
                          <div>
                            <Label className="text-sm font-medium">Topics</Label>
                            <div className="flex flex-wrap gap-1 mt-1">
                              {activeDocument.analysis.topics.map((topic, index) => (
                                <Badge key={index} variant="outline" className="text-xs">
                                  {topic}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        )}
                      </CardContent>
                    </Card>

                    {/* Custom Analysis */}
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-sm">Custom Analysis</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label>Analysis Type</Label>
                            <Select
                              value={analysisType}
                              onValueChange={(value: any) => setAnalysisType(value)}
                            >
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {analysisTypes.map((type) => (
                                  <SelectItem key={type.value} value={type.value}>
                                    <div className="flex items-center gap-2">
                                      <type.icon className="w-4 h-4" />
                                      {type.label}
                                    </div>
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        </div>

                        <div className="space-y-2">
                          <Label>Custom Prompt</Label>
                          <Textarea
                            placeholder="Enter your specific analysis request..."
                            value={customPrompt}
                            onChange={(e) => setCustomPrompt(e.target.value)}
                            rows={3}
                          />
                        </div>

                        {/* Sample Prompts */}
                        <div className="space-y-2">
                          <Label className="text-xs">Quick Prompts</Label>
                          <div className="flex flex-wrap gap-2">
                            {samplePrompts[analysisType]?.map((prompt, index) => (
                              <Button
                                key={index}
                                variant="outline"
                                size="sm"
                                onClick={() => setCustomPrompt(prompt)}
                                className="text-xs h-7"
                              >
                                {prompt.slice(0, 30)}...
                              </Button>
                            ))}
                          </div>
                        </div>

                        <Button
                          onClick={() => performAnalysis({ type: analysisType, prompt: customPrompt })}
                          disabled={isProcessing || !customPrompt.trim()}
                          className="w-full"
                        >
                          <Zap className="w-4 h-4 mr-2" />
                          Analyze Document
                        </Button>
                      </CardContent>
                    </Card>
                  </>
                )}
              </TabsContent>

              <TabsContent value="chat" className="space-y-4">
                {activeDocument && (
                  <>
                    {/* Chat Messages */}
                    <Card className="h-[400px] flex flex-col">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm flex items-center gap-2">
                          <MessageSquare className="w-4 h-4" />
                          Chat with {activeDocument.name}
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="flex-1 flex flex-col p-4">
                        <div className="flex-1 overflow-y-auto space-y-3 mb-4">
                          {activeDocument.chatHistory.length === 0 && (
                            <div className="text-center text-muted-foreground py-8">
                              <MessageSquare className="w-8 h-8 mx-auto mb-2 opacity-50" />
                              <p className="text-sm">Start a conversation about this document</p>
                            </div>
                          )}
                          
                          {activeDocument.chatHistory.map((message, index) => (
                            <div
                              key={index}
                              className={`flex gap-2 ${
                                message.role === "user" ? "justify-end" : "justify-start"
                              }`}
                            >
                              <div
                                className={`max-w-[80%] rounded-lg p-3 text-sm ${
                                  message.role === "user"
                                    ? "bg-primary text-primary-foreground"
                                    : "bg-muted"
                                }`}
                              >
                                {message.content}
                                <div className="text-xs opacity-70 mt-1">
                                  {new Date(message.timestamp).toLocaleTimeString()}
                                </div>
                              </div>
                            </div>
                          ))}
                          <div ref={chatEndRef} />
                        </div>

                        <form onSubmit={sendChatMessage} className="flex gap-2">
                          <Input
                            value={chatMessage}
                            onChange={(e) => setChatMessage(e.target.value)}
                            placeholder="Ask anything about this document..."
                            disabled={isProcessing}
                          />
                          <Button
                            type="submit"
                            disabled={!chatMessage.trim() || isProcessing}
                            size="icon"
                          >
                            <Send className="w-4 h-4" />
                          </Button>
                        </form>
                      </CardContent>
                    </Card>
                  </>
                )}
              </TabsContent>

              <TabsContent value="documents" className="space-y-4">
                {documents.length === 0 && (
                  <div className="text-center py-8">
                    <FileText className="w-12 h-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                    <h3 className="text-lg font-semibold mb-2">No Documents Yet</h3>
                    <p className="text-sm text-muted-foreground">
                      Upload your first PDF to get started with AI-powered document analysis.
                    </p>
                  </div>
                )}

                <div className="grid gap-4">
                  {documents.map((doc) => (
                    <Card key={doc.id} className="hover:shadow-md transition-shadow">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-2">
                              <FileText className="w-4 h-4 flex-shrink-0" />
                              <span className="font-medium truncate">{doc.name}</span>
                              <Badge variant="outline" className="text-xs">
                                {doc.type}
                              </Badge>
                            </div>
                            <p className="text-sm text-muted-foreground line-clamp-2">
                              {doc.analysis.summary}
                            </p>
                            <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                              <span>{doc.analysis.pageCount} pages</span>
                              <span>{doc.analysis.wordCount.toLocaleString()} words</span>
                              <span>{new Date(doc.timestamp).toLocaleDateString()}</span>
                            </div>
                          </div>
                          <div className="flex gap-2 ml-4">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setActiveDocumentId(doc.id);
                                setActiveTab("analysis");
                              }}
                            >
                              Open
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => deleteDocument(doc.id)}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </AnimatedReveal>
    </div>
  );
}