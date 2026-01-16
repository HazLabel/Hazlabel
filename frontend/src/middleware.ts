import { type NextRequest, NextResponse } from 'next/server'
import { updateSession } from '@/utils/supabase/middleware'

export async function middleware(request: NextRequest) {
    const { nextUrl } = request
    const { supabaseResponse, user } = await updateSession(request)

    // Define protected dashboard routes
    const isProtectedRoute =
        nextUrl.pathname.startsWith('/inventory') ||
        nextUrl.pathname.startsWith('/logs') ||
        nextUrl.pathname.startsWith('/print') ||
        nextUrl.pathname.startsWith('/settings')

    // Redirect unauthenticated users to login
    if (isProtectedRoute && !user) {
        const loginUrl = new URL('/login', request.url)
        loginUrl.searchParams.set('redirect', nextUrl.pathname)
        return NextResponse.redirect(loginUrl)
    }

    // Redirect authenticated users away from login page
    if (nextUrl.pathname === '/login' && user) {
        return NextResponse.redirect(new URL('/inventory', request.url))
    }


    return supabaseResponse
}

export const config = {
    matcher: [
        /*
         * Match all request paths except for the ones starting with:
         * - _next/static (static files)
         * - _next/image (image optimization files)
         * - favicon.ico (favicon file)
         * Feel free to modify this pattern to include more paths.
         */
        '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
    ],
}
