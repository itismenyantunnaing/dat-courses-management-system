// actions/auth.ts
'use server'

import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080"

interface LoginCredentials {
    staff_Id: string
    password: string
}

interface LoginResponse {
    success: boolean
    token?: string
    userId?: string
    role?: string
    name?: string
    email?: string
    status?: string
    message?: string
    lockedUntil?: string
}

interface SessionData {
    token: string
    userId: string
    expiresAt: number 
}

// Session configuration - 1 HOUR
const SESSION_CONFIG = {
    DURATION_HOURS: 1,
    DURATION_MS: 60 * 60 * 1000, // 1 hour in milliseconds
    COOKIE_NAME: 'auth_session',
    COOKIE_OPTIONS: {
        httpOnly: true,
        secure: true, 
        sameSite: 'strict' as const,
        path: '/',
    }
}

// Set session cookie with user data
export async function setSessionCookie(
    token: string,
    userId: string,
) {
    const cookieStore = await cookies()
    const expiresAt = Date.now() + SESSION_CONFIG.DURATION_MS

    const sessionData: SessionData = {
        token,
        userId,
        expiresAt, 
    }

    cookieStore.set(
        SESSION_CONFIG.COOKIE_NAME,
        JSON.stringify(sessionData),
        {
            ...SESSION_CONFIG.COOKIE_OPTIONS,
            maxAge: SESSION_CONFIG.DURATION_MS / 1000, // 3600 seconds = 1 hour
        }
    )
}

// Get session from cookie with expiration check
export async function getSession(): Promise<SessionData | null> {
    const cookieStore = await cookies()
    const sessionCookie = cookieStore.get(SESSION_CONFIG.COOKIE_NAME)

    if (!sessionCookie) {
        return null
    }

    try {
        const sessionData: SessionData = JSON.parse(sessionCookie.value)
        
        //  Check if session has expired
        if (Date.now() >= sessionData.expiresAt) {
            await clearSession()
            return null
        }
        
        return sessionData
    } catch {
        return null
    }
}

// Clear session (logout)
export async function clearSession() {
    const cookieStore = await cookies()
    cookieStore.delete(SESSION_CONFIG.COOKIE_NAME)
}

// Check if session is valid
export async function isSessionValid(): Promise<boolean> {
    const session = await getSession()
    return session !== null
}

// Get auth token for API calls
export async function getAuthToken(): Promise<string | null> {
    const session = await getSession()
    return session?.token || null
}

// Get user ID
export async function getUserId(): Promise<string | null> {
    const session = await getSession()
    return session?.userId || null
}

// Get remaining session time in milliseconds
export async function getRemainingSessionTime(): Promise<number> {
    const session = await getSession()
    if (!session) return 0
    
    const remaining = session.expiresAt - Date.now()
    return Math.max(0, remaining)
}

// Extend session (refresh timeout - resets to 1 hour)
export async function extendSession(): Promise<boolean> {
    const session = await getSession()
    if (session) {
        await setSessionCookie(session.token, session.userId)
        return true
    }
    return false
}

// Check if session is about to expire (for UI warnings)
export async function isSessionExpiringSoon(thresholdMinutes: number = 5): Promise<boolean> {
    const remaining = await getRemainingSessionTime()
    return remaining > 0 && remaining < thresholdMinutes * 60 * 1000
}

// Login action
export async function login(credentials: LoginCredentials): Promise<LoginResponse> {
    try {
        const response = await fetch(`${API_BASE_URL}/security/api/auth/login`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                userId: credentials.staff_Id,
                password: credentials.password
            }),
        })

        const rawText = await response.text()

        let data;
        try {
            data = JSON.parse(rawText)
        } catch {
            if (!rawText || rawText.trim() === '') {
                console.warn("Empty response received from server")
                data = { message: "Server returned empty response" }
            } else {
                console.warn("Non-JSON response:", rawText)
                data = { message: rawText }
            }
        }

        if (response.ok) {
            if (!data.token) {
                console.error("Missing token in response:", data)
                return {
                    success: false,
                    message: "Invalid server response: missing token"
                }
            }

            // Set session cookie with expiration
            await setSessionCookie(
                data.token,
                data.userId,
            )

            return {
                success: true,
                token: data.token,
                userId: data.userId,
                role: data.role,
                name: data.name,
                email: data.email,
                status: data.status,
                message: "Login successful"
            }
        } else if (response.status === 423) {
            return {
                success: false,
                message: `Account locked until: ${new Date(data.lockedUntil).toLocaleString()}`
            }
        } else {
            return {
                success: false,
                message: data.message || "Invalid Staff ID or Password"
            }
        }
    } catch (error) {
        console.error("Login error:", error)
        return {
            success: false,
            message: "Network error. Please check your connection."
        }
    }
}

// Logout action
export async function logout() {
    await clearSession()
    redirect('/') // ✅ Better to redirect to login page
}

// Forgot Password - Send OTP
export async function sendOtp(email: string): Promise<{ success: boolean; message?: string }> {
    try {
        const response = await fetch(`${API_BASE_URL}/api/auth/forgot-password`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ email }),
        })

        const data = await parseResponse(response)

        if (response.ok) {
            return { success: true, message: data.message || "OTP sent successfully" }
        } else {
            return { success: false, message: data.message || "Failed to send OTP" }
        }
    } catch (error) {
        console.error("Send OTP error:", error)
        return { success: false, message: "Network error" }
    }
}

// Forgot Password - Verify OTP
export async function verifyOtp(email: string, otp: string): Promise<{ success: boolean; message?: string }> {
    try {
        const response = await fetch(`${API_BASE_URL}/api/auth/verify-otp`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ email, otp }),
        })

        const data = await parseResponse(response)

        if (response.ok) {
            return { success: true, message: data.message || "OTP verified successfully" }
        } else {
            return { success: false, message: data.message || "Invalid OTP" }
        }
    } catch (error) {
        console.error("Verify OTP error:", error)
        return { success: false, message: "Network error" }
    }
}

// Forgot Password - Reset Password
export async function resetPassword(email: string, newPassword: string): Promise<{ success: boolean; message?: string }> {
    try {

        const response = await fetch(`${API_BASE_URL}/api/auth/reset-password`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ email, newPassword }),
        })


        const rawText = await response.text()

        let data;
        try {
            data = JSON.parse(rawText)
        } catch {
            data = { message: rawText }
        }

        if (response.ok) {
            return { success: true, message: data.message || "Password reset successfully" }
        } else {
            return { success: false, message: data.message || "Failed to reset password" }
        }
    } catch (error) {
        console.error("Reset password error:", error)
        return { success: false, message: "Network error" }
    }
}

async function parseResponse(response: Response): Promise<any> {
    const contentType = response.headers.get("content-type")
    const text = await response.text()


    if (contentType && contentType.includes("application/json")) {
        try {
            return JSON.parse(text)
        } catch {
            return { message: text }
        }
    }
    return { message: text }
}

// Verify current password
export async function verifyCurrentPassword(currentPassword: string): Promise<{ success: boolean; message?: string }> {
    const token = await getAuthToken()
    if (!token) {
        return { success: false, message: "Not authenticated" }
    }

    try {
        const response = await fetch(`${API_BASE_URL}/security/api/auth/verify-current-password`, {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${token}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ currentPassword }),
        })

        if (response.ok) {
            return { success: true, message: "Verified" }
        } else {
            const data = await response.json().catch(() => ({ message: "Incorrect password" }))
            return { success: false, message: data.message || "Incorrect password" }
        }
    } catch (error) {
        console.error("Verify password error:", error)
        return { success: false, message: "Network error" }
    }
}

// Change Password (when logged in)
export async function changePassword(
    currentPassword: string,
    newPassword: string,
    confirmPassword: string
): Promise<{ success: boolean; message?: string }> {
    if (newPassword !== confirmPassword) {
        return { success: false, message: "Passwords do not match" }
    }

    const token = await getAuthToken()
    if (!token) {
        return { success: false, message: "Not authenticated" }
    }

    try {
        const verifyResponse = await fetch(`${API_BASE_URL}/security/api/auth/verify-current-password`, {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${token}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ currentPassword }),
        })

        if (!verifyResponse.ok) {
            return { success: false, message: "Current password is incorrect" }
        }

        const changeResponse = await fetch(`${API_BASE_URL}/security/api/auth/change-password`, {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${token}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ newPassword, confirmPassword }),
        })

        const data = await changeResponse.json()

        if (changeResponse.ok) {
            return { success: true, message: "Password changed successfully" }
        } else {
            return { success: false, message: data.message || "Failed to change password" }
        }
    } catch (error) {
        return { success: false, message: "Network error" }
    }
}

// Get current user info (from backend API)
export async function getCurrentUser() {
    const token = await getAuthToken()
    if (!token) return null

    try {
        const response = await fetch(`${API_BASE_URL}/api/auth/me`, {
            method: "GET",
            headers: {
                "Authorization": `Bearer ${token}`,
                "Content-Type": "application/json",
            },
        })

        if (response.ok) {
            return await response.json()
        }
        return null
    } catch (error) {
        return null
    }
}

// Auto-refresh session middleware for API calls
export async function withAuth<T>(
    apiCall: (token: string) => Promise<T>
): Promise<T | null> {
    const token = await getAuthToken()
    if (!token) {
        redirect('/')
        return null
    }

    try {
        return await apiCall(token)
    } catch (error) {
        console.error("API call failed:", error)
        return null
    }
}

