'use client'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

type Item = { id: string; nom: string; prix: number; emoji: string; qty: number }

export default function Caisse() {
  const router = useRouter()
  const [menu, setMenu] = useState<any[]>([])
  const [order, setOrder] = useState<Record<string, Item>>({})
  const [carte, setCarte] = useState<any>(null)
  const [uid, setUid] = useState('')
  const [step, setStep] = useState<'order' | 'pay' | 'done'>('order')
  const [loading, setLoading] = useState(false)
  const [errPay, setErrPay] = useState('')

  useEffect(() => {
    const init = async () => {
      const { data } = await supabase.from('menu_items').select('*').eq('actif', true).order('nom')
      if (!data || data.length === 0) {
        const defaults = [
          { nom: 'Café',          prix: 200,  emoji: '☕', categorie: 'consommable', actif: true },
          { nom: 'Cocktail détox',prix: 800,  emoji: '🍹', categorie: 'consommable', actif: true },
          { nom: 'Eau pétillante',prix: 150,  emoji: '💧', categorie: 'consommable', actif: true },
          { nom: 'Massage 60 min',prix: 4500, emoji: '💆', categorie: 'soin',        actif: true },
          { nom: 'Soin visage',   prix: 3500, emoji: '✨', categorie: 'soin',        actif: true },
          { nom: 'Hammam',        prix: 2500, emoji: '🧖', categorie: 'soin',        actif: true },
          { nom: 'Manucure',      prix: 1800, emoji: '💅', categorie: 'soin',        actif: true },
          { nom: 'Huile argan',   prix: 2200, emoji: '🫙', categorie: 'consommable', actif: true },
        ]
        await supabase.from('menu_items').insert(defaults)
        const { data: seeded } = await supabase.from('menu_items').select('*').eq('actif', true).order('nom')
        setMenu(seeded ?? [])
      } else {
        setMenu(data)
      }
    }
    init()
  }, [])

  const total = Object.values(order).reduce((s, i) => s + i.prix * i.qty, 0)

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
      const updated = { ...prev }
      if (updated[id].qty > 1) updated[id] = { ...updated[id], qty: updated[id].qty - 1 }
      else delete updated[id]
      return updated
    })
  }

  const handleFindCarte = async () => {
    if (!uid) return
    setLoading(true)
    setErrPay('')
    const { data } = await supabase.from('cartes').select('*, clients(*)').eq('uid_rfid', uid).single()
    if (!data) setErrPay('Carte introuvable')
    else setCarte(data)
    setLoading(false)
  }

  const handlePay = async () => {
    if (!carte || carte.solde < total) return
    setLoading(true)
    const pts = Math.round(total / 100 * 1.5)
    await supabase.from('cartes').update({
      solde: carte.solde - total,
      points: carte.points + pts
    }).eq('id', carte.id)
    await supabase.from('transactions').insert({
      carte_id: carte.id, type: 'debit',
      montant: total, points_gagnes: pts, description: 'Caisse POS'
    })
    setStep('done')
    setLoading(false)
  }

  if (step === 'done') return (
    <div className="min-h-screen bg-[#2C2A25] flex items-center justify-center p-6">
      <div className="bg-[#3A3830] border border-[#4A4840] rounded-3xl p-10 text-center max-w-sm w-full shadow-2xl">
        <div className="w-16 h-16 rounded-full bg-[#BA7517]/15 border border-[#BA7517]/40 flex items-center justify-center mx-auto mb-6">
          <span className="text-2xl text-[#BA7517]">✓</span>
        </div>
        <h2 className="text-2xl font-light text-[#F7F4EE] mb-5">Paiement validé</h2>
        <div className="py-5 border-t border-b border-[#4A4840] flex justify-around">
          <div>
            <p className="text-[9px] tracking-[0.2em] uppercase text-[#8A8275] mb-1">Montant débité</p>
            <p className="text-2xl font-light text-[#BA7517]">{total.toLocaleString('fr-FR')} DA</p>
          </div>
          <div className="w-px bg-[#4A4840]" />
          <div>
            <p className="text-[9px] tracking-[0.2em] uppercase text-[#8A8275] mb-1">Nouveau solde</p>
            <p className="text-lg font-medium text-[#F7F4EE]">{(carte.solde - total).toLocaleString('fr-FR')} DA</p>
          </div>
        </div>
        <button
          onClick={() => { setOrder({}); setCarte(null); setUid(''); setStep('order') }}
          className="w-full mt-8 bg-[#BA7517] text-white rounded-2xl py-4 text-[10px] tracking-[0.2em] uppercase font-medium hover:bg-[#A36714] transition-colors duration-300"
        >
          Nouvelle commande
        </button>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-[#E8E2D5] flex flex-col">
      {/* Header */}
      <div className="bg-[#2C2A25] px-6 py-4 flex items-center gap-4 shadow-lg">
        <button
          onClick={() => router.push('/dashboard')}
          className="w-9 h-9 rounded-full border border-[#4A4840] flex items-center justify-center text-[#F7F4EE] opacity-70 hover:opacity-100 hover:border-[#BA7517] transition-all text-sm"
        >
          ←
        </button>
        <div>
          <h1 className="text-sm font-medium text-[#F7F4EE] tracking-wide">Caisse POS</h1>
          <p className="text-xs text-[#BA7517]">Point de vente</p>
        </div>
        {total > 0 && (
          <span className="ml-auto text-sm font-semibold text-[#BA7517] bg-[#BA7517]/10 border border-[#BA7517]/30 rounded-xl px-3 py-1">
            {total.toLocaleString('fr-FR')} DA
          </span>
        )}
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Menu */}
        <div className="flex-1 p-5 overflow-y-auto bg-[#E8E2D5]">
          <div className="grid grid-cols-3 gap-3">
            {menu.map(item => (
              <button
                key={item.id}
                onClick={() => addItem(item)}
                className="bg-white border border-[#C4B89E] rounded-2xl p-4 text-center hover:border-[#BA7517] hover:shadow-lg transition-all duration-200 active:scale-95 shadow-md"
              >
                <div className="text-2xl mb-2.5">{item.emoji}</div>
                <div className="text-[11px] font-medium text-[#2C2A25] tracking-wide mb-1 leading-tight">{item.nom}</div>
                <div className="text-[10px] text-[#8A8275]">{item.prix.toLocaleString('fr-FR')} DA</div>
              </button>
            ))}

          </div>
        </div>

        {/* Panneau commande — dark */}
        <div className="w-72 bg-[#2C2A25] flex flex-col shadow-[-4px_0_24px_rgba(0,0,0,0.2)]">
          <div className="px-5 py-4 border-b border-[#3A3830]">
            <p className="text-[9px] font-medium uppercase tracking-[0.25em] text-[#8A8275]">Commande</p>
          </div>

          <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-2">
            {Object.values(order).length === 0 && (
              <div className="flex flex-col items-center justify-center mt-12 gap-3 opacity-30">
                <div className="text-2xl text-[#F7F4EE]">⊹</div>
                <p className="text-[10px] tracking-[0.2em] uppercase text-[#F7F4EE]">Aucun article</p>
              </div>
            )}
            {Object.values(order).map(item => (
              <div key={item.id} className="flex items-center gap-2.5 px-3 py-2.5 bg-[#3A3830] rounded-2xl border border-[#4A4840]">
                <span className="text-base flex-shrink-0">{item.emoji}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-[11px] font-medium text-[#F7F4EE] truncate">{item.nom}</p>
                  <p className="text-[10px] text-[#BA7517]">{(item.prix * item.qty).toLocaleString('fr-FR')} DA</p>
                </div>
                {/* Contrôles groupés */}
                <div className="flex items-center flex-shrink-0 bg-[#2C2A25] rounded-xl border border-[#4A4840] overflow-hidden">
                  <button
                    onClick={() => removeItem(item.id)}
                    className="w-7 h-7 flex items-center justify-center text-[#8A8275] hover:text-rose-400 hover:bg-rose-500/10 transition-all"
                  >
                    {item.qty === 1 ? (
                      <svg xmlns="http://www.w3.org/2000/svg" className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4h6v2"/>
                      </svg>
                    ) : (
                      <span className="text-xs font-bold leading-none">−</span>
                    )}
                  </button>
                  <span className="text-[11px] font-semibold text-[#F7F4EE] w-5 text-center border-x border-[#4A4840]">{item.qty}</span>
                  <button
                    onClick={() => addItem(item)}
                    className="w-7 h-7 flex items-center justify-center text-[#8A8275] hover:text-[#BA7517] hover:bg-[#BA7517]/10 transition-all"
                  >
                    <span className="text-xs font-bold leading-none">+</span>
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div className="p-4 border-t border-[#3A3830]">
            <div className="flex justify-between items-baseline mb-5">
              <span className="text-[9px] uppercase tracking-[0.2em] text-[#8A8275]">Total</span>
              <span className="text-3xl font-light text-[#F7F4EE]">
                {total.toLocaleString('fr-FR')}
                <span className="text-xs text-[#8A8275] ml-1">DA</span>
              </span>
            </div>

            {step === 'order' && (
              <button
                onClick={() => setStep('pay')}
                disabled={total === 0}
                className="w-full bg-[#BA7517] text-white rounded-2xl py-3.5 text-[10px] tracking-[0.15em] uppercase font-medium hover:bg-[#A36714] transition-colors duration-300 disabled:opacity-30 shadow-[0_4px_12px_rgba(186,117,23,0.3)]"
              >
                Payer par carte
              </button>
            )}

            {step === 'pay' && (
              <div className="flex flex-col gap-3">
                <p className="text-[9px] font-medium uppercase tracking-[0.25em] text-[#8A8275]">Carte client</p>
                <div className="flex gap-2">
                  <input
                    placeholder="UID de la carte..."
                    value={uid}
                    onChange={e => setUid(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleFindCarte()}
                    className="flex-1 border border-[#4A4840] rounded-xl px-3 py-2.5 text-xs text-[#F7F4EE] outline-none focus:border-[#BA7517] bg-[#3A3830] transition-colors placeholder:text-[#5A5850]"
                  />
                  <button
                    onClick={handleFindCarte}
                    disabled={loading}
                    className="bg-[#BA7517] text-white rounded-xl px-3 py-2.5 text-[9px] tracking-[0.1em] uppercase font-medium hover:bg-[#A36714] transition-colors duration-300"
                  >
                    OK
                  </button>
                </div>
                {errPay && <p className="text-[10px] text-rose-400">{errPay}</p>}
                {carte && (
                  <div className={`rounded-xl p-3 border ${carte.solde >= total ? 'bg-[#BA7517]/10 border-[#BA7517]/30' : 'bg-rose-500/10 border-rose-500/30'}`}>
                    <p className="text-[10px] font-medium text-[#F7F4EE]">{carte.clients?.prenom} {carte.clients?.nom}</p>
                    <p className="text-[10px] text-[#8A8275] mt-0.5">Solde : {carte.solde?.toLocaleString('fr-FR')} DA</p>
                    {carte.solde < total && <p className="text-[10px] text-rose-400 mt-1 font-medium">Solde insuffisant</p>}
                  </div>
                )}
                <button
                  onClick={handlePay}
                  disabled={!carte || carte.solde < total || loading}
                  className="w-full bg-[#BA7517] text-white rounded-xl py-3 text-[10px] tracking-[0.15em] uppercase font-medium hover:bg-[#A36714] transition-colors disabled:opacity-30 shadow-[0_4px_12px_rgba(186,117,23,0.3)]"
                >
                  {loading ? '...' : `Confirmer ${total.toLocaleString('fr-FR')} DA`}
                </button>
                <button
                  onClick={() => { setStep('order'); setCarte(null); setUid(''); setErrPay('') }}
                  className="text-[9px] tracking-[0.15em] uppercase text-[#8A8275] text-center hover:text-[#F7F4EE] transition-colors"
                >
                  Annuler
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

    </div>
  )
}
