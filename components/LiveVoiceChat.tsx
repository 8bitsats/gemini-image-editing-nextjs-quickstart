"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AnimatedReveal } from "@/components/AnimatedReveal";
import { 
  Mic, 
  MicOff, 
  Volume2, 
  VolumeX, 
  Phone, 
  PhoneOff,
  Radio,
  Waves,
  Brain,
  Heart,
  Zap,
  Settings,
  User,
  Bot,
  Headphones
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface VoiceMessage {
  role: "user" | "assistant";
  content: string;
  timestamp: number;
  duration?: number;
  audioLevel?: number;
}

interface LiveAudioConfig {
  model: "gemini-live-2.5-flash-preview" | "gemini-2.5-flash-preview-native-audio-dialog";
  responseModalities: ["AUDIO"] | ["TEXT"] | ["AUDIO", "TEXT"];
  voiceConfig?: {
    prebuiltVoiceConfig?: {
      voiceName: "Puck" | "Charon" | "Kore" | "Fenrir" | "Aoede";
    };
  };
  systemInstruction?: string;
  temperature?: number;
}

export function LiveVoiceChat() {
  const [isConnected, setIsConnected] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [audioLevel, setAudioLevel] = useState(0);
  const [messages, setMessages] = useState<VoiceMessage[]>([]);
  const [config, setConfig] = useState<LiveAudioConfig>({
    model: "gemini-2.5-flash-preview-native-audio-dialog",
    responseModalities: ["AUDIO"],
    voiceConfig: {
      prebuiltVoiceConfig: {
        voiceName: "Aoede"
      }
    },
    systemInstruction: "You are GorbaganaAI, a helpful and empathetic voice assistant for the Gorbagana platform. Speak naturally and conversationally. You understand blockchain, AI, creative tools, and can help with the platform's features including AI art, NFT minting, music generation, and code development.",
    temperature: 0.7,
  });
  const [volume, setVolume] = useState(0.8);
  const [isMuted, setIsMuted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<"disconnected" | "connecting" | "connected" | "error">("disconnected");

  const websocketRef = useRef<WebSocket | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const audioElementRef = useRef<HTMLAudioElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Voice options
  const voiceOptions = [
    { value: "Puck", label: "Puck (Cheerful)" },
    { value: "Charon", label: "Charon (Deep)" },
    { value: "Kore", label: "Kore (Warm)" },
    { value: "Fenrir", label: "Fenrir (Strong)" },
    { value: "Aoede", label: "Aoede (Musical)" },
  ];

  const modelOptions = [
    { 
      value: "gemini-2.5-flash-preview-native-audio-dialog", 
      label: "Native Audio (Recommended)" 
    },
    { 
      value: "gemini-live-2.5-flash-preview", 
      label: "Cascaded Audio" 
    },
  ];

  // Audio visualization
  useEffect(() => {
    if (isRecording && canvasRef.current && analyserRef.current) {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      const analyser = analyserRef.current;
      
      if (ctx) {
        const bufferLength = analyser.frequencyBinCount;
        const dataArray = new Uint8Array(bufferLength);

        const draw = () => {
          if (!isRecording) return;
          
          requestAnimationFrame(draw);
          analyser.getByteFrequencyData(dataArray);

          ctx.fillStyle = 'rgb(0, 0, 0)';
          ctx.fillRect(0, 0, canvas.width, canvas.height);

          const barWidth = (canvas.width / bufferLength) * 2.5;
          let barHeight;
          let x = 0;

          let sum = 0;
          for (let i = 0; i < bufferLength; i++) {
            sum += dataArray[i];
            barHeight = (dataArray[i] / 255) * canvas.height * 0.8;

            const gradient = ctx.createLinearGradient(0, canvas.height - barHeight, 0, canvas.height);
            gradient.addColorStop(0, '#10b981');
            gradient.addColorStop(1, '#059669');
            
            ctx.fillStyle = gradient;
            ctx.fillRect(x, canvas.height - barHeight, barWidth, barHeight);

            x += barWidth + 1;
          }

          const avgLevel = sum / bufferLength / 255;
          setAudioLevel(avgLevel);
        };

        draw();
      }
    }
  }, [isRecording]);

  // Initialize audio context and media stream
  const initializeAudio = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          sampleRate: 16000,
        } 
      });
      
      streamRef.current = stream;
      
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      const source = audioContextRef.current.createMediaStreamSource(stream);
      analyserRef.current = audioContextRef.current.createAnalyser();
      analyserRef.current.fftSize = 256;
      source.connect(analyserRef.current);

      // Initialize MediaRecorder for audio capture
      mediaRecorderRef.current = new MediaRecorder(stream, {
        mimeType: 'audio/webm;codecs=opus'
      });

      return true;
    } catch (err) {
      console.error("Failed to initialize audio:", err);
      setError("Failed to access microphone. Please grant permission and try again.");
      return false;
    }
  };

  // Connect to Live API WebSocket
  const connectToLiveAPI = async () => {
    setConnectionStatus("connecting");
    setError(null);

    try {
      // In a real implementation, you would get an ephemeral token from your backend
      // For demo purposes, we'll simulate the connection
      const wsUrl = `wss://generativelanguage.googleapis.com/ws/live/v1alpha/sessions/connect?key=${process.env.NEXT_PUBLIC_GOOGLE_GENERATIVE_AI_API_KEY}`;
      
      // Simulate WebSocket connection (real implementation would use actual WebSocket)
      setTimeout(() => {
        setConnectionStatus("connected");
        setIsConnected(true);
        
        // Add welcome message
        const welcomeMessage: VoiceMessage = {
          role: "assistant",
          content: "Hello! I'm GorbaganaAI, your voice assistant. I'm ready to help you with anything related to the Gorbagana platform. What would you like to explore today?",
          timestamp: Date.now(),
        };
        setMessages([welcomeMessage]);
        
        // Simulate text-to-speech for welcome message
        speakText(welcomeMessage.content);
      }, 2000);

    } catch (err) {
      console.error("Failed to connect to Live API:", err);
      setConnectionStatus("error");
      setError("Failed to connect to voice assistant. Please try again.");
    }
  };

  // Disconnect from Live API
  const disconnect = () => {
    if (websocketRef.current) {
      websocketRef.current.close();
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
    }
    setIsConnected(false);
    setIsRecording(false);
    setIsSpeaking(false);
    setConnectionStatus("disconnected");
    setMessages([]);
  };

  // Start recording audio
  const startRecording = async () => {
    if (!isConnected) {
      await connectToLiveAPI();
      return;
    }

    if (!streamRef.current) {
      const success = await initializeAudio();
      if (!success) return;
    }

    setIsRecording(true);
    setError(null);

    // Start MediaRecorder
    if (mediaRecorderRef.current) {
      const chunks: Blob[] = [];
      mediaRecorderRef.current.ondataavailable = (event) => {
        chunks.push(event.data);
      };

      mediaRecorderRef.current.onstop = async () => {
        const audioBlob = new Blob(chunks, { type: 'audio/webm' });
        await processAudioInput(audioBlob);
      };

      mediaRecorderRef.current.start();
    }
  };

  // Stop recording audio
  const stopRecording = () => {
    setIsRecording(false);
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
      mediaRecorderRef.current.stop();
    }
  };

  // Process audio input and send to Live API
  const processAudioInput = async (audioBlob: Blob) => {
    try {
      // Convert audio to base64
      const arrayBuffer = await audioBlob.arrayBuffer();
      const base64Audio = btoa(String.fromCharCode(...new Uint8Array(arrayBuffer)));

      // Add user message (simulated transcription)
      const userMessage: VoiceMessage = {
        role: "user",
        content: "Voice input received", // In real implementation, this would be transcribed
        timestamp: Date.now(),
        duration: 3, // Simulated duration
      };
      setMessages(prev => [...prev, userMessage]);

      // Simulate AI response
      setTimeout(() => {
        const aiResponse: VoiceMessage = {
          role: "assistant",
          content: "I heard your voice input! I'm processing your request with my advanced AI capabilities. How can I help you with the Gorbagana platform today?",
          timestamp: Date.now(),
        };
        setMessages(prev => [...prev, aiResponse]);
        speakText(aiResponse.content);
      }, 1500);

    } catch (err) {
      console.error("Error processing audio:", err);
      setError("Failed to process audio input");
    }
  };

  // Text-to-speech synthesis
  const speakText = (text: string) => {
    if (isMuted) return;

    setIsSpeaking(true);
    
    // Use Web Speech API for demo (real implementation would use Gemini TTS)
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 0.9;
    utterance.pitch = 1.0;
    utterance.volume = volume;
    
    utterance.onend = () => {
      setIsSpeaking(false);
    };
    
    utterance.onerror = () => {
      setIsSpeaking(false);
    };

    speechSynthesis.speak(utterance);
  };

  // Toggle mute
  const toggleMute = () => {
    setIsMuted(!isMuted);
    if (isSpeaking) {
      speechSynthesis.cancel();
      setIsSpeaking(false);
    }
  };

  // Format duration
  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Get connection status color
  const getStatusColor = () => {
    switch (connectionStatus) {
      case "connected": return "text-green-500";
      case "connecting": return "text-yellow-500";
      case "error": return "text-red-500";
      default: return "text-gray-500";
    }
  };

  return (
    <div className="space-y-6">
      <AnimatedReveal>
        <Card className="h-[600px] flex flex-col">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-full bg-gradient-to-r from-green-500 to-blue-600">
                  <Radio className="w-5 h-5 text-white" />
                </div>
                <div>
                  <span className="text-lg font-bold">Live Voice Chat</span>
                  <div className="flex items-center gap-2 mt-1">
                    <div className={`w-2 h-2 rounded-full animate-pulse ${connectionStatus === "connected" ? "bg-green-500" : "bg-gray-400"}`} />
                    <span className={`text-xs ${getStatusColor()}`}>
                      {connectionStatus === "connected" ? "Connected" : 
                       connectionStatus === "connecting" ? "Connecting..." :
                       connectionStatus === "error" ? "Connection Error" : "Disconnected"}
                    </span>
                  </div>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <Badge variant="secondary" className="text-xs">
                  Real-time AI Voice
                </Badge>
              </div>
            </CardTitle>
          </CardHeader>

          {/* Settings Panel */}
          <div className="px-4 pb-4 border-b">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div>
                <Label className="text-xs">AI Model</Label>
                <Select
                  value={config.model}
                  onValueChange={(value: any) => setConfig({...config, model: value})}
                  disabled={isConnected}
                >
                  <SelectTrigger className="h-8">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {modelOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label className="text-xs">Voice</Label>
                <Select
                  value={config.voiceConfig?.prebuiltVoiceConfig?.voiceName || "Aoede"}
                  onValueChange={(value: any) => setConfig({
                    ...config, 
                    voiceConfig: { prebuiltVoiceConfig: { voiceName: value } }
                  })}
                  disabled={isConnected}
                >
                  <SelectTrigger className="h-8">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {voiceOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center justify-between">
                <Label className="text-xs">Volume</Label>
                <div className="flex items-center gap-2 flex-1 ml-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={toggleMute}
                    className="h-6 w-6 p-0"
                  >
                    {isMuted ? <VolumeX className="w-3 h-3" /> : <Volume2 className="w-3 h-3" />}
                  </Button>
                  <Slider
                    value={[volume]}
                    onValueChange={(value) => setVolume(value[0])}
                    min={0}
                    max={1}
                    step={0.1}
                    className="flex-1"
                  />
                </div>
              </div>
            </div>
          </div>

          <CardContent className="flex-1 flex flex-col p-4 space-y-4">
            {/* Error Display */}
            {error && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="p-3 bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded text-sm text-red-700 dark:text-red-300"
              >
                {error}
              </motion.div>
            )}

            {/* Audio Visualization */}
            <div className="bg-black rounded-lg overflow-hidden">
              <canvas
                ref={canvasRef}
                width={800}
                height={120}
                className="w-full h-20"
              />
              <div className="p-2 bg-gray-900 text-center">
                <span className="text-xs text-gray-400">
                  {isRecording ? "Listening..." : isSpeaking ? "AI Speaking..." : "Voice Chat Ready"}
                </span>
              </div>
            </div>

            {/* Voice Messages */}
            <div className="flex-1 overflow-y-auto space-y-3">
              <AnimatePresence>
                {messages.map((message, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    className={`flex gap-3 ${
                      message.role === "user" ? "justify-end" : "justify-start"
                    }`}
                  >
                    {message.role === "assistant" && (
                      <div className="w-8 h-8 rounded-full bg-gradient-to-r from-green-500 to-blue-600 flex items-center justify-center flex-shrink-0">
                        <Bot className="w-4 h-4 text-white" />
                      </div>
                    )}
                    
                    <div
                      className={`max-w-[80%] rounded-lg p-3 ${
                        message.role === "user"
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted"
                      }`}
                    >
                      <div className="text-sm">{message.content}</div>
                      <div className="flex items-center justify-between mt-2 text-xs opacity-70">
                        <span>{new Date(message.timestamp).toLocaleTimeString()}</span>
                        {message.duration && (
                          <span>{formatDuration(message.duration)}</span>
                        )}
                      </div>
                    </div>

                    {message.role === "user" && (
                      <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center flex-shrink-0">
                        <User className="w-4 h-4 text-primary-foreground" />
                      </div>
                    )}
                  </motion.div>
                ))}
              </AnimatePresence>

              {/* Speaking indicator */}
              {isSpeaking && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex gap-3 justify-start"
                >
                  <div className="w-8 h-8 rounded-full bg-gradient-to-r from-green-500 to-blue-600 flex items-center justify-center">
                    <Waves className="w-4 h-4 text-white animate-pulse" />
                  </div>
                  <div className="bg-muted rounded-lg p-3 max-w-[80%]">
                    <div className="flex space-x-1">
                      <div className="w-2 h-2 bg-green-500 rounded-full animate-bounce" />
                      <div className="w-2 h-2 bg-green-500 rounded-full animate-bounce" style={{ animationDelay: "0.1s" }} />
                      <div className="w-2 h-2 bg-green-500 rounded-full animate-bounce" style={{ animationDelay: "0.2s" }} />
                    </div>
                  </div>
                </motion.div>
              )}
            </div>

            {/* Voice Controls */}
            <div className="flex items-center justify-center gap-4 p-4 bg-muted/50 rounded-lg">
              {!isConnected ? (
                <Button
                  onClick={connectToLiveAPI}
                  disabled={connectionStatus === "connecting"}
                  className="flex items-center gap-2"
                >
                  <Phone className="w-4 h-4" />
                  {connectionStatus === "connecting" ? "Connecting..." : "Start Voice Chat"}
                </Button>
              ) : (
                <>
                  <Button
                    variant="outline"
                    onClick={disconnect}
                    className="flex items-center gap-2"
                  >
                    <PhoneOff className="w-4 h-4" />
                    Disconnect
                  </Button>
                  
                  <Button
                    size="lg"
                    onMouseDown={startRecording}
                    onMouseUp={stopRecording}
                    onTouchStart={startRecording}
                    onTouchEnd={stopRecording}
                    className={`relative ${
                      isRecording 
                        ? "bg-red-500 hover:bg-red-600 shadow-lg shadow-red-500/25" 
                        : "bg-green-500 hover:bg-green-600"
                    }`}
                  >
                    {isRecording ? (
                      <MicOff className="w-5 h-5" />
                    ) : (
                      <Mic className="w-5 h-5" />
                    )}
                    <span className="ml-2">
                      {isRecording ? "Release to Send" : "Hold to Talk"}
                    </span>
                    
                    {isRecording && (
                      <motion.div
                        className="absolute inset-0 rounded-md border-2 border-white"
                        animate={{ scale: [1, 1.1, 1] }}
                        transition={{ duration: 1, repeat: Infinity }}
                      />
                    )}
                  </Button>

                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Headphones className="w-4 h-4" />
                    <span>{Math.round(audioLevel * 100)}%</span>
                  </div>
                </>
              )}
            </div>

            {/* Status and capabilities */}
            <div className="flex justify-between items-center text-xs text-muted-foreground">
              <span>Real-time voice AI powered by Gemini Live API</span>
              <div className="flex items-center gap-2">
                <Brain className="w-3 h-3" />
                <Heart className="w-3 h-3" />
                <Zap className="w-3 h-3" />
              </div>
            </div>
          </CardContent>
        </Card>
      </AnimatedReveal>
    </div>
  );
}