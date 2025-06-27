"use client";
import { useState } from "react";
import { ImageUpload } from "@/components/ImageUpload";
import { ImagePromptInput } from "@/components/ImagePromptInput";
import { ImageResultDisplay } from "@/components/ImageResultDisplay";
import { TrashCompactor } from "@/components/TrashCompactor";
import { TextToAudio } from "@/components/TextToAudio";
import { Trash2, Palette, Mic } from "lucide-react";
import Image from "next/image";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { HistoryItem } from "@/lib/types";
import { ClientWalletButton } from "@/components/ClientWalletButton";
import { AnimatedBlurReveal } from "@/components/AnimatedBlurReveal";
import { AnimatedReveal } from "@/components/AnimatedReveal";
import { MobileLoadingAnimation } from "@/components/LoadingAnimation";
import { motion } from "framer-motion";

export default function Home() {
  const [activeTab, setActiveTab] = useState<'ai-art' | 'trash-compactor' | 'text-to-audio'>('ai-art');
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
    <main className="min-h-screen bg-background p-4 sm:p-6 md:p-8">
      {/* Mobile-optimized wallet button */}
      <div className="flex justify-end mb-2 sm:mb-4">
        <AnimatedBlurReveal delay={0.8} duration={0.6}>
          <ClientWalletButton />
        </AnimatedBlurReveal>
      </div>
      
      <div className="flex flex-col items-center justify-center">
        <Card className="w-full max-w-6xl border-0 bg-card shadow-none">
          <CardHeader className="flex flex-col items-center justify-center space-y-3 sm:space-y-4 px-4 sm:px-6">
            <AnimatedReveal delay={0} duration={0.8} type="rotate">
              <motion.div
                animate={{ 
                  rotate: [0, 5, -5, 0],
                  scale: [1, 1.05, 1]
                }}
                transition={{
                  duration: 4,
                  repeat: Infinity,
                  repeatType: "reverse",
                  ease: "easeInOut"
                }}
              >
                <Image
                  src="/gorbagana-logo.png"
                  alt="Gorbagana Logo"
                  width={120}
                  height={120}
                  className="mb-2 sm:w-[150px] sm:h-[150px]"
                />
              </motion.div>
            </AnimatedReveal>
            
            <AnimatedBlurReveal delay={0.2} duration={0.8}>
              <CardTitle className="flex flex-col items-center gap-1 sm:gap-2 text-foreground">
                <span className="text-2xl sm:text-3xl font-bold text-center">Gorbagana Google Deepmind</span>
                <span className="text-base sm:text-lg text-muted-foreground text-center">The Sentient Ledger</span>
              </CardTitle>
            </AnimatedBlurReveal>
            
            <AnimatedBlurReveal delay={0.4} duration={0.8}>
              <span className="text-xs sm:text-sm font-mono text-muted-foreground text-center">
                powered by Google DeepMind Gemini 2.0 Flash
              </span>
            </AnimatedBlurReveal>
            
            {/* Mobile-optimized Tab Navigation */}
            <AnimatedBlurReveal delay={0.6} duration={0.8}>
              <div className="flex flex-col sm:flex-row gap-2 mt-4 sm:mt-6 w-full px-2 sm:px-0">
                <Button
                  variant={activeTab === 'ai-art' ? 'default' : 'outline'}
                  onClick={() => setActiveTab('ai-art')}
                  className="flex items-center justify-center gap-2 w-full sm:w-auto py-3 sm:py-2 text-sm sm:text-base"
                >
                  <Palette className="w-4 h-4" />
                  AI Art
                </Button>
                <Button
                  variant={activeTab === 'text-to-audio' ? 'default' : 'outline'}
                  onClick={() => setActiveTab('text-to-audio')}
                  className="flex items-center justify-center gap-2 w-full sm:w-auto py-3 sm:py-2 text-sm sm:text-base"
                >
                  <Mic className="w-4 h-4" />
                  Text to Audio
                </Button>
                <Button
                  variant={activeTab === 'trash-compactor' ? 'default' : 'outline'}
                  onClick={() => setActiveTab('trash-compactor')}
                  className="flex items-center justify-center gap-2 w-full sm:w-auto py-3 sm:py-2 text-sm sm:text-base"
                >
                  <Trash2 className="w-4 h-4" />
                  Trash
                </Button>
              </div>
            </AnimatedBlurReveal>
          </CardHeader>
        <CardContent className="space-y-4 sm:space-y-6 pt-4 sm:pt-6 w-full px-4 sm:px-6">
          {activeTab === 'ai-art' ? (
            <>
              {error && (
                <AnimatedBlurReveal>
                  <div className="p-3 sm:p-4 mb-4 text-xs sm:text-sm text-red-700 bg-red-100 rounded-lg">
                    {error}
                  </div>
                </AnimatedBlurReveal>
              )}

              {!displayImage && !loading ? (
                <>
                  <AnimatedBlurReveal delay={0.1}>
                    <ImageUpload
                      onImageSelect={handleImageSelect}
                      currentImage={currentImage}
                    />
                  </AnimatedBlurReveal>
                  <AnimatedBlurReveal delay={0.3}>
                    <ImagePromptInput
                      onSubmit={handlePromptSubmit}
                      isEditing={isEditing}
                      isLoading={loading}
                    />
                  </AnimatedBlurReveal>
                </>
              ) : loading ? (
                <AnimatedReveal type="scale">
                  <MobileLoadingAnimation />
                </AnimatedReveal>
              ) : (
                <>
                  <AnimatedBlurReveal>
                    <ImageResultDisplay
                      imageUrl={displayImage || ""}
                      description={description}
                      onReset={handleReset}
                      conversationHistory={history}
                    />
                  </AnimatedBlurReveal>
                  <AnimatedBlurReveal delay={0.2}>
                    <ImagePromptInput
                      onSubmit={handlePromptSubmit}
                      isEditing={true}
                      isLoading={loading}
                    />
                  </AnimatedBlurReveal>
                </>
              )}
            </>
          ) : activeTab === 'text-to-audio' ? (
            <AnimatedBlurReveal>
              <TextToAudio />
            </AnimatedBlurReveal>
          ) : (
            <AnimatedBlurReveal>
              <TrashCompactor />
            </AnimatedBlurReveal>
          )}
        </CardContent>
      </Card>
      </div>
    </main>
  );
}
