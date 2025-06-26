"use client";

import dynamic from "next/dynamic";

// Dynamically import WalletMultiButton with SSR disabled to prevent hydration errors
export const ClientWalletButton = dynamic(
  () => import("@solana/wallet-adapter-react-ui").then((mod) => mod.WalletMultiButton),
  {
    ssr: false,
  }
);