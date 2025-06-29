// Token Gating Configuration
// Edit this file to manage access settings

export const TOKEN_GATING_CONFIG = {
  // GOR Token mint address
  GOR_TOKEN_MINT: "71Jvq4Epe2FCJ7JFSF7jLXdNk1Wy4Bhqd9iL6bEFELvg",
  
  // Minimum GOR token balance required (in tokens, not lamports)
  MIN_GOR_BALANCE: 1,
  
  // Token decimals (usually 9 for SPL tokens)
  TOKEN_DECIMALS: 9,
  
  // Whitelisted wallet addresses (full access regardless of token balance)
  WHITELISTED_WALLETS: [
    "BvbWtZC5fei4Bkp3C42zH5pWJEEMmchGx3BxGMuvixat",
    "6iNvvnZsP5nJvSmWbWyGCzHuDpvunT84msELSoKDafcm",
    "5BP6cooQnAcBGw4qMkRGf6ZGUR4PWw7VcykF9UiNQP91",
    "7JnwzvqrLGH5ZkEGjY8VwiwYrNd8cyF7orgPRVSPzRW5",
    "BSg4ZyMunJKr585bUQTwQpigX4Em8iiCqVSHMxnZVz1u", 
    "4rFMYypvtG5rCzEaiCfqtYnAHshdzECrfdBrGMc35K2J",
    "7qV43fA8LHBiCKZEjgBVNsjUvaFXdxg4UHj44q7XE14",
    "FMVgiPYF76x8EwgTVvJJKehZgWKoqMUKs2F9o1Xmn5oe",
    "FSTnCaymi6mdXRUBCAA2GDaPMehXGRHA2CPe6y95ksBP",
    "4jx13ndC1S8nZFhuj29uBPax9FgdFUk5iDG3RoVRM1WA",
    "J57JGoKjL9FyADGDqp81RuMmicqq2MLfHbf5hehn6XTB",
    "FiNucnErvRr7Kf88qCrbtL1zgA4TEYsyz6aViQw5dHRY",
    "DdswWtpNAkZVwJeFFmRKTKk3p3tQHDaBD31QY56xNkCa",
    "8UVUS5oYyeuU9NsGk5JeHAhKvegdjQWXVArwfbaQtPQW",
  ],
  
  // Admin wallet addresses (can modify whitelist)
  ADMIN_WALLETS: [
    "BSg4ZyMunJKr585bUQTwQpigX4Em8iiCqVSHMxnZVz1u", // Primary admin wallet
    "BvbWtZC5fei4Bkp3C42zH5pWJEEMmchGx3BxGMuvixat",
    "6iNvvnZsP5nJvSmWbWyGCzHuDpvunT84msELSoKDafcm",
    "5BP6cooQnAcBGw4qMkRGf6ZGUR4PWw7VcykF9UiNQP91",
    "7JnwzvqrLGH5ZkEGjY8VwiwYrNd8cyF7orgPRVSPzRW5",
    "4rFMYypvtG5rCzEaiCfqtYnAHshdzECrfdBrGMc35K2J",
    "7qV43fA8LHBiCKZEjgBVNsjUvaFXdxg4UHj44q7XE14",
    "FMVgiPYF76x8EwgTVvJJKehZgWKoqMUKs2F9o1Xmn5oe",
    "FSTnCaymi6mdXRUBCAA2GDaPMehXGRHA2CPe6y95ksBP",
    "4jx13ndC1S8nZFhuj29uBPax9FgdFUk5iDG3RoVRM1WA",
    "J57JGoKjL9FyADGDqp81RuMmicqq2MLfHbf5hehn6XTB",
    "FiNucnErvRr7Kf88qCrbtL1zgA4TEYsyz6aViQw5dHRY",
  ],
  
  // Feature flags
  FEATURES: {
    // Enable/disable token gating entirely
    TOKEN_GATING_ENABLED: true,
    
    // Show token balance in UI
    SHOW_TOKEN_BALANCE: false,
    
    // Allow recheck of access
    ALLOW_RECHECK: true,
    
    // Show access status banner when granted
    SHOW_ACCESS_BANNER: true,
    
    // Whitelist-only mode (ignore token balance, only check whitelist)
    WHITELIST_ONLY_MODE: true,
  },
  
  // UI Messages
  MESSAGES: {
    ACCESS_REQUIRED_TITLE: "Gorbagana Access Required",
    ACCESS_REQUIRED_DESCRIPTION: "Connect your whitelisted wallet to access the platform",
    ACCESS_DENIED_TITLE: "Access Denied",
    INSUFFICIENT_TOKENS: "Wallet not whitelisted for platform access",
    VERIFICATION_ERROR: "Failed to verify wallet access",
    CHECKING_ACCESS: "Verifying wallet whitelist status...",
    CHECKING_BALANCE: "Checking wallet permissions",
    WALLET_NOT_WHITELISTED: "Your wallet address is not authorized to access this platform",
  }
};

// Helper function to check if wallet is admin
export function isAdminWallet(walletAddress: string): boolean {
  return TOKEN_GATING_CONFIG.ADMIN_WALLETS.includes(walletAddress);
}

// Helper function to check if wallet is whitelisted
export function isWhitelistedWallet(walletAddress: string): boolean {
  return TOKEN_GATING_CONFIG.WHITELISTED_WALLETS.includes(walletAddress);
}

// Helper function to add wallet to whitelist (admin only)
export function addToWhitelist(walletAddress: string, adminWallet: string): boolean {
  if (!isAdminWallet(adminWallet)) {
    throw new Error("Unauthorized: Only admin wallets can modify whitelist");
  }
  
  if (!TOKEN_GATING_CONFIG.WHITELISTED_WALLETS.includes(walletAddress)) {
    TOKEN_GATING_CONFIG.WHITELISTED_WALLETS.push(walletAddress);
    return true;
  }
  return false; // Already whitelisted
}

// Helper function to remove wallet from whitelist (admin only)
export function removeFromWhitelist(walletAddress: string, adminWallet: string): boolean {
  if (!isAdminWallet(adminWallet)) {
    throw new Error("Unauthorized: Only admin wallets can modify whitelist");
  }
  
  const index = TOKEN_GATING_CONFIG.WHITELISTED_WALLETS.indexOf(walletAddress);
  if (index > -1) {
    TOKEN_GATING_CONFIG.WHITELISTED_WALLETS.splice(index, 1);
    return true;
  }
  return false; // Not found
}