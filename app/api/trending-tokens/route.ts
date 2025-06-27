import { NextRequest, NextResponse } from "next/server";

const BIRDEYE_API_KEY = process.env.BIRDEYE_API_KEY;
const BIRDEYE_BASE_URL = "https://public-api.birdeye.so";

export async function GET(req: NextRequest) {
  try {
    if (!BIRDEYE_API_KEY) {
      return NextResponse.json(
        { success: false, error: "Birdeye API key not configured" },
        { status: 500 }
      );
    }

    const { searchParams } = new URL(req.url);
    const limit = searchParams.get("limit") || "20";
    const offset = searchParams.get("offset") || "0";

    // Fetch trending tokens
    const trendingResponse = await fetch(
      `${BIRDEYE_BASE_URL}/defi/token_trending?sort_by=rank&sort_type=asc&offset=${offset}&limit=${limit}`,
      {
        headers: {
          'accept': 'application/json',
          'x-chain': 'solana',
          'X-API-KEY': BIRDEYE_API_KEY,
        },
        next: { revalidate: 60 } // Cache for 1 minute
      }
    );

    if (!trendingResponse.ok) {
      const errorText = await trendingResponse.text();
      console.error("Birdeye trending API error:", errorText);
      return NextResponse.json(
        { success: false, error: "Failed to fetch trending tokens" },
        { status: trendingResponse.status }
      );
    }

    const trendingData = await trendingResponse.json();
    
    if (!trendingData.success || !trendingData.data?.items) {
      return NextResponse.json(
        { success: false, error: "Invalid response from Birdeye API" },
        { status: 500 }
      );
    }

    const tokens = trendingData.data.items;
    
    // Extract token addresses for metadata fetch
    const addresses = tokens.slice(0, 50).map((token: any) => token.address); // Max 50 addresses
    
    let tokensWithMetadata = tokens;
    
    if (addresses.length > 0) {
      try {
        // Fetch metadata for all tokens
        const metadataResponse = await fetch(
          `${BIRDEYE_BASE_URL}/defi/v3/token/meta-data/multiple`,
          {
            method: 'POST',
            headers: {
              'accept': 'application/json',
              'content-type': 'application/json',
              'x-chain': 'solana',
              'X-API-KEY': BIRDEYE_API_KEY,
            },
            body: JSON.stringify({
              list_address: addresses
            }),
            next: { revalidate: 300 } // Cache metadata for 5 minutes
          }
        );

        if (metadataResponse.ok) {
          const metadataData = await metadataResponse.json();
          
          if (metadataData.success && metadataData.data) {
            // Create a map of address to metadata
            const metadataMap = new Map();
            metadataData.data.forEach((meta: any) => {
              metadataMap.set(meta.address, meta);
            });

            // Enrich tokens with metadata
            tokensWithMetadata = tokens.map((token: any) => {
              const metadata = metadataMap.get(token.address);
              return {
                ...token,
                metadata: metadata || null,
                logoURI: metadata?.logoURI || token.logoURI,
                name: metadata?.name || token.name,
                symbol: metadata?.symbol || token.symbol,
                extensions: metadata?.extensions || null
              };
            });
          }
        } else {
          console.warn("Failed to fetch token metadata, proceeding without metadata");
        }
      } catch (metadataError) {
        console.warn("Error fetching token metadata:", metadataError);
        // Continue without metadata
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        updateTime: trendingData.data.updateTime,
        updateUnixTime: trendingData.data.updateUnixTime,
        tokens: tokensWithMetadata,
        count: tokensWithMetadata.length
      }
    });

  } catch (error) {
    console.error("Error fetching trending tokens:", error);
    return NextResponse.json(
      { 
        success: false, 
        error: "Failed to fetch trending tokens",
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
}