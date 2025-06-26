"use client";

import { Connection } from "@solana/web3.js";
import { WalletContextState } from "@solana/wallet-adapter-react";

export interface MintNFTParams {
  wallet: WalletContextState;
  connection: Connection;
  imageUrl: string;
  name: string;
  description: string;
}

// Real NFT minting on Solana mainnet
export async function mintNFT({
  wallet,
  connection,
  imageUrl,
  name,
  description,
}: MintNFTParams) {
  if (!wallet.publicKey || !wallet.signTransaction) {
    throw new Error("Wallet not connected");
  }

  try {
    // Dynamic import Metaplex to avoid SSR issues
    const { Metaplex, walletAdapterIdentity, toMetaplexFile, bundlrStorage } = await import(
      "@metaplex-foundation/js"
    );

    // Initialize Metaplex with wallet adapter and bundlr storage
    const metaplex = Metaplex.make(connection)
      .use(walletAdapterIdentity(wallet))
      .use(bundlrStorage({
        address: "https://node1.bundlr.network",
        providerUrl: process.env.NEXT_PUBLIC_HELIUS_RPC_URL || "https://api.mainnet-beta.solana.com",
        timeout: 60000,
      }));

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
          trait_type: "Creator Platform",
          value: "Gorbagana AI",
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
    });

    return {
      success: true,
      mint: nft.address.toString(),
      metadata: nft.uri,
      name: nft.name,
    };
  } catch (error) {
    console.error("Error minting NFT:", error);
    throw error;
  }
}