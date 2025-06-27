"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { 
  FileText, 
  Image, 
  Video, 
  Music, 
  Download, 
  Trash2, 
  Search,
  Folder,
  Plus,
  Eye
} from "lucide-react";

interface FileItem {
  id: string;
  name: string;
  type: "document" | "image" | "video" | "audio" | "folder";
  size: string;
  modified: string;
  icon: React.ReactNode;
}

const SAMPLE_FILES: FileItem[] = [
  {
    id: "1",
    name: "Gorbagana Project Proposal.pdf",
    type: "document",
    size: "2.4 MB",
    modified: "2 hours ago",
    icon: <FileText className="w-5 h-5 text-red-500" />
  },
  {
    id: "2",
    name: "AI Generated Art Collection",
    type: "folder",
    size: "156 MB",
    modified: "1 day ago",
    icon: <Folder className="w-5 h-5 text-blue-500" />
  },
  {
    id: "3",
    name: "Demo Video.mp4",
    type: "video",
    size: "45.2 MB",
    modified: "3 days ago",
    icon: <Video className="w-5 h-5 text-green-500" />
  },
  {
    id: "4",
    name: "Generated Music Track.wav",
    type: "audio",
    size: "12.8 MB",
    modified: "1 week ago",
    icon: <Music className="w-5 h-5 text-purple-500" />
  },
  {
    id: "5",
    name: "NFT Metadata Template.json",
    type: "document",
    size: "4.2 KB",
    modified: "2 weeks ago",
    icon: <FileText className="w-5 h-5 text-orange-500" />
  },
  {
    id: "6",
    name: "Screenshot_2024.png",
    type: "image",
    size: "892 KB",
    modified: "3 weeks ago",
    icon: <Image className="w-5 h-5 text-pink-500" />
  },
];

export function DocumentsApp() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedFiles, setSelectedFiles] = useState<string[]>([]);

  const filteredFiles = SAMPLE_FILES.filter(file =>
    file.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const toggleFileSelection = (fileId: string) => {
    setSelectedFiles(prev =>
      prev.includes(fileId)
        ? prev.filter(id => id !== fileId)
        : [...prev, fileId]
    );
  };

  return (
    <div className="h-full flex flex-col p-4 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-800">Documents</h2>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm">
            <Plus className="w-4 h-4 mr-1" />
            New Folder
          </Button>
          <Button variant="outline" size="sm">
            <FileText className="w-4 h-4 mr-1" />
            Upload
          </Button>
        </div>
      </div>

      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
        <Input
          placeholder="Search files and folders..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Toolbar */}
      {selectedFiles.length > 0 && (
        <div className="flex items-center gap-2 p-2 bg-blue-50 rounded-lg">
          <Badge variant="secondary">
            {selectedFiles.length} selected
          </Badge>
          <Button variant="ghost" size="sm">
            <Download className="w-4 h-4 mr-1" />
            Download
          </Button>
          <Button variant="ghost" size="sm">
            <Trash2 className="w-4 h-4 mr-1" />
            Delete
          </Button>
        </div>
      )}

      {/* Files Grid */}
      <div className="flex-1 overflow-y-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredFiles.map((file) => (
            <Card
              key={file.id}
              className={`cursor-pointer transition-all hover:shadow-md ${
                selectedFiles.includes(file.id) ? "ring-2 ring-blue-500 bg-blue-50" : ""
              }`}
              onClick={() => toggleFileSelection(file.id)}
            >
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  {file.icon}
                  <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                    <Eye className="w-3 h-3" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <h3 className="font-semibold text-sm mb-1 truncate">{file.name}</h3>
                <div className="flex justify-between items-center text-xs text-gray-500">
                  <span>{file.size}</span>
                  <span>{file.modified}</span>
                </div>
                <Badge variant="outline" className="mt-2 text-xs">
                  {file.type}
                </Badge>
              </CardContent>
            </Card>
          ))}
        </div>

        {filteredFiles.length === 0 && (
          <div className="flex flex-col items-center justify-center h-64 text-center">
            <FileText className="w-16 h-16 text-gray-300 mb-4" />
            <h3 className="text-lg font-semibold text-gray-600 mb-2">No files found</h3>
            <p className="text-gray-500">
              {searchTerm ? "Try adjusting your search term" : "Upload some files to get started"}
            </p>
          </div>
        )}
      </div>

      {/* Footer Info */}
      <div className="flex justify-between items-center text-sm text-gray-500 border-t pt-2">
        <span>{filteredFiles.length} items</span>
        <span>Last sync: Just now</span>
      </div>
    </div>
  );
}