export interface TrendingToken {
  address: string;
  symbol: string;
  name: string;
  decimals: number;
  logoURI?: string;
  price: number;
  priceChange24h: number;
  volume24h: number;
  volumeChange24h: number;
  marketCap: number;
  marketCapRank?: number;
  holder: number;
  uniqueWallet24h?: number;
  uniqueWalletHistory24h?: number;
  trade24h?: number;
  buy24h?: number;
  sell24h?: number;
  v24hUSD?: number;
  v24hChangePercent?: number;
  liquidity?: number;
  lastTradeUnixTime?: number;
  lastTradeHumanTime?: string;
  rank?: number;
}

export interface TokenMetadata {
  address: string;
  symbol: string;
  name: string;
  decimals: number;
  logoURI?: string;
  extensions?: {
    coingeckoId?: string;
    description?: string;
    website?: string;
    twitter?: string;
    telegram?: string;
    discord?: string;
  };
  tags?: string[];
}

export interface TrendingTokensResponse {
  success: boolean;
  data: {
    updateUnixTime: number;
    updateTime: string;
    items: TrendingToken[];
  };
}

export interface TokenMetadataResponse {
  success: boolean;
  data: TokenMetadata[];
}

export interface TokenPriceData {
  address: string;
  price: number;
  priceChange24h: number;
  volume24h: number;
  marketCap: number;
}