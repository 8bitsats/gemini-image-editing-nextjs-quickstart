import { supabase } from './supabase'
import type { 
  ChatSession, 
  ChatMessage, 
  GeneratedImage, 
  ImageVote, 
  CodeExecution, 
  SearchQuery 
} from './supabase'

// Chat Sessions
export async function createChatSession(userId: string, title: string): Promise<ChatSession> {
  const { data, error } = await supabase
    .from('chat_sessions')
    .insert({
      user_id: userId,
      title
    })
    .select()
    .single()

  if (error) throw error
  return data
}

export async function getChatSessions(userId: string): Promise<ChatSession[]> {
  const { data, error } = await supabase
    .from('chat_sessions')
    .select('*')
    .eq('user_id', userId)
    .order('updated_at', { ascending: false })

  if (error) throw error
  return data || []
}

export async function updateChatSession(sessionId: string, updates: Partial<ChatSession>): Promise<ChatSession> {
  const { data, error } = await supabase
    .from('chat_sessions')
    .update(updates)
    .eq('id', sessionId)
    .select()
    .single()

  if (error) throw error
  return data
}

export async function deleteChatSession(sessionId: string): Promise<void> {
  const { error } = await supabase
    .from('chat_sessions')
    .delete()
    .eq('id', sessionId)

  if (error) throw error
}

// Chat Messages
export async function saveChatMessage(
  sessionId: string,
  userId: string,
  role: 'user' | 'assistant',
  content: string,
  metadata?: any
): Promise<ChatMessage> {
  const { data, error } = await supabase
    .from('chat_messages')
    .insert({
      session_id: sessionId,
      user_id: userId,
      role,
      content,
      metadata
    })
    .select()
    .single()

  if (error) throw error
  return data
}

export async function getChatMessages(sessionId: string): Promise<ChatMessage[]> {
  const { data, error } = await supabase
    .from('chat_messages')
    .select('*')
    .eq('session_id', sessionId)
    .order('created_at', { ascending: true })

  if (error) throw error
  return data || []
}

export async function getUserChatMessages(userId: string, limit = 100): Promise<ChatMessage[]> {
  const { data, error } = await supabase
    .from('chat_messages')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(limit)

  if (error) throw error
  return data || []
}

// Generated Images
export async function saveGeneratedImage(
  userId: string,
  prompt: string,
  imageUrl: string,
  options: {
    width?: number
    height?: number
    model?: string
    style?: string
    isPublic?: boolean
  } = {}
): Promise<GeneratedImage> {
  const { data, error } = await supabase
    .from('generated_images')
    .insert({
      user_id: userId,
      prompt,
      image_url: imageUrl,
      width: options.width,
      height: options.height,
      model: options.model,
      style: options.style,
      is_public: options.isPublic ?? true
    })
    .select()
    .single()

  if (error) throw error
  return data
}

export async function getPublicImages(
  limit = 20,
  offset = 0,
  sortBy: 'created_at' | 'votes_count' = 'created_at'
): Promise<GeneratedImage[]> {
  const { data, error } = await supabase
    .from('generated_images')
    .select(`
      *,
      users!inner(username, avatar_url)
    `)
    .eq('is_public', true)
    .order(sortBy, { ascending: false })
    .range(offset, offset + limit - 1)

  if (error) throw error
  return data || []
}

export async function getUserImages(userId: string, limit = 50): Promise<GeneratedImage[]> {
  const { data, error } = await supabase
    .from('generated_images')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(limit)

  if (error) throw error
  return data || []
}

export async function deleteGeneratedImage(imageId: string): Promise<void> {
  const { error } = await supabase
    .from('generated_images')
    .delete()
    .eq('id', imageId)

  if (error) throw error
}

// Image Voting
export async function voteOnImage(
  userId: string,
  imageId: string,
  voteType: 'upvote' | 'downvote'
): Promise<ImageVote> {
  // Use upsert to handle updating existing votes
  const { data, error } = await supabase
    .from('image_votes')
    .upsert({
      user_id: userId,
      image_id: imageId,
      vote_type: voteType
    })
    .select()
    .single()

  if (error) throw error
  return data
}

export async function removeVote(userId: string, imageId: string): Promise<void> {
  const { error } = await supabase
    .from('image_votes')
    .delete()
    .eq('user_id', userId)
    .eq('image_id', imageId)

  if (error) throw error
}

export async function getUserVotes(userId: string): Promise<ImageVote[]> {
  const { data, error } = await supabase
    .from('image_votes')
    .select('*')
    .eq('user_id', userId)

  if (error) throw error
  return data || []
}

export async function getImageWithVotes(imageId: string, userId?: string) {
  const { data: image, error: imageError } = await supabase
    .from('generated_images')
    .select(`
      *,
      users!inner(username, avatar_url)
    `)
    .eq('id', imageId)
    .single()

  if (imageError) throw imageError

  let userVote = null
  if (userId) {
    const { data: vote } = await supabase
      .from('image_votes')
      .select('vote_type')
      .eq('image_id', imageId)
      .eq('user_id', userId)
      .single()
    
    userVote = vote?.vote_type || null
  }

  return {
    ...image,
    userVote
  }
}

// Code Executions
export async function saveCodeExecution(
  userId: string,
  prompt: string,
  code: string,
  options: {
    sessionId?: string
    output?: string
    error?: string
    language?: string
  } = {}
): Promise<CodeExecution> {
  const { data, error } = await supabase
    .from('code_executions')
    .insert({
      user_id: userId,
      session_id: options.sessionId,
      prompt,
      code,
      output: options.output,
      error: options.error,
      language: options.language || 'python'
    })
    .select()
    .single()

  if (error) throw error
  return data
}

export async function getUserCodeExecutions(userId: string, limit = 50): Promise<CodeExecution[]> {
  const { data, error } = await supabase
    .from('code_executions')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(limit)

  if (error) throw error
  return data || []
}

// Search Queries
export async function saveSearchQuery(
  userId: string,
  query: string,
  searchType: 'google' | 'url_context' | 'combined',
  options: {
    sessionId?: string
    results?: any
  } = {}
): Promise<SearchQuery> {
  const { data, error } = await supabase
    .from('search_queries')
    .insert({
      user_id: userId,
      session_id: options.sessionId,
      query,
      search_type: searchType,
      results: options.results
    })
    .select()
    .single()

  if (error) throw error
  return data
}

export async function getUserSearchQueries(userId: string, limit = 50): Promise<SearchQuery[]> {
  const { data, error } = await supabase
    .from('search_queries')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(limit)

  if (error) throw error
  return data || []
}

// Real-time subscriptions
export function subscribeToPublicImages(callback: (images: GeneratedImage[]) => void) {
  return supabase
    .channel('public-images')
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'generated_images',
        filter: 'is_public=eq.true'
      },
      async () => {
        // Fetch latest images when changes occur
        const images = await getPublicImages(20, 0, 'created_at')
        callback(images)
      }
    )
    .subscribe()
}

export function subscribeToImageVotes(imageId: string, callback: (votesCount: number) => void) {
  return supabase
    .channel(`image-votes-${imageId}`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'image_votes',
        filter: `image_id=eq.${imageId}`
      },
      async () => {
        // Fetch updated vote count
        const { data } = await supabase
          .from('generated_images')
          .select('votes_count')
          .eq('id', imageId)
          .single()
        
        if (data) {
          callback(data.votes_count)
        }
      }
    )
    .subscribe()
}