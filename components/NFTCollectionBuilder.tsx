"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Layers,
  Upload,
  Download,
  Settings,
  Play,
  Pause,
  RefreshCw,
  Save,
  FolderOpen,
  Image as ImageIcon,
  Hash,
  Sparkles,
  Shield,
  Wallet,
  CheckCircle,
  AlertCircle,
  Eye,
  EyeOff
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  NFTGenerationConfig, 
  GeneratedNFT, 
  NFTMetadata,
  ProgrammableNFTConfig 
} from "@/lib/types/nft-metadata";
import { useWallet } from "@solana/wallet-adapter-react";
import { PublicKey } from "@solana/web3.js";

interface Layer {
  id: string;
  name: string;
  order: number;
  traits: {
    id: string;
    name: string;
    fileName: string;
    weight: number;
    imageData?: string;
    attributes?: { [key: string]: any };
  }[];
}

interface GenerationStats {
  total: number;
  generated: number;
  duplicates: number;
  startTime?: number;
  endTime?: number;
}

export function NFTCollectionBuilder() {
  const { publicKey } = useWallet();
  const [activeTab, setActiveTab] = useState("config");
  const [isGenerating, setIsGenerating] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  
  const [config, setConfig] = useState<NFTGenerationConfig>({
    collection: {
      name: "",
      symbol: "",
      description: "",
      image: "",
      seller_fee_basis_points: 250,
      creators: []
    },
    generation: {
      size: 100,
      baseUri: "",
      startIndex: 1,
      namePattern: "#{index}"
    },
    token_standard: "NonFungible"
  });

  const [layers, setLayers] = useState<Layer[]>([]);
  const [generatedNFTs, setGeneratedNFTs] = useState<GeneratedNFT[]>([]);
  const [stats, setStats] = useState<GenerationStats>({
    total: 0,
    generated: 0,
    duplicates: 0
  });
  const [selectedPreview, setSelectedPreview] = useState<number>(0);
  const [showMetadata, setShowMetadata] = useState(false);
  const [ruleSetConfig, setRuleSetConfig] = useState<ProgrammableNFTConfig>({});

  // Add creator with connected wallet
  useEffect(() => {
    if (publicKey && config.collection.creators.length === 0) {
      setConfig(prev => ({
        ...prev,
        collection: {
          ...prev.collection,
          creators: [{
            address: publicKey.toString(),
            share: 100,
            verified: true
          }]
        }
      }));
    }
  }, [publicKey]);

  // Add layer
  const addLayer = () => {
    const newLayer: Layer = {
      id: Date.now().toString(),
      name: `Layer ${layers.length + 1}`,
      order: layers.length,
      traits: []
    };
    setLayers([...layers, newLayer]);
  };

  // Add trait to layer
  const addTrait = (layerId: string) => {
    setLayers(prev => prev.map(layer => {
      if (layer.id === layerId) {
        return {
          ...layer,
          traits: [...layer.traits, {
            id: Date.now().toString(),
            name: "",
            fileName: "",
            weight: 100,
            attributes: {}
          }]
        };
      }
      return layer;
    }));
  };

  // Generate DNA for NFT based on trait selection
  const generateDNA = (selectedTraits: string[]): string => {
    return selectedTraits.sort().join('-');
  };

  // Select random trait based on weights
  const selectWeightedTrait = (traits: Layer['traits']) => {
    const totalWeight = traits.reduce((sum, trait) => sum + trait.weight, 0);
    let random = Math.random() * totalWeight;
    
    for (const trait of traits) {
      random -= trait.weight;
      if (random <= 0) {
        return trait;
      }
    }
    
    return traits[0];
  };

  // Generate single NFT
  const generateNFT = (index: number, usedDNA: Set<string>): GeneratedNFT | null => {
    const selectedTraits: string[] = [];
    const attributes: any[] = [];
    
    // Select one trait from each layer
    const sortedLayers = [...layers].sort((a, b) => a.order - b.order);
    
    for (const layer of sortedLayers) {
      if (layer.traits.length > 0) {
        const selectedTrait = selectWeightedTrait(layer.traits);
        selectedTraits.push(selectedTrait.id);
        
        attributes.push({
          trait_type: layer.name,
          value: selectedTrait.name
        });
        
        // Add custom attributes
        if (selectedTrait.attributes) {
          Object.entries(selectedTrait.attributes).forEach(([key, value]) => {
            attributes.push({
              trait_type: key,
              value: value
            });
          });
        }
      }
    }
    
    const dna = generateDNA(selectedTraits);
    
    // Check for duplicates
    if (usedDNA.has(dna)) {
      return null;
    }
    
    usedDNA.add(dna);
    
    // Generate name based on pattern
    let name = config.generation.namePattern || "#{index}";
    name = name.replace("{index}", index.toString());
    
    // Replace trait placeholders
    sortedLayers.forEach((layer, layerIndex) => {
      const trait = layer.traits.find(t => selectedTraits.includes(t.id));
      if (trait) {
        name = name.replace(`{trait:${layer.name}}`, trait.name);
      }
    });
    
    const metadata: NFTMetadata = {
      name,
      description: config.collection.description,
      image: `${config.generation.imageBaseUri || config.generation.baseUri}/images/${index}.png`,
      symbol: config.collection.symbol,
      seller_fee_basis_points: config.collection.seller_fee_basis_points,
      external_url: config.collection.external_url,
      attributes,
      properties: {
        category: "image",
        creators: config.collection.creators
      },
      collection: {
        name: config.collection.name,
        family: config.collection.name
      }
    };
    
    return {
      index,
      metadata,
      dna,
      edition: index,
      date: Date.now(),
      attributes,
      compiler: "Gorbagana NFT Builder"
    };
  };

  // Generate collection
  const generateCollection = async () => {
    setIsGenerating(true);
    setIsPaused(false);
    setStats({
      total: config.generation.size,
      generated: 0,
      duplicates: 0,
      startTime: Date.now()
    });
    
    const usedDNA = new Set<string>();
    const newNFTs: GeneratedNFT[] = [];
    let duplicateCount = 0;
    const maxRetries = 1000;
    
    for (let i = 0; i < config.generation.size; i++) {
      if (isPaused) {
        break;
      }
      
      let nft: GeneratedNFT | null = null;
      let retries = 0;
      
      // Try to generate unique NFT
      while (!nft && retries < maxRetries) {
        nft = generateNFT(config.generation.startIndex + i, usedDNA);
        if (!nft) {
          duplicateCount++;
          retries++;
        }
      }
      
      if (nft) {
        newNFTs.push(nft);
      } else {
        console.warn(`Failed to generate unique NFT after ${maxRetries} attempts`);
      }
      
      setStats(prev => ({
        ...prev,
        generated: i + 1,
        duplicates: duplicateCount
      }));
      
      // Add delay to show progress
      await new Promise(resolve => setTimeout(resolve, 10));
    }
    
    setGeneratedNFTs(newNFTs);
    setStats(prev => ({
      ...prev,
      endTime: Date.now()
    }));
    setIsGenerating(false);
  };

  // Export collection metadata
  const exportCollection = () => {
    // Export individual metadata files
    generatedNFTs.forEach(nft => {
      const dataStr = JSON.stringify(nft.metadata, null, 2);
      const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
      
      const linkElement = document.createElement('a');
      linkElement.setAttribute('href', dataUri);
      linkElement.setAttribute('download', `${nft.index}.json`);
      linkElement.click();
    });
    
    // Export collection summary
    const summary = {
      collection: config.collection,
      generation: {
        ...config.generation,
        actualSize: generatedNFTs.length
      },
      stats: {
        total: generatedNFTs.length,
        duplicatesEncountered: stats.duplicates,
        generationTime: stats.endTime && stats.startTime 
          ? (stats.endTime - stats.startTime) / 1000 
          : 0
      },
      dnaList: generatedNFTs.map(nft => nft.dna)
    };
    
    const summaryStr = JSON.stringify(summary, null, 2);
    const summaryUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(summaryStr);
    
    const summaryLink = document.createElement('a');
    summaryLink.setAttribute('href', summaryUri);
    summaryLink.setAttribute('download', '_metadata.json');
    summaryLink.click();
  };

  // Add pNFT rule
  const addRule = () => {
    setRuleSetConfig(prev => ({
      ...prev,
      authorization_rules: [
        ...(prev.authorization_rules || []),
        {
          operation: "Transfer:Owner",
          rule: ""
        }
      ]
    }));
  };

  return (
    <div className="w-full max-w-6xl space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Layers className="w-5 h-5" />
              NFT Collection Builder
            </CardTitle>
            <div className="flex items-center gap-2">
              <Badge variant="outline">
                <Hash className="w-3 h-3 mr-1" />
                {generatedNFTs.length} NFTs
              </Badge>
              {isGenerating && (
                <Badge variant="secondary" className="animate-pulse">
                  <RefreshCw className="w-3 h-3 mr-1 animate-spin" />
                  Generating...
                </Badge>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="config">Configuration</TabsTrigger>
              <TabsTrigger value="layers">Layers & Traits</TabsTrigger>
              <TabsTrigger value="preview">Preview</TabsTrigger>
              <TabsTrigger value="export">Export</TabsTrigger>
            </TabsList>

            <TabsContent value="config" className="space-y-6">
              {/* Collection Configuration */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Collection Settings</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Collection Name</Label>
                    <Input
                      value={config.collection.name}
                      onChange={(e) => setConfig(prev => ({
                        ...prev,
                        collection: { ...prev.collection, name: e.target.value }
                      }))}
                      placeholder="My NFT Collection"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Symbol</Label>
                    <Input
                      value={config.collection.symbol}
                      onChange={(e) => setConfig(prev => ({
                        ...prev,
                        collection: { ...prev.collection, symbol: e.target.value }
                      }))}
                      placeholder="MNFT"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Description</Label>
                  <Textarea
                    value={config.collection.description}
                    onChange={(e) => setConfig(prev => ({
                      ...prev,
                      collection: { ...prev.collection, description: e.target.value }
                    }))}
                    placeholder="A unique collection of digital art..."
                    rows={3}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Collection Size</Label>
                    <Input
                      type="number"
                      value={config.generation.size}
                      onChange={(e) => setConfig(prev => ({
                        ...prev,
                        generation: { ...prev.generation, size: parseInt(e.target.value) || 0 }
                      }))}
                      min={1}
                      max={10000}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Start Index</Label>
                    <Input
                      type="number"
                      value={config.generation.startIndex}
                      onChange={(e) => setConfig(prev => ({
                        ...prev,
                        generation: { ...prev.generation, startIndex: parseInt(e.target.value) || 0 }
                      }))}
                      min={0}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Name Pattern</Label>
                  <Input
                    value={config.generation.namePattern}
                    onChange={(e) => setConfig(prev => ({
                      ...prev,
                      generation: { ...prev.generation, namePattern: e.target.value }
                    }))}
                    placeholder="#{index} - {trait:Background}"
                  />
                  <p className="text-xs text-muted-foreground">
                    Use {"{index}"} for number, {"{trait:LayerName}"} for trait values
                  </p>
                </div>

                <div className="space-y-2">
                  <Label>Base URI</Label>
                  <Input
                    value={config.generation.baseUri}
                    onChange={(e) => setConfig(prev => ({
                      ...prev,
                      generation: { ...prev.generation, baseUri: e.target.value }
                    }))}
                    placeholder="https://arweave.net/..."
                  />
                </div>

                <div className="space-y-2">
                  <Label>Token Standard</Label>
                  <Select
                    value={config.token_standard}
                    onValueChange={(value: any) => setConfig(prev => ({
                      ...prev,
                      token_standard: value
                    }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="NonFungible">Non-Fungible</SelectItem>
                      <SelectItem value="ProgrammableNonFungible">Programmable Non-Fungible</SelectItem>
                      <SelectItem value="NonFungibleEdition">Non-Fungible Edition</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Creators */}
                <div className="space-y-4">
                  <h4 className="font-semibold flex items-center gap-2">
                    <Wallet className="w-4 h-4" />
                    Creators
                  </h4>
                  {config.collection.creators.map((creator, index) => (
                    <div key={index} className="flex gap-2 items-center">
                      <Input
                        value={creator.address}
                        onChange={(e) => {
                          const newCreators = [...config.collection.creators];
                          newCreators[index] = { ...creator, address: e.target.value };
                          setConfig(prev => ({
                            ...prev,
                            collection: { ...prev.collection, creators: newCreators }
                          }));
                        }}
                        placeholder="Wallet address"
                        className="font-mono text-xs"
                      />
                      <Input
                        type="number"
                        value={creator.share}
                        onChange={(e) => {
                          const newCreators = [...config.collection.creators];
                          newCreators[index] = { ...creator, share: parseInt(e.target.value) || 0 };
                          setConfig(prev => ({
                            ...prev,
                            collection: { ...prev.collection, creators: newCreators }
                          }));
                        }}
                        className="w-24"
                        min={0}
                        max={100}
                      />
                      <Badge variant={creator.verified ? "default" : "secondary"}>
                        {creator.verified ? <CheckCircle className="w-3 h-3 mr-1" /> : <AlertCircle className="w-3 h-3 mr-1" />}
                        {creator.share}%
                      </Badge>
                    </div>
                  ))}
                </div>

                {/* Programmable NFT Settings */}
                {config.token_standard === "ProgrammableNonFungible" && (
                  <div className="space-y-4">
                    <h4 className="font-semibold flex items-center gap-2">
                      <Shield className="w-4 h-4" />
                      Programmable NFT Rules
                    </h4>
                    <div className="space-y-2">
                      <Label>Rule Set Address (optional)</Label>
                      <Input
                        value={ruleSetConfig.rule_set || ""}
                        onChange={(e) => setRuleSetConfig(prev => ({
                          ...prev,
                          rule_set: e.target.value
                        }))}
                        placeholder="11111..."
                        className="font-mono text-xs"
                      />
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={addRule}
                    >
                      Add Authorization Rule
                    </Button>
                  </div>
                )}
              </div>
            </TabsContent>

            <TabsContent value="layers" className="space-y-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">Trait Layers</h3>
                <Button onClick={addLayer} size="sm">
                  <Layers className="w-4 h-4 mr-1" />
                  Add Layer
                </Button>
              </div>

              <AnimatePresence>
                {layers.map((layer, layerIndex) => (
                  <motion.div
                    key={layer.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                  >
                    <Card>
                      <CardHeader>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Input
                              value={layer.name}
                              onChange={(e) => {
                                const newLayers = [...layers];
                                newLayers[layerIndex] = { ...layer, name: e.target.value };
                                setLayers(newLayers);
                              }}
                              className="font-semibold"
                              placeholder="Layer name"
                            />
                            <Badge variant="outline">
                              Order: {layer.order}
                            </Badge>
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => addTrait(layer.id)}
                          >
                            Add Trait
                          </Button>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2">
                          {layer.traits.map((trait, traitIndex) => (
                            <div key={trait.id} className="flex gap-2 items-center">
                              <Input
                                value={trait.name}
                                onChange={(e) => {
                                  const newLayers = [...layers];
                                  newLayers[layerIndex].traits[traitIndex] = {
                                    ...trait,
                                    name: e.target.value
                                  };
                                  setLayers(newLayers);
                                }}
                                placeholder="Trait name"
                                className="flex-1"
                              />
                              <Input
                                value={trait.fileName}
                                onChange={(e) => {
                                  const newLayers = [...layers];
                                  newLayers[layerIndex].traits[traitIndex] = {
                                    ...trait,
                                    fileName: e.target.value
                                  };
                                  setLayers(newLayers);
                                }}
                                placeholder="filename.png"
                                className="flex-1"
                              />
                              <Input
                                type="number"
                                value={trait.weight}
                                onChange={(e) => {
                                  const newLayers = [...layers];
                                  newLayers[layerIndex].traits[traitIndex] = {
                                    ...trait,
                                    weight: parseInt(e.target.value) || 0
                                  };
                                  setLayers(newLayers);
                                }}
                                placeholder="100"
                                className="w-24"
                                min={0}
                              />
                              <Badge variant="secondary">
                                {trait.weight}
                              </Badge>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </AnimatePresence>

              <div className="flex justify-center mt-6">
                <Button
                  onClick={generateCollection}
                  disabled={isGenerating || layers.length === 0}
                  size="lg"
                  className="w-full max-w-md"
                >
                  {isGenerating ? (
                    <>
                      <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                      Generating... ({stats.generated}/{stats.total})
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4 mr-2" />
                      Generate Collection
                    </>
                  )}
                </Button>
              </div>

              {isGenerating && (
                <div className="space-y-2">
                  <Progress value={(stats.generated / stats.total) * 100} />
                  <div className="flex justify-between text-sm text-muted-foreground">
                    <span>Generated: {stats.generated}</span>
                    <span>Duplicates: {stats.duplicates}</span>
                  </div>
                </div>
              )}
            </TabsContent>

            <TabsContent value="preview" className="space-y-4">
              {generatedNFTs.length > 0 ? (
                <>
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold">Generated NFTs</h3>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setShowMetadata(!showMetadata)}
                      >
                        {showMetadata ? <EyeOff className="w-4 h-4 mr-1" /> : <Eye className="w-4 h-4 mr-1" />}
                        {showMetadata ? "Hide" : "Show"} Metadata
                      </Button>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                    {generatedNFTs.map((nft, index) => (
                      <Card
                        key={nft.index}
                        className={`cursor-pointer transition-all ${selectedPreview === index ? 'ring-2 ring-primary' : ''}`}
                        onClick={() => setSelectedPreview(index)}
                      >
                        <CardContent className="p-2">
                          <div className="aspect-square bg-muted rounded flex items-center justify-center">
                            <ImageIcon className="w-8 h-8 text-muted-foreground" />
                          </div>
                          <p className="text-xs font-semibold mt-1 truncate">
                            {nft.metadata.name}
                          </p>
                        </CardContent>
                      </Card>
                    ))}
                  </div>

                  {showMetadata && selectedPreview < generatedNFTs.length && (
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg">
                          {generatedNFTs[selectedPreview].metadata.name}
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <pre className="bg-muted p-4 rounded-lg overflow-x-auto text-xs">
                          {JSON.stringify(generatedNFTs[selectedPreview].metadata, null, 2)}
                        </pre>
                      </CardContent>
                    </Card>
                  )}
                </>
              ) : (
                <div className="text-center py-12 text-muted-foreground">
                  <Layers className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>No NFTs generated yet. Configure your collection and generate NFTs.</p>
                </div>
              )}
            </TabsContent>

            <TabsContent value="export" className="space-y-4">
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Export Collection</h3>
                
                {generatedNFTs.length > 0 ? (
                  <div className="space-y-4">
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-base">Collection Summary</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <p className="text-muted-foreground">Total NFTs</p>
                            <p className="font-semibold">{generatedNFTs.length}</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Unique DNA</p>
                            <p className="font-semibold">{new Set(generatedNFTs.map(n => n.dna)).size}</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Duplicates Avoided</p>
                            <p className="font-semibold">{stats.duplicates}</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Generation Time</p>
                            <p className="font-semibold">
                              {stats.endTime && stats.startTime 
                                ? `${((stats.endTime - stats.startTime) / 1000).toFixed(2)}s`
                                : "N/A"}
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    <div className="flex flex-col gap-2">
                      <Button onClick={exportCollection} className="w-full">
                        <Download className="w-4 h-4 mr-2" />
                        Export All Metadata
                      </Button>
                      
                      <p className="text-xs text-muted-foreground text-center">
                        This will download individual JSON files for each NFT and a collection summary
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-12 text-muted-foreground">
                    <Download className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>Generate your collection first before exporting.</p>
                  </div>
                )}
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}