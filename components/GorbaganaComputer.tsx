"use client";

import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Settings, Home } from "lucide-react";
import { Button } from "@/components/ui/button";

// Import our existing components
import { EnhancedGorbaganaTerminal } from "@/components/EnhancedGorbaganaTerminal";
import { VideoGeneration } from "@/components/VideoGeneration";
import { MusicGeneration } from "@/components/MusicGeneration";
import { NFTStudio } from "@/components/NFTStudio";
import { ImageGeneration } from "@/components/ImageGeneration";
import { DocumentsApp } from "@/components/apps/DocumentsApp";
import { WebBrowserApp } from "@/components/apps/WebBrowserApp";
import { GamesApp } from "@/components/apps/GamesApp";

interface AppDefinition {
  id: string;
  name: string;
  icon: string;
  color: string;
  component?: React.ComponentType;
}

const GORBAGANA_APPS: AppDefinition[] = [
  {
    id: "gorbagana_ai",
    name: "GorbaganaAI",
    icon: "🧠",
    color: "#e3f2fd",
    component: EnhancedGorbaganaTerminal,
  },
  {
    id: "art_studio",
    name: "Art Studio",
    icon: "🎨",
    color: "#f1f8e9",
    component: ImageGeneration,
  },
  {
    id: "video_studio",
    name: "Video Studio",
    icon: "🎬",
    color: "#fffde7",
    component: VideoGeneration,
  },
  {
    id: "music_studio",
    name: "Music Studio",
    icon: "🎵",
    color: "#e7f3ff",
    component: MusicGeneration,
  },
  {
    id: "nft_studio",
    name: "NFT Studio",
    icon: "💎",
    color: "#ffebee",
    component: NFTStudio,
  },
  {
    id: "documents",
    name: "Documents",
    icon: "📁",
    color: "#e0f7fa",
    component: DocumentsApp,
  },
  {
    id: "settings",
    name: "Settings",
    icon: "⚙️",
    color: "#f5f5f5",
  },
  {
    id: "web_browser",
    name: "Web Browser",
    icon: "🌐",
    color: "#e8f5e9",
    component: WebBrowserApp,
  },
  {
    id: "wallet",
    name: "Solana Wallet",
    icon: "💰",
    color: "#fff3e0",
  },
  {
    id: "games",
    name: "Games",
    icon: "🎮",
    color: "#f3e5f5",
    component: GamesApp,
  },
];

interface DesktopIconProps {
  app: AppDefinition;
  onOpen: (app: AppDefinition) => void;
}

const DesktopIcon: React.FC<DesktopIconProps> = ({ app, onOpen }) => {
  return (
    <motion.div
      className="w-28 h-32 flex flex-col items-center justify-start text-center m-2 p-2 cursor-pointer select-none rounded-lg transition-colors hover:bg-white/20 focus:bg-white/20 focus:outline-none focus:ring-2 focus:ring-purple-500"
      onClick={() => onOpen(app)}
      onKeyDown={(e) => e.key === "Enter" && onOpen(app)}
      tabIndex={0}
      role="button"
      aria-label={`Open ${app.name}`}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div className="text-6xl mb-2 drop-shadow-lg filter">{app.icon}</div>
      <div className="text-sm text-white font-semibold break-words max-w-full leading-tight drop-shadow-md">
        {app.name}
      </div>
    </motion.div>
  );
};

interface WindowProps {
  app: AppDefinition;
  onClose: () => void;
  children: React.ReactNode;
}

const Window: React.FC<WindowProps> = ({ app, onClose, children }) => {
  return (
    <motion.div
      className="w-[90vw] max-w-[1200px] h-[85vh] bg-white/95 backdrop-blur-lg border border-gray-300/50 rounded-xl shadow-2xl flex flex-col relative overflow-hidden font-sans"
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      exit={{ scale: 0.8, opacity: 0 }}
      transition={{ duration: 0.3, type: "spring" }}
    >
      {/* Title Bar */}
      <div className="bg-gradient-to-r from-purple-600 to-pink-600 text-white py-3 px-4 font-semibold text-base flex justify-between items-center select-none cursor-default rounded-t-xl flex-shrink-0">
        <div className="flex items-center gap-2">
          <span className="text-xl">{app.icon}</span>
          <span className="title-bar-text">{app.name}</span>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={onClose}
          className="text-white hover:bg-white/20 h-6 w-6 p-0"
        >
          <X className="w-4 h-4" />
        </Button>
      </div>

      {/* Menu Bar */}
      <div className="bg-gray-100/90 py-2 px-3 border-b border-gray-200/50 select-none flex gap-4 flex-shrink-0 text-sm text-gray-700 items-center backdrop-blur-sm">
        <Button
          variant="ghost"
          size="sm"
          onClick={onClose}
          className="text-gray-700 hover:bg-gray-200/50 h-7 text-xs"
        >
          <Home className="w-3 h-3 mr-1" />
          Exit to Desktop
        </Button>
      </div>

      {/* Content */}
      <div className="flex-grow overflow-hidden bg-gradient-to-br from-gray-50 to-white">
        {children}
      </div>
    </motion.div>
  );
};

interface GorbaganaComputerProps {
  isOpen: boolean;
  onClose: () => void;
}

export function GorbaganaComputer({ isOpen, onClose }: GorbaganaComputerProps) {
  const [activeApp, setActiveApp] = useState<AppDefinition | null>(null);

  const handleAppOpen = useCallback((app: AppDefinition) => {
    setActiveApp(app);
  }, []);

  const handleAppClose = useCallback(() => {
    setActiveApp(null);
  }, []);

  const handleMasterClose = useCallback(() => {
    setActiveApp(null);
    onClose();
  }, [onClose]);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 z-50 flex items-center justify-center p-4"
        onClick={(e) => e.target === e.currentTarget && handleMasterClose()}
      >
        {/* Desktop Background Pattern */}
        <div className="absolute inset-0 opacity-10">
          <div
            className="w-full h-full"
            style={{
              backgroundImage: `radial-gradient(circle at 25% 25%, purple 2px, transparent 2px),
                               radial-gradient(circle at 75% 75%, pink 1px, transparent 1px)`,
              backgroundSize: "60px 60px",
            }}
          />
        </div>

        <AnimatePresence mode="wait">
          {!activeApp ? (
            <motion.div
              key="desktop"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="w-full max-w-7xl h-full flex flex-col items-center justify-center relative"
            >
              {/* Desktop Header */}
              <motion.div
                initial={{ y: -50, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                className="text-center mb-8"
              >
                <h1 className="text-4xl font-bold text-white mb-2 drop-shadow-lg">
                  🚀 Gorbagana Computer
                </h1>
                <p className="text-purple-200 text-lg drop-shadow-md">
                  AI-Powered Creative Workspace
                </p>
              </motion.div>

              {/* Desktop Icons Grid */}
              <div className="flex flex-wrap content-start justify-center p-4 max-w-6xl">
                {GORBAGANA_APPS.map((app, index) => (
                  <motion.div
                    key={app.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                  >
                    <DesktopIcon app={app} onOpen={handleAppOpen} />
                  </motion.div>
                ))}
              </div>

              {/* Close Button */}
              <motion.div
                initial={{ y: 50, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                className="absolute top-4 right-4"
              >
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleMasterClose}
                  className="text-white hover:bg-white/20 h-10 w-10 p-0 rounded-full"
                >
                  <X className="w-5 h-5" />
                </Button>
              </motion.div>
            </motion.div>
          ) : (
            <motion.div
              key={`app-${activeApp.id}`}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <Window app={activeApp} onClose={handleAppClose}>
                {activeApp.component ? (
                  <activeApp.component />
                ) : (
                  <div className="flex items-center justify-center h-full">
                    <div className="text-center">
                      <div className="text-8xl mb-4">{activeApp.icon}</div>
                      <h2 className="text-2xl font-bold text-gray-800 mb-2">
                        {activeApp.name}
                      </h2>
                      <p className="text-gray-600">
                        This app is coming soon! Stay tuned for updates.
                      </p>
                    </div>
                  </div>
                )}
              </Window>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </AnimatePresence>
  );
}