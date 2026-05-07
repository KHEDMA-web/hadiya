'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useParams } from 'next/navigation'

const NIVEAU_CONFIG: Record<string, {
  bg: string; gradTo: string; text: string; accent: string; badgeBg: string; label: string
}> = {
  Bronze:  { bg: '#2C2A25', gradTo: '#3D3228', text: '#F5C4B3', accent: '#D4915E', badgeBg: 'rgba(212,145,94,0.18)',  label: 'Bronze'  },
  Argent:  { bg: '#4A4845', gradTo: '#5E5C58', text: '#F1EFE8', accent: '#C8C5BE', badgeBg: 'rgba(200,197,190,0.18)', label: 'Argent'  },
  Or:      { bg: '#BA7517', gradTo: '#D4911F', text: '#FFF6E0', accent: '#FAC775', badgeBg: 'rgba(250,199,117,0.25)', label: 'Or'      },
  Platine: { bg: '#2E2A5A', gradTo: '#3D3870', text: '#CECBF6', accent: '#9C94F0', badgeBg: 'rgba(156,148,240,0.2)',  label: 'Platine' },
}

const NEXT_LEVEL: Record<string, string | null> = {
  Bronze: 'Argent', Argent: 'Or', Or: 'Platine', Platine: null,
}

const LEVEL_THRESHOLD: Record<string, number> = {
  Bronze: 1000, Argent: 3000, Or: 8000, Platine: 8000,
}

const PERKS: Record<string, string[]> = {
  Bronze:  ['Offre anniversaire surprise', 'Points cumulés à chaque visite'],
  Argent:  ['Réduction − 5 % sur tous les soins', 'Points cumulés à chaque visite'],
  Or:      ['Réduction − 10 %', 'Accès prioritaire aux réservations', 'Points cumulés à chaque visite'],
  Platine: ['Réduction − 20 %', 'Soin offert par trimestre', 'Accès prioritaire & exclusif', 'Points cumulés à chaque visite'],
}

const serif = '"Cormorant Garamond", "Cormorant", Georgia, serif'
const sans  = 'system-ui, -apple-system, sans-serif'

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
    <div style={{ minHeight: '100vh', background: '#F7F4EE', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <style>{`@keyframes hdSpin { to { transform: rotate(360deg); } }`}</style>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
        <div style={{
          width: 32, height: 32, borderRadius: '50%',
          border: '2px solid rgba(186,117,23,0.2)', borderTopColor: '#BA7517',
          animation: 'hdSpin 0.8s linear infinite',
        }} />
        <p style={{ fontSize: 9, letterSpacing: '0.25em', textTransform: 'uppercase', color: '#8A8275', fontFamily: sans }}>
          Chargement
        </p>
      </div>
    </div>
  )

  if (error) return (
    <div style={{ minHeight: '100vh', background: '#F7F4EE', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: 48, marginBottom: 16, opacity: 0.25, color: '#BA7517' }}>✦</div>
        <p style={{ fontSize: 26, fontWeight: 300, color: '#2C2A25', marginBottom: 8, fontFamily: serif }}>Carte introuvable</p>
        <p style={{ fontSize: 14, color: '#8A8275', fontFamily: sans }}>Ce lien n'est associé à aucune carte.</p>
      </div>
    </div>
  )

  const niveau   = carte.niveau || 'Bronze'
  const cfg      = NIVEAU_CONFIG[niveau] || NIVEAU_CONFIG.Bronze
  const maxPts   = LEVEL_THRESHOLD[niveau]
  const pct      = Math.min((carte.points / maxPts) * 100, 100)
  const prochain = NEXT_LEVEL[niveau]
  const perks    = PERKS[niveau] || PERKS.Bronze

  return (
    <div style={{ minHeight: '100vh', background: '#F7F4EE', fontFamily: sans }}>

      {/* ── Carte visuelle ── */}
      <div style={{
        background: `linear-gradient(145deg, ${cfg.bg} 0%, ${cfg.gradTo} 100%)`,
        minHeight: 300,
        position: 'relative',
        overflow: 'hidden',
      }}>
        {/* Cercles décoratifs */}
        <div style={{
          position: 'absolute', top: -64, right: -64,
          width: 256, height: 256, borderRadius: '50%',
          background: cfg.accent, opacity: 0.09, pointerEvents: 'none',
        }} />
        <div style={{
          position: 'absolute', bottom: -48, left: -48,
          width: 192, height: 192, borderRadius: '50%',
          background: cfg.accent, opacity: 0.06, pointerEvents: 'none',
        }} />
        <div style={{
          position: 'absolute', top: '40%', right: 32,
          width: 96, height: 96, borderRadius: '50%',
          background: cfg.text, opacity: 0.04, pointerEvents: 'none',
        }} />

        <div style={{ position: 'relative', zIndex: 1, padding: '40px 28px 36px', maxWidth: 420, margin: '0 auto' }}>

          {/* Top : logo + badge */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 40 }}>
            <div>
              <p style={{ fontSize: 9, letterSpacing: '0.45em', textTransform: 'uppercase', color: cfg.text, opacity: 0.5, margin: 0, fontFamily: sans }}>
                HADIYA
              </p>
              <p style={{ fontSize: 12, letterSpacing: '0.15em', color: cfg.text, opacity: 0.65, margin: '4px 0 0', fontFamily: sans }}>
                Carte membre
              </p>
            </div>
            <span style={{
              fontSize: 9, fontWeight: 600, padding: '6px 14px', borderRadius: 999,
              letterSpacing: '0.15em', textTransform: 'uppercase', fontFamily: sans,
              background: cfg.badgeBg, color: cfg.accent,
              border: `1px solid ${cfg.accent}55`,
            }}>
              {cfg.label}
            </span>
          </div>

          {/* Nom client */}
          <div style={{ marginBottom: 36 }}>
            <p style={{ fontSize: 40, fontWeight: 300, lineHeight: 1.05, color: cfg.text, margin: 0, fontFamily: serif }}>
              {carte.clients?.prenom}
            </p>
            <p style={{ fontSize: 40, fontWeight: 300, lineHeight: 1.05, color: cfg.text, margin: 0, fontFamily: serif }}>
              {carte.clients?.nom}
            </p>
            <p style={{ fontSize: 10, letterSpacing: '0.15em', marginTop: 12, color: cfg.text, opacity: 0.35, fontFamily: sans }}>
              Membre depuis{' '}
              {new Date(carte.created_at).toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })}
            </p>
          </div>

          {/* Solde + Points */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
            <div>
              <p style={{ fontSize: 9, letterSpacing: '0.25em', textTransform: 'uppercase', color: cfg.text, opacity: 0.4, margin: '0 0 6px', fontFamily: sans }}>
                Solde
              </p>
              <p style={{ fontSize: 34, fontWeight: 300, color: cfg.accent, margin: 0, fontFamily: serif }}>
                {carte.solde?.toLocaleString('fr-FR')}
                <span style={{ fontSize: 13, opacity: 0.65, marginLeft: 6, fontFamily: sans }}>DA</span>
              </p>
            </div>
            <div style={{ textAlign: 'right' }}>
              <p style={{ fontSize: 9, letterSpacing: '0.25em', textTransform: 'uppercase', color: cfg.text, opacity: 0.4, margin: '0 0 6px', fontFamily: sans }}>
                Points
              </p>
              <p style={{ fontSize: 34, fontWeight: 300, color: cfg.text, margin: 0, fontFamily: serif }}>
                {carte.points?.toLocaleString('fr-FR')}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* ── Contenu bas ── */}
      <div style={{ padding: '20px 16px', maxWidth: 420, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 14 }}>

        {/* Progression niveau */}
        {prochain && (
          <div style={{
            background: 'white', borderRadius: 24,
            border: '1px solid #EDE8DE',
            boxShadow: '0 2px 16px rgba(44,42,37,0.06)',
            padding: 24,
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <p style={{ fontSize: 9, letterSpacing: '0.2em', textTransform: 'uppercase', color: '#8A8275', fontWeight: 500, margin: 0 }}>
                Vers {prochain}
              </p>
              <p style={{ fontSize: 10, color: '#8A8275', margin: 0 }}>
                {carte.points?.toLocaleString('fr-FR')} / {maxPts.toLocaleString('fr-FR')} pts
              </p>
            </div>
            <div style={{ height: 6, background: '#F0EDE5', borderRadius: 999, overflow: 'hidden' }}>
              <div style={{
                height: '100%', borderRadius: 999,
                background: `linear-gradient(90deg, ${cfg.bg}, ${cfg.accent})`,
                width: `${pct}%`,
                transition: 'width 0.7s ease',
              }} />
            </div>
            <p style={{ fontSize: 10, color: '#8A8275', marginTop: 12, marginBottom: 0 }}>
              Encore{' '}
              {Math.max(maxPts - (carte.points || 0), 0).toLocaleString('fr-FR')} points pour atteindre {prochain}
            </p>
          </div>
        )}

        {/* Message personnalisé */}
        {carte.message_perso && (
          <div style={{
            background: 'white', borderRadius: 24,
            border: '1px solid #EDE8DE',
            boxShadow: '0 2px 16px rgba(44,42,37,0.06)',
            padding: 24, textAlign: 'center',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12, marginBottom: 16 }}>
              <div style={{ height: 1, width: 32, background: '#BA7517', opacity: 0.3 }} />
              <span style={{ fontSize: 9, letterSpacing: '0.3em', textTransform: 'uppercase', color: '#BA7517', opacity: 0.7, fontWeight: 500 }}>
                Message
              </span>
              <div style={{ height: 1, width: 32, background: '#BA7517', opacity: 0.3 }} />
            </div>
            <p style={{ fontSize: 19, fontWeight: 300, color: '#2C2A25', fontStyle: 'italic', lineHeight: 1.65, margin: 0, fontFamily: serif }}>
              &ldquo;{carte.message_perso}&rdquo;
            </p>
            {carte.offert_par && (
              <p style={{ fontSize: 10, color: '#8A8275', marginTop: 12, letterSpacing: '0.1em', marginBottom: 0 }}>
                — {carte.offert_par}
              </p>
            )}
          </div>
        )}

        {/* Expiration */}
        {carte.date_expiration && (
          <div style={{
            borderRadius: 16, padding: '14px 20px', textAlign: 'center',
            background: 'rgba(186,117,23,0.06)', border: '1px solid rgba(186,117,23,0.2)',
          }}>
            <p style={{ fontSize: 10, letterSpacing: '0.15em', color: '#BA7517', margin: 0 }}>
              Valable jusqu'au{' '}
              {new Date(carte.date_expiration).toLocaleDateString('fr-FR', {
                day: 'numeric', month: 'long', year: 'numeric',
              })}
            </p>
          </div>
        )}

        {/* Avantages */}
        <div style={{
          background: 'white', borderRadius: 24,
          border: '1px solid #EDE8DE',
          boxShadow: '0 2px 16px rgba(44,42,37,0.06)',
          padding: 24,
        }}>
          <p style={{ fontSize: 9, fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.25em', color: '#8A8275', marginBottom: 18, marginTop: 0 }}>
            Vos avantages
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {perks.map((perk, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                <div style={{
                  width: 22, height: 22, borderRadius: '50%',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  flexShrink: 0, marginTop: 1,
                  background: cfg.badgeBg, color: cfg.accent,
                  fontSize: 9,
                }}>
                  ✦
                </div>
                <p style={{ fontSize: 14, color: '#2C2A25', lineHeight: 1.55, margin: 0 }}>{perk}</p>
              </div>
            ))}
          </div>
        </div>

        <p style={{
          textAlign: 'center', fontSize: 9, letterSpacing: '0.3em',
          color: '#8A8275', textTransform: 'uppercase', paddingBottom: 28,
          opacity: 0.4, margin: 0,
        }}>
          Hadiya · Carte digitale
        </p>
      </div>
    </div>
  )
}
