"use client";

import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import { 
  Play, 
  Pause, 
  Square,
  Volume2, 
  Settings,
  X,
  Music,
  Mic,
  Radio,
  Disc3,
  Headphones,
  RotateCcw
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface Prompt {
  id: string;
  text: string;
  weight: number;
  color: string;
  midiCC: number;
}

interface DJBoothProps {
  isOpen: boolean;
  onClose: () => void;
}

export function DJBooth({ isOpen, onClose }: DJBoothProps) {
  const [prompts, setPrompts] = useState<Prompt[]>([
    { id: "1", text: "Upbeat electronic", weight: 0.5, color: "#ff6b6b", midiCC: 1 },
    { id: "2", text: "Deep bass", weight: 0.3, color: "#4ecdc4", midiCC: 2 },
    { id: "3", text: "Ambient pads", weight: 0.7, color: "#45b7d1", midiCC: 3 },
    { id: "4", text: "Rhythmic drums", weight: 0.6, color: "#96ceb4", midiCC: 4 },
    { id: "5", text: "Melodic lead", weight: 0.4, color: "#feca57", midiCC: 5 },
    { id: "6", text: "Atmospheric", weight: 0.8, color: "#ff9ff3", midiCC: 6 },
    { id: "7", text: "Distorted synth", weight: 0.2, color: "#54a0ff", midiCC: 7 },
    { id: "8", text: "Vocal chops", weight: 0.5, color: "#5f27cd", midiCC: 8 },
  ]);

  const [playbackState, setPlaybackState] = useState<"stopped" | "playing" | "loading">("stopped");
  const [masterVolume, setMasterVolume] = useState(70);
  const [isRecording, setIsRecording] = useState(false);
  const [audioLevel, setAudioLevel] = useState(0);
  const [showMidiSettings, setShowMidiSettings] = useState(false);
  const [bpm, setBpm] = useState(120);
  const [key, setKey] = useState("C");

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>();

  // Audio visualization
  useEffect(() => {
    if (playbackState === "playing") {
      const animate = () => {
        setAudioLevel(Math.random() * 100);
        animationRef.current = requestAnimationFrame(animate);
      };
      animate();
    } else {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      setAudioLevel(0);
    }

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [playbackState]);

  // Canvas visualization
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const drawVisualization = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      // Draw frequency bars
      const barWidth = canvas.width / 32;
      for (let i = 0; i < 32; i++) {
        const barHeight = Math.random() * canvas.height * (audioLevel / 100);
        const hue = (i * 360) / 32;
        
        ctx.fillStyle = `hsla(${hue}, 70%, 60%, 0.8)`;
        ctx.fillRect(
          i * barWidth,
          canvas.height - barHeight,
          barWidth - 2,
          barHeight
        );
      }

      if (playbackState === "playing") {
        requestAnimationFrame(drawVisualization);
      }
    };

    if (playbackState === "playing") {
      drawVisualization();
    }
  }, [playbackState, audioLevel]);

  const updatePrompt = (id: string, field: keyof Prompt, value: any) => {
    setPrompts(prev => prev.map(p => 
      p.id === id ? { ...p, [field]: value } : p
    ));
  };

  const togglePlayback = async () => {
    if (playbackState === "stopped") {
      setPlaybackState("loading");
      
      // Simulate music generation API call
      try {
        // In real implementation, this would call Lyria RealTime API
        await new Promise(resolve => setTimeout(resolve, 1000));
        setPlaybackState("playing");
      } catch (error) {
        console.error("Failed to start playback:", error);
        setPlaybackState("stopped");
      }
    } else {
      setPlaybackState("stopped");
    }
  };

  const resetAllPrompts = () => {
    setPrompts(prev => prev.map(p => ({ ...p, weight: 0 })));
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        onClick={(e) => e.target === e.currentTarget && onClose()}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className="w-full max-w-6xl h-[90vh] bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 rounded-2xl border border-purple-500/30 overflow-hidden"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-purple-500/20">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
                <Disc3 className="w-5 h-5 text-white animate-spin" style={{ animationDuration: "3s" }} />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-white">DJ Booth</h2>
                <p className="text-purple-200 text-sm">AI-Powered Music Mixing</p>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-purple-200 border-purple-500/50">
                {bpm} BPM
              </Badge>
              <Badge variant="outline" className="text-purple-200 border-purple-500/50">
                Key: {key}
              </Badge>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowMidiSettings(!showMidiSettings)}
                className="text-white hover:bg-white/10"
              >
                <Settings className="w-4 h-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={onClose}
                className="text-white hover:bg-white/10"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* Main Content */}
          <div className="flex h-[calc(100%-80px)]">
            {/* Left Panel - Prompts Grid */}
            <div className="flex-1 p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-white">Prompt Controllers</h3>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={resetAllPrompts}
                  className="text-purple-200 border-purple-500/50 hover:bg-purple-500/20"
                >
                  <RotateCcw className="w-3 h-3 mr-1" />
                  Reset
                </Button>
              </div>
              
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 h-[calc(100%-60px)]">
                {prompts.map((prompt) => (
                  <Card
                    key={prompt.id}
                    className="bg-black/20 backdrop-blur-sm border-purple-500/30 p-4 flex flex-col items-center justify-center relative overflow-hidden"
                  >
                    {/* Background glow effect */}
                    <div 
                      className="absolute inset-0 opacity-30 blur-xl"
                      style={{
                        background: `radial-gradient(circle at center, ${prompt.color}${Math.round(prompt.weight * 255).toString(16).padStart(2, '0')} 0%, transparent 70%)`
                      }}
                    />
                    
                    <div className="relative z-10 w-full flex flex-col items-center">
                      {/* Weight Knob */}
                      <div className="relative mb-3">
                        <div 
                          className="w-16 h-16 rounded-full border-4 flex items-center justify-center relative cursor-pointer"
                          style={{ 
                            borderColor: prompt.color,
                            background: `conic-gradient(${prompt.color} ${prompt.weight * 360}deg, transparent ${prompt.weight * 360}deg)`
                          }}
                        >
                          <div className="w-12 h-12 bg-black/50 rounded-full flex items-center justify-center">
                            <span className="text-white text-xs font-mono">
                              {Math.round(prompt.weight * 100)}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Prompt Text */}
                      <input
                        type="text"
                        value={prompt.text}
                        onChange={(e) => updatePrompt(prompt.id, "text", e.target.value)}
                        className="bg-black/50 text-white text-xs text-center rounded px-2 py-1 w-full border border-purple-500/30 focus:border-purple-400 focus:outline-none"
                        placeholder="Enter prompt..."
                      />

                      {/* Weight Slider */}
                      <div className="w-full mt-2">
                        <Slider
                          value={[prompt.weight]}
                          onValueChange={(value) => updatePrompt(prompt.id, "weight", value[0])}
                          max={1}
                          step={0.01}
                          className="w-full"
                        />
                      </div>

                      {/* MIDI CC Display */}
                      {showMidiSettings && (
                        <div className="mt-2 text-xs text-purple-200 font-mono border border-purple-500/30 rounded px-2 py-1">
                          CC:{prompt.midiCC}
                        </div>
                      )}
                    </div>
                  </Card>
                ))}
              </div>
            </div>

            {/* Right Panel - Controls & Visualization */}
            <div className="w-80 border-l border-purple-500/20 p-6 flex flex-col">
              {/* Audio Visualization */}
              <Card className="bg-black/20 backdrop-blur-sm border-purple-500/30 p-4 mb-4">
                <h4 className="text-white font-semibold mb-2 flex items-center gap-2">
                  <Radio className="w-4 h-4" />
                  Live Audio
                </h4>
                <canvas
                  ref={canvasRef}
                  width={280}
                  height={80}
                  className="w-full rounded"
                />
              </Card>

              {/* Transport Controls */}
              <Card className="bg-black/20 backdrop-blur-sm border-purple-500/30 p-4 mb-4">
                <h4 className="text-white font-semibold mb-3 flex items-center gap-2">
                  <Music className="w-4 h-4" />
                  Transport
                </h4>
                
                <div className="flex items-center justify-center gap-3 mb-4">
                  <Button
                    onClick={togglePlayback}
                    disabled={playbackState === "loading"}
                    className="w-16 h-16 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 disabled:opacity-50"
                  >
                    {playbackState === "loading" ? (
                      <div className="animate-spin w-6 h-6 border-2 border-white border-t-transparent rounded-full" />
                    ) : playbackState === "playing" ? (
                      <Pause className="w-6 h-6 text-white" />
                    ) : (
                      <Play className="w-6 h-6 text-white ml-1" />
                    )}
                  </Button>
                  
                  <Button
                    onClick={() => setPlaybackState("stopped")}
                    variant="outline"
                    className="text-white border-purple-500/50 hover:bg-purple-500/20"
                  >
                    <Square className="w-4 h-4" />
                  </Button>
                </div>

                <div className="space-y-3">
                  <div>
                    <label className="text-sm text-purple-200 mb-1 block">BPM</label>
                    <Slider
                      value={[bpm]}
                      onValueChange={(value) => setBpm(value[0])}
                      min={60}
                      max={180}
                      step={1}
                      className="w-full"
                    />
                    <div className="text-xs text-purple-200 text-center mt-1">{bpm}</div>
                  </div>

                  <div>
                    <label className="text-sm text-purple-200 mb-1 block">Key</label>
                    <select
                      value={key}
                      onChange={(e) => setKey(e.target.value)}
                      className="w-full bg-black/50 text-white border border-purple-500/30 rounded px-2 py-1 text-sm"
                    >
                      {["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"].map(k => (
                        <option key={k} value={k}>{k}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </Card>

              {/* Master Controls */}
              <Card className="bg-black/20 backdrop-blur-sm border-purple-500/30 p-4">
                <h4 className="text-white font-semibold mb-3 flex items-center gap-2">
                  <Volume2 className="w-4 h-4" />
                  Master
                </h4>
                
                <div className="space-y-3">
                  <div>
                    <label className="text-sm text-purple-200 mb-1 block">Volume</label>
                    <Slider
                      value={[masterVolume]}
                      onValueChange={(value) => setMasterVolume(value[0])}
                      max={100}
                      step={1}
                      className="w-full"
                    />
                    <div className="text-xs text-purple-200 text-center mt-1">{masterVolume}%</div>
                  </div>

                  <div className="flex items-center justify-between">
                    <Button
                      onClick={() => setIsRecording(!isRecording)}
                      variant={isRecording ? "destructive" : "outline"}
                      size="sm"
                      className={isRecording ? "" : "text-white border-purple-500/50 hover:bg-purple-500/20"}
                    >
                      <Mic className="w-3 h-3 mr-1" />
                      {isRecording ? "Stop" : "Record"}
                    </Button>
                    
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-white border-purple-500/50 hover:bg-purple-500/20"
                    >
                      <Headphones className="w-3 h-3 mr-1" />
                      Monitor
                    </Button>
                  </div>
                </div>
              </Card>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}