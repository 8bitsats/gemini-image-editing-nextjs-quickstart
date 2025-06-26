import type { Metadata, Viewport } from "next";
import { Open_Sans } from "next/font/google";
import "./globals.css";
import "@solana/wallet-adapter-react-ui/styles.css";
import { ThemeProviders } from "@/components/providers";
import { SolanaProvider } from "@/components/providers/SolanaProvider";

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
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${openSans.className} antialiased bg-white dark:bg-slate-950`}
        suppressHydrationWarning
      >
        <ThemeProviders>
          <SolanaProvider>{children}</SolanaProvider>
        </ThemeProviders>
      </body>
    </html>
  );
}
