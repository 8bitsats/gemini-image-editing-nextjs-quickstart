"use client";

import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AnimatedReveal } from "@/components/AnimatedReveal";
import { 
  ThumbsUp, 
  ThumbsDown, 
  Eye, 
  Users, 
  Zap,
  Palette,
  ChevronLeft,
  ChevronRight,
  Pause,
  Play,
  EyeOff
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import { useAuth } from "@/lib/auth";
import { 
  getPublicImages, 
  voteOnImage, 
  removeVote, 
  getUserVotes,
  subscribeToPublicImages 
} from "@/lib/database";
import type { GeneratedImage } from "@/lib/supabase";
import { useToast } from "@/components/ui/use-toast";

interface ExtendedGeneratedImage extends GeneratedImage {
  users?: {
    username?: string;
    avatar_url?: string;
  };
  userVote?: 'upvote' | 'downvote' | null;
}

export function RealtimeArtGallery() {
  const [artworks, setArtworks] = useState<ExtendedGeneratedImage[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const [userVotes, setUserVotes] = useState<Map<string, "upvote" | "downvote">>(new Map());
  const [isVisible, setIsVisible] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [liveCount, setLiveCount] = useState(0);
  
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const galleryRef = useRef<HTMLDivElement>(null);
  const { user, isAuthenticated } = useAuth();
  const { toast } = useToast();

  // Fetch artworks from API
  const fetchArtworks = async () => {
    try {
      const response = await fetch("/api/art-gallery?limit=20");
      if (response.ok) {
        const data = await response.json();
        setArtworks(data.artworks || []);
        setLiveCount(data.stats?.liveArtworks || 0);
      }
    } catch (error) {
      console.error("Failed to fetch artworks:", error);
      setArtworks([]);
      setLiveCount(0);
    }
  };

  // Initialize with data from API
  useEffect(() => {
    fetchArtworks();
  }, []);

  // Auto-scroll functionality
  useEffect(() => {
    if (isPlaying && artworks.length > 1) {
      intervalRef.current = setInterval(() => {
        setCurrentIndex((prev) => (prev + 1) % artworks.length);
      }, 4000); // Change every 4 seconds
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isPlaying, artworks.length]);

  // Refresh gallery data periodically
  useEffect(() => {
    const refreshInterval = setInterval(() => {
      fetchArtworks();
    }, 30000); // Refresh every 30 seconds

    return () => clearInterval(refreshInterval);
  }, []);

  const handleVote = async (artworkId: string, voteType: "like" | "dislike") => {
    const currentVote = userVotes.get(artworkId);
    
    try {
      const response = await fetch("/api/art-gallery", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "vote",
          voteData: {
            artworkId,
            type: voteType,
            userAddress: "anonymous", // In production, use wallet address
          }
        })
      });

      if (response.ok) {
        const data = await response.json();
        // Update artwork with server response
        setArtworks(prev => prev.map(artwork => 
          artwork.id === artworkId ? data.artwork : artwork
        ));

        // Update user vote state
        if (currentVote === voteType) {
          setUserVotes(prev => {
            const newVotes = new Map(prev);
            newVotes.delete(artworkId);
            return newVotes;
          });
        } else {
          setUserVotes(prev => new Map(prev.set(artworkId, voteType)));
        }
      }
    } catch (error) {
      console.error("Failed to vote:", error);
      // Fallback to local update
      setArtworks(prev => prev.map(artwork => {
        if (artwork.id === artworkId) {
          let newLikes = artwork.likes;
          let newDislikes = artwork.dislikes;

          if (currentVote === "like") newLikes--;
          if (currentVote === "dislike") newDislikes--;

          if (currentVote !== voteType) {
            if (voteType === "like") newLikes++;
            if (voteType === "dislike") newDislikes++;
          }

          return {
            ...artwork,
            likes: Math.max(0, newLikes),
            dislikes: Math.max(0, newDislikes),
          };
        }
        return artwork;
      }));
    }
  };

  const handleViewArtwork = async (artworkId: string) => {
    try {
      const response = await fetch("/api/art-gallery", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "view",
          artworkId
        })
      });

      if (response.ok) {
        const data = await response.json();
        setArtworks(prev => prev.map(artwork => 
          artwork.id === artworkId ? data.artwork : artwork
        ));
      }
    } catch (error) {
      console.error("Failed to track view:", error);
      // Fallback to local update
      setArtworks(prev => prev.map(artwork => 
        artwork.id === artworkId 
          ? { ...artwork, views: artwork.views + 1 }
          : artwork
      ));
    }
  };

  const navigateToIndex = (index: number) => {
    setCurrentIndex(index);
    setIsPlaying(false);
  };

  const togglePlayPause = () => {
    setIsPlaying(!isPlaying);
  };

  if (!isVisible || artworks.length === 0) {
    return null;
  }

  const currentArtwork = artworks[currentIndex];

  return (
    <div className="w-full bg-gradient-to-r from-purple-900 via-blue-900 to-indigo-900 border-b border-purple-500/20 shadow-lg">
      <AnimatedReveal type="slide" direction="down">
        <div className="max-w-7xl mx-auto px-4 py-3">
          {/* Header with stats */}
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse" />
                <span className="text-white font-semibold text-sm">Live Art Gallery</span>
              </div>
              
              <div className="flex items-center gap-4 text-xs text-purple-200">
                <div className="flex items-center gap-1">
                  <Zap className="w-3 h-3" />
                  <span>{liveCount} Live</span>
                </div>
                <div className="flex items-center gap-1">
                  <Palette className="w-3 h-3" />
                  <span>{artworks.length} Total</span>
                </div>
                <div className="flex items-center gap-1">
                  <Users className="w-3 h-3" />
                  <span>{artworks.reduce((sum, art) => sum + art.views, 0)} Views</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={togglePlayPause}
                className="text-white hover:bg-white/10 h-7 w-7 p-0"
              >
                {isPlaying ? <Pause className="w-3 h-3" /> : <Play className="w-3 h-3" />}
              </Button>
              
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsVisible(false)}
                className="text-white hover:bg-white/10 h-7 px-2 text-xs"
              >
                Hide
              </Button>
            </div>
          </div>

          {/* Main gallery display */}
          <div ref={galleryRef} className="relative">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentArtwork.id}
                initial={{ opacity: 0, x: 50 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -50 }}
                transition={{ duration: 0.3 }}
              >
                <Card className="bg-black/20 backdrop-blur-sm border-purple-500/30 overflow-hidden">
                  <div className="flex items-center gap-4 p-3">
                    {/* Artwork thumbnail */}
                    <div className="relative group cursor-pointer" onClick={() => handleViewArtwork(currentArtwork.id)}>
                      <div className="w-16 h-16 rounded-lg overflow-hidden bg-gradient-to-br from-purple-500 to-blue-600 flex items-center justify-center">
                        {currentArtwork.imageUrl ? (
                          <img 
                            src={currentArtwork.imageUrl} 
                            alt={currentArtwork.prompt}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              e.currentTarget.style.display = 'none';
                              e.currentTarget.nextElementSibling?.classList.remove('hidden');
                            }}
                          />
                        ) : null}
                        <Palette className={`w-6 h-6 text-white ${currentArtwork.imageUrl ? 'hidden' : ''}`} />
                      </div>
                      
                      {currentArtwork.isLive && (
                        <div className="absolute -top-1 -right-1">
                          <div className="w-4 h-4 bg-red-500 rounded-full animate-pulse flex items-center justify-center">
                            <div className="w-2 h-2 bg-white rounded-full" />
                          </div>
                        </div>
                      )}
                      
                      <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center rounded-lg">
                        <Eye className="w-4 h-4 text-white" />
                      </div>
                    </div>

                    {/* Artwork info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="text-white font-medium text-sm truncate max-w-md">
                          {currentArtwork.prompt}
                        </h3>
                        {currentArtwork.isLive && (
                          <Badge variant="destructive" className="text-xs px-1 py-0 animate-pulse">
                            LIVE
                          </Badge>
                        )}
                      </div>
                      
                      <div className="flex items-center gap-3 text-xs text-purple-200">
                        <span>by {currentArtwork.creator}</span>
                        <span>•</span>
                        <span>{Math.floor((Date.now() - currentArtwork.createdAt) / 60000)}m ago</span>
                        <span>•</span>
                        <span className="flex items-center gap-1">
                          <Eye className="w-3 h-3" />
                          {currentArtwork.views}
                        </span>
                      </div>
                    </div>

                    {/* Voting controls */}
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleVote(currentArtwork.id, "like")}
                        className={`h-8 px-2 ${
                          userVotes.get(currentArtwork.id) === "like"
                            ? "text-green-400 bg-green-400/10"
                            : "text-white hover:text-green-400 hover:bg-green-400/10"
                        }`}
                      >
                        <ThumbsUp className="w-3 h-3 mr-1" />
                        <span className="text-xs">{currentArtwork.likes}</span>
                      </Button>
                      
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleVote(currentArtwork.id, "dislike")}
                        className={`h-8 px-2 ${
                          userVotes.get(currentArtwork.id) === "dislike"
                            ? "text-red-400 bg-red-400/10"
                            : "text-white hover:text-red-400 hover:bg-red-400/10"
                        }`}
                      >
                        <ThumbsDown className="w-3 h-3 mr-1" />
                        <span className="text-xs">{currentArtwork.dislikes}</span>
                      </Button>
                    </div>

                    {/* Navigation controls */}
                    <div className="flex items-center gap-1 ml-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => navigateToIndex((currentIndex - 1 + artworks.length) % artworks.length)}
                        className="text-white hover:bg-white/10 h-7 w-7 p-0"
                      >
                        <ChevronLeft className="w-3 h-3" />
                      </Button>
                      
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => navigateToIndex((currentIndex + 1) % artworks.length)}
                        className="text-white hover:bg-white/10 h-7 w-7 p-0"
                      >
                        <ChevronRight className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                </Card>
              </motion.div>
            </AnimatePresence>

            {/* Progress indicator */}
            <div className="flex items-center justify-center gap-1 mt-2">
              {artworks.slice(0, 10).map((_, index) => (
                <button
                  key={index}
                  onClick={() => navigateToIndex(index)}
                  className={`w-1.5 h-1.5 rounded-full transition-colors ${
                    index === currentIndex % 10
                      ? "bg-white"
                      : "bg-white/30 hover:bg-white/50"
                  }`}
                />
              ))}
              {artworks.length > 10 && (
                <span className="text-white/50 text-xs ml-1">
                  +{artworks.length - 10} more
                </span>
              )}
            </div>
          </div>
        </div>
      </AnimatedReveal>
    </div>
  );
}