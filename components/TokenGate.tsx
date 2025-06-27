"use client";

import { useEffect, useState, useCallback } from "react";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { Button } from "@/components/ui/button";
import { Loader2, Shield, Coins, CheckCircle, XCircle } from "lucide-react";
import { checkWalletAccess, TokenGateResult, MIN_GOR_BALANCE } from "@/lib/solana/tokenGating";
import { ClientWalletButton } from "@/components/ClientWalletButton";
import { TOKEN_GATING_CONFIG } from "@/config/tokenGating";

interface TokenGateProps {
  children: React.ReactNode;
  onAccessGranted?: () => void;
  onAccessDenied?: () => void;
}

export function TokenGate({ children, onAccessGranted, onAccessDenied }: TokenGateProps) {
  const { connection } = useConnection();
  const { publicKey, connected } = useWallet();
  const [isChecking, setIsChecking] = useState(false);
  const [accessResult, setAccessResult] = useState<TokenGateResult | null>(null);
  const [hasChecked, setHasChecked] = useState(false);

  const checkAccess = useCallback(async () => {
    if (!publicKey || !connected) return;

    setIsChecking(true);
    try {
      const result = await checkWalletAccess(connection, publicKey.toString());
      setAccessResult(result);
      setHasChecked(true);

      // Call callbacks
      if (result.hasAccess) {
        onAccessGranted?.();
      } else {
        onAccessDenied?.();
      }
    } catch (error) {
      console.error("Error checking access:", error);
      setAccessResult({
        hasAccess: false,
        reason: "Failed to verify access",
        isWhitelisted: false
      });
    } finally {
      setIsChecking(false);
    }
  }, [connection, publicKey, connected, onAccessGranted, onAccessDenied]);

  // Check access when wallet connects
  useEffect(() => {
    if (connected && publicKey && !hasChecked) {
      checkAccess();
    } else if (!connected) {
      // Reset state when wallet disconnects
      setAccessResult(null);
      setHasChecked(false);
    }
  }, [connected, publicKey, hasChecked, checkAccess]);

  const recheckAccess = () => {
    setHasChecked(false);
    setAccessResult(null);
  };

  // Return children directly if token gating is disabled
  if (!TOKEN_GATING_CONFIG.FEATURES.TOKEN_GATING_ENABLED) {
    return <>{children}</>;
  }

  // Show wallet connection prompt if not connected
  if (!connected) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 to-slate-800">
        <div className="max-w-md w-full mx-4 p-8 bg-white dark:bg-slate-800 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700">
          <div className="text-center space-y-6">
            <div className="mx-auto w-16 h-16 bg-gradient-to-r from-green-500 to-emerald-600 rounded-full flex items-center justify-center">
              <Shield className="w-8 h-8 text-white" />
            </div>
            
            <div>
              <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">
                {TOKEN_GATING_CONFIG.MESSAGES.ACCESS_REQUIRED_TITLE}
              </h1>
              <p className="text-slate-600 dark:text-slate-400">
                {TOKEN_GATING_CONFIG.MESSAGES.ACCESS_REQUIRED_DESCRIPTION}
              </p>
            </div>

            <div className="bg-slate-50 dark:bg-slate-700 rounded-lg p-4">
              <h3 className="font-semibold text-slate-900 dark:text-white mb-2">Access Requirements:</h3>
              <div className="space-y-2 text-sm text-slate-600 dark:text-slate-400">
                <div className="flex items-center gap-2">
                  <Coins className="w-4 h-4 text-green-500" />
                  <span>Hold at least {MIN_GOR_BALANCE} $GOR tokens</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-blue-500" />
                  <span>OR be on the whitelist</span>
                </div>
              </div>
            </div>

            <ClientWalletButton />
          </div>
        </div>
        <div dangerouslySetInnerHTML={{ __html: '<elevenlabs-convai agent-id="agent_01jyqnyjhjf209zwa369bwn9s2"></elevenlabs-convai>' }} />
      </div>
    );
  }

  // Show checking state
  if (isChecking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 to-slate-800">
        <div className="text-center space-y-4 text-white">
          <Loader2 className="w-8 h-8 animate-spin mx-auto" />
          <p className="text-lg">{TOKEN_GATING_CONFIG.MESSAGES.CHECKING_ACCESS}</p>
          <p className="text-sm text-slate-400">{TOKEN_GATING_CONFIG.MESSAGES.CHECKING_BALANCE}</p>
        </div>
        <div dangerouslySetInnerHTML={{ __html: '<elevenlabs-convai agent-id="agent_01jyqnyjhjf209zwa369bwn9s2"></elevenlabs-convai>' }} />
      </div>
    );
  }

  // Show access denied
  if (accessResult && !accessResult.hasAccess) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 to-slate-800">
        <div className="max-w-md w-full mx-4 p-8 bg-white dark:bg-slate-800 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700">
          <div className="text-center space-y-6">
            <div className="mx-auto w-16 h-16 bg-red-500 rounded-full flex items-center justify-center">
              <XCircle className="w-8 h-8 text-white" />
            </div>
            
            <div>
              <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">
                {TOKEN_GATING_CONFIG.MESSAGES.ACCESS_DENIED_TITLE}
              </h1>
              <p className="text-slate-600 dark:text-slate-400 mb-4">
                {accessResult.reason}
              </p>
            </div>

            <div className="bg-slate-50 dark:bg-slate-700 rounded-lg p-4 space-y-3">
              <h3 className="font-semibold text-slate-900 dark:text-white">Your Status:</h3>
              
              {typeof accessResult.gorBalance === 'number' && (
                <div className="flex justify-between text-sm">
                  <span className="text-slate-600 dark:text-slate-400">$GOR Balance:</span>
                  <span className="font-mono text-slate-900 dark:text-white">
                    {accessResult.gorBalance.toFixed(2)}
                  </span>
                </div>
              )}
              
              <div className="flex justify-between text-sm">
                <span className="text-slate-600 dark:text-slate-400">Required:</span>
                <span className="font-mono text-green-600">{MIN_GOR_BALANCE} $GOR</span>
              </div>
              
              <div className="flex justify-between text-sm">
                <span className="text-slate-600 dark:text-slate-400">Whitelisted:</span>
                <span className={`font-semibold ${accessResult.isWhitelisted ? 'text-green-600' : 'text-red-600'}`}>
                  {accessResult.isWhitelisted ? 'Yes' : 'No'}
                </span>
              </div>
            </div>

            <div className="space-y-3">
              {TOKEN_GATING_CONFIG.FEATURES.ALLOW_RECHECK && (
                <Button onClick={recheckAccess} className="w-full">
                  <Loader2 className="w-4 h-4 mr-2" />
                  Recheck Access
                </Button>
              )}
              
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Get $GOR tokens or contact support for whitelist access
              </p>
            </div>
          </div>
        </div>
        <div dangerouslySetInnerHTML={{ __html: '<elevenlabs-convai agent-id="agent_01jyqnyjhjf209zwa369bwn9s2"></elevenlabs-convai>' }} />
      </div>
    );
  }

  // Show success and render children
  if (accessResult && accessResult.hasAccess) {
    return (
      <div>
        {/* Conditionally show access status banner */}
        {TOKEN_GATING_CONFIG.FEATURES.SHOW_ACCESS_BANNER && (
          <div className="bg-green-50 dark:bg-green-950 border-b border-green-200 dark:border-green-800 px-4 py-2">
            <div className="flex items-center justify-between max-w-7xl mx-auto">
              <div className="flex items-center gap-2 text-sm text-green-700 dark:text-green-300">
                <CheckCircle className="w-4 h-4" />
                <span>
                  Access verified {accessResult.isWhitelisted ? '(Whitelisted)' : `(${accessResult.gorBalance?.toFixed(2)} $GOR)`}
                </span>
              </div>
              {TOKEN_GATING_CONFIG.FEATURES.ALLOW_RECHECK && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={recheckAccess}
                  className="text-green-700 dark:text-green-300 hover:bg-green-100 dark:hover:bg-green-900"
                >
                  Refresh
                </Button>
              )}
            </div>
          </div>
        )}
        {children}
      </div>
    );
  }

  // Fallback loading state
  return (
    <div className="min-h-screen flex items-center justify-center">
      <Loader2 className="w-8 h-8 animate-spin" />
    </div>
  );
}