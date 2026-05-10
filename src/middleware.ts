import { createServerClient } from '@supabase/ssr'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  const response = NextResponse.next()

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return request.cookies.getAll() },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            request.cookies.set(name, value)
            response.cookies.set(name, value, options)
          })
        },
      },
    }
  )

  const { data: { session } } = await supabase.auth.getSession()

  const path = request.nextUrl.pathname

  // Redirige vers login si pas connecté
  if (!session && path.startsWith('/dashboard')) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  // Redirige vers dashboard si déjà connecté
  if (session && path === '/login') {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  // Vérifie les permissions pour les employés
  if (session && path.startsWith('/dashboard')) {
    const userEmail = session.user.email || ''

    // Vérifie si c'est le propriétaire — accès total
    const { data: salon } = await supabase
      .from('salons')
      .select('owner_id')
      .eq('email', userEmail)
      .single()

    if (salon?.owner_id === session.user.id) {
      return response // Propriétaire → accès total
    }

    // C'est un employé — vérifie ses permissions
    const { data: employe } = await supabase
      .from('employes')
      .select('permissions, actif')
      .eq('user_id', session.user.id)
      .single()

    if (!employe || !employe.actif) {
      return NextResponse.redirect(new URL('/login', request.url))
    }

    const perms = employe.permissions as Record<string, boolean>

    // Mapping route → permission
    const routePerms: Record<string, string> = {
      '/dashboard/caisse':       'caisse',
      '/dashboard/scanner':      'scanner',
      '/dashboard/clients':      'clients',
      '/dashboard/recharge':     'recharge',
      '/dashboard/produits':     'produits',
      '/dashboard/statistiques': 'statistiques',
      '/dashboard/transactions': 'transactions',
      '/dashboard/admin':        'admin',
    }

    for (const [route, perm] of Object.entries(routePerms)) {
      if (path.startsWith(route) && !perms[perm]) {
        return NextResponse.redirect(new URL('/dashboard', request.url))
      }
    }
  }

  return response
}

export const config = {
  matcher: ['/dashboard/:path*', '/login'],
}
