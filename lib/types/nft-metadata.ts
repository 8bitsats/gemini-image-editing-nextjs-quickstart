/**
 * Metaplex NFT Metadata Standard Types
 * https://docs.metaplex.com/programs/token-metadata/token-standard
 */

export interface NFTAttribute {
  trait_type: string;
  value: string | number;
  display_type?: string; // For numeric values: "number", "boost_number", "boost_percentage"
}

export interface NFTFile {
  uri: string;
  type: string; // e.g., "image/png", "video/mp4"
  cdn?: boolean;
}

export interface NFTProperties {
  files?: NFTFile[];
  category?: "image" | "video" | "audio" | "vr" | "html";
  creators?: {
    address: string;
    share: number; // 0-100
  }[];
}

export interface NFTMetadata {
  // Required fields
  name: string;
  description: string;
  image: string;
  
  // Optional fields
  animation_url?: string;
  external_url?: string;
  attributes?: NFTAttribute[];
  properties?: NFTProperties;
  
  // Additional Metaplex fields
  symbol?: string;
  seller_fee_basis_points?: number; // Royalties in basis points (e.g., 250 = 2.5%)
  
  // Collection reference
  collection?: {
    name: string;
    family?: string;
  };
}

export interface CollectionMetadata extends NFTMetadata {
  // Collection-specific fields
  collection_details?: {
    size?: number;
    symbol?: string;
  };
}

export interface ProgrammableNFTConfig {
  rule_set?: string; // PublicKey of the rule set
  authorization_rules?: {
    operation: "Transfer:Owner" | "Transfer:SaleDelegate" | "Transfer:TransferDelegate" | 
               "Transfer:MigrationDelegate" | "Transfer:WalletToWallet" |
               "Delegate:Sale" | "Delegate:Transfer" | "Delegate:LockedTransfer" |
               "Delegate:Utility" | "Delegate:Staking";
    rule: string; // Rule definition
  }[];
}

export interface NFTGenerationConfig {
  // Collection settings
  collection: {
    name: string;
    symbol: string;
    description: string;
    image: string;
    external_url?: string;
    seller_fee_basis_points: number;
    creators: {
      address: string;
      share: number;
      verified?: boolean;
    }[];
  };
  
  // Generation settings
  generation: {
    size: number; // Total number of NFTs to generate
    baseUri: string; // Base URI for metadata storage
    imageBaseUri?: string; // Optional separate base URI for images
    startIndex?: number; // Starting index for naming (default: 1)
    namePattern?: string; // Pattern for naming, e.g., "#{index} - {trait:Background}"
  };
  
  // Trait layers for generative art
  layers?: {
    name: string;
    traits: {
      name: string;
      fileName: string;
      weight: number; // Rarity weight
      attributes?: { [key: string]: any }; // Additional attributes
    }[];
    order: number; // Layer order (lower = background, higher = foreground)
    blend_mode?: string; // e.g., "normal", "multiply", "screen"
  }[];
  
  // Programmable NFT settings
  programmable?: ProgrammableNFTConfig;
  
  // Token standard
  token_standard: "NonFungible" | "FungibleAsset" | "Fungible" | 
                  "NonFungibleEdition" | "ProgrammableNonFungible";
}

export interface GeneratedNFT {
  index: number;
  metadata: NFTMetadata;
  dna: string; // Unique identifier based on trait combination
  edition: number;
  date: number;
  attributes: NFTAttribute[];
  compiler?: string;
}

export interface VerifiedCreator {
  address: string;
  verified: boolean;
  share: number;
}

export interface CollectionInfo {
  key: string; // Mint address of the collection NFT
  verified: boolean;
}

export interface TokenRecord {
  key: "TokenRecord";
  bump: number;
  state: "Unlocked" | "Locked" | "Listed";
  rule_set_revision?: number;
  delegate?: string;
  delegate_role?: "Sale" | "Transfer" | "Utility" | "Staking" | "LockedTransfer";
  locked_transfer?: string;
}

export interface AuthorizationData {
  payload: {
    map: { [key: string]: any };
  };
}

export interface RuleSet {
  key: string;
  owner: string;
  rule_set_name: string;
  operations: { [operation: string]: any };
}

export interface DigitalAsset {
  publicKey: string;
  mint: {
    publicKey: string;
    supply: number;
    decimals: number;
    mintAuthority?: string;
    freezeAuthority?: string;
  };
  metadata: {
    publicKey: string;
    updateAuthority: string;
    mint: string;
    name: string;
    symbol: string;
    uri: string;
    sellerFeeBasisPoints: number;
    creators?: VerifiedCreator[];
    collection?: CollectionInfo;
    uses?: any;
    collectionDetails?: any;
    programmableConfig?: {
      ruleSet?: string;
    };
  };
  edition?: {
    isOriginal: boolean;
    publicKey: string;
    supply?: number;
    maxSupply?: number;
  };
  token?: {
    publicKey: string;
    mint: string;
    owner: string;
    amount: number;
    delegate?: string;
    delegatedAmount?: number;
    state: "Initialized" | "Frozen";
  };
  tokenRecord?: TokenRecord;
}