"use client";

import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AnimatedReveal } from "@/components/AnimatedReveal";
import { 
  TrendingUp, 
  TrendingDown,
  DollarSign,
  Users,
  Activity,
  BarChart3,
  ChevronLeft,
  ChevronRight,
  Pause,
  Play,
  RefreshCw,
  ExternalLink,
  Eye,
  EyeOff
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import { TrendingToken } from "@/lib/types/birdeye";

interface TrendingTokensData {
  tokens: (TrendingToken & { 
    metadata?: any;
    extensions?: any;
  })[];
  updateTime: string;
  count: number;
}

export function TrendingTokensTicker() {
  const [tokens, setTokens] = useState<TrendingTokensData>({ tokens: [], updateTime: "", count: 0 });
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const [isVisible, setIsVisible] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedToken, setSelectedToken] = useState<any>(null);
  
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Fetch trending tokens
  const fetchTrendingTokens = async () => {
    try {
      const response = await fetch("/api/trending-tokens?limit=20");
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setTokens(data.data);
        } else {
          console.error("Failed to fetch trending tokens:", data.error);
        }
      }
    } catch (error) {
      console.error("Error fetching trending tokens:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Initialize and refresh data
  useEffect(() => {
    fetchTrendingTokens();
    
    // Refresh every 2 minutes
    const refreshInterval = setInterval(fetchTrendingTokens, 120000);
    
    return () => clearInterval(refreshInterval);
  }, []);

  // Auto-scroll functionality
  useEffect(() => {
    if (isPlaying && tokens.tokens.length > 1) {
      intervalRef.current = setInterval(() => {
        setCurrentIndex((prev) => (prev + 1) % tokens.tokens.length);
      }, 5000); // Change every 5 seconds
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
  }, [isPlaying, tokens.tokens.length]);

  const navigateToIndex = (index: number) => {
    setCurrentIndex(index);
    setIsPlaying(false);
  };

  const togglePlayPause = () => {
    setIsPlaying(!isPlaying);
  };

  const formatPrice = (price: number) => {
    if (price < 0.01) {
      return `$${price.toExponential(2)}`;
    }
    return `$${price.toFixed(price < 1 ? 4 : 2)}`;
  };

  const formatNumber = (num: number) => {
    if (num >= 1e9) return `${(num / 1e9).toFixed(1)}B`;
    if (num >= 1e6) return `${(num / 1e6).toFixed(1)}M`;
    if (num >= 1e3) return `${(num / 1e3).toFixed(1)}K`;
    return num.toFixed(0);
  };

  const openTokenDetails = (token: any) => {
    setSelectedToken(token);
  };

  if (!isVisible || isLoading) {
    return null;
  }

  if (tokens.tokens.length === 0) {
    return (
      <div className="w-full bg-gradient-to-r from-green-900 via-emerald-900 to-teal-900 border-b border-green-500/20 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 py-2">
          <div className="flex items-center justify-center text-white text-sm">
            <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
            Loading trending tokens...
          </div>
        </div>
      </div>
    );
  }

  const currentToken = tokens.tokens[currentIndex];

  return (
    <>
      <div className="w-full bg-gradient-to-r from-green-900 via-emerald-900 to-teal-900 border-b border-green-500/20 shadow-lg">
        <AnimatedReveal type="slide" direction="down">
          <div className="max-w-7xl mx-auto px-4 py-3">
            {/* Header with stats */}
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse" />
                  <span className="text-white font-semibold text-sm">Trending Tokens</span>
                </div>
                
                <div className="flex items-center gap-4 text-xs text-green-200">
                  <div className="flex items-center gap-1">
                    <BarChart3 className="w-3 h-3" />
                    <span>{tokens.count} Tokens</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Activity className="w-3 h-3" />
                    <span>Live Data</span>
                  </div>
                  <div className="text-xs">
                    Updated: {new Date(tokens.updateTime).toLocaleTimeString()}
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
                  onClick={fetchTrendingTokens}
                  className="text-white hover:bg-white/10 h-7 w-7 p-0"
                >
                  <RefreshCw className="w-3 h-3" />
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

            {/* Main ticker display */}
            <div className="relative">
              <AnimatePresence mode="wait">
                <motion.div
                  key={currentToken.address}
                  initial={{ opacity: 0, x: 50 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -50 }}
                  transition={{ duration: 0.3 }}
                >
                  <Card className="bg-black/20 backdrop-blur-sm border-green-500/30 overflow-hidden">
                    <div className="flex items-center gap-4 p-3">
                      {/* Token icon and basic info */}
                      <div 
                        className="relative group cursor-pointer" 
                        onClick={() => openTokenDetails(currentToken)}
                      >
                        <div className="w-12 h-12 rounded-full overflow-hidden bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center">
                          {currentToken.logoURI ? (
                            <img 
                              src={currentToken.logoURI} 
                              alt={currentToken.symbol}
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                e.currentTarget.style.display = 'none';
                                e.currentTarget.nextElementSibling?.classList.remove('hidden');
                              }}
                            />
                          ) : null}
                          <DollarSign className={`w-6 h-6 text-white ${currentToken.logoURI ? 'hidden' : ''}`} />
                        </div>
                        
                        {currentToken.rank && currentToken.rank <= 10 && (
                          <div className="absolute -top-1 -right-1">
                            <Badge variant="destructive" className="text-xs px-1 py-0">
                              #{currentToken.rank}
                            </Badge>
                          </div>
                        )}
                        
                        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center rounded-full">
                          <Eye className="w-4 h-4 text-white" />
                        </div>
                      </div>

                      {/* Token info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="text-white font-bold text-lg">
                            {currentToken.symbol}
                          </h3>
                          <span className="text-green-200 text-sm truncate max-w-xs">
                            {currentToken.name}
                          </span>
                        </div>
                        
                        <div className="flex items-center gap-4 text-xs text-green-200">
                          <span className="font-mono">
                            {currentToken.address.slice(0, 8)}...{currentToken.address.slice(-8)}
                          </span>
                          {currentToken.extensions?.website && (
                            <a 
                              href={currentToken.extensions.website}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center gap-1 hover:text-white transition-colors"
                            >
                              <ExternalLink className="w-3 h-3" />
                              Website
                            </a>
                          )}
                        </div>
                      </div>

                      {/* Price and stats */}
                      <div className="flex items-center gap-6">
                        {/* Price */}
                        <div className="text-right">
                          <div className="text-white font-bold text-lg">
                            {formatPrice(currentToken.price)}
                          </div>
                          <div className={`text-sm flex items-center gap-1 ${
                            currentToken.priceChange24h >= 0 ? 'text-green-400' : 'text-red-400'
                          }`}>
                            {currentToken.priceChange24h >= 0 ? (
                              <TrendingUp className="w-3 h-3" />
                            ) : (
                              <TrendingDown className="w-3 h-3" />
                            )}
                            {Math.abs(currentToken.priceChange24h).toFixed(2)}%
                          </div>
                        </div>

                        {/* Volume */}
                        <div className="text-right">
                          <div className="text-green-200 text-xs">Volume 24h</div>
                          <div className="text-white font-semibold">
                            ${formatNumber(currentToken.volume24h)}
                          </div>
                        </div>

                        {/* Market Cap */}
                        <div className="text-right">
                          <div className="text-green-200 text-xs">Market Cap</div>
                          <div className="text-white font-semibold">
                            ${formatNumber(currentToken.marketCap)}
                          </div>
                        </div>

                        {/* Holders */}
                        <div className="text-right">
                          <div className="text-green-200 text-xs flex items-center gap-1">
                            <Users className="w-3 h-3" />
                            Holders
                          </div>
                          <div className="text-white font-semibold">
                            {formatNumber(currentToken.holder)}
                          </div>
                        </div>
                      </div>

                      {/* Navigation controls */}
                      <div className="flex items-center gap-1 ml-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => navigateToIndex((currentIndex - 1 + tokens.tokens.length) % tokens.tokens.length)}
                          className="text-white hover:bg-white/10 h-7 w-7 p-0"
                        >
                          <ChevronLeft className="w-3 h-3" />
                        </Button>
                        
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => navigateToIndex((currentIndex + 1) % tokens.tokens.length)}
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
                {tokens.tokens.slice(0, 10).map((_, index) => (
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
                {tokens.tokens.length > 10 && (
                  <span className="text-white/50 text-xs ml-1">
                    +{tokens.tokens.length - 10} more
                  </span>
                )}
              </div>
            </div>
          </div>
        </AnimatedReveal>
      </div>

      {/* Token Details Modal */}
      {selectedToken && (
        <div 
          className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={() => setSelectedToken(null)}
        >
          <Card 
            className="w-full max-w-2xl bg-gradient-to-br from-green-900 to-emerald-900 border-green-500/30"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-16 h-16 rounded-full overflow-hidden bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center">
                    {selectedToken.logoURI ? (
                      <img 
                        src={selectedToken.logoURI} 
                        alt={selectedToken.symbol}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <DollarSign className="w-8 h-8 text-white" />
                    )}
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-white">{selectedToken.symbol}</h2>
                    <p className="text-green-200">{selectedToken.name}</p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedToken(null)}
                  className="text-white hover:bg-white/10"
                >
                  ✕
                </Button>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-4">
                <div className="text-center p-3 bg-black/20 rounded-lg">
                  <div className="text-green-200 text-sm">Price</div>
                  <div className="text-white font-bold text-lg">{formatPrice(selectedToken.price)}</div>
                </div>
                <div className="text-center p-3 bg-black/20 rounded-lg">
                  <div className="text-green-200 text-sm">24h Change</div>
                  <div className={`font-bold text-lg ${selectedToken.priceChange24h >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                    {selectedToken.priceChange24h >= 0 ? '+' : ''}{selectedToken.priceChange24h.toFixed(2)}%
                  </div>
                </div>
                <div className="text-center p-3 bg-black/20 rounded-lg">
                  <div className="text-green-200 text-sm">Volume 24h</div>
                  <div className="text-white font-bold">${formatNumber(selectedToken.volume24h)}</div>
                </div>
                <div className="text-center p-3 bg-black/20 rounded-lg">
                  <div className="text-green-200 text-sm">Market Cap</div>
                  <div className="text-white font-bold">${formatNumber(selectedToken.marketCap)}</div>
                </div>
                <div className="text-center p-3 bg-black/20 rounded-lg">
                  <div className="text-green-200 text-sm">Holders</div>
                  <div className="text-white font-bold">{formatNumber(selectedToken.holder)}</div>
                </div>
                {selectedToken.rank && (
                  <div className="text-center p-3 bg-black/20 rounded-lg">
                    <div className="text-green-200 text-sm">Rank</div>
                    <div className="text-white font-bold">#{selectedToken.rank}</div>
                  </div>
                )}
              </div>

              <div className="text-center">
                <div className="text-green-200 text-sm mb-1">Contract Address</div>
                <div className="text-white font-mono text-sm bg-black/20 p-2 rounded">
                  {selectedToken.address}
                </div>
              </div>

              {selectedToken.extensions?.description && (
                <div className="mt-4">
                  <div className="text-green-200 text-sm mb-2">Description</div>
                  <p className="text-white text-sm">{selectedToken.extensions.description}</p>
                </div>
              )}

              {(selectedToken.extensions?.website || selectedToken.extensions?.twitter) && (
                <div className="flex gap-2 mt-4">
                  {selectedToken.extensions?.website && (
                    <a
                      href={selectedToken.extensions.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 text-green-200 hover:text-white transition-colors text-sm"
                    >
                      <ExternalLink className="w-4 h-4" />
                      Website
                    </a>
                  )}
                  {selectedToken.extensions?.twitter && (
                    <a
                      href={selectedToken.extensions.twitter}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 text-green-200 hover:text-white transition-colors text-sm"
                    >
                      <ExternalLink className="w-4 h-4" />
                      Twitter
                    </a>
                  )}
                </div>
              )}
            </div>
          </Card>
        </div>
      )}
    </>
  );
}