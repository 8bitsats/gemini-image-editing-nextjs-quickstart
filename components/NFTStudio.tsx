"use client";

import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";
import { NFTMetadataComposer } from "./NFTMetadataComposer";
import { NFTCollectionBuilder } from "./NFTCollectionBuilder";
import { AnimatedReveal } from "./AnimatedReveal";
import { 
  Code,
  Layers,
  Sparkles
} from "lucide-react";

export function NFTStudio() {
  const [activeTab, setActiveTab] = useState("metadata");

  return (
    <div className="w-full max-w-6xl mx-auto space-y-6">
      <AnimatedReveal>
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold flex items-center justify-center gap-2">
            <Sparkles className="w-8 h-8 text-purple-500" />
            NFT Studio
          </h1>
          <p className="text-muted-foreground">
            Create Metaplex-compliant NFT metadata and build generative collections
          </p>
        </div>
      </AnimatedReveal>

      <AnimatedReveal delay={0.1}>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="metadata" className="flex items-center gap-2">
              <Code className="w-4 h-4" />
              Metadata Composer
            </TabsTrigger>
            <TabsTrigger value="collection" className="flex items-center gap-2">
              <Layers className="w-4 h-4" />
              Collection Builder
            </TabsTrigger>
          </TabsList>

          <TabsContent value="metadata" className="mt-6">
            <NFTMetadataComposer />
          </TabsContent>

          <TabsContent value="collection" className="mt-6">
            <NFTCollectionBuilder />
          </TabsContent>
        </Tabs>
      </AnimatedReveal>
    </div>
  );
}