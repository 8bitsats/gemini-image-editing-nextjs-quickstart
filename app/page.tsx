"use client";
import { useState } from "react";
import { ImageUpload } from "@/components/ImageUpload";
import { ImagePromptInput } from "@/components/ImagePromptInput";
import { ImageResultDisplay } from "@/components/ImageResultDisplay";
import { TrashCompactor } from "@/components/TrashCompactor";
import { ImageIcon, Trash2, Palette } from "lucide-react";
import Image from "next/image";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { HistoryItem } from "@/lib/types";
import { ClientWalletButton } from "@/components/ClientWalletButton";

export default function Home() {
  const [activeTab, setActiveTab] = useState<'ai-art' | 'trash-compactor'>('ai-art');
  const [image, setImage] = useState<string | null>(null);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [description, setDescription] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [history, setHistory] = useState<HistoryItem[]>([]);

  const handleImageSelect = (imageData: string) => {
    setImage(imageData || null);
  };

  const handlePromptSubmit = async (prompt: string) => {
    try {
      setLoading(true);
      setError(null);

      // If we have a generated image, use that for editing, otherwise use the uploaded image
      const imageToEdit = generatedImage || image;

      // Prepare the request data as JSON
      const requestData = {
        prompt,
        image: imageToEdit,
        history: history.length > 0 ? history : undefined,
      };

      const response = await fetch("/api/image", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to generate image");
      }

      const data = await response.json();

      if (data.image) {
        // Update the generated image and description
        setGeneratedImage(data.image);
        setDescription(data.description || null);

        // Update history locally - add user message
        const userMessage: HistoryItem = {
          role: "user",
          parts: [
            { text: prompt },
            ...(imageToEdit ? [{ image: imageToEdit }] : []),
          ],
        };

        // Add AI response
        const aiResponse: HistoryItem = {
          role: "model",
          parts: [
            ...(data.description ? [{ text: data.description }] : []),
            ...(data.image ? [{ image: data.image }] : []),
          ],
        };

        // Update history with both messages
        setHistory((prevHistory) => [...prevHistory, userMessage, aiResponse]);
      } else {
        setError("No image returned from API");
      }
    } catch (error) {
      setError(error instanceof Error ? error.message : "An error occurred");
      console.error("Error processing request:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setImage(null);
    setGeneratedImage(null);
    setDescription(null);
    setLoading(false);
    setError(null);
    setHistory([]);
  };

  // If we have a generated image, we want to edit it next time
  const currentImage = generatedImage || image;
  const isEditing = !!currentImage;

  // Get the latest image to display (always the generated image)
  const displayImage = generatedImage;

  return (
    <main className="min-h-screen bg-background p-8">
      <div className="flex justify-end mb-4">
        <ClientWalletButton />
      </div>
      <div className="flex flex-col items-center justify-center">
        <Card className="w-full max-w-6xl border-0 bg-card shadow-none">
          <CardHeader className="flex flex-col items-center justify-center space-y-4">
            <Image
              src="/gorbagana-logo.png"
              alt="Gorbagana Logo"
              width={150}
              height={150}
              className="mb-2"
            />
            <CardTitle className="flex flex-col items-center gap-2 text-foreground">
              <span className="text-3xl font-bold">Gorbagana Google Deepmind</span>
              <span className="text-lg text-muted-foreground">The Sentient Ledger</span>
            </CardTitle>
            <span className="text-sm font-mono text-muted-foreground">
              powered by Google DeepMind Gemini 2.0 Flash
            </span>
            
            {/* Tab Navigation */}
            <div className="flex gap-2 mt-6">
              <Button
                variant={activeTab === 'ai-art' ? 'default' : 'outline'}
                onClick={() => setActiveTab('ai-art')}
                className="flex items-center gap-2"
              >
                <Palette className="w-4 h-4" />
                AI Art Generator
              </Button>
              <Button
                variant={activeTab === 'trash-compactor' ? 'default' : 'outline'}
                onClick={() => setActiveTab('trash-compactor')}
                className="flex items-center gap-2"
              >
                <Trash2 className="w-4 h-4" />
                Trash Compactor
              </Button>
            </div>
          </CardHeader>
        <CardContent className="space-y-6 pt-6 w-full">
          {activeTab === 'ai-art' ? (
            <>
              {error && (
                <div className="p-4 mb-4 text-sm text-red-700 bg-red-100 rounded-lg">
                  {error}
                </div>
              )}

              {!displayImage && !loading ? (
                <>
                  <ImageUpload
                    onImageSelect={handleImageSelect}
                    currentImage={currentImage}
                  />
                  <ImagePromptInput
                    onSubmit={handlePromptSubmit}
                    isEditing={isEditing}
                    isLoading={loading}
                  />
                </>
              ) : loading ? (
                <div
                  role="status"
                  className="flex items-center mx-auto justify-center h-56 max-w-sm bg-gray-300 rounded-lg animate-pulse dark:bg-secondary"
                >
                  <ImageIcon className="w-10 h-10 text-gray-200 dark:text-muted-foreground" />
                  <span className="pl-4 font-mono font-xs text-muted-foreground">
                    Processing...
                  </span>
                </div>
              ) : (
                <>
                  <ImageResultDisplay
                    imageUrl={displayImage || ""}
                    description={description}
                    onReset={handleReset}
                    conversationHistory={history}
                  />
                  <ImagePromptInput
                    onSubmit={handlePromptSubmit}
                    isEditing={true}
                    isLoading={loading}
                  />
                </>
              )}
            </>
          ) : (
            <TrashCompactor />
          )}
        </CardContent>
      </Card>
      </div>
    </main>
  );
}
