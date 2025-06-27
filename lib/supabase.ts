import { createClient } from '@supabase/supabase-js'

// Get environment variables with fallbacks
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://wjrbxaakiizuegbfwbbx.supabase.co'
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndqcmJ4YWFraWl6dWVnYmZ3YmJ4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk0MTIzODIsImV4cCI6MjA2NDk4ODM4Mn0.M5_3zQIYtR4wvQMdDyQutY-xPrNSVCVmIt2EFBk5oo8'

// Validate that we have the required values
if (!supabaseUrl || supabaseUrl === 'undefined' || supabaseUrl === '') {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL environment variable')
}

if (!supabaseAnonKey || supabaseAnonKey === 'undefined' || supabaseAnonKey === '') {
  console.error('Missing NEXT_PUBLIC_SUPABASE_ANON_KEY environment variable')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Server-side client with service role key for admin operations
// Only create this on the server side
export const getSupabaseAdmin = () => {
  if (typeof window !== 'undefined') {
    throw new Error('supabaseAdmin should only be used on the server side')
  }
  
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndqcmJ4YWFraWl6dWVnYmZ3YmJ4Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0OTQxMjM4MiwiZXhwIjoyMDY0OTg4MzgyfQ.5WrFgeeESDjvLPiDt5WC2Gdp2S6IQc3pF8HhPV9S_Sk'
  
  if (!serviceRoleKey || serviceRoleKey === 'undefined' || serviceRoleKey === '') {
    throw new Error('Missing SUPABASE_SERVICE_ROLE_KEY environment variable')
  }
  
  return createClient(supabaseUrl, serviceRoleKey)
}

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

export interface DevRequest {
  id: string
  user_id: string
  user_wallet_address: string
  title: string
  description: string
  category: 'bug' | 'feature' | 'question' | 'feedback' | 'other'
  priority: 'low' | 'medium' | 'high' | 'urgent'
  status: 'open' | 'in_progress' | 'resolved' | 'closed'
  url?: string
  metadata?: any
  created_at: string
  updated_at: string
}

export interface DevRequestFile {
  id: string
  request_id: string
  file_name: string
  file_url: string
  file_type: string
  file_size?: number
  created_at: string
}

export interface DevResponse {
  id: string
  request_id: string
  admin_wallet_address: string
  response_text: string
  is_admin: boolean
  created_at: string
  updated_at: string
}