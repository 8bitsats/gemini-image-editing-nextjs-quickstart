export interface TrendingToken {
  address: string;
  symbol: string;
  name: string;
  decimals: number;
  liquidity: number;
  volume24h: number;
  volume24hUsd: number;
  priceChange24h: number;
  uniqueWallet24h: number;
  uniqueWalletHistory: number[];
  logoURI?: string;
  price?: number;
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
    website?: string;
    twitter?: string;
  };
}

export interface TokenPrice {
  address: string;
  value: number;
  updateUnixTime: number;
  updateHumanTime: string;
  priceChange24h?: number;
}

export interface OHLCV {
  o: number; // open
  h: number; // high
  l: number; // low
  c: number; // close
  v: number; // volume
  unixTime: number;
  type: string;
}

export interface PairOverview {
  address: string;
  baseAddress: string;
  quoteAddress: string;
  baseSymbol: string;
  quoteSymbol: string;
  price: number;
  volume24h: number;
  liquidity: number;
  priceChange24h: number;
  trades24h: number;
  buyers24h: number;
  sellers24h: number;
  createdAt: number;
  dex: string;
}

export interface PriceStats {
  address: string;
  price: number;
  priceChange1h?: number;
  priceChange4h?: number;
  priceChange24h?: number;
  priceChange7d?: number;
  priceChange30d?: number;
  high1h?: number;
  low1h?: number;
  high4h?: number;
  low4h?: number;
  high24h?: number;
  low24h?: number;
  high7d?: number;
  low7d?: number;
  high30d?: number;
  low30d?: number;
  volume1h?: number;
  volume4h?: number;
  volume24h?: number;
  volume7d?: number;
  volume30d?: number;
}

export class BirdEyeClient {
  private baseUrl = 'https://public-api.birdeye.so/defi';
  private headers: HeadersInit;

  constructor(apiKey: string) {
    this.headers = {
      'accept': 'application/json',
      'x-chain': 'solana',
      'X-API-KEY': apiKey,
    };
  }

  async getTrendingTokens(
    sortBy: 'rank' | 'volume24h' | 'volume24hUsd' | 'liquidity' = 'rank',
    sortType: 'asc' | 'desc' = 'asc',
    offset = 0,
    limit = 20
  ): Promise<TrendingToken[]> {
    try {
      const params = new URLSearchParams({
        sort_by: sortBy,
        sort_type: sortType,
        offset: offset.toString(),
        limit: limit.toString(),
      });

      const response = await fetch(`${this.baseUrl}/token_trending?${params}`, {
        method: 'GET',
        headers: this.headers,
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch trending tokens: ${response.statusText}`);
      }

      const data = await response.json();
      return data.data?.items || [];
    } catch (error) {
      console.error('Error fetching trending tokens:', error);
      return [];
    }
  }

  async getMultipleTokenMetadata(addresses: string[]): Promise<Record<string, TokenMetadata>> {
    if (addresses.length === 0 || addresses.length > 50) {
      throw new Error('Address list must contain 1-50 addresses');
    }

    try {
      const params = new URLSearchParams({
        list_address: addresses.join(','),
      });

      const response = await fetch(`${this.baseUrl}/v3/token/meta-data/multiple?${params}`, {
        method: 'GET',
        headers: this.headers,
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch token metadata: ${response.statusText}`);
      }

      const data = await response.json();
      return data.data || {};
    } catch (error) {
      console.error('Error fetching token metadata:', error);
      return {};
    }
  }

  async getMultiplePrices(addresses: string[]): Promise<Record<string, TokenPrice>> {
    if (addresses.length === 0 || addresses.length > 100) {
      throw new Error('Address list must contain 1-100 addresses');
    }

    try {
      const response = await fetch(`${this.baseUrl}/multi_price`, {
        method: 'POST',
        headers: {
          ...this.headers,
          'content-type': 'application/json',
        },
        body: JSON.stringify({
          list_address: addresses.join(','),
        }),
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch prices: ${response.statusText}`);
      }

      const data = await response.json();
      return data.data || {};
    } catch (error) {
      console.error('Error fetching prices:', error);
      return {};
    }
  }

  async getOHLCV(
    address: string,
    type: '1s' | '15s' | '30s' | '1m' | '3m' | '5m' | '15m' | '30m' | '1h' | '2h' | '4h' | '6h' | '8h' | '12h' | '1d' | '3d' | '1w' | '1M' = '1m',
    currency: 'usd' | 'token' = 'usd',
    timeFrom?: number,
    timeTo?: number
  ): Promise<OHLCV[]> {
    try {
      const params = new URLSearchParams({
        address,
        type,
        currency,
      });

      if (timeFrom) params.append('time_from', timeFrom.toString());
      if (timeTo) params.append('time_to', timeTo.toString());

      const response = await fetch(`${this.baseUrl}/v3/ohlcv?${params}`, {
        method: 'GET',
        headers: this.headers,
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch OHLCV data: ${response.statusText}`);
      }

      const data = await response.json();
      return data.data?.items || [];
    } catch (error) {
      console.error('Error fetching OHLCV data:', error);
      return [];
    }
  }

  async getPairOverviewSingle(pairAddress: string): Promise<PairOverview | null> {
    try {
      const params = new URLSearchParams({ pair_address: pairAddress });
      
      const response = await fetch(`${this.baseUrl}/v3/pair/overview/single?${params}`, {
        method: 'GET',
        headers: this.headers,
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch pair overview: ${response.statusText}`);
      }

      const data = await response.json();
      return data.data || null;
    } catch (error) {
      console.error('Error fetching pair overview:', error);
      return null;
    }
  }

  async getPairOverviewMultiple(pairAddresses: string[]): Promise<Record<string, PairOverview>> {
    if (pairAddresses.length === 0 || pairAddresses.length > 20) {
      throw new Error('Pair address list must contain 1-20 addresses');
    }

    try {
      const params = new URLSearchParams({
        list_pair_address: pairAddresses.join(','),
      });

      const response = await fetch(`${this.baseUrl}/v3/pair/overview/multiple?${params}`, {
        method: 'GET',
        headers: this.headers,
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch pair overviews: ${response.statusText}`);
      }

      const data = await response.json();
      return data.data || {};
    } catch (error) {
      console.error('Error fetching pair overviews:', error);
      return {};
    }
  }

  async getPriceStatsSingle(
    address: string,
    type: '1m' | '5m' | '1h' | '6h' | '24h' | '7d' | '30d' = '24h'
  ): Promise<PriceStats | null> {
    try {
      const params = new URLSearchParams({ address, type });
      
      const response = await fetch(`${this.baseUrl}/v3/price/stats/single?${params}`, {
        method: 'GET',
        headers: this.headers,
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch price stats: ${response.statusText}`);
      }

      const data = await response.json();
      return data.data || null;
    } catch (error) {
      console.error('Error fetching price stats:', error);
      return null;
    }
  }

  async getPriceStatsMultiple(
    addresses: string[],
    type: '1m' | '5m' | '1h' | '6h' | '24h' | '7d' | '30d' = '24h'
  ): Promise<Record<string, PriceStats>> {
    if (addresses.length === 0 || addresses.length > 20) {
      throw new Error('Address list must contain 1-20 addresses');
    }

    try {
      const response = await fetch(`${this.baseUrl}/v3/price/stats/multiple`, {
        method: 'POST',
        headers: {
          ...this.headers,
          'content-type': 'application/json',
        },
        body: JSON.stringify({
          list_address: addresses.join(','),
          type,
        }),
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch price stats: ${response.statusText}`);
      }

      const data = await response.json();
      return data.data || {};
    } catch (error) {
      console.error('Error fetching price stats:', error);
      return {};
    }
  }
}