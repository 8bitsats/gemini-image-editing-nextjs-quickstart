"use client";

import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { AnimatedReveal } from "@/components/AnimatedReveal";
import { MobileLoadingAnimation } from "@/components/LoadingAnimation";
import { 
  Code, 
  Play, 
  Download, 
  Copy, 
  RotateCcw, 
  Wand2,
  Eye,
  FileText,
  Monitor,
  Palette,
  Zap,
  Brain,
  CheckCircle,
  AlertCircle,
  ExternalLink
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface CodeRequest {
  prompt: string;
  language: string;
  framework?: string;
  complexity: "simple" | "intermediate" | "advanced";
  includeComments: boolean;
  includeTests: boolean;
  optimizePerformance: boolean;
}

interface GeneratedCode {
  code: string;
  language: string;
  framework?: string;
  explanation: string;
  fileName: string;
  dependencies?: string[];
  livePreviewUrl?: string;
  errors?: string[];
  suggestions?: string[];
}

export function CodeGeneration() {
  const [prompt, setPrompt] = useState("");
  const [selectedLanguage, setSelectedLanguage] = useState("javascript");
  const [selectedFramework, setSelectedFramework] = useState("");
  const [complexity, setComplexity] = useState<"simple" | "intermediate" | "advanced">("intermediate");
  const [includeComments, setIncludeComments] = useState(true);
  const [includeTests, setIncludeTests] = useState(false);
  const [optimizePerformance, setOptimizePerformance] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedCode, setGeneratedCode] = useState<GeneratedCode | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("code");
  const [livePreview, setLivePreview] = useState("");
  
  const codeRef = useRef<HTMLPreElement>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  // Language and framework options
  const languages = [
    { value: "javascript", label: "JavaScript" },
    { value: "typescript", label: "TypeScript" },
    { value: "python", label: "Python" },
    { value: "rust", label: "Rust" },
    { value: "solidity", label: "Solidity" },
    { value: "html", label: "HTML" },
    { value: "css", label: "CSS" },
    { value: "react", label: "React" },
    { value: "vue", label: "Vue.js" },
    { value: "svelte", label: "Svelte" },
    { value: "p5js", label: "P5.js" },
    { value: "threejs", label: "Three.js" },
  ];

  const frameworks = {
    javascript: ["Node.js", "Express", "Socket.io", "D3.js"],
    typescript: ["Next.js", "NestJS", "Angular", "Deno"],
    python: ["FastAPI", "Django", "Flask", "NumPy", "Pandas"],
    rust: ["Anchor (Solana)", "Warp", "Actix", "Tokio"],
    solidity: ["Hardhat", "Truffle", "OpenZeppelin", "Foundry"],
    html: ["Bootstrap", "Tailwind CSS", "Bulma"],
    css: ["SCSS", "Tailwind", "Styled Components"],
    react: ["Next.js", "Gatsby", "Vite", "Create React App"],
    vue: ["Nuxt.js", "Quasar", "Vue CLI"],
    svelte: ["SvelteKit", "Vite"],
    p5js: ["P5.js Editor", "OpenProcessing"],
    threejs: ["React Three Fiber", "A-Frame", "Babylon.js"],
  };

  // Example prompts for different types of projects
  const examplePrompts = [
    "Create a React component for a crypto wallet balance display",
    "Build a Solana smart contract for NFT minting",
    "Make a P5.js sketch that generates beautiful geometric patterns",
    "Create a Python script for blockchain data analysis",
    "Build a responsive HTML/CSS landing page for a DeFi protocol",
    "Create a Three.js 3D visualization of token trading volumes",
    "Build a TypeScript API for managing user authentication",
    "Create a Vue.js component for real-time price tracking",
  ];

  // Syntax highlighting for different languages
  const highlightCode = (code: string, language: string) => {
    // This is a simplified syntax highlighter
    // In a real implementation, you'd use a library like Prism.js or Monaco Editor
    let highlightedCode = code
      .replace(/(\b(?:function|const|let|var|if|else|for|while|return|import|export|class|interface|type)\b)/g, '<span class="text-blue-400 font-semibold">$1</span>')
      .replace(/(\b(?:true|false|null|undefined)\b)/g, '<span class="text-orange-400">$1</span>')
      .replace(/(\/\/.*$)/gm, '<span class="text-gray-400 italic">$1</span>')
      .replace(/(".*?")/g, '<span class="text-green-400">$1</span>')
      .replace(/('.*?')/g, '<span class="text-green-400">$1</span>')
      .replace(/(\d+)/g, '<span class="text-purple-400">$1</span>');
    
    return { __html: highlightedCode };
  };

  // Generate live preview for web technologies
  const generateLivePreview = (code: string, language: string) => {
    if (language === "html" || language === "react" || language === "p5js") {
      let previewHTML = "";
      
      if (language === "html") {
        previewHTML = code;
      } else if (language === "p5js") {
        previewHTML = `
          <!DOCTYPE html>
          <html>
          <head>
            <script src="https://cdnjs.cloudflare.com/ajax/libs/p5.js/1.4.0/p5.min.js"></script>
            <style>body { margin: 0; padding: 20px; background: #f0f0f0; }</style>
          </head>
          <body>
            <script>
              ${code}
            </script>
          </body>
          </html>
        `;
      } else if (language === "react") {
        previewHTML = `
          <!DOCTYPE html>
          <html>
          <head>
            <script crossorigin src="https://unpkg.com/react@18/umd/react.development.js"></script>
            <script crossorigin src="https://unpkg.com/react-dom@18/umd/react-dom.development.js"></script>
            <script src="https://unpkg.com/@babel/standalone/babel.min.js"></script>
            <style>body { margin: 0; padding: 20px; font-family: Arial, sans-serif; }</style>
          </head>
          <body>
            <div id="root"></div>
            <script type="text/babel">
              ${code}
              ReactDOM.render(React.createElement(App), document.getElementById('root'));
            </script>
          </body>
          </html>
        `;
      }
      
      return previewHTML;
    }
    return null;
  };

  const generateCode = async () => {
    if (!prompt.trim()) {
      setError("Please enter a code generation prompt");
      return;
    }

    setIsGenerating(true);
    setError(null);
    setGeneratedCode(null);

    try {
      const response = await fetch("/api/chat-enhanced", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: `Generate ${selectedLanguage} code for: ${prompt}
          
          Requirements:
          - Language: ${selectedLanguage}
          - Framework: ${selectedFramework || "None specified"}
          - Complexity: ${complexity}
          - Include comments: ${includeComments}
          - Include tests: ${includeTests}
          - Optimize performance: ${optimizePerformance}
          
          Please provide:
          1. Complete, working code
          2. Clear explanation of how it works
          3. Suggested file name
          4. Any dependencies needed
          5. Best practices and suggestions for improvement
          
          Format the response with the code in markdown code blocks.`,
          enableThinking: true,
          includeThoughts: true,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to generate code");
      }

      const data = await response.json();
      
      // Extract code blocks from the response
      const codeBlockRegex = /```(\w+)?\n([\s\S]*?)```/g;
      let match;
      let extractedCode = "";
      let detectedLanguage = selectedLanguage;
      
      while ((match = codeBlockRegex.exec(data.response)) !== null) {
        if (match[1]) detectedLanguage = match[1];
        extractedCode += match[2] + "\n";
      }
      
      if (!extractedCode) {
        extractedCode = data.response; // Fallback to full response if no code blocks found
      }

      const fileName = `gorbagana-${selectedLanguage}-${Date.now()}.${getFileExtension(detectedLanguage)}`;
      
      const codeResult: GeneratedCode = {
        code: extractedCode.trim(),
        language: detectedLanguage,
        framework: selectedFramework,
        explanation: data.response,
        fileName,
        dependencies: extractDependencies(data.response),
        suggestions: extractSuggestions(data.response),
      };

      // Generate live preview if applicable
      const preview = generateLivePreview(codeResult.code, detectedLanguage);
      if (preview) {
        const blob = new Blob([preview], { type: 'text/html' });
        codeResult.livePreviewUrl = URL.createObjectURL(blob);
        setLivePreview(preview);
      }

      setGeneratedCode(codeResult);
      setActiveTab("code");

    } catch (err) {
      console.error("Code generation error:", err);
      setError(err instanceof Error ? err.message : "Failed to generate code");
    } finally {
      setIsGenerating(false);
    }
  };

  const getFileExtension = (language: string) => {
    const extensions: { [key: string]: string } = {
      javascript: "js",
      typescript: "ts",
      python: "py",
      rust: "rs",
      solidity: "sol",
      html: "html",
      css: "css",
      react: "jsx",
      vue: "vue",
      svelte: "svelte",
      p5js: "js",
      threejs: "js",
    };
    return extensions[language] || "txt";
  };

  const extractDependencies = (response: string): string[] => {
    const dependencies: string[] = [];
    const patterns = [
      /npm install ([\w\s@/-]+)/g,
      /yarn add ([\w\s@/-]+)/g,
      /import .* from ['"](.+)['"]/g,
      /require\(['"](.+)['"]\)/g,
    ];
    
    patterns.forEach(pattern => {
      let match;
      while ((match = pattern.exec(response)) !== null) {
        dependencies.push(match[1].trim());
      }
    });
    
    return [...new Set(dependencies)];
  };

  const extractSuggestions = (response: string): string[] => {
    const suggestions: string[] = [];
    const lines = response.split('\n');
    
    lines.forEach(line => {
      if (line.includes('suggestion') || line.includes('recommend') || line.includes('best practice')) {
        suggestions.push(line.trim());
      }
    });
    
    return suggestions.slice(0, 5); // Limit to 5 suggestions
  };

  const copyCode = () => {
    if (generatedCode) {
      navigator.clipboard.writeText(generatedCode.code);
    }
  };

  const downloadCode = () => {
    if (generatedCode) {
      const blob = new Blob([generatedCode.code], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = generatedCode.fileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }
  };

  const resetGeneration = () => {
    setPrompt("");
    setGeneratedCode(null);
    setError(null);
    setLivePreview("");
    setActiveTab("code");
  };

  // Update live preview when iframe is ready
  useEffect(() => {
    if (livePreview && iframeRef.current) {
      const iframe = iframeRef.current;
      iframe.onload = () => {
        const doc = iframe.contentDocument || iframe.contentWindow?.document;
        if (doc) {
          doc.open();
          doc.write(livePreview);
          doc.close();
        }
      };
    }
  }, [livePreview]);

  return (
    <div className="space-y-6">
      <AnimatedReveal>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <div className="p-2 rounded-full bg-gradient-to-r from-green-500 to-blue-600">
                <Code className="w-5 h-5 text-white" />
              </div>
              <div>
                <span className="text-lg font-bold">Advanced Code Generation</span>
                <div className="flex items-center gap-2 mt-1">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                  <span className="text-xs text-muted-foreground">
                    AI-Powered • Syntax Highlighting • Live Preview
                  </span>
                </div>
              </div>
            </CardTitle>
          </CardHeader>

          <CardContent className="space-y-6">
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

            {/* Code Prompt Input */}
            <div className="space-y-2">
              <Label htmlFor="code-prompt">Code Generation Prompt</Label>
              <Textarea
                id="code-prompt"
                placeholder="Describe what you want to build... Be specific about functionality, features, and requirements."
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                disabled={isGenerating}
                rows={4}
                className="resize-none"
              />
              
              {/* Example Prompts */}
              <div className="space-y-2">
                <p className="text-xs text-muted-foreground">Try these examples:</p>
                <div className="flex flex-wrap gap-2">
                  {examplePrompts.map((example, index) => (
                    <Button
                      key={index}
                      variant="outline"
                      size="sm"
                      className="text-xs h-7 px-2"
                      onClick={() => setPrompt(example)}
                      disabled={isGenerating}
                    >
                      {example.slice(0, 40)}...
                    </Button>
                  ))}
                </div>
              </div>
            </div>

            {/* Configuration Options */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Language/Technology</Label>
                <Select
                  value={selectedLanguage}
                  onValueChange={(value) => {
                    setSelectedLanguage(value);
                    setSelectedFramework("");
                  }}
                  disabled={isGenerating}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {languages.map((lang) => (
                      <SelectItem key={lang.value} value={lang.value}>
                        {lang.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Framework (Optional)</Label>
                <Select
                  value={selectedFramework}
                  onValueChange={setSelectedFramework}
                  disabled={isGenerating || !frameworks[selectedLanguage as keyof typeof frameworks]}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select framework" />
                  </SelectTrigger>
                  <SelectContent>
                    {frameworks[selectedLanguage as keyof typeof frameworks]?.map((framework) => (
                      <SelectItem key={framework} value={framework}>
                        {framework}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Complexity Level</Label>
                <Select
                  value={complexity}
                  onValueChange={(value: "simple" | "intermediate" | "advanced") => setComplexity(value)}
                  disabled={isGenerating}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="simple">Simple</SelectItem>
                    <SelectItem value="intermediate">Intermediate</SelectItem>
                    <SelectItem value="advanced">Advanced</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Advanced Options */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 border rounded-lg">
              <div className="flex items-center space-x-2">
                <Switch
                  checked={includeComments}
                  onCheckedChange={setIncludeComments}
                  disabled={isGenerating}
                />
                <Label className="text-sm">Include Comments</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  checked={includeTests}
                  onCheckedChange={setIncludeTests}
                  disabled={isGenerating}
                />
                <Label className="text-sm">Include Tests</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  checked={optimizePerformance}
                  onCheckedChange={setOptimizePerformance}
                  disabled={isGenerating}
                />
                <Label className="text-sm">Optimize Performance</Label>
              </div>
            </div>

            {/* Generation Controls */}
            <div className="flex gap-2">
              <Button
                onClick={generateCode}
                disabled={isGenerating || !prompt.trim()}
                className="flex-1 flex items-center gap-2"
              >
                <Wand2 className="w-4 h-4" />
                {isGenerating ? "Generating Code..." : "Generate Code"}
              </Button>
              
              {(generatedCode || error) && (
                <Button
                  variant="outline"
                  onClick={resetGeneration}
                  disabled={isGenerating}
                  className="flex items-center gap-2"
                >
                  <RotateCcw className="w-4 h-4" />
                  Reset
                </Button>
              )}
            </div>

            {/* Loading Animation */}
            {isGenerating && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="py-8"
              >
                <MobileLoadingAnimation />
                <div className="text-center mt-4 space-y-2">
                  <p className="text-sm font-medium flex items-center justify-center gap-2">
                    <Brain className="w-4 h-4 animate-pulse" />
                    Generating optimized code with AI...
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Creating {selectedLanguage} code with best practices and explanations.
                  </p>
                </div>
              </motion.div>
            )}

            {/* Generated Code Display */}
            {generatedCode && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-4"
              >
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold flex items-center gap-2">
                    <CheckCircle className="w-5 h-5 text-green-500" />
                    Generated Code
                  </h3>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={copyCode}
                      className="flex items-center gap-2"
                    >
                      <Copy className="w-4 h-4" />
                      Copy
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={downloadCode}
                      className="flex items-center gap-2"
                    >
                      <Download className="w-4 h-4" />
                      Download
                    </Button>
                  </div>
                </div>

                <Tabs value={activeTab} onValueChange={setActiveTab}>
                  <TabsList className="grid w-full grid-cols-4">
                    <TabsTrigger value="code">Code</TabsTrigger>
                    <TabsTrigger value="explanation">Explanation</TabsTrigger>
                    <TabsTrigger value="preview" disabled={!generatedCode.livePreviewUrl}>
                      Live Preview
                    </TabsTrigger>
                    <TabsTrigger value="details">Details</TabsTrigger>
                  </TabsList>

                  <TabsContent value="code" className="mt-4">
                    <div className="relative">
                      <div className="flex items-center justify-between p-2 bg-muted rounded-t border">
                        <span className="text-sm font-medium">{generatedCode.fileName}</span>
                        <Badge variant="secondary">{generatedCode.language}</Badge>
                      </div>
                      <pre
                        ref={codeRef}
                        className="bg-black text-white p-4 rounded-b overflow-x-auto text-sm"
                        dangerouslySetInnerHTML={highlightCode(generatedCode.code, generatedCode.language)}
                      />
                    </div>
                  </TabsContent>

                  <TabsContent value="explanation" className="mt-4">
                    <Card>
                      <CardContent className="p-4">
                        <div className="prose prose-sm max-w-none">
                          <div className="whitespace-pre-wrap text-sm">
                            {generatedCode.explanation}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </TabsContent>

                  <TabsContent value="preview" className="mt-4">
                    {generatedCode.livePreviewUrl && (
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium">Live Preview</span>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => window.open(generatedCode.livePreviewUrl, '_blank')}
                            className="flex items-center gap-2"
                          >
                            <ExternalLink className="w-4 h-4" />
                            Open in New Tab
                          </Button>
                        </div>
                        <div className="border rounded overflow-hidden">
                          <iframe
                            ref={iframeRef}
                            width="100%"
                            height="400"
                            className="border-0"
                            title="Live Preview"
                          />
                        </div>
                      </div>
                    )}
                  </TabsContent>

                  <TabsContent value="details" className="mt-4">
                    <div className="space-y-4">
                      {generatedCode.dependencies && generatedCode.dependencies.length > 0 && (
                        <Card>
                          <CardHeader>
                            <CardTitle className="text-sm">Dependencies</CardTitle>
                          </CardHeader>
                          <CardContent>
                            <div className="flex flex-wrap gap-2">
                              {generatedCode.dependencies.map((dep, index) => (
                                <Badge key={index} variant="outline">
                                  {dep}
                                </Badge>
                              ))}
                            </div>
                          </CardContent>
                        </Card>
                      )}

                      {generatedCode.suggestions && generatedCode.suggestions.length > 0 && (
                        <Card>
                          <CardHeader>
                            <CardTitle className="text-sm">Suggestions & Best Practices</CardTitle>
                          </CardHeader>
                          <CardContent>
                            <ul className="space-y-2 text-sm">
                              {generatedCode.suggestions.map((suggestion, index) => (
                                <li key={index} className="flex items-start gap-2">
                                  <Zap className="w-4 h-4 text-yellow-500 mt-0.5 flex-shrink-0" />
                                  {suggestion}
                                </li>
                              ))}
                            </ul>
                          </CardContent>
                        </Card>
                      )}
                    </div>
                  </TabsContent>
                </Tabs>
              </motion.div>
            )}
          </CardContent>
        </Card>
      </AnimatedReveal>
    </div>
  );
}