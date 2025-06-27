"use client";

import { useState, useEffect, useRef } from "react";

// Extend Window interface for webkit AudioContext
declare global {
  interface Window {
    webkitAudioContext: typeof AudioContext;
  }
}
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Mic, 
  MicOff, 
  Wallet, 
  Volume2,
  VolumeX 
} from "lucide-react";
import { useWallet } from "@solana/wallet-adapter-react";
import { WalletName } from "@solana/wallet-adapter-base";

interface VoiceWalletConnectProps {
  onClose?: () => void;
}

interface LiveAPISession {
  send: (message: any) => void;
  close: () => void;
}

export function VoiceWalletConnect({ onClose }: VoiceWalletConnectProps) {
  const [isListening, setIsListening] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [status, setStatus] = useState<string>("Ready to connect");
  const [lastCommand, setLastCommand] = useState<string>("");
  const [audioEnabled, setAudioEnabled] = useState(true);
  const [session, setSession] = useState<LiveAPISession | null>(null);
  
  const { 
    wallet, 
    publicKey, 
    connected, 
    connect, 
    disconnect,
    select,
    wallets
  } = useWallet();
  
  const audioContextRef = useRef<AudioContext | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Function definitions for Live API
  const walletFunctions = [
    {
      name: "connect_wallet",
      description: "Connect to a Solana wallet",
      parameters: {
        type: "object",
        properties: {
          walletName: {
            type: "string",
            description: "Name of the wallet to connect (phantom, solflare, backpack, etc.)",
            enum: ["phantom", "solflare", "backpack", "trust", "coinbase"]
          }
        },
        required: ["walletName"]
      }
    },
    {
      name: "disconnect_wallet",
      description: "Disconnect the current wallet",
      parameters: {
        type: "object",
        properties: {}
      }
    },
    {
      name: "get_wallet_status",
      description: "Get current wallet connection status and public key",
      parameters: {
        type: "object",
        properties: {}
      }
    },
    {
      name: "list_available_wallets",
      description: "List all available wallet adapters",
      parameters: {
        type: "object",
        properties: {}
      }
    }
  ];

  const initializeLiveAPI = async () => {
    try {
      setStatus("Initializing voice connection...");
      
      // Check browser compatibility
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error("getUserMedia not supported in this browser");
      }
      
      if (!window.AudioContext && !window.webkitAudioContext) {
        throw new Error("AudioContext not supported in this browser");
      }
      
      if (!window.WebSocket) {
        throw new Error("WebSocket not supported in this browser");
      }
      
      // Check if API key is available
      const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY;
      if (!apiKey) {
        throw new Error("Gemini API key not found. Please add NEXT_PUBLIC_GEMINI_API_KEY to your environment variables.");
      }
      
      // Get microphone access
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          channelCount: 1,
          sampleRate: 16000,
          echoCancellation: true,
          noiseSuppression: true
        } 
      });
      streamRef.current = stream;

      // Initialize audio context
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      audioContextRef.current = new AudioCtx({ sampleRate: 16000 });
      
      // Create WebSocket connection to Live API
      const wsUrl = `wss://generativelanguage.googleapis.com/ws/google.ai.generativelanguage.v1alpha.GenerativeService.BidiGenerateContent?key=${apiKey}`;
      const ws = new WebSocket(wsUrl);
      
      ws.onopen = () => {
        setStatus("Connected to voice assistant");
        setIsConnected(true);
        
        // Send initial setup message
        const setupMessage = {
          setup: {
            model: "models/gemini-2.0-flash-exp",
            generation_config: {
              response_modalities: ["AUDIO"],
              speech_config: {
                voice_config: {
                  prebuilt_voice_config: {
                    voice_name: "Aoede"
                  }
                }
              }
            },
            system_instruction: {
              parts: [{
                text: `You are a voice assistant for Solana wallet operations on the Gorbagana platform. 
                
You can help users:
- Connect to wallets (Phantom, Solflare, Backpack, Trust, Coinbase)
- Disconnect wallets
- Check wallet status
- List available wallets

When users give voice commands, use the appropriate functions to execute wallet operations.
Keep responses brief and confirm actions clearly.

Available voice commands:
- "Connect to [wallet name]" - connects to specified wallet
- "Disconnect wallet" - disconnects current wallet  
- "Check wallet status" - shows current connection status
- "List wallets" - shows available wallet options`
              }]
            },
            tools: [{
              function_declarations: walletFunctions
            }]
          }
        };
        
        ws.send(JSON.stringify(setupMessage));
      };
      
      ws.onmessage = async (event) => {
        const data = JSON.parse(event.data);
        
        if (data.serverContent?.modelTurn?.parts) {
          for (const part of data.serverContent.modelTurn.parts) {
            // Handle function calls
            if (part.functionCall) {
              await handleFunctionCall(part.functionCall);
            }
            
            // Handle audio responses
            if (part.inlineData?.mimeType === "audio/pcm" && audioEnabled) {
              await playAudioResponse(part.inlineData.data);
            }
          }
        }
      };
      
      ws.onerror = (error) => {
        console.error("WebSocket error:", error);
        setStatus("Connection error");
        setIsConnected(false);
      };
      
      ws.onclose = () => {
        setIsConnected(false);
        setStatus("Disconnected");
      };
      
      const mockSession: LiveAPISession = {
        send: (message) => ws.send(JSON.stringify(message)),
        close: () => ws.close()
      };
      
      setSession(mockSession);
      
    } catch (error) {
      console.error("Failed to initialize Live API:", error);
      setStatus("Failed to connect - check microphone permissions");
    }
  };

  const handleFunctionCall = async (functionCall: any) => {
    const { name, args } = functionCall;
    let result = { success: false, message: "" };
    
    try {
      switch (name) {
        case "connect_wallet":
          const walletName = args.walletName?.toLowerCase();
          const targetWallet = wallets.find(w => 
            w.adapter.name.toLowerCase().includes(walletName) ||
            walletName.includes(w.adapter.name.toLowerCase().split(' ')[0])
          );
          
          if (targetWallet) {
            select(targetWallet.adapter.name as WalletName);
            await connect();
            result = { 
              success: true, 
              message: `Successfully connected to ${targetWallet.adapter.name}` 
            };
            setLastCommand(`Connected to ${targetWallet.adapter.name}`);
          } else {
            result = { 
              success: false, 
              message: `Wallet "${walletName}" not found. Available wallets: ${wallets.map(w => w.adapter.name).join(', ')}` 
            };
          }
          break;
          
        case "disconnect_wallet":
          if (connected) {
            await disconnect();
            result = { success: true, message: "Wallet disconnected successfully" };
            setLastCommand("Disconnected wallet");
          } else {
            result = { success: false, message: "No wallet is currently connected" };
          }
          break;
          
        case "get_wallet_status":
          if (connected && publicKey) {
            result = { 
              success: true, 
              message: `Connected to ${wallet?.adapter.name}. Public key: ${publicKey.toString().slice(0, 8)}...${publicKey.toString().slice(-8)}` 
            };
          } else {
            result = { success: true, message: "No wallet connected" };
          }
          break;
          
        case "list_available_wallets":
          const availableWallets = wallets.map(w => w.adapter.name).join(', ');
          result = { 
            success: true, 
            message: `Available wallets: ${availableWallets}` 
          };
          break;
          
        default:
          result = { success: false, message: `Unknown function: ${name}` };
      }
    } catch (error) {
      result = { 
        success: false, 
        message: `Error executing ${name}: ${error instanceof Error ? error.message : 'Unknown error'}` 
      };
    }
    
    // Send function response back to Live API
    if (session) {
      session.send({
        clientContent: {
          turns: [{
            role: "user",
            parts: [{
              functionResponse: {
                name: name,
                response: result
              }
            }]
          }]
        }
      });
    }
    
    setStatus(result.message);
  };

  const playAudioResponse = async (audioData: string) => {
    if (!audioContextRef.current || !audioEnabled) return;
    
    try {
      // Resume audio context if suspended
      if (audioContextRef.current.state === 'suspended') {
        await audioContextRef.current.resume();
      }
      
      const audioBytes = Uint8Array.from(atob(audioData), c => c.charCodeAt(0));
      const audioBuffer = await audioContextRef.current.decodeAudioData(audioBytes.buffer);
      const source = audioContextRef.current.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(audioContextRef.current.destination);
      source.start();
    } catch (error) {
      console.error("Error playing audio:", error);
      setStatus("Audio playback error");
    }
  };

  const startListening = async () => {
    if (!session || !streamRef.current) {
      setStatus("No active session or microphone stream");
      return;
    }
    
    setIsListening(true);
    setStatus("Listening for voice commands...");
    
    try {
      // Check MediaRecorder support
      if (!window.MediaRecorder) {
        throw new Error("MediaRecorder not supported in this browser");
      }
      
      const mediaRecorder = new MediaRecorder(streamRef.current, {
        mimeType: 'audio/webm;codecs=opus'
      });
      const audioChunks: Blob[] = [];
      
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunks.push(event.data);
        }
      };
      
      mediaRecorder.onstop = async () => {
        try {
          if (audioChunks.length === 0) {
            setStatus("No audio data recorded");
            setIsListening(false);
            return;
          }
          
          const audioBlob = new Blob(audioChunks, { type: 'audio/webm' });
          const arrayBuffer = await audioBlob.arrayBuffer();
          const base64Audio = btoa(String.fromCharCode(...new Uint8Array(arrayBuffer)));
          
          // Send audio to Live API
          if (session) {
            session.send({
              clientContent: {
                turns: [{
                  role: "user",
                  parts: [{
                    inlineData: {
                      mimeType: "audio/webm",
                      data: base64Audio
                    }
                  }]
                }]
              }
            });
            setStatus("Processing voice command...");
          }
        } catch (error) {
          console.error("Error processing audio:", error);
          setStatus("Error processing audio");
        }
        setIsListening(false);
      };
      
      mediaRecorder.onerror = (event) => {
        console.error("MediaRecorder error:", event);
        setStatus("Recording error occurred");
        setIsListening(false);
      };
      
      mediaRecorder.start();
      
      // Auto-stop after 5 seconds
      setTimeout(() => {
        if (mediaRecorder.state === "recording") {
          mediaRecorder.stop();
        }
      }, 5000);
      
    } catch (error) {
      console.error("Error starting voice recording:", error);
      setIsListening(false);
      setStatus(`Recording error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const stopListening = () => {
    setIsListening(false);
    setStatus("Stopped listening");
  };

  useEffect(() => {
    return () => {
      if (session) {
        session.close();
      }
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
    };
  }, [session]);

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Wallet className="w-5 h-5" />
          Voice Wallet Control
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Connection Status */}
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">Voice Assistant:</span>
          <Badge variant={isConnected ? "default" : "secondary"}>
            {isConnected ? "Connected" : "Disconnected"}
          </Badge>
        </div>
        
        {/* Wallet Status */}
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">Wallet:</span>
          <Badge variant={connected ? "default" : "outline"}>
            {connected ? `${wallet?.adapter.name}` : "Not Connected"}
          </Badge>
        </div>
        
        {/* Public Key Display */}
        {connected && publicKey && (
          <div className="p-3 bg-muted rounded-lg">
            <p className="text-xs font-mono break-all">
              {publicKey.toString()}
            </p>
          </div>
        )}
        
        {/* Status Message */}
        <div className="p-3 bg-muted rounded-lg">
          <p className="text-sm text-muted-foreground">{status}</p>
          {lastCommand && (
            <p className="text-xs text-green-600 mt-1">Last: {lastCommand}</p>
          )}
        </div>
        
        {/* Controls */}
        <div className="flex gap-2">
          {!isConnected ? (
            <Button onClick={initializeLiveAPI} className="flex-1">
              <Mic className="w-4 h-4 mr-2" />
              Start Voice Assistant
            </Button>
          ) : (
            <>
              <Button
                onClick={isListening ? stopListening : startListening}
                variant={isListening ? "destructive" : "default"}
                className="flex-1"
              >
                {isListening ? (
                  <>
                    <MicOff className="w-4 h-4 mr-2" />
                    Stop Listening
                  </>
                ) : (
                  <>
                    <Mic className="w-4 h-4 mr-2" />
                    Start Listening
                  </>
                )}
              </Button>
              
              <Button
                onClick={() => setAudioEnabled(!audioEnabled)}
                variant="outline"
                size="icon"
              >
                {audioEnabled ? (
                  <Volume2 className="w-4 h-4" />
                ) : (
                  <VolumeX className="w-4 h-4" />
                )}
              </Button>
            </>
          )}
        </div>
        
        {/* Voice Commands Help */}
        <div className="text-xs text-muted-foreground space-y-1">
          <p className="font-medium">Voice Commands:</p>
          <ul className="list-disc list-inside space-y-1">
            <li>"Connect to Phantom"</li>
            <li>"Disconnect wallet"</li>
            <li>"Check wallet status"</li>
            <li>"List available wallets"</li>
          </ul>
        </div>
        
        {onClose && (
          <Button variant="outline" onClick={onClose} className="w-full">
            Close
          </Button>
        )}
      </CardContent>
    </Card>
  );
}