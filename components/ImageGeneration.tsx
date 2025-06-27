"use client";

import { useState } from "react";
import { ImageUpload } from "@/components/ImageUpload";
import { ImagePromptInput } from "@/components/ImagePromptInput";
import { ImageResultDisplay } from "@/components/ImageResultDisplay";
import { MobileLoadingAnimation } from "@/components/LoadingAnimation";
import { HistoryItem } from "@/lib/types";

export function ImageGeneration() {
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
    <div className="h-full p-4 space-y-4">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800 mb-2">🎨 AI Art Studio</h2>
        <p className="text-gray-600">Create and edit images with Google DeepMind Gemini 2.0</p>
      </div>

      {error && (
        <div className="p-4 mb-4 text-sm text-red-700 bg-red-100 rounded-lg">
          {error}
        </div>
      )}

      {!displayImage && !loading ? (
        <div className="space-y-6">
          <ImageUpload
            onImageSelect={handleImageSelect}
            currentImage={currentImage}
          />
          <ImagePromptInput
            onSubmit={handlePromptSubmit}
            isEditing={isEditing}
            isLoading={loading}
          />
        </div>
      ) : loading ? (
        <div className="flex items-center justify-center h-64">
          <MobileLoadingAnimation />
        </div>
      ) : (
        <div className="space-y-6">
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
        </div>
      )}
    </div>
  );
}