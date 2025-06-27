import { Connection, PublicKey } from "@solana/web3.js";
import { getAssociatedTokenAddress, getAccount } from "@solana/spl-token";
import { TOKEN_GATING_CONFIG } from "@/config/tokenGating";

// Export config values for easy access
export const GOR_TOKEN_MINT = new PublicKey(TOKEN_GATING_CONFIG.GOR_TOKEN_MINT);
export const MIN_GOR_BALANCE = TOKEN_GATING_CONFIG.MIN_GOR_BALANCE;
export const WHITELISTED_WALLETS = TOKEN_GATING_CONFIG.WHITELISTED_WALLETS;

export interface TokenGateResult {
  hasAccess: boolean;
  reason: string;
  gorBalance?: number;
  isWhitelisted?: boolean;
}

/**
 * Check if a wallet has access to the application
 * Access is granted if:
 * 1. Wallet is in whitelist, OR
 * 2. Wallet holds minimum GOR tokens
 */
export async function checkWalletAccess(
  connection: Connection,
  walletAddress: string
): Promise<TokenGateResult> {
  try {
    const walletPubkey = new PublicKey(walletAddress);
    
    // Check if wallet is whitelisted
    const isWhitelisted = WHITELISTED_WALLETS.includes(walletAddress);
    if (isWhitelisted) {
      return {
        hasAccess: true,
        reason: "Wallet is whitelisted",
        isWhitelisted: true
      };
    }

    // Check GOR token balance
    const gorBalance = await getGorTokenBalance(connection, walletPubkey);
    
    if (gorBalance >= MIN_GOR_BALANCE) {
      return {
        hasAccess: true,
        reason: `Sufficient GOR balance: ${gorBalance}`,
        gorBalance,
        isWhitelisted: false
      };
    }

    return {
      hasAccess: false,
      reason: `Insufficient GOR balance. Required: ${MIN_GOR_BALANCE}, Current: ${gorBalance}`,
      gorBalance,
      isWhitelisted: false
    };

  } catch (error) {
    console.error("Error checking wallet access:", error);
    return {
      hasAccess: false,
      reason: `Error checking wallet: ${error instanceof Error ? error.message : 'Unknown error'}`,
      isWhitelisted: false
    };
  }
}

/**
 * Get GOR token balance for a wallet
 */
export async function getGorTokenBalance(
  connection: Connection,
  walletPubkey: PublicKey
): Promise<number> {
  try {
    // Get the associated token account address for GOR token
    const tokenAccountAddress = await getAssociatedTokenAddress(
      GOR_TOKEN_MINT,
      walletPubkey
    );

    // Get the token account info
    const tokenAccount = await getAccount(connection, tokenAccountAddress);
    
    // Convert balance from lamports to tokens using configured decimals
    const balance = Number(tokenAccount.amount) / Math.pow(10, TOKEN_GATING_CONFIG.TOKEN_DECIMALS);
    return balance;

  } catch (error) {
    // If token account doesn't exist, balance is 0
    if (error instanceof Error && error.message.includes("could not find account")) {
      return 0;
    }
    console.error("Error fetching GOR balance:", error);
    return 0;
  }
}

/**
 * Add a wallet to the whitelist (for admin use)
 */
export function addToWhitelist(walletAddress: string): boolean {
  try {
    // Validate the address
    new PublicKey(walletAddress);
    
    if (!WHITELISTED_WALLETS.includes(walletAddress)) {
      WHITELISTED_WALLETS.push(walletAddress);
      return true;
    }
    return false; // Already whitelisted
  } catch (error) {
    console.error("Invalid wallet address:", error);
    return false;
  }
}

/**
 * Remove a wallet from the whitelist (for admin use)
 */
export function removeFromWhitelist(walletAddress: string): boolean {
  const index = WHITELISTED_WALLETS.indexOf(walletAddress);
  if (index > -1) {
    WHITELISTED_WALLETS.splice(index, 1);
    return true;
  }
  return false;
}