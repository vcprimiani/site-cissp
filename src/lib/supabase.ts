import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables. Please check your .env file.')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    flowType: 'pkce'
  }
})

// Helper function to extract project reference from Supabase URL
export const getSupabaseProjectRef = (): string => {
  try {
    const url = new URL(supabaseUrl)
    return url.hostname.split('.')[0]
  } catch (error) {
    console.error('Failed to extract project reference from Supabase URL:', error)
    return ''
  }
}

// Helper function to clear invalid session data
export const clearInvalidSession = async (): Promise<void> => {
  try {
    // Sign out to clear server-side session
    await supabase.auth.signOut()
    
    // Clear local storage items related to Supabase auth
    const projectRef = getSupabaseProjectRef()
    if (projectRef) {
      const authKey = `sb-${projectRef}-auth-token`
      localStorage.removeItem(authKey)
    }
    
    // Clear any other potential auth-related items
    Object.keys(localStorage).forEach(key => {
      if (key.includes('supabase') || key.includes('auth')) {
        localStorage.removeItem(key)
      }
    })
  } catch (error) {
    console.error('Error clearing invalid session:', error)
  }
}

// Auth helper functions
export const authHelpers = {
  // Sign up with email and password
  signUp: async (email: string, password: string, fullName: string) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
          role: 'leader'
        }
      }
    })
    return { data, error }
  },

  // Sign in with email and password
  signIn: async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    })
    return { data, error }
  },

  // Sign out
  signOut: async () => {
    try {
      const { error } = await supabase.auth.signOut()
      
      // Check for session not found error - this means user is already signed out
      if (error && error.message.includes('Session from session_id claim in JWT does not exist')) {
        // Clear local session data and treat as successful logout
        await clearInvalidSession()
        return { error: null }
      }
      
      return { error }
    } catch (error: any) {
      // Handle any other errors during sign out
      if (error.message && error.message.includes('Session from session_id claim in JWT does not exist')) {
        // Clear local session data and treat as successful logout
        await clearInvalidSession()
        return { error: null }
      }
      
      return { error }
    }
  },

  // Get current session with error handling
  getSession: async () => {
    try {
      const { data: { session }, error } = await supabase.auth.getSession()
      
      // Check for refresh token errors
      if (error && (
        error.message.includes('Invalid Refresh Token') ||
        error.message.includes('refresh_token_not_found') ||
        error.message.includes('Refresh Token Not Found')
      )) {
        console.warn('Invalid refresh token detected, clearing session')
        await clearInvalidSession()
        return { session: null, error: null }
      }
      
      return { session, error }
    } catch (error) {
      console.error('Error getting session:', error)
      return { session: null, error }
    }
  },

  // Get current user
  getCurrentUser: async () => {
    const { data: { user }, error } = await supabase.auth.getUser()
    return { user, error }
  },

  // Update user profile
  updateProfile: async (updates: { full_name?: string; avatar_url?: string }) => {
    const { data, error } = await supabase.auth.updateUser({
      data: updates
    })
    return { data, error }
  },

  // Reset password
  resetPassword: async (email: string) => {
    const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`
    })
    return { data, error }
  },

  // Update password
  updatePassword: async (password: string) => {
    const { data, error } = await supabase.auth.updateUser({
      password
    })
    return { data, error }
  }
}

// Password validation helper
export const validatePassword = (password: string): { isValid: boolean; errors: string[] } => {
  const errors: string[] = []
  
  if (password.length < 8) {
    errors.push('Password must be at least 8 characters long')
  }
  
  if (!/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter')
  }
  
  if (!/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter')
  }
  
  if (!/\d/.test(password)) {
    errors.push('Password must contain at least one number')
  }
  
  if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
    errors.push('Password must contain at least one special character')
  }
  
  // Check for common weak passwords
  const commonPasswords = [
    'password', '123456', '123456789', 'qwerty', 'abc123', 
    'password123', 'admin', 'letmein', 'welcome', 'monkey'
  ]
  
  if (commonPasswords.includes(password.toLowerCase())) {
    errors.push('Password is too common. Please choose a more secure password')
  }
  
  return {
    isValid: errors.length === 0,
    errors
  }
}

// Email validation helper
export const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}