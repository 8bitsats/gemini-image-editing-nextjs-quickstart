# 🧠✨ Gorbagana AI by Google DeepMind

> **The Ultimate Sentient Ledger - Where AI Meets Blockchain**

Gorbagana AI is a revolutionary Web3 platform powered by Google DeepMind's latest AI models, featuring comprehensive token gating, multimodal AI capabilities, and cutting-edge creative tools. Built on Solana blockchain with our native $GOR token integration.

![Gorbagana AI](https://img.shields.io/badge/Powered%20by-Google%20DeepMind-blue?style=for-the-badge&logo=google)
![Solana](https://img.shields.io/badge/Blockchain-Solana-purple?style=for-the-badge&logo=solana)
![Next.js](https://img.shields.io/badge/Framework-Next.js%2015-black?style=for-the-badge&logo=next.js)

## 🚀 Live Demo

**Production**: [https://google.gorbagana.tech](https://google.gorbagana.tech)

## 🎨 **BRAND NEW: Realtime Art Gallery Ticker**

Experience our latest innovation - a live art gallery ticker at the top of every page that shows all AI art being generated on the platform in real-time! Features include:

- **🔴 Live Feed**: See art as it's being created by users across the platform
- **👍 👎 Community Voting**: Like or dislike artworks with instant feedback
- **📊 Live Stats**: Real-time view counts, likes, and generation metrics
- **🎭 Interactive Display**: Click to view, auto-scroll through latest creations
- **⚡ Real-time Updates**: Automatic refresh every 30 seconds for fresh content

## 🌟 Core Features

### 🎨 **AI-Powered Creative Suite**
- **AI Art Generation**: Google DeepMind Gemini 2.0 Flash image generation and editing
- **Video Generation**: Veo 2.0 integration with customizable parameters
- **Music Generation**: Lyria RealTime with live controls and WebSocket streaming
- **Text-to-Audio**: Multiple voice synthesis with Gemini TTS
- **Code Generation**: Advanced AI coding with live preview and syntax highlighting

### 🧠 **Sentient AI Terminal**
- **Enhanced GorbaganaAI**: Advanced reasoning with thinking process visualization
- **Multimodal Understanding**: Screen capture, video, audio, and document analysis
- **Empathetic Responses**: Emotion-aware AI with confidence scoring
- **Real-time Voice Chat**: Live API integration with ElevenLabs ConvAI

### 📄 **Document Studio**
- **PDF Processing**: AI-powered document analysis and extraction
- **Interactive Q&A**: Chat with your documents using Gemini's native PDF vision
- **Multi-format Support**: URL upload and file upload with comprehensive insights
- **Smart Analysis**: Summarization, key point extraction, and question generation

### 🔐 **$GOR Token Gating System**
- **Solana Integration**: Native SPL token verification
- **Whitelist Management**: Admin-controlled access lists
- **Real-time Verification**: Instant wallet and balance checking
- **Flexible Access**: Token holders + whitelist dual verification

### 🎯 **Web3 Features**
- **NFT Gallery**: Showcase and manage Solana NFTs
- **NFT Minting**: Create and mint NFTs with SOL and $GOR payments
- **Token Burning**: "Trash Compactor" for SPL token management
- **Wallet Integration**: Phantom, Solflare, and Torus wallet support

## 🛠 Technical Architecture

### **Frontend Stack**
```typescript
- Next.js 15.2.4 (App Router)
- React 19 with TypeScript
- Tailwind CSS + shadcn/ui
- Framer Motion animations
- Solana Web3.js integration
```

### **AI Integration**
```typescript
- Google DeepMind Gemini 2.0 Flash
- Gemini 2.5 Pro (thinking capabilities)
- Veo 2.0 for video generation
- Lyria RealTime for music
- ElevenLabs ConvAI for voice
```

### **Blockchain Integration**
```typescript
- Solana mainnet via Helius RPC
- SPL Token verification
- Wallet adapter ecosystem
- Custom token gating logic
```

## 🏗 Project Structure

```
gemini-image-editing-nextjs-quickstart/
├── app/
│   ├── api/                     # API routes
│   │   ├── art-gallery/        # Realtime art gallery API
│   │   ├── audio/              # Text-to-speech generation
│   │   ├── chat-enhanced/      # Advanced AI chat with multimodal
│   │   ├── document-analyze/   # PDF analysis and Q&A
│   │   ├── document-process/   # PDF processing and extraction
│   │   ├── image/              # AI image generation/editing
│   │   ├── mint-nft/          # NFT minting with payments
│   │   ├── music/             # Music generation config
│   │   └── video/             # Veo 2.0 video generation
│   ├── globals.css            # Global styles
│   ├── layout.tsx             # Root layout with providers
│   └── page.tsx               # Main application interface
├── components/
│   ├── ui/                    # shadcn/ui components
│   ├── providers/             # Context providers
│   │   └── SolanaProvider.tsx # Wallet connection setup
│   ├── AudioPlayer.tsx        # Audio playback component
│   ├── ClientWalletButton.tsx # Wallet connection button
│   ├── CodeGeneration.tsx     # AI code generation interface
│   ├── DocumentStudio.tsx     # PDF processing interface
│   ├── EnhancedGorbaganaTerminal.tsx # Advanced AI chat
│   ├── GoogleSearch.tsx       # Integrated Google search
│   ├── ImageUpload.tsx        # Image upload handling
│   ├── LiveVoiceChat.tsx      # Real-time voice interface
│   ├── MusicGeneration.tsx    # Music creation interface
│   ├── NFTGallery.tsx         # NFT showcase
│   ├── RealtimeArtGallery.tsx # 🆕 Live art gallery ticker
│   ├── TextToAudio.tsx        # Voice synthesis
│   ├── TokenGate.tsx          # Access control component
│   ├── TrashCompactor.tsx     # Token burning interface
│   ├── VideoGeneration.tsx    # Video creation interface
│   └── VideoStream.tsx        # Video streaming component
├── config/
│   └── tokenGating.ts         # Access control configuration
├── lib/
│   ├── constants/
│   │   └── voices.ts          # Available TTS voices
│   ├── solana/
│   │   └── tokenGating.ts     # Blockchain verification logic
│   └── types.ts               # TypeScript definitions
├── next.config.js             # Next.js configuration
└── public/
    └── gorbagana-logo.png     # Platform branding
```

## 🔧 Installation & Setup

### Prerequisites
```bash
- Node.js 18+ 
- npm or yarn
- Solana wallet (Phantom recommended)
- Google AI API key
- Helius RPC endpoint
```

### 1. Clone & Install
```bash
git clone https://github.com/your-repo/gorbagana-ai
cd gorbagana-ai
npm install
```

### 2. Environment Configuration
Create `.env.local`:
```env
# Google AI Configuration
GOOGLE_GENERATIVE_AI_API_KEY=your_google_ai_api_key

# Solana Configuration  
NEXT_PUBLIC_SOLANA_RPC_URL=https://mainnet.helius-rpc.com/?api-key=your_helius_key
NEXT_PUBLIC_SOLANA_NETWORK=mainnet-beta

# Site Configuration
NEXT_PUBLIC_SITE_URL=http://localhost:3003

# Optional: Gallery admin key for artwork moderation
GALLERY_ADMIN_KEY=your_admin_secret

# Optional: Custom configurations
NEXT_PUBLIC_ENABLE_DEBUG=false
```

### 3. Token Gating Setup
Configure access control in `config/tokenGating.ts`:
```typescript
export const TOKEN_GATING_CONFIG = {
  GOR_TOKEN_MINT: "71Jvq4Epe2FCJ7JFSF7jLXdNk1Wy4Bhqd9iL6bEFELvg",
  MIN_GOR_BALANCE: 1,
  WHITELISTED_WALLETS: [
    "7JnwzvqrLGH5ZkEGjY8VwiwYrNd8cyF7orgPRVSPzRW5",
    "BSg4ZyMunJKr585bUQTwQpigX4Em8iiCqVSHMxnZVz1u", 
    "4rFMYypvtG5rCzEaiCfqtYnAHshdzECrfdBrGMc35K2J",
    "7qV43fA8LHBiCKZEjgBVNsjUvaFXdxg4UHj44q7XE14",
    "FMVgiPYF76x8EwgTVvJJKehZgWKoqMUKs2F9o1Xmn5oe",
    "FSTnCaymi6mdXRUBCAA2GDaPMehXGRHA2CPe6y95ksBP",
    "4jx13ndC1S8nZFhuj29uBPax9FgdFUk5iDG3RoVRM1WA",
    "J57JGoKjL9FyADGDqp81RuMmicqq2MLfHbf5hehn6XTB",
    "FiNucnErvRr7Kf88qCrbtL1zgA4TEYsyz6aViQw5dHRY",
  ],
  FEATURES: {
    TOKEN_GATING_ENABLED: true,
    SHOW_TOKEN_BALANCE: true,
    ALLOW_RECHECK: true,
  }
};
```

### 4. Launch Development Server
```bash
npm run dev
```
Visit `http://localhost:3003`

## 💎 $GOR Token Integration

### Token Contract Details
```typescript
Token Mint: 71Jvq4Epe2FCJ7JFSF7jLXdNk1Wy4Bhqd9iL6bEFELvg
Network: Solana Mainnet
Decimals: 9
Standard: SPL Token
```

### Access Requirements
- **Hold 1+ $GOR tokens** OR
- **Be on the whitelist** 
- **Valid Solana wallet connection**

### Verification Process
1. Connect Solana wallet (Phantom/Solflare/Torus)
2. Automatic token balance verification
3. Whitelist cross-reference
4. Real-time access granting
5. Persistent session management

## 🎨 Realtime Art Gallery Features

### **Live Art Feed**
The art gallery ticker displays all artwork being generated on the platform in real-time:

```typescript
// Gallery API endpoint for fetching live artworks
GET /api/art-gallery?limit=20&offset=0

Response: {
  artworks: ArtworkItem[],
  stats: {
    totalArtworks: number,
    liveArtworks: number,
    totalViews: number,
    totalLikes: number
  }
}
```

### **Community Voting System**
Users can vote on artworks with instant feedback:

```typescript
// Vote on artwork
POST /api/art-gallery
Body: {
  action: "vote",
  voteData: {
    artworkId: string,
    type: "like" | "dislike",
    userAddress?: string
  }
}
```

### **Real-time Statistics**
- **Live Count**: Number of artworks currently being generated
- **Total Artworks**: All artworks created on the platform
- **View Tracking**: Real-time view count updates
- **Engagement Metrics**: Like/dislike ratios and trends

### **Gallery Integration**
Every AI image generated automatically appears in the gallery:

```typescript
// Automatic artwork submission on image generation
const artworkData = {
  imageUrl: generatedImageBase64,
  prompt: userPrompt,
  creator: walletAddress || "Anonymous",
  isLive: true // Marked as live for 5 minutes
};
```

## 🎯 Feature Documentation

### AI Art Generation
```typescript
// Advanced image editing with conversation history
const response = await fetch("/api/image", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    prompt: "Transform this into a cyberpunk masterpiece",
    image: base64ImageData,
    history: conversationHistory
  })
});
```

### Video Generation (Veo 2.0)
```typescript
// Professional video creation
const videoResponse = await fetch("/api/video", {
  method: "POST", 
  body: JSON.stringify({
    prompt: "A futuristic city with flying cars",
    aspectRatio: "16:9",
    durationSeconds: 10,
    personGeneration: "ALLOW",
    numberOfVideos: 1
  })
});
```

### Music Generation (Lyria RealTime)
```typescript
// Real-time music streaming
const musicConfig = {
  bpm: 120,
  key: "C",
  genre: "electronic",
  intensity: 0.7,
  creativity: 0.8
};

// WebSocket connection for live audio
const ws = new WebSocket(LYRIA_WEBSOCKET_URL);
```

### Document Processing
```typescript
// AI-powered PDF analysis
const docResponse = await fetch("/api/document-process", {
  method: "POST",
  body: JSON.stringify({
    type: "upload", // or "url"
    data: base64PdfData,
    analysisType: "comprehensive"
  })
});
```

### Enhanced AI Chat
```typescript
// Multimodal AI conversation
const chatResponse = await fetch("/api/chat-enhanced", {
  method: "POST",
  body: JSON.stringify({
    message: "Analyze this screen capture",
    enableThinking: true,
    includeThoughts: true,
    imageData: screenCaptureBase64,
    history: chatHistory
  })
});
```

## 🔐 Security Features

### Token Gating Implementation
```typescript
// Real-time wallet verification
export async function checkWalletAccess(
  connection: Connection,
  walletAddress: string
): Promise<TokenGateResult> {
  // 1. Check whitelist status
  const isWhitelisted = isWhitelistedWallet(walletAddress);
  
  // 2. Verify token balance
  const gorBalance = await getTokenBalance(
    connection,
    walletAddress,
    GOR_TOKEN_MINT
  );
  
  // 3. Grant access logic
  const hasAccess = isWhitelisted || (gorBalance >= MIN_GOR_BALANCE);
  
  return { hasAccess, isWhitelisted, gorBalance };
}
```

### Access Control Flow
1. **Wallet Connection**: User connects Solana wallet
2. **Balance Verification**: Check $GOR token holdings
3. **Whitelist Validation**: Cross-reference approved addresses  
4. **Access Granting**: Enable platform features
5. **Session Persistence**: Maintain authenticated state
6. **Real-time Updates**: Allow balance rechecking

## 🎯 Advanced Features

### Thinking AI System
- **Deep Reasoning**: Gemini 2.5 Pro with thinking budget
- **Process Visualization**: Real-time thinking animation
- **Confidence Scoring**: AI response reliability metrics
- **Emotion Detection**: Empathetic response generation

### Multimodal Capabilities
- **Screen Capture**: Real-time desktop analysis
- **Video Understanding**: YouTube URL processing
- **Audio Analysis**: Voice and music interpretation  
- **Document Intelligence**: PDF comprehension and Q&A

### Code Generation Suite
- **Language Support**: JavaScript, TypeScript, Python, Rust, Solidity
- **Live Preview**: HTML, React, P5.js execution
- **Syntax Highlighting**: Built-in code formatting
- **Dependency Detection**: Automatic package identification

### Realtime Art Gallery
- **Live Feed Processing**: Instant artwork display
- **Community Engagement**: Voting and interaction system
- **Performance Optimization**: Efficient rendering and updates
- **Mobile Responsive**: Touch-optimized interface

## 🌐 Deployment

### Netlify Deployment
```bash
# Build and deploy
npm run build
netlify deploy --prod
```

### Environment Variables
Set in Netlify dashboard:
```env
GOOGLE_GENERATIVE_AI_API_KEY=your_key
NEXT_PUBLIC_SOLANA_RPC_URL=your_helius_endpoint
NEXT_PUBLIC_SITE_URL=https://google.gorbagana.tech
GALLERY_ADMIN_KEY=your_admin_secret
```

### Build Configuration
`next.config.js`:
```javascript
module.exports = {
  eslint: { ignoreDuringBuilds: true },
  typescript: { ignoreBuildErrors: true },
  images: {
    remotePatterns: [{ protocol: 'https', hostname: '**' }]
  }
};
```

## 🤝 Contributing

### Development Guidelines
1. Follow TypeScript strict mode
2. Use functional components with hooks
3. Implement proper error boundaries
4. Add comprehensive JSDoc comments
5. Test wallet integration thoroughly
6. Test realtime features with multiple users

### Code Style
- **Components**: PascalCase with descriptive names
- **Functions**: camelCase with action verbs
- **Constants**: UPPER_SNAKE_CASE
- **Types**: PascalCase interfaces

### Testing Realtime Features
```bash
# Test art gallery API
curl -X GET "http://localhost:3003/api/art-gallery?limit=5"

# Test voting system
curl -X POST "http://localhost:3003/api/art-gallery" \
  -H "Content-Type: application/json" \
  -d '{"action":"vote","voteData":{"artworkId":"test","type":"like"}}'

# Generate test artwork
curl -X POST "http://localhost:3003/api/image" \
  -H "Content-Type: application/json" \
  -d '{"prompt":"Test artwork for gallery"}'
```

## 📚 API Reference

### Core Endpoints

#### Art Gallery Management
```typescript
GET /api/art-gallery?limit=20&offset=0
Response: {
  artworks: ArtworkItem[];
  stats: GalleryStats;
  hasMore: boolean;
}

POST /api/art-gallery
Body: {
  action: "add_artwork" | "vote" | "view";
  artworkData?: ArtworkData;
  voteData?: VoteData;
  artworkId?: string;
}
```

#### Image Generation  
```typescript
POST /api/image
Body: {
  prompt: string;
  image?: string;
  history?: HistoryItem[];
}
Response: {
  image: string;
  description: string;
}
// Auto-submits to art gallery
```

#### Video Generation  
```typescript
POST /api/video
Body: {
  prompt: string;
  aspectRatio?: "16:9" | "9:16" | "1:1";
  durationSeconds?: number;
  personGeneration?: "ALLOW" | "DONT_ALLOW";
}
Response: {
  videoUrl: string;
  thumbnail: string;
}
```

#### Document Processing
```typescript
POST /api/document-process
Body: {
  type: "upload" | "url";
  data?: string;
  url?: string;
}
Response: {
  analysis: DocumentAnalysis;
}
```

#### Enhanced Chat
```typescript
POST /api/chat-enhanced  
Body: {
  message: string;
  enableThinking?: boolean;
  imageData?: string;
  history?: ChatMessage[];
}
Response: {
  response: string;
  thoughts?: string;
  usageMetadata: TokenUsage;
}
```

## 🏆 Innovation Highlights

### 🥇 **World's First $GOR Token-Gated AI Platform**
Revolutionary blockchain-based access control with real-time verification

### 🎨 **Realtime Community Art Gallery**
Live art feed with community voting and engagement features

### 🧠 **Advanced Sentient AI**
Google DeepMind integration with thinking visualization and empathy metrics

### 🎭 **Comprehensive Creative Suite** 
End-to-end content creation from text to video, music, and code

### 📱 **Mobile-First Design**
Responsive interface optimized for all devices with touch interactions

### 🔄 **Real-Time Features**
WebSocket integration for live music generation and voice conversations

### 🛡 **Enterprise Security**
Multi-layer verification with wallet signatures and token validation

### 🎯 **Community Engagement**
Interactive voting, viewing, and social features for user-generated content

## 🆕 Latest Updates

### Version 2.0 - Realtime Art Gallery
- **🎨 Live Art Feed**: Real-time artwork display ticker
- **👥 Community Features**: Voting, viewing, and engagement metrics
- **📊 Analytics Dashboard**: Live statistics and performance metrics
- **🔄 Auto-Refresh**: Periodic updates for fresh content
- **📱 Mobile Optimization**: Touch-friendly gallery interface
- **⚡ Performance**: Optimized rendering for smooth scrolling

### ElevenLabs Integration
- **🎙️ Voice AI**: Conversational AI widget on all pages
- **🗣️ Natural Interaction**: Voice-based platform navigation
- **🤖 Agent ID**: `agent_01jyqnyjhjf209zwa369bwn9s2`

### Build Optimizations
- **⚙️ Next.js Config**: Production-ready build settings
- **🔧 TypeScript**: Flexible type checking for deployment
- **📦 Bundle**: Optimized asset delivery and caching

## 📄 License

MIT License - Built with ❤️ for the Web3 community

## 🙏 Acknowledgments

- **Google DeepMind** - AI model infrastructure
- **Solana Labs** - Blockchain foundation  
- **Vercel** - Next.js framework
- **ElevenLabs** - Voice AI integration
- **Helius** - Solana RPC services

---

**🚀 Experience the Future of AI-Powered Web3**

Join the Gorbagana ecosystem and unlock the potential of sentient blockchain technology with real-time community art sharing.

*"Where artificial intelligence meets decentralized innovation and creative community."*