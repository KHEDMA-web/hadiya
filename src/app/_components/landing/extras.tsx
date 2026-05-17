'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useReveal, useMedia, Icon } from './shared'

// ── NavBar ────────────────────────────────────────────────────
interface NavBarProps { onCTA: () => void }

export function NavBar({ onCTA }: NavBarProps) {
  const [scrolled, setScrolled] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const isMobile = useMedia('(max-width: 640px)')

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 30)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => { if (!isMobile) setMenuOpen(false) }, [isMobile])

  useEffect(() => {
    document.body.style.overflow = menuOpen ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [menuOpen])

  const jumpToFeature = (featureId: string) => {
    setMenuOpen(false)
    window.dispatchEvent(new CustomEvent('hadiya:setFeature', { detail: featureId }))
    requestAnimationFrame(() => {
      document.getElementById('fonctionnalites')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    })
  }

  const navLinks = [
    { label: 'Fonctionnalités', feature: 'fidelite' },
    { label: 'Carte cadeau',    feature: 'cadeaux' },
    { label: 'Fidélité',        feature: 'fidelite' },
  ]

  return (
    <>
      <nav style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100,
        paddingTop: `max(${scrolled ? 14 : 22}px, env(safe-area-inset-top))`,
        paddingBottom: scrolled ? 14 : 22,
        paddingLeft: `max(${isMobile ? 16 : 40}px, env(safe-area-inset-left))`,
        paddingRight: `max(${isMobile ? 16 : 40}px, env(safe-area-inset-right))`,
        background: scrolled ? 'rgba(247,244,238,0.88)' : 'transparent',
        backdropFilter: scrolled ? 'blur(20px)' : 'none',
        borderBottom: scrolled ? '1px solid rgba(196,184,158,0.3)' : '1px solid transparent',
        transition: 'all 0.3s cubic-bezier(0.16,1,0.3,1)',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <p style={{ fontFamily: 'var(--font-cormorant)', fontSize: 26, color: '#2C2A25', margin: 0, fontWeight: 400, letterSpacing: '-0.01em' }}>
          Hadiya<span style={{ color: '#BA7517' }}>.</span>
        </p>

        {/* Desktop links */}
        {!isMobile && (
          <div style={{ display: 'flex', gap: 32, alignItems: 'center' }}>
            {navLinks.map(l => (
              <button key={l.label} onClick={() => jumpToFeature(l.feature)} style={{
                fontSize: 10, letterSpacing: '0.22em', textTransform: 'uppercase', fontWeight: 500,
                color: '#2C2A25', background: 'transparent', border: 'none', cursor: 'pointer',
                opacity: 0.7, transition: 'opacity 0.2s', fontFamily: 'var(--font-geist-sans)', padding: 0,
              }}
              onMouseEnter={e => (e.currentTarget.style.opacity = '1')}
              onMouseLeave={e => (e.currentTarget.style.opacity = '0.7')}
              >{l.label}</button>
            ))}
            <Link href="/login" style={{
              fontSize: 10, letterSpacing: '0.22em', textTransform: 'uppercase', fontWeight: 500,
              color: '#2C2A25', textDecoration: 'none', opacity: 0.7, transition: 'opacity 0.2s',
            }}>Se connecter</Link>
            <button onClick={onCTA} className="hd-btn-gold" style={{ padding: '12px 22px', fontSize: 9 }}>
              Voir la démo
            </button>
          </div>
        )}

        {/* Mobile burger */}
        {isMobile && (
          <button onClick={() => setMenuOpen(o => !o)} style={{
            width: 38, height: 38, borderRadius: 10,
            background: menuOpen ? 'rgba(186,117,23,0.1)' : 'transparent',
            border: '1px solid rgba(44,42,37,0.15)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer', transition: 'all 0.2s', padding: 0,
          }}>
            {menuOpen ? (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#2C2A25" strokeWidth="2" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            ) : (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#2C2A25" strokeWidth="2" strokeLinecap="round"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></svg>
            )}
          </button>
        )}
      </nav>

      {/* Mobile drawer */}
      {menuOpen && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 99,
          background: '#F7F4EE',
          display: 'flex', flexDirection: 'column',
          paddingTop: 'max(80px, env(safe-area-inset-top))',
          paddingBottom: 'max(32px, env(safe-area-inset-bottom))',
          paddingLeft: 'max(24px, env(safe-area-inset-left))',
          paddingRight: 'max(24px, env(safe-area-inset-right))',
          animation: 'hd-slideUp 0.35s cubic-bezier(0.16,1,0.3,1)',
        }}>
          <div style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
            {navLinks.map(l => (
              <button key={l.label} onClick={() => jumpToFeature(l.feature)} style={{
                textAlign: 'left', padding: '16px 0',
                fontFamily: 'var(--font-cormorant)', fontSize: 42, fontWeight: 300,
                color: '#2C2A25', background: 'none', border: 'none',
                borderBottom: '1px solid rgba(196,184,158,0.25)',
                cursor: 'pointer', lineHeight: 1.1,
              }}>{l.label}</button>
            ))}
            <Link href="/login" onClick={() => setMenuOpen(false)} style={{
              textAlign: 'left', padding: '16px 0',
              fontFamily: 'var(--font-cormorant)', fontSize: 42, fontWeight: 300,
              color: '#2C2A25', textDecoration: 'none', display: 'block',
              borderBottom: '1px solid rgba(196,184,158,0.25)', lineHeight: 1.1,
            }}>Se connecter</Link>
          </div>
          <button onClick={() => { setMenuOpen(false); onCTA() }} className="hd-btn-gold" style={{
            width: '100%', padding: '18px 0', fontSize: 10, marginTop: 32,
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12,
          }}>
            Voir la démo en ligne {Icon.arrow(14)}
          </button>
        </div>
      )}
    </>
  )
}

// ── Differentiators ───────────────────────────────────────────
export function Differentiators() {
  const [ref, visible] = useReveal()
  return (
    <section ref={ref as React.RefObject<HTMLDivElement>} className="hd-section" style={{ background: '#F7F4EE', position: 'relative' }}>
      <div style={{ maxWidth: 1280, margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: 80 }}>
          <p style={{ fontSize: 10, letterSpacing: '0.32em', textTransform: 'uppercase', color: '#BA7517', fontWeight: 600, margin: 0 }}>Ce qui fait la différence</p>
          <h2 style={{
            fontFamily: 'var(--font-cormorant)', fontSize: 'clamp(38px, 5vw, 64px)', fontWeight: 300,
            lineHeight: 1.05, letterSpacing: '-0.02em', color: '#2C2A25', margin: '20px 0 0',
            maxWidth: 800, marginLeft: 'auto', marginRight: 'auto',
          }}>
            Trois choses que <span style={{ fontStyle: 'italic', color: '#BA7517' }}>personne d&apos;autre</span> ne fait comme nous.
          </h2>
        </div>
        <div className="hd-diff-grid">
          <DiffCard visible={visible} delay={0}   kicker="01 — Carte cadeau" title="Brandée par salon."         body="Chaque salon a sa propre page de paiement, à son logo, son nom, ses couleurs. Vendre une carte cadeau devient un acte de marque, pas une transaction anonyme." preview={<MiniGiftPreview/>}/>
          <DiffCard visible={visible} delay={120} kicker="02 — NFC / RFID"   title="Cartes physiques. Vrai."   body="Carte plastique, bracelet, porte-clé. Approche, scan, débit. Pour les habituées qui veulent leur carte au comptoir comme à la salle de sport." preview={<MiniNFCPreview/>}/>
          <DiffCard visible={visible} delay={240} kicker="03 — Fidélité"     title="Quatre niveaux à votre image." body="Bronze, Argent, Or, Platine. Seuils, points par 100 DA, avantages par niveau — tout est configurable par salon. Votre programme, vos règles." preview={<MiniLevelsPreview/>}/>
        </div>
      </div>
    </section>
  )
}

function DiffCard({ kicker, title, body, preview, visible, delay = 0 }: {
  kicker: string; title: string; body: string; preview: React.ReactNode; visible: boolean; delay?: number
}) {
  return (
    <div style={{
      background: 'linear-gradient(160deg, #FFFFFF 0%, #FAF7EF 100%)',
      border: '1px solid rgba(196,184,158,0.5)', borderRadius: 22, padding: 28,
      transition: `opacity 0.9s cubic-bezier(0.16,1,0.3,1) ${delay}ms, transform 0.9s cubic-bezier(0.16,1,0.3,1) ${delay}ms`,
      opacity: visible ? 1 : 0, transform: visible ? 'translateY(0)' : 'translateY(40px)',
      display: 'flex', flexDirection: 'column', gap: 20,
    }}>
      <div className="hd-diff-preview" style={{ borderRadius: 14, background: '#2C2A25', overflow: 'hidden', position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        {preview}
      </div>
      <div>
        <p style={{ fontSize: 10, letterSpacing: '0.22em', color: '#BA7517', textTransform: 'uppercase', margin: 0, fontWeight: 600 }}>{kicker}</p>
        <h3 style={{ fontFamily: 'var(--font-cormorant)', fontSize: 26, fontWeight: 400, color: '#2C2A25', margin: '10px 0 14px', lineHeight: 1.2 }}>{title}</h3>
        <p style={{ fontSize: 14, lineHeight: 1.65, color: '#6B6560', margin: 0 }}>{body}</p>
      </div>
    </div>
  )
}

function MiniGiftPreview() {
  return (
    <div style={{ width: 200, padding: 16, background: 'linear-gradient(135deg, #BA7517 0%, #8A560F 100%)', borderRadius: 14, color: '#FFF6E0', boxShadow: '0 18px 40px -10px rgba(186,117,23,0.5)', transform: 'rotate(-3deg)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
        <p style={{ fontSize: 8, letterSpacing: '0.3em', textTransform: 'uppercase', margin: 0, opacity: 0.7 }}>Carte cadeau</p>
        <span style={{ opacity: 0.5 }}>{Icon.qr(14)}</span>
      </div>
      <p style={{ fontFamily: 'var(--font-cormorant)', fontSize: 28, margin: '12px 0 0', fontWeight: 300 }}>10 000 <span style={{ fontSize: 11, opacity: 0.7 }}>DA</span></p>
      <p style={{ fontSize: 8, letterSpacing: '0.22em', opacity: 0.6, margin: '14px 0 0', textTransform: 'uppercase' }}>Spa Al Jannah</p>
    </div>
  )
}

function MiniNFCPreview() {
  return (
    <div style={{ position: 'relative', width: 180, height: 140 }}>
      <div style={{ position: 'absolute', left: 0, top: 20, width: 80, height: 130, borderRadius: 12, background: '#1E1C18', border: '1px solid rgba(186,117,23,0.3)' }}/>
      <div style={{ position: 'absolute', right: 0, top: 0, width: 130, height: 80, borderRadius: 10, background: 'linear-gradient(135deg, #F7F4EE 0%, #E8E2D5 100%)', transform: 'rotate(-12deg) translateX(20px)', boxShadow: '0 14px 30px -8px rgba(0,0,0,0.3)', padding: 10 }}>
        <p style={{ fontSize: 7, letterSpacing: '0.3em', color: '#BA7517', margin: 0, textTransform: 'uppercase', fontWeight: 600 }}>Hadiya</p>
        <p style={{ fontFamily: 'var(--font-cormorant)', fontSize: 12, color: '#2C2A25', margin: '4px 0 0', fontWeight: 500 }}>Carte fidélité</p>
        <div style={{ position: 'absolute', right: 8, bottom: 8, color: '#BA7517' }}>{Icon.nfc(20)}</div>
      </div>
      <div style={{ position: 'absolute', left: 70, top: 50, width: 30, height: 30, borderRadius: '50%', border: '2px solid rgba(186,117,23,0.4)', animation: 'hd-scan-pulse 1.5s ease-out infinite' }}/>
    </div>
  )
}

function MiniLevelsPreview() {
  const cards = [
    { name: 'Bronze',  bg: 'linear-gradient(135deg, #8B5E3C 0%, #6B4423 100%)', badge: '#E8C49B', solde: '4 200',  pts:  280 },
    { name: 'Argent',  bg: 'linear-gradient(135deg, #6E6E78 0%, #3E3E48 100%)', badge: '#E0E0E0', solde: '12 800', pts:  720 },
    { name: 'Or',      bg: 'linear-gradient(135deg, #D89A3E 0%, #8A560F 100%)', badge: '#FFE9B0', solde: '28 500', pts: 2150 },
    { name: 'Platine', bg: 'linear-gradient(135deg, #6E5FB8 0%, #3A2E78 100%)', badge: '#D4C7F2', solde: '64 000', pts: 5393 },
  ]
  const [auto, setAuto] = useState(0)
  const [hover, setHover] = useState<number | null>(null)
  useEffect(() => {
    if (hover !== null) return
    const id = setInterval(() => setAuto(a => (a + 1) % cards.length), 1600)
    return () => clearInterval(id)
  }, [hover, cards.length])
  const active = hover !== null ? hover : auto

  return (
    <div style={{ position: 'relative', width: 240, height: 180 }} onMouseLeave={() => setHover(null)}>
      <div style={{ position: 'absolute', left: 0, right: 0, bottom: 30, display: 'flex', gap: 6, justifyContent: 'center', perspective: 600 }}>
        {cards.map((c, i) => {
          const isActive = i === active
          const isDim = hover !== null && hover !== i
          return (
            <div key={c.name} onMouseEnter={() => setHover(i)} style={{
              width: 52, height: 92, padding: 7, background: c.bg, borderRadius: 8,
              boxShadow: isActive ? '0 16px 28px -4px rgba(0,0,0,0.55), 0 0 0 1px rgba(255,246,224,0.3), 0 0 22px rgba(186,117,23,0.22)' : '0 6px 14px -4px rgba(0,0,0,0.4)',
              transform: isActive ? 'translateY(-18px) scale(1.12) rotateX(0deg)' : 'translateY(0) scale(1) rotateX(8deg)',
              transformOrigin: 'bottom center',
              opacity: isDim ? 0.4 : 1,
              transition: 'transform 0.5s cubic-bezier(0.16,1,0.3,1), opacity 0.3s, box-shadow 0.3s',
              cursor: 'pointer', color: '#FFF6E0',
              display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
              zIndex: isActive ? 20 : 1, position: 'relative', overflow: 'hidden',
            }}>
              <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(135deg, rgba(255,255,255,0.10) 0%, transparent 45%)', pointerEvents: 'none' }}/>
              <span style={{ fontSize: 6, letterSpacing: '0.28em', opacity: 0.65, textTransform: 'uppercase', fontWeight: 700, position: 'relative' }}>Hadiya</span>
              <div style={{ position: 'relative' }}>
                <p style={{ fontFamily: 'var(--font-cormorant)', fontSize: 11, margin: 0, fontWeight: 500, lineHeight: 1, letterSpacing: '-0.01em' }}>{c.solde}</p>
                <p style={{ fontSize: 5.5, letterSpacing: '0.22em', opacity: 0.65, margin: '2px 0 5px', textTransform: 'uppercase', fontWeight: 600 }}>DA</p>
                <span style={{ display: 'inline-block', fontSize: 6, fontWeight: 700, letterSpacing: '0.18em', padding: '2px 5px', borderRadius: 999, background: 'rgba(255,255,255,0.20)', color: c.badge, textTransform: 'uppercase' }}>{c.name}</span>
              </div>
            </div>
          )
        })}
      </div>
      <div style={{ position: 'absolute', left: 0, right: 0, bottom: 0, textAlign: 'center', fontSize: 9, letterSpacing: '0.22em', textTransform: 'uppercase', color: 'rgba(247,244,238,0.55)', fontWeight: 600 }}>
        <span style={{ color: '#BA7517' }}>●</span>{' '}
        <span style={{ color: '#F7F4EE' }} key={cards[active].name}>{cards[active].name}</span>
        {' · '}
        <span>{cards[active].pts.toLocaleString('fr-FR')} pts</span>
      </div>
    </div>
  )
}

// ── Call to action ────────────────────────────────────────────
interface CTAProps { onCTA: () => void }

export function CallToAction({ onCTA }: CTAProps) {
  const [ref, visible] = useReveal()
  return (
    <section ref={ref as React.RefObject<HTMLDivElement>} className="hd-section" style={{ background: '#2C2A25', position: 'relative', overflow: 'hidden' }}>
      <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', width: 800, height: 600, background: 'radial-gradient(ellipse at center, rgba(186,117,23,0.20) 0%, transparent 60%)', pointerEvents: 'none' }}/>
      <div style={{
        maxWidth: 900, margin: '0 auto', textAlign: 'center', position: 'relative',
        opacity: visible ? 1 : 0, transform: visible ? 'translateY(0)' : 'translateY(30px)',
        transition: 'all 1s cubic-bezier(0.16,1,0.3,1)',
      }}>
        <p style={{ fontSize: 10, letterSpacing: '0.32em', textTransform: 'uppercase', color: '#BA7517', fontWeight: 600, margin: 0 }}>Voir avant de croire</p>
        <h2 style={{ fontFamily: 'var(--font-cormorant)', fontSize: 'clamp(44px, 6vw, 80px)', fontWeight: 300, lineHeight: 1.0, letterSpacing: '-0.02em', color: '#F7F4EE', margin: '24px 0 0' }}>
          Hadiya, <span style={{ fontStyle: 'italic', color: '#BA7517' }}>en direct.</span>
        </h2>
        <p style={{ fontSize: 17, lineHeight: 1.65, color: 'rgba(247,244,238,0.6)', margin: '28px auto 0', maxWidth: 540 }}>
          Une démo posée, sans engagement, dans le rythme de votre salon. Nous prenons le temps qu&apos;il faut.
        </p>
        <div style={{ marginTop: 44, display: 'flex', gap: 14, justifyContent: 'center', flexWrap: 'wrap' }}>
          <button onClick={onCTA} className="hd-btn-gold" style={{ padding: '20px 36px', borderRadius: 14, display: 'inline-flex', alignItems: 'center', gap: 14, fontSize: 11 }}>
            Voir la démo en ligne {Icon.arrow(14)}
          </button>
          <a href="https://wa.me/213XXXXXXXXX" style={{
            padding: '19px 30px', borderRadius: 14, border: '1px solid rgba(247,244,238,0.15)',
            color: 'rgba(247,244,238,0.7)', fontSize: 10, letterSpacing: '0.22em', textTransform: 'uppercase',
            fontWeight: 500, textDecoration: 'none', transition: 'all 0.2s',
          }}>
            WhatsApp · réserver un créneau
          </a>
        </div>
      </div>
    </section>
  )
}

// ── Footer ────────────────────────────────────────────────────
export function Footer() {
  return (
    <footer className="hd-footer" style={{ background: '#1E1C18', borderTop: '1px solid rgba(186,117,23,0.15)' }}>
      <div style={{ maxWidth: 1280, margin: '0 auto' }}>
      <div className="hd-footer-grid">
        <div className="hd-footer-brand">
          <p style={{ fontFamily: 'var(--font-cormorant)', fontSize: 28, color: '#F7F4EE', margin: 0, fontWeight: 300, letterSpacing: '-0.01em' }}>
            Hadiya<span style={{ color: '#BA7517' }}>.</span>
          </p>
          <p style={{ fontSize: 13, color: 'rgba(247,244,238,0.4)', margin: '12px 0 0', lineHeight: 1.6, maxWidth: 340 }}>
            La plateforme posée et complète pour les salons & spas premium en Algérie.
          </p>
        </div>
        <FooterCol title="Produit"  links={['Fonctionnalités', 'Cartes cadeaux', 'Fidélité', 'Réservations']}/>
        <FooterCol title="Société"  links={['Démo', 'Contact', 'WhatsApp', 'À propos']}/>
        <FooterCol title="Légal"    links={['Confidentialité', 'CGU', 'RGPD']}/>
      </div>
      <div className="hd-footer-bottom" style={{
        marginTop: 48, paddingTop: 28,
        borderTop: '1px solid rgba(247,244,238,0.06)',
      }}>
        <span style={{ fontSize: 10, letterSpacing: '0.22em', color: 'rgba(247,244,238,0.3)', textTransform: 'uppercase' }}>© 2026 Hadiya · Fait en Algérie 🇩🇿</span>
        <span style={{ fontSize: 10, letterSpacing: '0.22em', color: 'rgba(186,117,23,0.5)', textTransform: 'uppercase' }}>L&apos;art de fidéliser</span>
      </div>
      </div>
    </footer>
  )
}

function FooterCol({ title, links }: { title: string; links: string[] }) {
  return (
    <div>
      <p style={{ fontSize: 10, letterSpacing: '0.22em', color: '#BA7517', textTransform: 'uppercase', fontWeight: 600, margin: '0 0 16px' }}>{title}</p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {links.map(l => (
          <a key={l} href="#" style={{ fontSize: 13, color: 'rgba(247,244,238,0.6)', textDecoration: 'none', transition: 'color 0.2s' }}>{l}</a>
        ))}
      </div>
    </div>
  )
}
