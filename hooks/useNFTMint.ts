"use client";

import { useState } from "react";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { mintNFT } from "@/lib/solana/clientMintNFT";

export function useNFTMint() {
  const { connection } = useConnection();
  const wallet = useWallet();
  const [isMinting, setIsMinting] = useState(false);
  const [mintError, setMintError] = useState<string | null>(null);
  const [mintSuccess, setMintSuccess] = useState<{
    mint: string;
    metadata: string;
    name: string;
  } | null>(null);

  const mint = async (imageUrl: string, name: string, description: string) => {
    if (!wallet.connected) {
      setMintError("Please connect your wallet first");
      return;
    }

    setIsMinting(true);
    setMintError(null);
    setMintSuccess(null);

    try {
      const result = await mintNFT({
        wallet,
        connection,
        imageUrl,
        name,
        description,
      });
      setMintSuccess(result);
      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Failed to mint NFT";
      setMintError(errorMessage);
      throw error;
    } finally {
      setIsMinting(false);
    }
  };

  const reset = () => {
    setMintError(null);
    setMintSuccess(null);
  };

  return {
    mint,
    isMinting,
    mintError,
    mintSuccess,
    reset,
    isConnected: wallet.connected,
  };
}