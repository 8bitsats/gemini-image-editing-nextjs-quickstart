"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ChevronDown, ChevronUp, Play, Monitor } from "lucide-react";
import { AnimatedReveal } from "@/components/AnimatedReveal";
import { motion, AnimatePresence } from "framer-motion";

export function VideoStream() {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const handleToggle = () => {
    setIsExpanded(!isExpanded);
    if (!isExpanded) {
      setIsLoading(true);
    }
  };

  const handleIframeLoad = () => {
    setIsLoading(false);
  };

  return (
    <AnimatedReveal type="fade" delay={0.2}>
      <div className="w-full mb-4 sm:mb-6 max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
        <div className="bg-background/80 backdrop-blur-sm rounded-lg border border-border/50 shadow-sm overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between p-3 sm:p-4 border-b border-border/50">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="p-2 rounded-full bg-primary/10">
                <Monitor className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
              </div>
              <div>
                <h3 className="text-sm sm:text-base font-medium text-foreground">
                  Live Stream
                </h3>
                <p className="text-xs sm:text-sm text-muted-foreground">
                  Gorbagana Live Updates
                </p>
              </div>
              {isExpanded && (
                <motion.div
                  initial={{ opacity: 0, scale: 0 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="ml-2 px-2 py-1 bg-red-500/10 rounded-full border border-red-500/20"
                >
                  <div className="flex items-center gap-1">
                    <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                    <span className="text-xs font-medium text-red-600 dark:text-red-400">
                      LIVE
                    </span>
                  </div>
                </motion.div>
              )}
            </div>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={handleToggle}
              className="h-8 w-8 sm:h-9 sm:w-9 p-0"
            >
              {isExpanded ? (
                <ChevronUp className="w-4 h-4" />
              ) : (
                <ChevronDown className="w-4 h-4" />
              )}
            </Button>
          </div>

          {/* Collapsible Content */}
          <AnimatePresence>
            {isExpanded && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ 
                  duration: 0.3, 
                  ease: [0.16, 1, 0.3, 1] 
                }}
                className="overflow-hidden"
              >
                <div className="p-3 sm:p-4">
                  {/* Video Container */}
                  <div className="relative w-full">
                    {/* Responsive 1:1 aspect ratio container */}
                    <div className="relative w-full" style={{ paddingTop: "100%" }}>
                      {/* Loading State */}
                      {isLoading && (
                        <div className="absolute inset-0 bg-muted rounded-lg flex items-center justify-center">
                          <div className="flex flex-col items-center gap-3">
                            <div className="relative">
                              <div className="w-12 h-12 sm:w-16 sm:h-16 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
                              <Play className="absolute inset-0 m-auto w-5 h-5 sm:w-6 sm:h-6 text-primary" />
                            </div>
                            <p className="text-sm text-muted-foreground">Loading stream...</p>
                          </div>
                        </div>
                      )}
                      
                      {/* Video iframe */}
                      <iframe
                        src="https://customer-oh7hxjdpro3mt496.cloudflarestream.com/fb0f2dfa8466df9494a147f3163393ba/iframe?poster=https%3A%2F%2Fcustomer-oh7hxjdpro3mt496.cloudflarestream.com%2Ffb0f2dfa8466df9494a147f3163393ba%2Fthumbnails%2Fthumbnail.jpg%3Ftime%3D%26height%3D600"
                        loading="lazy"
                        style={{
                          border: "none",
                          position: "absolute",
                          top: 0,
                          left: 0,
                          height: "100%",
                          width: "100%",
                          borderRadius: "0.5rem",
                        }}
                        allow="accelerometer; gyroscope; autoplay; encrypted-media; picture-in-picture;"
                        allowFullScreen={true}
                        onLoad={handleIframeLoad}
                        className="rounded-lg"
                      />
                    </div>
                  </div>

                  {/* Stream Info */}
                  <div className="mt-3 sm:mt-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-2 text-xs sm:text-sm text-muted-foreground">
                      <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                      <span>Stream is live and ready</span>
                    </div>
                    
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-xs h-7 px-2 sm:h-8 sm:px-3"
                        onClick={() => window.open('https://customer-oh7hxjdpro3mt496.cloudflarestream.com/fb0f2dfa8466df9494a147f3163393ba/iframe?poster=https%3A%2F%2Fcustomer-oh7hxjdpro3mt496.cloudflarestream.com%2Ffb0f2dfa8466df9494a147f3163393ba%2Fthumbnails%2Fthumbnail.jpg%3Ftime%3D%26height%3D600', '_blank')}
                      >
                        Open in New Tab
                      </Button>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </AnimatedReveal>
  );
}