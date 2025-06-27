// Helius RPC URL from environment
const HELIUS_RPC_URL = process.env.NEXT_PUBLIC_HELIUS_RPC_URL;

// Helius API types
interface HeliusCreator {
  address: string;
  verified: boolean;
  share: number;
}

interface HeliusAsset {
  id: string;
  ownership?: {
    owner: string;
  };
  content?: {
    metadata?: {
      name?: string;
      description?: string;
      symbol?: string;
      attributes?: Array<{
        trait_type: string;
        value: string | number;
      }>;
      collection?: {
        family?: string;
      };
      properties?: unknown;
    };
    files?: Array<{
      uri: string;
    }>;
    links?: {
      image?: string;
    };
  };
  creators?: HeliusCreator[];
  grouping?: Array<{
    group_value: string;
  }>;
  authorities?: Array<{
    address: string;
  }>;
  token_info?: {
    token_standard: string;
  };
  mutable?: boolean;
  royalty?: {
    primary_sale_happened: boolean;
    basis_points: number;
  };
  created_at?: string;
}

export interface NFTMetadata {
  mint: string;
  name: string;
  description?: string;
  image?: string;
  symbol?: string;
  creators?: Array<{
    address: string;
    verified: boolean;
    share: number;
  }>;
  attributes?: Array<{
    trait_type: string;
    value: string | number;
  }>;
  collection?: {
    name?: string;
    family?: string;
  };
  properties?: {
    files?: Array<{
      uri: string;
      type: string;
    }>;
  };
}

export interface GorbaganaNFT extends NFTMetadata {
  id: string;
  owner: string;
  mintAddress: string;
  updateAuthority?: string;
  tokenStandard?: string;
  isMutable?: boolean;
  primarySaleHappened?: boolean;
  sellerFeeBasisPoints?: number;
  isGorbagana: boolean;
  mintedAt?: string;
}

/**
 * Fetch NFTs for a specific wallet using Helius RPC
 */
export async function fetchWalletNFTs(walletAddress: string): Promise<GorbaganaNFT[]> {
  if (!HELIUS_RPC_URL) {
    throw new Error("Helius RPC URL not configured");
  }

  try {
    const response = await fetch(HELIUS_RPC_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        jsonrpc: "2.0",
        id: "gorbagana-nft-fetch",
        method: "getAssetsByOwner",
        params: {
          ownerAddress: walletAddress,
          page: 1,
          limit: 1000,
          displayOptions: {
            showFungible: false,
            showNativeBalance: false,
          },
        },
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    
    if (data.error) {
      throw new Error(`Helius API error: ${data.error.message}`);
    }

    const assets = data.result?.items || [];
    
    // Filter and transform to Gorbagana NFTs
    const gorbagaNFTs: GorbaganaNFT[] = assets
      .filter((asset: HeliusAsset) => {
        // Check if this is a Gorbagana NFT (by creator or symbol)
        const isGorbagana = 
          asset.content?.metadata?.symbol === "GOR" ||
          asset.content?.metadata?.name?.toLowerCase().includes("gorbagana") ||
          asset.creators?.some((creator: HeliusCreator) => 
            // Add known Gorbagana creator addresses here
            creator.address === "YourGorbaganaCreatorAddress"
          );
        
        return isGorbagana && asset.content?.metadata;
      })
      .map((asset: HeliusAsset): GorbaganaNFT => ({
        id: asset.id,
        mint: asset.id,
        mintAddress: asset.id,
        owner: asset.ownership?.owner || walletAddress,
        name: asset.content?.metadata?.name || "Unnamed NFT",
        description: asset.content?.metadata?.description,
        image: asset.content?.files?.[0]?.uri || asset.content?.links?.image,
        symbol: asset.content?.metadata?.symbol,
        creators: asset.creators?.map((creator: HeliusCreator) => ({
          address: creator.address,
          verified: creator.verified,
          share: creator.share,
        })),
        attributes: asset.content?.metadata?.attributes || [],
        collection: {
          name: asset.grouping?.[0]?.group_value,
          family: asset.content?.metadata?.collection?.family,
        },
        properties: asset.content?.metadata?.properties,
        updateAuthority: asset.authorities?.[0]?.address,
        tokenStandard: asset.token_info?.token_standard,
        isMutable: asset.mutable,
        primarySaleHappened: asset.royalty?.primary_sale_happened,
        sellerFeeBasisPoints: asset.royalty?.basis_points,
        isGorbagana: true,
        mintedAt: asset.created_at,
      }));

    return gorbagaNFTs;
  } catch (error) {
    console.error("Error fetching NFTs from Helius:", error);
    throw error;
  }
}

/**
 * Fetch all Gorbagana NFTs (useful for gallery view)
 */
export async function fetchAllGorbagaNFTs(): Promise<GorbaganaNFT[]> {
  if (!HELIUS_RPC_URL) {
    throw new Error("Helius RPC URL not configured");
  }

  try {
    // This would require a different approach - perhaps fetching by creator or collection
    // For now, we'll return an empty array as this requires specific collection/creator setup
    console.log("Fetching all Gorbagana NFTs would require collection-based querying");
    return [];
  } catch (error) {
    console.error("Error fetching all Gorbagana NFTs:", error);
    throw error;
  }
}

/**
 * Get NFT details by mint address
 */
export async function fetchNFTByMint(mintAddress: string): Promise<GorbaganaNFT | null> {
  if (!HELIUS_RPC_URL) {
    throw new Error("Helius RPC URL not configured");
  }

  try {
    const response = await fetch(HELIUS_RPC_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        jsonrpc: "2.0",
        id: "gorbagana-nft-detail",
        method: "getAsset",
        params: {
          id: mintAddress,
        },
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    
    if (data.error) {
      throw new Error(`Helius API error: ${data.error.message}`);
    }

    const asset = data.result;
    
    if (!asset || !asset.content?.metadata) {
      return null;
    }

    const gorbagaNFT: GorbaganaNFT = {
      id: asset.id,
      mint: asset.id,
      mintAddress: asset.id,
      owner: asset.ownership?.owner || "",
      name: asset.content?.metadata?.name || "Unnamed NFT",
      description: asset.content?.metadata?.description,
      image: asset.content?.files?.[0]?.uri || asset.content?.links?.image,
      symbol: asset.content?.metadata?.symbol,
      creators: asset.creators?.map((creator: HeliusCreator) => ({
        address: creator.address,
        verified: creator.verified,
        share: creator.share,
      })),
      attributes: asset.content?.metadata?.attributes || [],
      collection: {
        name: asset.grouping?.[0]?.group_value,
        family: asset.content?.metadata?.collection?.family,
      },
      properties: asset.content?.metadata?.properties,
      updateAuthority: asset.authorities?.[0]?.address,
      tokenStandard: asset.token_info?.token_standard,
      isMutable: asset.mutable,
      primarySaleHappened: asset.royalty?.primary_sale_happened,
      sellerFeeBasisPoints: asset.royalty?.basis_points,
      isGorbagana: true,
      mintedAt: asset.created_at,
    };

    return gorbagaNFT;
  } catch (error) {
    console.error("Error fetching NFT details:", error);
    return null;
  }
}