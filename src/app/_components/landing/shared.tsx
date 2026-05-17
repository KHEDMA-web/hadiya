'use client'

import { useRef, useState, useEffect, type CSSProperties, type ReactNode } from 'react'

// ── Animated touch cursor ─────────────────────────────────────
interface CursorProps {
  x: number
  y: number
  visible?: boolean
  clicking?: boolean
}

export function Cursor({ x, y, visible = true, clicking = false }: CursorProps) {
  return (
    <div style={{
      position: 'absolute', left: 0, top: 0,
      transform: `translate(${x}px, ${y}px)`,
      transition: 'transform 0.7s cubic-bezier(0.65, 0, 0.35, 1), opacity 0.3s',
      opacity: visible ? 1 : 0,
      pointerEvents: 'none', zIndex: 50, willChange: 'transform',
    }}>
      <div style={{ position: 'relative', width: 0, height: 0 }}>
        <div style={{
          position: 'absolute', left: -14, top: -14, width: 28, height: 28, borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(186,117,23,0.35) 0%, rgba(186,117,23,0) 70%)',
          pointerEvents: 'none',
        }}/>
        <div style={{
          position: 'absolute', left: -8, top: -8, width: 16, height: 16, borderRadius: '50%',
          border: '1.5px solid rgba(247,244,238,0.95)', boxShadow: '0 2px 8px rgba(0,0,0,0.25)',
          pointerEvents: 'none',
        }}/>
        <div style={{
          position: 'absolute', left: -3, top: -3, width: 6, height: 6, borderRadius: '50%',
          background: '#BA7517', boxShadow: '0 0 6px rgba(186,117,23,0.8)', pointerEvents: 'none',
        }}/>
        {clicking && (
          <span style={{
            position: 'absolute', left: -14, top: -14, width: 28, height: 28, borderRadius: '50%',
            border: '1.5px solid #BA7517', animation: 'cursor-ping 0.7s ease-out', pointerEvents: 'none',
          }}/>
        )}
      </div>
    </div>
  )
}

// ── Phone frame ───────────────────────────────────────────────
interface PhoneFrameProps {
  children: ReactNode
  width?: number
  height?: number
  style?: CSSProperties
}

export function PhoneFrame({ children, width = 280, height = 580, style }: PhoneFrameProps) {
  return (
    <div style={{
      width, height, borderRadius: 42, background: '#1A1816', padding: 10,
      boxShadow: '0 40px 80px -20px rgba(28,24,18,0.5), 0 0 0 1px rgba(186,117,23,0.18), inset 0 0 0 2px #2C2A25',
      position: 'relative', ...style,
    }}>
      <div style={{
        width: '100%', height: '100%', borderRadius: 32, overflow: 'hidden',
        background: '#1E1C18', position: 'relative',
      }}>
        <div style={{
          position: 'absolute', top: 8, left: '50%', transform: 'translateX(-50%)',
          width: 80, height: 22, borderRadius: 16, background: '#000', zIndex: 60,
        }}/>
        {children}
      </div>
    </div>
  )
}

// ── Browser frame ─────────────────────────────────────────────
interface BrowserFrameProps {
  children: ReactNode
  width?: number | string
  height?: number | string
  url?: string
  style?: CSSProperties
}

export function BrowserFrame({ children, width = 720, height = 460, url = 'hadiya.app', style }: BrowserFrameProps) {
  return (
    <div style={{
      width, height, borderRadius: 16, overflow: 'hidden', background: '#2C2A25',
      boxShadow: '0 40px 80px -20px rgba(28,24,18,0.55), 0 0 0 1px rgba(186,117,23,0.18)',
      display: 'flex', flexDirection: 'column', ...style,
    }}>
      <div style={{
        height: 32, background: '#1E1C18', borderBottom: '1px solid #3A3830',
        display: 'flex', alignItems: 'center', padding: '0 14px', gap: 6,
        fontSize: 11, color: 'rgba(247,244,238,0.4)',
      }}>
        <div style={{ display: 'flex', gap: 6 }}>
          {[0,1,2].map(i => (
            <span key={i} style={{ width: 10, height: 10, borderRadius: '50%', background: '#3A3830' }}/>
          ))}
        </div>
        <div style={{ flex: 1, textAlign: 'center', letterSpacing: 0.5 }}>{url}</div>
      </div>
      <div style={{ flex: 1, overflow: 'hidden', position: 'relative', background: '#1E1C18' }}>
        {children}
      </div>
    </div>
  )
}

// ── Fade-in-on-scroll hook ────────────────────────────────────
export function useReveal(threshold = 0.15) {
  const ref = useRef<HTMLElement>(null)
  const [visible, setVisible] = useState(false)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const obs = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setVisible(true); obs.disconnect() } },
      { threshold }
    )
    obs.observe(el)
    return () => obs.disconnect()
  }, [threshold])
  return [ref, visible] as const
}

// ── Animated reveal wrapper ───────────────────────────────────
interface RevealProps {
  children: ReactNode
  delay?: number
  className?: string
  style?: CSSProperties
}

export function Reveal({ children, delay = 0, className = '', style = {} }: RevealProps) {
  const [ref, visible] = useReveal()
  return (
    <div
      ref={ref as React.RefObject<HTMLDivElement>}
      className={className}
      style={{
        ...style,
        opacity: visible ? 1 : 0,
        transform: visible ? 'translateY(0)' : 'translateY(28px)',
        transition: `opacity 0.9s cubic-bezier(0.16,1,0.3,1) ${delay}ms, transform 0.9s cubic-bezier(0.16,1,0.3,1) ${delay}ms`,
        willChange: 'opacity, transform',
      }}
    >
      {children}
    </div>
  )
}

// ── Parallax scroll wrapper ───────────────────────────────────
interface ParallaxProps {
  children: ReactNode
  speed?: number
  className?: string
  style?: CSSProperties
}

export function Parallax({ children, speed = 0.15, className = '', style = {} }: ParallaxProps) {
  const ref = useRef<HTMLDivElement>(null)
  const [offset, setOffset] = useState(0)
  useEffect(() => {
    let raf = 0
    const update = () => {
      if (!ref.current) return
      const rect = ref.current.getBoundingClientRect()
      const winH = window.innerHeight
      const center = rect.top + rect.height / 2
      setOffset(-((center - winH / 2) * speed))
    }
    const onScroll = () => { cancelAnimationFrame(raf); raf = requestAnimationFrame(update) }
    update()
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onScroll, { passive: true })
    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onScroll)
    }
  }, [speed])
  return (
    <div ref={ref} className={className} style={{ transform: `translateY(${offset}px)`, willChange: 'transform', ...style }}>
      {children}
    </div>
  )
}

// ── Icon set ──────────────────────────────────────────────────
export const Icon = {
  cash:  (s = 18) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"><rect x="2.5" y="6.5" width="19" height="13" rx="2"/><circle cx="12" cy="13" r="2.2"/><path d="M6.5 9.5h0.01M17.5 16.5h0.01"/></svg>,
  star:  (s = 18) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2L14.9 8.6L22 9.4L16.7 14.1L18.2 21L12 17.4L5.8 21L7.3 14.1L2 9.4L9.1 8.6L12 2Z"/></svg>,
  gift:  (s = 18) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 12 20 22 4 22 4 12"/><rect x="2" y="7" width="20" height="5"/><line x1="12" y1="22" x2="12" y2="7"/><path d="M12 7H7.5A2.5 2.5 0 0 1 7.5 2C11 2 12 7 12 7z"/><path d="M12 7h4.5A2.5 2.5 0 0 0 16.5 2C13 2 12 7 12 7z"/></svg>,
  cal:   (s = 18) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>,
  chart: (s = 18) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/><line x1="3" y1="20" x2="21" y2="20"/></svg>,
  nfc:   (s = 18) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"><path d="M4 12c0-4 3-7 8-7s8 3 8 7-3 7-8 7"/><path d="M8 12c0-2 1.5-3.5 4-3.5s4 1.5 4 3.5-1.5 3.5-4 3.5"/><circle cx="12" cy="12" r="1"/></svg>,
  arrow: (s = 16) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>,
  check: (s = 14) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>,
  box:   (s = 18) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/></svg>,
  qr:    (s = 18) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><path d="M14 14h3v3h-3zM21 14h0.01M14 21h0.01M21 21h0.01M14 17h0.01M17 17h0.01M21 17h-3M17 21h-3"/></svg>,
}

// ── Demo phase runner ─────────────────────────────────────────
export function useDemoPhases(phaseCount: number, durations: number[]) {
  const [phase, setPhase] = useState(0)
  useEffect(() => {
    const dur = durations[phase] ?? 1200
    const timer = setTimeout(() => setPhase(p => (p + 1) % phaseCount), dur)
    return () => clearTimeout(timer)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, phaseCount])
  return phase
}
