import { NextRequest, NextResponse } from 'next/server';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { userId, password } = body;

        // Forward to backend API
        const response = await fetch(`${API_BASE_URL}/security/api/auth/login`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ userId, password }),
        });

        const data = await response.json();

        if (!response.ok) {
            if (response.status === 423) {
                return NextResponse.json(
                    { 
                        success: false, 
                        message: `Account locked until: ${new Date(data.lockedUntil).toLocaleString()}`
                    },
                    { status: 423 }
                );
            }
            return NextResponse.json(
                { success: false, message: data.message || "Invalid credentials" },
                { status: response.status }
            );
        }

        if (!data.token) {
            return NextResponse.json(
                { success: false, message: "Invalid server response" },
                { status: 500 }
            );
        }

        // Create response with user data
        const nextResponse = NextResponse.json({
            success: true,
            token: data.token,
            userId: data.userId,
            role: data.role,
            name: data.name,
            email: data.email,
            status: data.status,
        });

        // Set HTTP-only cookie
        nextResponse.cookies.set({
            name: 'auth_session',
            value: JSON.stringify({
                token: data.token,
                userId: data.userId,
                expiresAt: Date.now() + (60 * 60 * 1000) // 1 hour
            }),
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            path: '/',
            maxAge: 60 * 60, // 1 hour
        });

        return nextResponse;

    } catch (error) {
        console.error("Login error:", error);
        return NextResponse.json(
            { success: false, message: "Network error" },
            { status: 500 }
        );
    }
}

// Get session
export async function GET(request: NextRequest) {
    try {
        const sessionCookie = request.cookies.get('auth_session');

        if (!sessionCookie) {
            return NextResponse.json({ session: null }, { status: 200 });
        }

        try {
            const sessionData = JSON.parse(sessionCookie.value);
            
            // Check expiration
            if (Date.now() >= sessionData.expiresAt) {
                const response = NextResponse.json({ session: null }, { status: 200 });
                response.cookies.delete('auth_session');
                return response;
            }

            return NextResponse.json({ session: sessionData }, { status: 200 });
        } catch {
            return NextResponse.json({ session: null }, { status: 200 });
        }
    } catch (error) {
        return NextResponse.json({ session: null }, { status: 200 });
    }
}

// Logout
export async function DELETE(request: NextRequest) {
    try {
        const response = NextResponse.json({ success: true });
        response.cookies.delete('auth_session');
        return response;
    } catch (error) {
        return NextResponse.json({ success: false }, { status: 500 });
    }
}