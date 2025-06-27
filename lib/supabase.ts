import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Server-side client with service role key for admin operations
export const supabaseAdmin = createClient(
  supabaseUrl,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// Database types
export interface User {
  id: string
  wallet_address?: string
  username?: string
  avatar_url?: string
  created_at: string
  updated_at: string
}

export interface ChatSession {
  id: string
  user_id: string
  title: string
  created_at: string
  updated_at: string
}

export interface ChatMessage {
  id: string
  session_id: string
  user_id: string
  role: 'user' | 'assistant'
  content: string
  metadata?: any
  created_at: string
}

export interface GeneratedImage {
  id: string
  user_id: string
  prompt: string
  image_url: string
  width?: number
  height?: number
  model?: string
  style?: string
  is_public: boolean
  votes_count: number
  created_at: string
}

export interface ImageVote {
  id: string
  user_id: string
  image_id: string
  vote_type: 'upvote' | 'downvote'
  created_at: string
}

export interface CodeExecution {
  id: string
  user_id: string
  session_id?: string
  prompt: string
  code: string
  output?: string
  error?: string
  language: string
  created_at: string
}

export interface SearchQuery {
  id: string
  user_id: string
  session_id?: string
  query: string
  results?: any
  search_type: 'google' | 'url_context' | 'combined'
  created_at: string
}