"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
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
  RotateCcw,
  Wifi,
  WifiOff
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { MidiDispatcher, AudioAnalyser, throttle } from "@/lib/utils/djMidiUtils";
import { createLiveMusicHelper, LiveMusicHelper } from "@/lib/utils/liveMusicHelper";

interface Prompt {
  id: string;
  text: string;
  weight: number;
  color: string;
  midiCC: number;
}

type PlaybackState = "stopped" | "playing" | "loading" | "paused";

interface DJBoothAdvancedProps {
  isOpen: boolean;
  onClose: () => void;
}

export function DJBoothAdvanced({ isOpen, onClose }: DJBoothAdvancedProps) {
  const [prompts, setPrompts] = useState<Prompt[]>([
    { id: "1", text: "Upbeat electronic dance", weight: 0, color: "#ff6b6b", midiCC: 1 },
    { id: "2", text: "Deep bass rhythms", weight: 0, color: "#4ecdc4", midiCC: 2 },
    { id: "3", text: "Ambient atmospheric pads", weight: 0, color: "#45b7d1", midiCC: 3 },
    { id: "4", text: "Driving drum patterns", weight: 0, color: "#96ceb4", midiCC: 4 },
    { id: "5", text: "Melodic synthesizer lead", weight: 0, color: "#feca57", midiCC: 5 },
    { id: "6", text: "Ethereal vocal textures", weight: 0, color: "#ff9ff3", midiCC: 6 },
    { id: "7", text: "Distorted experimental sounds", weight: 0, color: "#54a0ff", midiCC: 7 },
    { id: "8", text: "Chopped vocal samples", weight: 0, color: "#5f27cd", midiCC: 8 },
  ]);

  const [playbackState, setPlaybackState] = useState<PlaybackState>("stopped");
  const [masterVolume, setMasterVolume] = useState(70);
  const [audioLevel, setAudioLevel] = useState(0);
  const [showMidiSettings, setShowMidiSettings] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const [filteredPrompts, setFilteredPrompts] = useState<Set<string>>(new Set());
  
  // MIDI state
  const [midiInputIds, setMidiInputIds] = useState<string[]>([]);
  const [activeMidiInputId, setActiveMidiInputId] = useState<string | null>(null);
  const [learnMode, setLearnMode] = useState<{ [key: string]: boolean }>({});

  // Audio and MIDI references
  const audioContextRef = useRef<AudioContext | null>(null);
  const audioAnalyserRef = useRef<AudioAnalyser | null>(null);
  const midiDispatcherRef = useRef<MidiDispatcher | null>(null);
  const liveMusicHelperRef = useRef<LiveMusicHelper | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>();

  // Initialize audio context and MIDI
  useEffect(() => {
    const initializeAudio = async () => {
      try {
        audioContextRef.current = new AudioContext({ sampleRate: 48000 });
        audioAnalyserRef.current = new AudioAnalyser(audioContextRef.current);
        
        audioAnalyserRef.current.addEventListener('audio-level-changed', (e: any) => {
          setAudioLevel(e.detail);
        });

        midiDispatcherRef.current = new MidiDispatcher();
        
        midiDispatcherRef.current.addEventListener('cc-message', (e: any) => {
          const { channel, cc, value } = e.detail;
          handleMidiControlChange(cc, value);
        });

        // Initialize Live Music Helper
        liveMusicHelperRef.current = createLiveMusicHelper({
          model: 'lyria-realtime',
          sampleRate: 48000,
          bufferTime: 2
        });

        // Listen to Live Music Helper events
        liveMusicHelperRef.current.addEventListener('connected', () => {
          setIsConnected(true);
          setConnectionError(null);
        });

        liveMusicHelperRef.current.addEventListener('error', (e: any) => {
          setConnectionError(e.detail);
          setIsConnected(false);
        });

        liveMusicHelperRef.current.addEventListener('playback-state-changed', (e: any) => {
          setPlaybackState(e.detail);
        });

        liveMusicHelperRef.current.addEventListener('filtered-prompt', (e: any) => {
          setFilteredPrompts(prev => new Set([...prev, e.detail.text]));
        });

      } catch (error) {
        console.error("Failed to initialize audio:", error);
        setConnectionError("Audio initialization failed");
      }
    };

    if (isOpen) {
      initializeAudio();
    }

    return () => {
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
      if (audioAnalyserRef.current) {
        audioAnalyserRef.current.stop();
      }
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [isOpen]);

  // MIDI control change handler
  const handleMidiControlChange = useCallback((cc: number, value: number) => {
    const normalizedValue = (value / 127) * 2; // Convert to 0-2 range
    
    // Check if any prompt is in learn mode
    const learningPrompt = prompts.find(p => learnMode[p.id]);
    if (learningPrompt) {
      updatePrompt(learningPrompt.id, { midiCC: cc });
      setLearnMode(prev => ({ ...prev, [learningPrompt.id]: false }));
      return;
    }

    // Update prompt weight if CC matches
    const targetPrompt = prompts.find(p => p.midiCC === cc);
    if (targetPrompt) {
      updatePrompt(targetPrompt.id, { weight: normalizedValue });
    }
  }, [prompts, learnMode]);

  // Get MIDI devices
  const getMidiDevices = async () => {
    if (!midiDispatcherRef.current) return;
    
    try {
      const inputIds = await midiDispatcherRef.current.getMidiAccess();
      setMidiInputIds(inputIds);
      if (inputIds.length > 0 && !activeMidiInputId) {
        setActiveMidiInputId(inputIds[0]);
        midiDispatcherRef.current.activeMidiInputId = inputIds[0];
      }
    } catch (error) {
      console.error("Failed to get MIDI devices:", error);
    }
  };

  // Canvas visualization
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const drawVisualization = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      // Draw frequency bars based on active prompts
      const activePromptCount = prompts.filter(p => p.weight > 0).length;
      if (activePromptCount === 0) return;

      const barWidth = canvas.width / 32;
      
      prompts.forEach((prompt, index) => {
        if (prompt.weight > 0) {
          for (let i = index * 4; i < (index + 1) * 4 && i < 32; i++) {
            const barHeight = (Math.random() * prompt.weight * audioLevel * canvas.height) / 2;
            const alpha = Math.min(prompt.weight, 1);
            
            ctx.fillStyle = prompt.color + Math.round(alpha * 255).toString(16).padStart(2, '0');
            ctx.fillRect(
              i * barWidth,
              canvas.height - barHeight,
              barWidth - 2,
              barHeight
            );
          }
        }
      });

      if (playbackState === "playing") {
        animationRef.current = requestAnimationFrame(drawVisualization);
      }
    };

    if (playbackState === "playing") {
      drawVisualization();
    }
  }, [playbackState, audioLevel, prompts]);

  // Generate background gradient based on active prompts
  const generateBackground = throttle(() => {
    const activePrompts = prompts.filter(p => p.weight > 0);
    if (activePrompts.length === 0) return "transparent";

    const gradientStops = activePrompts.map((prompt, index) => {
      const alpha = Math.min(prompt.weight / 2, 0.6);
      const position = (index / Math.max(activePrompts.length - 1, 1)) * 100;
      return `${prompt.color}${Math.round(alpha * 255).toString(16).padStart(2, '0')} ${position}%`;
    });

    return `radial-gradient(circle at center, ${gradientStops.join(', ')})`;
  }, 100);

  const updatePrompt = (id: string, updates: Partial<Prompt>) => {
    setPrompts(prev => prev.map(p => 
      p.id === id ? { ...p, ...updates } : p
    ));
  };

  const resetAllPrompts = () => {
    setPrompts(prev => prev.map(p => ({ ...p, weight: 0 })));
  };

  const toggleLearnMode = (promptId: string) => {
    setLearnMode(prev => ({ ...prev, [promptId]: !prev[promptId] }));
  };

  const connectToLyria = async () => {
    if (!liveMusicHelperRef.current) return;

    setConnectionError(null);

    try {
      // Connect to Live Music Helper
      await liveMusicHelperRef.current.connect();
      
      // Set the weighted prompts
      const promptMap = new Map(prompts.map(p => [p.id, p]));
      liveMusicHelperRef.current.setWeightedPrompts(promptMap);
      
      // Start playing
      await liveMusicHelperRef.current.play();
      
      // Start audio analysis
      if (audioAnalyserRef.current) {
        audioAnalyserRef.current.start();
      }

    } catch (error) {
      console.error("Failed to connect to Lyria:", error);
      setConnectionError("Failed to connect to music generation service");
      setPlaybackState("stopped");
    }
  };

  const togglePlayback = async () => {
    if (!liveMusicHelperRef.current) return;

    try {
      await liveMusicHelperRef.current.playPause();
    } catch (error) {
      console.error("Playback error:", error);
      setConnectionError("Playback failed");
    }
  };

  const stopPlayback = () => {
    if (liveMusicHelperRef.current) {
      liveMusicHelperRef.current.stop();
    }
    if (audioAnalyserRef.current) {
      audioAnalyserRef.current.stop();
    }
  };

  // Update prompts in Live Music Helper when they change
  useEffect(() => {
    if (liveMusicHelperRef.current && playbackState !== "stopped") {
      const promptMap = new Map(prompts.map(p => [p.id, p]));
      liveMusicHelperRef.current.setWeightedPrompts(promptMap);
    }
  }, [prompts, playbackState]);

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
          className="w-full max-w-7xl h-[90vh] bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 rounded-2xl border border-purple-500/30 overflow-hidden relative"
          style={{ background: generateBackground() }}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-purple-500/20 bg-black/20 backdrop-blur-sm">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
                <Disc3 className={`w-5 h-5 text-white ${playbackState === "playing" ? "animate-spin" : ""}`} style={{ animationDuration: "3s" }} />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-white">Advanced DJ Booth</h2>
                <p className="text-purple-200 text-sm">
                  {isConnected ? (
                    <span className="flex items-center gap-1">
                      <Wifi className="w-3 h-3" />
                      Connected to Lyria RealTime
                    </span>
                  ) : (
                    <span className="flex items-center gap-1">
                      <WifiOff className="w-3 h-3" />
                      Disconnected
                    </span>
                  )}
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
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

          {/* Error Display */}
          {connectionError && (
            <div className="bg-red-500/20 border border-red-500/50 text-red-200 p-3 m-4 rounded-lg">
              {connectionError}
            </div>
          )}

          {/* Main Content */}
          <div className="flex h-[calc(100%-140px)]">
            {/* Left Panel - Prompts Grid */}
            <div className="flex-1 p-6 overflow-y-auto">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-white">Prompt Controllers</h3>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={resetAllPrompts}
                    className="text-purple-200 border-purple-500/50 hover:bg-purple-500/20"
                  >
                    <RotateCcw className="w-3 h-3 mr-1" />
                    Reset
                  </Button>
                  {showMidiSettings && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={getMidiDevices}
                      className="text-purple-200 border-purple-500/50 hover:bg-purple-500/20"
                    >
                      <Radio className="w-3 h-3 mr-1" />
                      Scan MIDI
                    </Button>
                  )}
                </div>
              </div>
              
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {prompts.map((prompt) => (
                  <Card
                    key={prompt.id}
                    className={`bg-black/20 backdrop-blur-sm border-purple-500/30 p-4 flex flex-col items-center justify-center relative overflow-hidden transition-all ${
                      filteredPrompts.has(prompt.text) ? 'opacity-50 border-red-500/50' : ''
                    }`}
                  >
                    {/* Background glow effect */}
                    <div 
                      className="absolute inset-0 opacity-30 blur-xl transition-all duration-300"
                      style={{
                        background: `radial-gradient(circle at center, ${prompt.color}${Math.round(prompt.weight * 255).toString(16).padStart(2, '0')} 0%, transparent 70%)`
                      }}
                    />
                    
                    <div className="relative z-10 w-full flex flex-col items-center">
                      {/* Weight Knob */}
                      <div className="relative mb-3">
                        <div 
                          className="w-16 h-16 rounded-full border-4 flex items-center justify-center relative cursor-pointer group"
                          style={{ 
                            borderColor: prompt.color,
                            background: `conic-gradient(${prompt.color} ${prompt.weight * 180}deg, transparent ${prompt.weight * 180}deg)`
                          }}
                          onWheel={(e) => {
                            e.preventDefault();
                            const delta = e.deltaY * -0.01;
                            const newWeight = Math.max(0, Math.min(2, prompt.weight + delta));
                            updatePrompt(prompt.id, { weight: newWeight });
                          }}
                        >
                          <div className="w-12 h-12 bg-black/50 rounded-full flex items-center justify-center">
                            <span className="text-white text-xs font-mono">
                              {Math.round(prompt.weight * 50)}
                            </span>
                          </div>
                          
                          {/* Audio level indicator */}
                          {prompt.weight > 0 && (
                            <div 
                              className="absolute inset-0 rounded-full border-2 transition-all duration-100"
                              style={{
                                borderColor: prompt.color,
                                transform: `scale(${1 + (audioLevel * prompt.weight * 0.5)})`
                              }}
                            />
                          )}
                        </div>
                      </div>

                      {/* Prompt Text */}
                      <input
                        type="text"
                        value={prompt.text}
                        onChange={(e) => updatePrompt(prompt.id, { text: e.target.value })}
                        className="bg-black/50 text-white text-xs text-center rounded px-2 py-1 w-full border border-purple-500/30 focus:border-purple-400 focus:outline-none mb-2"
                        placeholder="Enter prompt..."
                      />

                      {/* Weight Slider */}
                      <div className="w-full mb-2">
                        <Slider
                          value={[prompt.weight]}
                          onValueChange={(value) => updatePrompt(prompt.id, { weight: value[0] })}
                          max={2}
                          step={0.01}
                          className="w-full"
                        />
                      </div>

                      {/* MIDI CC Controls */}
                      {showMidiSettings && (
                        <div className="w-full space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-xs text-purple-200">CC: {prompt.midiCC}</span>
                            <Button
                              variant={learnMode[prompt.id] ? "destructive" : "outline"}
                              size="sm"
                              onClick={() => toggleLearnMode(prompt.id)}
                              className="text-xs px-2 py-1 h-6"
                            >
                              {learnMode[prompt.id] ? "Learning..." : "Learn"}
                            </Button>
                          </div>
                          <Input
                            type="number"
                            value={prompt.midiCC}
                            onChange={(e) => updatePrompt(prompt.id, { midiCC: parseInt(e.target.value) || 0 })}
                            min={0}
                            max={127}
                            className="h-6 text-xs"
                          />
                        </div>
                      )}
                    </div>
                  </Card>
                ))}
              </div>
            </div>

            {/* Right Panel - Controls & Visualization */}
            <div className="w-80 border-l border-purple-500/20 p-6 flex flex-col bg-black/10 backdrop-blur-sm">
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
                  className="w-full rounded bg-black/30"
                />
                <div className="mt-2 text-xs text-purple-200">
                  Level: {Math.round(audioLevel * 100)}%
                </div>
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
                    onClick={stopPlayback}
                    variant="outline"
                    className="text-white border-purple-500/50 hover:bg-purple-500/20"
                  >
                    <Square className="w-4 h-4" />
                  </Button>
                </div>

                <div className="text-center text-sm text-purple-200">
                  {playbackState === "playing" && `${prompts.filter(p => p.weight > 0).length} active prompts`}
                  {playbackState === "stopped" && "Ready to play"}
                  {playbackState === "loading" && "Connecting..."}
                  {playbackState === "paused" && "Paused"}
                </div>
              </Card>

              {/* MIDI Settings */}
              {showMidiSettings && (
                <Card className="bg-black/20 backdrop-blur-sm border-purple-500/30 p-4 mb-4">
                  <h4 className="text-white font-semibold mb-3">MIDI Settings</h4>
                  <div className="space-y-2">
                    <Label className="text-purple-200 text-sm">MIDI Device</Label>
                    <Select
                      value={activeMidiInputId || ""}
                      onValueChange={(value) => {
                        setActiveMidiInputId(value);
                        if (midiDispatcherRef.current) {
                          midiDispatcherRef.current.activeMidiInputId = value;
                        }
                      }}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="No devices" />
                      </SelectTrigger>
                      <SelectContent>
                        {midiInputIds.length > 0 ? (
                          midiInputIds.map(id => (
                            <SelectItem key={id} value={id}>
                              {midiDispatcherRef.current?.getDeviceName(id) || id}
                            </SelectItem>
                          ))
                        ) : (
                          <SelectItem value="none" disabled>No devices found</SelectItem>
                        )}
                      </SelectContent>
                    </Select>
                  </div>
                </Card>
              )}

              {/* Master Controls */}
              <Card className="bg-black/20 backdrop-blur-sm border-purple-500/30 p-4">
                <h4 className="text-white font-semibold mb-3 flex items-center gap-2">
                  <Volume2 className="w-4 h-4" />
                  Master
                </h4>
                
                <div className="space-y-3">
                  <div>
                    <Label className="text-sm text-purple-200 mb-1 block">Volume</Label>
                    <Slider
                      value={[masterVolume]}
                      onValueChange={(value) => setMasterVolume(value[0])}
                      max={100}
                      step={1}
                      className="w-full"
                    />
                    <div className="text-xs text-purple-200 text-center mt-1">{masterVolume}%</div>
                  </div>

                  <div className="flex items-center justify-between pt-2">
                    <div className="text-xs text-purple-200">
                      {isConnected ? "🟢 Connected" : "🔴 Disconnected"}
                    </div>
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