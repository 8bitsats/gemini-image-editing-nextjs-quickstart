"use client";

import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  DollarSign, 
  TrendingUp, 
  TrendingDown, 
  ExternalLink, 
  Copy, 
  BarChart3,
  Activity,
  Clock,
  Users,
  Droplets,
  ArrowUpRight,
  ArrowDownRight,
  X
} from "lucide-react";
import { BirdEyeClient, PriceStats, OHLCV } from "@/lib/birdeye/client";
import { TokenChart } from "./TokenChart";
import { useToast } from "@/components/ui/use-toast";

interface TokenDetailsModalProps {
  token: any;
  onClose: () => void;
}

export function TokenDetailsModal({ token, onClose }: TokenDetailsModalProps) {
  const [priceStats, setPriceStats] = useState<PriceStats | null>(null);
  const [ohlcvData, setOhlcvData] = useState<OHLCV[]>([]);
  const [timeframe, setTimeframe] = useState<"1h" | "24h" | "7d" | "30d">("24h");
  const [chartInterval, setChartInterval] = useState<"1m" | "5m" | "15m" | "1h" | "4h" | "1d">("15m");
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchTokenData();
  }, [token.address, timeframe, chartInterval]);

  const fetchTokenData = async () => {
    setIsLoading(true);
    const apiKey = process.env.NEXT_PUBLIC_BIRDEYE_API_KEY;
    
    if (!apiKey) {
      console.error("BirdEye API key not configured");
      setIsLoading(false);
      return;
    }

    const client = new BirdEyeClient(apiKey);

    try {
      // Fetch price stats and OHLCV data in parallel
      const [stats, chartData] = await Promise.all([
        client.getPriceStatsSingle(token.address, timeframe),
        client.getOHLCV(token.address, chartInterval, "usd")
      ]);

      setPriceStats(stats);
      setOhlcvData(chartData);
    } catch (error) {
      console.error("Error fetching token data:", error);
    } finally {
      setIsLoading(false);
    }
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

  const copyAddress = () => {
    navigator.clipboard.writeText(token.address);
    toast({
      title: "Copied",
      description: "Token address copied to clipboard",
    });
  };

  const formatPercentage = (value: number | undefined) => {
    if (!value) return "0.00%";
    const formatted = value.toFixed(2);
    return value >= 0 ? `+${formatted}%` : `${formatted}%`;
  };

  return (
    <div 
      className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <Card 
        className="w-full max-w-4xl max-h-[90vh] overflow-hidden bg-gradient-to-br from-green-900 to-emerald-900 border-green-500/30"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6 space-y-6 overflow-y-auto max-h-[90vh]">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-full overflow-hidden bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center">
                {token.logoURI ? (
                  <img 
                    src={token.logoURI} 
                    alt={token.symbol}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <DollarSign className="w-8 h-8 text-white" />
                )}
              </div>
              <div>
                <h2 className="text-2xl font-bold text-white">{token.symbol}</h2>
                <p className="text-green-200">{token.name}</p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="text-white hover:bg-white/10"
            >
              <X className="h-5 w-5" />
            </Button>
          </div>

          {/* Price and Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="p-4 bg-black/20 rounded-lg">
              <div className="flex items-center gap-2 text-green-200 text-sm mb-1">
                <DollarSign className="w-4 h-4" />
                Price
              </div>
              <div className="text-white font-bold text-xl">{formatPrice(token.price)}</div>
              <div className={`text-sm flex items-center gap-1 mt-1 ${
                token.priceChange24h >= 0 ? 'text-green-400' : 'text-red-400'
              }`}>
                {token.priceChange24h >= 0 ? (
                  <TrendingUp className="w-3 h-3" />
                ) : (
                  <TrendingDown className="w-3 h-3" />
                )}
                {formatPercentage(token.priceChange24h)}
              </div>
            </div>

            <div className="p-4 bg-black/20 rounded-lg">
              <div className="flex items-center gap-2 text-green-200 text-sm mb-1">
                <Activity className="w-4 h-4" />
                Volume 24h
              </div>
              <div className="text-white font-bold text-xl">${formatNumber(token.volume24h)}</div>
            </div>

            <div className="p-4 bg-black/20 rounded-lg">
              <div className="flex items-center gap-2 text-green-200 text-sm mb-1">
                <Droplets className="w-4 h-4" />
                Liquidity
              </div>
              <div className="text-white font-bold text-xl">${formatNumber(token.liquidity)}</div>
            </div>

            <div className="p-4 bg-black/20 rounded-lg">
              <div className="flex items-center gap-2 text-green-200 text-sm mb-1">
                <Users className="w-4 h-4" />
                Holders
              </div>
              <div className="text-white font-bold text-xl">{formatNumber(token.holder)}</div>
            </div>
          </div>

          {/* Tabs */}
          <Tabs defaultValue="chart" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="chart">Chart</TabsTrigger>
              <TabsTrigger value="stats">Price Stats</TabsTrigger>
              <TabsTrigger value="info">Token Info</TabsTrigger>
            </TabsList>

            <TabsContent value="chart" className="space-y-4">
              {/* Timeframe selector */}
              <div className="flex gap-2">
                <Button
                  variant={timeframe === "1h" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setTimeframe("1h")}
                >
                  1H
                </Button>
                <Button
                  variant={timeframe === "24h" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setTimeframe("24h")}
                >
                  24H
                </Button>
                <Button
                  variant={timeframe === "7d" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setTimeframe("7d")}
                >
                  7D
                </Button>
                <Button
                  variant={timeframe === "30d" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setTimeframe("30d")}
                >
                  30D
                </Button>
              </div>

              {/* Chart */}
              <div className="h-[400px] bg-black/20 rounded-lg p-4">
                {isLoading ? (
                  <div className="flex items-center justify-center h-full">
                    <div className="text-white">Loading chart...</div>
                  </div>
                ) : (
                  <TokenChart data={ohlcvData} />
                )}
              </div>
            </TabsContent>

            <TabsContent value="stats" className="space-y-4">
              {priceStats ? (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {/* Price changes */}
                  <div className="p-4 bg-black/20 rounded-lg">
                    <h4 className="text-green-200 text-sm mb-3">Price Changes</h4>
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-white text-sm">1h</span>
                        <span className={`text-sm ${
                          (priceStats.priceChange1h ?? 0) >= 0 ? 'text-green-400' : 'text-red-400'
                        }`}>
                          {formatPercentage(priceStats.priceChange1h)}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-white text-sm">24h</span>
                        <span className={`text-sm ${
                          (priceStats.priceChange24h ?? 0) >= 0 ? 'text-green-400' : 'text-red-400'
                        }`}>
                          {formatPercentage(priceStats.priceChange24h)}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-white text-sm">7d</span>
                        <span className={`text-sm ${
                          (priceStats.priceChange7d ?? 0) >= 0 ? 'text-green-400' : 'text-red-400'
                        }`}>
                          {formatPercentage(priceStats.priceChange7d)}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-white text-sm">30d</span>
                        <span className={`text-sm ${
                          (priceStats.priceChange30d ?? 0) >= 0 ? 'text-green-400' : 'text-red-400'
                        }`}>
                          {formatPercentage(priceStats.priceChange30d)}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* High/Low */}
                  <div className="p-4 bg-black/20 rounded-lg">
                    <h4 className="text-green-200 text-sm mb-3">High/Low</h4>
                    <div className="space-y-2">
                      <div>
                        <div className="text-white text-xs mb-1">24h</div>
                        <div className="flex justify-between text-sm">
                          <span className="text-green-400">{formatPrice(priceStats.high24h ?? 0)}</span>
                          <span className="text-red-400">{formatPrice(priceStats.low24h ?? 0)}</span>
                        </div>
                      </div>
                      <div>
                        <div className="text-white text-xs mb-1">7d</div>
                        <div className="flex justify-between text-sm">
                          <span className="text-green-400">{formatPrice(priceStats.high7d ?? 0)}</span>
                          <span className="text-red-400">{formatPrice(priceStats.low7d ?? 0)}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Volume */}
                  <div className="p-4 bg-black/20 rounded-lg">
                    <h4 className="text-green-200 text-sm mb-3">Volume</h4>
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-white text-sm">24h</span>
                        <span className="text-white text-sm">${formatNumber(priceStats.volume24h ?? 0)}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-white text-sm">7d</span>
                        <span className="text-white text-sm">${formatNumber(priceStats.volume7d ?? 0)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center text-white py-8">
                  Loading price statistics...
                </div>
              )}
            </TabsContent>

            <TabsContent value="info" className="space-y-4">
              <div className="space-y-4">
                {/* Contract Address */}
                <div className="p-4 bg-black/20 rounded-lg">
                  <div className="flex justify-between items-center">
                    <div>
                      <div className="text-green-200 text-sm mb-1">Contract Address</div>
                      <div className="text-white font-mono text-sm">
                        {token.address.slice(0, 20)}...{token.address.slice(-20)}
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={copyAddress}
                      className="text-white hover:bg-white/10"
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                {/* Links */}
                <div className="flex flex-wrap gap-2">
                  <a
                    href={`https://solscan.io/token/${token.address}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 px-4 py-2 bg-black/20 rounded-lg text-green-200 hover:text-white transition-colors"
                  >
                    <ExternalLink className="w-4 h-4" />
                    Solscan
                  </a>
                  <a
                    href={`https://birdeye.so/token/${token.address}?chain=solana`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 px-4 py-2 bg-black/20 rounded-lg text-green-200 hover:text-white transition-colors"
                  >
                    <ExternalLink className="w-4 h-4" />
                    BirdEye
                  </a>
                  {token.extensions?.website && (
                    <a
                      href={token.extensions.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 px-4 py-2 bg-black/20 rounded-lg text-green-200 hover:text-white transition-colors"
                    >
                      <ExternalLink className="w-4 h-4" />
                      Website
                    </a>
                  )}
                  {token.extensions?.twitter && (
                    <a
                      href={token.extensions.twitter}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 px-4 py-2 bg-black/20 rounded-lg text-green-200 hover:text-white transition-colors"
                    >
                      <ExternalLink className="w-4 h-4" />
                      Twitter
                    </a>
                  )}
                </div>

                {/* Description */}
                {token.extensions?.description && (
                  <div className="p-4 bg-black/20 rounded-lg">
                    <div className="text-green-200 text-sm mb-2">Description</div>
                    <p className="text-white text-sm">{token.extensions.description}</p>
                  </div>
                )}

                {/* Additional Info */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 bg-black/20 rounded-lg">
                    <div className="text-green-200 text-sm mb-1">Decimals</div>
                    <div className="text-white font-bold">{token.decimals}</div>
                  </div>
                  {token.rank && (
                    <div className="p-4 bg-black/20 rounded-lg">
                      <div className="text-green-200 text-sm mb-1">Trending Rank</div>
                      <div className="text-white font-bold">#{token.rank}</div>
                    </div>
                  )}
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </Card>
    </div>
  );
}