"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { 
  ChevronDown,
  Palette, 
  Mic, 
  Video, 
  Music, 
  Code, 
  Radio, 
  FileText, 
  Images as Gallery, 
  Terminal, 
  Trash2, 
  Sparkles,
  Wallet
} from "lucide-react";

type ActiveTab = 'ai-art' | 'trash-compactor' | 'text-to-audio' | 'nft-gallery' | 'ai-terminal' | 'video-generation' | 'music-generation' | 'code-generation' | 'live-voice-chat' | 'document-studio' | 'nft-studio' | 'voice-wallet';

interface AppMenuItem {
  id: ActiveTab;
  name: string;
  shortName: string;
  icon: React.ReactNode;
  category: string;
}

const APP_MENU_ITEMS: AppMenuItem[] = [
  { id: 'ai-art', name: 'AI Art Generation', shortName: 'Art', icon: <Palette className="w-4 h-4" />, category: 'Creative' },
  { id: 'video-generation', name: 'Video Generation', shortName: 'Video', icon: <Video className="w-4 h-4" />, category: 'Creative' },
  { id: 'music-generation', name: 'Music Generation', shortName: 'Music', icon: <Music className="w-4 h-4" />, category: 'Creative' },
  { id: 'text-to-audio', name: 'Text to Audio', shortName: 'Audio', icon: <Mic className="w-4 h-4" />, category: 'Creative' },
  { id: 'code-generation', name: 'Code Generation', shortName: 'Code', icon: <Code className="w-4 h-4" />, category: 'Development' },
  { id: 'ai-terminal', name: 'AI Terminal', shortName: 'Terminal', icon: <Terminal className="w-4 h-4" />, category: 'Development' },
  { id: 'live-voice-chat', name: 'Live Voice Chat', shortName: 'Voice', icon: <Radio className="w-4 h-4" />, category: 'Communication' },
  { id: 'voice-wallet', name: 'Voice Wallet Control', shortName: 'Voice Wallet', icon: <Wallet className="w-4 h-4" />, category: 'Blockchain' },
  { id: 'document-studio', name: 'Document Studio', shortName: 'Docs', icon: <FileText className="w-4 h-4" />, category: 'Productivity' },
  { id: 'nft-gallery', name: 'NFT Gallery', shortName: 'Gallery', icon: <Gallery className="w-4 h-4" />, category: 'Blockchain' },
  { id: 'nft-studio', name: 'NFT Studio', shortName: 'NFT Studio', icon: <Sparkles className="w-4 h-4" />, category: 'Blockchain' },
  { id: 'trash-compactor', name: 'Trash Compactor', shortName: 'Trash', icon: <Trash2 className="w-4 h-4" />, category: 'Utilities' },
];

interface AppDropdownMenuProps {
  activeTab: ActiveTab;
  onTabChange: (tab: ActiveTab) => void;
}

export function AppDropdownMenu({ activeTab, onTabChange }: AppDropdownMenuProps) {
  const [isOpen, setIsOpen] = useState(false);

  const activeItem = APP_MENU_ITEMS.find(item => item.id === activeTab);
  
  // Group items by category
  const groupedItems = APP_MENU_ITEMS.reduce((acc, item) => {
    if (!acc[item.category]) {
      acc[item.category] = [];
    }
    acc[item.category].push(item);
    return acc;
  }, {} as Record<string, AppMenuItem[]>);

  const handleItemSelect = (tabId: ActiveTab) => {
    onTabChange(tabId);
    setIsOpen(false);
  };

  return (
    <div className="flex justify-center w-full">
      <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
        <DropdownMenuTrigger asChild>
          <Button 
            variant="outline" 
            className="flex items-center gap-2 px-6 py-3 min-w-[200px] justify-between hover:bg-primary/5 transition-colors"
          >
            <div className="flex items-center gap-2">
              {activeItem?.icon}
              <span className="font-medium">{activeItem?.name || 'Select App'}</span>
            </div>
            <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
          </Button>
        </DropdownMenuTrigger>
        
        <DropdownMenuContent 
          className="w-64 max-h-96 overflow-y-auto"
          align="center"
          sideOffset={8}
        >
          {Object.entries(groupedItems).map(([category, items], categoryIndex) => (
            <div key={category}>
              {categoryIndex > 0 && <DropdownMenuSeparator />}
              
              {/* Category Header */}
              <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                {category}
              </div>
              
              {/* Category Items */}
              {items.map((item) => (
                <DropdownMenuItem
                  key={item.id}
                  onClick={() => handleItemSelect(item.id)}
                  className={`flex items-center gap-3 px-3 py-2 cursor-pointer ${
                    activeTab === item.id 
                      ? 'bg-primary text-primary-foreground' 
                      : 'hover:bg-muted'
                  }`}
                >
                  {item.icon}
                  <div className="flex flex-col">
                    <span className="font-medium">{item.name}</span>
                  </div>
                  {activeTab === item.id && (
                    <div className="ml-auto w-2 h-2 rounded-full bg-current" />
                  )}
                </DropdownMenuItem>
              ))}
            </div>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}