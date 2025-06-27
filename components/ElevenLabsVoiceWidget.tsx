"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Mic, MicOff, X, Minimize2, Maximize2 } from "lucide-react";
import { cn } from "@/lib/utils";

export function ElevenLabsVoiceWidget() {
  const [isMinimized, setIsMinimized] = useState(false);
  const [isHidden, setIsHidden] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    // Load ElevenLabs script if not already loaded
    if (!document.querySelector('script[src*="elevenlabs"]')) {
      const script = document.createElement("script");
      script.src = "https://unpkg.com/@elevenlabs/convai-widget-embed";
      script.async = true;
      script.type = "text/javascript";
      document.head.appendChild(script);
    }
  }, []);

  if (!isMounted || isHidden) return null;

  return (
    <div
      className={cn(
        "fixed bottom-4 left-1/2 transform -translate-x-1/2 z-50 transition-all duration-300",
        isMinimized ? "w-auto" : "w-[350px] sm:w-[400px]"
      )}
    >
      <div className="bg-background/95 backdrop-blur-lg border rounded-lg shadow-lg">
        {/* Header */}
        <div className="flex items-center justify-between p-3 border-b">
          <div className="flex items-center gap-2">
            <Mic className="w-4 h-4 text-primary" />
            <span className="text-sm font-medium">Voice Assistant</span>
          </div>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={() => setIsMinimized(!isMinimized)}
            >
              {isMinimized ? (
                <Maximize2 className="h-3 w-3" />
              ) : (
                <Minimize2 className="h-3 w-3" />
              )}
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={() => setIsHidden(true)}
            >
              <X className="h-3 w-3" />
            </Button>
          </div>
        </div>

        {/* Content */}
        <div
          className={cn(
            "transition-all duration-300 overflow-hidden",
            isMinimized ? "h-0" : "h-auto"
          )}
        >
          <div className="p-4">
            <div className="elevenlabs-widget-container">
              <div dangerouslySetInnerHTML={{ 
                __html: '<elevenlabs-convai agent-id="agent_01jyqnyjhjf209zwa369bwn9s2"></elevenlabs-convai>' 
              }} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Floating button to show widget when hidden
export function VoiceWidgetToggle({ onShow }: { onShow: () => void }) {
  return (
    <Button
      variant="default"
      size="icon"
      className="fixed bottom-4 right-4 z-50 rounded-full shadow-lg bg-primary hover:bg-primary/90"
      onClick={onShow}
    >
      <Mic className="h-4 w-4" />
    </Button>
  );
}