"use client";

import { useState, useEffect, useCallback } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AnimatedReveal } from "@/components/AnimatedReveal";
import { MobileLoadingAnimation } from "@/components/LoadingAnimation";
import { fetchWalletNFTs, GorbaganaNFT } from "@/lib/helius/nftApi";
import { Images as Gallery, ExternalLink, RefreshCw, Image as ImageIcon, Calendar, Verified } from "lucide-react";
import Image from "next/image";
import { motion } from "framer-motion";

export function NFTGallery() {
  const { publicKey, connected } = useWallet();
  const [myNFTs, setMyNFTs] = useState<GorbaganaNFT[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedNFT, setSelectedNFT] = useState<GorbaganaNFT | null>(null);

  const loadMyNFTs = useCallback(async () => {
    if (!publicKey) return;

    setIsLoading(true);
    setError(null);

    try {
      const nfts = await fetchWalletNFTs(publicKey.toString());
      setMyNFTs(nfts);
    } catch (err) {
      console.error("Error loading NFTs:", err);
      setError(err instanceof Error ? err.message : "Failed to load NFTs");
    } finally {
      setIsLoading(false);
    }
  }, [publicKey]);

  // Load user's NFTs when wallet connects
  useEffect(() => {
    if (connected && publicKey) {
      loadMyNFTs();
    } else {
      setMyNFTs([]);
      setError(null);
    }
  }, [connected, publicKey, loadMyNFTs]);

  const formatDate = (dateString?: string) => {
    if (!dateString) return "Unknown";
    try {
      return new Date(dateString).toLocaleDateString();
    } catch {
      return "Unknown";
    }
  };

  const openInSolscan = (mintAddress: string) => {
    window.open(`https://solscan.io/token/${mintAddress}?cluster=mainnet`, '_blank');
  };

  if (!connected) {
    return (
      <AnimatedReveal>
        <div className="text-center p-8">
          <Gallery className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">Connect Your Wallet</h3>
          <p className="text-muted-foreground">
            Connect your wallet to view your Gorbagana NFT collection
          </p>
        </div>
      </AnimatedReveal>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      <AnimatedReveal>
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold">NFT Gallery</h2>
            <p className="text-sm text-muted-foreground">
              Your Gorbagana NFT collection
            </p>
          </div>
          <Button
            onClick={loadMyNFTs}
            disabled={isLoading}
            variant="outline"
            size="sm"
            className="w-full sm:w-auto"
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            {isLoading ? "Loading..." : "Refresh"}
          </Button>
        </div>
      </AnimatedReveal>

      {/* Error State */}
      {error && (
        <AnimatedReveal>
          <Card className="border-red-200 bg-red-50 dark:bg-red-950 dark:border-red-800">
            <CardContent className="p-4">
              <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
            </CardContent>
          </Card>
        </AnimatedReveal>
      )}

      {/* Loading State */}
      {isLoading && (
        <AnimatedReveal>
          <MobileLoadingAnimation />
        </AnimatedReveal>
      )}

      {/* NFT Grid */}
      {!isLoading && (
        <AnimatedReveal delay={0.2}>
          <Tabs defaultValue="grid" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="grid">Grid View</TabsTrigger>
              <TabsTrigger value="list">List View</TabsTrigger>
            </TabsList>

            <TabsContent value="grid" className="mt-4">
              {myNFTs.length === 0 ? (
                <Card>
                  <CardContent className="p-8 text-center">
                    <ImageIcon className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
                    <h3 className="text-lg font-semibold mb-2">No NFTs Found</h3>
                    <p className="text-muted-foreground">
                      You don&apos;t have any Gorbagana NFTs yet. Start creating!
                    </p>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {myNFTs.map((nft, index) => (
                    <motion.div
                      key={nft.id}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: index * 0.1, duration: 0.3 }}
                    >
                      <Card 
                        className="overflow-hidden hover:shadow-lg transition-shadow cursor-pointer"
                        onClick={() => setSelectedNFT(nft)}
                      >
                        <div className="aspect-square relative">
                          {nft.image ? (
                            <Image
                              src={nft.image}
                              alt={nft.name}
                              fill
                              className="object-cover"
                              unoptimized
                            />
                          ) : (
                            <div className="w-full h-full bg-muted flex items-center justify-center">
                              <ImageIcon className="w-8 h-8 text-muted-foreground" />
                            </div>
                          )}
                          {nft.creators?.some(c => c.verified) && (
                            <Badge className="absolute top-2 right-2 bg-blue-500">
                              <Verified className="w-3 h-3 mr-1" />
                              Verified
                            </Badge>
                          )}
                        </div>
                        <CardContent className="p-3">
                          <h3 className="font-semibold text-sm truncate">{nft.name}</h3>
                          <p className="text-xs text-muted-foreground truncate">
                            {nft.collection?.name || nft.symbol || "Gorbagana"}
                          </p>
                          <div className="flex items-center justify-between mt-2">
                            <span className="text-xs text-muted-foreground">
                              {formatDate(nft.mintedAt)}
                            </span>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-6 w-6 p-0"
                              onClick={(e) => {
                                e.stopPropagation();
                                openInSolscan(nft.mintAddress);
                              }}
                            >
                              <ExternalLink className="w-3 h-3" />
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="list" className="mt-4">
              {myNFTs.length === 0 ? (
                <Card>
                  <CardContent className="p-8 text-center">
                    <ImageIcon className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
                    <h3 className="text-lg font-semibold mb-2">No NFTs Found</h3>
                    <p className="text-muted-foreground">
                      You don&apos;t have any Gorbagana NFTs yet. Start creating!
                    </p>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-3">
                  {myNFTs.map((nft, index) => (
                    <motion.div
                      key={nft.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05, duration: 0.3 }}
                    >
                      <Card 
                        className="hover:shadow-md transition-shadow cursor-pointer"
                        onClick={() => setSelectedNFT(nft)}
                      >
                        <CardContent className="p-4">
                          <div className="flex items-center gap-4">
                            <div className="w-16 h-16 relative flex-shrink-0">
                              {nft.image ? (
                                <Image
                                  src={nft.image}
                                  alt={nft.name}
                                  fill
                                  className="object-cover rounded"
                                  unoptimized
                                />
                              ) : (
                                <div className="w-full h-full bg-muted rounded flex items-center justify-center">
                                  <ImageIcon className="w-6 h-6 text-muted-foreground" />
                                </div>
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <h3 className="font-semibold truncate">{nft.name}</h3>
                              <p className="text-sm text-muted-foreground truncate">
                                {nft.description || "No description"}
                              </p>
                              <div className="flex items-center gap-4 mt-1">
                                <span className="text-xs text-muted-foreground flex items-center gap-1">
                                  <Calendar className="w-3 h-3" />
                                  {formatDate(nft.mintedAt)}
                                </span>
                                {nft.creators?.some(c => c.verified) && (
                                  <Badge variant="secondary" className="text-xs">
                                    <Verified className="w-3 h-3 mr-1" />
                                    Verified
                                  </Badge>
                                )}
                              </div>
                            </div>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={(e) => {
                                e.stopPropagation();
                                openInSolscan(nft.mintAddress);
                              }}
                            >
                              <ExternalLink className="w-4 h-4" />
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </AnimatedReveal>
      )}

      {/* NFT Detail Modal */}
      {selectedNFT && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50"
          onClick={() => setSelectedNFT(null)}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="bg-background rounded-lg p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="space-y-4">
              <div className="flex items-start justify-between">
                <h2 className="text-xl font-bold">{selectedNFT.name}</h2>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedNFT(null)}
                >
                  ✕
                </Button>
              </div>
              
              {selectedNFT.image && (
                <div className="aspect-square relative rounded-lg overflow-hidden">
                  <Image
                    src={selectedNFT.image}
                    alt={selectedNFT.name}
                    fill
                    className="object-cover"
                    unoptimized
                  />
                </div>
              )}

              {selectedNFT.description && (
                <div>
                  <h3 className="font-semibold mb-2">Description</h3>
                  <p className="text-sm text-muted-foreground">{selectedNFT.description}</p>
                </div>
              )}

              {selectedNFT.attributes && selectedNFT.attributes.length > 0 && (
                <div>
                  <h3 className="font-semibold mb-2">Attributes</h3>
                  <div className="grid grid-cols-2 gap-2">
                    {selectedNFT.attributes.map((attr, index) => (
                      <div key={index} className="bg-muted rounded p-2">
                        <div className="text-xs text-muted-foreground">{attr.trait_type}</div>
                        <div className="text-sm font-medium">{attr.value}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex gap-2">
                <Button
                  onClick={() => openInSolscan(selectedNFT.mintAddress)}
                  className="flex-1"
                >
                  <ExternalLink className="w-4 h-4 mr-2" />
                  View on Solscan
                </Button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </div>
  );
}