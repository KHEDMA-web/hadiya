'use client'
import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

const MONTANTS = [2000, 5000, 10000, 20000]

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
    <div className="min-h-screen bg-[#F7F4EE] flex items-center justify-center p-6">
      <div className="bg-white border border-[#D4CBBA] rounded-2xl p-8 text-center max-w-sm w-full">
        <div className="w-14 h-14 rounded-full bg-[#EAF3DE] border border-[#9FD490] flex items-center justify-center mx-auto mb-4 text-2xl">✓</div>
        <h2 className="text-lg font-medium text-[#2C2A25] mb-2">Recharge effectuée</h2>
        <p className="text-sm text-[#8A8275] mb-1">
          {carte.clients?.prenom} {carte.clients?.nom}
        </p>
        <p className="text-sm text-[#8A8275] mb-1">+{getMontant().toLocaleString('fr-FR')} DA ajoutés</p>
        <p className="text-base font-medium text-[#27500A] mb-6">
          Nouveau solde : {carte.solde.toLocaleString('fr-FR')} DA
        </p>
        <div className="flex gap-3">
          <button
            onClick={() => { setCarte(null); setUid(''); setMontant(null); setCustom(''); setNote(''); setDone(false) }}
            className="flex-1 border border-[#D4CBBA] rounded-xl py-3 text-sm text-[#2C2A25] hover:bg-[#F7F4EE] transition">
            Nouvelle recharge
          </button>
          <button
            onClick={() => router.push('/dashboard')}
            className="flex-1 bg-[#2C2A25] text-[#F7F4EE] rounded-xl py-3 text-sm font-medium hover:opacity-90 transition">
            Dashboard
          </button>
        </div>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-[#F7F4EE]">
      <div className="bg-white border-b border-[#D4CBBA] px-6 py-4 flex items-center gap-4">
        <button onClick={() => router.push('/dashboard')} className="text-[#8A8275] hover:text-[#2C2A25] text-lg">←</button>
        <div>
          <h1 className="text-base font-medium text-[#2C2A25]">Recharge de carte</h1>
          <p className="text-xs text-[#8A8275]">Ajouter du solde à une carte existante</p>
        </div>
      </div>

      <div className="p-6 max-w-lg mx-auto flex flex-col gap-4">

        {/* Recherche carte */}
        <div className="bg-white border border-[#D4CBBA] rounded-2xl p-6">
          <p className="text-xs font-medium text-[#8A8275] uppercase tracking-wider mb-3">Carte à recharger</p>
          <div className="flex gap-3">
            <input
              placeholder="UID de la carte..."
              value={uid}
              onChange={e => setUid(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSearch()}
              className="flex-1 border border-[#D4CBBA] rounded-xl px-4 py-3 text-sm text-[#2C2A25] outline-none focus:border-[#2C2A25] bg-[#F7F4EE]"
            />
            <button onClick={handleSearch} disabled={loading}
              className="bg-[#2C2A25] text-[#F7F4EE] rounded-xl px-5 text-sm font-medium hover:opacity-90 transition disabled:opacity-50">
              {loading ? '...' : 'Chercher'}
            </button>
          </div>
          {error && <p className="text-red-500 text-xs mt-2">{error}</p>}

          {carte && (
            <div className="mt-4 flex items-center gap-3 p-3 bg-[#F7F4EE] rounded-xl border border-[#EDE8DE]">
              <div className="w-10 h-10 rounded-full bg-[#FAEEDA] flex items-center justify-center text-sm font-medium text-[#633806] flex-shrink-0">
                {carte.clients?.prenom?.[0]}{carte.clients?.nom?.[0]}
              </div>
              <div className="flex-1">
                <p className="font-medium text-[#2C2A25] text-sm">{carte.clients?.prenom} {carte.clients?.nom}</p>
                <p className="text-xs text-[#8A8275]">Niveau {carte.niveau} · {carte.points} pts</p>
              </div>
              <div className="text-right">
                <p className="text-sm font-medium text-[#27500A]">{carte.solde?.toLocaleString('fr-FR')} DA</p>
                <p className="text-xs text-[#8A8275]">solde actuel</p>
              </div>
            </div>
          )}
        </div>

        {/* Montant */}
        {carte && (
          <>
            <div className="bg-white border border-[#D4CBBA] rounded-2xl p-6">
              <p className="text-xs font-medium text-[#8A8275] uppercase tracking-wider mb-3">Montant de la recharge</p>
              <div className="grid grid-cols-4 gap-2 mb-4">
                {MONTANTS.map(m => (
                  <button key={m} onClick={() => { setMontant(m); setCustom('') }}
                    className={`py-3 rounded-xl text-sm font-medium border transition ${
                      montant === m
                        ? 'bg-[#2C2A25] text-[#F7F4EE] border-[#2C2A25]'
                        : 'bg-[#F7F4EE] text-[#2C2A25] border-[#D4CBBA] hover:border-[#2C2A25]'
                    }`}>
                    {m.toLocaleString('fr-FR')}
                  </button>
                ))}
              </div>
              <div className="flex items-center gap-3">
                <span className="text-xs text-[#8A8275] whitespace-nowrap">Montant libre :</span>
                <input
                  type="number"
                  placeholder="ex: 7 500"
                  value={custom}
                  onChange={e => { setCustom(e.target.value); setMontant(null) }}
                  className="flex-1 border border-[#D4CBBA] rounded-xl px-4 py-2.5 text-sm text-[#2C2A25] outline-none focus:border-[#2C2A25] bg-[#F7F4EE]"
                />
                <span className="text-xs text-[#8A8275]">DA</span>
              </div>
            </div>

            <div className="bg-white border border-[#D4CBBA] rounded-2xl p-6">
              <p className="text-xs font-medium text-[#8A8275] uppercase tracking-wider mb-3">Note interne (optionnel)</p>
              <input
                placeholder="ex: Paiement espèces, offert par M. Khelifi..."
                value={note}
                onChange={e => setNote(e.target.value)}
                className="w-full border border-[#D4CBBA] rounded-xl px-4 py-3 text-sm text-[#2C2A25] outline-none focus:border-[#2C2A25] bg-[#F7F4EE]"
              />
            </div>

            {getMontant() > 0 && (
              <div className="bg-[#F7F4EE] border border-[#D4CBBA] rounded-2xl p-4 flex justify-between items-center">
                <div>
                  <p className="text-xs text-[#8A8275]">Solde après recharge</p>
                  <p className="text-xl font-medium text-[#27500A]">
                    {(carte.solde + getMontant()).toLocaleString('fr-FR')} DA
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-[#8A8275]">Recharge</p>
                  <p className="text-sm font-medium text-[#2C2A25]">+{getMontant().toLocaleString('fr-FR')} DA</p>
                </div>
              </div>
            )}

            <button
              onClick={handleRecharge}
              disabled={getMontant() === 0 || loading}
              className="bg-[#2C2A25] text-[#F7F4EE] rounded-xl py-4 text-sm font-medium hover:opacity-90 transition disabled:opacity-40">
              {loading ? 'Recharge en cours...' : `Recharger ${getMontant() > 0 ? getMontant().toLocaleString('fr-FR') + ' DA' : ''}`}
            </button>
          </>
        )}
      </div>
    </div>
  )
}