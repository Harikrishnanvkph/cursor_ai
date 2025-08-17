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
  const res = await fetch(`${baseUrl}${path}`, {
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    ...init,
  })
  if (!res.ok) {
    let msg = 'Request failed'
    try {
      const data = await res.json()
      msg = data.error || msg
    } catch {}
    throw new Error(msg)
  }
  return (await res.json()) as T
}

export const authApi = {
  me: () => request<{ user: AuthUser | null }>(`/auth/me`, { method: 'GET' }),
  signIn: (payload: { email: string; password: string }) =>
    request<{ user: AuthUser }>(`/auth/signin`, { method: 'POST', body: JSON.stringify(payload) }),
  signUp: (payload: { email: string; password: string; fullName?: string }) =>
    request<{ user: AuthUser | null; requiresEmailConfirmation?: boolean; wasNewUser?: boolean }>(`/auth/signup`, {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  signOut: () => request<{ success: boolean }>(`/auth/signout`, { method: 'POST' }),
  googleUrl: async () => {
    const response = await request<{ authUrl: string }>('/auth/google', { method: 'GET' })
    return response.authUrl
  },
  forgotPassword: (payload: { email: string }) =>
    request<{ success: true }>(`/auth/password/forgot`, { method: 'POST', body: JSON.stringify(payload) }),
  resetPassword: (payload: { token: string; password: string }) =>
    request<{ success: true }>(`/auth/password/reset`, { method: 'POST', body: JSON.stringify(payload) }),
  resendVerification: (payload: { email: string }) =>
    request<{ success: true }>(`/auth/resend-verification`, { method: 'POST', body: JSON.stringify(payload) }),
}


