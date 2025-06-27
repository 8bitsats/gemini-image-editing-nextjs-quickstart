"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Wand2 } from "lucide-react";
import { Input } from "./ui/input";

interface ImagePromptInputProps {
  onSubmit: (prompt: string) => void;
  isEditing: boolean;
  isLoading: boolean;
}

export function ImagePromptInput({
  onSubmit,
  isEditing,
  isLoading,
}: ImagePromptInputProps) {
  const [prompt, setPrompt] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (prompt.trim()) {
      onSubmit(prompt.trim());
      setPrompt("");
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-4 rounded-lg">
      <div className="space-y-1 sm:space-y-2">
        <p className="text-xs sm:text-sm font-medium text-foreground">
          {isEditing
            ? "Describe how you want to edit the image"
            : "Describe the image you want to generate"}
        </p>
      </div>

      <Input
        id="prompt"
        className="border-secondary text-sm sm:text-base py-3 sm:py-2"
        placeholder={
          isEditing
            ? "Make it more colorful..."
            : "A futuristic cityscape..."
        }
        value={prompt}
        onChange={(e) => setPrompt(e.target.value)}
      />

      <Button
        type="submit"
        disabled={!prompt.trim() || isLoading}
        className="w-full bg-primary hover:bg-primary/90 py-5 sm:py-2 text-sm sm:text-base font-medium"
      >
        <Wand2 className="w-4 h-4 mr-2" />
        {isEditing ? "Edit Image" : "Generate Image"}
      </Button>
    </form>
  );
}
