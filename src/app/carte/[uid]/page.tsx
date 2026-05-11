'use client'
import { useEffect, useState, useRef } from 'react'
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
const NEXT_LEVEL: Record<string, string | null> = { Bronze: 'Argent', Argent: 'Or', Or: 'Platine', Platine: null }
const LEVEL_THRESHOLD: Record<string, number> = { Bronze: 1000, Argent: 3000, Or: 8000, Platine: 8000 }
const PERKS: Record<string, string[]> = {
  Bronze:  ['Offre anniversaire surprise', 'Points cumulés à chaque visite'],
  Argent:  ['Réduction − 5 % sur tous les soins', 'Points cumulés à chaque visite'],
  Or:      ['Réduction − 10 %', 'Accès prioritaire aux réservations', 'Points cumulés à chaque visite'],
  Platine: ['Réduction − 20 %', 'Soin offert par trimestre', 'Accès prioritaire & exclusif', 'Points cumulés à chaque visite'],
}

const serif = '"Cormorant Garamond", Georgia, serif'
const sans  = 'system-ui, -apple-system, sans-serif'

export default function CartePage() {
  const { uid } = useParams()
  const [carte, setCarte] = useState<any>(null)
  const [transactions, setTransactions] = useState<any[]>([])
  const [whatsappSalon, setWhatsappSalon] = useState('213555000000')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showInstall, setShowInstall] = useState(false)
  const [showQrFull, setShowQrFull] = useState(false)
  const [showGiftIntro, setShowGiftIntro] = useState(false)
  const deferredPrompt = useRef<any>(null)

  const [platform, setPlatform] = useState<'ios' | 'android' | 'other'>('other')
  useEffect(() => {
    const ua = navigator.userAgent.toLowerCase()
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone
    if (isStandalone) return
    if (/iphone|ipad|ipod/.test(ua)) setPlatform('ios')
    else if (/android/.test(ua)) setPlatform('android')
    setTimeout(() => setShowInstall(true), 1500)
  }, [])

  useEffect(() => {
    const handler = (e: any) => { e.preventDefault(); deferredPrompt.current = e }
    window.addEventListener('beforeinstallprompt', handler)
    return () => window.removeEventListener('beforeinstallprompt', handler)
  }, [])

  useEffect(() => {
    if (!uid) return
    const load = async () => {
      const { data, error } = await supabase
        .from('cartes')
        .select('*, clients(*)')
        .eq('uid_rfid', uid)
        .single()

      if (error || !data) { setError('Carte introuvable'); setLoading(false); return }

      setCarte(data)
      localStorage.setItem('hadiya_last_uid', uid as string)

      // ── Charge le numéro WhatsApp depuis le salon lié ──
      if (data.salon_id) {
        const { data: salonData } = await supabase
          .from('salons')
          .select('telephone, whatsapp')
          .eq('id', data.salon_id)
          .single()

        if (salonData) {
          // Priorité : whatsapp > telephone > défaut
          const numero = salonData.whatsapp || salonData.telephone || ''
          if (numero) {
            // Normalise le numéro : retire +, espaces, tirets
            const clean = numero.replace(/[\s\-\+]/g, '')
            // Si commence par 0, remplace par 213
            const normalized = clean.startsWith('0') ? '213' + clean.slice(1) : clean
            setWhatsappSalon(normalized)
          }
        }
      }

      // Premier scan → animation cadeau
      if (!data.first_opened_at) {
        setShowGiftIntro(true)
        await supabase.from('cartes').update({ first_opened_at: new Date().toISOString() }).eq('id', data.id)
      }

      const { data: tx } = await supabase
        .from('transactions')
        .select('*')
        .eq('carte_id', data.id)
        .order('created_at', { ascending: false })
        .limit(5)
      setTransactions(tx ?? [])
      setLoading(false)
    }
    load()
  }, [uid])

  // ── Realtime : solde live ──
  useEffect(() => {
    if (!carte?.id) return
    const chan = supabase
      .channel(`carte-${carte.id}`)
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'cartes', filter: `id=eq.${carte.id}` },
          (p) => setCarte((c: any) => ({ ...c, ...p.new })))
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'transactions', filter: `carte_id=eq.${carte.id}` },
          (p) => setTransactions((t) => [p.new, ...t].slice(0, 5)))
      .subscribe()
    return () => { supabase.removeChannel(chan) }
  }, [carte?.id])

  const installAndroid = async () => {
    if (!deferredPrompt.current) return
    deferredPrompt.current.prompt()
    deferredPrompt.current = null
    setShowInstall(false)
  }

  if (loading) return (
    <div style={{ minHeight: '100vh', background: '#F7F4EE', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <style>{`@keyframes hdSpin { to { transform: rotate(360deg); } }`}</style>
      <div style={{ width: 32, height: 32, borderRadius: '50%', border: '2px solid rgba(186,117,23,0.2)', borderTopColor: '#BA7517', animation: 'hdSpin 0.8s linear infinite' }} />
    </div>
  )

  if (error) return (
    <div style={{ minHeight: '100vh', background: '#F7F4EE', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: 48, marginBottom: 16, opacity: 0.25, color: '#BA7517' }}>✦</div>
        <p style={{ fontSize: 26, fontWeight: 300, color: '#2C2A25', marginBottom: 8, fontFamily: serif }}>Carte introuvable</p>
      </div>
    </div>
  )

  const niveau   = carte.niveau || 'Bronze'
  const cfg      = NIVEAU_CONFIG[niveau] || NIVEAU_CONFIG.Bronze
  const maxPts   = LEVEL_THRESHOLD[niveau]
  const pct      = Math.min((carte.points / maxPts) * 100, 100)
  const prochain = NEXT_LEVEL[niveau]
  const perks    = PERKS[niveau] || PERKS.Bronze

  const wa = `https://wa.me/${whatsappSalon}?text=${encodeURIComponent(`Bonjour, je souhaite réserver un soin avec ma carte Hadiya (${carte.clients?.prenom} ${carte.clients?.nom}).`)}`

  let expiryWarning: string | null = null
  if (carte.date_expiration) {
    const days = Math.ceil((new Date(carte.date_expiration).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
    if (days > 0 && days <= 30) expiryWarning = `Plus que ${days} jour${days > 1 ? 's' : ''}`
  }

  return (
    <div style={{ minHeight: '100vh', background: '#F7F4EE', fontFamily: sans }}>
      <style>{`
        @keyframes gift-pop { 0% { transform: scale(0.6); opacity: 0; } 60% { transform: scale(1.1); opacity: 1; } 100% { transform: scale(1); opacity: 1; } }
        @keyframes confetti-fall { from { transform: translateY(-20vh) rotate(0); opacity: 1; } to { transform: translateY(120vh) rotate(720deg); opacity: 0; } }
        @keyframes solde-flash { 0%, 100% { transform: scale(1); } 50% { transform: scale(1.06); } }
        @keyframes slide-down { from { transform: translateY(-100%); } to { transform: translateY(0); } }
      `}</style>

      {/* ── Animation cadeau premier scan ── */}
      {showGiftIntro && (
        <div onClick={() => setShowGiftIntro(false)} style={{ position: 'fixed', inset: 0, background: 'rgba(44,42,37,0.96)', zIndex: 100, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
          {[...Array(20)].map((_, i) => (
            <div key={i} style={{
              position: 'absolute', top: 0, left: `${Math.random() * 100}%`,
              width: 8, height: 14, background: ['#BA7517', '#FAC775', '#F7F4EE'][i % 3], borderRadius: 2,
              animation: `confetti-fall ${2 + Math.random() * 1.5}s ease-out ${Math.random() * 0.4}s forwards`,
            }} />
          ))}
          <div style={{ animation: 'gift-pop 0.7s cubic-bezier(0.16,1,0.3,1) both', textAlign: 'center' }}>
            <div style={{ fontSize: 80, marginBottom: 24 }}>🎁</div>
            <p style={{ fontSize: 32, fontWeight: 300, color: '#F7F4EE', fontFamily: serif, margin: '0 0 12px' }}>
              Bonjour {carte.clients?.prenom}
            </p>
            <p style={{ fontSize: 14, color: '#BA7517', letterSpacing: '0.2em', textTransform: 'uppercase', margin: 0 }}>
              Votre carte vous attend
            </p>
            <p style={{ fontSize: 11, color: '#8A8275', marginTop: 32, letterSpacing: '0.15em' }}>Touchez pour découvrir</p>
          </div>
        </div>
      )}

      {/* ── Bandeau "Installer" ── */}
      {showInstall && (platform === 'ios' || platform === 'android') && (
        <div style={{ position: 'sticky', top: 0, zIndex: 50, background: '#2C2A25', color: '#F7F4EE', padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 12, animation: 'slide-down 0.3s ease-out' }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{ fontSize: 13, fontWeight: 500, margin: 0 }}>Ajouter Hadiya à l'écran d'accueil</p>
            <p style={{ fontSize: 11, color: '#BA7517', margin: '2px 0 0' }}>
              {platform === 'ios' ? 'Partager → "Sur l\'écran d\'accueil"' : 'Accès rapide à votre carte'}
            </p>
          </div>
          {platform === 'android' && deferredPrompt.current && (
            <button onClick={installAndroid} style={{ background: '#BA7517', color: 'white', border: 0, borderRadius: 999, padding: '8px 14px', fontSize: 12, fontWeight: 600 }}>
              Installer
            </button>
          )}
          <button onClick={() => setShowInstall(false)} style={{ background: 'transparent', color: '#8A8275', border: 0, fontSize: 20, padding: 4, cursor: 'pointer' }}>×</button>
        </div>
      )}

      {/* ── Carte visuelle ── */}
      <div style={{ background: `linear-gradient(145deg, ${cfg.bg} 0%, ${cfg.gradTo} 100%)`, minHeight: 300, position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: -64, right: -64, width: 256, height: 256, borderRadius: '50%', background: cfg.accent, opacity: 0.09 }} />
        <div style={{ position: 'absolute', bottom: -48, left: -48, width: 192, height: 192, borderRadius: '50%', background: cfg.accent, opacity: 0.06 }} />

        <div style={{ position: 'relative', zIndex: 1, padding: '40px 28px 36px', maxWidth: 420, margin: '0 auto' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 40 }}>
            <div>
              <p style={{ fontSize: 9, letterSpacing: '0.45em', textTransform: 'uppercase', color: cfg.text, opacity: 0.5, margin: 0 }}>HADIYA</p>
              <p style={{ fontSize: 12, letterSpacing: '0.15em', color: cfg.text, opacity: 0.65, margin: '4px 0 0' }}>Carte membre</p>
            </div>
            <span style={{ fontSize: 9, fontWeight: 600, padding: '6px 14px', borderRadius: 999, letterSpacing: '0.15em', textTransform: 'uppercase', background: cfg.badgeBg, color: cfg.accent, border: `1px solid ${cfg.accent}55` }}>
              {cfg.label}
            </span>
          </div>

          <div style={{ marginBottom: 36 }}>
            <p style={{ fontSize: 40, fontWeight: 300, lineHeight: 1.05, color: cfg.text, margin: 0, fontFamily: serif }}>{carte.clients?.prenom}</p>
            <p style={{ fontSize: 40, fontWeight: 300, lineHeight: 1.05, color: cfg.text, margin: 0, fontFamily: serif }}>{carte.clients?.nom}</p>
            <p style={{ fontSize: 10, letterSpacing: '0.15em', marginTop: 12, color: cfg.text, opacity: 0.35 }}>
              Membre depuis {new Date(carte.created_at).toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })}
            </p>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
            <div>
              <p style={{ fontSize: 9, letterSpacing: '0.25em', textTransform: 'uppercase', color: cfg.text, opacity: 0.4, margin: '0 0 6px' }}>Solde</p>
              <p key={carte.solde} style={{ fontSize: 34, fontWeight: 300, color: cfg.accent, margin: 0, fontFamily: serif, animation: 'solde-flash 0.5s ease-out' }}>
                {carte.solde?.toLocaleString('fr-FR')}<span style={{ fontSize: 13, opacity: 0.65, marginLeft: 6 }}>DA</span>
              </p>
            </div>
            <div style={{ textAlign: 'right' }}>
              <p style={{ fontSize: 9, letterSpacing: '0.25em', textTransform: 'uppercase', color: cfg.text, opacity: 0.4, margin: '0 0 6px' }}>Points</p>
              <p style={{ fontSize: 34, fontWeight: 300, color: cfg.text, margin: 0, fontFamily: serif }}>{carte.points?.toLocaleString('fr-FR')}</p>
            </div>
          </div>
        </div>
      </div>

      {/* ── Contenu bas ── */}
      <div style={{ padding: '20px 16px 32px', maxWidth: 420, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 14 }}>

        {/* Actions rapides */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          <a href={wa} target="_blank" rel="noopener" style={{ background: '#2C2A25', color: '#F7F4EE', borderRadius: 16, padding: '14px 12px', textAlign: 'center', textDecoration: 'none', fontSize: 12, fontWeight: 500, letterSpacing: '0.05em', minHeight: 48, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
            <span>💬</span> Réserver
          </a>
          <button onClick={() => setShowQrFull(true)} style={{ background: '#BA7517', color: 'white', border: 0, borderRadius: 16, padding: '14px 12px', fontSize: 12, fontWeight: 500, letterSpacing: '0.05em', minHeight: 48, cursor: 'pointer' }}>
            Afficher QR
          </button>
        </div>

        {/* Progression niveau */}
        {prochain && (
          <div style={{ background: 'white', borderRadius: 24, border: '1px solid #EDE8DE', boxShadow: '0 2px 16px rgba(44,42,37,0.06)', padding: 24 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <p style={{ fontSize: 9, letterSpacing: '0.2em', textTransform: 'uppercase', color: '#8A8275', fontWeight: 500, margin: 0 }}>Vers {prochain}</p>
              <p style={{ fontSize: 10, color: '#8A8275', margin: 0 }}>{carte.points?.toLocaleString('fr-FR')} / {maxPts.toLocaleString('fr-FR')} pts</p>
            </div>
            <div style={{ height: 6, background: '#F0EDE5', borderRadius: 999, overflow: 'hidden' }}>
              <div style={{ height: '100%', borderRadius: 999, background: `linear-gradient(90deg, ${cfg.bg}, ${cfg.accent})`, width: `${pct}%`, transition: 'width 0.7s ease' }} />
            </div>
            <p style={{ fontSize: 10, color: '#8A8275', marginTop: 12, marginBottom: 0 }}>
              Encore {Math.max(maxPts - (carte.points || 0), 0).toLocaleString('fr-FR')} points pour atteindre {prochain}
            </p>
          </div>
        )}

        {/* Historique transactions */}
        {transactions.length > 0 && (
          <div style={{ background: 'white', borderRadius: 24, border: '1px solid #EDE8DE', boxShadow: '0 2px 16px rgba(44,42,37,0.06)', padding: 24 }}>
            <p style={{ fontSize: 9, fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.25em', color: '#8A8275', marginTop: 0, marginBottom: 16 }}>Dernières activités</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {transactions.map((t) => {
                const isCredit = t.type === 'cadeau' || t.type === 'recharge'
                const sign = isCredit ? '+' : '−'
                const color = isCredit ? '#BA7517' : '#2C2A25'
                return (
                  <div key={t.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, paddingBottom: 12, borderBottom: '1px solid #F4F1E9' }}>
                    <div style={{ minWidth: 0, flex: 1 }}>
                      <p style={{ fontSize: 13, color: '#2C2A25', margin: 0, fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {t.description || (isCredit ? 'Crédit' : 'Utilisation')}
                      </p>
                      <p style={{ fontSize: 10, color: '#8A8275', margin: '2px 0 0' }}>
                        {new Date(t.created_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}
                      </p>
                    </div>
                    <p style={{ fontSize: 14, fontWeight: 500, color, margin: 0, fontFamily: serif, whiteSpace: 'nowrap' }}>
                      {sign}{Math.abs(t.montant).toLocaleString('fr-FR')} DA
                    </p>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Message personnalisé */}
        {carte.message_perso && (
          <div style={{ background: 'white', borderRadius: 24, border: '1px solid #EDE8DE', boxShadow: '0 2px 16px rgba(44,42,37,0.06)', padding: 24, textAlign: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12, marginBottom: 16 }}>
              <div style={{ height: 1, width: 32, background: '#BA7517', opacity: 0.3 }} />
              <span style={{ fontSize: 9, letterSpacing: '0.3em', textTransform: 'uppercase', color: '#BA7517', opacity: 0.7, fontWeight: 500 }}>Message</span>
              <div style={{ height: 1, width: 32, background: '#BA7517', opacity: 0.3 }} />
            </div>
            <p style={{ fontSize: 19, fontWeight: 300, color: '#2C2A25', fontStyle: 'italic', lineHeight: 1.65, margin: 0, fontFamily: serif }}>
              &ldquo;{carte.message_perso}&rdquo;
            </p>
            {carte.offert_par && <p style={{ fontSize: 10, color: '#8A8275', marginTop: 12, letterSpacing: '0.1em', marginBottom: 0 }}>— {carte.offert_par}</p>}
          </div>
        )}

        {/* Expiration */}
        {carte.date_expiration && (
          <div style={{ borderRadius: 16, padding: '14px 20px', textAlign: 'center', background: expiryWarning ? 'rgba(217,90,90,0.08)' : 'rgba(186,117,23,0.06)', border: `1px solid ${expiryWarning ? 'rgba(217,90,90,0.25)' : 'rgba(186,117,23,0.2)'}` }}>
            <p style={{ fontSize: 10, letterSpacing: '0.15em', color: expiryWarning ? '#B85555' : '#BA7517', margin: 0, fontWeight: expiryWarning ? 600 : 400 }}>
              {expiryWarning ? `${expiryWarning} pour utiliser votre carte` : `Valable jusqu'au ${new Date(carte.date_expiration).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}`}
            </p>
          </div>
        )}

        {/* Avantages */}
        <div style={{ background: 'white', borderRadius: 24, border: '1px solid #EDE8DE', boxShadow: '0 2px 16px rgba(44,42,37,0.06)', padding: 24 }}>
          <p style={{ fontSize: 9, fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.25em', color: '#8A8275', marginBottom: 18, marginTop: 0 }}>Vos avantages</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {perks.map((perk, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                <div style={{ width: 22, height: 22, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 1, background: cfg.badgeBg, color: cfg.accent, fontSize: 9 }}>✦</div>
                <p style={{ fontSize: 14, color: '#2C2A25', lineHeight: 1.55, margin: 0 }}>{perk}</p>
              </div>
            ))}
          </div>
        </div>

        <p style={{ textAlign: 'center', fontSize: 9, letterSpacing: '0.3em', color: '#8A8275', textTransform: 'uppercase', paddingTop: 8, opacity: 0.4, margin: 0 }}>
          Hadiya · Carte digitale
        </p>
      </div>

      {/* ── QR plein écran ── */}
      {showQrFull && (
        <div onClick={() => setShowQrFull(false)} style={{ position: 'fixed', inset: 0, background: 'white', zIndex: 100, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
          <p style={{ fontSize: 10, letterSpacing: '0.3em', color: '#8A8275', textTransform: 'uppercase', marginBottom: 20 }}>Présenter au salon</p>
          <div style={{ background: 'white', padding: 20, borderRadius: 24, border: '1px solid #EDE8DE' }}>
            <img alt="QR" src={`https://api.qrserver.com/v1/create-qr-code/?size=320x320&data=${encodeURIComponent(typeof window !== 'undefined' ? window.location.href : '')}`} style={{ display: 'block', width: 280, height: 280 }} />
          </div>
          <p style={{ fontSize: 16, fontWeight: 300, color: '#2C2A25', marginTop: 24, fontFamily: serif }}>{carte.clients?.prenom} {carte.clients?.nom}</p>
          <p style={{ fontSize: 11, color: '#8A8275', marginTop: 24, letterSpacing: '0.15em' }}>Touchez pour fermer</p>
        </div>
      )}
    </div>
  )
}
