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
    supabase.from('menu_items').select('*').eq('actif', true).then(({ data }) => {
      if (!data || data.length === 0) {
        setMenu([
          { id: '1', nom: 'Café', prix: 200, emoji: '☕', categorie: 'boisson' },
          { id: '2', nom: 'Cocktail détox', prix: 800, emoji: '🍹', categorie: 'boisson' },
          { id: '3', nom: 'Eau pétillante', prix: 150, emoji: '💧', categorie: 'boisson' },
          { id: '4', nom: 'Massage 60 min', prix: 4500, emoji: '💆', categorie: 'soin' },
          { id: '5', nom: 'Soin visage', prix: 3500, emoji: '✨', categorie: 'soin' },
          { id: '6', nom: 'Hammam', prix: 2500, emoji: '🧖', categorie: 'soin' },
          { id: '7', nom: 'Manucure', prix: 1800, emoji: '💅', categorie: 'soin' },
          { id: '8', nom: 'Huile argan', prix: 2200, emoji: '🫙', categorie: 'produit' },
        ])
      } else { setMenu(data) }
    })
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
    <div className="min-h-screen bg-[#F7F4EE] flex items-center justify-center p-6">
      <div className="bg-white border border-[#D4CBBA] rounded-2xl p-8 text-center max-w-sm w-full">
        <div className="w-14 h-14 rounded-full bg-[#EAF3DE] border border-[#9FD490] flex items-center justify-center mx-auto mb-4 text-2xl">✓</div>
        <h2 className="text-lg font-medium text-[#2C2A25] mb-2">Paiement validé</h2>
        <p className="text-sm text-[#8A8275] mb-1">{total.toLocaleString('fr-FR')} DA débités</p>
        <p className="text-sm text-[#8A8275] mb-6">Nouveau solde : {(carte.solde - total).toLocaleString('fr-FR')} DA</p>
        <button onClick={() => { setOrder({}); setCarte(null); setUid(''); setStep('order') }}
          className="w-full bg-[#2C2A25] text-[#F7F4EE] rounded-xl py-3 text-sm font-medium hover:opacity-90 transition">
          Nouvelle commande
        </button>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-[#F7F4EE] flex flex-col">
      <div className="bg-white border-b border-[#D4CBBA] px-6 py-4 flex items-center gap-4">
        <button onClick={() => router.push('/dashboard')} className="text-[#8A8275] hover:text-[#2C2A25] text-lg">←</button>
        <h1 className="text-base font-medium text-[#2C2A25]">Caisse POS</h1>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Menu produits */}
        <div className="flex-1 p-4 overflow-y-auto">
          <div className="grid grid-cols-3 gap-3">
            {menu.map(item => (
              <button key={item.id} onClick={() => addItem(item)}
                className="bg-white border border-[#D4CBBA] rounded-2xl p-4 text-center hover:border-[#2C2A25] hover:shadow-sm transition active:scale-95">
                <div className="text-3xl mb-2">{item.emoji}</div>
                <div className="text-xs font-medium text-[#2C2A25] mb-1">{item.nom}</div>
                <div className="text-xs text-[#8A8275]">{item.prix.toLocaleString('fr-FR')} DA</div>
              </button>
            ))}
          </div>
        </div>

        {/* Panneau commande */}
        <div className="w-72 bg-white border-l border-[#D4CBBA] flex flex-col">
          <div className="p-4 border-b border-[#D4CBBA]">
            <p className="text-xs font-medium text-[#8A8275] uppercase tracking-wider">Commande en cours</p>
          </div>

          <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-2">
            {Object.values(order).length === 0 && (
              <p className="text-xs text-[#8A8275] text-center mt-8">Aucun article ajouté</p>
            )}
            {Object.values(order).map(item => (
              <div key={item.id} className="flex items-center gap-2 p-3 bg-[#F7F4EE] rounded-xl border border-[#EDE8DE]">
                <span className="text-xl flex-shrink-0">{item.emoji}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-[#2C2A25] truncate">{item.nom}</p>
                  <p className="text-xs text-[#8A8275]">{(item.prix * item.qty).toLocaleString('fr-FR')} DA</p>
                </div>
                <div className="flex items-center gap-1 flex-shrink-0">
                  <button onClick={() => removeItem(item.id)}
                    className="w-6 h-6 rounded-lg bg-white border border-[#D4CBBA] text-sm font-medium text-[#2C2A25] flex items-center justify-center hover:bg-[#F7F4EE]">
                    −
                  </button>
                  <span className="text-xs font-medium text-[#2C2A25] w-5 text-center">{item.qty}</span>
                  <button onClick={() => addItem(item)}
                    className="w-6 h-6 rounded-lg bg-white border border-[#D4CBBA] text-sm font-medium text-[#2C2A25] flex items-center justify-center hover:bg-[#F7F4EE]">
                    +
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div className="p-4 border-t border-[#D4CBBA]">
            <div className="flex justify-between items-baseline mb-4">
              <span className="text-sm text-[#8A8275]">Total</span>
              <span className="text-2xl font-medium text-[#2C2A25]">{total.toLocaleString('fr-FR')} DA</span>
            </div>

            {step === 'order' && (
              <button onClick={() => setStep('pay')} disabled={total === 0}
                className="w-full bg-[#2C2A25] text-[#F7F4EE] rounded-xl py-3 text-sm font-medium hover:opacity-90 transition disabled:opacity-40">
                Payer par carte
              </button>
            )}

            {step === 'pay' && (
              <div className="flex flex-col gap-3">
                <p className="text-xs font-medium text-[#8A8275] uppercase tracking-wider">Carte client</p>
                <div className="flex gap-2">
                  <input
                    placeholder="UID de la carte..."
                    value={uid}
                    onChange={e => setUid(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleFindCarte()}
                    className="flex-1 border border-[#D4CBBA] rounded-xl px-3 py-2.5 text-xs text-[#2C2A25] outline-none focus:border-[#2C2A25] bg-[#F7F4EE]"
                  />
                  <button onClick={handleFindCarte} disabled={loading}
                    className="bg-[#2C2A25] text-[#F7F4EE] rounded-xl px-4 py-2.5 text-xs font-medium hover:opacity-90 transition">
                    OK
                  </button>
                </div>
                {errPay && <p className="text-xs text-red-500">{errPay}</p>}
                {carte && (
                  <div className="bg-[#EAF3DE] rounded-xl p-3 border border-[#9FD490]">
                    <p className="text-xs font-medium text-[#27500A]">{carte.clients?.prenom} {carte.clients?.nom}</p>
                    <p className="text-xs text-[#27500A] mt-0.5">Solde : {carte.solde?.toLocaleString('fr-FR')} DA</p>
                    {carte.solde < total && (
                      <p className="text-xs text-red-600 mt-1 font-medium">⚠ Solde insuffisant</p>
                    )}
                  </div>
                )}
                <button onClick={handlePay} disabled={!carte || carte.solde < total || loading}
                  className="w-full bg-[#27500A] text-white rounded-xl py-3 text-sm font-medium hover:opacity-90 transition disabled:opacity-40">
                  {loading ? '...' : `Confirmer ${total.toLocaleString('fr-FR')} DA`}
                </button>
                <button onClick={() => { setStep('order'); setCarte(null); setUid(''); setErrPay('') }}
                  className="text-xs text-[#8A8275] text-center hover:text-[#2C2A25] transition">
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