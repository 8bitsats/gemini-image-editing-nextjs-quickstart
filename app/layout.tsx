import type { Metadata, Viewport } from "next";
import { Open_Sans } from "next/font/google";
import "./globals.css";
import "./mobile.css";
import "@solana/wallet-adapter-react-ui/styles.css";
import { ThemeProviders } from "@/components/providers";
import { SolanaProvider } from "@/components/providers/SolanaProvider";
import { TokenGate } from "@/components/TokenGate";
import { GoogleSearch } from "@/components/GoogleSearch";
import { VideoStream } from "@/components/VideoStream";
import { RealtimeArtGallery } from "@/components/RealtimeArtGallery";
import { TrendingTokensTicker } from "@/components/TrendingTokensTicker";
import { DJBoothLauncher } from "@/components/DJBoothLauncher";
import { GorbaganaComputerLauncher } from "@/components/GorbaganaComputerLauncher";
import { VoiceWidgetManager } from "@/components/VoiceWidgetManager";

const openSans = Open_Sans({
  weight: ["400", "500", "700"],
  style: ["normal", "italic"],
  subsets: ["latin"],
  variable: "--font-open-sans",
});

export const metadata: Metadata = {
  title: "Gorbagana Google Deepmind",
  description: "Edit images using Google DeepMind Gemini 2.0",
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "white" },
    { media: "(prefers-color-scheme: dark)", color: "black" },
  ],
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script async src="https://cse.google.com/cse.js?cx=d2c18e59685a44e25"></script>
      </head>
      <body
        className={`${openSans.className} antialiased bg-white dark:bg-slate-950`}
        suppressHydrationWarning
      >
        <ThemeProviders>
          <SolanaProvider>
            <TokenGate>
              <TrendingTokensTicker />
              <RealtimeArtGallery />
              <GoogleSearch />
              <VideoStream />
              {children}
              <DJBoothLauncher />
              <GorbaganaComputerLauncher />
              <VoiceWidgetManager />
            </TokenGate>
          </SolanaProvider>
        </ThemeProviders>
      </body>
    </html>
  );
}
