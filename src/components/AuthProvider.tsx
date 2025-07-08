'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { User } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'
import { User as UserProfile } from '@/types/database.types'
import { getUserProfile } from '@/lib/auth-helpers'

interface AuthContextType {
  user: User | null
  userProfile: UserProfile | null
  loading: boolean
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let mounted = true

    // Get initial session
    const initializeAuth = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession()

        if (!mounted) return

        if (error) {
          console.error('Session error:', error)
          setLoading(false)
          return
        }

        setUser(session?.user ?? null)

        if (session?.user) {
          await fetchUserProfile(session.user.id)
        } else {
          setLoading(false)
        }
      } catch (error) {
        console.error('Auth initialization error:', error)
        if (mounted) {
          setLoading(false)
        }
      }
    }

    initializeAuth()

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!mounted) return

      console.log('Auth state change:', event, session?.user?.email)

      setUser(session?.user ?? null)

      if (session?.user) {
        await fetchUserProfile(session.user.id)
      } else {
        setUserProfile(null)
        setLoading(false)
      }
    })

    return () => {
      mounted = false
      subscription.unsubscribe()
    }
  }, [])

  async function fetchUserProfile(userId: string) {
    try {
      console.log('Fetching user profile for:', userId)
      const profile = await getUserProfile(userId)
      console.log('User profile fetched:', profile)
      setUserProfile(profile)
    } catch (error) {
      console.error('Error fetching user profile:', error)

      // If user profile doesn't exist, create a minimal one
      // This handles cases where the trigger didn't fire or user hasn't verified email
      const errorMessage = error instanceof Error ? error.message : String(error)
      const errorCode = error && typeof error === 'object' && 'code' in error ? error.code : null

      if (errorMessage?.includes('No rows') || errorCode === 'PGRST116') {
        console.log('User profile not found, user may need to complete setup')
        setUserProfile(null)
      }
    } finally {
      setLoading(false)
    }
  }

  async function handleSignOut() {
    try {
      await supabase.auth.signOut()
      setUser(null)
      setUserProfile(null)
    } catch (error) {
      console.error('Sign out error:', error)
    }
  }

  const value = {
    user,
    userProfile,
    loading,
    signOut: handleSignOut,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
