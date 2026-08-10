export interface SessionData {
  token: string
  userId: string
  expiresAt: number
  role?: string
  name?: string
  email?: string
  status?: string
  loginTime?: number
}