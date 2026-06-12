'use client'

import { useEffect, useRef, useState } from 'react'
import { useReveal, BrowserFrame, ScaledFrame, Cursor, Icon, useDemoPhases } from './shared'

const FEATURES = [
  { id: 'fidelite',    label: 'Fidélité',          short: 'Programme 4 niveaux',        desc: "Un programme sur-mesure : 4 niveaux, seuils ajustables, avantages configurables. Chaque scan compte, chaque client revient.", icon: 'star' as const },
  { id: 'caisse',      label: 'Caisse POS',         short: 'Vente & paiement carte',     desc: "Catalogue clair, paiement NFC en un geste, ticket thermique 80mm. Conçue pour les mains qui travaillent vite.", icon: 'cash' as const },
  { id: 'cadeaux',     label: 'Cartes cadeaux',     short: 'Brandées par salon',          desc: "Chaque salon a sa page de paiement à son nom, son logo. Vendez en ligne, livrez par WhatsApp en quelques secondes.", icon: 'gift' as const },
  { id: 'reservations',label: 'Réservations',       short: 'Agenda jour / semaine / mois',desc: "Un agenda posé, lisible, qui pense aussi à la cliente : praticien, créneau, durée. Pas un Excel déguisé.", icon: 'cal' as const },
  { id: 'catalogue',   label: 'Catalogue & stock',  short: 'Soins, consommables, alertes',desc: "Vos soins, vos consommables, vos prix. Seuils d'alerte sur le stock pour ne plus tomber court d'huile d'argan un samedi après-midi.", icon: 'box' as const },
  { id: 'stats',       label: 'Statistiques',       short: 'KPI & insights',              desc: "CA, transactions, solde moyen, clients fidèles. Des chiffres qui éclairent les décisions, pas qui les noient.", icon: 'chart' as const },
]

export default function FeatureShowcase() {
  const [active, setActive] = useState('fidelite')
  const [ref, visible] = useReveal()
  const tabsRef = useRef<HTMLDivElement>(null)
  const [showScrollHint, setShowScrollHint] = useState(true)

  const handleTabsScroll = () => {
    const el = tabsRef.current
    if (!el) return
    setShowScrollHint(el.scrollLeft + el.clientWidth < el.scrollWidth - 8)
  }

  useEffect(() => {
    const handler = (e: Event) => {
      const id = (e as CustomEvent<string>).detail
      if (FEATURES.some(f => f.id === id)) setActive(id)
    }
    window.addEventListener('hadiya:setFeature', handler)
    return () => window.removeEventListener('hadiya:setFeature', handler)
  }, [])

  const current = FEATURES.find(f => f.id === active)!

  return (
    <section id="fonctionnalites" ref={ref as React.RefObject<HTMLDivElement>} className="hd-section" style={{
      background: 'linear-gradient(180deg, #F7F4EE 0%, #EFEADC 100%)',
      position: 'relative',
    }}>
      <div style={{ maxWidth: 1280, margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: 64 }}>
          <p style={{
            fontSize: 10, letterSpacing: '0.32em', textTransform: 'uppercase',
            color: '#BA7517', fontWeight: 600, margin: 0,
            opacity: visible ? 1 : 0, transition: 'opacity 0.8s',
          }}>Tout ce dont votre salon a besoin</p>
          <h2 style={{
            fontFamily: 'var(--font-cormorant)', fontSize: 'clamp(38px, 5vw, 64px)',
            fontWeight: 300, lineHeight: 1.05, letterSpacing: '-0.02em',
            color: '#2C2A25', margin: '20px 0 16px', maxWidth: 800, marginLeft: 'auto', marginRight: 'auto',
          }}>
            Cliquez. <span style={{ fontStyle: 'italic', color: '#BA7517' }}>Regardez.</span>
          </h2>
          <p style={{ fontSize: 16, color: '#6B6560', maxWidth: 560, margin: '0 auto', lineHeight: 1.6 }}>
            Sélectionnez une fonctionnalité — une démo se joue d&apos;elle-même, comme si vous étiez derrière le comptoir.
          </p>
        </div>

        <div className="hd-feat-grid">
          {/* Tabs */}
          <div style={{ position: 'relative' }}>
            <div className="hd-feat-tabs" ref={tabsRef} onScroll={handleTabsScroll}>
            {FEATURES.map((f) => {
              const isActive = active === f.id
              return (
                <button key={f.id} onClick={() => setActive(f.id)} className="hd-feat-tab" style={{
                  textAlign: 'left', padding: '18px 20px', borderRadius: 14,
                  border: isActive ? '1px solid rgba(186,117,23,0.4)' : '1px solid transparent',
                  background: isActive ? 'rgba(186,117,23,0.06)' : 'transparent',
                  cursor: 'pointer', transition: 'all 0.3s cubic-bezier(0.16,1,0.3,1)',
                  fontFamily: 'var(--font-geist-sans)', color: '#2C2A25',
                  display: 'flex', alignItems: 'flex-start', gap: 14,
                }}>
                  <span style={{
                    width: 36, height: 36, borderRadius: 10, flexShrink: 0,
                    background: isActive ? '#BA7517' : 'rgba(44,42,37,0.06)',
                    color: isActive ? '#F7F4EE' : '#8A8275',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    transition: 'all 0.3s',
                  }}>{Icon[f.icon](18)}</span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{
                      fontFamily: 'var(--font-cormorant)', fontSize: 22, fontWeight: 500,
                      margin: 0, lineHeight: 1.1, color: isActive ? '#2C2A25' : '#4A4640',
                    }}>{f.label}</p>
                    <p style={{ fontSize: 11, color: '#8A8275', margin: '4px 0 0', letterSpacing: '0.04em' }}>{f.short}</p>
                  </div>
                  {isActive && <span style={{ color: '#BA7517', flexShrink: 0, marginTop: 4 }}>{Icon.arrow(14)}</span>}
                </button>
              )
            })}
            </div>
            <div
              className="hd-scroll-hint"
              style={{ opacity: showScrollHint ? 1 : 0, transition: 'opacity 0.4s' }}
              aria-hidden="true"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" className="hd-scroll-arrow">
                <path d="M9 18l6-6-6-6" stroke="#BA7517" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
          </div>

          {/* Stage */}
          <div>
            <ScaledFrame baseWidth={720} baseHeight={500}>
              <BrowserFrame width={720} height={500} url={`hadiya.app/dashboard/${active}`}>
                {active === 'fidelite'     && <DemoFidelite/>}
                {active === 'caisse'       && <DemoCaisse/>}
                {active === 'cadeaux'      && <DemoCadeaux/>}
                {active === 'reservations' && <DemoReservations/>}
                {active === 'catalogue'    && <DemoCatalogue/>}
                {active === 'stats'        && <DemoStats/>}
              </BrowserFrame>
            </ScaledFrame>
            <div style={{ marginTop: 28, padding: '0 12px', maxWidth: 880 }}>
              <p style={{
                fontFamily: 'var(--font-geist-sans)', fontSize: 14, lineHeight: 1.7,
                color: '#6B6560', margin: 0, animation: 'hd-fadeUp 0.6s',
              }} key={active}>
                {current.desc}
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

// ── Demo: Fidélité ────────────────────────────────────────────
function DemoFidelite() {
  const phase = useDemoPhases(5, [1400, 1600, 1400, 1800, 2000])
  const cursorMap = [{ x: 380, y: 240 }, { x: 380, y: 240 }, { x: 220, y: 130 }, { x: 480, y: 320 }, { x: 600, y: 220 }]
  const cur = cursorMap[phase]
  const clicking = phase === 1 || phase === 3
  const clientLoaded = phase >= 2
  const pointsAdded = phase >= 4
  const points = pointsAdded ? 4890 : 4840
  const pct = (points / 5000) * 100

  return (
    <div style={{ height: '100%', background: '#1E1C18', position: 'relative', padding: 24, fontFamily: 'var(--font-geist-sans)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18, gap: 12 }}>
        <div style={{ minWidth: 0, flex: 1 }}>
          <p style={{ fontSize: 10, letterSpacing: '0.22em', color: '#BA7517', textTransform: 'uppercase', margin: 0, fontWeight: 600 }}>Scanner</p>
          <p style={{ fontFamily: 'var(--font-cormorant)', fontSize: 20, color: '#F7F4EE', margin: '4px 0 0', fontWeight: 300, whiteSpace: 'nowrap' }}>Approcher la carte</p>
        </div>
        <div style={{ fontSize: 10, color: 'rgba(247,244,238,0.4)', whiteSpace: 'nowrap' }}>spa@aljannah.dz</div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, height: 'calc(100% - 60px)' }}>
        <div style={{
          background: 'linear-gradient(145deg, #2C2A25, #343028)',
          border: clientLoaded ? '1px solid rgba(186,117,23,0.4)' : '1px solid rgba(186,117,23,0.12)',
          borderRadius: 16, padding: 18,
          transition: 'border-color 0.5s, opacity 0.5s', opacity: clientLoaded ? 1 : 0.3, minWidth: 0,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
            <div style={{
              width: 38, height: 38, borderRadius: 19,
              background: 'rgba(186,117,23,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: '#BA7517', fontFamily: 'var(--font-cormorant)', fontSize: 15, fontWeight: 600, flexShrink: 0,
            }}>YB</div>
            <div style={{ minWidth: 0 }}>
              <p style={{ fontFamily: 'var(--font-cormorant)', fontSize: 16, color: '#F7F4EE', margin: 0, fontWeight: 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>Yasmine Belkacem</p>
              <p style={{ fontSize: 9, color: '#8A8275', margin: '2px 0 0' }}>0555 12 34 56 · 8 visites</p>
            </div>
          </div>
          <div style={{ borderTop: '1px solid rgba(247,244,238,0.06)', paddingTop: 12 }}>
            <p style={{ fontSize: 9, letterSpacing: '0.22em', color: '#8A8275', textTransform: 'uppercase', margin: 0 }}>Solde</p>
            <p style={{ fontFamily: 'var(--font-cormorant)', fontSize: 26, color: '#F7F4EE', margin: '4px 0 0', fontWeight: 300 }}>
              12 500 <span style={{ fontSize: 11, color: '#BA7517' }}>DA</span>
            </p>
          </div>
          <div style={{ marginTop: 14 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 6, gap: 8 }}>
              <span style={{ fontSize: 9, color: '#BA7517', fontWeight: 600, letterSpacing: '0.18em', textTransform: 'uppercase', whiteSpace: 'nowrap' }}>Argent → Or</span>
              <span style={{ fontSize: 9, color: 'rgba(247,244,238,0.5)', whiteSpace: 'nowrap' }}>{points} / 5000</span>
            </div>
            <div style={{ height: 5, borderRadius: 999, background: 'rgba(247,244,238,0.08)', overflow: 'hidden' }}>
              <div style={{
                width: `${pct}%`, height: '100%',
                background: 'linear-gradient(90deg, #BA7517, #D08F2C)',
                transition: 'width 0.8s cubic-bezier(0.16,1,0.3,1)',
                boxShadow: pointsAdded ? '0 0 12px rgba(186,117,23,0.6)' : 'none',
              }}/>
            </div>
          </div>
        </div>

        <div style={{
          background: 'linear-gradient(145deg, #2C2A25, #343028)', border: '1px solid rgba(186,117,23,0.12)',
          borderRadius: 16, padding: 18, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', gap: 14, minWidth: 0,
        }}>
          <div style={{ minWidth: 0 }}>
            <p style={{ fontSize: 9, letterSpacing: '0.22em', color: '#8A8275', textTransform: 'uppercase', margin: 0 }}>Service du jour</p>
            <p style={{ fontFamily: 'var(--font-cormorant)', fontSize: 19, color: '#F7F4EE', margin: '6px 0 0', fontWeight: 400, lineHeight: 1.15 }}>Soin visage Argan</p>
            <p style={{ fontSize: 12, color: '#BA7517', margin: '6px 0 0' }}>3 000 DA · 45 min</p>
          </div>
          <button style={{
            padding: '12px 14px', borderRadius: 10,
            background: pointsAdded ? 'rgba(16,185,129,0.15)' : '#BA7517',
            border: pointsAdded ? '1px solid rgba(16,185,129,0.4)' : 'none',
            color: pointsAdded ? '#10B981' : '#FFF6E0',
            fontSize: 10, letterSpacing: '0.14em', textTransform: 'uppercase', fontWeight: 600,
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            transition: 'all 0.4s', whiteSpace: 'nowrap',
          }}>
            {pointsAdded ? <>{Icon.check(12)} +50 pts attribués</> : 'Attribuer +50 pts'}
          </button>
        </div>
      </div>

      {phase <= 1 && (
        <div style={{
          position: 'absolute', right: 60, bottom: 60, width: 80, height: 80, borderRadius: '50%',
          border: '2px solid rgba(186,117,23,0.4)', animation: 'hd-scan-pulse 1.5s ease-out infinite',
        }}/>
      )}
      <Cursor x={cur.x} y={cur.y} clicking={clicking}/>
    </div>
  )
}

// ── Demo: Caisse POS ──────────────────────────────────────────
function DemoCaisse() {
  const phase = useDemoPhases(5, [1200, 1300, 1300, 1500, 2000])
  const items = [
    { id: 'm', label: 'Massage',     emoji: '✦', price: 4500, dur: '60 min' },
    { id: 'v', label: 'Soin visage', emoji: '🌿', price: 3000, dur: '45 min' },
    { id: 'h', label: 'Hammam',      emoji: '♨', price: 3500, dur: '90 min' },
    { id: 'a', label: 'Huile argan', emoji: '🫧', price: 2200, dur: '30 min' },
  ]
  const cursorMap = [{ x: 90, y: 200 }, { x: 90, y: 200 }, { x: 90, y: 290 }, { x: 90, y: 290 }, { x: 580, y: 360 }]
  const added: string[] = phase >= 2 ? ['m'] : []
  if (phase >= 3) added.push('v')
  const total = added.reduce((s, id) => s + (items.find(i => i.id === id)?.price ?? 0), 0)
  const encaissed = phase === 4
  const cur = cursorMap[phase]
  const clicking = phase === 1 || phase === 3 || phase === 4

  return (
    <div style={{ height: '100%', background: '#1E1C18', display: 'grid', gridTemplateColumns: '1fr 280px', position: 'relative', fontFamily: 'var(--font-geist-sans)' }}>
      <div style={{ padding: 20, overflow: 'hidden', minWidth: 0 }}>
        <p style={{ fontSize: 10, letterSpacing: '0.22em', color: '#BA7517', textTransform: 'uppercase', margin: 0, fontWeight: 600 }}>Catalogue</p>
        <p style={{ fontFamily: 'var(--font-cormorant)', fontSize: 20, color: '#F7F4EE', margin: '4px 0 16px', fontWeight: 300, whiteSpace: 'nowrap' }}>Soins du jour</p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {items.map((it) => {
            const isAdded = added.includes(it.id)
            return (
              <div key={it.id} style={{
                background: isAdded ? 'rgba(186,117,23,0.10)' : 'linear-gradient(145deg, #2C2A25, #343028)',
                border: isAdded ? '1px solid rgba(186,117,23,0.4)' : '1px solid rgba(186,117,23,0.10)',
                borderRadius: 10, padding: '10px 12px', display: 'flex', alignItems: 'center', gap: 10, transition: 'all 0.4s',
              }}>
                <span style={{ fontSize: 16, flexShrink: 0 }}>{it.emoji}</span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontSize: 12, color: '#F7F4EE', margin: 0, fontWeight: 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{it.label}</p>
                  <p style={{ fontSize: 9, color: '#8A8275', margin: '2px 0 0' }}>{it.dur}</p>
                </div>
                <p style={{ fontSize: 12, color: '#BA7517', margin: 0, fontWeight: 600, whiteSpace: 'nowrap', flexShrink: 0 }}>{it.price.toLocaleString('fr-FR')} <span style={{ fontSize: 8, opacity: 0.7 }}>DA</span></p>
                {isAdded && <span style={{ color: '#BA7517', flexShrink: 0 }}>{Icon.check(12)}</span>}
              </div>
            )
          })}
        </div>
      </div>

      <div style={{ background: '#16140F', padding: 20, borderLeft: '1px solid rgba(186,117,23,0.10)', display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        <p style={{ fontSize: 10, letterSpacing: '0.22em', color: '#BA7517', textTransform: 'uppercase', margin: 0, fontWeight: 600 }}>Panier</p>
        <p style={{ fontFamily: 'var(--font-cormorant)', fontSize: 20, color: '#F7F4EE', margin: '4px 0 16px', fontWeight: 300, whiteSpace: 'nowrap' }}>
          {added.length} article{added.length > 1 ? 's' : ''}
        </p>
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 6, minHeight: 0 }}>
          {added.length === 0 && <p style={{ fontSize: 11, color: '#8A8275', fontStyle: 'italic' }}>Aucun article sélectionné</p>}
          {added.map((id) => {
            const it = items.find(i => i.id === id)!
            return (
              <div key={id} style={{
                fontSize: 11, color: 'rgba(247,244,238,0.7)', display: 'flex', justifyContent: 'space-between',
                padding: '4px 0', gap: 8, animation: 'hd-fadeUp 0.4s', whiteSpace: 'nowrap',
              }}>
                <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>{it.label}</span>
                <span style={{ flexShrink: 0 }}>{it.price.toLocaleString('fr-FR')}</span>
              </div>
            )
          })}
        </div>
        <div style={{ borderTop: '1px solid rgba(247,244,238,0.08)', paddingTop: 14, marginTop: 14 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 14 }}>
            <span style={{ fontSize: 10, letterSpacing: '0.22em', color: '#8A8275', textTransform: 'uppercase' }}>Total</span>
            <span style={{ fontFamily: 'var(--font-cormorant)', fontSize: 28, color: '#F7F4EE', fontWeight: 300, transition: 'color 0.3s' }}>
              {total.toLocaleString('fr-FR')} <span style={{ fontSize: 12, color: '#BA7517' }}>DA</span>
            </span>
          </div>
          <button style={{
            width: '100%', padding: '14px', borderRadius: 12,
            background: encaissed ? 'rgba(16,185,129,0.15)' : (total > 0 ? '#BA7517' : 'rgba(186,117,23,0.2)'),
            color: encaissed ? '#10B981' : '#FFF6E0',
            border: encaissed ? '1px solid rgba(16,185,129,0.4)' : 'none',
            fontSize: 11, letterSpacing: '0.22em', textTransform: 'uppercase', fontWeight: 600,
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            transition: 'all 0.4s', opacity: total > 0 ? 1 : 0.5,
          }}>
            {encaissed ? <>{Icon.check(14)} Encaissé</> : 'Encaisser par NFC'}
          </button>
        </div>
      </div>
      <Cursor x={cur.x} y={cur.y} clicking={clicking}/>
    </div>
  )
}

// ── Demo: Cartes cadeaux ──────────────────────────────────────
function DemoCadeaux() {
  const phase = useDemoPhases(5, [1200, 1500, 1200, 1600, 1800])
  const amounts = [3000, 5000, 10000, 20000]
  const cursorMap = [{ x: 180, y: 240 }, { x: 180, y: 240 }, { x: 180, y: 320 }, { x: 380, y: 380 }, { x: 480, y: 200 }]
  const cur = cursorMap[phase]
  const clicking = phase === 1 || phase === 3
  const pickedAmount = phase >= 2 ? 5000 : null
  const recipient = phase >= 3 ? 'Yasmine B.' : ''
  const showPreview = phase >= 4

  return (
    <div style={{ height: '100%', background: '#1E1C18', display: 'grid', gridTemplateColumns: '1fr 1fr', position: 'relative', fontFamily: 'var(--font-geist-sans)' }}>
      <div style={{ padding: 28 }}>
        <p style={{ fontSize: 10, letterSpacing: '0.22em', color: '#BA7517', textTransform: 'uppercase', margin: 0, fontWeight: 600 }}>Carte cadeau</p>
        <p style={{ fontFamily: 'var(--font-cormorant)', fontSize: 24, color: '#F7F4EE', margin: '4px 0 22px', fontWeight: 300 }}>Offrir un moment</p>
        <p style={{ fontSize: 11, color: '#8A8275', margin: '0 0 8px', letterSpacing: '0.04em' }}>Montant</p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 6, marginBottom: 22 }}>
          {amounts.map((a) => {
            const sel = pickedAmount === a
            return (
              <div key={a} className="hd-amount" style={{
                ...(sel ? { background: '#BA7517', borderColor: '#BA7517', color: '#FFF6E0', fontWeight: 600 } : {}),
                fontSize: 11, padding: '11px 0', textAlign: 'center', borderRadius: 10, transition: 'all 0.3s',
              }}>{a.toLocaleString('fr-FR')}</div>
            )
          })}
        </div>
        <p style={{ fontSize: 11, color: '#8A8275', margin: '0 0 8px', letterSpacing: '0.04em' }}>Bénéficiaire</p>
        <div className="hd-input" style={{ fontSize: 13, height: 44, lineHeight: '16px', padding: '14px 16px' }}>
          {recipient || <span style={{ color: 'rgba(247,244,238,0.2)' }}>Nom complet…</span>}
          {recipient && phase < 4 && <span style={{ animation: 'blink 1s infinite', color: '#BA7517' }}>|</span>}
        </div>
        <button className="hd-btn-gold" style={{
          marginTop: 22, width: '100%', padding: '14px',
          opacity: pickedAmount && recipient ? 1 : 0.4, transition: 'opacity 0.3s',
        }}>
          Générer la carte
        </button>
      </div>
      <div style={{
        background: '#16140F', padding: 28, borderLeft: '1px solid rgba(186,117,23,0.10)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative',
      }}>
        {!showPreview && (
          <p style={{ fontSize: 11, color: '#8A8275', textAlign: 'center', maxWidth: 200, lineHeight: 1.6 }}>
            La carte apparaîtra ici avec le branding de votre salon.
          </p>
        )}
        {showPreview && (
          <div style={{
            width: 260, padding: 20,
            background: 'linear-gradient(135deg, #BA7517 0%, #8A560F 100%)',
            borderRadius: 18, boxShadow: '0 20px 50px -10px rgba(186,117,23,0.4)',
            color: '#FFF6E0', animation: 'hd-fadeUp 0.6s',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <p style={{ fontSize: 9, letterSpacing: '0.32em', textTransform: 'uppercase', margin: 0, opacity: 0.7 }}>Carte cadeau</p>
              <span style={{ color: 'rgba(255,246,224,0.5)' }}>{Icon.qr(20)}</span>
            </div>
            <p style={{ fontFamily: 'var(--font-cormorant)', fontSize: 36, margin: '20px 0 0', fontWeight: 300, letterSpacing: '-0.02em' }}>
              5 000 <span style={{ fontSize: 14, opacity: 0.7 }}>DA</span>
            </p>
            <div style={{ marginTop: 24, paddingTop: 14, borderTop: '1px solid rgba(255,246,224,0.2)' }}>
              <p style={{ fontSize: 9, letterSpacing: '0.22em', opacity: 0.7, margin: 0, textTransform: 'uppercase' }}>Pour</p>
              <p style={{ fontFamily: 'var(--font-cormorant)', fontSize: 18, margin: '2px 0 0', fontStyle: 'italic' }}>{recipient}</p>
              <p style={{ fontSize: 9, letterSpacing: '0.22em', opacity: 0.6, margin: '14px 0 0', textTransform: 'uppercase' }}>Spa Al Jannah</p>
            </div>
          </div>
        )}
      </div>
      <Cursor x={cur.x} y={cur.y} clicking={clicking}/>
    </div>
  )
}

// ── Demo: Réservations ────────────────────────────────────────
function DemoReservations() {
  const phase = useDemoPhases(4, [1500, 1400, 1500, 2000])
  const cursorMap = [{ x: 200, y: 100 }, { x: 200, y: 100 }, { x: 640, y: 50 }, { x: 400, y: 280 }]
  const cur = cursorMap[phase]
  const clicking = phase === 1 || phase === 2
  const modalOpen = phase >= 3
  const days = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim']
  const slots = [
    { h: '09:30', c: 'Yasmine B.', s: 'Massage',    st: 'confirme' },
    { h: '11:00', c: 'Amina H.',   s: 'Soin visage', st: 'confirme' },
    { h: '14:00', c: 'Sarah M.',   s: 'Hammam',      st: 'attente' },
  ]

  return (
    <div style={{ height: '100%', background: '#1E1C18', position: 'relative', fontFamily: 'var(--font-geist-sans)' }}>
      <div style={{ padding: '20px 28px', borderBottom: '1px solid rgba(247,244,238,0.06)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <p style={{ fontFamily: 'var(--font-cormorant)', fontSize: 22, color: '#F7F4EE', margin: 0, fontWeight: 400 }}>Réservations</p>
          <p style={{ fontSize: 10, color: '#BA7517', margin: '2px 0 0', letterSpacing: '0.04em' }}>Mercredi 21 mai</p>
        </div>
        <button style={{
          padding: '10px 18px', borderRadius: 12, background: '#BA7517', color: '#FFF6E0', border: 'none',
          fontSize: 11, fontWeight: 600, letterSpacing: '0.12em', textTransform: 'uppercase',
          display: 'flex', alignItems: 'center', gap: 8,
          boxShadow: phase === 2 ? '0 0 0 4px rgba(186,117,23,0.25)' : 'none', transition: 'box-shadow 0.3s',
        }}>+ Nouvelle</button>
      </div>
      <div style={{ padding: 18, display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 6 }}>
        {days.map((d, i) => {
          const isSel = i === 2
          return (
            <div key={d} style={{
              padding: '10px 0', borderRadius: 10, textAlign: 'center',
              background: isSel ? '#BA7517' : 'rgba(247,244,238,0.04)', transition: 'all 0.3s',
            }}>
              <p style={{ fontSize: 9, letterSpacing: '0.18em', color: isSel ? 'rgba(255,246,224,0.8)' : '#8A8275', textTransform: 'uppercase', margin: 0 }}>{d}</p>
              <p style={{ fontSize: 14, color: isSel ? '#FFF6E0' : 'rgba(247,244,238,0.6)', fontWeight: 600, margin: '4px 0 0' }}>{19 + i}</p>
            </div>
          )
        })}
      </div>
      <div style={{ padding: '0 20px 20px', display: 'flex', flexDirection: 'column', gap: 8 }}>
        {slots.map((s, i) => (
          <div key={i} style={{
            background: 'linear-gradient(145deg, #2C2A25, #343028)', border: '1px solid rgba(186,117,23,0.10)',
            borderRadius: 14, padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 14,
          }}>
            <div style={{ background: '#1E1C18', borderRadius: 10, padding: '6px 12px', textAlign: 'center', border: '1px solid rgba(186,117,23,0.18)' }}>
              <p style={{ fontSize: 13, color: '#BA7517', margin: 0, fontWeight: 600 }}>{s.h}</p>
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ fontSize: 13, color: '#F7F4EE', margin: 0, fontWeight: 500 }}>{s.c}</p>
              <p style={{ fontSize: 10, color: '#BA7517', margin: '2px 0 0' }}>{s.s}</p>
            </div>
            <span style={{
              fontSize: 9, padding: '4px 10px', borderRadius: 8, fontWeight: 600,
              background: s.st === 'confirme' ? 'rgba(16,185,129,0.15)' : 'rgba(186,117,23,0.15)',
              color: s.st === 'confirme' ? '#10B981' : '#BA7517',
            }}>
              {s.st === 'confirme' ? 'Confirmé' : 'En attente'}
            </span>
          </div>
        ))}
      </div>
      {modalOpen && (
        <>
          <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.5)', animation: 'hd-fadeIn 0.3s' }}/>
          <div style={{
            position: 'absolute', left: '12%', right: '12%', top: 40, bottom: 40,
            background: '#F7F4EE', borderRadius: 18, overflow: 'hidden',
            boxShadow: '0 30px 80px rgba(0,0,0,0.4)', animation: 'hd-slideUp 0.4s cubic-bezier(0.16,1,0.3,1)',
            display: 'flex', flexDirection: 'column',
          }}>
            <div style={{ background: '#2C2A25', padding: '16px 20px' }}>
              <p style={{ fontSize: 9, letterSpacing: '0.22em', color: '#BA7517', textTransform: 'uppercase', margin: 0, fontWeight: 600 }}>Agenda</p>
              <p style={{ fontFamily: 'var(--font-cormorant)', fontSize: 19, color: '#F7F4EE', margin: '4px 0 0', fontWeight: 400 }}>Nouvelle réservation</p>
            </div>
            <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 10 }}>
              {[['Client', 'Yasmine Belkacem'], ['Service', 'Massage · 60 min']].map(([label, val]) => (
                <div key={label} style={{ background: 'white', borderRadius: 12, padding: 12, border: '1px solid rgba(196,184,158,0.4)' }}>
                  <p style={{ fontSize: 9, letterSpacing: '0.18em', color: '#8A8275', textTransform: 'uppercase', margin: 0 }}>{label}</p>
                  <p style={{ fontSize: 13, color: '#2C2A25', margin: '6px 0 0', fontWeight: 500 }}>{val}</p>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
      <Cursor x={cur.x} y={cur.y} clicking={clicking}/>
    </div>
  )
}

// ── Demo: Statistiques ────────────────────────────────────────
function DemoStats() {
  const phase = useDemoPhases(4, [1800, 1500, 1800, 1500])
  const cursorMap = [{ x: 200, y: 60 }, { x: 200, y: 60 }, { x: 90, y: 200 }, { x: 90, y: 200 }]
  const cur = cursorMap[phase]
  const clicking = phase === 1
  const period = phase >= 2 ? '30j' : '7j'
  const data7  = [60, 45, 80, 55, 90, 70, 95]
  const data30 = [55, 70, 65, 85, 60, 75, 90, 80, 95, 70, 60, 88]
  const data = period === '7j' ? data7 : data30

  return (
    <div style={{ height: '100%', background: '#1E1C18', padding: 24, position: 'relative', fontFamily: 'var(--font-geist-sans)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 18, gap: 12 }}>
        <div style={{ minWidth: 0 }}>
          <p style={{ fontSize: 10, letterSpacing: '0.22em', color: '#BA7517', textTransform: 'uppercase', margin: 0, fontWeight: 600 }}>Statistiques</p>
          <p style={{ fontFamily: 'var(--font-cormorant)', fontSize: 20, color: '#F7F4EE', margin: '4px 0 0', fontWeight: 300, whiteSpace: 'nowrap' }}>Chiffre d&apos;affaires</p>
        </div>
        <div style={{ display: 'flex', gap: 4, padding: 3, borderRadius: 10, background: 'rgba(247,244,238,0.05)', flexShrink: 0 }}>
          {['7j', '30j', '90j'].map(p => (
            <span key={p} style={{
              padding: '5px 12px', borderRadius: 7, fontSize: 10, fontWeight: 600, letterSpacing: '0.05em',
              background: p === period ? '#BA7517' : 'transparent',
              color: p === period ? '#FFF6E0' : 'rgba(247,244,238,0.5)', transition: 'all 0.3s',
            }}>{p}</span>
          ))}
        </div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10, marginBottom: 16 }}>
        {[
          { label: 'CA',    val: period === '7j' ? '147 500' : '624 200', unit: 'DA' },
          { label: 'Ventes',val: period === '7j' ? '52' : '218',          unit: '' },
          { label: 'Moyen', val: '8 420',                                  unit: 'DA' },
        ].map(k => (
          <div key={k.label} style={{
            background: 'linear-gradient(145deg, #2C2A25, #343028)', border: '1px solid rgba(186,117,23,0.12)',
            borderRadius: 12, padding: 12, minWidth: 0,
          }}>
            <p style={{ fontSize: 9, letterSpacing: '0.22em', color: '#8A8275', textTransform: 'uppercase', margin: 0 }}>{k.label}</p>
            <p style={{ fontFamily: 'var(--font-cormorant)', fontSize: 21, color: '#F7F4EE', margin: '4px 0 0', fontWeight: 300, letterSpacing: '-0.01em', whiteSpace: 'nowrap' }} key={k.val}>
              <span style={{ animation: 'hd-fadeUp 0.5s' }}>{k.val}</span>
              {k.unit && <span style={{ fontSize: 9, color: '#BA7517', marginLeft: 5 }}>{k.unit}</span>}
            </p>
          </div>
        ))}
      </div>
      <div style={{
        background: 'linear-gradient(145deg, #2C2A25, #343028)', border: '1px solid rgba(186,117,23,0.12)',
        borderRadius: 14, padding: 14, height: 'calc(100% - 145px)',
        display: 'flex', alignItems: 'flex-end', gap: 3,
      }}>
        {data.map((v, i) => (
          <div key={`${period}-${i}`} style={{
            flex: 1, height: `${v}%`,
            background: i === 4 ? 'linear-gradient(180deg, #D08F2C 0%, #BA7517 100%)' : 'rgba(186,117,23,0.3)',
            borderRadius: '4px 4px 0 0', transition: 'height 0.8s cubic-bezier(0.16,1,0.3,1)',
            animation: 'hd-bar-grow 0.6s cubic-bezier(0.16,1,0.3,1)',
          }}/>
        ))}
      </div>
      <Cursor x={cur.x} y={cur.y} clicking={clicking}/>
    </div>
  )
}

// ── Demo: Catalogue & Stock ───────────────────────────────────
function DemoCatalogue() {
  const phase = useDemoPhases(5, [1400, 1200, 1300, 1400, 1700])
  const cursorMap = [{ x: 100, y: 100 }, { x: 280, y: 65 }, { x: 280, y: 65 }, { x: 470, y: 280 }, { x: 470, y: 280 }]
  const cur = cursorMap[phase]
  const clicking = phase === 2 || phase === 4
  const tab = phase >= 2 ? 'consommables' : 'soins'
  const stockBoost = phase >= 4 ? 2 : 0

  const soins = [
    { emoji: '✦', name: 'Massage',     price: 4500, dur: '60 min' },
    { emoji: '🌿', name: 'Soin visage', price: 3000, dur: '45 min' },
    { emoji: '♨', name: 'Hammam',       price: 3500, dur: '90 min' },
  ]
  const consos = [
    { emoji: '☕', name: 'Café',            price: 200, stock: 10,              min: 5,  unit: 'unités' },
    { emoji: '🍹', name: 'Cocktail détox', price: 800, stock: 4,               min: 5,  unit: 'unités' },
    { emoji: '💧', name: 'Eau pétillante', price: 150, stock: 6 + stockBoost,  min: 10, unit: 'unités' },
  ]

  return (
    <div style={{ height: '100%', background: '#F7F4EE', position: 'relative', fontFamily: 'var(--font-geist-sans)' }}>
      <div style={{ background: '#2C2A25', padding: '18px 22px 14px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 12 }}>
          <div>
            <p style={{ fontFamily: 'var(--font-cormorant)', fontSize: 20, color: '#F7F4EE', margin: 0, fontWeight: 400 }}>Catalogue</p>
            <p style={{ fontSize: 10, color: '#BA7517', margin: '2px 0 0', letterSpacing: '0.04em' }}>3 soins actifs · 3 consommables</p>
          </div>
          <button style={{
            padding: '6px 12px', borderRadius: 8, background: '#BA7517', color: '#FFF6E0',
            border: 'none', fontSize: 9, fontWeight: 600, letterSpacing: '0.12em', textTransform: 'uppercase',
          }}>+ Ajouter</button>
        </div>
        <div style={{ display: 'flex', gap: 6 }}>
          {[{ id: 'soins', label: '✨ Soins & Services', count: 3 }, { id: 'consommables', label: '📦 Consommables', count: 3 }].map(t => {
            const isActive = tab === t.id
            return (
              <div key={t.id} style={{
                padding: '7px 14px', borderRadius: 8,
                background: isActive ? '#BA7517' : 'rgba(247,244,238,0.06)',
                color: isActive ? '#FFF6E0' : 'rgba(247,244,238,0.55)',
                fontSize: 10, fontWeight: 600, letterSpacing: '0.05em',
                display: 'flex', alignItems: 'center', gap: 6, transition: 'all 0.3s',
                boxShadow: isActive ? '0 4px 12px rgba(186,117,23,0.25)' : 'none',
              }}>
                <span>{t.label}</span>
                <span style={{ fontSize: 9, opacity: 0.7, background: isActive ? 'rgba(0,0,0,0.15)' : 'rgba(247,244,238,0.08)', borderRadius: 4, padding: '1px 6px' }}>{t.count}</span>
              </div>
            )
          })}
        </div>
      </div>

      <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 8, overflow: 'hidden' }}>
        {tab === 'soins' ? (
          soins.map((s, i) => (
            <div key={i} style={{
              background: 'white', borderRadius: 14, padding: '12px 14px',
              border: '1px solid rgba(196,184,158,0.5)', display: 'flex', alignItems: 'center', gap: 12,
              animation: 'hd-fadeUp 0.35s',
            }}>
              <div style={{ width: 38, height: 38, borderRadius: 10, background: '#F7F4EE', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, flexShrink: 0 }}>{s.emoji}</div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ fontSize: 13, color: '#2C2A25', margin: 0, fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{s.name}</p>
                <span style={{ display: 'inline-block', marginTop: 4, fontSize: 9, padding: '2px 8px', borderRadius: 6, background: 'rgba(186,117,23,0.10)', color: '#BA7517', fontWeight: 600, letterSpacing: 0.3 }}>{s.dur}</span>
              </div>
              <p style={{ fontSize: 14, color: '#BA7517', margin: 0, fontWeight: 700, whiteSpace: 'nowrap', flexShrink: 0 }}>{s.price.toLocaleString('fr-FR')} <span style={{ fontSize: 9, opacity: 0.7 }}>DA</span></p>
            </div>
          ))
        ) : (
          consos.map((c, i) => {
            const stockPct = Math.min((c.stock / Math.max(c.min, 10)) * 100, 100)
            const isLow = c.stock < c.min
            const wasBoosted = phase === 4 && i === 2
            return (
              <div key={i} style={{
                background: 'white', borderRadius: 14, padding: '12px 14px',
                border: wasBoosted ? '1px solid rgba(186,117,23,0.5)' : '1px solid rgba(196,184,158,0.5)',
                display: 'flex', alignItems: 'center', gap: 12, animation: 'hd-fadeUp 0.35s',
                boxShadow: wasBoosted ? '0 0 0 3px rgba(186,117,23,0.15)' : 'none', transition: 'all 0.4s',
              }}>
                <div style={{ width: 38, height: 38, borderRadius: 10, background: '#F7F4EE', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, flexShrink: 0 }}>{c.emoji}</div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                    <p style={{ fontSize: 13, color: '#2C2A25', margin: 0, fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{c.name}</p>
                    {isLow && <span style={{ fontSize: 8, padding: '2px 6px', borderRadius: 5, background: 'rgba(220,38,38,0.10)', color: '#DC2626', fontWeight: 700, letterSpacing: 0.5, textTransform: 'uppercase' }}>Bas</span>}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ width: 18, height: 18, borderRadius: 5, background: '#F7F4EE', border: '1px solid rgba(196,184,158,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#8A8275', fontSize: 11, fontWeight: 600, flexShrink: 0 }}>−</span>
                    <div style={{ flex: 1, height: 4, borderRadius: 999, background: 'rgba(196,184,158,0.3)', overflow: 'hidden', minWidth: 0 }}>
                      <div style={{ width: `${stockPct}%`, height: '100%', background: isLow ? '#DC2626' : '#BA7517', transition: 'width 0.6s cubic-bezier(0.16,1,0.3,1)' }}/>
                    </div>
                    <span style={{
                      width: 18, height: 18, borderRadius: 5,
                      background: (phase === 3 || wasBoosted) ? '#BA7517' : '#F7F4EE',
                      border: (phase === 3 || wasBoosted) ? '1px solid #BA7517' : '1px solid rgba(196,184,158,0.6)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      color: (phase === 3 || wasBoosted) ? '#FFF6E0' : '#BA7517',
                      fontSize: 11, fontWeight: 600, flexShrink: 0, transition: 'all 0.3s',
                    }}>+</span>
                    <span style={{ fontSize: 10, color: '#8A8275', whiteSpace: 'nowrap', flexShrink: 0 }}>{c.stock} {c.unit}</span>
                  </div>
                </div>
                <p style={{ fontSize: 14, color: '#BA7517', margin: 0, fontWeight: 700, whiteSpace: 'nowrap', flexShrink: 0 }}>{c.price} <span style={{ fontSize: 9, opacity: 0.7 }}>DA</span></p>
              </div>
            )
          })
        )}
      </div>
      <Cursor x={cur.x} y={cur.y} clicking={clicking}/>
    </div>
  )
}
