"use client";

import { useState } from "react";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { mintNFTWithToken, GOR_TOKEN_MINT, NFT_PRICE_IN_GOR, PAYMENT_RECIPIENT } from "@/lib/solana/mintNFTWithToken";

export function useNFTMintWithToken() {
  const { connection } = useConnection();
  const wallet = useWallet();
  const [isMinting, setIsMinting] = useState(false);
  const [mintError, setMintError] = useState<string | null>(null);
  const [mintSuccess, setMintSuccess] = useState<{
    mint: string;
    metadata: string;
    name: string;
    paymentSignature: string;
  } | null>(null);

  const mintWithToken = async (
    imageUrl: string, 
    name: string, 
    description: string,
    tokenMint: string = GOR_TOKEN_MINT,
    paymentAmount: number = NFT_PRICE_IN_GOR,
    recipientAddress: string = PAYMENT_RECIPIENT
  ) => {
    if (!wallet.connected) {
      setMintError("Please connect your wallet first");
      return;
    }

    setIsMinting(true);
    setMintError(null);
    setMintSuccess(null);

    try {
      const result = await mintNFTWithToken({
        wallet,
        connection,
        imageUrl,
        name,
        description,
        tokenMint,
        paymentAmount,
        recipientAddress,
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
    mintWithToken,
    isMinting,
    mintError,
    mintSuccess,
    reset,
    isConnected: wallet.connected,
    tokenPrice: NFT_PRICE_IN_GOR,
    tokenMint: GOR_TOKEN_MINT,
  };
}