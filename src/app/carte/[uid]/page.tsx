'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useParams } from 'next/navigation'

const niveauConfig: Record<string, { bg: string; text: string; light: string; label: string }> = {
  Bronze:  { bg: '#2C2A25', text: '#F5C4B3', light: '#FAECE7', label: 'Bronze' },
  Argent:  { bg: '#888780', text: '#F1EFE8', light: '#F1EFE8', label: 'Argent' },
  Or:      { bg: '#BA7517', text: '#FAC775', light: '#FAEEDA', label: 'Or ✦' },
  Platine: { bg: '#3C3489', text: '#CECBF6', light: '#EEEDFE', label: 'Platine ✦✦' },
}

export default function CartePage() {
  const { uid } = useParams()
  const [carte, setCarte] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!uid) return
    supabase
      .from('cartes')
      .select('*, clients(*)')
      .eq('uid_rfid', uid)
      .single()
      .then(({ data, error }) => {
        if (error || !data) setError('Carte introuvable')
        else setCarte(data)
        setLoading(false)
      })
  }, [uid])

  if (loading) return (
    <div className="min-h-screen bg-[#F7F4EE] flex items-center justify-center">
      <p className="text-sm text-[#8A8275]">Chargement...</p>
    </div>
  )

  if (error) return (
    <div className="min-h-screen bg-[#F7F4EE] flex items-center justify-center">
      <div className="text-center">
        <p className="text-4xl mb-4">🎁</p>
        <p className="text-sm text-[#8A8275]">Carte introuvable</p>
      </div>
    </div>
  )

  const niveau = carte.niveau || 'Bronze'
  const config = niveauConfig[niveau] || niveauConfig.Bronze
  const pctVers = { Bronze: 1000, Argent: 3000, Or: 8000, Platine: 8000 }
  const maxPts = pctVers[niveau as keyof typeof pctVers]
  const pct = Math.min((carte.points / maxPts) * 100, 100)
  const prochainNiveau = { Bronze: 'Argent', Argent: 'Or', Or: 'Platine', Platine: null }
  const prochain = prochainNiveau[niveau as keyof typeof prochainNiveau]

  return (
    <div className="min-h-screen bg-[#F7F4EE] flex flex-col items-center justify-start p-4 pt-8">
      <div className="w-full max-w-sm flex flex-col gap-4">
        <div className="rounded-3xl p-6 relative overflow-hidden" style={{ background: config.bg }}>
          <div className="absolute top-0 right-0 w-40 h-40 rounded-full opacity-10"
            style={{ background: config.text, transform: 'translate(30%, -30%)' }} />
          <div className="absolute bottom-0 left-0 w-28 h-28 rounded-full opacity-10"
            style={{ background: config.text, transform: 'translate(-30%, 30%)' }} />
          <div className="relative z-10">
            <div className="flex justify-between items-start mb-8">
              <div>
                <p className="text-xs font-medium tracking-widest opacity-60" style={{ color: config.text }}>HADIYA</p>
                <p className="text-sm font-medium mt-0.5" style={{ color: config.text }}>Carte membre</p>
              </div>
              <span className="text-xs font-medium px-3 py-1 rounded-full"
                style={{ background: 'rgba(255,255,255,0.15)', color: config.text }}>
                {config.label}
              </span>
            </div>
            <div className="mb-6">
              <p className="text-3xl font-medium" style={{ color: config.text }}>
                {carte.clients?.prenom} {carte.clients?.nom}
              </p>
              <p className="text-xs opacity-50 mt-1" style={{ color: config.text }}>
                Membre depuis {new Date(carte.created_at).toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })}
              </p>
            </div>
            <div className="flex justify-between items-end">
              <div>
                <p className="text-xs opacity-50 mb-1" style={{ color: config.text }}>SOLDE</p>
                <p className="text-2xl font-medium" style={{ color: config.text }}>{carte.solde?.toLocaleString('fr-FR')} DA</p>
              </div>
              <div className="text-right">
                <p className="text-xs opacity-50 mb-1" style={{ color: config.text }}>POINTS</p>
                <p className="text-2xl font-medium" style={{ color: config.text }}>{carte.points}</p>
              </div>
            </div>
          </div>
        </div>
        {prochain && (
          <div className="bg-white border border-[#D4CBBA] rounded-2xl p-5">
            <div className="flex justify-between text-xs text-[#8A8275] mb-2">
              <span>Progression vers {prochain}</span>
              <span>{carte.points} / {maxPts} pts</span>
            </div>
            <div className="h-2 bg-[#F7F4EE] rounded-full overflow-hidden">
              <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: config.bg }} />
            </div>
            <p className="text-xs text-[#8A8275] mt-2">
              Encore {Math.max(maxPts - carte.points, 0)} pts pour passer {prochain}
            </p>
          </div>
        )}

        {carte.message_perso && (
          <div className="bg-white border border-[#D4CBBA] rounded-2xl p-5 text-center">
            <p className="text-xs text-[#8A8275] mb-2">Message</p>
            <p className="text-sm text-[#2C2A25] italic">"{carte.message_perso}"</p>
            {carte.offert_par && <p className="text-xs text-[#8A8275] mt-2">— {carte.offert_par}</p>}
          </div>
        )}

        {carte.date_expiration && (
          <div className="bg-[#FAEEDA] border border-[#FAC775] rounded-2xl p-4 text-center">
            <p className="text-xs text-[#633806]">
              Valable jusqu'au {new Date(carte.date_expiration).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
            </p>
          </div>
        )}

        <div className="bg-white border border-[#D4CBBA] rounded-2xl p-5">
          <p className="text-xs font-medium text-[#8A8275] uppercase tracking-wider mb-3">Vos avantages</p>
          <div className="flex flex-col gap-2">
            {[
              niveau === 'Bronze' && '🎁 Offre anniversaire surprise',
              niveau === 'Argent' && '💆 Réduction -5% sur tous les soins',
              niveau === 'Or' && '⭐ Réduction -10% + accès prioritaire',
              niveau === 'Platine' && '👑 Réduction -20% + soin offert / trimestre',
              '✦ Points cumulés à chaque visite',
            ].filter(Boolean).map((a, i) => (
              <div key={i} className="flex items-center gap-2 text-sm text-[#2C2A25]">
                <span>{a}</span>
              </div>
            ))}
          </div>
        </div>

        <p className="text-center text-xs text-[#8A8275] pb-4">Hadiya · Carte digitale</p>
      </div>
    </div>
  )
}