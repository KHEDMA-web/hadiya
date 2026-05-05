'use client'
import { useState, useRef } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

export default function Scanner() {
  const router = useRouter()
  const [uid, setUid] = useState('')
  const [carte, setCarte] = useState<any>(null)
  const [montant, setMontant] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState('')
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

    if (!data) {
      setError('Carte introuvable')
    } else if (data.statut === 'expiree') {
      setError('Cette carte est expirée')
    } else {
      setCarte(data)
    }
    setLoading(false)
  }

  const handleDebit = async () => {
    if (!montant || !carte) return
    const amt = parseFloat(montant)
    if (amt > carte.solde) { setError('Solde insuffisant'); return }
    setLoading(true)

    const nouveauSolde = carte.solde - amt
    const pts = Math.round(amt / 100 * 1.5)

    await supabase.from('cartes').update({
      solde: nouveauSolde,
      points: carte.points + pts,
      statut: nouveauSolde === 0 ? 'epuisee' : 'active'
    }).eq('id', carte.id)

    await supabase.from('transactions').insert({
      carte_id: carte.id,
      type: 'debit',
      montant: amt,
      points_gagnes: pts,
      description: `Débit en salon — ${amt} DA`,
    })

    setCarte({ ...carte, solde: nouveauSolde, points: carte.points + pts })
    setSuccess(`✓ ${amt.toLocaleString('fr-FR')} DA débités — +${pts} points`)
    setMontant('')
    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-[#F7F4EE]">
      <div className="bg-white border-b border-[#D4CBBA] px-6 py-4 flex items-center gap-4">
        <button onClick={() => router.push('/dashboard')} className="text-[#8A8275] hover:text-[#2C2A25]">←</button>
        <div>
          <h1 className="text-base font-medium text-[#2C2A25]">Scanner une carte</h1>
          <p className="text-xs text-[#8A8275]">QR code ou numéro de carte</p>
        </div>
      </div>

      <div className="p-6 max-w-lg mx-auto flex flex-col gap-4">
        <div className="bg-white border border-[#D4CBBA] rounded-2xl p-6">
          <p className="text-xs font-medium text-[#8A8275] mb-3 uppercase tracking-wider">Numéro de carte</p>
          <div className="flex gap-3">
            <input
              placeholder="Coller l'UID ou scanner le QR..."
              value={uid}
              onChange={e => setUid(e.target.value)}
              className="flex-1 border border-[#D4CBBA] rounded-xl px-4 py-3 text-sm text-[#2C2A25] outline-none focus:border-[#2C2A25] bg-[#F7F4EE]"
            />
            <button
              onClick={handleSearch}
              disabled={loading}
              className="bg-[#2C2A25] text-[#F7F4EE] rounded-xl px-5 text-sm font-medium hover:opacity-90 transition disabled:opacity-50"
            >
              {loading ? '...' : 'Chercher'}
            </button>
          </div>
          {error && <p className="text-red-500 text-xs mt-2">{error}</p>}
        </div>

        {carte && (
          <div className="bg-white border border-[#D4CBBA] rounded-2xl p-6">
            <div className="flex items-center gap-3 mb-4 pb-4 border-b border-[#D4CBBA]">
              <div className="w-10 h-10 rounded-full bg-[#FAEEDA] flex items-center justify-center text-sm font-medium text-[#633806]">
                {carte.clients?.prenom?.[0]}{carte.clients?.nom?.[0]}
              </div>
              <div>
                <p className="font-medium text-[#2C2A25] text-sm">{carte.clients?.prenom} {carte.clients?.nom}</p>
                <p className="text-xs text-[#8A8275]">Niveau {carte.niveau} · {carte.points} pts</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 mb-4">
              <div className="bg-[#EAF3DE] rounded-xl p-4">
                <p className="text-xs text-[#27500A] opacity-70 mb-1">Solde disponible</p>
                <p className="text-xl font-medium text-[#27500A]">{carte.solde?.toLocaleString('fr-FR')} DA</p>
              </div>
              <div className="bg-[#F7F4EE] rounded-xl p-4">
                <p className="text-xs text-[#8A8275] mb-1">Expire le</p>
                <p className="text-sm font-medium text-[#2C2A25]">
                  {carte.date_expiration ? new Date(carte.date_expiration).toLocaleDateString('fr-FR') : 'Sans limite'}
                </p>
              </div>
            </div>

            {success && (
              <div className="bg-[#EAF3DE] border border-[#9FD490] rounded-xl p-3 mb-4 text-sm text-[#27500A] font-medium">
                {success}
              </div>
            )}

            <p className="text-xs font-medium text-[#8A8275] mb-2 uppercase tracking-wider">Débiter un montant</p>
            <div className="flex gap-3">
              <input
                type="number"
                placeholder="Montant (DA)"
                value={montant}
                onChange={e => setMontant(e.target.value)}
                className="flex-1 border border-[#D4CBBA] rounded-xl px-4 py-3 text-sm text-[#2C2A25] outline-none focus:border-[#2C2A25] bg-[#F7F4EE]"
              />
              <button
                onClick={handleDebit}
                disabled={loading || !montant}
                className="bg-[#2C2A25] text-[#F7F4EE] rounded-xl px-5 text-sm font-medium hover:opacity-90 transition disabled:opacity-50"
              >
                Valider
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
