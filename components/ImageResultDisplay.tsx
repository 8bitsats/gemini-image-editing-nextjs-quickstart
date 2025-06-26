"use client";

import { Button } from "@/components/ui/button";
import { Download, RotateCcw, MessageCircle, Wallet, Coins } from "lucide-react";
import { useState } from "react";
import Image from "next/image";
import { HistoryItem, HistoryPart } from "@/lib/types";
import { useNFTMint } from "@/hooks/useNFTMint";
import { useNFTMintWithToken } from "@/hooks/useNFTMintWithToken";
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
  const { mintWithToken, isMinting: isMintingWithToken, mintError: mintWithTokenError, mintSuccess: mintWithTokenSuccess, tokenPrice } = useNFTMintWithToken();
  const [showMintDialog, setShowMintDialog] = useState(false);
  const [showTokenMintDialog, setShowTokenMintDialog] = useState(false);

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

  const handleMintWithToken = async () => {
    try {
      const name = `Gorbagana NFT #${Date.now()}`;
      const nftDescription = description || "Generated with Gorbagana Google Deepmind - Paid with $GOR";
      
      await mintWithToken(imageUrl, name, nftDescription);
      setShowTokenMintDialog(true);
    } catch (error) {
      console.error("Failed to mint NFT with token:", error);
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
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleMintNFT}
                disabled={isMinting || isMintingWithToken}
              >
                <Wallet className="w-4 h-4 mr-2" />
                {isMinting ? "Minting..." : "Mint with SOL"}
              </Button>
              <Button 
                variant="default" 
                size="sm" 
                onClick={handleMintWithToken}
                disabled={isMinting || isMintingWithToken}
                className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700"
              >
                <Coins className="w-4 h-4 mr-2" />
                {isMintingWithToken ? "Minting..." : `Mint with ${tokenPrice} $GOR`}
              </Button>
            </div>
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

      {(mintError || mintWithTokenError) && (
        <div className="p-4 rounded-lg bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800">
          <p className="text-sm text-red-700 dark:text-red-300">Error: {mintError || mintWithTokenError}</p>
        </div>
      )}

      {mintSuccess && showMintDialog && (
        <div className="p-4 rounded-lg bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800">
          <h3 className="text-sm font-medium mb-2 text-green-700 dark:text-green-300">NFT Minted Successfully with SOL!</h3>
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

      {mintWithTokenSuccess && showTokenMintDialog && (
        <div className="p-4 rounded-lg bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950 dark:to-emerald-950 border border-green-200 dark:border-green-800">
          <h3 className="text-sm font-medium mb-2 text-green-700 dark:text-green-300">🎉 NFT Minted Successfully with $GOR!</h3>
          <p className="text-sm text-green-600 dark:text-green-400 mb-1">
            Mint address: <code className="text-xs break-all">{mintWithTokenSuccess.mint}</code>
          </p>
          <p className="text-sm text-green-600 dark:text-green-400 mb-1">
            Name: {mintWithTokenSuccess.name}
          </p>
          <p className="text-sm text-green-600 dark:text-green-400 mb-1">
            Payment: <code className="text-xs">{tokenPrice} $GOR</code>
          </p>
          <p className="text-sm text-green-600 dark:text-green-400 mb-1">
            Payment Tx: <code className="text-xs break-all">{mintWithTokenSuccess.paymentSignature}</code>
          </p>
          <div className="flex gap-2 mt-3">
            <a 
              href={`https://solscan.io/token/${mintWithTokenSuccess.mint}?cluster=mainnet`} 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-sm underline hover:no-underline text-green-600 dark:text-green-400"
            >
              View NFT on Solscan →
            </a>
            <a 
              href={`https://solscan.io/tx/${mintWithTokenSuccess.paymentSignature}?cluster=mainnet`} 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-sm underline hover:no-underline text-green-600 dark:text-green-400"
            >
              View Payment Tx →
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
