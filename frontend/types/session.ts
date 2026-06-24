// Define session type
export interface SessionData {
  token: string
  userId: string
  role: string
  name: string
  email: string
  status: string
  loginTime: number
  expiresAt: number
}

