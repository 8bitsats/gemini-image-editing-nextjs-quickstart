"use client";

import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { AnimatedReveal } from "@/components/AnimatedReveal";
import { MobileLoadingAnimation } from "@/components/LoadingAnimation";
import { Video, Download, Play, Pause, RotateCcw, Upload, Wand2 } from "lucide-react";
import { motion } from "framer-motion";

interface GeneratedVideo {
  index: number;
  uri: string;
  downloadUrl: string;
}

interface VideoConfig {
  aspectRatio: "16:9" | "9:16";
  durationSeconds: number;
  numberOfVideos: number;
  personGeneration: "dont_allow" | "allow_adult" | "allow_all";
}

export function VideoGeneration() {
  const [prompt, setPrompt] = useState("");
  const [image, setImage] = useState<string | null>(null);
  const [config, setConfig] = useState<VideoConfig>({
    aspectRatio: "16:9",
    durationSeconds: 5,
    numberOfVideos: 1,
    personGeneration: "dont_allow",
  });
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedVideos, setGeneratedVideos] = useState<GeneratedVideo[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [currentVideoIndex, setCurrentVideoIndex] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      if (result) {
        // Convert to base64 without data URL prefix
        const base64 = result.split(',')[1];
        setImage(base64);
      }
    };
    reader.readAsDataURL(file);
  };

  const generateVideo = async () => {
    if (!prompt.trim()) {
      setError("Please enter a video prompt");
      return;
    }

    setIsGenerating(true);
    setError(null);
    setGeneratedVideos([]);

    try {
      const response = await fetch("/api/video", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          prompt: prompt.trim(),
          image,
          ...config,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to generate video");
      }

      const data = await response.json();
      setGeneratedVideos(data.videos || []);
      setCurrentVideoIndex(0);

    } catch (err) {
      console.error("Video generation error:", err);
      setError(err instanceof Error ? err.message : "Failed to generate video");
    } finally {
      setIsGenerating(false);
    }
  };

  const downloadVideo = async (video: GeneratedVideo) => {
    try {
      const response = await fetch(video.downloadUrl);
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      
      const a = document.createElement('a');
      a.href = url;
      a.download = `gorbagana-video-${video.index + 1}.mp4`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Download error:", err);
      setError("Failed to download video");
    }
  };

  const resetGeneration = () => {
    setPrompt("");
    setImage(null);
    setGeneratedVideos([]);
    setError(null);
    setCurrentVideoIndex(0);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const examplePrompts = [
    "A calico kitten sleeping peacefully in warm sunlight",
    "Aerial view of a surfer walking on a beach at sunset",
    "Close-up of melting icicles on a frozen rock wall with cool blue tones",
    "A vintage red convertible driving through Palm Springs in the 1970s",
    "Majestic Hawaiian waterfall in a lush rainforest with smooth flowing water",
  ];

  return (
    <div className="space-y-6">
      <AnimatedReveal>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <div className="p-2 rounded-full bg-gradient-to-r from-purple-500 to-pink-600">
                <Video className="w-5 h-5 text-white" />
              </div>
              <div>
                <span className="text-lg font-bold">Veo 2 Video Generation</span>
                <div className="flex items-center gap-2 mt-1">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                  <span className="text-xs text-muted-foreground">
                    Powered by Google DeepMind Veo 2
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
                <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
              </motion.div>
            )}

            {/* Video Prompt Input */}
            <div className="space-y-2">
              <Label htmlFor="video-prompt">Video Prompt</Label>
              <Textarea
                id="video-prompt"
                placeholder="Describe the video you want to generate..."
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                disabled={isGenerating}
                rows={3}
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
                      {example.slice(0, 30)}...
                    </Button>
                  ))}
                </div>
              </div>
            </div>

            {/* Image Upload (Optional) */}
            <div className="space-y-2">
              <Label>Starting Image (Optional)</Label>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isGenerating}
                  className="flex items-center gap-2"
                >
                  <Upload className="w-4 h-4" />
                  Upload Image
                </Button>
                {image && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setImage(null)}
                    disabled={isGenerating}
                  >
                    Remove
                  </Button>
                )}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                />
              </div>
              {image && (
                <div className="mt-2">
                  <img
                    src={`data:image/png;base64,${image}`}
                    alt="Starting frame"
                    className="w-32 h-32 object-cover rounded border"
                  />
                </div>
              )}
            </div>

            {/* Video Configuration */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Aspect Ratio</Label>
                <Select
                  value={config.aspectRatio}
                  onValueChange={(value: "16:9" | "9:16") =>
                    setConfig({ ...config, aspectRatio: value })
                  }
                  disabled={isGenerating}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="16:9">16:9 (Landscape)</SelectItem>
                    <SelectItem value="9:16">9:16 (Portrait)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Person Generation</Label>
                <Select
                  value={config.personGeneration}
                  onValueChange={(value: "dont_allow" | "allow_adult" | "allow_all") =>
                    setConfig({ ...config, personGeneration: value })
                  }
                  disabled={isGenerating}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="dont_allow">Don't Allow People</SelectItem>
                    <SelectItem value="allow_adult">Allow Adults Only</SelectItem>
                    <SelectItem value="allow_all">Allow All People</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Duration: {config.durationSeconds}s</Label>
                <Slider
                  value={[config.durationSeconds]}
                  onValueChange={(value) =>
                    setConfig({ ...config, durationSeconds: value[0] })
                  }
                  min={5}
                  max={8}
                  step={1}
                  disabled={isGenerating}
                  className="w-full"
                />
              </div>

              <div className="space-y-2">
                <Label>Number of Videos: {config.numberOfVideos}</Label>
                <Slider
                  value={[config.numberOfVideos]}
                  onValueChange={(value) =>
                    setConfig({ ...config, numberOfVideos: value[0] })
                  }
                  min={1}
                  max={2}
                  step={1}
                  disabled={isGenerating}
                  className="w-full"
                />
              </div>
            </div>

            {/* Generation Controls */}
            <div className="flex gap-2">
              <Button
                onClick={generateVideo}
                disabled={isGenerating || !prompt.trim()}
                className="flex-1 flex items-center gap-2"
              >
                <Wand2 className="w-4 h-4" />
                {isGenerating ? "Generating Video..." : "Generate Video"}
              </Button>
              
              {(generatedVideos.length > 0 || error) && (
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
                  <p className="text-sm font-medium">Generating your video with Veo 2...</p>
                  <p className="text-xs text-muted-foreground">
                    This typically takes 2-3 minutes. Please wait.
                  </p>
                </div>
              </motion.div>
            )}

            {/* Generated Videos Display */}
            {generatedVideos.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-4"
              >
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold">Generated Videos</h3>
                  {generatedVideos.length > 1 && (
                    <div className="flex gap-1">
                      {generatedVideos.map((_, index) => (
                        <Button
                          key={index}
                          variant={currentVideoIndex === index ? "default" : "outline"}
                          size="sm"
                          onClick={() => setCurrentVideoIndex(index)}
                          className="w-8 h-8 p-0"
                        >
                          {index + 1}
                        </Button>
                      ))}
                    </div>
                  )}
                </div>

                {generatedVideos[currentVideoIndex] && (
                  <div className="space-y-4">
                    <div className="relative bg-black rounded-lg overflow-hidden">
                      <video
                        ref={videoRef}
                        src={generatedVideos[currentVideoIndex].downloadUrl}
                        controls
                        className="w-full"
                        style={{
                          aspectRatio: config.aspectRatio === "16:9" ? "16/9" : "9/16",
                          maxHeight: "400px",
                        }}
                      >
                        Your browser does not support the video tag.
                      </video>
                    </div>

                    <div className="flex gap-2">
                      <Button
                        onClick={() => downloadVideo(generatedVideos[currentVideoIndex])}
                        className="flex items-center gap-2"
                      >
                        <Download className="w-4 h-4" />
                        Download Video
                      </Button>
                    </div>
                  </div>
                )}
              </motion.div>
            )}
          </CardContent>
        </Card>
      </AnimatedReveal>
    </div>
  );
}