import { createServerClient } from '@supabase/ssr'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

const ROUTE_PERMS: Record<string, string> = {
  '/dashboard/caisse':       'caisse',
  '/dashboard/scanner':      'scanner',
  '/dashboard/clients':      'clients',
  '/dashboard/recharge':     'recharge',
  '/dashboard/produits':     'produits',
  '/dashboard/statistiques': 'statistiques',
  '/dashboard/transactions': 'transactions',
  '/dashboard/admin':        'admin',
}

export async function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname
  const response = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return request.cookies.getAll() },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()

  // Redirect unauthenticated users away from dashboard (fixes white flash)
  if (!user && path.startsWith('/dashboard')) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  // Skip /login if already logged in
  if (user && path === '/login') {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  // Permission checks for authenticated users
  if (user && path.startsWith('/dashboard')) {
    try {
      const { data: salon } = await supabase
        .from('salons')
        .select('owner_id')
        .eq('email', user.email || '')
        .single()

      if (salon?.owner_id === user.id) return response

      const { data: employe } = await supabase
        .from('employes')
        .select('permissions, actif')
        .eq('user_id', user.id)
        .single()

      if (!employe || !employe.actif) {
        return NextResponse.redirect(new URL('/login', request.url))
      }

      const perms = employe.permissions as Record<string, boolean>

      for (const [route, perm] of Object.entries(ROUTE_PERMS)) {
        if (path.startsWith(route) && !perms[perm]) {
          return NextResponse.redirect(new URL('/dashboard', request.url))
        }
      }
    } catch {
      return response
    }
  }

  return response
}

export const config = {
  matcher: ['/dashboard/:path*', '/login'],
}
