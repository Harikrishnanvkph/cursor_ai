export type AuthUser = {
  id: string
  email?: string
  full_name?: string
  avatar_url?: string
  provider?: string
  provider_id?: string
  user_metadata?: Record<string, any>
}

const baseUrl = process.env.NEXT_PUBLIC_SERVER_URL || 'http://localhost:3001'

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  try {
    // Add timeout to prevent hanging requests
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 4000) // 4 second timeout to avoid long hangs
    
    const res = await fetch(`${baseUrl}${path}`, {
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      signal: controller.signal,
      ...init,
    })
    
    clearTimeout(timeoutId)
    
    if (!res.ok) {
      let msg = 'Request failed'
      try {
        const data = await res.json()
        msg = data.error || msg
      } catch {}
      throw new Error(msg)
    }
    
    return (await res.json()) as T
  } catch (error: any) {
    // Handle timeout errors - DON'T THROW, return error object
    if (error.name === 'AbortError') {
      return { 
        error: 'timeout',
        message: 'Request timed out. Please try again.'
      } as T
    }
    
    // Handle network errors gracefully - DON'T THROW, return a default response
    if (error.name === 'TypeError' && error.message.includes('Failed to fetch')) {
      // Return a default response that indicates network failure
      // This prevents the error from bubbling up
      return { 
        error: 'network_failure',
        message: 'Unable to connect to the server. Please check your internet connection and try again.'
      } as T
    }
    
    // Handle other fetch errors
    if (error.name === 'TypeError') {
      return { 
        error: 'network_failure',
        message: 'Network error occurred. Please try again.'
      } as T
    }
    
    // Handle other errors - DON'T THROW, return error object
    return { 
      error: 'unknown',
      message: error.message || 'An unexpected error occurred. Please try again.'
    } as T
  }
}

export const authApi = {
  me: async () => {
    const response = await request<{ user: AuthUser | null } | { error: string; message: string }>(`/auth/me`, { method: 'GET' })
    
    // Check if this is any error response (network, timeout, unknown)
    if ('error' in response) {
      // For refresh/me calls, return null instead of throwing
      return { user: null }
    }
    
    // TypeScript guard to ensure response has user
    if ('user' in response) {
      return response
    }
    
    // Fallback - this shouldn't happen but satisfies TypeScript
    return { user: null }
  },
  signIn: async (payload: { email: string; password: string }) => {
    const response = await request<{ user: AuthUser } | { error: string; message: string }>(`/auth/signin`, { 
      method: 'POST', 
      body: JSON.stringify(payload) 
    })
    
    // Check if this is a network failure response (don't throw, return null)
    if ('error' in response && (response.error === 'network_failure' || response.error === 'timeout')) {
      return null
    }
    
    // Check if this is an API error response (throw it so it goes to catch block)
    if ('error' in response) {
      throw new Error(response.message)
    }
    
    // TypeScript guard to ensure response has user
    if ('user' in response) {
      return response
    }
    
    // Fallback - this shouldn't happen but satisfies TypeScript
    throw new Error('Invalid response format')
  },
  signUp: async (payload: { email: string; password: string; fullName?: string }) => {
    const response = await request<{ user: AuthUser | null; requiresEmailConfirmation?: boolean; wasNewUser?: boolean } | { error: string; message: string }>(`/auth/signup`, {
      method: 'POST',
      body: JSON.stringify(payload),
    })
    
    // Check if this is a network failure response (don't throw, return null)
    if ('error' in response && (response.error === 'network_failure' || response.error === 'timeout')) {
      return null
    }
    
    // Check if this is an API error response (throw it so it goes to catch block)
    if ('error' in response) {
      throw new Error(response.message)
    }
    
    // TypeScript guard to ensure response has user
    if ('user' in response) {
      return response
    }
    
    // Fallback - this shouldn't happen but satisfies TypeScript
    throw new Error('Invalid response format')
  },
  signOut: async () => {
    const response = await request<{ success: boolean } | { error: string; message: string }>(`/auth/signout`, { method: 'POST' })
    
    // Check if this is any error response (network, timeout, unknown) - DON'T THROW, return null
    if ('error' in response) {
      return null
    }
    
    // TypeScript guard to ensure response has success
    if ('success' in response) {
      return response
    }
    
    // Fallback - this shouldn't happen but satisfies TypeScript
    return null
  },
  googleUrl: async () => {
    const response = await request<{ authUrl: string } | { error: string; message: string }>('/auth/google', { method: 'GET' })
    
    // Check if this is any error response (network, timeout, unknown) - DON'T THROW, return null
    if ('error' in response) {
      return null
    }
    
    // TypeScript guard to ensure response has authUrl
    if ('authUrl' in response) {
      return response.authUrl
    }
    
    // Fallback - this shouldn't happen but satisfies TypeScript
    return null
  },
  forgotPassword: async (payload: { email: string }) => {
    const response = await request<{ success: true } | { error: string; message: string }>(`/auth/password/forgot`, { 
      method: 'POST', 
      body: JSON.stringify(payload) 
    })
    
    // Check if this is any error response (network, timeout, unknown) - DON'T THROW, return null
    if ('error' in response) {
      return null
    }
    
    // TypeScript guard to ensure response has success
    if ('success' in response) {
      return response
    }
    
    // Fallback - this shouldn't happen but satisfies TypeScript
    return null
  },
  resetPassword: async (payload: { token: string; password: string }) => {
    const response = await request<{ success: boolean } | { error: string; message: string }>(`/auth/password/reset`, { 
      method: 'POST', 
      body: JSON.stringify(payload) 
    })
    
    // Check if this is any error response (network, timeout, unknown) - DON'T THROW, return null
    if ('error' in response) {
      return null
    }
    // TypeScript guard to ensure response has success
    if ('success' in response) {
      return response
    }
    
    // Fallback - this shouldn't happen but satisfies TypeScript
    return null
  },
  resendVerification: async (payload: { email: string }) => {
    const response = await request<{ success: true } | { error: string; message: string }>(`/auth/resend-verification`, { 
      method: 'POST', 
      body: JSON.stringify(payload) 
    })
    
    // Check if this is any error response (network, timeout, unknown) - DON'T THROW, return null
    if ('error' in response) {
      return null
    }
    
    // TypeScript guard to ensure response has success
    if ('success' in response) {
      return response
    }
    
    // Fallback - this shouldn't happen but satisfies TypeScript
    return null
  },
}


