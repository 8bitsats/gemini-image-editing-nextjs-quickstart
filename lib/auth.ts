import { supabase } from './supabase'
import { useWallet } from '@solana/wallet-adapter-react'
import { useState, useEffect } from 'react'
import type { User } from './supabase'

// Custom hook for user authentication with wallet
export function useAuth() {
  const { publicKey, connected } = useWallet()
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Get initial user
    getCurrentUser()

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === 'SIGNED_IN' && session) {
          await getCurrentUser()
        } else if (event === 'SIGNED_OUT') {
          setUser(null)
        }
      }
    )

    return () => subscription.unsubscribe()
  }, [])

  useEffect(() => {
    // Auto-login with wallet when connected
    if (connected && publicKey && !user) {
      signInWithWallet()
    }
  }, [connected, publicKey, user])

  const getCurrentUser = async () => {
    try {
      setLoading(true)
      const { data: { session } } = await supabase.auth.getSession()
      
      if (session) {
        // Get user from our custom users table
        const { data: userData, error } = await supabase
          .from('users')
          .select('*')
          .eq('id', session.user.id)
          .single()

        if (error && error.code === 'PGRST116') {
          // User doesn't exist in our table, create them
          await createUser(session.user.id)
          await getCurrentUser()
          return
        }

        if (userData) {
          setUser(userData)
        }
      }
    } catch (error) {
      console.error('Error getting current user:', error)
    } finally {
      setLoading(false)
    }
  }

  const signInWithWallet = async () => {
    if (!publicKey) {
      throw new Error('Wallet not connected')
    }

    try {
      setLoading(true)
      
      // Check if user already exists with this wallet
      const { data: existingUser } = await supabase
        .from('users')
        .select('*')
        .eq('wallet_address', publicKey.toBase58())
        .single()

      if (existingUser) {
        // Sign in existing user
        const { error } = await supabase.auth.signInAnonymously()
        if (error) throw error
        
        setUser(existingUser)
        return existingUser
      }

      // Create new anonymous session
      const { data: authData, error: authError } = await supabase.auth.signInAnonymously()
      if (authError) throw authError

      // Create user record
      const newUser = await createUser(authData.user.id, publicKey.toBase58())
      setUser(newUser)
      return newUser

    } catch (error) {
      console.error('Error signing in with wallet:', error)
      throw error
    } finally {
      setLoading(false)
    }
  }

  const createUser = async (userId: string, walletAddress?: string) => {
    const { data, error } = await supabase
      .from('users')
      .insert({
        id: userId,
        wallet_address: walletAddress,
        username: walletAddress ? `user_${walletAddress.slice(0, 8)}` : undefined
      })
      .select()
      .single()

    if (error) throw error
    return data
  }

  const updateUser = async (updates: Partial<User>) => {
    if (!user) throw new Error('No user logged in')

    const { data, error } = await supabase
      .from('users')
      .update(updates)
      .eq('id', user.id)
      .select()
      .single()

    if (error) throw error
    setUser(data)
    return data
  }

  const signOut = async () => {
    await supabase.auth.signOut()
    setUser(null)
  }

  return {
    user,
    loading,
    signInWithWallet,
    updateUser,
    signOut,
    isAuthenticated: !!user
  }
}

// Server-side function to get user
export async function getServerUser(userId: string) {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('id', userId)
    .single()

  if (error) throw error
  return data
}