import { useState, useEffect } from 'react'
import { User, Session, AuthError } from '@supabase/supabase-js'
import { supabase, authHelpers, clearInvalidSession } from '../lib/supabase'

interface AuthState {
  user: User | null
  session: Session | null
  loading: boolean
  error: string | null
}

export const useAuth = () => {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    session: null,
    loading: true,
    error: null
  })

  useEffect(() => {
    // Get initial session
    const getInitialSession = async () => {
      try {
        const { session, error } = await authHelpers.getSession()
        
        // Handle refresh token errors specifically
        if (error && (
          error.message.includes('Invalid Refresh Token') ||
          error.message.includes('refresh_token_not_found') ||
          error.message.includes('Refresh Token Not Found')
        )) {
          console.warn('Session expired, clearing invalid session data')
          await clearInvalidSession()
          
          setAuthState(prev => ({
            ...prev,
            session: null,
            user: null,
            loading: false,
            error: null // Don't show error for expired sessions
          }))
          return
        }
        
        if (error) throw error
        
        setAuthState(prev => ({
          ...prev,
          session,
          user: session?.user || null,
          loading: false
        }))
      } catch (error) {
        console.error('Authentication initialization error:', error)
        
        // Check if it's a refresh token error
        const errorMessage = error instanceof Error ? error.message : 'Authentication error'
        if (errorMessage.includes('Invalid Refresh Token') || 
            errorMessage.includes('refresh_token_not_found') ||
            errorMessage.includes('Refresh Token Not Found')) {
          
          console.warn('Clearing invalid session due to refresh token error')
          await clearInvalidSession()
          
          setAuthState(prev => ({
            ...prev,
            session: null,
            user: null,
            loading: false,
            error: null // Don't show error for expired sessions
          }))
        } else {
          setAuthState(prev => ({
            ...prev,
            error: errorMessage,
            loading: false
          }))
        }
      }
    }

    getInitialSession()

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state change:', event, session?.user?.email)
        
        setAuthState(prev => ({
          ...prev,
          session,
          user: session?.user || null,
          loading: false,
          error: null
        }))

        // Handle specific auth events
        if (event === 'SIGNED_IN') {
          console.log('User signed in:', session?.user?.email)
        } else if (event === 'SIGNED_OUT') {
          console.log('User signed out')
        } else if (event === 'TOKEN_REFRESHED') {
          console.log('Token refreshed')
        } else if (event === 'TOKEN_REFRESH_FAILED') {
          console.warn('Token refresh failed, clearing session')
          await clearInvalidSession()
        }
      }
    )

    return () => {
      subscription.unsubscribe()
    }
  }, [])

  const signUp = async (email: string, password: string, fullName: string) => {
    setAuthState(prev => ({ ...prev, loading: true, error: null }))
    
    try {
      const { data, error } = await authHelpers.signUp(email, password, fullName)
      
      if (error) throw error
      
      return { data, error: null }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Sign up failed'
      setAuthState(prev => ({ ...prev, error: errorMessage, loading: false }))
      return { data: null, error: errorMessage }
    }
  }

  const signIn = async (email: string, password: string) => {
    setAuthState(prev => ({ ...prev, loading: true, error: null }))
    
    try {
      const { data, error } = await authHelpers.signIn(email, password)
      
      if (error) throw error
      
      return { data, error: null }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Sign in failed'
      setAuthState(prev => ({ ...prev, error: errorMessage, loading: false }))
      return { data: null, error: errorMessage }
    }
  }

  const signOut = async () => {
    setAuthState(prev => ({ ...prev, loading: true, error: null }))
    
    try {
      const { error } = await authHelpers.signOut()
      if (error) throw error
      
      return { error: null }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Sign out failed'
      setAuthState(prev => ({ ...prev, error: errorMessage, loading: false }))
      return { error: errorMessage }
    }
  }

  const resetPassword = async (email: string) => {
    try {
      const { data, error } = await authHelpers.resetPassword(email)
      if (error) throw error
      
      return { data, error: null }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Password reset failed'
      return { data: null, error: errorMessage }
    }
  }

  return {
    ...authState,
    signUp,
    signIn,
    signOut,
    resetPassword,
    isAuthenticated: !!authState.user
  }
}