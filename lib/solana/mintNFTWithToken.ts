"use client";

import { Connection, PublicKey, Transaction } from "@solana/web3.js";
import { WalletContextState } from "@solana/wallet-adapter-react";
import { Token, TOKEN_PROGRAM_ID } from "@solana/spl-token";

export interface MintNFTWithTokenParams {
  wallet: WalletContextState;
  connection: Connection;
  imageUrl: string;
  name: string;
  description: string;
  tokenMint: string; // The SPL token mint address for payment
  paymentAmount: number; // Amount of tokens to pay
  recipientAddress: string; // Address to receive the token payment
}

// The GOR token mint address on mainnet
export const GOR_TOKEN_MINT = "71Jvq4Epe2FCJ7JFSF7jLXdNk1Wy4Bhqd9iL6bEFELvg";
export const NFT_PRICE_IN_GOR = 0.1; // Price in GOR tokens (adjusted for testing)
export const PAYMENT_RECIPIENT = "8bit6v5QJnLp3kq8hRmqxFsQ9vZeJjKpSBxzXjWHqCFh"; // Replace with actual recipient

// Real NFT minting with SPL token payment on Solana mainnet
export async function mintNFTWithToken({
  wallet,
  connection,
  imageUrl,
  name,
  description,
  tokenMint = GOR_TOKEN_MINT,
  paymentAmount = NFT_PRICE_IN_GOR,
  recipientAddress = PAYMENT_RECIPIENT,
}: MintNFTWithTokenParams) {
  if (!wallet.publicKey || !wallet.signTransaction) {
    throw new Error("Wallet not connected");
  }

  try {
    // Get token accounts
    const tokenMintPubkey = new PublicKey(tokenMint);
    const recipientPubkey = new PublicKey(recipientAddress);
    
    // Create Token instance
    const token = new Token(
      connection,
      tokenMintPubkey,
      TOKEN_PROGRAM_ID,
      wallet as any
    );
    
    // Get user's token account
    const userTokenAccount = await Token.getAssociatedTokenAddress(
      token.associatedProgramId,
      token.programId,
      tokenMintPubkey,
      wallet.publicKey
    );

    // Check user's token balance
    const userTokenAccountInfo = await token.getAccountInfo(userTokenAccount);
    
    if (!userTokenAccountInfo) {
      throw new Error("User token account not found");
    }

    // @ts-ignore - amount is a u64 type in old spl-token version
    const userBalance = Number(userTokenAccountInfo.amount);
    console.log(`User GOR balance: ${userBalance}`);

    // Check if user has enough tokens (assuming GOR has 9 decimals)
    const requiredAmount = paymentAmount * Math.pow(10, 9);
    if (userBalance < requiredAmount) {
      throw new Error(`Insufficient GOR balance. Required: ${paymentAmount} GOR, Available: ${userBalance / Math.pow(10, 9)} GOR`);
    }

    // Get recipient's token account
    const recipientTokenAccount = await Token.getAssociatedTokenAddress(
      token.associatedProgramId,
      token.programId,
      tokenMintPubkey,
      recipientPubkey
    );

    // Create transfer instruction
    const transferInstruction = Token.createTransferInstruction(
      TOKEN_PROGRAM_ID,
      userTokenAccount,
      recipientTokenAccount,
      wallet.publicKey,
      [],
      requiredAmount
    );

    // Create transaction for token payment
    const paymentTransaction = new Transaction().add(transferInstruction);

    // Get recent blockhash
    const { blockhash } = await connection.getLatestBlockhash();
    paymentTransaction.recentBlockhash = blockhash;
    paymentTransaction.feePayer = wallet.publicKey;

    // Sign and send payment transaction
    const signedTx = await wallet.signTransaction(paymentTransaction);
    const paymentSig = await connection.sendRawTransaction(signedTx.serialize());
    
    console.log("Token payment sent:", paymentSig);
    
    // Wait for payment confirmation
    await connection.confirmTransaction(paymentSig, "confirmed");
    console.log("Token payment confirmed!");

    // Now proceed with NFT minting
    // Dynamic import Metaplex to avoid SSR issues
    const { Metaplex, walletAdapterIdentity, toMetaplexFile } = await import(
      "@metaplex-foundation/js"
    );

    // Initialize Metaplex with wallet adapter (bundlr is deprecated in newer versions)
    const metaplex = Metaplex.make(connection)
      .use(walletAdapterIdentity(wallet));

    console.log("Uploading image to decentralized storage...");
    
    // Convert base64 to file
    const base64Data = imageUrl.split(",")[1];
    const mimeType = imageUrl.split(":")[1].split(";")[0];
    const byteCharacters = atob(base64Data);
    const byteNumbers = new Array(byteCharacters.length);
    
    for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.charCodeAt(i);
    }
    
    const byteArray = new Uint8Array(byteNumbers);
    
    // Create Metaplex file directly from Uint8Array
    const file = toMetaplexFile(byteArray, "gorbagana-nft.png");
    
    // Upload image
    const imageUri = await metaplex.storage().upload(file);
    console.log("Image uploaded:", imageUri);

    // Upload metadata
    console.log("Uploading metadata...");
    const { uri: metadataUri } = await metaplex.nfts().uploadMetadata({
      name,
      description,
      image: imageUri,
      attributes: [
        {
          trait_type: "Generator",
          value: "Gorbagana Google Deepmind",
        },
        {
          trait_type: "Created",
          value: new Date().toISOString(),
        },
        {
          trait_type: "Payment Method",
          value: "GOR Token",
        },
        {
          trait_type: "Payment Amount",
          value: paymentAmount.toString(),
        },
      ],
      properties: {
        files: [
          {
            uri: imageUri,
            type: mimeType || "image/png",
          },
        ],
        category: "image",
      },
    });
    console.log("Metadata uploaded:", metadataUri);

    // Create the NFT
    console.log("Minting NFT...");
    const { nft } = await metaplex.nfts().create({
      uri: metadataUri,
      name,
      sellerFeeBasisPoints: 500, // 5% royalty
      symbol: "GOR",
      creators: [
        {
          address: wallet.publicKey,
          share: 100,
        },
      ],
      isMutable: true,
    });

    console.log("NFT minted successfully!", {
      mint: nft.address.toString(),
      name: nft.name,
      uri: nft.uri,
      paymentTx: paymentSig,
    });

    return {
      success: true,
      mint: nft.address.toString(),
      metadata: nft.uri,
      name: nft.name,
      paymentSignature: paymentSig,
    };
  } catch (error) {
    console.error("Error minting NFT with token:", error);
    throw error;
  }
}