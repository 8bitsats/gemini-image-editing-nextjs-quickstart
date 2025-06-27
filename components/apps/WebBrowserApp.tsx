"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { 
  ArrowLeft, 
  ArrowRight, 
  RotateCcw, 
  Home, 
  Bookmark, 
  Star,
  Shield,
  Globe,
  Search
} from "lucide-react";

const QUICK_LINKS = [
  { name: "Google", url: "https://google.com", icon: "🔍" },
  { name: "GitHub", url: "https://github.com", icon: "🐙" },
  { name: "Solana", url: "https://solana.com", icon: "🌟" },
  { name: "OpenAI", url: "https://openai.com", icon: "🤖" },
  { name: "YouTube", url: "https://youtube.com", icon: "📺" },
  { name: "Twitter", url: "https://twitter.com", icon: "🐦" },
];

const BOOKMARKS = [
  { name: "Gorbagana Docs", url: "https://docs.gorbagana.ai" },
  { name: "Solana Explorer", url: "https://explorer.solana.com" },
  { name: "Magic Eden", url: "https://magiceden.io" },
  { name: "Jupiter Exchange", url: "https://jup.ag" },
];

export function WebBrowserApp() {
  const [currentUrl, setCurrentUrl] = useState("gorbagana://home");
  const [urlInput, setUrlInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleNavigate = (url: string) => {
    setIsLoading(true);
    setCurrentUrl(url);
    setUrlInput(url);
    
    // Simulate loading
    setTimeout(() => {
      setIsLoading(false);
    }, 1000);
  };

  const handleUrlSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (urlInput.trim()) {
      let url = urlInput.trim();
      if (!url.startsWith("http://") && !url.startsWith("https://") && !url.startsWith("gorbagana://")) {
        url = `https://${url}`;
      }
      handleNavigate(url);
    }
  };

  const renderContent = () => {
    if (currentUrl === "gorbagana://home") {
      return (
        <div className="p-8">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-gray-800 mb-2">
              🌐 Gorbagana Browser
            </h1>
            <p className="text-gray-600">
              Your gateway to the decentralized web
            </p>
          </div>

          <div className="mb-8">
            <h2 className="text-xl font-semibold mb-4">Quick Links</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {QUICK_LINKS.map((link) => (
                <Card
                  key={link.name}
                  className="cursor-pointer hover:shadow-md transition-shadow"
                  onClick={() => handleNavigate(link.url)}
                >
                  <CardContent className="flex items-center p-4">
                    <span className="text-2xl mr-3">{link.icon}</span>
                    <span className="font-medium">{link.name}</span>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          <div>
            <h2 className="text-xl font-semibold mb-4">Bookmarks</h2>
            <div className="space-y-2">
              {BOOKMARKS.map((bookmark) => (
                <div
                  key={bookmark.name}
                  className="flex items-center p-3 hover:bg-gray-50 rounded-lg cursor-pointer"
                  onClick={() => handleNavigate(bookmark.url)}
                >
                  <Star className="w-4 h-4 text-yellow-500 mr-3" />
                  <div>
                    <div className="font-medium">{bookmark.name}</div>
                    <div className="text-sm text-gray-500">{bookmark.url}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className="h-full relative">
        {isLoading ? (
          <div className="flex items-center justify-center h-full">
            <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-blue-500"></div>
          </div>
        ) : (
          <div className="h-full bg-white">
            {currentUrl.startsWith("https://google.com") ? (
              <iframe
                src={`${currentUrl}/search?igu=1&source=hp&ei=&iflsig=&output=embed`}
                className="w-full h-full border-0"
                title="Google Search"
              />
            ) : (
              <div className="flex flex-col items-center justify-center h-full p-8 text-center">
                <Globe className="w-16 h-16 text-gray-300 mb-4" />
                <h3 className="text-xl font-semibold text-gray-600 mb-2">
                  External Site
                </h3>
                <p className="text-gray-500 mb-4">
                  You are navigating to: {currentUrl}
                </p>
                <p className="text-sm text-gray-400 max-w-md">
                  For security reasons, external sites are not directly embedded. 
                  In a full implementation, this would show the actual website content.
                </p>
                <Button
                  variant="outline"
                  className="mt-4"
                  onClick={() => window.open(currentUrl, "_blank")}
                >
                  Open in New Tab
                </Button>
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="h-full flex flex-col">
      <div className="bg-gray-100 border-b p-3 space-y-3">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="h-8">
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <Button variant="outline" size="sm" className="h-8">
            <ArrowRight className="w-4 h-4" />
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            className="h-8"
            onClick={() => handleNavigate(currentUrl)}
          >
            <RotateCcw className="w-4 h-4" />
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            className="h-8"
            onClick={() => handleNavigate("gorbagana://home")}
          >
            <Home className="w-4 h-4" />
          </Button>
        </div>

        <form onSubmit={handleUrlSubmit} className="flex items-center gap-2">
          <div className="flex items-center flex-1 bg-white rounded border">
            <div className="px-3 py-2 border-r">
              <Shield className="w-4 h-4 text-green-500" />
            </div>
            <Input
              value={urlInput}
              onChange={(e) => setUrlInput(e.target.value)}
              placeholder="Search or enter address..."
              className="border-0 focus:ring-0 flex-1"
            />
            <Button type="submit" variant="ghost" size="sm" className="m-1">
              <Search className="w-4 h-4" />
            </Button>
          </div>
          <Button variant="outline" size="sm">
            <Bookmark className="w-4 h-4" />
          </Button>
        </form>
      </div>

      <div className="flex-1 overflow-hidden">
        {renderContent()}
      </div>

      <div className="bg-gray-50 border-t px-3 py-1 text-xs text-gray-500 flex justify-between items-center">
        <span>Ready</span>
        <span>{currentUrl}</span>
      </div>
    </div>
  );
}