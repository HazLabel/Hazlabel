import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'

function redirectTo(request: Request, origin: string, path: string) {
    const forwardedHost = request.headers.get('x-forwarded-host')
    const isLocalEnv = process.env.NODE_ENV === 'development'
    if (isLocalEnv) {
        return NextResponse.redirect(`${origin}${path}`)
    } else if (forwardedHost) {
        return NextResponse.redirect(`https://${forwardedHost}${path}`)
    } else {
        return NextResponse.redirect(`${origin}${path}`)
    }
}

export async function GET(request: Request) {
    const { searchParams, origin } = new URL(request.url)
    const code = searchParams.get('code')
    const type = searchParams.get('type')

    // Determine redirect based on callback type
    const next = type === 'email_change' ? '/auth/email-changed' : '/auth/verified'

    if (code) {
        const supabase = await createClient()
        const { error } = await supabase.auth.exchangeCodeForSession(code)
        if (!error) {
            return redirectTo(request, origin, next)
        } else {
            console.error('[Auth Callback] Code exchange failed:', error.message)
            // For email changes, Supabase's /verify endpoint already applies the
            // change before redirecting here. The code exchange can fail when the
            // verification link opens in a new tab (no PKCE code verifier cookie).
            // Still show the confirmation page since the change went through.
            if (type === 'email_change') {
                return redirectTo(request, origin, next)
            }
        }
    }

    // return the user to an error page with instructions
    return NextResponse.redirect(`${origin}/auth/auth-error`)
}
