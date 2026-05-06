'use client'
import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

const MONTANTS = [2000, 5000, 10000, 20000]

const NIVEAU: Record<string, string> = {
  Bronze:  'bg-[#C4813A]/20 text-[#C4813A]',
  Argent:  'bg-[#8A8275]/20 text-[#8A8275]',
  Or:      'bg-[#BA7517]/20 text-[#BA7517]',
  Platine: 'bg-[#7C6FAE]/20 text-[#7C6FAE]',
}

export default function Recharge() {
  const router = useRouter()
  const [uid, setUid] = useState('')
  const [carte, setCarte] = useState<any>(null)
  const [montant, setMontant] = useState<number | null>(null)
  const [custom, setCustom] = useState('')
  const [note, setNote] = useState('')
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)
  const [error, setError] = useState('')

  const handleSearch = async () => {
    if (!uid) return
    setLoading(true)
    setError('')
    setCarte(null)
    const { data } = await supabase
      .from('cartes')
      .select('*, clients(*)')
      .eq('uid_rfid', uid)
      .single()
    if (!data) setError('Carte introuvable')
    else setCarte(data)
    setLoading(false)
  }

  const getMontant = () => montant || (custom ? parseInt(custom) : 0)

  const handleRecharge = async () => {
    const amt = getMontant()
    if (!amt || !carte) return
    setLoading(true)
    const nouveauSolde = carte.solde + amt
    await supabase.from('cartes').update({ solde: nouveauSolde }).eq('id', carte.id)
    await supabase.from('transactions').insert({
      carte_id: carte.id,
      type: 'recharge',
      montant: amt,
      description: note || `Recharge salon — ${amt} DA`,
    })
    setCarte({ ...carte, solde: nouveauSolde })
    setDone(true)
    setLoading(false)
  }

  if (done) return (
    <div className="min-h-screen bg-[#E8E2D5] flex items-center justify-center p-6">
      <div className="bg-white border border-[#C4B89E] rounded-2xl p-8 text-center max-w-sm w-full shadow-lg">
        <div className="w-14 h-14 rounded-xl bg-[#BA7517]/10 border border-[#BA7517]/30 flex items-center justify-center mx-auto mb-5">
          <span className="text-2xl text-[#BA7517]">✓</span>
        </div>
        <h2 className="text-xl font-medium text-[#2C2A25] mb-1">Recharge effectuée</h2>
        <p className="text-sm text-[#8A8275] mt-2">{carte.clients?.prenom} {carte.clients?.nom}</p>
        <p className="text-sm text-[#8A8275]">+{getMontant().toLocaleString('fr-FR')} DA ajoutés</p>
        <div className="mt-5 py-4 border-t border-b border-[#EDE8DE]">
          <p className="text-[9px] tracking-[0.2em] uppercase text-[#8A8275] mb-1">Nouveau solde</p>
          <p className="text-4xl font-light text-[#BA7517]">
            {carte.solde.toLocaleString('fr-FR')}
            <span className="text-base font-normal text-[#8A8275] ml-1">DA</span>
          </p>
        </div>
        <div className="flex gap-3 mt-6">
          <button
            onClick={() => { setCarte(null); setUid(''); setMontant(null); setCustom(''); setNote(''); setDone(false) }}
            className="flex-1 border border-[#C4B89E] rounded-xl py-3 text-xs text-[#2C2A25] hover:bg-[#E8E2D5] transition-colors"
          >
            Nouvelle recharge
          </button>
          <button
            onClick={() => router.push('/dashboard')}
            className="flex-1 bg-[#2C2A25] text-[#F7F4EE] rounded-xl py-3 text-xs font-medium hover:opacity-90 transition-opacity"
          >
            Dashboard
          </button>
        </div>
      </div>
    </div>
  )

  const niveau = carte?.niveau || 'Bronze'
  const avatarStyle = NIVEAU[niveau] || NIVEAU.Bronze

  return (
    <div className="min-h-screen bg-[#E8E2D5]">

      {/* Header */}
      <div className="bg-[#2C2A25] px-6 py-4 flex items-center gap-4 shadow-lg">
        <button
          onClick={() => router.push('/dashboard')}
          className="w-9 h-9 rounded-full border border-[#4A4840] flex items-center justify-center text-[#F7F4EE] opacity-70 hover:opacity-100 hover:border-[#BA7517] transition-all text-sm flex-shrink-0"
        >
          ←
        </button>
        <div>
          <h1 className="text-base font-medium text-[#F7F4EE]">Recharge de carte</h1>
          <p className="text-xs text-[#BA7517]">Ajouter du solde</p>
        </div>
      </div>

      <div className="p-6 max-w-lg mx-auto flex flex-col gap-5">

        {/* Recherche carte */}
        <div className="bg-white border border-[#C4B89E] rounded-2xl p-6 shadow-md">
          <div className="flex items-center gap-2 mb-5">
            <div className="w-1 h-5 bg-[#BA7517] rounded-full" />
            <p className="text-xs font-semibold text-[#2C2A25] uppercase tracking-wider">Carte à recharger</p>
          </div>
          <div className="flex gap-3">
            <input
              placeholder="UID de la carte..."
              value={uid}
              onChange={e => setUid(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSearch()}
              className="flex-1 border border-[#C4B89E] rounded-xl px-4 py-3 text-sm text-[#2C2A25] outline-none focus:border-[#BA7517] focus:ring-1 focus:ring-[#BA7517]/20 bg-[#F7F4EE] placeholder:text-[#B0A898]"
            />
            <button
              onClick={handleSearch}
              disabled={loading || !uid}
              className="bg-[#2C2A25] text-[#F7F4EE] rounded-xl px-5 text-xs font-medium hover:opacity-90 transition-opacity disabled:opacity-40 whitespace-nowrap"
            >
              {loading ? '...' : 'Chercher'}
            </button>
          </div>
          {error && <p className="text-xs text-rose-500 mt-3">{error}</p>}

          {carte && (
            <div className="mt-4 flex items-center gap-3 p-4 rounded-xl border border-[#C4B89E] bg-[#F7F4EE]">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-sm font-semibold flex-shrink-0 ${avatarStyle}`}>
                {carte.clients?.prenom?.[0]?.toUpperCase()}{carte.clients?.nom?.[0]?.toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-[#2C2A25]">
                  {carte.clients?.prenom} {carte.clients?.nom}
                </p>
                <p className="text-[10px] text-[#8A8275] mt-0.5">
                  Niveau {carte.niveau} · {carte.points} pts
                </p>
              </div>
              <div className="text-right flex-shrink-0">
                <p className="text-sm font-semibold text-[#BA7517]">{carte.solde?.toLocaleString('fr-FR')} DA</p>
                <p className="text-[9px] text-[#8A8275] uppercase tracking-wide mt-0.5">solde actuel</p>
              </div>
            </div>
          )}
        </div>

        {/* Montant */}
        {carte && (
          <>
            <div className="bg-white border border-[#C4B89E] rounded-2xl p-6 shadow-md">
              <div className="flex items-center gap-2 mb-5">
                <div className="w-1 h-5 bg-[#BA7517] rounded-full" />
                <p className="text-xs font-semibold text-[#2C2A25] uppercase tracking-wider">Montant de la recharge</p>
              </div>
              <div className="grid grid-cols-4 gap-2 mb-4">
                {MONTANTS.map(m => (
                  <button
                    key={m}
                    onClick={() => { setMontant(m); setCustom('') }}
                    className={`py-3 rounded-xl text-xs font-medium border transition-all duration-200 ${
                      montant === m
                        ? 'bg-[#2C2A25] text-[#F7F4EE] border-[#2C2A25] shadow-md'
                        : 'bg-[#F7F4EE] text-[#2C2A25] border-[#C4B89E] hover:border-[#BA7517]'
                    }`}
                  >
                    {m.toLocaleString('fr-FR')}
                  </button>
                ))}
              </div>
              <div className="flex items-center gap-3">
                <label className="text-[10px] text-[#8A8275] whitespace-nowrap uppercase tracking-wide">Montant libre</label>
                <input
                  type="number"
                  placeholder="ex : 7 500"
                  value={custom}
                  onChange={e => { setCustom(e.target.value); setMontant(null) }}
                  className="flex-1 border border-[#C4B89E] rounded-xl px-4 py-2.5 text-sm text-[#2C2A25] outline-none focus:border-[#BA7517] focus:ring-1 focus:ring-[#BA7517]/20 bg-[#F7F4EE] placeholder:text-[#B0A898]"
                />
                <span className="text-[10px] text-[#8A8275] uppercase tracking-wide">DA</span>
              </div>
            </div>

            <div className="bg-white border border-[#C4B89E] rounded-2xl p-6 shadow-md">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-1 h-5 bg-[#BA7517] rounded-full" />
                <p className="text-xs font-semibold text-[#2C2A25] uppercase tracking-wider">
                  Note interne <span className="normal-case tracking-normal font-normal text-[#8A8275]">(optionnel)</span>
                </p>
              </div>
              <input
                placeholder="ex : Paiement espèces, offert par..."
                value={note}
                onChange={e => setNote(e.target.value)}
                className="w-full border border-[#C4B89E] rounded-xl px-4 py-3 text-sm text-[#2C2A25] outline-none focus:border-[#BA7517] focus:ring-1 focus:ring-[#BA7517]/20 bg-[#F7F4EE] placeholder:text-[#B0A898]"
              />
            </div>

            {getMontant() > 0 && (
              <div className="bg-[#2C2A25] border border-[#3A3830] rounded-2xl p-5 flex justify-between items-center shadow-md">
                <div>
                  <p className="text-[9px] tracking-[0.2em] uppercase text-[#8A8275] mb-1">Solde après recharge</p>
                  <p className="text-3xl font-light text-[#BA7517]">
                    {(carte.solde + getMontant()).toLocaleString('fr-FR')}
                    <span className="text-sm font-normal text-[#8A8275] ml-1">DA</span>
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-[9px] tracking-[0.2em] uppercase text-[#8A8275] mb-1">Recharge</p>
                  <p className="text-lg font-medium text-[#F7F4EE]">+{getMontant().toLocaleString('fr-FR')} DA</p>
                </div>
              </div>
            )}

            <button
              onClick={handleRecharge}
              disabled={getMontant() === 0 || loading}
              className="bg-[#2C2A25] text-[#F7F4EE] rounded-xl py-4 text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-40 shadow-md"
            >
              {loading
                ? 'Recharge en cours...'
                : getMontant() > 0
                  ? `Recharger ${getMontant().toLocaleString('fr-FR')} DA`
                  : 'Choisir un montant'
              }
            </button>
          </>
        )}
      </div>
    </div>
  )
}
