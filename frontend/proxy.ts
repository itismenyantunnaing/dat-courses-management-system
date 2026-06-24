// middleware.ts
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { getSession } from '@/app/actions/auth'

export async function proxy(request: NextRequest) {
    const path = request.nextUrl.pathname
    
    // Allow public uploads to bypass authentication
    if (path.startsWith('/uploads/')) {
        return NextResponse.next()
    }
    
    // Allow API routes
    if (path.startsWith('/api/')) {
        return NextResponse.next()
    }
    
    // Your existing routes
    const isLoginPage = path === '/'
    const isDashboardPage = path === '/dashboard'
    
    const session = await getSession()
    const isAuthenticated = !!session
    
    if (isDashboardPage && !isAuthenticated) {
        return NextResponse.redirect(new URL('/', request.url))
    }
    
    if (isLoginPage && isAuthenticated) {
        return NextResponse.redirect(new URL('/dashboard', request.url))
    }
    
    return NextResponse.next()
}

export const config = {
    matcher: ['/', '/dashboard', '/uploads/:path*', '/api/:path*'],
}