"use client";

import { useState } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/use-toast";
import { MessageCircle, Upload, Send, Loader2 } from "lucide-react";

interface FileUpload {
  file: File;
  preview?: string;
}

export function AskTheDev() {
  const { publicKey, connected } = useWallet();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState<string>("");
  const [priority, setPriority] = useState<string>("medium");
  const [url, setUrl] = useState("");
  const [files, setFiles] = useState<FileUpload[]>([]);

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newFiles = Array.from(event.target.files || []);
    const fileUploads: FileUpload[] = newFiles.map(file => {
      const upload: FileUpload = { file };
      
      if (file.type.startsWith('image/')) {
        upload.preview = URL.createObjectURL(file);
      }
      
      return upload;
    });
    
    setFiles(prev => [...prev, ...fileUploads]);
  };

  const removeFile = (index: number) => {
    setFiles(prev => {
      const newFiles = [...prev];
      if (newFiles[index].preview) {
        URL.revokeObjectURL(newFiles[index].preview!);
      }
      newFiles.splice(index, 1);
      return newFiles;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!connected || !publicKey) {
      toast({
        title: "Wallet not connected",
        description: "Please connect your wallet to submit a request.",
        variant: "destructive",
      });
      return;
    }

    if (!title.trim() || !description.trim() || !category) {
      toast({
        title: "Missing required fields",
        description: "Please fill in title, description, and category.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const formData = new FormData();
      formData.append('title', title);
      formData.append('description', description);
      formData.append('category', category);
      formData.append('priority', priority);
      formData.append('url', url);
      formData.append('userWalletAddress', publicKey.toString());
      
      files.forEach((fileUpload, index) => {
        formData.append(`file_${index}`, fileUpload.file);
      });

      const response = await fetch('/api/ask-the-dev', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Failed to submit request');
      }

      const result = await response.json();

      toast({
        title: "Request submitted successfully!",
        description: "Your request has been sent to the developer. You'll receive a response soon.",
      });

      // Reset form
      setTitle("");
      setDescription("");
      setCategory("");
      setPriority("medium");
      setUrl("");
      setFiles([]);

    } catch (error) {
      console.error('Error submitting request:', error);
      toast({
        title: "Submission failed",
        description: "There was an error submitting your request. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!connected) {
    return (
      <Card className="w-full max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageCircle className="h-5 w-5" />
            Ask the Dev
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <p className="text-muted-foreground mb-4">
              Please connect your wallet to submit a request to the developer.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MessageCircle className="h-5 w-5" />
          Ask the Dev
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Submit questions, bug reports, feature requests, or feedback directly to the developer.
        </p>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <label htmlFor="title" className="text-sm font-medium">
              Title *
            </label>
            <Input
              id="title"
              placeholder="Brief summary of your request..."
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="category" className="text-sm font-medium">
              Category *
            </label>
            <Select value={category} onValueChange={setCategory} required>
              <SelectTrigger>
                <SelectValue placeholder="Select a category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="bug">🐛 Bug Report</SelectItem>
                <SelectItem value="feature">✨ Feature Request</SelectItem>
                <SelectItem value="question">❓ Question</SelectItem>
                <SelectItem value="feedback">💭 Feedback</SelectItem>
                <SelectItem value="other">📝 Other</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <label htmlFor="priority" className="text-sm font-medium">
              Priority
            </label>
            <Select value={priority} onValueChange={setPriority}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="low">🟢 Low</SelectItem>
                <SelectItem value="medium">🟡 Medium</SelectItem>
                <SelectItem value="high">🟠 High</SelectItem>
                <SelectItem value="urgent">🔴 Urgent</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <label htmlFor="description" className="text-sm font-medium">
              Description *
            </label>
            <Textarea
              id="description"
              placeholder="Detailed description of your request, issue, or question..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={5}
              required
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="url" className="text-sm font-medium">
              Related URL (optional)
            </label>
            <Input
              id="url"
              type="url"
              placeholder="https://example.com/relevant-page"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="files" className="text-sm font-medium">
              Attachments (optional)
            </label>
            <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-6 text-center">
              <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
              <p className="text-sm text-muted-foreground mb-2">
                Upload screenshots, logs, or other files
              </p>
              <input
                type="file"
                id="files"
                multiple
                onChange={handleFileUpload}
                className="hidden"
                accept="image/*,.txt,.log,.json,.pdf,.doc,.docx"
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => document.getElementById('files')?.click()}
              >
                Choose Files
              </Button>
            </div>
            
            {files.length > 0 && (
              <div className="space-y-2">
                {files.map((fileUpload, index) => (
                  <div key={index} className="flex items-center justify-between p-2 bg-muted rounded">
                    <div className="flex items-center gap-2">
                      {fileUpload.preview && (
                        <img 
                          src={fileUpload.preview} 
                          alt="Preview" 
                          className="w-8 h-8 object-cover rounded"
                        />
                      )}
                      <span className="text-sm">{fileUpload.file.name}</span>
                      <Badge variant="outline" className="text-xs">
                        {(fileUpload.file.size / 1024).toFixed(1)}KB
                      </Badge>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeFile(index)}
                    >
                      ✕
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="bg-muted p-4 rounded-lg">
            <p className="text-xs text-muted-foreground">
              <strong>Connected Wallet:</strong> {publicKey?.toString().slice(0, 8)}...{publicKey?.toString().slice(-8)}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              This request will be associated with your wallet address for response purposes.
            </p>
          </div>

          <Button 
            type="submit" 
            className="w-full" 
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Submitting...
              </>
            ) : (
              <>
                <Send className="h-4 w-4 mr-2" />
                Submit Request
              </>
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}