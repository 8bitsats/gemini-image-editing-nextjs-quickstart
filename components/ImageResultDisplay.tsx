"use client";

import { Button } from "@/components/ui/button";
import { Download, RotateCcw, MessageCircle, Wallet } from "lucide-react";
import { useState } from "react";
import { HistoryItem, HistoryPart } from "@/lib/types";
import { useNFTMint } from "@/hooks/useNFTMint";
import { ClientWalletButton } from "@/components/ClientWalletButton";

interface ImageResultDisplayProps {
  imageUrl: string;
  description: string | null;
  onReset: () => void;
  conversationHistory?: HistoryItem[];
}

export function ImageResultDisplay({
  imageUrl,
  description,
  onReset,
  conversationHistory = [],
}: ImageResultDisplayProps) {
  const [showHistory, setShowHistory] = useState(false);
  const { mint, isMinting, mintError, mintSuccess, isConnected } = useNFTMint();
  const [showMintDialog, setShowMintDialog] = useState(false);

  const handleDownload = () => {
    // Create a temporary link element
    const link = document.createElement("a");
    link.href = imageUrl;
    link.download = `gemini-image-${Date.now()}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const toggleHistory = () => {
    setShowHistory(!showHistory);
  };

  const handleMintNFT = async () => {
    try {
      const name = `Gorbagana NFT #${Date.now()}`;
      const nftDescription = description || "Generated with Gorbagana Google Deepmind";
      
      await mint(imageUrl, name, nftDescription);
      setShowMintDialog(true);
    } catch (error) {
      console.error("Failed to mint NFT:", error);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Generated Image</h2>
        <div className="space-x-2">
          {!isConnected && (
            <ClientWalletButton />
          )}
          {isConnected && (
            <Button 
              variant="default" 
              size="sm" 
              onClick={handleMintNFT}
              disabled={isMinting}
            >
              <Wallet className="w-4 h-4 mr-2" />
              {isMinting ? "Minting..." : "Mint as NFT"}
            </Button>
          )}
          <Button variant="outline" size="sm" onClick={handleDownload}>
            <Download className="w-4 h-4 mr-2" />
            Download
          </Button>
          {conversationHistory.length > 0 && (
            <Button variant="outline" size="sm" onClick={toggleHistory}>
              <MessageCircle className="w-4 h-4 mr-2" />
              {showHistory ? "Hide History" : "Show History"}
            </Button>
          )}
          <Button variant="outline" size="sm" onClick={onReset}>
            <RotateCcw className="w-4 h-4 mr-2" />
            Create New Image
          </Button>
        </div>
      </div>

      <div className="rounded-lg overflow-hidden bg-muted p-2">
        <img
          src={imageUrl}
          alt={description || "Generated image"}
          className="max-w-[640px] h-auto mx-auto"
        />
      </div>

      {description && (
        <div className="p-4 rounded-lg bg-muted">
          <h3 className="text-sm font-medium mb-2">Description</h3>
          <p className="text-sm text-muted-foreground">{description}</p>
        </div>
      )}

      {mintError && (
        <div className="p-4 rounded-lg bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800">
          <p className="text-sm text-red-700 dark:text-red-300">Error: {mintError}</p>
        </div>
      )}

      {mintSuccess && showMintDialog && (
        <div className="p-4 rounded-lg bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800">
          <h3 className="text-sm font-medium mb-2 text-green-700 dark:text-green-300">NFT Minted Successfully!</h3>
          <p className="text-sm text-green-600 dark:text-green-400 mb-1">
            Mint address: <code className="text-xs break-all">{mintSuccess.mint}</code>
          </p>
          <p className="text-sm text-green-600 dark:text-green-400 mb-1">
            Name: {mintSuccess.name}
          </p>
          <div className="flex gap-2 mt-3">
            <a 
              href={`https://solscan.io/token/${mintSuccess.mint}?cluster=mainnet`} 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-sm underline hover:no-underline text-green-600 dark:text-green-400"
            >
              View on Solscan →
            </a>
            <a 
              href={`https://explorer.solana.com/address/${mintSuccess.mint}`} 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-sm underline hover:no-underline text-green-600 dark:text-green-400"
            >
              View on Explorer →
            </a>
          </div>
        </div>
      )}

      {showHistory && conversationHistory.length > 0 && (
        <div className="p-4 rounded-lg">
          <h3 className="text-sm font-medium mb-4">Conversation History</h3>
          <div className="space-y-4">
            {conversationHistory.map((item, index) => (
              <div key={index} className={`p-3 rounded-lg bg-secondary`}>
                <p
                  className={`text-sm font-medium mb-2 ${
                    item.role === "user" ? "text-foreground" : "text-primary"
                  }`}
                >
                  {item.role === "user" ? "You" : "Gemini"}
                </p>
                <div className="space-y-2">
                  {item.parts.map((part: HistoryPart, partIndex) => (
                    <div key={partIndex}>
                      {part.text && <p className="text-sm">{part.text}</p>}
                      {part.image && (
                        <div className="mt-2 overflow-hidden rounded-md">
                          <img
                            src={part.image}
                            alt={`Image shared by ${item.role}`}
                            className="max-w-[16rem] h-auto object-contain"
                          />
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
