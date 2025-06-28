"use client";

import { useEffect, useState } from "react";

export function ElevenLabsVoiceWidget() {
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

  if (!isMounted) return null;

  return (
    <div className="fixed bottom-4 left-1/2 transform -translate-x-1/2 z-50">
      <elevenlabs-convai agent-id="agent_01jyqnyjhjf209zwa369bwn9s2"></elevenlabs-convai>
    </div>
  );
}