'use client'
import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()

  const handleLogin = async () => {
    setLoading(true)
    setError('')
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) setError('Email ou mot de passe incorrect')
    else router.push('/dashboard')
    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0F0E0A] via-[#18160F] to-[#2C2A25] flex items-center justify-center p-6">

      <div className="fixed inset-0 pointer-events-none bg-[radial-gradient(ellipse_70%_50%_at_50%_0%,rgba(186,117,23,0.07)_0%,transparent_65%)]" />

      <div className="w-full max-w-[360px] relative">

        {/* Wordmark */}
        <div className="text-center mb-14">
          <div className="flex items-center justify-center gap-5 mb-3.5">
            <div className="w-8 h-px bg-[#BA7517] opacity-60" />
            <h1 className="font-display text-5xl font-light tracking-[0.55em] text-[#F7F4EE] uppercase leading-none">
              Hadiya
            </h1>
            <div className="w-8 h-px bg-[#BA7517] opacity-60" />
          </div>
          <p className="text-[8px] tracking-[0.38em] text-[#BA7517] uppercase font-medium opacity-70">
            Espace salon
          </p>
        </div>

        {/* Form card */}
        <div className="bg-gradient-to-br from-[#2C2A25] to-[#343028] border border-[#BA7517]/20 rounded-3xl p-9 shadow-[0_24px_64px_rgba(0,0,0,0.45)]">
          <div className="flex flex-col gap-5">

            <div>
              <label htmlFor="email" className="block text-[8px] tracking-[0.28em] uppercase text-[#F7F4EE]/35 font-medium mb-2.5">
                Adresse email
              </label>
              <input
                id="email"
                type="email"
                placeholder="votre@email.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleLogin()}
                className="hd-input w-full"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-[8px] tracking-[0.28em] uppercase text-[#F7F4EE]/35 font-medium mb-2.5">
                Mot de passe
              </label>
              <input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={e => setPassword(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleLogin()}
                className="hd-input w-full"
              />
            </div>

            {error && (
              <p className="text-[11px] text-[#E07070] text-center">{error}</p>
            )}

            <button
              onClick={handleLogin}
              disabled={loading}
              className="hd-btn-gold w-full mt-1"
            >
              {loading ? 'Connexion...' : 'Se connecter'}
            </button>

          </div>
        </div>

        <p className="text-center mt-6">
          <Link href="/register" className="text-[10px] tracking-[0.15em] text-[#F7F4EE]/30 hover:text-[#BA7517] transition-colors uppercase">
            Créer un compte
          </Link>
        </p>

        <p className="text-center text-[8px] tracking-[0.28em] text-[#F7F4EE]/20 uppercase mt-4">
          Carte cadeau &amp; fidélité
        </p>

      </div>
    </div>
  )
}
