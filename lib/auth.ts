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
      // Check if we have a wallet auth in localStorage
      const walletAuth = localStorage.getItem('wallet_auth')
      
      if (walletAuth) {
        const { data: userData, error } = await supabase
          .from('users')
          .select('*')
          .eq('wallet_address', walletAuth)
          .single()
          
        if (userData && !error) {
          setUser(userData)
        } else {
          // Clear invalid auth
          localStorage.removeItem('wallet_auth')
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
      const walletAddress = publicKey.toBase58()
      
      // Check if user already exists with this wallet
      const { data: existingUser, error: fetchError } = await supabase
        .from('users')
        .select('*')
        .eq('wallet_address', walletAddress)
        .single()

      if (existingUser && !fetchError) {
        // User exists, just set them as current user
        setUser(existingUser)
        localStorage.setItem('wallet_auth', walletAddress)
        return existingUser
      }

      // Create new user directly without auth session
      // Generate a unique ID for the user
      const userId = crypto.randomUUID()
      
      const { data: newUser, error: createError } = await supabase
        .from('users')
        .insert({
          id: userId,
          wallet_address: walletAddress,
          username: `user_${walletAddress.slice(0, 8)}`,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single()

      if (createError) {
        console.error('Error creating user:', createError)
        throw createError
      }

      setUser(newUser)
      localStorage.setItem('wallet_auth', walletAddress)
      return newUser

    } catch (error) {
      console.error('Error signing in with wallet:', error)
      throw error
    } finally {
      setLoading(false)
    }
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
    localStorage.removeItem('wallet_auth')
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