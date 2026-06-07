export interface UserProfile {
  id: string
  email: string
  username: string | null
  avatarUrl: string | null
}

export const AUTH_RETURN_KEY = 'pmo-auth-return'
