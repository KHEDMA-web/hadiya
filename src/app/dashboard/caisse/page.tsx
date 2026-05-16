'use client'
import { useState, useEffect, useRef } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import BackButton from '../_components/BackButton'
import { getUserProfile } from '@/lib/auth'

type Item = { id: string; nom: string; prix: number; emoji: string; qty: number; categorie: string }

export default function Caisse() {
  const router = useRouter()
  const [menu, setMenu] = useState<any[]>([])
  const [order, setOrder] = useState<Record<string, Item>>({})
  const [filter, setFilter] = useState<'tous' | 'soin' | 'consommable'>('tous')
  const [carte, setCarte] = useState<any>(null)
  const [uid, setUid] = useState('')
  const [step, setStep] = useState<'order' | 'pay' | 'done'>('order')
  const [sheetOpen, setSheetOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [errPay, setErrPay] = useState('')
  const [rfidMode, setRfidMode] = useState(false)
  const [nfcSupported, setNfcSupported] = useState(false)
  const [nfcReading, setNfcReading]   = useState(false)
  const [salonId, setSalonId]         = useState<string | null>(null)
  const [salonNom, setSalonNom]       = useState('')
  const [ptsGagnes, setPtsGagnes]     = useState(0)

  const uidRef = useRef<HTMLInputElement>(null)
  const confirmRef = useRef<HTMLButtonElement>(null)
  const rfidModeRef = useRef(false)
  const carteFoundRef = useRef(false)

  // ── Init menu Supabase ──
  useEffect(() => {
    const init = async () => {
      const profile = await getUserProfile()
      const sid = profile?.salonId
      const q = supabase.from('menu_items').select('*').eq('actif', true).order('nom')
      const { data } = sid ? await q.eq('salon_id', sid) : await q
      if (!data || data.length === 0) {
        const defaults = [
          { nom: 'Café',           prix: 200,  emoji: '☕', categorie: 'consommable', actif: true, ...(sid ? { salon_id: sid } : {}) },
          { nom: 'Cocktail détox', prix: 800,  emoji: '🍹', categorie: 'consommable', actif: true, ...(sid ? { salon_id: sid } : {}) },
          { nom: 'Eau pétillante', prix: 150,  emoji: '💧', categorie: 'consommable', actif: true, ...(sid ? { salon_id: sid } : {}) },
          { nom: 'Massage 60 min', prix: 4500, emoji: '💆', categorie: 'soin',        actif: true, ...(sid ? { salon_id: sid } : {}) },
          { nom: 'Soin visage',    prix: 3500, emoji: '✨', categorie: 'soin',        actif: true, ...(sid ? { salon_id: sid } : {}) },
          { nom: 'Hammam',         prix: 2500, emoji: '🧖', categorie: 'soin',        actif: true, ...(sid ? { salon_id: sid } : {}) },
          { nom: 'Manucure',       prix: 1800, emoji: '💅', categorie: 'soin',        actif: true, ...(sid ? { salon_id: sid } : {}) },
          { nom: 'Huile argan',    prix: 2200, emoji: '🫙', categorie: 'consommable', actif: true, ...(sid ? { salon_id: sid } : {}) },
        ]
        await supabase.from('menu_items').insert(defaults)
        const q2 = supabase.from('menu_items').select('*').eq('actif', true).order('nom')
        const { data: seeded } = sid ? await q2.eq('salon_id', sid) : await q2
        setMenu(seeded ?? [])
      } else {
        setMenu(data)
      }
    }
    init()
  }, [])

  // ── Auto-open sheet au paiement ──
  useEffect(() => {
    if (step === 'pay') setSheetOpen(true)
  }, [step])

  // ── RFID focus ──
  useEffect(() => {
    if (step === 'pay' && rfidMode) {
      carteFoundRef.current = false
      setTimeout(() => uidRef.current?.focus(), 80)
    }
  }, [step, rfidMode])

  useEffect(() => {
    if ('NDEFReader' in window) setNfcSupported(true)
  }, [])

  useEffect(() => {
    const load = async () => {
      const profile = await getUserProfile()
      if (profile?.salonId) { setSalonId(profile.salonId); setSalonNom(profile.salonNom) }
    }
    load()
  }, [])

  const printReceipt = () => window.print()

  const startNFC = async () => {
    if (!('NDEFReader' in window)) return
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const ndef = new (window as any).NDEFReader()
      await ndef.scan()
      setNfcReading(true)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ndef.addEventListener('reading', ({ serialNumber }: any) => {
        const nfcUid = serialNumber.replace(/:/g, '').toUpperCase()
        setUid(nfcUid)
        setNfcReading(false)
        handleFindCarte(nfcUid)
      })
    } catch (err) {
      console.error('NFC error:', err)
      setNfcReading(false)
    }
  }

  const total = Object.values(order).reduce((s, i) => s + i.prix * i.qty, 0)
  const itemCount = Object.values(order).reduce((s, i) => s + i.qty, 0)
  const filteredMenu = filter === 'tous' ? menu : menu.filter(m => m.categorie === filter)

  const addItem = (item: any) => {
    setOrder(prev => ({
      ...prev,
      [item.id]: prev[item.id]
        ? { ...prev[item.id], qty: prev[item.id].qty + 1 }
        : { ...item, qty: 1 }
    }))
  }

  const removeItem = (id: string) => {
    setOrder(prev => {
      const u = { ...prev }
      if (u[id].qty > 1) u[id] = { ...u[id], qty: u[id].qty - 1 }
      else delete u[id]
      return u
    })
  }

  const handleFindCarte = async (uidOverride?: string) => {
    const uidToUse = uidOverride || uid
    if (!uidToUse) return
    setLoading(true)
    setErrPay('')
    carteFoundRef.current = false
    const { data } = await supabase.from('cartes').select('*, clients(*)').eq('uid_rfid', uidToUse).single()
    if (!data) {
      setErrPay('Carte introuvable')
    } else {
      carteFoundRef.current = true
      setCarte(data)
      if (rfidModeRef.current) setTimeout(() => confirmRef.current?.focus(), 100)
    }
    setLoading(false)
  }

  const handlePay = async () => {
    if (!carte || carte.solde < total) return
    setLoading(true)
    const pts = Math.round(total / 100 * 1.5)
    setPtsGagnes(pts)

    await supabase.from('cartes').update({
      solde: carte.solde - total,
      points: carte.points + pts,
    }).eq('id', carte.id)

    await supabase.from('transactions').insert({
      carte_id: carte.id, type: 'debit',
      montant: total, points_gagnes: pts, description: 'Caisse POS',
      ...(salonId ? { salon_id: salonId } : {}),
    })

    const { data: commande } = await supabase.from('commandes').insert({
      client_id: carte.client_id,
      carte_id: carte.id,
      salon_id: salonId,
      total,
      statut: 'payee',
    }).select('id').single()

    if (commande?.id) {
      await supabase.from('commande_items').insert(
        Object.values(order).map(item => ({
          commande_id: commande.id,
          menu_item_id: item.id,
          nom: item.nom,
          prix: item.prix,
          quantite: item.qty,
          emoji: item.emoji,
        }))
      )
    }

    setStep('done')
    setLoading(false)
  }

  const toggleRfidMode = () => {
    const next = !rfidMode
    setRfidMode(next)
    rfidModeRef.current = next
    if (next) {
      setUid('')
      setCarte(null)
      carteFoundRef.current = false
      setErrPay('')
      setTimeout(() => uidRef.current?.focus(), 60)
    }
  }

  const handleUidBlur = () => {
    if (!rfidModeRef.current || carteFoundRef.current) return
    setTimeout(() => {
      if (rfidModeRef.current && !carteFoundRef.current) uidRef.current?.focus()
    }, 100)
  }

  const reset = () => {
    setOrder({})
    setCarte(null)
    setUid('')
    setErrPay('')
    setStep('order')
    setSheetOpen(false)
    setRfidMode(false)
    rfidModeRef.current = false
    carteFoundRef.current = false
  }

  // ── Écran done ──
  if (step === 'done') return (
    <div className="min-h-screen bg-[#2C2A25] flex items-center justify-center p-6">
      <style>{`
        @media print {
          * { visibility: hidden !important; }
          #hd-receipt, #hd-receipt * { visibility: visible !important; }
          #hd-receipt {
            position: fixed !important; left: 0 !important; top: 0 !important;
            width: 100% !important; background: white !important;
            padding: 28px 20px !important; font-family: 'Courier New', monospace !important;
            color: #000 !important; font-size: 12px !important; line-height: 1.7 !important;
            box-sizing: border-box !important;
          }
        }
      `}</style>

      {/* Reçu caché — affiché uniquement à l'impression */}
      <div id="hd-receipt" style={{ position: 'fixed', left: '-9999px', top: 0, width: '80mm', background: 'white', color: '#000', fontFamily: "'Courier New', monospace", fontSize: 12, lineHeight: 1.7, padding: '24px 16px' }}>
        <p style={{ textAlign: 'center', fontWeight: 'bold', fontSize: 15, margin: '0 0 2px' }}>{salonNom || 'Hadiya'}</p>
        <p style={{ textAlign: 'center', fontSize: 11, margin: '0 0 12px', color: '#555' }}>Reçu de caisse</p>
        <p style={{ borderTop: '1px dashed #000', borderBottom: '1px dashed #000', padding: '5px 0', margin: '0 0 10px', fontSize: 11 }}>
          {new Date().toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
          {' à '}
          {new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
        </p>
        {carte && (
          <p style={{ margin: '0 0 10px', fontSize: 12 }}>
            Client : <strong>{carte.clients?.prenom} {carte.clients?.nom}</strong>
          </p>
        )}
        <div style={{ margin: '0 0 8px' }}>
          {Object.values(order).map(item => (
            <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', margin: '3px 0' }}>
              <span>{item.emoji} {item.nom} ×{item.qty}</span>
              <span style={{ flexShrink: 0, marginLeft: 8 }}>{(item.prix * item.qty).toLocaleString('fr-FR')} DA</span>
            </div>
          ))}
        </div>
        <div style={{ borderTop: '1px dashed #000', paddingTop: 8, marginBottom: 8 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold', fontSize: 14 }}>
            <span>TOTAL</span>
            <span>{total.toLocaleString('fr-FR')} DA</span>
          </div>
        </div>
        <div style={{ borderTop: '1px dashed #000', paddingTop: 6, fontSize: 11 }}>
          <p style={{ margin: '2px 0' }}>Points gagnés : +{ptsGagnes} pts</p>
          {carte && <p style={{ margin: '2px 0' }}>Nouveau solde : {(carte.solde - total).toLocaleString('fr-FR')} DA</p>}
        </div>
        <p style={{ textAlign: 'center', marginTop: 16, fontSize: 10, borderTop: '1px dashed #000', paddingTop: 10 }}>Merci de votre visite !</p>
        <p style={{ textAlign: 'center', fontSize: 10 }}>Propulsé par Hadiya</p>
      </div>

      <div className="bg-[#3A3830] border border-[#4A4840] rounded-3xl p-8 text-center w-full max-w-sm shadow-2xl">
        <div className="w-20 h-20 rounded-full bg-[#BA7517]/15 border border-[#BA7517]/40 flex items-center justify-center mx-auto mb-6">
          <span className="text-3xl text-[#BA7517]">✓</span>
        </div>
        <h2 className="text-2xl font-light text-[#F7F4EE] mb-6">Paiement validé</h2>
        <div className="py-5 border-t border-b border-[#4A4840] grid grid-cols-2 gap-4">
          <div>
            <p className="text-[10px] tracking-[0.2em] uppercase text-[#8A8275] mb-1.5">Débité</p>
            <p className="text-xl font-light text-[#BA7517]">{total.toLocaleString('fr-FR')} <span className="text-xs">DA</span></p>
          </div>
          <div className="border-l border-[#4A4840] pl-4">
            <p className="text-[10px] tracking-[0.2em] uppercase text-[#8A8275] mb-1.5">Nouveau solde</p>
            <p className="text-base font-medium text-[#F7F4EE]">{(carte.solde - total).toLocaleString('fr-FR')} <span className="text-xs text-[#8A8275]">DA</span></p>
          </div>
        </div>
        <div className="flex flex-col gap-3 mt-7">
          <button onClick={printReceipt}
            className="w-full bg-[#3A3830] border border-[#4A4840] text-[#8A8275] rounded-2xl py-3.5 text-xs tracking-[0.2em] uppercase font-medium hover:text-[#F7F4EE] hover:border-[#5A5850] transition-colors"
            style={{ minHeight: 48 }}>
            🖨 Imprimer le reçu
          </button>
          <button onClick={reset}
            className="w-full bg-[#BA7517] text-white rounded-2xl py-4 text-xs tracking-[0.2em] uppercase font-medium hover:bg-[#A36714] transition-colors"
            style={{ minHeight: 52 }}>
            Nouvelle commande
          </button>
        </div>
      </div>
    </div>
  )

  // ── Écran principal ──
  return (
    <div className="min-h-screen bg-[#E8E2D5] flex flex-col relative overflow-hidden">
      <style>{`
        @keyframes rfid-dot-pulse { 0%,100% { opacity:1; transform:scale(1); } 50% { opacity:0.4; transform:scale(0.75); } }
        @keyframes rfid-border-glow {
          0%,100% { box-shadow: 0 0 0 1px rgba(186,117,23,0.55), 0 0 6px rgba(186,117,23,0.2); }
          50%     { box-shadow: 0 0 0 2px rgba(186,117,23,1), 0 0 14px rgba(186,117,23,0.45); }
        }
        @keyframes sheet-up { from { transform: translateY(100%); } to { transform: translateY(0); } }
        @keyframes overlay-fade { from { opacity:0; } to { opacity:1; } }
        .num-input::-webkit-outer-spin-button,
        .num-input::-webkit-inner-spin-button { -webkit-appearance: none; margin: 0; }
      `}</style>

      {/* ── Header sticky ── */}
      <div className="bg-[#2C2A25] px-4 pb-3 flex items-center gap-3 shadow-lg flex-shrink-0"
        style={{ paddingTop: 'max(env(safe-area-inset-top), 14px)' }}>
        <BackButton href="/dashboard" />
        <div className="flex-1">
          <h1 className="text-sm font-medium text-[#F7F4EE] tracking-wide">Caisse POS</h1>
          <p className="text-xs text-[#BA7517]">Point de vente</p>
        </div>
        {total > 0 && (
          <span className="text-sm font-semibold text-[#BA7517] bg-[#BA7517]/10 border border-[#BA7517]/30 rounded-xl px-3 py-1">
            {total.toLocaleString('fr-FR')} DA
          </span>
        )}
      </div>

      {/* ── Chips filtre ── */}
      <div className="bg-[#2C2A25] px-4 pb-3 flex gap-2 flex-shrink-0">
        {(['tous', 'soin', 'consommable'] as const).map(f => (
          <button key={f} onClick={() => setFilter(f)}
            className="px-4 py-2 rounded-full text-xs font-medium transition-all whitespace-nowrap"
            style={{
              background: filter === f ? '#BA7517' : 'rgba(247,244,238,0.07)',
              color: filter === f ? '#fff' : '#8A8275',
              minHeight: 36,
            }}>
            {f === 'tous' ? 'Tous' : f === 'soin' ? '✨ Soins' : '📦 Consommables'}
          </button>
        ))}
      </div>

      {/* ── Grille menu ── */}
      <div className="flex-1 overflow-y-auto p-4" style={{ paddingBottom: itemCount > 0 ? 96 : 16 }}>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {filteredMenu.map(item => {
            const qty = order[item.id]?.qty || 0
            return (
              <button key={item.id} onClick={() => addItem(item)}
                className="bg-white border rounded-2xl p-4 text-center active:scale-95 transition-all duration-150 shadow-md relative"
                style={{
                  borderColor: qty > 0 ? '#BA7517' : 'rgba(196,184,158,0.6)',
                  minHeight: 110,
                }}>
                {qty > 0 && (
                  <span className="absolute top-2 right-2 w-5 h-5 rounded-full bg-[#BA7517] text-white text-[10px] font-bold flex items-center justify-center">
                    {qty}
                  </span>
                )}
                <div className="text-3xl mb-2">{item.emoji}</div>
                <div className="text-xs font-medium text-[#2C2A25] leading-tight mb-1">{item.nom}</div>
                <div className="text-[11px] text-[#8A8275]">{item.prix.toLocaleString('fr-FR')} DA</div>
              </button>
            )
          })}
        </div>
      </div>

      {/* ── Bottom bar sticky ── */}
      {itemCount > 0 && (
        <div className="fixed bottom-0 left-0 right-0 bg-[#2C2A25] border-t border-[#3A3830] px-4 pt-3 flex-shrink-0 z-30"
          style={{ paddingBottom: 'max(env(safe-area-inset-bottom), 12px)' }}>
          <button onClick={() => setSheetOpen(true)}
            className="w-full bg-[#BA7517] text-white rounded-2xl text-sm font-semibold tracking-wide flex items-center justify-between px-5 active:bg-[#A36714] transition-colors shadow-[0_4px_16px_rgba(186,117,23,0.4)]"
            style={{ minHeight: 56 }}>
            <span className="bg-white/20 rounded-lg px-2.5 py-1 text-xs font-bold">{itemCount}</span>
            <span>Voir la commande</span>
            <span>{total.toLocaleString('fr-FR')} DA</span>
          </button>
        </div>
      )}

      {/* ── Bottom sheet ── */}
      {sheetOpen && (
        <>
          {/* Overlay */}
          <div
            className="fixed inset-0 bg-black/60 z-40"
            style={{ animation: 'overlay-fade 0.2s ease' }}
            onClick={() => { if (step === 'order') setSheetOpen(false) }}
          />

          {/* Sheet */}
          <div
            className="fixed bottom-0 left-0 right-0 bg-[#2C2A25] rounded-t-3xl z-50 flex flex-col"
            style={{ maxHeight: '92vh', animation: 'sheet-up 0.3s cubic-bezier(0.32,0.72,0,1)' }}>

            {/* Drag handle */}
            <div className="flex justify-center pt-3 pb-1 flex-shrink-0">
              <div className="w-10 h-1 rounded-full bg-[#4A4840]" />
            </div>

            {/* Sheet header */}
            <div className="flex items-center justify-between px-5 py-3 border-b border-[#3A3830] flex-shrink-0">
              <div>
                <p className="text-[10px] font-medium uppercase tracking-[0.25em] text-[#8A8275]">Commande</p>
                <p className="text-xs text-[#F7F4EE] mt-0.5">{itemCount} article{itemCount > 1 ? 's' : ''}</p>
              </div>
              <button
                onClick={() => { if (step === 'order') setSheetOpen(false); else { setStep('order'); setCarte(null); setUid(''); setErrPay('') } }}
                className="w-9 h-9 rounded-full bg-[#3A3830] border border-[#4A4840] flex items-center justify-center text-[#8A8275] active:text-[#F7F4EE]"
                style={{ minWidth: 36, minHeight: 36 }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>

            {/* Items scrollables */}
            <div className="flex-1 overflow-y-auto px-4 pb-2">
              <div className="flex flex-col gap-2 py-2">
                {Object.values(order).map(item => (
                  <div key={item.id} className="flex items-center gap-3 p-3 bg-[#3A3830] rounded-2xl border border-[#4A4840]">
                    <span className="text-2xl flex-shrink-0">{item.emoji}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-[#F7F4EE] truncate">{item.nom}</p>
                      <p className="text-xs text-[#BA7517] mt-0.5">{(item.prix * item.qty).toLocaleString('fr-FR')} DA</p>
                    </div>
                    <div className="flex items-center flex-shrink-0 bg-[#2C2A25] rounded-xl border border-[#4A4840] overflow-hidden">
                      <button onClick={() => removeItem(item.id)}
                        className="w-10 h-10 flex items-center justify-center text-[#8A8275] active:text-rose-400"
                        style={{ minWidth: 40, minHeight: 40 }}>
                        {item.qty === 1 ? (
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="3 6 5 6 21 6" /><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" /><path d="M10 11v6" /><path d="M14 11v6" /><path d="M9 6V4h6v2" />
                          </svg>
                        ) : (
                          <span className="text-base font-bold leading-none">−</span>
                        )}
                      </button>
                      <span className="text-sm font-semibold text-[#F7F4EE] w-8 text-center border-x border-[#4A4840]">{item.qty}</span>
                      <button onClick={() => addItem(item)}
                        className="w-10 h-10 flex items-center justify-center text-[#8A8275] active:text-[#BA7517]"
                        style={{ minWidth: 40, minHeight: 40 }}>
                        <span className="text-base font-bold leading-none">+</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Sheet footer */}
            <div className="px-5 pt-3 border-t border-[#3A3830] flex-shrink-0"
              style={{ paddingBottom: 'max(env(safe-area-inset-bottom), 20px)' }}>
              <div className="flex justify-between items-baseline mb-4">
                <span className="text-[10px] uppercase tracking-[0.2em] text-[#8A8275]">Total</span>
                <span className="text-3xl font-light text-[#F7F4EE]">
                  {total.toLocaleString('fr-FR')}<span className="text-sm text-[#8A8275] ml-1.5">DA</span>
                </span>
              </div>

              {step === 'order' && (
                <button onClick={() => setStep('pay')}
                  className="w-full bg-[#BA7517] text-white rounded-2xl text-xs tracking-[0.2em] uppercase font-medium active:bg-[#A36714] transition-colors shadow-[0_4px_12px_rgba(186,117,23,0.3)]"
                  style={{ minHeight: 56 }}>
                  Payer par carte
                </button>
              )}

              {step === 'pay' && (
                <div className="flex flex-col gap-3">
                  {/* Toggle RFID */}
                  <div className="flex items-center justify-between">
                    <p className="text-[10px] font-medium uppercase tracking-[0.25em] text-[#8A8275]">Carte client</p>
                    <button onClick={toggleRfidMode}
                      className="text-[10px] font-bold tracking-[0.08em] uppercase px-3 py-1.5 rounded-full transition-all whitespace-nowrap"
                      style={{
                        background: rfidMode ? '#BA7517' : 'transparent',
                        color:      rfidMode ? '#ffffff' : '#BA7517',
                        border:     rfidMode ? 'none'    : '1px solid rgba(186,117,23,0.4)',
                        minHeight: 32,
                      }}>
                      {rfidMode ? 'RFID ON' : 'Mode RFID'}
                    </button>
                  </div>

                  {/* Indicateur RFID */}
                  {rfidMode && !carte && (
                    <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl"
                      style={{ background: 'rgba(186,117,23,0.07)', border: '1px solid rgba(186,117,23,0.18)' }}>
                      <div style={{
                        width: 6, height: 6, borderRadius: '50%',
                        background: '#BA7517', flexShrink: 0,
                        animation: 'rfid-dot-pulse 1.2s ease-in-out infinite',
                      }} />
                      <p className="text-[10px] tracking-[0.12em] uppercase font-medium" style={{ color: '#BA7517' }}>
                        En attente de la carte...
                      </p>
                    </div>
                  )}

                  {nfcSupported && (
                    <button
                      onClick={startNFC}
                      disabled={nfcReading}
                      style={{
                        width: '100%',
                        background: nfcReading ? 'rgba(186,117,23,0.2)' : '#2C2A25',
                        color: nfcReading ? '#BA7517' : '#F7F4EE',
                        border: '1px solid rgba(186,117,23,0.3)',
                        borderRadius: 16,
                        padding: '14px 16px',
                        fontSize: 13,
                        fontWeight: 500,
                        cursor: nfcReading ? 'default' : 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: 8,
                        minHeight: 52,
                      }}
                    >
                      {nfcReading ? '📡 Approcher la carte...' : '📡 Payer par NFC'}
                    </button>
                  )}

                  {/* Input UID */}
                  <div className="flex gap-2">
                    <input
                      ref={uidRef}
                      placeholder={rfidMode ? 'Approcher la carte...' : 'UID de la carte'}
                      value={uid}
                      onChange={e => setUid(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && handleFindCarte()}
                      onBlur={handleUidBlur}
                      autoCapitalize="characters"
                      autoCorrect="off"
                      spellCheck={false}
                      className="flex-1 border border-[#4A4840] rounded-2xl px-4 text-[#F7F4EE] outline-none focus:border-[#BA7517] bg-[#3A3830] transition-colors placeholder:text-[#5A5850]"
                      style={{
                        fontSize: 16,
                        minHeight: 52,
                        animation: rfidMode ? 'rfid-border-glow 1.5s ease-in-out infinite' : 'none',
                      }}
                    />
                    <button onClick={() => handleFindCarte()} disabled={loading || !uid}
                      className="bg-[#BA7517] text-white rounded-2xl px-5 text-xs tracking-[0.15em] uppercase font-semibold active:bg-[#A36714] disabled:opacity-30 transition-colors"
                      style={{ minHeight: 52, minWidth: 64 }}>
                      OK
                    </button>
                  </div>

                  {errPay && <p className="text-xs text-rose-400">{errPay}</p>}

                  {carte && (
                    <div className={`rounded-2xl p-3.5 border ${carte.solde >= total ? 'bg-[#BA7517]/10 border-[#BA7517]/30' : 'bg-rose-500/10 border-rose-500/30'}`}>
                      <p className="text-sm font-medium text-[#F7F4EE]">{carte.clients?.prenom} {carte.clients?.nom}</p>
                      <p className="text-xs text-[#8A8275] mt-1">Solde : <span className="text-[#F7F4EE]">{carte.solde?.toLocaleString('fr-FR')} DA</span></p>
                      {carte.solde < total && <p className="text-xs text-rose-400 mt-1.5 font-medium">Solde insuffisant</p>}
                    </div>
                  )}

                  <button ref={confirmRef} onClick={handlePay}
                    disabled={!carte || carte.solde < total || loading}
                    className="w-full bg-[#BA7517] text-white rounded-2xl text-xs tracking-[0.2em] uppercase font-medium active:bg-[#A36714] disabled:opacity-30 transition-colors shadow-[0_4px_12px_rgba(186,117,23,0.3)]"
                    style={{ minHeight: 56 }}>
                    {loading ? '...' : `Confirmer ${total.toLocaleString('fr-FR')} DA`}
                  </button>

                  <button
                    onClick={() => { setStep('order'); setCarte(null); setUid(''); setErrPay(''); setRfidMode(false); rfidModeRef.current = false }}
                    className="text-[11px] tracking-[0.15em] uppercase text-[#8A8275] text-center active:text-[#F7F4EE] py-2">
                    Annuler
                  </button>
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  )
}
