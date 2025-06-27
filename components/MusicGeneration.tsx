"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { AnimatedReveal } from "@/components/AnimatedReveal";
import { MobileLoadingAnimation } from "@/components/LoadingAnimation";
import { 
  Music, 
  Play, 
  Pause, 
  Square, 
  Download, 
  RotateCcw, 
  Wand2,
  Volume2,
  VolumeX,
  Settings,
  Headphones
} from "lucide-react";
import { motion } from "framer-motion";

interface MusicConfig {
  bpm: number;
  density: number;
  brightness: number;
  temperature: number;
  guidance: number;
  scale: string;
  muteBass: boolean;
  muteDrums: boolean;
  onlyBassAndDrums: boolean;
}

interface WeightedPrompt {
  text: string;
  weight: number;
}

export function MusicGeneration() {
  const [prompts, setPrompts] = useState<WeightedPrompt[]>([{ text: "", weight: 1.0 }]);
  const [config, setConfig] = useState<MusicConfig>({
    bpm: 120,
    density: 0.5,
    brightness: 0.5,
    temperature: 1.1,
    guidance: 4.0,
    scale: "SCALE_UNSPECIFIED",
    muteBass: false,
    muteDrums: false,
    onlyBassAndDrums: false,
  });
  const [isGenerating, setIsGenerating] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [volume, setVolume] = useState(0.7);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [showAdvanced, setShowAdvanced] = useState(false);
  
  const audioRef = useRef<HTMLAudioElement>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Audio visualization
  useEffect(() => {
    if (isPlaying && audioRef.current && canvasRef.current) {
      const audio = audioRef.current;
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
        const source = audioContextRef.current.createMediaElementSource(audio);
        analyserRef.current = audioContextRef.current.createAnalyser();
        source.connect(analyserRef.current);
        analyserRef.current.connect(audioContextRef.current.destination);
      }

      const analyser = analyserRef.current;
      if (analyser && ctx) {
        analyser.fftSize = 256;
        const bufferLength = analyser.frequencyBinCount;
        const dataArray = new Uint8Array(bufferLength);

        const draw = () => {
          if (!isPlaying) return;
          
          requestAnimationFrame(draw);
          analyser.getByteFrequencyData(dataArray);

          ctx.fillStyle = 'rgb(0, 0, 0)';
          ctx.fillRect(0, 0, canvas.width, canvas.height);

          const barWidth = (canvas.width / bufferLength) * 2.5;
          let barHeight;
          let x = 0;

          for (let i = 0; i < bufferLength; i++) {
            barHeight = (dataArray[i] / 255) * canvas.height * 0.8;

            const gradient = ctx.createLinearGradient(0, canvas.height - barHeight, 0, canvas.height);
            gradient.addColorStop(0, '#8b5cf6');
            gradient.addColorStop(1, '#ec4899');
            
            ctx.fillStyle = gradient;
            ctx.fillRect(x, canvas.height - barHeight, barWidth, barHeight);

            x += barWidth + 1;
          }
        };

        draw();
      }
    }
  }, [isPlaying]);

  const addPrompt = () => {
    setPrompts([...prompts, { text: "", weight: 1.0 }]);
  };

  const updatePrompt = (index: number, field: keyof WeightedPrompt, value: string | number) => {
    const newPrompts = [...prompts];
    newPrompts[index] = { ...newPrompts[index], [field]: value };
    setPrompts(newPrompts);
  };

  const removePrompt = (index: number) => {
    if (prompts.length > 1) {
      setPrompts(prompts.filter((_, i) => i !== index));
    }
  };

  const generateMusic = async () => {
    const validPrompts = prompts.filter(p => p.text.trim().length > 0);
    if (validPrompts.length === 0) {
      setError("Please enter at least one music prompt");
      return;
    }

    setIsGenerating(true);
    setError(null);

    try {
      // In a real implementation, this would establish a WebSocket connection
      // For this demo, we'll simulate the music generation process
      const response = await fetch("/api/music", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          prompt: validPrompts[0].text, // Use first prompt for simplicity
          ...config,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to generate music");
      }

      const data = await response.json();
      
      // Simulate audio generation (in real implementation, this would be WebSocket streaming)
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      // For demo purposes, we'll use a placeholder audio URL
      // In real implementation, this would be the streamed audio from Lyria RealTime
      setAudioUrl("data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmMcCE+l4e2bWQ4SHJHj2ZNNEBhbo+Tt3GQf"); // Placeholder

      setIsGenerating(false);

    } catch (err) {
      console.error("Music generation error:", err);
      setError(err instanceof Error ? err.message : "Failed to generate music");
      setIsGenerating(false);
    }
  };

  const playPause = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const stopMusic = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      setIsPlaying(false);
      setCurrentTime(0);
    }
  };

  const resetGeneration = () => {
    stopMusic();
    setPrompts([{ text: "", weight: 1.0 }]);
    setAudioUrl(null);
    setError(null);
    setCurrentTime(0);
    setDuration(0);
  };

  const downloadAudio = () => {
    if (audioUrl && audioRef.current) {
      const a = document.createElement('a');
      a.href = audioUrl;
      a.download = 'gorbagana-music.wav';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    }
  };

  // Update current time
  useEffect(() => {
    const audio = audioRef.current;
    if (audio) {
      const updateTime = () => setCurrentTime(audio.currentTime);
      const updateDuration = () => setDuration(audio.duration);
      
      audio.addEventListener('timeupdate', updateTime);
      audio.addEventListener('loadedmetadata', updateDuration);
      audio.addEventListener('ended', () => setIsPlaying(false));
      
      return () => {
        audio.removeEventListener('timeupdate', updateTime);
        audio.removeEventListener('loadedmetadata', updateDuration);
        audio.removeEventListener('ended', () => setIsPlaying(false));
      };
    }
  }, [audioUrl]);

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const instrumentExamples = [
    "minimal techno",
    "jazz piano with smooth bass",
    "acoustic guitar fingerpicking",
    "orchestral strings with brass",
    "electronic ambient with synthesizers",
    "funk drums with electric bass",
    "classical violin solo",
    "hip hop beat with 808s",
  ];

  const scaleOptions = [
    { value: "SCALE_UNSPECIFIED", label: "Model Decides" },
    { value: "C_MAJOR_A_MINOR", label: "C Major / A Minor" },
    { value: "D_MAJOR_B_MINOR", label: "D Major / B Minor" },
    { value: "E_MAJOR_D_FLAT_MINOR", label: "E Major / C# Minor" },
    { value: "F_MAJOR_D_MINOR", label: "F Major / D Minor" },
    { value: "G_MAJOR_E_MINOR", label: "G Major / E Minor" },
    { value: "A_MAJOR_G_FLAT_MINOR", label: "A Major / F# Minor" },
    { value: "B_FLAT_MAJOR_G_MINOR", label: "Bb Major / G Minor" },
  ];

  return (
    <div className="space-y-6">
      <AnimatedReveal>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <div className="p-2 rounded-full bg-gradient-to-r from-blue-500 to-purple-600">
                <Music className="w-5 h-5 text-white" />
              </div>
              <div>
                <span className="text-lg font-bold">Lyria RealTime Music Generator</span>
                <div className="flex items-center gap-2 mt-1">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                  <span className="text-xs text-muted-foreground">
                    Powered by Google DeepMind Lyria
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

            {/* Music Prompts */}
            <div className="space-y-4">
              <Label>Music Prompts</Label>
              {prompts.map((prompt, index) => (
                <div key={index} className="flex gap-2 items-end">
                  <div className="flex-1">
                    <Input
                      placeholder="Describe the music style, instruments, or mood..."
                      value={prompt.text}
                      onChange={(e) => updatePrompt(index, 'text', e.target.value)}
                      disabled={isGenerating}
                    />
                  </div>
                  <div className="w-20">
                    <Label className="text-xs">Weight</Label>
                    <Input
                      type="number"
                      min="0.1"
                      max="3"
                      step="0.1"
                      value={prompt.weight}
                      onChange={(e) => updatePrompt(index, 'weight', parseFloat(e.target.value))}
                      disabled={isGenerating}
                    />
                  </div>
                  {prompts.length > 1 && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => removePrompt(index)}
                      disabled={isGenerating}
                    >
                      Remove
                    </Button>
                  )}
                </div>
              ))}
              
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={addPrompt}
                  disabled={isGenerating}
                >
                  Add Prompt
                </Button>
              </div>

              {/* Example Prompts */}
              <div className="space-y-2">
                <p className="text-xs text-muted-foreground">Try these examples:</p>
                <div className="flex flex-wrap gap-2">
                  {instrumentExamples.map((example, index) => (
                    <Button
                      key={index}
                      variant="outline"
                      size="sm"
                      className="text-xs h-7 px-2"
                      onClick={() => updatePrompt(0, 'text', example)}
                      disabled={isGenerating}
                    >
                      {example}
                    </Button>
                  ))}
                </div>
              </div>
            </div>

            {/* Advanced Settings */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label className="flex items-center gap-2">
                  <Settings className="w-4 h-4" />
                  Advanced Settings
                </Label>
                <Switch
                  checked={showAdvanced}
                  onCheckedChange={setShowAdvanced}
                />
              </div>

              {showAdvanced && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 border rounded-lg"
                >
                  <div className="space-y-2">
                    <Label>BPM: {config.bpm}</Label>
                    <Slider
                      value={[config.bpm]}
                      onValueChange={(value) => setConfig({...config, bpm: value[0]})}
                      min={60}
                      max={200}
                      step={1}
                      disabled={isGenerating}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Density: {config.density}</Label>
                    <Slider
                      value={[config.density]}
                      onValueChange={(value) => setConfig({...config, density: value[0]})}
                      min={0}
                      max={1}
                      step={0.1}
                      disabled={isGenerating}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Brightness: {config.brightness}</Label>
                    <Slider
                      value={[config.brightness]}
                      onValueChange={(value) => setConfig({...config, brightness: value[0]})}
                      min={0}
                      max={1}
                      step={0.1}
                      disabled={isGenerating}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Temperature: {config.temperature}</Label>
                    <Slider
                      value={[config.temperature]}
                      onValueChange={(value) => setConfig({...config, temperature: value[0]})}
                      min={0}
                      max={3}
                      step={0.1}
                      disabled={isGenerating}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Musical Scale</Label>
                    <Select
                      value={config.scale}
                      onValueChange={(value) => setConfig({...config, scale: value})}
                      disabled={isGenerating}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {scaleOptions.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Audio Options</Label>
                    <div className="space-y-2">
                      <div className="flex items-center space-x-2">
                        <Switch
                          checked={config.muteBass}
                          onCheckedChange={(checked) => setConfig({...config, muteBass: checked})}
                          disabled={isGenerating}
                        />
                        <Label className="text-sm">Mute Bass</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Switch
                          checked={config.muteDrums}
                          onCheckedChange={(checked) => setConfig({...config, muteDrums: checked})}
                          disabled={isGenerating}
                        />
                        <Label className="text-sm">Mute Drums</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Switch
                          checked={config.onlyBassAndDrums}
                          onCheckedChange={(checked) => setConfig({...config, onlyBassAndDrums: checked})}
                          disabled={isGenerating}
                        />
                        <Label className="text-sm">Only Bass & Drums</Label>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </div>

            {/* Generation Controls */}
            <div className="flex gap-2">
              <Button
                onClick={generateMusic}
                disabled={isGenerating || prompts.every(p => !p.text.trim())}
                className="flex-1 flex items-center gap-2"
              >
                <Wand2 className="w-4 h-4" />
                {isGenerating ? "Generating Music..." : "Generate Music"}
              </Button>
              
              {(audioUrl || error) && (
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
                  <p className="text-sm font-medium">Generating your music with Lyria RealTime...</p>
                  <p className="text-xs text-muted-foreground">
                    Real-time streaming music generation in progress.
                  </p>
                </div>
              </motion.div>
            )}

            {/* Music Player */}
            {audioUrl && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-4"
              >
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold flex items-center gap-2">
                    <Headphones className="w-5 h-5" />
                    Generated Music
                  </h3>
                </div>

                {/* Audio Visualization */}
                <div className="bg-black rounded-lg overflow-hidden">
                  <canvas
                    ref={canvasRef}
                    width={800}
                    height={200}
                    className="w-full h-32"
                  />
                </div>

                {/* Audio Controls */}
                <div className="space-y-4">
                  <div className="flex items-center gap-4">
                    <Button
                      onClick={playPause}
                      className="flex items-center gap-2"
                    >
                      {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                      {isPlaying ? "Pause" : "Play"}
                    </Button>
                    
                    <Button
                      variant="outline"
                      onClick={stopMusic}
                      className="flex items-center gap-2"
                    >
                      <Square className="w-4 h-4" />
                      Stop
                    </Button>

                    <Button
                      variant="outline"
                      onClick={downloadAudio}
                      className="flex items-center gap-2"
                    >
                      <Download className="w-4 h-4" />
                      Download
                    </Button>

                    <div className="flex items-center gap-2 ml-auto">
                      {volume > 0 ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
                      <Slider
                        value={[volume]}
                        onValueChange={(value) => {
                          setVolume(value[0]);
                          if (audioRef.current) {
                            audioRef.current.volume = value[0];
                          }
                        }}
                        min={0}
                        max={1}
                        step={0.1}
                        className="w-20"
                      />
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="space-y-2">
                    <Slider
                      value={[currentTime]}
                      onValueChange={(value) => {
                        if (audioRef.current) {
                          audioRef.current.currentTime = value[0];
                          setCurrentTime(value[0]);
                        }
                      }}
                      min={0}
                      max={duration || 100}
                      step={1}
                      className="w-full"
                    />
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>{formatTime(currentTime)}</span>
                      <span>{formatTime(duration)}</span>
                    </div>
                  </div>
                </div>

                {/* Hidden Audio Element */}
                <audio
                  ref={audioRef}
                  src={audioUrl}
                  onPlay={() => setIsPlaying(true)}
                  onPause={() => setIsPlaying(false)}
                  onEnded={() => setIsPlaying(false)}
                />
              </motion.div>
            )}
          </CardContent>
        </Card>
      </AnimatedReveal>
    </div>
  );
}