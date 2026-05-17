'use client'

import { useReveal, Icon } from './shared'

export default function PaiementLocal() {
  const [ref, visible] = useReveal()

  return (
    <section id="paiement" ref={ref as React.RefObject<HTMLDivElement>} style={{
      background: '#2C2A25', padding: '120px 40px', position: 'relative', overflow: 'hidden',
    }}>
      <div style={{
        position: 'absolute', top: '20%', left: '50%', transform: 'translate(-50%, -50%)',
        width: 900, height: 500,
        background: 'radial-gradient(ellipse at center, rgba(186,117,23,0.10) 0%, transparent 70%)',
        pointerEvents: 'none',
      }}/>

      <div style={{ maxWidth: 1280, margin: '0 auto', position: 'relative' }}>
        <div style={{ textAlign: 'center', marginBottom: 72 }}>
          <p style={{
            fontSize: 10, letterSpacing: '0.32em', textTransform: 'uppercase',
            color: '#BA7517', fontWeight: 600, margin: 0,
            opacity: visible ? 1 : 0, transition: 'opacity 0.8s',
          }}>Paiement local — CIB & Edahabia</p>
          <h2 style={{
            fontFamily: 'var(--font-cormorant)', fontSize: 'clamp(38px, 5vw, 64px)', fontWeight: 300,
            lineHeight: 1.05, letterSpacing: '-0.02em', color: '#F7F4EE', margin: '20px 0 18px',
            maxWidth: 820, marginLeft: 'auto', marginRight: 'auto',
            opacity: visible ? 1 : 0, transform: visible ? 'translateY(0)' : 'translateY(20px)',
            transition: 'all 1s cubic-bezier(0.16,1,0.3,1) 100ms',
          }}>
            Un lien. <span style={{ fontStyle: 'italic', color: '#BA7517' }}>Vos clientes paient.</span>
          </h2>
          <p style={{
            fontSize: 17, lineHeight: 1.65, color: 'rgba(247,244,238,0.6)', maxWidth: 620, margin: '0 auto',
            opacity: visible ? 1 : 0, transition: 'opacity 1s 250ms',
          }}>
            Votre salon a son propre lien de paiement. Partagez-le sur Instagram, WhatsApp, votre bio — vos clientes règlent par CIB ou Edahabia, depuis chez elles, en quelques tapes.
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 60px 1fr 60px 1fr', gap: 0, alignItems: 'center' }}>
          <StepFrame delay={150} visible={visible}>
            <InstagramBioMock/>
            <StepCaption num="01" label="Partagez le lien" hint="Bio Instagram · WhatsApp · stories"/>
          </StepFrame>
          <ArrowBetween visible={visible} delay={400}/>
          <StepFrame delay={550} visible={visible}>
            <PaymentPageMock/>
            <StepCaption num="02" label="Page brandée" hint="Logo, nom, couleurs de votre salon"/>
          </StepFrame>
          <ArrowBetween visible={visible} delay={800}/>
          <StepFrame delay={950} visible={visible}>
            <PaymentMethodMock/>
            <StepCaption num="03" label="CIB ou Edahabia" hint="Paiement local sécurisé · DA"/>
          </StepFrame>
        </div>
      </div>
    </section>
  )
}

function StepFrame({ children, delay, visible }: { children: React.ReactNode; delay: number; visible: boolean }) {
  return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 22,
      opacity: visible ? 1 : 0, transform: visible ? 'translateY(0)' : 'translateY(30px)',
      transition: `all 1s cubic-bezier(0.16,1,0.3,1) ${delay}ms`,
    }}>
      {children}
    </div>
  )
}

function StepCaption({ num, label, hint }: { num: string; label: string; hint: string }) {
  return (
    <div style={{ textAlign: 'center', maxWidth: 260 }}>
      <p style={{ fontSize: 10, letterSpacing: '0.32em', color: '#BA7517', textTransform: 'uppercase', margin: 0, fontWeight: 600 }}>{num}</p>
      <p style={{ fontFamily: 'var(--font-cormorant)', fontSize: 22, color: '#F7F4EE', margin: '8px 0 6px', fontWeight: 400 }}>{label}</p>
      <p style={{ fontSize: 12, color: 'rgba(247,244,238,0.45)', margin: 0, lineHeight: 1.5 }}>{hint}</p>
    </div>
  )
}

function ArrowBetween({ visible, delay }: { visible: boolean; delay: number }) {
  return (
    <div style={{
      display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%', paddingTop: 30,
      opacity: visible ? 1 : 0, transform: visible ? 'scaleX(1)' : 'scaleX(0.4)',
      transformOrigin: 'left center', transition: `all 1s cubic-bezier(0.16,1,0.3,1) ${delay}ms`,
    }}>
      <svg width="60" height="14" viewBox="0 0 60 14" fill="none">
        <line x1="2" y1="7" x2="50" y2="7" stroke="rgba(186,117,23,0.45)" strokeWidth="1" strokeDasharray="3 3"/>
        <path d="M50 2L57 7L50 12" stroke="#BA7517" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
      </svg>
    </div>
  )
}

function InstagramBioMock() {
  return (
    <div style={{ width: 240, padding: 18, background: '#F7F4EE', borderRadius: 18, boxShadow: '0 30px 60px -15px rgba(0,0,0,0.4)', fontFamily: 'var(--font-geist-sans)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
        <div style={{ width: 48, height: 48, borderRadius: '50%', background: 'conic-gradient(from 180deg, #f09433, #e6683c, #dc2743, #cc2366, #bc1888, #f09433)', padding: 2 }}>
          <div style={{ width: '100%', height: '100%', borderRadius: '50%', background: '#2C2A25', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#BA7517', fontFamily: 'var(--font-cormorant)', fontSize: 18, fontWeight: 600 }}>H</div>
        </div>
        <div style={{ minWidth: 0 }}>
          <p style={{ fontSize: 12, fontWeight: 600, color: '#2C2A25', margin: 0 }}>spa.aljannah</p>
          <p style={{ fontSize: 9, color: '#8A8275', margin: '2px 0 0' }}>Spa & Hammam · Alger</p>
        </div>
      </div>
      <div style={{ display: 'flex', gap: 16, marginBottom: 12, fontSize: 11, color: '#2C2A25' }}>
        <span><b>2 847</b> <span style={{ color: '#8A8275' }}>posts</span></span>
        <span><b>14 k</b> <span style={{ color: '#8A8275' }}>followers</span></span>
      </div>
      <p style={{ fontSize: 11, color: '#2C2A25', margin: 0, lineHeight: 1.5 }}>
        ✦ Soins haute exigence<br/>
        ♨ Hammam traditionnel<br/>
        🌿 Bio · sur-mesure
      </p>
      <div style={{
        marginTop: 12, padding: '10px 12px',
        background: 'linear-gradient(135deg, #BA7517 0%, #8A560F 100%)',
        borderRadius: 10, display: 'flex', alignItems: 'center', gap: 8,
        boxShadow: '0 4px 12px rgba(186,117,23,0.3)',
      }}>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#FFF6E0" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/>
          <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>
        </svg>
        <span style={{ fontSize: 10, fontWeight: 600, color: '#FFF6E0', letterSpacing: 0.3 }}>hadiya.app/paie/aljannah</span>
      </div>
    </div>
  )
}

function PaymentPageMock() {
  return (
    <div style={{ width: 240, padding: 20, background: '#F7F4EE', borderRadius: 18, boxShadow: '0 30px 60px -15px rgba(0,0,0,0.4)', fontFamily: 'var(--font-geist-sans)' }}>
      <div style={{ textAlign: 'center', marginBottom: 16 }}>
        <div style={{ width: 44, height: 44, borderRadius: 12, background: 'rgba(186,117,23,0.12)', margin: '0 auto 10px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#BA7517', fontFamily: 'var(--font-cormorant)', fontSize: 22, fontWeight: 600 }}>H</div>
        <p style={{ fontSize: 9, letterSpacing: '0.32em', color: '#BA7517', textTransform: 'uppercase', margin: 0, fontWeight: 600 }}>Spa Al Jannah</p>
        <p style={{ fontFamily: 'var(--font-cormorant)', fontSize: 18, color: '#2C2A25', margin: '4px 0 0', fontStyle: 'italic', fontWeight: 400 }}>Carte cadeau</p>
      </div>
      <div style={{ borderTop: '1px solid rgba(196,184,158,0.4)', paddingTop: 12 }}>
        <p style={{ fontSize: 9, letterSpacing: '0.22em', color: '#8A8275', textTransform: 'uppercase', margin: 0 }}>Pour</p>
        <p style={{ fontSize: 13, color: '#2C2A25', margin: '4px 0 0', fontWeight: 500 }}>Yasmine Belkacem</p>
      </div>
      <div style={{ marginTop: 14, padding: 14, background: 'white', borderRadius: 12, border: '1px solid rgba(196,184,158,0.4)' }}>
        <p style={{ fontSize: 9, letterSpacing: '0.22em', color: '#8A8275', textTransform: 'uppercase', margin: 0 }}>Montant</p>
        <p style={{ fontFamily: 'var(--font-cormorant)', fontSize: 28, color: '#2C2A25', margin: '6px 0 0', fontWeight: 300, letterSpacing: '-0.02em' }}>
          10 000 <span style={{ fontSize: 12, color: '#BA7517' }}>DA</span>
        </p>
      </div>
      <button style={{
        marginTop: 14, width: '100%', padding: '11px', background: '#BA7517', color: '#FFF6E0',
        border: 'none', borderRadius: 10, fontSize: 9, letterSpacing: '0.2em', textTransform: 'uppercase', fontWeight: 600,
        boxShadow: '0 6px 16px rgba(186,117,23,0.35)',
      }}>Procéder au paiement</button>
    </div>
  )
}

function PaymentMethodMock() {
  return (
    <div style={{ width: 240, padding: 20, background: '#F7F4EE', borderRadius: 18, boxShadow: '0 30px 60px -15px rgba(0,0,0,0.4)', fontFamily: 'var(--font-geist-sans)' }}>
      <p style={{ fontSize: 9, letterSpacing: '0.32em', color: '#BA7517', textTransform: 'uppercase', margin: 0, fontWeight: 600, textAlign: 'center' }}>Méthode de paiement</p>
      <p style={{ fontFamily: 'var(--font-cormorant)', fontSize: 18, color: '#2C2A25', margin: '6px 0 18px', textAlign: 'center', fontWeight: 400 }}>Choisissez votre carte</p>
      <div style={{ background: 'white', border: '2px solid #BA7517', borderRadius: 12, padding: 12, display: 'flex', alignItems: 'center', gap: 12, boxShadow: '0 4px 12px rgba(186,117,23,0.15)' }}>
        <FakeCardLogo label="CIB" colorA="#003B7A" colorB="#0066CC"/>
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ fontSize: 12, color: '#2C2A25', margin: 0, fontWeight: 600 }}>Carte CIB</p>
          <p style={{ fontSize: 9, color: '#8A8275', margin: '2px 0 0' }}>Interbancaire algérienne</p>
        </div>
        <div style={{ width: 18, height: 18, borderRadius: '50%', background: '#BA7517', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
        </div>
      </div>
      <div style={{ marginTop: 10, background: 'white', border: '1px solid rgba(196,184,158,0.6)', borderRadius: 12, padding: 12, display: 'flex', alignItems: 'center', gap: 12 }}>
        <FakeCardLogo label="EDAHABIA" colorA="#B8860B" colorB="#DAA520"/>
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ fontSize: 12, color: '#2C2A25', margin: 0, fontWeight: 600 }}>Edahabia</p>
          <p style={{ fontSize: 9, color: '#8A8275', margin: '2px 0 0' }}>Algérie Poste</p>
        </div>
        <div style={{ width: 18, height: 18, borderRadius: '50%', border: '1.5px solid rgba(44,42,37,0.2)' }}/>
      </div>
      <p style={{ fontSize: 9, color: '#8A8275', margin: '14px 0 0', textAlign: 'center', letterSpacing: 0.2 }}>🔒 Paiement sécurisé · Chargily</p>
    </div>
  )
}

function FakeCardLogo({ label, colorA, colorB }: { label: string; colorA: string; colorB: string }) {
  return (
    <div style={{
      width: 36, height: 24, borderRadius: 4,
      background: `linear-gradient(135deg, ${colorA}, ${colorB})`,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      color: 'white', fontSize: 7, fontWeight: 700, letterSpacing: 0.5,
      boxShadow: '0 2px 6px rgba(0,0,0,0.15)', flexShrink: 0,
    }}>{label}</div>
  )
}
