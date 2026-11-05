export type CloudCreditGrant = {
  id: string
  pack_id: 'cloud_lite' | 'cloud_pro'
  credits_amount: number
  purchased_at: string
  expires_at: string
}

export type AuthUser = {
  id: string
  email?: string
  full_name?: string
  avatar_url?: string
  provider?: string
  provider_id?: string
  user_metadata?: Record<string, any>
  is_admin?: boolean
  subscription_tier?: 'free' | 'lite' | 'pro' | 'enterprise'
  free_ai_credits_used?: number
  free_ai_credits_limit?: number
  free_ai_credits_remaining?: number
  purchased_ai_credits?: number
  ai_credits_used?: number
  ai_credits_limit?: number
  ai_credits_remaining?: number
  permanent_cloud_credits?: number
  bonus_cloud_credits?: number
  active_cloud_grants?: CloudCreditGrant[]
  cloud_charts_limit?: number
  saved_charts_count?: number
  cloud_charts_remaining?: number
  first_ai_bonus_claimed?: boolean
  credits_reset_at?: string
}

const baseUrl = process.env.NEXT_PUBLIC_SERVER_URL || 'http://localhost:5000'

async function request<T>(path: string, init?: RequestInit & { timeoutMs?: number }): Promise<T> {
  // Add timeout to prevent hanging requests (12 seconds gives Supabase room for cold starts/refreshes)
  const { timeoutMs = 12000, ...fetchInit } = init || {}
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs)

  try {
    // Only declare a JSON content type when there is a body. A `Content-Type: application/json`
    // header on a bodiless GET turns an otherwise "simple" cross-origin request into one that needs a
    // CORS preflight, which doubled the latency of every /auth/me call.
    const headers: Record<string, string> = {
      ...(fetchInit.body ? { 'Content-Type': 'application/json' } : {}),
      ...((fetchInit.headers as Record<string, string> | undefined) || {}),
    }

    const res = await fetch(`${baseUrl}${path}`, {
      credentials: 'include',
      ...fetchInit,
      headers,
      signal: controller.signal,
    })

    if (!res.ok) {
      let msg = 'Request failed'
      let errData: any = {}
      try {
        errData = await res.json()
        msg = errData.error || errData.message || msg
      } catch { }
      const err: any = new Error(msg)
      err.status = res.status
      err.code = errData.code
      throw err
    }

    return (await res.json()) as T
  } catch (error: any) {
    // Handle timeout errors - DON'T THROW, return error object with status 408
    if (error.name === 'AbortError') {
      return {
        error: 'timeout',
        message: 'Request timed out. Please try again.',
        status: 408
      } as T
    }

    // Handle network errors gracefully - DON'T THROW, return a default response with status 0
    if (error.name === 'TypeError' && error.message.includes('Failed to fetch')) {
      return {
        error: 'network_failure',
        message: 'Unable to connect to the server. Please check your internet connection and try again.',
        status: 0
      } as T
    }

    // Handle other fetch errors
    if (error.name === 'TypeError') {
      return {
        error: 'network_failure',
        message: 'Network error occurred. Please try again.',
        status: 0
      } as T
    }

    // Handle other errors - return error object with HTTP status and code
    return {
      error: 'unknown',
      message: error.message || 'An unexpected error occurred. Please try again.',
      status: error.status || 500,
      code: error.code
    } as T
  } finally {
    clearTimeout(timeoutId)
  }
}

export const authApi = {
  me: async (): Promise<{ user: AuthUser | null; isAuthError?: boolean; isNetworkError?: boolean }> => {
    // 8s (not the 12s default): this runs on every page load and the provider retries transient failures,
    // so failing fast and retrying beats one long hang.
    const response = await request<{ user: AuthUser | null } | { error: string; message: string; status?: number; code?: string }>(`/auth/me`, { method: 'GET', timeoutMs: 8000 })

    // Check if this is an error response
    if ('error' in response) {
      const status = response.status
      // Only HTTP 401 means the user is definitively unauthenticated
      if (status === 401) {
        return { user: null, isAuthError: true, isNetworkError: false }
      }
      // Any other error (network failure, timeout, 429, 500/503) is transient and must NOT destroy user session
      return { user: null, isAuthError: false, isNetworkError: true }
    }

    // TypeScript guard to ensure response has user
    if ('user' in response) {
      return { user: response.user, isAuthError: false, isNetworkError: false }
    }

    // Fallback
    return { user: null, isAuthError: false, isNetworkError: false }
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
  guestSignIn: async () => {
    const response = await request<{ user: AuthUser } | { error: string; message: string }>(`/auth/guest`, {
      method: 'POST',
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

    // Fallback
    throw new Error('Invalid response format')
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
  upgradeToPro: async (packId: string = 'ai_pro') => {
    const response = await request<{ success: boolean; message: string; subscription: any } | { error: string; message: string }>(`/auth/subscription/upgrade`, {
      method: 'POST',
      body: JSON.stringify({ packId, tier: 'pro' })
    })

    if ('error' in response) {
      throw new Error(response.message)
    }

    return response
  },
  downgradeToFree: async () => {
    const response = await request<{ success: boolean; message: string; subscription: any } | { error: string; message: string }>(`/auth/subscription/downgrade`, {
      method: 'POST',
      body: JSON.stringify({ tier: 'free' })
    })

    if ('error' in response) {
      throw new Error(response.message)
    }

    return response
  },
}


