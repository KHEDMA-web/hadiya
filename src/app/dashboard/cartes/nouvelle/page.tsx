'use client'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import { getUserProfile } from '@/lib/auth'
import QRCode from 'qrcode'
import BackButton from '../../_components/BackButton'

export default function NouvelleCarte() {
  const router = useRouter()
  const [form, setForm] = useState({
    prenom: '', nom: '', telephone: '',
    date_naissance: '', montant: '',
    message: '', offert_par: '', expiration: ''
  })
  const [loading, setLoading] = useState(false)
  const [carteCreee, setCarteCreee] = useState<any>(null)
  const [qrUrl, setQrUrl] = useState('')
  const [salonId, setSalonId] = useState<string | null>(null)

  useEffect(() => {
    getUserProfile().then(p => setSalonId(p?.salonId ?? null))
  }, [])

  const handleCreate = async () => {
    if (!form.prenom || !form.nom || !form.montant) return
    setLoading(true)

    const { data: client } = await supabase.from('clients').insert({
      prenom: form.prenom,
      nom: form.nom,
      telephone: form.telephone,
      date_naissance: form.date_naissance || null,
      ...(salonId ? { salon_id: salonId } : {}),
    }).select().single()

    const uid = crypto.randomUUID()
    const { data: carte } = await supabase.from('cartes').insert({
      client_id: client?.id,
      uid_rfid: uid,
      type: 'cadeau',
      solde: parseFloat(form.montant),
      message_perso: form.message,
      offert_par: form.offert_par,
      date_expiration: form.expiration || null,
      ...(salonId ? { salon_id: salonId } : {}),
    }).select().single()

    await supabase.from('transactions').insert({
      carte_id: carte?.id,
      type: 'cadeau',
      montant: parseFloat(form.montant),
      description: `Carte cadeau créée — ${form.montant} DA`,
      ...(salonId ? { salon_id: salonId } : {}),
    })

    const url = `${window.location.origin}/carte/${uid}`
    const qr = await QRCode.toDataURL(url, { width: 300, margin: 2 })
    setQrUrl(qr)
    setCarteCreee({ ...carte, client, uid, url })
    setLoading(false)
  }

  if (carteCreee) {
    return (
      <div className="min-h-screen bg-[#E8E2D5] flex items-center justify-center p-6">
        <div className="bg-white border border-[#C4B89E] rounded-2xl p-8 w-full max-w-md text-center shadow-lg">
          <div className="text-4xl mb-4">🎁</div>
          <h2 className="text-xl font-medium text-[#2C2A25] mb-1">Carte créée !</h2>
          <p className="text-sm text-[#8A8275] mb-6">
            Pour {carteCreee.client?.prenom} {carteCreee.client?.nom} — {form.montant} DA
          </p>
          {qrUrl && (
            <div className="flex flex-col items-center gap-4 mb-6">
              <img src={qrUrl} alt="QR Code" className="rounded-xl border border-[#C4B89E]" />
              <a href={qrUrl} download={`carte-${carteCreee.uid}.png`}
                className="text-xs text-[#8A8275] underline">
                Télécharger le QR code
              </a>
              <p className="text-xs text-[#8A8275] break-all">{carteCreee.url}</p>
            </div>
          )}
          <div className="flex gap-3">
            <button onClick={() => { setCarteCreee(null); setForm({ prenom:'',nom:'',telephone:'',date_naissance:'',montant:'',message:'',offert_par:'',expiration:'' }) }}
              className="flex-1 border border-[#C4B89E] rounded-xl py-3 text-sm text-[#2C2A25] hover:bg-[#F7F4EE] transition">
              Nouvelle carte
            </button>
            <button onClick={() => router.push('/dashboard')}
              className="flex-1 bg-[#2C2A25] text-[#F7F4EE] rounded-xl py-3 text-sm font-medium hover:opacity-90 transition">
              Dashboard
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#E8E2D5]">
      <div className="bg-[#2C2A25] px-6 py-4 flex items-center gap-4">
        <BackButton href="/dashboard" />
        <div>
          <h1 className="text-base font-medium text-[#F7F4EE]">Nouvelle carte cadeau</h1>
          <p className="text-xs text-[#BA7517]">Remplir les informations</p>
        </div>
      </div>

      <div className="p-6 max-w-lg mx-auto flex flex-col gap-5">

        <div className="bg-white border border-[#C4B89E] rounded-2xl p-6 shadow-md">
          <div className="flex items-center gap-2 mb-5">
            <div className="w-1 h-5 bg-[#BA7517] rounded-full" />
            <p className="text-xs font-semibold text-[#2C2A25] uppercase tracking-wider">Bénéficiaire</p>
          </div>
          <div className="grid grid-cols-2 gap-3 mb-3">
            <input placeholder="Prénom *" value={form.prenom}
              onChange={e => setForm({...form, prenom: e.target.value})}
              className="w-full border border-[#C4B89E] rounded-xl px-4 py-3 text-sm text-[#2C2A25] outline-none focus:border-[#BA7517] focus:ring-1 focus:ring-[#BA7517]/20 bg-[#F7F4EE] placeholder:text-[#B0A898]" />
            <input placeholder="Nom *" value={form.nom}
              onChange={e => setForm({...form, nom: e.target.value})}
              className="w-full border border-[#C4B89E] rounded-xl px-4 py-3 text-sm text-[#2C2A25] outline-none focus:border-[#BA7517] focus:ring-1 focus:ring-[#BA7517]/20 bg-[#F7F4EE] placeholder:text-[#B0A898]" />
          </div>
          <input placeholder="Téléphone (WhatsApp)" value={form.telephone}
            onChange={e => setForm({...form, telephone: e.target.value})}
            className="w-full border border-[#C4B89E] rounded-xl px-4 py-3 text-sm text-[#2C2A25] outline-none focus:border-[#BA7517] focus:ring-1 focus:ring-[#BA7517]/20 bg-[#F7F4EE] placeholder:text-[#B0A898] mb-3" />
          <div className="flex flex-col gap-1.5">
            <label className="text-xs text-[#8A8275] font-medium">Date d'anniversaire</label>
            <input type="date" value={form.date_naissance}
              onChange={e => setForm({...form, date_naissance: e.target.value})}
              className="w-full border border-[#C4B89E] rounded-xl px-4 py-3 text-sm text-[#2C2A25] outline-none focus:border-[#BA7517] focus:ring-1 focus:ring-[#BA7517]/20 bg-[#F7F4EE]" />
          </div>
        </div>

        <div className="bg-white border border-[#C4B89E] rounded-2xl p-6 shadow-md">
          <div className="flex items-center gap-2 mb-5">
            <div className="w-1 h-5 bg-[#BA7517] rounded-full" />
            <p className="text-xs font-semibold text-[#2C2A25] uppercase tracking-wider">Carte cadeau</p>
          </div>
          <input placeholder="Montant (DA) *" type="number" value={form.montant}
            onChange={e => setForm({...form, montant: e.target.value})}
            className="w-full border border-[#C4B89E] rounded-xl px-4 py-3 text-sm text-[#2C2A25] outline-none focus:border-[#BA7517] focus:ring-1 focus:ring-[#BA7517]/20 bg-[#F7F4EE] placeholder:text-[#B0A898] mb-3" />
          <input placeholder="Offert par" value={form.offert_par}
            onChange={e => setForm({...form, offert_par: e.target.value})}
            className="w-full border border-[#C4B89E] rounded-xl px-4 py-3 text-sm text-[#2C2A25] outline-none focus:border-[#BA7517] focus:ring-1 focus:ring-[#BA7517]/20 bg-[#F7F4EE] placeholder:text-[#B0A898] mb-3" />
          <input placeholder="Message personnalisé" value={form.message}
            onChange={e => setForm({...form, message: e.target.value})}
            className="w-full border border-[#C4B89E] rounded-xl px-4 py-3 text-sm text-[#2C2A25] outline-none focus:border-[#BA7517] focus:ring-1 focus:ring-[#BA7517]/20 bg-[#F7F4EE] placeholder:text-[#B0A898] mb-3" />
          <div className="flex flex-col gap-1.5">
            <label className="text-xs text-[#8A8275] font-medium">Date d'expiration</label>
            <input type="date" value={form.expiration}
              onChange={e => setForm({...form, expiration: e.target.value})}
              className="w-full border border-[#C4B89E] rounded-xl px-4 py-3 text-sm text-[#2C2A25] outline-none focus:border-[#BA7517] focus:ring-1 focus:ring-[#BA7517]/20 bg-[#F7F4EE]" />
          </div>
        </div>

        <button onClick={handleCreate}
          disabled={loading || !form.prenom || !form.nom || !form.montant}
          className="bg-[#2C2A25] text-[#F7F4EE] rounded-xl py-4 text-sm font-medium hover:opacity-90 transition disabled:opacity-40 shadow-md">
          {loading ? 'Création...' : 'Créer la carte cadeau'}
        </button>

      </div>
    </div>
  )
}
