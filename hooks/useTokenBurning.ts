"use client";

import { useState, useEffect } from "react";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { getUserTokenAccounts, burnTokens, TokenInfo, calculateBurnReward } from "@/lib/solana/burnTokens";

export function useTokenBurning() {
  const { connection } = useConnection();
  const wallet = useWallet();
  const [tokens, setTokens] = useState<TokenInfo[]>([]);
  const [loading, setLoading] = useState(false);
  const [burning, setBurning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [burnSuccess, setBurnSuccess] = useState<{
    signature: string;
    burnedAmount: number;
    solReward: number;
    message: string;
  } | null>(null);

  // Fetch user's token accounts
  const fetchTokens = async () => {
    if (!wallet.publicKey) {
      setTokens([]);
      return;
    }

    setLoading(true);
    setError(null);
    
    try {
      const userTokens = await getUserTokenAccounts(connection, wallet.publicKey);
      setTokens(userTokens);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch tokens");
    } finally {
      setLoading(false);
    }
  };

  // Burn selected tokens
  const burn = async (tokenMint: string, burnAmount: number, decimals: number) => {
    if (!wallet.connected) {
      setError("Please connect your wallet first");
      return;
    }

    setBurning(true);
    setError(null);
    setBurnSuccess(null);

    try {
      const result = await burnTokens({
        wallet,
        connection,
        tokenMint,
        burnAmount,
        decimals,
      });

      setBurnSuccess(result);
      
      // Refresh token list after successful burn
      await fetchTokens();
      
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to burn tokens";
      setError(errorMessage);
      throw err;
    } finally {
      setBurning(false);
    }
  };

  // Calculate reward for a given amount
  const getReward = (amount: number) => {
    return calculateBurnReward(amount);
  };

  // Reset state
  const reset = () => {
    setError(null);
    setBurnSuccess(null);
  };

  // Auto-fetch tokens when wallet connects
  useEffect(() => {
    if (wallet.connected) {
      fetchTokens();
    } else {
      setTokens([]);
      reset();
    }
  }, [wallet.connected, wallet.publicKey]);

  return {
    tokens,
    loading,
    burning,
    error,
    burnSuccess,
    burn,
    fetchTokens,
    getReward,
    reset,
    isConnected: wallet.connected,
  };
}