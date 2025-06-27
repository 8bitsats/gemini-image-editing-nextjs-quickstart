"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AudioPlayer } from "@/components/AudioPlayer";
import { AnimatedReveal } from "@/components/AnimatedReveal";
import { MobileLoadingAnimation } from "@/components/LoadingAnimation";
import { Mic, Plus, Trash2, User } from "lucide-react";
import { AVAILABLE_VOICES } from "@/lib/constants/voices";
import { Card } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";

interface Speaker {
  id: string;
  speaker: string;
  voice: string;
}

export function TextToAudio() {
  const [text, setText] = useState("");
  const [voice, setVoice] = useState("Zephyr");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [isMultiSpeaker, setIsMultiSpeaker] = useState(false);
  const [speakers, setSpeakers] = useState<Speaker[]>([
    { id: "1", speaker: "Speaker 1", voice: "Zephyr" }
  ]);

  const handleAddSpeaker = () => {
    const newSpeaker: Speaker = {
      id: Date.now().toString(),
      speaker: `Speaker ${speakers.length + 1}`,
      voice: "Puck"
    };
    setSpeakers([...speakers, newSpeaker]);
  };

  const handleRemoveSpeaker = (id: string) => {
    if (speakers.length > 1) {
      setSpeakers(speakers.filter(s => s.id !== id));
    }
  };

  const updateSpeaker = (id: string, field: "speaker" | "voice", value: string) => {
    setSpeakers(speakers.map(s => 
      s.id === id ? { ...s, [field]: value } : s
    ));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!text.trim()) {
      setError("Please enter some text");
      return;
    }

    setIsLoading(true);
    setError(null);
    setAudioUrl(null);

    try {
      const response = await fetch("/api/audio", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          text: text.trim(),
          voice: isMultiSpeaker ? undefined : voice,
          isSingleSpeaker: !isMultiSpeaker,
          speakers: isMultiSpeaker ? speakers : undefined,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to generate audio");
      }

      const audioBlob = await response.blob();
      const url = URL.createObjectURL(audioBlob);
      setAudioUrl(url);

    } catch (err) {
      console.error("Audio generation error:", err);
      setError(err instanceof Error ? err.message : "Failed to generate audio");
    } finally {
      setIsLoading(false);
    }
  };

  const exampleTexts = [
    "Welcome to Gorbagana AI, where creativity meets technology!",
    "The future of digital art is here, powered by advanced AI models.",
    "Transform your ideas into stunning visuals with just a few words.",
  ];

  const multiSpeakerExample = `Speaker 1: Hello! Welcome to our audio generation demo.
Speaker 2: We can create realistic conversations with multiple voices.
Speaker 1: Each speaker can have their own unique voice.
Speaker 2: Try it out yourself!`;

  return (
    <div className="space-y-4 sm:space-y-6">
      <AnimatedReveal type="fade">
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Single/Multi Speaker Toggle */}
          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="multi-speaker" className="text-sm font-medium">
                  Multi-Speaker Mode
                </Label>
                <p className="text-xs text-muted-foreground mt-1">
                  Create conversations with multiple voices
                </p>
              </div>
              <Switch
                id="multi-speaker"
                checked={isMultiSpeaker}
                onCheckedChange={setIsMultiSpeaker}
              />
            </div>
          </Card>

          {/* Text Input */}
          <div className="space-y-2">
            <Label htmlFor="text-input" className="text-sm font-medium">
              {isMultiSpeaker ? "Enter your dialogue" : "Enter your text"}
            </Label>
            <Textarea
              id="text-input"
              placeholder={isMultiSpeaker ? 
                "Speaker 1: Hello!\nSpeaker 2: Hi there!" : 
                "Enter the text you want to convert to speech..."
              }
              value={text}
              onChange={(e) => setText(e.target.value)}
              className="min-h-[120px] sm:min-h-[150px] text-sm sm:text-base"
            />
            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => setText(isMultiSpeaker ? multiSpeakerExample : exampleTexts[0])}
                className="text-xs"
              >
                Try example
              </Button>
            </div>
          </div>

          {/* Voice Selection */}
          {!isMultiSpeaker ? (
            <div className="space-y-2">
              <Label htmlFor="voice-select" className="text-sm font-medium">
                Select Voice
              </Label>
              <Select value={voice} onValueChange={setVoice}>
                <SelectTrigger id="voice-select">
                  <SelectValue placeholder="Select a voice" />
                </SelectTrigger>
                <SelectContent>
                  {AVAILABLE_VOICES.map((v) => (
                    <SelectItem key={v.id} value={v.id}>
                      <div>
                        <div className="font-medium">{v.name}</div>
                        <div className="text-xs text-muted-foreground">{v.description}</div>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="text-sm font-medium">Speakers</Label>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={handleAddSpeaker}
                  disabled={speakers.length >= 5}
                >
                  <Plus className="h-3 w-3 mr-1" />
                  Add Speaker
                </Button>
              </div>
              <div className="space-y-2">
                {speakers.map((speaker) => (
                  <Card key={speaker.id} className="p-3">
                    <div className="flex items-center gap-3">
                      <User className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                      <Input
                        value={speaker.speaker}
                        onChange={(e) => updateSpeaker(speaker.id, "speaker", e.target.value)}
                        placeholder="Speaker name"
                        className="flex-1 h-8 text-sm"
                      />
                      <Select 
                        value={speaker.voice} 
                        onValueChange={(v) => updateSpeaker(speaker.id, "voice", v)}
                      >
                        <SelectTrigger className="w-[120px] h-8">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {AVAILABLE_VOICES.map((v) => (
                            <SelectItem key={v.id} value={v.id}>
                              {v.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {speakers.length > 1 && (
                        <Button
                          type="button"
                          size="icon"
                          variant="ghost"
                          onClick={() => handleRemoveSpeaker(speaker.id)}
                          className="h-8 w-8"
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      )}
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* Error Display */}
          {error && (
            <AnimatedReveal>
              <div className="p-3 sm:p-4 text-xs sm:text-sm text-red-700 bg-red-100 rounded-lg">
                {error}
              </div>
            </AnimatedReveal>
          )}

          {/* Submit Button */}
          <Button
            type="submit"
            disabled={isLoading || !text.trim()}
            className="w-full py-5 sm:py-2 text-sm sm:text-base font-medium"
          >
            <Mic className="w-4 h-4 mr-2" />
            {isLoading ? "Generating Audio..." : "Generate Audio"}
          </Button>
        </form>
      </AnimatedReveal>

      {/* Loading State */}
      {isLoading && (
        <AnimatedReveal type="scale">
          <MobileLoadingAnimation />
        </AnimatedReveal>
      )}

      {/* Audio Player */}
      {audioUrl && !isLoading && (
        <AnimatedReveal type="slide" direction="up" delay={0.2}>
          <AudioPlayer audioUrl={audioUrl} />
        </AnimatedReveal>
      )}
    </div>
  );
}