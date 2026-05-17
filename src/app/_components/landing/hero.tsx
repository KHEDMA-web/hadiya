'use client'

import { useState, useEffect } from 'react'
import { useReveal, Parallax, Icon, PhoneFrame } from './shared'
import Link from 'next/link'

interface LandingHeroProps {
  onCTA: () => void
}

export default function LandingHero({ onCTA }: LandingHeroProps) {
  const [ref, visible] = useReveal(0)
  const [points, setPoints] = useState(0)

  useEffect(() => {
    const target = 2840
    let cur = 0
    const start = performance.now()
    let raf: number
    const tick = (t: number) => {
      const p = Math.min((t - start) / 1600, 1)
      cur = Math.floor(target * (1 - Math.pow(1 - p, 3)))
      setPoints(cur)
      if (p < 1) raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [])

  return (
    <section ref={ref as React.RefObject<HTMLDivElement>} style={{
      position: 'relative', background: '#F7F4EE', overflow: 'hidden',
      padding: '120px 40px 80px',
    }}>
      <div style={{
        position: 'absolute', top: '20%', left: '50%', transform: 'translate(-50%, -50%)',
        width: 900, height: 600,
        background: 'radial-gradient(ellipse at center, rgba(186,117,23,0.10) 0%, transparent 70%)',
        pointerEvents: 'none',
      }}/>

      <div style={{ maxWidth: 1280, margin: '0 auto', position: 'relative', display: 'grid', gridTemplateColumns: '1.15fr 1fr', gap: 80, alignItems: 'center' }}>

        {/* Left: copy */}
        <div>
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 10,
            padding: '8px 16px', borderRadius: 999,
            background: 'rgba(186,117,23,0.08)', border: '1px solid rgba(186,117,23,0.20)',
            color: '#BA7517', fontSize: 10, letterSpacing: '0.22em', textTransform: 'uppercase', fontWeight: 600,
            opacity: visible ? 1 : 0, transform: visible ? 'translateY(0)' : 'translateY(12px)',
            transition: 'all 0.8s cubic-bezier(0.16,1,0.3,1)',
          }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#BA7517' }}/>
            Hadiya · pour les salons & spas premium
          </div>

          <h1 style={{
            fontFamily: 'var(--font-cormorant)',
            fontSize: 'clamp(48px, 6.5vw, 92px)', fontWeight: 300,
            lineHeight: 0.98, letterSpacing: '-0.02em', color: '#2C2A25',
            margin: '32px 0 0',
            opacity: visible ? 1 : 0, transform: visible ? 'translateY(0)' : 'translateY(20px)',
            transition: 'all 1s cubic-bezier(0.16,1,0.3,1) 150ms',
          }}>
            L&apos;art de<br/>
            <span style={{ fontStyle: 'italic', color: '#BA7517' }}>fidéliser.</span>
          </h1>

          <p style={{
            marginTop: 28, maxWidth: 480, fontSize: 17, lineHeight: 1.65, color: '#6B6560',
            opacity: visible ? 1 : 0, transform: visible ? 'translateY(0)' : 'translateY(20px)',
            transition: 'all 1s cubic-bezier(0.16,1,0.3,1) 300ms',
          }}>
            Une plateforme posée et complète pour les salons qui ont compris qu&apos;un client qui revient vaut dix nouveaux. Caisse, cartes cadeaux, réservations — tout retient autour de la fidélité.
          </p>

          <div style={{
            marginTop: 40, display: 'flex', gap: 14, alignItems: 'center', flexWrap: 'wrap',
            opacity: visible ? 1 : 0, transform: visible ? 'translateY(0)' : 'translateY(20px)',
            transition: 'all 1s cubic-bezier(0.16,1,0.3,1) 450ms',
          }}>
            <button onClick={onCTA} className="hd-btn-gold" style={{
              padding: '18px 32px', borderRadius: 14,
              display: 'inline-flex', alignItems: 'center', gap: 12,
            }}>
              Voir la démo en ligne
              <span style={{ display: 'inline-block', transition: 'transform 0.3s' }}>{Icon.arrow(14)}</span>
            </button>
            <a href="#fonctionnalites" style={{
              padding: '17px 28px', borderRadius: 14, border: '1px solid rgba(44,42,37,0.15)',
              color: '#2C2A25', fontSize: 10, letterSpacing: '0.22em', textTransform: 'uppercase',
              fontWeight: 500, textDecoration: 'none', transition: 'all 0.2s',
            }}>
              Explorer les fonctionnalités
            </a>
          </div>

          <div style={{
            marginTop: 64, display: 'flex', gap: 32, flexWrap: 'wrap',
            opacity: visible ? 1 : 0, transform: visible ? 'translateY(0)' : 'translateY(20px)',
            transition: 'all 1s cubic-bezier(0.16,1,0.3,1) 600ms',
          }}>
            {[
              ['Fidélité', '4 niveaux configurables'],
              ['Cartes cadeaux', 'Brandées par salon'],
            ].map(([t, s]) => (
              <div key={t}>
                <p style={{ fontFamily: 'var(--font-cormorant)', fontSize: 22, color: '#2C2A25', margin: 0, fontWeight: 500 }}>{t}</p>
                <p style={{ fontSize: 12, color: '#8A8275', margin: '4px 0 0', letterSpacing: '0.04em' }}>{s}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Right: floating phone */}
        <div style={{ position: 'relative', height: 620, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
          <Parallax speed={0.10}>
            <div style={{
              position: 'absolute', top: 60, left: 30, width: 220, height: 140,
              background: 'linear-gradient(135deg, #BA7517 0%, #8a560f 100%)',
              borderRadius: 18, boxShadow: '0 30px 60px -15px rgba(186,117,23,0.4)',
              transform: 'rotate(-8deg)',
              opacity: visible ? 1 : 0, transition: 'opacity 1.5s ease 400ms',
            }}>
              <div style={{ padding: 20, color: '#F7F4EE', fontFamily: 'var(--font-cormorant)' }}>
                <p style={{ fontSize: 10, letterSpacing: '0.3em', opacity: 0.7, margin: 0, textTransform: 'uppercase' }}>Carte cadeau</p>
                <p style={{ fontSize: 32, fontWeight: 300, margin: '4px 0 0', letterSpacing: '-0.02em' }}>5 000 <span style={{ fontSize: 14, opacity: 0.7 }}>DA</span></p>
                <p style={{ fontSize: 9, letterSpacing: '0.2em', opacity: 0.6, margin: '12px 0 0', fontFamily: 'var(--font-geist-sans)' }}>SPA AL JANNAH</p>
              </div>
            </div>

            <PhoneFrame width={300} height={600}>
              <CarteClientMock points={points}/>
            </PhoneFrame>
          </Parallax>
        </div>
      </div>
    </section>
  )
}

function CarteClientMock({ points = 2840 }: { points: number }) {
  const pct = Math.min((points / 5000) * 100, 100)
  return (
    <div style={{ height: '100%', padding: '52px 18px 24px', display: 'flex', flexDirection: 'column', gap: 14, fontFamily: 'var(--font-geist-sans)' }}>
      <div style={{ textAlign: 'center' }}>
        <p style={{ fontSize: 10, letterSpacing: '0.3em', color: 'rgba(247,244,238,0.4)', textTransform: 'uppercase', margin: 0 }}>Spa Al Jannah</p>
        <p style={{ fontFamily: 'var(--font-cormorant)', fontSize: 22, color: '#F7F4EE', margin: '2px 0 0', fontWeight: 300, fontStyle: 'italic' }}>Yasmine Belkacem</p>
      </div>

      <div style={{
        background: 'linear-gradient(145deg, #6E6E78 0%, #3E3E48 100%)',
        border: '1px solid rgba(216,216,216,0.18)', borderRadius: 18, padding: '18px 16px',
        boxShadow: '0 10px 30px -10px rgba(0,0,0,0.4)', position: 'relative', overflow: 'hidden',
      }}>
        <div style={{
          position: 'absolute', inset: 0,
          background: 'linear-gradient(135deg, rgba(255,255,255,0.08) 0%, transparent 40%, transparent 60%, rgba(255,255,255,0.04) 100%)',
          pointerEvents: 'none',
        }}/>
        <div style={{ position: 'relative' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <p style={{ fontSize: 9, letterSpacing: '0.22em', color: 'rgba(247,244,238,0.55)', textTransform: 'uppercase', margin: 0, fontWeight: 600 }}>Solde</p>
            <span style={{
              fontSize: 8, fontWeight: 700, letterSpacing: '0.22em', padding: '3px 9px', borderRadius: 999,
              background: 'rgba(255,255,255,0.16)', color: '#E0E0E0', textTransform: 'uppercase',
            }}>Argent</span>
          </div>
          <p style={{ fontFamily: 'var(--font-cormorant)', fontSize: 36, color: '#F7F4EE', margin: '6px 0 0', fontWeight: 300, letterSpacing: '-0.02em' }}>
            12 500 <span style={{ fontSize: 14, color: '#D8D8D8' }}>DA</span>
          </p>
          <div style={{ marginTop: 18, display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
            <span style={{ fontSize: 9, letterSpacing: '0.22em', color: '#FFD88A', textTransform: 'uppercase', fontWeight: 600 }}>vers Or</span>
            <span style={{ fontSize: 10, color: 'rgba(247,244,238,0.55)' }}>{points.toLocaleString('fr-FR')} / 5 000 pts</span>
          </div>
          <div style={{ marginTop: 6, height: 4, borderRadius: 999, background: 'rgba(255,255,255,0.10)', overflow: 'hidden' }}>
            <div style={{
              width: `${pct}%`, height: '100%',
              background: 'linear-gradient(90deg, #BA7517 0%, #FFD88A 100%)',
              transition: 'width 0.4s ease', boxShadow: '0 0 12px rgba(186,117,23,0.5)',
            }}/>
          </div>
          <p style={{ fontSize: 10, color: 'rgba(247,244,238,0.5)', margin: '10px 0 0' }}>
            Plus que <span style={{ color: '#FFD88A', fontWeight: 600 }}>{(5000 - points).toLocaleString('fr-FR')} pts</span> jusqu&apos;à <span style={{ color: '#FFD88A' }}>l&apos;Or</span>
          </p>
        </div>
      </div>

      <div>
        <p style={{ fontSize: 9, letterSpacing: '0.22em', color: 'rgba(247,244,238,0.4)', textTransform: 'uppercase', margin: '4px 0 8px' }}>Activité récente</p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {[
            ['Soin visage', '+45 pts', '#BA7517'],
            ['Recharge', '+ 3 000 DA', '#F7F4EE'],
            ['Hammam', '+90 pts', '#BA7517'],
          ].map(([label, val, color]) => (
            <div key={label} style={{
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              padding: '8px 12px', borderRadius: 12, background: 'rgba(247,244,238,0.04)', fontSize: 11,
            }}>
              <span style={{ color: 'rgba(247,244,238,0.7)' }}>{label}</span>
              <span style={{ color, fontWeight: 500 }}>{val}</span>
            </div>
          ))}
        </div>
      </div>

      <div style={{ flex: 1 }}/>
      <div style={{ textAlign: 'center' }}>
        <span style={{ fontSize: 9, letterSpacing: '0.3em', color: 'rgba(186,117,23,0.6)', textTransform: 'uppercase' }}>Propulsé par Hadiya</span>
      </div>
    </div>
  )
}
