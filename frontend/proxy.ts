import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { getSession } from '@/app/actions/auth'

export async function proxy(request: NextRequest) {
    const path = request.nextUrl.pathname
    
    // Your only two routes
    const isLoginPage = path === '/'
    const isDashboardPage = path === '/dashboard'
    
    // Get session
    const session = await getSession()
    const isAuthenticated = !!session
    
    // Redirect to login if trying to access dashboard without session
    if (isDashboardPage && !isAuthenticated) {
        return NextResponse.redirect(new URL('/', request.url))
    }
    
    // Redirect to dashboard if already logged in and trying to access login page
    if (isLoginPage && isAuthenticated) {
        return NextResponse.redirect(new URL('/dashboard', request.url))
    }
    
    return NextResponse.next()
}

export const config = {
    matcher: ['/', '/dashboard'],
}