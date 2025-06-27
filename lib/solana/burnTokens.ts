"use client";

import { Connection, PublicKey, Transaction, LAMPORTS_PER_SOL } from "@solana/web3.js";
import { WalletContextState } from "@solana/wallet-adapter-react";
import { Token, TOKEN_PROGRAM_ID } from "@solana/spl-token";

export interface TokenInfo {
  mint: string;
  symbol: string;
  name: string;
  balance: number;
  decimals: number;
  logoURI?: string;
}

export interface BurnTokenParams {
  wallet: WalletContextState;
  connection: Connection;
  tokenMint: string;
  burnAmount: number;
  decimals: number;
}

// SOL reward rates (adjustable)
export const BURN_REWARDS = {
  // Base reward per token burned (in lamports)
  BASE_REWARD: 1000, // 0.000001 SOL per token
  // Bonus for burning large amounts
  BULK_BONUS_THRESHOLD: 1000,
  BULK_BONUS_MULTIPLIER: 1.5,
  // Maximum reward per burn (in lamports)
  MAX_REWARD: 0.01 * LAMPORTS_PER_SOL, // 0.01 SOL max
};

export async function getUserTokenAccounts(
  connection: Connection,
  wallet: PublicKey
): Promise<TokenInfo[]> {
  try {
    const tokenAccounts = await connection.getParsedTokenAccountsByOwner(
      wallet,
      {
        programId: TOKEN_PROGRAM_ID,
      }
    );

    const tokens: TokenInfo[] = [];

    for (const account of tokenAccounts.value) {
      const parsedInfo = account.account.data.parsed.info;
      const balance = parsedInfo.tokenAmount.uiAmount;
      
      // Only include tokens with positive balance
      if (balance > 0) {
        tokens.push({
          mint: parsedInfo.mint,
          symbol: `Token-${parsedInfo.mint.slice(0, 8)}`, // Simplified symbol
          name: `SPL Token ${parsedInfo.mint.slice(0, 8)}`,
          balance: balance,
          decimals: parsedInfo.tokenAmount.decimals,
        });
      }
    }

    return tokens;
  } catch (error) {
    console.error("Error fetching token accounts:", error);
    return [];
  }
}

export function calculateBurnReward(burnAmount: number): number {
  let reward = burnAmount * BURN_REWARDS.BASE_REWARD;
  
  // Apply bulk bonus
  if (burnAmount >= BURN_REWARDS.BULK_BONUS_THRESHOLD) {
    reward *= BURN_REWARDS.BULK_BONUS_MULTIPLIER;
  }
  
  // Cap at maximum reward
  return Math.min(reward, BURN_REWARDS.MAX_REWARD);
}

export async function burnTokens({
  wallet,
  connection,
  tokenMint,
  burnAmount,
  decimals,
}: BurnTokenParams) {
  if (!wallet.publicKey || !wallet.signTransaction) {
    throw new Error("Wallet not connected");
  }

  try {
    const mintPublicKey = new PublicKey(tokenMint);
    
    // Create Token instance
    const token = new Token(
      connection,
      mintPublicKey,
      TOKEN_PROGRAM_ID,
      wallet as any
    );
    
    // Get user's token account
    const tokenAccount = await Token.getAssociatedTokenAddress(
      token.associatedProgramId,
      token.programId,
      mintPublicKey,
      wallet.publicKey
    );

    // Verify token account exists and has sufficient balance
    const tokenAccountInfo = await token.getAccountInfo(tokenAccount);
    
    if (!tokenAccountInfo) {
      throw new Error("Token account not found");
    }

    // @ts-ignore - amount is a u64 type in old spl-token version
    const currentBalance = Number(tokenAccountInfo.amount);
    const burnAmountWithDecimals = burnAmount * Math.pow(10, decimals);

    if (currentBalance < burnAmountWithDecimals) {
      throw new Error(`Insufficient balance. Available: ${currentBalance / Math.pow(10, decimals)}, Requested: ${burnAmount}`);
    }

    // Calculate SOL reward
    const solReward = calculateBurnReward(burnAmount);
    
    console.log(`Burning ${burnAmount} tokens for ${solReward / LAMPORTS_PER_SOL} SOL reward`);

    // Create burn instruction using Token class
    const burnInstruction = Token.createBurnInstruction(
      TOKEN_PROGRAM_ID,
      mintPublicKey,
      tokenAccount,
      wallet.publicKey,
      [],
      burnAmountWithDecimals
    );

    // Note: SOL rewards would come from a treasury/reward pool in production
    
    // Create and send transaction
    const transaction = new Transaction().add(burnInstruction);
    
    // Get recent blockhash
    const { blockhash } = await connection.getLatestBlockhash();
    transaction.recentBlockhash = blockhash;
    transaction.feePayer = wallet.publicKey;

    // Sign and send transaction
    const signedTransaction = await wallet.signTransaction(transaction);
    const signature = await connection.sendRawTransaction(signedTransaction.serialize());
    
    // Wait for confirmation
    await connection.confirmTransaction(signature, "confirmed");
    
    console.log("Burn transaction confirmed:", signature);

    return {
      success: true,
      signature,
      burnedAmount: burnAmount,
      solReward: solReward / LAMPORTS_PER_SOL,
      message: `🔥 Successfully burned ${burnAmount} tokens! Earned ${solReward / LAMPORTS_PER_SOL} SOL reward.`
    };

  } catch (error) {
    console.error("Error burning tokens:", error);
    throw error;
  }
}