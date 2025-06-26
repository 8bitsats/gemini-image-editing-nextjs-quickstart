"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Trash2, Flame, RefreshCw, Award, Coins } from "lucide-react";
import { useTokenBurning } from "@/hooks/useTokenBurning";
import { TokenInfo } from "@/lib/solana/burnTokens";
import { LAMPORTS_PER_SOL } from "@solana/web3.js";
import { ClientWalletButton } from "@/components/ClientWalletButton";

interface TokenBurnCardProps {
  token: TokenInfo;
  onBurn: (tokenMint: string, amount: number, decimals: number) => void;
  burning: boolean;
  getReward: (amount: number) => number;
}

function TokenBurnCard({ token, onBurn, burning, getReward }: TokenBurnCardProps) {
  const [burnAmount, setBurnAmount] = useState("");
  const [isValid, setIsValid] = useState(false);

  const handleAmountChange = (value: string) => {
    setBurnAmount(value);
    const amount = parseFloat(value);
    setIsValid(amount > 0 && amount <= token.balance);
  };

  const handleBurn = () => {
    const amount = parseFloat(burnAmount);
    if (isValid) {
      onBurn(token.mint, amount, token.decimals);
    }
  };

  const handleMaxClick = () => {
    setBurnAmount(token.balance.toString());
    setIsValid(true);
  };

  const amount = parseFloat(burnAmount) || 0;
  const solReward = getReward(amount) / LAMPORTS_PER_SOL;

  return (
    <Card className="border-2 border-red-200 dark:border-red-800 hover:border-red-300 dark:hover:border-red-700 transition-colors">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg font-semibold text-red-700 dark:text-red-400">
              {token.symbol}
            </CardTitle>
            <p className="text-sm text-muted-foreground truncate">
              {token.mint.slice(0, 8)}...{token.mint.slice(-8)}
            </p>
          </div>
          <div className="text-right">
            <p className="text-sm font-medium">Balance</p>
            <p className="text-lg font-bold">{token.balance.toLocaleString()}</p>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <div className="flex gap-2">
            <Input
              type="number"
              placeholder="Amount to burn"
              value={burnAmount}
              onChange={(e) => handleAmountChange(e.target.value)}
              max={token.balance}
              min="0"
              step="any"
              className="flex-1"
            />
            <Button
              variant="outline"
              size="sm"
              onClick={handleMaxClick}
              className="whitespace-nowrap"
            >
              Max
            </Button>
          </div>
          {amount > 0 && (
            <div className="flex items-center gap-2 text-sm text-green-600 dark:text-green-400">
              <Award className="w-4 h-4" />
              <span>Reward: {solReward.toFixed(6)} SOL</span>
            </div>
          )}
        </div>
        
        <Button
          onClick={handleBurn}
          disabled={!isValid || burning}
          className="w-full bg-gradient-to-r from-red-500 to-orange-600 hover:from-red-600 hover:to-orange-700 text-white"
        >
          <Flame className="w-4 h-4 mr-2" />
          {burning ? "Burning..." : "🔥 Burn Tokens"}
        </Button>
      </CardContent>
    </Card>
  );
}

export function TrashCompactor() {
  const {
    tokens,
    loading,
    burning,
    error,
    burnSuccess,
    burn,
    fetchTokens,
    getReward,
    isConnected,
  } = useTokenBurning();

  const handleBurn = async (tokenMint: string, amount: number, decimals: number) => {
    try {
      await burn(tokenMint, amount, decimals);
    } catch (error) {
      console.error("Burn failed:", error);
    }
  };

  if (!isConnected) {
    return (
      <Card className="w-full max-w-4xl mx-auto">
        <CardHeader className="text-center">
          <CardTitle className="flex items-center justify-center gap-2 text-2xl">
            <Trash2 className="w-8 h-8 text-red-500" />
            Trash Compactor 🗑️
          </CardTitle>
          <p className="text-muted-foreground">
            Clean up your wallet by burning unwanted SPL tokens and earn SOL rewards!
          </p>
        </CardHeader>
        <CardContent className="text-center">
          <div className="space-y-4">
            <p className="text-lg">Connect your wallet to start burning tokens</p>
            <ClientWalletButton />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="w-full max-w-6xl mx-auto space-y-6">
      <Card>
        <CardHeader className="text-center">
          <CardTitle className="flex items-center justify-center gap-2 text-3xl">
            <Trash2 className="w-8 h-8 text-red-500" />
            Trash Compactor 🗑️
          </CardTitle>
          <p className="text-muted-foreground text-lg">
            Clean up your wallet by burning unwanted SPL tokens and earn SOL rewards!
          </p>
          <div className="flex items-center justify-center gap-4 mt-4 text-sm">
            <div className="flex items-center gap-1">
              <Coins className="w-4 h-4 text-green-500" />
              <span>Earn SOL for burning</span>
            </div>
            <div className="flex items-center gap-1">
              <Flame className="w-4 h-4 text-red-500" />
              <span>Deflationary mechanism</span>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-semibold">Your SPL Tokens</h3>
              <p className="text-sm text-muted-foreground">
                {tokens.length} token(s) found in your wallet
              </p>
            </div>
            <Button
              variant="outline"
              onClick={fetchTokens}
              disabled={loading}
              className="flex items-center gap-2"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
              Refresh
            </Button>
          </div>

          {error && (
            <div className="p-4 mb-4 rounded-lg bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800">
              <p className="text-sm text-red-700 dark:text-red-300">Error: {error}</p>
            </div>
          )}

          {burnSuccess && (
            <div className="p-4 mb-4 rounded-lg bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800">
              <h4 className="text-sm font-medium mb-2 text-green-700 dark:text-green-300">
                🔥 Burn Successful!
              </h4>
              <p className="text-sm text-green-600 dark:text-green-400 mb-1">
                {burnSuccess.message}
              </p>
              <p className="text-sm text-green-600 dark:text-green-400">
                Transaction: <code className="text-xs break-all">{burnSuccess.signature}</code>
              </p>
              <div className="flex gap-2 mt-3">
                <a
                  href={`https://solscan.io/tx/${burnSuccess.signature}?cluster=mainnet`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm underline hover:no-underline text-green-600 dark:text-green-400"
                >
                  View on Solscan →
                </a>
              </div>
            </div>
          )}

          {loading ? (
            <div className="text-center py-8">
              <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-2" />
              <p>Loading your tokens...</p>
            </div>
          ) : tokens.length === 0 ? (
            <div className="text-center py-8">
              <Trash2 className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-lg font-semibold mb-2">No SPL Tokens Found</h3>
              <p className="text-muted-foreground">
                Your wallet is already clean! No SPL tokens to burn.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {tokens.map((token) => (
                <TokenBurnCard
                  key={token.mint}
                  token={token}
                  onBurn={handleBurn}
                  burning={burning}
                  getReward={getReward}
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}