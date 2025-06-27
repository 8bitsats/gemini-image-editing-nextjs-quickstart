import { TrendingToken, TokenMetadata } from "@/lib/types/birdeye";

// Cache for token data
const tokenCache = new Map<string, any>();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

export interface EnrichedTokenData {
  address: string;
  symbol: string;
  name: string;
  price?: number;
  priceChange24h?: number;
  volume24h?: number;
  marketCap?: number;
  holders?: number;
  metadata?: TokenMetadata;
  trending?: boolean;
  rank?: number;
}

// Common Solana token addresses
const WELL_KNOWN_TOKENS: { [symbol: string]: string } = {
  'SOL': 'So11111111111111111111111111111111111111112',
  'USDC': 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
  'USDT': 'Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB',
  'JUP': 'JUPyiwrYJFskUPiHa7hkeR8VUtAeFoSYbKedZNsDvCN',
  'RAY': '4k3Dyjzvzp8eMZWUXbBCjEvwSkkk59S5iCNLY3QrkX6R',
  'BONK': 'DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263',
  'WIF': 'EKpQGSJtjMFqKZ9KQanSqYXRcF8fBopzLHYxdM65zcjm',
  'POPCAT': '7GCihgDB8fe6KNjn2MYtkzZcRjQy3t9GHdC8uHYmW2hr',
  'PYTH': 'HZ1JovNiVvGrGNiiYvEozEVgZ58xaU3RKwX8eACQBCt3',
  'ORCA': 'orcaEKTdK7LKz57vaAYr9QeNsVEPfiu6QeMU1kektZE',
  'SRM': 'SRMuApVNdxXokk5GT7XD5cUUgXMBCoAz2LHeuAoKWRt',
  'MNGO': 'MangoCzJ36AjZyKwVj3VnYU4GTonjfVEnJmvvWaxLac'
};

// Detect token mentions in text
export function detectTokenMentions(text: string): string[] {
  const tokenPattern = /\$([A-Z]{2,10})\b/g;
  const matches = Array.from(text.matchAll(tokenPattern));
  return [...new Set(matches.map(match => match[1].toUpperCase()))];
}

// Get token address from symbol
export function getTokenAddress(symbol: string): string | null {
  return WELL_KNOWN_TOKENS[symbol.toUpperCase()] || null;
}

// Fetch token data from cache or API
export async function getTokenData(symbolOrAddress: string): Promise<EnrichedTokenData | null> {
  const cacheKey = symbolOrAddress.toUpperCase();
  const cached = tokenCache.get(cacheKey);
  
  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    return cached.data;
  }

  try {
    // First try to get address if it's a symbol
    let address = symbolOrAddress;
    if (symbolOrAddress.length < 32) {
      address = getTokenAddress(symbolOrAddress) || symbolOrAddress;
    }

    // Fetch from trending tokens API first
    const trendingResponse = await fetch('/api/trending-tokens?limit=100');
    if (trendingResponse.ok) {
      const trendingData = await trendingResponse.json();
      if (trendingData.success) {
        const trendingToken = trendingData.data.tokens.find((token: any) => 
          token.address === address || 
          token.symbol.toUpperCase() === symbolOrAddress.toUpperCase()
        );
        
        if (trendingToken) {
          const enrichedData: EnrichedTokenData = {
            address: trendingToken.address,
            symbol: trendingToken.symbol,
            name: trendingToken.name,
            price: trendingToken.price,
            priceChange24h: trendingToken.priceChange24h,
            volume24h: trendingToken.volume24h,
            marketCap: trendingToken.marketCap,
            holders: trendingToken.holder,
            metadata: trendingToken.metadata,
            trending: true,
            rank: trendingToken.rank
          };
          
          tokenCache.set(cacheKey, {
            data: enrichedData,
            timestamp: Date.now()
          });
          
          return enrichedData;
        }
      }
    }

    // If not found in trending, try direct metadata lookup
    if (address && address.length >= 32) {
      // This would require a separate metadata endpoint for individual tokens
      // For now, return basic info if we have the address
      const basicData: EnrichedTokenData = {
        address,
        symbol: symbolOrAddress.length < 10 ? symbolOrAddress.toUpperCase() : 'UNKNOWN',
        name: `Token ${symbolOrAddress}`,
        trending: false
      };
      
      tokenCache.set(cacheKey, {
        data: basicData,
        timestamp: Date.now()
      });
      
      return basicData;
    }

    return null;
  } catch (error) {
    console.error('Error fetching token data:', error);
    return null;
  }
}

// Generate token context for AI
export async function generateTokenContext(text: string): Promise<string> {
  const mentions = detectTokenMentions(text);
  if (mentions.length === 0) return '';

  const tokenDataPromises = mentions.map(symbol => getTokenData(symbol));
  const tokenDataResults = await Promise.all(tokenDataPromises);
  
  const validTokens = tokenDataResults.filter(data => data !== null) as EnrichedTokenData[];
  
  if (validTokens.length === 0) return '';

  let context = '\n\n--- TOKEN MARKET DATA ---\n';
  context += 'The user mentioned the following tokens. Here is their current market data:\n\n';
  
  for (const token of validTokens) {
    context += `**${token.symbol}** (${token.name})\n`;
    context += `• Address: ${token.address}\n`;
    
    if (token.price) {
      context += `• Price: $${token.price < 0.01 ? token.price.toExponential(2) : token.price.toFixed(token.price < 1 ? 4 : 2)}\n`;
    }
    
    if (token.priceChange24h !== undefined) {
      context += `• 24h Change: ${token.priceChange24h >= 0 ? '+' : ''}${token.priceChange24h.toFixed(2)}%\n`;
    }
    
    if (token.volume24h) {
      const volume = token.volume24h >= 1e6 ? `$${(token.volume24h / 1e6).toFixed(1)}M` : `$${(token.volume24h / 1e3).toFixed(1)}K`;
      context += `• 24h Volume: ${volume}\n`;
    }
    
    if (token.marketCap) {
      const mcap = token.marketCap >= 1e9 ? `$${(token.marketCap / 1e9).toFixed(1)}B` : `$${(token.marketCap / 1e6).toFixed(1)}M`;
      context += `• Market Cap: ${mcap}\n`;
    }
    
    if (token.holders) {
      const holders = token.holders >= 1e6 ? `${(token.holders / 1e6).toFixed(1)}M` : `${(token.holders / 1e3).toFixed(1)}K`;
      context += `• Holders: ${holders}\n`;
    }
    
    if (token.trending && token.rank) {
      context += `• 🔥 Trending #${token.rank}\n`;
    }
    
    if (token.metadata?.extensions?.description) {
      context += `• Description: ${token.metadata.extensions.description}\n`;
    }
    
    context += '\n';
  }
  
  context += '--- END TOKEN DATA ---\n';
  context += 'Use this market data to provide informed responses about these tokens. ';
  context += 'Always mention current prices and trends when discussing these tokens.\n\n';
  
  return context;
}

// Format token data for display
export function formatTokenDisplay(token: EnrichedTokenData): string {
  let display = `${token.symbol}`;
  
  if (token.price) {
    display += ` ($${token.price < 0.01 ? token.price.toExponential(2) : token.price.toFixed(token.price < 1 ? 4 : 2)})`;
  }
  
  if (token.priceChange24h !== undefined) {
    const change = token.priceChange24h >= 0 ? `+${token.priceChange24h.toFixed(2)}%` : `${token.priceChange24h.toFixed(2)}%`;
    display += ` ${change}`;
  }
  
  return display;
}