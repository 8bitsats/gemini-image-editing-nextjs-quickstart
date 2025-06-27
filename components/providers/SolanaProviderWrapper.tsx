"use client";

import dynamic from "next/dynamic";
import { ReactNode } from "react";

const DynamicSolanaProvider = dynamic(
  () => import("./SolanaProvider").then(mod => ({ default: mod.SolanaProvider })),
  {
    ssr: false,
    loading: () => (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 to-slate-800">
        <div className="text-center space-y-4 text-white">
          <div className="w-8 h-8 border-4 border-white border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-lg">Loading wallet infrastructure...</p>
        </div>
      </div>
    ),
  }
);

interface SolanaProviderWrapperProps {
  children: ReactNode;
}

export function SolanaProviderWrapper({ children }: SolanaProviderWrapperProps) {
  return <DynamicSolanaProvider>{children}</DynamicSolanaProvider>;
}