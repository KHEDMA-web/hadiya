import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { createClient } from '@supabase/supabase-js'

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

  // Récupère le token depuis le cookie Supabase
  const cookieHeader = request.headers.get('cookie') || ''
  const cookies = Object.fromEntries(
    cookieHeader.split(';').map(c => {
      const [k, ...v] = c.trim().split('=')
      return [k, v.join('=')]
    })
  )

  // Cherche le token d'accès Supabase dans les cookies
  const tokenKey = Object.keys(cookies).find(k => k.includes('auth-token') || k.includes('access_token'))
  const accessToken = tokenKey ? cookies[tokenKey] : null

  // Si pas de token et route dashboard → redirect login
  if (!accessToken && path.startsWith('/dashboard')) {
    // On laisse passer — la page elle-même vérifie la session
    return NextResponse.next()
  }

  // Vérifie les permissions via Supabase directement
  if (accessToken && path.startsWith('/dashboard')) {
    try {
      const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
          global: { headers: { Authorization: `Bearer ${accessToken}` } }
        }
      )

      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return NextResponse.next()

      // Vérifie si proprio
      const { data: salon } = await supabase
        .from('salons')
        .select('owner_id')
        .eq('email', user.email || '')
        .single()

      if (salon?.owner_id === user.id) return NextResponse.next()

      // Vérifie employé
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
      return NextResponse.next()
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/dashboard/:path*', '/login'],
}
