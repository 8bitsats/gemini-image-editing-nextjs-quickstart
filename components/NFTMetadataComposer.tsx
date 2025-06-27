"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Plus, 
  Trash2, 
  Upload, 
  Download,
  Image as ImageIcon,
  Film,
  Link,
  Palette,
  Users,
  Settings,
  Shield,
  Code,
  Eye,
  Copy
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { NFTMetadata, NFTAttribute, NFTFile, VerifiedCreator } from "@/lib/types/nft-metadata";

export function NFTMetadataComposer() {
  const [metadata, setMetadata] = useState<NFTMetadata>({
    name: "",
    description: "",
    image: "",
    symbol: "",
    seller_fee_basis_points: 250, // 2.5% default
    attributes: [],
    properties: {
      files: [],
      category: "image",
      creators: []
    }
  });

  const [showAdvanced, setShowAdvanced] = useState(false);
  const [previewMode, setPreviewMode] = useState(false);

  // Add attribute
  const addAttribute = () => {
    setMetadata(prev => ({
      ...prev,
      attributes: [
        ...(prev.attributes || []),
        { trait_type: "", value: "" }
      ]
    }));
  };

  // Update attribute
  const updateAttribute = (index: number, field: keyof NFTAttribute, value: any) => {
    setMetadata(prev => ({
      ...prev,
      attributes: prev.attributes?.map((attr, i) => 
        i === index ? { ...attr, [field]: value } : attr
      )
    }));
  };

  // Remove attribute
  const removeAttribute = (index: number) => {
    setMetadata(prev => ({
      ...prev,
      attributes: prev.attributes?.filter((_, i) => i !== index)
    }));
  };

  // Add file
  const addFile = () => {
    setMetadata(prev => ({
      ...prev,
      properties: {
        ...prev.properties,
        files: [
          ...(prev.properties?.files || []),
          { uri: "", type: "image/png" }
        ]
      }
    }));
  };

  // Update file
  const updateFile = (index: number, field: keyof NFTFile, value: any) => {
    setMetadata(prev => ({
      ...prev,
      properties: {
        ...prev.properties,
        files: prev.properties?.files?.map((file, i) => 
          i === index ? { ...file, [field]: value } : file
        )
      }
    }));
  };

  // Remove file
  const removeFile = (index: number) => {
    setMetadata(prev => ({
      ...prev,
      properties: {
        ...prev.properties,
        files: prev.properties?.files?.filter((_, i) => i !== index)
      }
    }));
  };

  // Add creator
  const addCreator = () => {
    setMetadata(prev => ({
      ...prev,
      properties: {
        ...prev.properties,
        creators: [
          ...(prev.properties?.creators || []),
          { address: "", share: 0 }
        ]
      }
    }));
  };

  // Update creator
  const updateCreator = (index: number, field: string, value: any) => {
    setMetadata(prev => ({
      ...prev,
      properties: {
        ...prev.properties,
        creators: prev.properties?.creators?.map((creator, i) => 
          i === index ? { ...creator, [field]: value } : creator
        )
      }
    }));
  };

  // Remove creator
  const removeCreator = (index: number) => {
    setMetadata(prev => ({
      ...prev,
      properties: {
        ...prev.properties,
        creators: prev.properties?.creators?.filter((_, i) => i !== index)
      }
    }));
  };

  // Export metadata
  const exportMetadata = () => {
    const dataStr = JSON.stringify(metadata, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    
    const exportFileDefaultName = `${metadata.name || 'nft'}-metadata.json`;
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
  };

  // Copy metadata to clipboard
  const copyMetadata = () => {
    navigator.clipboard.writeText(JSON.stringify(metadata, null, 2));
  };

  // Import metadata
  const importMetadata = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const imported = JSON.parse(e.target?.result as string);
          setMetadata(imported);
        } catch (error) {
          console.error("Failed to parse metadata:", error);
        }
      };
      reader.readAsText(file);
    }
  };

  if (previewMode) {
    return (
      <Card className="w-full max-w-4xl">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Eye className="w-5 h-5" />
              Metadata Preview
            </CardTitle>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPreviewMode(false)}
            >
              Back to Editor
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <pre className="bg-muted p-4 rounded-lg overflow-x-auto text-sm">
            {JSON.stringify(metadata, null, 2)}
          </pre>
          <div className="flex gap-2 mt-4">
            <Button onClick={exportMetadata} className="flex items-center gap-2">
              <Download className="w-4 h-4" />
              Export JSON
            </Button>
            <Button onClick={copyMetadata} variant="outline" className="flex items-center gap-2">
              <Copy className="w-4 h-4" />
              Copy to Clipboard
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-4xl">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Code className="w-5 h-5" />
            NFT Metadata Composer
          </CardTitle>
          <div className="flex items-center gap-2">
            <input
              type="file"
              accept=".json"
              onChange={importMetadata}
              className="hidden"
              id="import-metadata"
            />
            <Button
              variant="outline"
              size="sm"
              onClick={() => document.getElementById('import-metadata')?.click()}
            >
              <Upload className="w-4 h-4 mr-1" />
              Import
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPreviewMode(true)}
            >
              <Eye className="w-4 h-4 mr-1" />
              Preview
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Basic Information */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Palette className="w-4 h-4" />
            Basic Information
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Name *</Label>
              <Input
                id="name"
                value={metadata.name}
                onChange={(e) => setMetadata({ ...metadata, name: e.target.value })}
                placeholder="My NFT #1"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="symbol">Symbol</Label>
              <Input
                id="symbol"
                value={metadata.symbol}
                onChange={(e) => setMetadata({ ...metadata, symbol: e.target.value })}
                placeholder="MNFT"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description *</Label>
            <Textarea
              id="description"
              value={metadata.description}
              onChange={(e) => setMetadata({ ...metadata, description: e.target.value })}
              placeholder="A unique digital collectible..."
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="image">Image URI *</Label>
            <Input
              id="image"
              value={metadata.image}
              onChange={(e) => setMetadata({ ...metadata, image: e.target.value })}
              placeholder="https://arweave.net/..."
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="animation_url">Animation URL (optional)</Label>
              <Input
                id="animation_url"
                value={metadata.animation_url}
                onChange={(e) => setMetadata({ ...metadata, animation_url: e.target.value })}
                placeholder="https://..."
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="external_url">External URL (optional)</Label>
              <Input
                id="external_url"
                value={metadata.external_url}
                onChange={(e) => setMetadata({ ...metadata, external_url: e.target.value })}
                placeholder="https://example.com"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="royalties">Royalties ({metadata.seller_fee_basis_points / 100}%)</Label>
            <Slider
              id="royalties"
              value={[metadata.seller_fee_basis_points]}
              onValueChange={(value) => setMetadata({ ...metadata, seller_fee_basis_points: value[0] })}
              max={1000}
              step={25}
              className="w-full"
            />
            <p className="text-xs text-muted-foreground">
              {metadata.seller_fee_basis_points} basis points ({metadata.seller_fee_basis_points / 100}%)
            </p>
          </div>
        </div>

        {/* Attributes */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <Settings className="w-4 h-4" />
              Attributes
            </h3>
            <Button
              variant="outline"
              size="sm"
              onClick={addAttribute}
            >
              <Plus className="w-4 h-4 mr-1" />
              Add Attribute
            </Button>
          </div>

          <AnimatePresence>
            {metadata.attributes?.map((attr, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="flex gap-2 items-end"
              >
                <div className="flex-1 space-y-2">
                  <Label>Trait Type</Label>
                  <Input
                    value={attr.trait_type}
                    onChange={(e) => updateAttribute(index, 'trait_type', e.target.value)}
                    placeholder="Background"
                  />
                </div>
                <div className="flex-1 space-y-2">
                  <Label>Value</Label>
                  <Input
                    value={attr.value}
                    onChange={(e) => updateAttribute(index, 'value', e.target.value)}
                    placeholder="Blue"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Display Type</Label>
                  <Select
                    value={attr.display_type || ""}
                    onValueChange={(value) => updateAttribute(index, 'display_type', value)}
                  >
                    <SelectTrigger className="w-[140px]">
                      <SelectValue placeholder="None" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">None</SelectItem>
                      <SelectItem value="number">Number</SelectItem>
                      <SelectItem value="boost_number">Boost Number</SelectItem>
                      <SelectItem value="boost_percentage">Boost %</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => removeAttribute(index)}
                  className="text-destructive hover:text-destructive"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        {/* Advanced Settings */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <Shield className="w-4 h-4" />
              Advanced Settings
            </h3>
            <Switch
              checked={showAdvanced}
              onCheckedChange={setShowAdvanced}
            />
          </div>

          <AnimatePresence>
            {showAdvanced && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="space-y-4"
              >
                {/* Files */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="font-semibold flex items-center gap-2">
                      <ImageIcon className="w-4 h-4" />
                      Additional Files
                    </h4>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={addFile}
                    >
                      <Plus className="w-3 h-3 mr-1" />
                      Add File
                    </Button>
                  </div>

                  {metadata.properties?.files?.map((file, index) => (
                    <div key={index} className="flex gap-2 items-end">
                      <div className="flex-1 space-y-2">
                        <Label>File URI</Label>
                        <Input
                          value={file.uri}
                          onChange={(e) => updateFile(index, 'uri', e.target.value)}
                          placeholder="https://..."
                        />
                      </div>
                      <div className="w-48 space-y-2">
                        <Label>File Type</Label>
                        <Input
                          value={file.type}
                          onChange={(e) => updateFile(index, 'type', e.target.value)}
                          placeholder="image/png"
                        />
                      </div>
                      <div className="flex items-center gap-2 pb-2">
                        <Switch
                          checked={file.cdn || false}
                          onCheckedChange={(checked) => updateFile(index, 'cdn', checked)}
                        />
                        <Label className="text-sm">CDN</Label>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => removeFile(index)}
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                </div>

                {/* Category */}
                <div className="space-y-2">
                  <Label htmlFor="category">Media Category</Label>
                  <Select
                    value={metadata.properties?.category || "image"}
                    onValueChange={(value: any) => setMetadata({
                      ...metadata,
                      properties: { ...metadata.properties, category: value }
                    })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="image">Image</SelectItem>
                      <SelectItem value="video">Video</SelectItem>
                      <SelectItem value="audio">Audio</SelectItem>
                      <SelectItem value="vr">VR</SelectItem>
                      <SelectItem value="html">HTML</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Creators */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="font-semibold flex items-center gap-2">
                      <Users className="w-4 h-4" />
                      Creators
                    </h4>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={addCreator}
                    >
                      <Plus className="w-3 h-3 mr-1" />
                      Add Creator
                    </Button>
                  </div>

                  {metadata.properties?.creators?.map((creator, index) => (
                    <div key={index} className="flex gap-2 items-end">
                      <div className="flex-1 space-y-2">
                        <Label>Wallet Address</Label>
                        <Input
                          value={creator.address}
                          onChange={(e) => updateCreator(index, 'address', e.target.value)}
                          placeholder="11111..."
                          className="font-mono text-xs"
                        />
                      </div>
                      <div className="w-32 space-y-2">
                        <Label>Share %</Label>
                        <Input
                          type="number"
                          value={creator.share}
                          onChange={(e) => updateCreator(index, 'share', parseInt(e.target.value) || 0)}
                          min={0}
                          max={100}
                          placeholder="100"
                        />
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => removeCreator(index)}
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                  
                  {metadata.properties?.creators && metadata.properties.creators.length > 0 && (
                    <p className="text-sm text-muted-foreground">
                      Total share: {metadata.properties.creators.reduce((sum, c) => sum + c.share, 0)}%
                      {metadata.properties.creators.reduce((sum, c) => sum + c.share, 0) !== 100 && (
                        <span className="text-yellow-600"> (Should equal 100%)</span>
                      )}
                    </p>
                  )}
                </div>

                {/* Collection */}
                <div className="space-y-4">
                  <h4 className="font-semibold">Collection</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Collection Name</Label>
                      <Input
                        value={metadata.collection?.name || ""}
                        onChange={(e) => setMetadata({
                          ...metadata,
                          collection: { ...metadata.collection, name: e.target.value }
                        })}
                        placeholder="My Collection"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Collection Family</Label>
                      <Input
                        value={metadata.collection?.family || ""}
                        onChange={(e) => setMetadata({
                          ...metadata,
                          collection: { ...metadata.collection, name: metadata.collection?.name || "", family: e.target.value }
                        })}
                        placeholder="My Family"
                      />
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-end gap-2 pt-4">
          <Button onClick={exportMetadata} className="flex items-center gap-2">
            <Download className="w-4 h-4" />
            Export Metadata
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}