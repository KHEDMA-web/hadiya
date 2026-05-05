'use client'
import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

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
    if (error) {
      setError('Email ou mot de passe incorrect')
    } else {
      router.push('/dashboard')
    }
    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-[#F7F4EE] flex items-center justify-center">
      <div className="bg-white border border-[#D4CBBA] rounded-2xl p-8 w-full max-w-sm shadow-sm">
        <h1 className="text-2xl font-medium text-[#2C2A25] mb-1">Hadiya</h1>
        <p className="text-sm text-[#8A8275] mb-8">Espace salon — connexion</p>
        <div className="flex flex-col gap-4">
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            className="border border-[#D4CBBA] rounded-xl px-4 py-3 text-sm text-[#2C2A25] outline-none focus:border-[#2C2A25] bg-[#F7F4EE]"
          />
          <input
            type="password"
            placeholder="Mot de passe"
            value={password}
            onChange={e => setPassword(e.target.value)}
            className="border border-[#D4CBBA] rounded-xl px-4 py-3 text-sm text-[#2C2A25] outline-none focus:border-[#2C2A25] bg-[#F7F4EE]"
          />
          {error && <p className="text-red-500 text-xs">{error}</p>}
          <button
            onClick={handleLogin}
            disabled={loading}
            className="bg-[#2C2A25] text-[#F7F4EE] rounded-xl py-3 text-sm font-medium hover:opacity-90 transition disabled:opacity-50"
          >
            {loading ? 'Connexion...' : 'Se connecter'}
          </button>
        </div>
      </div>
    </div>
  )
}
