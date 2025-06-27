"use client";

import { useEffect, useState } from "react";
import { AnimatedReveal } from "@/components/AnimatedReveal";

interface GoogleWindow extends Window {
  google?: {
    search?: {
      cse?: {
        element?: {
          render: (config: { div: string; tag: string }) => void;
          go: () => void;
        };
      };
    };
  };
  __gcse?: {
    parsetags?: string;
    callback?: () => void;
  };
}

export function GoogleSearch() {
  const [isLoaded, setIsLoaded] = useState(false);
  const [retryCount, setRetryCount] = useState(0);

  useEffect(() => {
    const initializeGoogleSearch = () => {
      const googleWindow = window as GoogleWindow;
      
      if (googleWindow.google?.search?.cse?.element) {
        try {
          // Clear any existing search box first
          const container = document.getElementById("gcse-search-container");
          if (container) {
            container.innerHTML = '<div class="gcse-search" data-resultsUrl="/search-results" data-newWindow="false" data-autoSearchOnLoad="false"></div>';
          }
          
          googleWindow.google.search.cse.element.render({
            div: "gcse-search-container",
            tag: "search"
          });
          
          setIsLoaded(true);
          console.log("Google CSE initialized successfully");
        } catch (error) {
          console.log("Google CSE render error:", error);
          
          // Retry mechanism
          if (retryCount < 5) {
            setTimeout(() => {
              setRetryCount(prev => prev + 1);
            }, 1000 * (retryCount + 1));
          }
        }
      } else {
        console.log("Google CSE not ready, retrying...");
        if (retryCount < 10) {
          setTimeout(() => {
            setRetryCount(prev => prev + 1);
          }, 500);
        }
      }
    };

    // Set up global callback for when Google CSE is ready
    const googleWindow = window as GoogleWindow;
    if (!googleWindow.__gcse) {
      googleWindow.__gcse = {};
    }
    googleWindow.__gcse.parsetags = 'explicit';
    googleWindow.__gcse.callback = initializeGoogleSearch;

    // Try to initialize immediately if already loaded
    if (googleWindow.google?.search?.cse?.element) {
      initializeGoogleSearch();
    }

    // Also try after a delay in case script loads later
    const timeoutId = setTimeout(initializeGoogleSearch, 1000);

    return () => {
      clearTimeout(timeoutId);
    };
  }, [retryCount]);

  // Force re-initialization when component becomes visible
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden && !isLoaded) {
        setRetryCount(prev => prev + 1);
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [isLoaded]);

  return (
    <AnimatedReveal type="fade" delay={0.1}>
      <div className="w-full mb-4 sm:mb-6 max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
        <div className="bg-background/80 backdrop-blur-sm rounded-lg border border-border/50 p-3 sm:p-4 shadow-sm">
          <div id="gcse-search-container" className="min-h-[60px]">
            <div className="gcse-search" 
                 data-resultsUrl="/search-results" 
                 data-newWindow="false" 
                 data-autoSearchOnLoad="false"
                 data-enableAutoComplete="true"
                 data-enableHistory="true"></div>
          </div>
          
          {!isLoaded && retryCount > 0 && (
            <div className="text-center text-sm text-muted-foreground py-4">
              Loading Google Search... (Attempt {retryCount})
            </div>
          )}
        </div>

        {/* Custom styles to ensure search results are visible */}
        <style jsx>{`
          :global(.gsc-control-cse) {
            background-color: transparent !important;
            border: none !important;
            padding: 0 !important;
          }
          
          :global(.gsc-search-box) {
            margin-bottom: 16px !important;
          }
          
          :global(.gsc-input-box) {
            background: hsl(var(--background)) !important;
            border: 1px solid hsl(var(--border)) !important;
            border-radius: 8px !important;
          }
          
          :global(.gsc-input) {
            background: transparent !important;
            color: hsl(var(--foreground)) !important;
            font-family: inherit !important;
          }
          
          :global(.gsc-search-button) {
            background: hsl(var(--primary)) !important;
            border: none !important;
            border-radius: 6px !important;
          }
          
          :global(.gsc-results-wrapper-overlay) {
            background: hsl(var(--background)) !important;
            border: 1px solid hsl(var(--border)) !important;
            border-radius: 8px !important;
            margin-top: 8px !important;
            padding: 16px !important;
            box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1) !important;
          }
          
          :global(.gsc-results-wrapper-visible) {
            background: hsl(var(--background)) !important;
            border: 1px solid hsl(var(--border)) !important;
            border-radius: 8px !important;
            margin-top: 8px !important;
            padding: 16px !important;
            box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1) !important;
          }
          
          :global(.gsc-webResult) {
            background: hsl(var(--card)) !important;
            border: 1px solid hsl(var(--border)) !important;
            border-radius: 6px !important;
            margin-bottom: 12px !important;
            padding: 12px !important;
          }
          
          :global(.gsc-webResult .gsc-result) {
            background: transparent !important;
            border: none !important;
          }
          
          :global(.gs-title) {
            color: hsl(var(--primary)) !important;
            text-decoration: none !important;
          }
          
          :global(.gs-title:hover) {
            text-decoration: underline !important;
          }
          
          :global(.gs-snippet) {
            color: hsl(var(--foreground)) !important;
            line-height: 1.5 !important;
          }
          
          :global(.gs-visibleUrl) {
            color: hsl(var(--muted-foreground)) !important;
          }
          
          :global(.gsc-cursor-page) {
            color: hsl(var(--primary)) !important;
          }
          
          :global(.gsc-cursor-current-page) {
            background: hsl(var(--primary)) !important;
            color: hsl(var(--primary-foreground)) !important;
            border-radius: 4px !important;
          }
          
          :global(.gsc-tabsArea) {
            border-bottom: 1px solid hsl(var(--border)) !important;
          }
          
          :global(.gsc-tabHeader) {
            background: hsl(var(--muted)) !important;
            color: hsl(var(--muted-foreground)) !important;
            border: 1px solid hsl(var(--border)) !important;
          }
          
          :global(.gsc-tabHeader.gsc-tabhActive) {
            background: hsl(var(--background)) !important;
            color: hsl(var(--foreground)) !important;
            border-bottom-color: hsl(var(--background)) !important;
          }
        `}</style>
      </div>
    </AnimatedReveal>
  );
}