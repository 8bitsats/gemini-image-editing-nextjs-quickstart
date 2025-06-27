import { NextRequest, NextResponse } from "next/server";

interface ArtworkItem {
  id: string;
  imageUrl: string;
  prompt: string;
  createdAt: number;
  creator: string;
  likes: number;
  dislikes: number;
  views: number;
  isLive?: boolean;
}

interface Vote {
  artworkId: string;
  type: "like" | "dislike";
  userAddress?: string;
  timestamp: number;
}

// In-memory storage for demo (use database in production)
let artworkGallery: ArtworkItem[] = [
  {
    id: "initial-1",
    imageUrl: "/api/placeholder/400/300",
    prompt: "A mystical forest with glowing mushrooms",
    createdAt: Date.now() - 600000,
    creator: "Anonymous",
    likes: 23,
    dislikes: 3,
    views: 89,
  },
  {
    id: "initial-2",
    imageUrl: "/api/placeholder/400/300", 
    prompt: "Futuristic space station orbiting Saturn",
    createdAt: Date.now() - 400000,
    creator: "Anonymous",
    likes: 31,
    dislikes: 1,
    views: 76,
  },
  {
    id: "initial-3",
    imageUrl: "/api/placeholder/400/300",
    prompt: "Ancient dragon perched on crystal mountain",
    createdAt: Date.now() - 200000,
    creator: "Anonymous", 
    likes: 18,
    dislikes: 2,
    views: 54,
    isLive: true,
  }
];

let votes: Vote[] = [];

// GET - Fetch current art gallery
export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const limit = parseInt(url.searchParams.get("limit") || "20");
    const offset = parseInt(url.searchParams.get("offset") || "0");

    // Sort by creation time (newest first)
    const sortedArtworks = artworkGallery
      .sort((a, b) => b.createdAt - a.createdAt)
      .slice(offset, offset + limit);

    const stats = {
      totalArtworks: artworkGallery.length,
      liveArtworks: artworkGallery.filter(art => art.isLive).length,
      totalViews: artworkGallery.reduce((sum, art) => sum + art.views, 0),
      totalLikes: artworkGallery.reduce((sum, art) => sum + art.likes, 0),
    };

    return NextResponse.json({
      success: true,
      artworks: sortedArtworks,
      stats,
      hasMore: offset + limit < artworkGallery.length,
    });

  } catch (error) {
    console.error("Gallery fetch error:", error);
    return NextResponse.json(
      { error: "Failed to fetch art gallery" },
      { status: 500 }
    );
  }
}

// POST - Add new artwork or handle votes
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, artworkData, voteData } = body;

    if (action === "add_artwork") {
      // Add new artwork to gallery
      const newArtwork: ArtworkItem = {
        id: `artwork-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        imageUrl: artworkData.imageUrl,
        prompt: artworkData.prompt,
        createdAt: Date.now(),
        creator: artworkData.creator || "Anonymous",
        likes: 0,
        dislikes: 0,
        views: 1,
        isLive: true,
      };

      // Add to beginning of array (newest first)
      artworkGallery.unshift(newArtwork);

      // Keep only latest 100 artworks to prevent memory issues
      if (artworkGallery.length > 100) {
        artworkGallery = artworkGallery.slice(0, 100);
      }

      // Remove live status after 5 minutes
      setTimeout(() => {
        const artwork = artworkGallery.find(art => art.id === newArtwork.id);
        if (artwork) {
          artwork.isLive = false;
        }
      }, 5 * 60 * 1000);

      return NextResponse.json({
        success: true,
        artwork: newArtwork,
        message: "Artwork added to gallery",
      });

    } else if (action === "vote") {
      // Handle voting
      const { artworkId, type, userAddress } = voteData;

      if (!artworkId || !type || !["like", "dislike"].includes(type)) {
        return NextResponse.json(
          { error: "Invalid vote data" },
          { status: 400 }
        );
      }

      // Find the artwork
      const artwork = artworkGallery.find(art => art.id === artworkId);
      if (!artwork) {
        return NextResponse.json(
          { error: "Artwork not found" },
          { status: 404 }
        );
      }

      // Check if user already voted (by IP or wallet address)
      const userIdentifier = userAddress || request.ip || "anonymous";
      const existingVote = votes.find(
        vote => vote.artworkId === artworkId && 
        (vote.userAddress === userIdentifier)
      );

      if (existingVote) {
        // Remove previous vote
        if (existingVote.type === "like") {
          artwork.likes = Math.max(0, artwork.likes - 1);
        } else {
          artwork.dislikes = Math.max(0, artwork.dislikes - 1);
        }
        
        votes = votes.filter(vote => vote !== existingVote);
      }

      // Add new vote if different from previous
      if (!existingVote || existingVote.type !== type) {
        if (type === "like") {
          artwork.likes += 1;
        } else {
          artwork.dislikes += 1;
        }

        votes.push({
          artworkId,
          type,
          userAddress: userIdentifier,
          timestamp: Date.now(),
        });
      }

      return NextResponse.json({
        success: true,
        artwork,
        message: "Vote recorded",
      });

    } else if (action === "view") {
      // Handle view tracking
      const { artworkId } = body;

      const artwork = artworkGallery.find(art => art.id === artworkId);
      if (artwork) {
        artwork.views += 1;
      }

      return NextResponse.json({
        success: true,
        artwork,
        message: "View recorded",
      });

    } else {
      return NextResponse.json(
        { error: "Invalid action" },
        { status: 400 }
      );
    }

  } catch (error) {
    console.error("Gallery action error:", error);
    return NextResponse.json(
      { error: "Failed to process request" },
      { status: 500 }
    );
  }
}

// DELETE - Remove artwork (admin only)
export async function DELETE(request: NextRequest) {
  try {
    const body = await request.json();
    const { artworkId, adminKey } = body;

    // Simple admin verification (use proper auth in production)
    if (adminKey !== process.env.GALLERY_ADMIN_KEY) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    artworkGallery = artworkGallery.filter(art => art.id !== artworkId);
    votes = votes.filter(vote => vote.artworkId !== artworkId);

    return NextResponse.json({
      success: true,
      message: "Artwork removed",
    });

  } catch (error) {
    console.error("Gallery delete error:", error);
    return NextResponse.json(
      { error: "Failed to delete artwork" },
      { status: 500 }
    );
  }
}