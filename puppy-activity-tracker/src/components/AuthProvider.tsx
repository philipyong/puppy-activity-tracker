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
  emailVerified: boolean
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [emailVerified, setEmailVerified] = useState(false)

  useEffect(() => {
    let mounted = true
    const timeoutId: NodeJS.Timeout = setTimeout(() => {
      if (mounted && loading) {
        console.log('⚠️ Auth loading timeout reached, forcing completion')
        setLoading(false)
      }
    }, 8000) // 8 second timeout

    // Get initial session
    const initializeAuth = async () => {
      try {
        console.log('🔄 Initializing auth...')
        const { data: { session }, error } = await supabase.auth.getSession()

        if (!mounted) return

        if (error) {
          console.error('❌ Session error:', error)
          setLoading(false)
          clearTimeout(timeoutId)
          return
        }

        console.log('✅ Session check complete:', session?.user ? 'User found' : 'No user')
        setUser(session?.user ?? null)
        setEmailVerified(!!session?.user?.email_confirmed_at)

        if (session?.user) {
          console.log('🔍 Fetching user profile...')
          await fetchUserProfile(session.user.id)
        } else {
          console.log('👤 No user, completing auth initialization')
          setLoading(false)
          clearTimeout(timeoutId)
        }
      } catch (error) {
        console.error('❌ Auth initialization error:', error)
        if (mounted) {
          setLoading(false)
          clearTimeout(timeoutId)
        }
      }
    }

    initializeAuth()

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!mounted) return

      console.log('🔄 Auth state change:', event, session?.user?.email)

      setUser(session?.user ?? null)
      setEmailVerified(!!session?.user?.email_confirmed_at)

      if (session?.user) {
        await fetchUserProfile(session.user.id)
      } else {
        setUserProfile(null)
        setEmailVerified(false)
        setLoading(false)
      }
    })

    return () => {
      mounted = false
      clearTimeout(timeoutId)
      subscription.unsubscribe()
    }
  }, [loading])

  async function fetchUserProfile(userId: string) {
    try {
      console.log('🔍 Fetching user profile for:', userId)

      // Add timeout for profile fetch
      const profilePromise = getUserProfile(userId)
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Profile fetch timeout')), 5000)
      )

      const profile = await Promise.race([profilePromise, timeoutPromise]) as UserProfile
      console.log('✅ User profile fetched:', profile?.name || 'Profile data')
      setUserProfile(profile)
    } catch (error) {
      console.error('❌ Error fetching user profile:', error)

      // If user profile doesn't exist, create a minimal one
      // This handles cases where the trigger didn't fire or user hasn't verified email
      const errorMessage = error instanceof Error ? error.message : String(error)
      const errorCode = error && typeof error === 'object' && 'code' in error ? error.code : null

      if (errorMessage?.includes('No rows') || errorCode === 'PGRST116' || errorMessage?.includes('timeout')) {
        console.log('⚠️ User profile not found or timeout, user may need to complete setup')
        setUserProfile(null)
      }
    } finally {
      console.log('✅ Profile fetch completed, setting loading to false')
      setLoading(false)
    }
  }

  async function handleSignOut() {
    try {
      await supabase.auth.signOut()
      setUser(null)
      setUserProfile(null)
      setEmailVerified(false)
    } catch (error) {
      console.error('Sign out error:', error)
    }
  }

  const value = {
    user,
    userProfile,
    loading,
    emailVerified,
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
