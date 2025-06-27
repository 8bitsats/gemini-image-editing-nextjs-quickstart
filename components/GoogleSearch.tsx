"use client";

import { useEffect } from "react";
import { AnimatedReveal } from "@/components/AnimatedReveal";

interface GoogleWindow extends Window {
  google?: {
    search?: {
      cse?: {
        element?: {
          render: (config: { div: string; tag: string }) => void;
        };
      };
    };
  };
}

export function GoogleSearch() {
  useEffect(() => {
    // Ensure the Google CSE script is loaded and rendered
    const googleWindow = window as GoogleWindow;
    if (typeof window !== 'undefined' && googleWindow.google?.search?.cse?.element) {
      try {
        googleWindow.google.search.cse.element.render({
          div: "gcse-search-container",
          tag: "search"
        });
      } catch {
        console.log("Google CSE not ready yet");
      }
    }
  }, []);

  return (
    <AnimatedReveal type="fade" delay={0.1}>
      <div className="w-full mb-4 sm:mb-6 max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
        <div className="bg-background/80 backdrop-blur-sm rounded-lg border border-border/50 p-3 sm:p-4 shadow-sm">
          <div id="gcse-search-container">
            <div className="gcse-search"></div>
          </div>
        </div>
      </div>
    </AnimatedReveal>
  );
}