'use client'

import { useReveal, useDemoPhases } from './shared'

export default function RealtimeSync() {
  const [ref, visible] = useReveal(0.1)
  const phase = useDemoPhases(5, [1600, 1200, 1800, 2200, 1500])

  return (
    <section ref={ref as React.RefObject<HTMLDivElement>} style={{
      background: 'linear-gradient(180deg, #EFEADC 0%, #F7F4EE 100%)',
      padding: '120px 40px', position: 'relative', overflow: 'hidden',
    }}>
      <div style={{ maxWidth: 1280, margin: '0 auto', position: 'relative' }}>
        <div style={{ textAlign: 'center', marginBottom: 56 }}>
          <p style={{
            fontSize: 10, letterSpacing: '0.32em', textTransform: 'uppercase',
            color: '#BA7517', fontWeight: 600, margin: 0,
            opacity: visible ? 1 : 0, transition: 'opacity 0.8s',
          }}>Synchronisation temps réel</p>
          <h2 style={{
            fontFamily: 'var(--font-cormorant)', fontSize: 'clamp(38px, 5vw, 64px)', fontWeight: 300,
            lineHeight: 1.05, letterSpacing: '-0.02em', color: '#2C2A25', margin: '20px 0 18px',
            maxWidth: 880, marginLeft: 'auto', marginRight: 'auto',
            opacity: visible ? 1 : 0, transform: visible ? 'translateY(0)' : 'translateY(20px)',
            transition: 'all 1s cubic-bezier(0.16,1,0.3,1) 100ms',
          }}>
            Le téléphone scanne. <span style={{ fontStyle: 'italic', color: '#BA7517' }}>L&apos;écran réagit.</span>
          </h2>
          <p style={{
            fontSize: 16, lineHeight: 1.65, color: '#6B6560', maxWidth: 620, margin: '0 auto',
            opacity: visible ? 1 : 0, transition: 'opacity 1s 250ms',
          }}>
            Votre téléphone devient un scanner. La caisse en face le sait instantanément — le client apparaît, son solde s&apos;affiche, la vente est prête à être encaissée.
          </p>
        </div>

        <div style={{
          position: 'relative',
          display: 'grid', gridTemplateColumns: '300px 1fr 580px',
          gap: 0, alignItems: 'center', justifyContent: 'center', minHeight: 460,
        }}>
          <div style={{
            opacity: visible ? 1 : 0, transform: visible ? 'translateX(0)' : 'translateX(-30px)',
            transition: 'all 1s cubic-bezier(0.16,1,0.3,1) 200ms', display: 'flex', justifyContent: 'center',
          }}>
            <ScannerPhone phase={phase}/>
          </div>
          <div style={{ position: 'relative', height: 460, display: 'flex', alignItems: 'center' }}>
            <SyncArc phase={phase} active={visible}/>
          </div>
          <div style={{
            opacity: visible ? 1 : 0, transform: visible ? 'translateX(0)' : 'translateX(30px)',
            transition: 'all 1s cubic-bezier(0.16,1,0.3,1) 200ms',
          }}>
            <DashboardMock phase={phase}/>
          </div>
        </div>

        <p style={{
          textAlign: 'center', fontSize: 10, letterSpacing: '0.32em', textTransform: 'uppercase',
          color: 'rgba(44,42,37,0.4)', fontWeight: 600, margin: '40px 0 0',
        }}>
          Supabase Realtime · WebSocket · &lt; 200 ms
        </p>
      </div>
    </section>
  )
}

function ScannerPhone({ phase }: { phase: number }) {
  const detected = phase >= 1
  const flashing = phase === 1
  const corners = [
    { top: 8,    left: 8,    deg: 0 },
    { top: 8,    right: 8,   deg: 90 },
    { bottom: 8, right: 8,   deg: 180 },
    { bottom: 8, left: 8,    deg: 270 },
  ]

  return (
    <div style={{
      width: 260, height: 460, borderRadius: 38, background: '#1A1816', padding: 9,
      boxShadow: '0 40px 80px -20px rgba(28,24,18,0.45), 0 0 0 1px rgba(186,117,23,0.2)',
      position: 'relative',
    }}>
      <div style={{ width: '100%', height: '100%', borderRadius: 30, overflow: 'hidden', background: '#1E1C18', position: 'relative' }}>
        <div style={{ position: 'absolute', top: 8, left: '50%', transform: 'translateX(-50%)', width: 76, height: 22, borderRadius: 16, background: '#000', zIndex: 60 }}/>
        <div style={{ padding: '46px 16px 16px', height: '100%', fontFamily: 'var(--font-geist-sans)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ width: 28, height: 28, borderRadius: '50%', border: '1px solid rgba(247,244,238,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="rgba(247,244,238,0.5)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
            </div>
            <div>
              <p style={{ fontFamily: 'var(--font-cormorant)', fontSize: 16, color: '#F7F4EE', margin: 0, fontWeight: 400 }}>Scanner une carte</p>
              <p style={{ fontSize: 8, letterSpacing: '0.22em', color: '#BA7517', textTransform: 'uppercase', margin: '2px 0 0' }}>QR code</p>
            </div>
          </div>
          <div style={{
            position: 'relative', marginTop: 22, aspectRatio: '1 / 1', background: '#0A0908',
            borderRadius: 16, overflow: 'hidden',
            border: detected ? '1.5px solid #BA7517' : '1.5px solid rgba(247,244,238,0.08)',
            transition: 'border-color 0.4s',
            boxShadow: flashing ? '0 0 40px rgba(186,117,23,0.5)' : 'none',
          }}>
            {corners.map(({ deg, ...pos }, i) => (
              <span key={i} style={{
                position: 'absolute', width: 18, height: 18,
                borderTop: `2px solid ${detected ? '#BA7517' : 'rgba(247,244,238,0.4)'}`,
                borderLeft: `2px solid ${detected ? '#BA7517' : 'rgba(247,244,238,0.4)'}`,
                borderRadius: 4, transition: 'border-color 0.4s',
                ...pos, transform: `rotate(${deg}deg)`,
              }}/>
            ))}
            {detected && (
              <div style={{
                position: 'absolute', top: '50%', left: '50%',
                transform: 'translate(-50%, -50%)',
                width: 96, height: 96, background: 'white', borderRadius: 7, padding: 6,
                boxShadow: '0 6px 18px rgba(0,0,0,0.4), 0 0 0 1px rgba(186,117,23,0.5)',
                animation: 'qr-reveal 0.5s cubic-bezier(0.16,1,0.3,1)', overflow: 'hidden',
              }}>
                <FakeQR size={84}/>
                <div style={{
                  position: 'absolute', inset: 0,
                  background: 'linear-gradient(120deg, transparent 30%, rgba(186,117,23,0.45) 50%, transparent 70%)',
                  animation: 'qr-sweep 0.9s ease-out 0.1s', pointerEvents: 'none',
                }}/>
              </div>
            )}
            {!detected && (
              <div style={{
                position: 'absolute', left: '15%', right: '15%', top: '50%',
                height: 1, background: 'linear-gradient(90deg, transparent, #BA7517, transparent)',
                boxShadow: '0 0 10px rgba(186,117,23,0.6)', animation: 'scan-line 1.8s ease-in-out infinite',
              }}/>
            )}
            {flashing && (
              <div style={{
                position: 'absolute', bottom: 12, left: '50%', transform: 'translateX(-50%)',
                background: '#BA7517', color: '#FFF6E0', padding: '5px 11px', borderRadius: 999,
                fontSize: 9, fontWeight: 700, letterSpacing: '0.18em', textTransform: 'uppercase',
                whiteSpace: 'nowrap', animation: 'hd-fadeUp 0.3s', boxShadow: '0 6px 16px rgba(186,117,23,0.4)',
              }}>✓ Carte détectée</div>
            )}
          </div>
          <div style={{ marginTop: 18, textAlign: 'center', minHeight: 36 }}>
            {phase === 0 && (
              <>
                <p style={{ fontSize: 10, color: 'rgba(247,244,238,0.5)', margin: 0, letterSpacing: 0.4 }}>Approchez le QR code de votre carte</p>
                <p style={{ fontSize: 8, color: 'rgba(186,117,23,0.5)', margin: '5px 0 0', letterSpacing: '0.22em', textTransform: 'uppercase', fontWeight: 600 }}>● En attente</p>
              </>
            )}
            {(phase === 1 || phase === 2) && (
              <>
                <p style={{ fontSize: 11, color: '#F7F4EE', margin: 0, fontWeight: 500 }}>Hamida Salim</p>
                <p style={{ fontSize: 8, color: '#BA7517', margin: '4px 0 0', letterSpacing: '0.22em', textTransform: 'uppercase', fontWeight: 600 }}>↗ Envoi en cours</p>
              </>
            )}
            {phase >= 3 && (
              <>
                <p style={{ fontSize: 11, color: '#F7F4EE', margin: 0, fontWeight: 500 }}>Hamida Salim</p>
                <p style={{ fontSize: 8, color: '#10B981', margin: '4px 0 0', letterSpacing: '0.22em', textTransform: 'uppercase', fontWeight: 600 }}>✓ Synchronisé</p>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

function SyncArc({ phase, active }: { phase: number; active: boolean }) {
  const flowing = phase === 2
  const arcPath = "M 20 230 Q 175 60 330 230"

  return (
    <svg viewBox="0 0 350 460" style={{ width: '100%', height: '100%', overflow: 'visible' }} preserveAspectRatio="xMidYMid meet">
      <path d={arcPath} stroke="rgba(186,117,23,0.3)" strokeWidth="1" strokeDasharray="4 4" fill="none"/>
      <path id="sync-arc" d={arcPath} stroke="none" fill="none"/>
      <g transform="translate(175 95)">
        <rect x="-46" y="-12" width="92" height="22" rx="11" fill="#2C2A25" stroke="rgba(186,117,23,0.5)" strokeWidth="0.5"/>
        <text x="0" y="3" textAnchor="middle" fontFamily="var(--font-geist-sans), system-ui, sans-serif" fontSize="9" fontWeight="600" letterSpacing="2" fill="#BA7517">REALTIME</text>
      </g>
      {flowing && (
        <>
          {[0, 0.18, 0.36, 0.54, 0.72].map((delay, i) => (
            <circle key={i} r="4" fill="#BA7517" filter="url(#glow)">
              <animateMotion dur="1.6s" repeatCount="indefinite" begin={`${delay}s`}>
                <mpath href="#sync-arc"/>
              </animateMotion>
              <animate attributeName="opacity" values="0;1;1;0" keyTimes="0;0.15;0.85;1" dur="1.6s" begin={`${delay}s`} repeatCount="indefinite"/>
            </circle>
          ))}
        </>
      )}
      <defs>
        <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="2.5" result="blur"/>
          <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
        </filter>
      </defs>
    </svg>
  )
}

function DashboardMock({ phase }: { phase: number }) {
  const synced = phase >= 3
  const cartesActives = synced ? 10 : 9
  const clients = synced ? 10 : 9
  const transactions = synced ? 35 : 34

  return (
    <div style={{
      width: '100%', maxWidth: 580, borderRadius: 16, background: '#2C2A25',
      boxShadow: '0 40px 80px -20px rgba(28,24,18,0.4), 0 0 0 1px rgba(186,117,23,0.2)', overflow: 'hidden',
    }}>
      <div style={{
        height: 30, background: '#1E1C18', borderBottom: '1px solid #3A3830',
        display: 'flex', alignItems: 'center', padding: '0 12px', gap: 6,
        fontSize: 10, color: 'rgba(247,244,238,0.4)',
      }}>
        <div style={{ display: 'flex', gap: 6 }}>
          {[0,1,2].map(i => <span key={i} style={{ width: 9, height: 9, borderRadius: '50%', background: '#3A3830' }}/>)}
        </div>
        <div style={{ flex: 1, textAlign: 'center' }}>hadiya.app/dashboard</div>
      </div>
      <div style={{ background: '#1E1C18', padding: 24, fontFamily: 'var(--font-geist-sans)', position: 'relative', minHeight: 380 }}>
        <div style={{ textAlign: 'center', marginBottom: 20 }}>
          <p style={{ fontFamily: 'var(--font-cormorant)', fontSize: 22, color: '#F7F4EE', margin: 0, letterSpacing: '0.32em', fontWeight: 400 }}>
            <span style={{ color: '#BA7517' }}>—</span> HADIYA <span style={{ color: '#BA7517' }}>—</span>
          </p>
          <p style={{ fontSize: 10, color: 'rgba(247,244,238,0.4)', margin: '4px 0 0', letterSpacing: '0.32em', textTransform: 'uppercase' }}>Hadiya Spa</p>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 0, borderTop: '1px solid rgba(186,117,23,0.15)', borderBottom: '1px solid rgba(186,117,23,0.15)', padding: '14px 0', margin: '0 0 18px' }}>
          {[
            { label: 'cartes actives', val: cartesActives },
            { label: 'clients',        val: clients },
            { label: 'transactions',   val: transactions },
          ].map((s, i) => (
            <div key={s.label} style={{ textAlign: 'center', borderLeft: i > 0 ? '1px solid rgba(186,117,23,0.15)' : 'none' }}>
              <p key={s.val} style={{
                fontFamily: 'var(--font-cormorant)', fontSize: 32, color: '#BA7517', margin: 0, fontWeight: 300,
                animation: synced ? 'stat-bump 0.5s cubic-bezier(0.34, 1.56, 0.64, 1)' : 'none',
              }}>{s.val}</p>
              <p style={{ fontSize: 9, color: 'rgba(247,244,238,0.45)', margin: '2px 0 0', letterSpacing: '0.22em', textTransform: 'uppercase' }}>{s.label}</p>
            </div>
          ))}
        </div>
        <p style={{ fontSize: 9, color: '#BA7517', margin: '0 0 8px', letterSpacing: '0.22em', textTransform: 'uppercase', fontWeight: 600 }}>● Scanner RFID</p>
        <div style={{
          background: '#2C2A25', border: synced ? '1px solid #BA7517' : '1px solid rgba(186,117,23,0.2)',
          borderRadius: 12, padding: '12px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          transition: 'border-color 0.4s', boxShadow: synced ? '0 0 0 3px rgba(186,117,23,0.12)' : 'none',
        }}>
          {!synced ? (
            <span style={{ fontSize: 12, color: 'rgba(247,244,238,0.4)' }}>Approcher la carte RFID…</span>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, animation: 'hd-fadeUp 0.4s' }}>
              <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'rgba(139,124,210,0.18)', color: '#B8A8E0', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 700 }}>HS</div>
              <div>
                <p style={{ fontSize: 12, color: '#F7F4EE', margin: 0, fontWeight: 500 }}>Hamida Salim</p>
                <p style={{ fontSize: 9, color: 'rgba(247,244,238,0.5)', margin: '2px 0 0' }}>Solde 64 000 DA · PLATINE</p>
              </div>
            </div>
          )}
          <span style={{
            padding: '4px 8px', borderRadius: 6,
            background: synced ? '#BA7517' : 'rgba(247,244,238,0.05)',
            color: synced ? '#FFF6E0' : 'rgba(247,244,238,0.4)',
            fontSize: 8, fontWeight: 700, letterSpacing: '0.18em', textTransform: 'uppercase', transition: 'all 0.4s',
          }}>
            {synced ? '✓ Reçu' : 'En attente'}
          </span>
        </div>
        {synced && (
          <div style={{
            position: 'absolute', top: 24, right: 24,
            background: 'linear-gradient(145deg, #BA7517, #8A560F)', color: '#FFF6E0',
            padding: '10px 14px', borderRadius: 10, boxShadow: '0 12px 28px rgba(186,117,23,0.4)',
            animation: 'toast-in 0.45s cubic-bezier(0.16,1,0.3,1)',
            display: 'flex', alignItems: 'center', gap: 8, maxWidth: 200,
          }}>
            <span style={{ width: 16, height: 16, borderRadius: '50%', background: 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9, fontWeight: 700 }}>↗</span>
            <div>
              <p style={{ fontSize: 10, margin: 0, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase' }}>Nouvelle carte scannée</p>
              <p style={{ fontSize: 9, margin: '2px 0 0', opacity: 0.85 }}>Hamida Salim · à l&apos;instant</p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

function FakeQR({ size = 80 }: { size?: number }) {
  const cells = 21
  const px = size / cells
  const finder = (cx: number, cy: number) => (
    <g key={`${cx}-${cy}`}>
      <rect x={cx * px} y={cy * px} width={7 * px} height={7 * px} fill="#1A1816"/>
      <rect x={(cx + 1) * px} y={(cy + 1) * px} width={5 * px} height={5 * px} fill="white"/>
      <rect x={(cx + 2) * px} y={(cy + 2) * px} width={3 * px} height={3 * px} fill="#1A1816"/>
    </g>
  )
  const blocks: React.ReactElement[] = []
  for (let y = 0; y < cells; y++) {
    for (let x = 0; x < cells; x++) {
      const inFinder = (x < 8 && y < 8) || (x > cells - 9 && y < 8) || (x < 8 && y > cells - 9)
      if (inFinder) continue
      const seed = (x * 31 + y * 17 + x * y * 13) % 5
      if (seed < 2) {
        blocks.push(<rect key={`${x}-${y}`} x={x * px} y={y * px} width={px} height={px} fill="#1A1816"/>)
      }
    }
  }
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ display: 'block' }}>
      {blocks}
      {finder(0, 0)}
      {finder(cells - 7, 0)}
      {finder(0, cells - 7)}
    </svg>
  )
}
