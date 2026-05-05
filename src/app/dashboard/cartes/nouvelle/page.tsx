'use client'
import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import QRCode from 'qrcode'

export default function NouvelleCarte() {
  const router = useRouter()
  const [form, setForm] = useState({
    prenom: '', nom: '', telephone: '', montant: '',
    message: '', offert_par: '', expiration: ''
  })
  const [loading, setLoading] = useState(false)
  const [carteCreee, setCarteCreee] = useState<any>(null)
  const [qrUrl, setQrUrl] = useState('')

  const handleCreate = async () => {
    if (!form.prenom || !form.nom || !form.montant) return
    setLoading(true)

    // Créer le client
    const { data: client } = await supabase.from('clients').insert({
      prenom: form.prenom,
      nom: form.nom,
      telephone: form.telephone,
    }).select().single()

    // Créer la carte
    const uid = crypto.randomUUID()
    const { data: carte } = await supabase.from('cartes').insert({
      client_id: client?.id,
      uid_rfid: uid,
      type: 'cadeau',
      solde: parseFloat(form.montant),
      message_perso: form.message,
      offert_par: form.offert_par,
      date_expiration: form.expiration || null,
    }).select().single()

    // Enregistrer transaction initiale
    await supabase.from('transactions').insert({
      carte_id: carte?.id,
      type: 'cadeau',
      montant: parseFloat(form.montant),
      description: `Carte cadeau créée — ${form.montant} DA`,
    })

    // Générer QR code
    const url = `${window.location.origin}/carte/${uid}`
    const qr = await QRCode.toDataURL(url, { width: 300, margin: 2 })
    setQrUrl(qr)
    setCarteCreee({ ...carte, client, uid, url })
    setLoading(false)
  }

  if (carteCreee) {
    return (
      <div className="min-h-screen bg-[#F7F4EE] flex items-center justify-center p-6">
        <div className="bg-white border border-[#D4CBBA] rounded-2xl p-8 w-full max-w-md text-center">
          <div className="text-4xl mb-4">🎁</div>
          <h2 className="text-xl font-medium text-[#2C2A25] mb-1">Carte créée !</h2>
          <p className="text-sm text-[#8A8275] mb-6">
            Pour {carteCreee.client?.prenom} {carteCreee.client?.nom} — {form.montant} DA
          </p>
          {qrUrl && (
            <div className="flex flex-col items-center gap-4 mb-6">
              <img src={qrUrl} alt="QR Code" className="rounded-xl border border-[#D4CBBA]" />
              <a
                href={qrUrl}
                download={`carte-${carteCreee.uid}.png`}
                className="text-xs text-[#8A8275] underline"
              >
                Télécharger le QR code
              </a>
              <p className="text-xs text-[#8A8275] break-all">{carteCreee.url}</p>
            </div>
          )}
          <div className="flex gap-3">
            <button
              onClick={() => { setCarteCreee(null); setForm({ prenom:'',nom:'',telephone:'',montant:'',message:'',offert_par:'',expiration:'' }) }}
              className="flex-1 border border-[#D4CBBA] rounded-xl py-3 text-sm text-[#2C2A25] hover:bg-[#F7F4EE] transition"
            >
              Nouvelle carte
            </button>
            <button
              onClick={() => router.push('/dashboard')}
              className="flex-1 bg-[#2C2A25] text-[#F7F4EE] rounded-xl py-3 text-sm hover:opacity-90 transition"
            >
              Dashboard
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#F7F4EE]">
      <div className="bg-white border-b border-[#D4CBBA] px-6 py-4 flex items-center gap-4">
        <button onClick={() => router.push('/dashboard')} className="text-[#8A8275] hover:text-[#2C2A25]">←</button>
        <div>
          <h1 className="text-base font-medium text-[#2C2A25]">Nouvelle carte cadeau</h1>
          <p className="text-xs text-[#8A8275]">Remplir les informations</p>
        </div>
      </div>

      <div className="p-6 max-w-lg mx-auto flex flex-col gap-4">
        <div className="bg-white border border-[#D4CBBA] rounded-2xl p-6">
          <p className="text-xs font-medium text-[#8A8275] mb-4 uppercase tracking-wider">Bénéficiaire</p>
          <div className="flex gap-3 mb-3">
            <input placeholder="Prénom *" value={form.prenom} onChange={e => setForm({...form, prenom: e.target.value})}
              className="flex-1 border border-[#D4CBBA] rounded-xl px-4 py-3 text-sm text-[#2C2A25] outline-none focus:border-[#2C2A25] bg-[#F7F4EE]" />
            <input placeholder="Nom *" value={form.nom} onChange={e => setForm({...form, nom: e.target.value})}
              className="flex-1 border border-[#D4CBBA] rounded-xl px-4 py-3 text-sm text-[#2C2A25] outline-none focus:border-[#2C2A25] bg-[#F7F4EE]" />
          </div>
          <input placeholder="Téléphone (WhatsApp)" value={form.telephone} onChange={e => setForm({...form, telephone: e.target.value})}
            className="w-full border border-[#D4CBBA] rounded-xl px-4 py-3 text-sm text-[#2C2A25] outline-none focus:border-[#2C2A25] bg-[#F7F4EE]" />
        </div>

        <div className="bg-white border border-[#D4CBBA] rounded-2xl p-6">
          <p className="text-xs font-medium text-[#8A8275] mb-4 uppercase tracking-wider">Carte</p>
          <input placeholder="Montant (DA) *" type="number" value={form.montant} onChange={e => setForm({...form, montant: e.target.value})}
            className="w-full border border-[#D4CBBA] rounded-xl px-4 py-3 text-sm text-[#2C2A25] outline-none focus:border-[#2C2A25] bg-[#F7F4EE] mb-3" />
          <input placeholder="Offert par" value={form.offert_par} onChange={e => setForm({...form, offert_par: e.target.value})}
            className="w-full border border-[#D4CBBA] rounded-xl px-4 py-3 text-sm text-[#2C2A25] outline-none focus:border-[#2C2A25] bg-[#F7F4EE] mb-3" />
          <input placeholder="Message personnalisé" value={form.message} onChange={e => setForm({...form, message: e.target.value})}
            className="w-full border border-[#D4CBBA] rounded-xl px-4 py-3 text-sm text-[#2C2A25] outline-none focus:border-[#2C2A25] bg-[#F7F4EE] mb-3" />
          <div className="flex flex-col gap-1">
            <label className="text-xs text-[#8A8275]">Date d'expiration</label>
            <input type="date" value={form.expiration} onChange={e => setForm({...form, expiration: e.target.value})}
              className="w-full border border-[#D4CBBA] rounded-xl px-4 py-3 text-sm text-[#2C2A25] outline-none focus:border-[#2C2A25] bg-[#F7F4EE]" />
          </div>
        </div>

        <button
          onClick={handleCreate}
          disabled={loading || !form.prenom || !form.nom || !form.montant}
          className="bg-[#2C2A25] text-[#F7F4EE] rounded-xl py-4 text-sm font-medium hover:opacity-90 transition disabled:opacity-40"
        >
          {loading ? 'Création...' : 'Créer la carte cadeau'}
        </button>
      </div>
    </div>
  )
}
