'use client'
import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

const WILAYAS = [
  '01 - Adrar', '02 - Chlef', '03 - Laghouat', '04 - Oum El Bouaghi',
  '05 - Batna', '06 - Béjaïa', '07 - Biskra', '08 - Béchar',
  '09 - Blida', '10 - Bouira', '11 - Tamanrasset', '12 - Tébessa',
  '13 - Tlemcen', '14 - Tiaret', '15 - Tizi Ouzou', '16 - Alger',
  '17 - Djelfa', '18 - Jijel', '19 - Sétif', '20 - Saïda',
  '21 - Skikda', '22 - Sidi Bel Abbès', '23 - Annaba', '24 - Guelma',
  '25 - Constantine', '26 - Médéa', '27 - Mostaganem', "28 - M'Sila",
  '29 - Mascara', '30 - Ouargla', '31 - Oran', '32 - El Bayadh',
  '33 - Illizi', '34 - Bordj Bou Arréridj', '35 - Boumerdès', '36 - El Tarf',
  '37 - Tindouf', '38 - Tissemsilt', '39 - El Oued', '40 - Khenchela',
  '41 - Souk Ahras', '42 - Tipaza', '43 - Mila', '44 - Aïn Defla',
  '45 - Naâma', '46 - Aïn Témouchent', '47 - Ghardaïa', '48 - Relizane',
  '49 - Timimoun', '50 - Bordj Badji Mokhtar', '51 - Ouled Djellal',
  '52 - Béni Abbès', '53 - In Salah', '54 - In Guezzam',
  '55 - Touggourt', '56 - Djanet', "57 - El M'Ghair", '58 - El Meniaa',
]

export default function RegisterPage() {
  const [nom, setNom] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [telephone, setTelephone] = useState('')
  const [wilaya, setWilaya] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()

  const handleRegister = async () => {
    if (!nom || !email || !password) { setError('Nom, email et mot de passe requis'); return }
    if (password.length < 6) { setError('Mot de passe minimum 6 caractères'); return }
    setLoading(true)
    setError('')
    const { data: authData, error: authError } = await supabase.auth.signUp({ email, password })
    if (authError) { setError(authError.message); setLoading(false); return }
    const userId = authData.user?.id
    if (userId) {
      await supabase.from('salons').insert({ nom, email, telephone, wilaya, user_id: userId })
    }
    router.push('/dashboard')
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0F0E0A] via-[#18160F] to-[#2C2A25] flex items-center justify-center p-6">
      <div className="fixed inset-0 pointer-events-none bg-[radial-gradient(ellipse_70%_50%_at_50%_0%,rgba(186,117,23,0.07)_0%,transparent_65%)]" />

      <div className="w-full max-w-[360px] relative">

        {/* Wordmark */}
        <div className="text-center mb-10">
          <div className="flex items-center justify-center gap-5 mb-3.5">
            <div className="w-8 h-px bg-[#BA7517] opacity-60" />
            <h1 className="font-display text-5xl font-light tracking-[0.55em] text-[#F7F4EE] uppercase leading-none">
              Hadiya
            </h1>
            <div className="w-8 h-px bg-[#BA7517] opacity-60" />
          </div>
          <p className="text-[8px] tracking-[0.38em] text-[#BA7517] uppercase font-medium opacity-70">
            Créer votre espace
          </p>
        </div>

        {/* Form card */}
        <div className="bg-gradient-to-br from-[#2C2A25] to-[#343028] border border-[#BA7517]/20 rounded-3xl p-9 shadow-[0_24px_64px_rgba(0,0,0,0.45)]">
          <div className="flex flex-col gap-5">

            <div>
              <label htmlFor="nom" className="block text-[8px] tracking-[0.28em] uppercase text-[#F7F4EE]/35 font-medium mb-2.5">
                Nom du salon *
              </label>
              <input
                id="nom"
                type="text"
                placeholder="Spa Élégance..."
                value={nom}
                onChange={e => setNom(e.target.value)}
                className="hd-input w-full"
              />
            </div>

            <div>
              <label htmlFor="reg-email" className="block text-[8px] tracking-[0.28em] uppercase text-[#F7F4EE]/35 font-medium mb-2.5">
                Email *
              </label>
              <input
                id="reg-email"
                type="email"
                placeholder="votre@email.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="hd-input w-full"
              />
            </div>

            <div>
              <label htmlFor="reg-password" className="block text-[8px] tracking-[0.28em] uppercase text-[#F7F4EE]/35 font-medium mb-2.5">
                Mot de passe *{' '}
                <span className="opacity-50">(min 6 caractères)</span>
              </label>
              <input
                id="reg-password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={e => setPassword(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleRegister()}
                className="hd-input w-full"
              />
            </div>

            <div>
              <label htmlFor="telephone" className="block text-[8px] tracking-[0.28em] uppercase text-[#F7F4EE]/35 font-medium mb-2.5">
                Téléphone
              </label>
              <input
                id="telephone"
                type="tel"
                placeholder="0550 00 00 00"
                value={telephone}
                onChange={e => setTelephone(e.target.value)}
                className="hd-input w-full"
              />
            </div>

            <div>
              <label htmlFor="wilaya" className="block text-[8px] tracking-[0.28em] uppercase text-[#F7F4EE]/35 font-medium mb-2.5">
                Wilaya
              </label>
              <select
                id="wilaya"
                value={wilaya}
                onChange={e => setWilaya(e.target.value)}
                className="hd-input w-full cursor-pointer"
              >
                <option value="">Sélectionner...</option>
                {WILAYAS.map(w => <option key={w} value={w}>{w}</option>)}
              </select>
            </div>

            {error && (
              <p className="text-[11px] text-[#E07070] text-center">{error}</p>
            )}

            <button
              onClick={handleRegister}
              disabled={loading}
              className="hd-btn-gold w-full mt-1"
            >
              {loading ? 'Création...' : 'Créer mon espace'}
            </button>

          </div>
        </div>

        <p className="text-center mt-6">
          <Link href="/login" className="text-[10px] tracking-[0.15em] text-[#F7F4EE]/30 hover:text-[#BA7517] transition-colors uppercase">
            Déjà un compte ? Se connecter
          </Link>
        </p>

        <p className="text-center text-[8px] tracking-[0.28em] text-[#F7F4EE]/20 uppercase mt-4">
          Carte cadeau &amp; fidélité
        </p>

      </div>
    </div>
  )
}
