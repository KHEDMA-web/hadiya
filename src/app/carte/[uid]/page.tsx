'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useParams } from 'next/navigation'

const NIVEAU_CONFIG: Record<string, {
  bg: string; text: string; accent: string; badgeBg: string; label: string
}> = {
  Bronze:  { bg: '#2C2A25',  text: '#F5C4B3', accent: '#D4915E', badgeBg: 'rgba(245,196,179,0.15)', label: 'Bronze' },
  Argent:  { bg: '#5A5854',  text: '#F1EFE8', accent: '#C8C5BE', badgeBg: 'rgba(241,239,232,0.15)', label: 'Argent' },
  Or:      { bg: '#BA7517',  text: '#FFF6E0', accent: '#FAC775', badgeBg: 'rgba(250,199,117,0.2)',  label: 'Or' },
  Platine: { bg: '#2E2A5A',  text: '#CECBF6', accent: '#9C94F0', badgeBg: 'rgba(206,203,246,0.15)', label: 'Platine' },
}

const NEXT_LEVEL: Record<string, string | null> = {
  Bronze: 'Argent', Argent: 'Or', Or: 'Platine', Platine: null
}

const LEVEL_THRESHOLD: Record<string, number> = {
  Bronze: 1000, Argent: 3000, Or: 8000, Platine: 8000
}

const PERKS: Record<string, string[]> = {
  Bronze:  ['Offre anniversaire surprise', 'Points cumulés à chaque visite'],
  Argent:  ['Réduction − 5 % sur tous les soins', 'Points cumulés à chaque visite'],
  Or:      ['Réduction − 10 %', 'Accès prioritaire aux réservations', 'Points cumulés à chaque visite'],
  Platine: ['Réduction − 20 %', 'Soin offert par trimestre', 'Accès prioritaire & exclusif', 'Points cumulés à chaque visite'],
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
      <div className="flex flex-col items-center gap-3">
        <div className="w-8 h-8 rounded-full border-2 border-[#EDE8DE] border-t-[#BA7517] animate-spin" />
        <p className="text-[9px] tracking-[0.25em] uppercase text-[#8A8275]">Chargement</p>
      </div>
    </div>
  )

  if (error) return (
    <div className="min-h-screen bg-[#F7F4EE] flex items-center justify-center p-6">
      <div className="text-center">
        <div className="text-5xl mb-4 opacity-30">✦</div>
        <p className="font-display text-2xl font-light text-[#2C2A25] mb-2">Carte introuvable</p>
        <p className="text-sm text-[#8A8275]">Ce lien n'est associé à aucune carte.</p>
      </div>
    </div>
  )

  const niveau = carte.niveau || 'Bronze'
  const config = NIVEAU_CONFIG[niveau] || NIVEAU_CONFIG.Bronze
  const maxPts = LEVEL_THRESHOLD[niveau]
  const pct = Math.min((carte.points / maxPts) * 100, 100)
  const prochain = NEXT_LEVEL[niveau]
  const perks = PERKS[niveau] || PERKS.Bronze

  return (
    <div className="min-h-screen bg-[#F7F4EE]">
      {/* Card visual */}
      <div
        className="relative overflow-hidden"
        style={{ background: config.bg, minHeight: '280px' }}
      >
        {/* Decorative circles */}
        <div className="absolute -top-16 -right-16 w-64 h-64 rounded-full opacity-[0.07]"
          style={{ background: config.accent }} />
        <div className="absolute -bottom-12 -left-12 w-48 h-48 rounded-full opacity-[0.07]"
          style={{ background: config.accent }} />
        <div className="absolute top-1/2 right-8 w-24 h-24 rounded-full opacity-[0.05]"
          style={{ background: config.text }} />

        <div className="relative z-10 p-8 pt-10 max-w-sm mx-auto">
          {/* Header row */}
          <div className="flex justify-between items-start mb-10">
            <div>
              <p className="text-[9px] tracking-[0.4em] uppercase font-medium mb-1"
                style={{ color: config.text, opacity: 0.5 }}>
                HADIYA
              </p>
              <p className="text-xs tracking-[0.15em]" style={{ color: config.text, opacity: 0.7 }}>
                Carte membre
              </p>
            </div>
            <span
              className="text-[9px] font-medium px-3 py-1.5 rounded-full tracking-[0.15em] uppercase"
              style={{ background: config.badgeBg, color: config.accent, border: `1px solid ${config.accent}40` }}
            >
              {config.label}
            </span>
          </div>

          {/* Name */}
          <div className="mb-8">
            <p className="font-display text-4xl font-light leading-tight" style={{ color: config.text }}>
              {carte.clients?.prenom}
            </p>
            <p className="font-display text-4xl font-light leading-tight" style={{ color: config.text }}>
              {carte.clients?.nom}
            </p>
            <p className="text-[10px] tracking-[0.15em] mt-3 opacity-40" style={{ color: config.text }}>
              Membre depuis {new Date(carte.created_at).toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })}
            </p>
          </div>

          {/* Balance & Points */}
          <div className="flex justify-between items-end">
            <div>
              <p className="text-[9px] tracking-[0.25em] uppercase mb-1.5" style={{ color: config.text, opacity: 0.4 }}>
                Solde
              </p>
              <p className="font-display text-3xl font-light" style={{ color: config.accent }}>
                {carte.solde?.toLocaleString('fr-FR')}
                <span className="text-sm font-sans opacity-60 ml-1">DA</span>
              </p>
            </div>
            <div className="text-right">
              <p className="text-[9px] tracking-[0.25em] uppercase mb-1.5" style={{ color: config.text, opacity: 0.4 }}>
                Points
              </p>
              <p className="font-display text-3xl font-light" style={{ color: config.text }}>
                {carte.points}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Content below card */}
      <div className="p-5 max-w-sm mx-auto flex flex-col gap-4">

        {/* Progress */}
        {prochain && (
          <div className="bg-white rounded-3xl border border-[#EDE8DE] shadow-[0_2px_16px_rgba(44,42,37,0.06)] p-6">
            <div className="flex justify-between items-center mb-3">
              <p className="text-[9px] tracking-[0.2em] uppercase text-[#8A8275] font-medium">
                Vers {prochain}
              </p>
              <p className="text-[10px] text-[#8A8275]">{carte.points} / {maxPts} pts</p>
            </div>
            <div className="h-1.5 bg-[#F7F4EE] rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-700"
                style={{ width: `${pct}%`, background: config.bg }}
              />
            </div>
            <p className="text-[10px] text-[#8A8275] mt-3">
              Encore {Math.max(maxPts - carte.points, 0).toLocaleString('fr-FR')} points pour atteindre {prochain}
            </p>
          </div>
        )}

        {/* Message */}
        {carte.message_perso && (
          <div className="bg-white rounded-3xl border border-[#EDE8DE] shadow-[0_2px_16px_rgba(44,42,37,0.06)] p-6 text-center">
            <div className="flex items-center justify-center gap-3 mb-4">
              <div className="h-px w-8 bg-[#BA7517] opacity-30" />
              <span className="text-[9px] tracking-[0.3em] uppercase text-[#BA7517] opacity-60 font-medium">Message</span>
              <div className="h-px w-8 bg-[#BA7517] opacity-30" />
            </div>
            <p className="font-display text-lg font-light text-[#2C2A25] italic leading-relaxed">
              &ldquo;{carte.message_perso}&rdquo;
            </p>
            {carte.offert_par && (
              <p className="text-[10px] text-[#8A8275] mt-3 tracking-wider">— {carte.offert_par}</p>
            )}
          </div>
        )}

        {/* Expiration */}
        {carte.date_expiration && (
          <div className="rounded-2xl p-4 text-center"
            style={{ background: 'rgba(186,117,23,0.06)', border: '1px solid rgba(186,117,23,0.2)' }}>
            <p className="text-[10px] tracking-[0.15em] text-[#BA7517]">
              Valable jusqu'au{' '}
              {new Date(carte.date_expiration).toLocaleDateString('fr-FR', {
                day: 'numeric', month: 'long', year: 'numeric'
              })}
            </p>
          </div>
        )}

        {/* Perks */}
        <div className="bg-white rounded-3xl border border-[#EDE8DE] shadow-[0_2px_16px_rgba(44,42,37,0.06)] p-6">
          <p className="text-[9px] font-medium uppercase tracking-[0.25em] text-[#8A8275] mb-4">Vos avantages</p>
          <div className="flex flex-col gap-3">
            {perks.map((perk, i) => (
              <div key={i} className="flex items-start gap-3">
                <div
                  className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5"
                  style={{ background: config.bg + '15', color: config.bg }}
                >
                  <span className="text-[9px]">✦</span>
                </div>
                <p className="text-sm text-[#2C2A25] leading-relaxed">{perk}</p>
              </div>
            ))}
          </div>
        </div>

        <p className="text-center text-[9px] tracking-[0.3em] text-[#8A8275] uppercase pb-6 opacity-40">
          Hadiya · Carte digitale
        </p>
      </div>
    </div>
  )
}
