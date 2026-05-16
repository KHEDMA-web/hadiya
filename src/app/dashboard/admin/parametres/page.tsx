'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import BackButton from '../../_components/BackButton'

function Field({ label, value, onChange, placeholder, type = 'text' }: {
  label: string; value: string; onChange: (v: string) => void; placeholder?: string; type?: string
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-xs text-[#8A8275] font-medium">{label}</label>
      <input type={type} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
        className="w-full border border-[#C4B89E] rounded-xl px-4 py-3 text-sm text-[#2C2A25] outline-none focus:border-[#BA7517] focus:ring-1 focus:ring-[#BA7517]/20 bg-[#F7F4EE] placeholder:text-[#B0A898]" />
    </div>
  )
}

function NumberField({ label, value, onChange, min, sub }: {
  label: string; value: number; onChange: (v: number) => void; min?: number; sub?: string
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-xs text-[#8A8275] font-medium">{label}</label>
      {sub && <p className="text-[10px] text-[#B0A898] -mt-1">{sub}</p>}
      <input type="number" value={value} min={min ?? 0}
        onChange={e => onChange(parseInt(e.target.value) || 0)}
        className="w-full border border-[#C4B89E] rounded-xl px-4 py-3 text-sm text-[#2C2A25] outline-none focus:border-[#BA7517] focus:ring-1 focus:ring-[#BA7517]/20 bg-[#F7F4EE]" />
    </div>
  )
}

function toSlug(nom: string) {
  return nom.toLowerCase()
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
}

type AvantagesFidelite = {
  bronze: string
  argent: string
  or: string
  platine: string
}

type Salon = {
  id: string
  nom: string
  telephone: string | null
  adresse: string | null
  wilaya: string | null
  email: string | null
  whatsapp: string | null
  abonnement: string | null
  logo_url: string | null
  slug: string | null
  fidelite_actif: boolean
  points_par_100da: number
  seuil_argent: number
  seuil_or: number
  seuil_platine: number
  avantages_fidelite: AvantagesFidelite | null
}

const WILAYAS = [
  'Alger', 'Oran', 'Constantine', 'Annaba', 'Blida', 'Batna', 'Sétif',
  'Tlemcen', 'Béjaïa', 'Tizi Ouzou', 'Médéa', 'Mostaganem', 'Skikda',
  'Biskra', 'Chlef', 'Mascara', 'Ouargla', 'Sidi Bel Abbès', 'Guelma',
  'Jijel', 'Autre',
]

const ABONNEMENTS = [
  {
    id: 'starter', label: 'Starter', prix: '2 900 DA/mois',
    desc: 'Pour les salons qui démarrent',
    features: ["Jusqu'à 200 cartes actives", 'Carte cadeau & fidélité', 'Dashboard & statistiques', 'App mobile client (PWA)'],
  },
  {
    id: 'pro', label: 'Pro', prix: '5 900 DA/mois',
    desc: 'Pour les salons en croissance',
    features: ['Cartes illimitées', 'Caisse POS (NFC / RFID)', 'Gestion employés & permissions', 'Export des données CSV', 'Tout Starter inclus'],
  },
  {
    id: 'premium', label: 'Premium', prix: '9 900 DA/mois',
    desc: 'Pour les salons établis',
    features: ['WhatsApp automatique (n8n)', 'Rappels anniversaire clients', 'Multi-salon', 'Support prioritaire', 'Tout Pro inclus'],
  },
]

export default function Parametres() {
  const router = useRouter()
  const defaultAvantages: AvantagesFidelite = { bronze: '', argent: '', or: '', platine: '' }
  const [salon, setSalon] = useState<Partial<Salon>>({
    fidelite_actif: true,
    points_par_100da: 2,
    seuil_argent: 500,
    seuil_or: 1500,
    seuil_platine: 3000,
    avantages_fidelite: defaultAvantages,
  })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [userEmail, setUserEmail] = useState('')
  const [activeSection, setActiveSection] = useState<'salon' | 'fidelite' | 'abonnement' | 'notifications' | 'securite'>('salon')
  const [copied, setCopied] = useState(false)
  const [showPassForm, setShowPassForm] = useState(false)
  const [newPass, setNewPass] = useState('')
  const [confirmPass, setConfirmPass] = useState('')
  const [passLoading, setPassLoading] = useState(false)
  const [passMsg, setPassMsg] = useState<{ ok: boolean; text: string } | null>(null)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [sessionInfo, setSessionInfo] = useState<{ lastSignIn: string } | null>(null)
  const [logoUploading, setLogoUploading] = useState(false)

  useEffect(() => {
    const init = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) { router.push('/login'); return }
      const email = session.user.email || ''
      setUserEmail(email)
      setSessionInfo({ lastSignIn: session.user.last_sign_in_at || '' })
      const { data } = await supabase.from('salons').select('*').eq('email', email).single()
      if (data) setSalon({
        ...data,
        fidelite_actif:      data.fidelite_actif      ?? true,
        points_par_100da:    data.points_par_100da     ?? 2,
        seuil_argent:        data.seuil_argent         ?? 500,
        seuil_or:            data.seuil_or             ?? 1500,
        seuil_platine:       data.seuil_platine        ?? 3000,
        avantages_fidelite:  data.avantages_fidelite   ?? defaultAvantages,
      })
      setLoading(false)
    }
    init()
  }, [])

  const handleSave = async () => {
    setSaving(true)
    setSaved(false)
    setSaveError(null)

    let payload: any = {}

    if (activeSection === 'salon') {
      payload = {
        nom:       salon.nom,
        telephone: salon.telephone || null,
        adresse:   salon.adresse   || null,
        wilaya:    salon.wilaya    || null,
        whatsapp:  salon.whatsapp  || null,
        slug:      salon.slug      || null,
      }
    } else if (activeSection === 'fidelite') {
      payload = {
        fidelite_actif:     salon.fidelite_actif,
        points_par_100da:   salon.points_par_100da,
        seuil_argent:       salon.seuil_argent,
        seuil_or:           salon.seuil_or,
        seuil_platine:      salon.seuil_platine,
        avantages_fidelite: salon.avantages_fidelite ?? defaultAvantages,
      }
    }

    let error: any = null
    if (salon.id) {
      const result = await supabase.from('salons').update(payload).eq('id', salon.id)
      error = result.error
    } else {
      const result = await supabase.from('salons').insert({ ...payload, email: userEmail })
      error = result.error
    }

    setSaving(false)
    if (error) {
      setSaveError(error.message || 'Erreur lors de la sauvegarde')
    } else {
      setSaved(true)
      setTimeout(() => setSaved(false), 2500)
    }
  }

  const handleChangePassword = async () => {
    if (newPass.length < 6) { setPassMsg({ ok: false, text: 'Minimum 6 caractères' }); return }
    if (newPass !== confirmPass) { setPassMsg({ ok: false, text: 'Les mots de passe ne correspondent pas' }); return }
    setPassLoading(true)
    setPassMsg(null)
    const { error } = await supabase.auth.updateUser({ password: newPass })
    setPassLoading(false)
    if (error) {
      setPassMsg({ ok: false, text: error.message })
    } else {
      setPassMsg({ ok: true, text: 'Mot de passe mis à jour ✓' })
      setNewPass(''); setConfirmPass('')
      setTimeout(() => { setShowPassForm(false); setPassMsg(null) }, 2000)
    }
  }

  const handleSignOutAll = async () => {
    await supabase.auth.signOut({ scope: 'global' })
    router.push('/login')
  }

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !salon.id) return
    setLogoUploading(true)
    const ext = file.name.split('.').pop() || 'jpg'
    const path = `${salon.id}.${ext}`
    const { error: uploadError } = await supabase.storage.from('logos').upload(path, file, { upsert: true })
    if (!uploadError) {
      const { data: urlData } = supabase.storage.from('logos').getPublicUrl(path)
      await supabase.from('salons').update({ logo_url: urlData.publicUrl }).eq('id', salon.id)
      setSalon(s => ({ ...s, logo_url: urlData.publicUrl }))
    }
    setLogoUploading(false)
  }

  const tabs = [
    { id: 'salon',         label: 'Salon',         icon: '⊹' },
    { id: 'fidelite',      label: 'Fidélité',      icon: '✦' },
    { id: 'abonnement',    label: 'Abonnement',    icon: '◎' },
    { id: 'notifications', label: 'Notifications', icon: '◈' },
    { id: 'securite',      label: 'Sécurité',      icon: '⊞' },
  ] as const

  const showSave = activeSection === 'salon' || activeSection === 'fidelite'
  const taux = salon.points_par_100da ?? 2
  const valeurPoint = taux > 0 ? (100 / taux).toFixed(0) : '—'

  return (
    <div className="min-h-screen bg-[#E8E2D5]">

      <div className="bg-[#2C2A25] px-6 py-4 flex items-center gap-4 shadow-lg">
        <BackButton href="/dashboard/admin" />
        <div>
          <h1 className="text-base font-medium text-[#F7F4EE]">Paramètres</h1>
          <p className="text-xs text-[#BA7517]">Configuration du salon</p>
        </div>
        {showSave && (
          <div className="ml-auto flex flex-col items-end gap-1">
            <button onClick={handleSave} disabled={saving}
              className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-medium transition-colors disabled:opacity-50 ${saveError ? 'bg-rose-500 text-white hover:bg-rose-600' : 'bg-[#BA7517] text-white hover:bg-[#A36714]'}`}>
              {saved ? '✓ Sauvegardé' : saving ? 'Sauvegarde...' : saveError ? '✗ Erreur' : 'Sauvegarder'}
            </button>
            {saveError && (
              <p className="text-[10px] text-rose-400 max-w-[160px] text-right">{saveError}</p>
            )}
          </div>
        )}
      </div>

      <div className="bg-[#2C2A25] px-6 pb-4 flex gap-2 overflow-x-auto">
        {tabs.map(t => (
          <button key={t.id} onClick={() => { setActiveSection(t.id); setSaved(false); setSaveError(null) }}
            className={`px-4 py-2 rounded-xl text-xs font-medium whitespace-nowrap transition-all flex-shrink-0 ${
              activeSection === t.id
                ? 'bg-[#BA7517] text-white shadow-[0_2px_8px_rgba(186,117,23,0.3)]'
                : 'bg-[#3A3830] text-[#8A8275] hover:text-[#F7F4EE]'
            }`}>
            {t.icon} {t.label}
          </button>
        ))}
      </div>


      <div className="p-6 max-w-lg mx-auto flex flex-col gap-5">
        {loading ? (
          <div className="flex justify-center py-16">
            <div className="w-6 h-6 rounded-full border-2 border-[#C4B89E] border-t-[#BA7517] animate-spin" />
          </div>
        ) : (
          <>
            {/* SALON */}
            {activeSection === 'salon' && (
              <>
                {/* LOGO */}
                <div className="bg-white border border-[#C4B89E] rounded-2xl p-6 shadow-md flex flex-col gap-4">
                  <div className="flex items-center gap-2 mb-1">
                    <div className="w-1 h-5 bg-[#BA7517] rounded-full" />
                    <p className="text-xs font-semibold text-[#2C2A25] uppercase tracking-wider">Logo du salon</p>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 rounded-2xl border border-[#C4B89E] overflow-hidden bg-[#F7F4EE] flex items-center justify-center flex-shrink-0">
                      {salon.logo_url
                        ? <img src={salon.logo_url} alt="Logo" className="w-full h-full object-cover" />
                        : <span className="text-2xl font-semibold text-[#BA7517]">{salon.nom?.[0]?.toUpperCase() || '?'}</span>
                      }
                    </div>
                    <div className="flex flex-col gap-2 flex-1">
                      <p className="text-[11px] text-[#8A8275]">Affiché sur votre page de paiement, la carte client et le dashboard.</p>
                      <label className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-medium self-start transition-colors ${logoUploading ? 'bg-[#E8E2D5] text-[#8A8275] cursor-not-allowed' : 'bg-[#2C2A25] text-[#F7F4EE] hover:opacity-90 cursor-pointer'}`}>
                        {logoUploading ? 'Upload...' : salon.logo_url ? 'Changer le logo' : 'Ajouter un logo'}
                        <input type="file" accept="image/*" className="hidden" onChange={handleLogoUpload} disabled={logoUploading} />
                      </label>
                      {salon.logo_url && (
                        <button
                          type="button"
                          onClick={async () => {
                            await supabase.from('salons').update({ logo_url: null }).eq('id', salon.id!)
                            setSalon(s => ({ ...s, logo_url: null }))
                          }}
                          className="text-[10px] text-rose-400 hover:text-rose-600 transition-colors text-left"
                        >
                          Supprimer le logo
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                <div className="bg-white border border-[#C4B89E] rounded-2xl p-6 shadow-md flex flex-col gap-4">
                  <div className="flex items-center gap-2 mb-1">
                    <div className="w-1 h-5 bg-[#BA7517] rounded-full" />
                    <p className="text-xs font-semibold text-[#2C2A25] uppercase tracking-wider">Informations générales</p>
                  </div>
                  <Field label="Nom du salon *" value={salon.nom || ''} onChange={v => setSalon(s => ({ ...s, nom: v }))} placeholder="Ex : Spa Lumière" />
                  <Field label="Téléphone" value={salon.telephone || ''} onChange={v => setSalon(s => ({ ...s, telephone: v }))} placeholder="Ex : 0555 123 456" type="tel" />
                  <Field label="WhatsApp" value={salon.whatsapp || ''} onChange={v => setSalon(s => ({ ...s, whatsapp: v }))} placeholder="Ex : +213 555 123 456" type="tel" />
                </div>
                {/* LIEN DE PAIEMENT */}
                <div className="bg-[#2C2A25] border border-[#BA7517]/30 rounded-2xl p-6 shadow-md flex flex-col gap-4">
                  <div className="flex items-center gap-2 mb-1">
                    <div className="w-1 h-5 bg-[#BA7517] rounded-full" />
                    <p className="text-xs font-semibold text-[#F7F4EE] uppercase tracking-wider">Lien de paiement carte cadeau</p>
                  </div>
                  <p className="text-[11px] text-[#8A8275]">Partagez ce lien sur Instagram, WhatsApp ou votre site. Chaque salon a son lien unique.</p>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs text-[#8A8275] font-medium">Identifiant unique du salon</label>
                    <div className="flex gap-2">
                      <input
                        value={salon.slug || ''}
                        onChange={e => setSalon(s => ({ ...s, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '-') }))}
                        placeholder={salon.nom ? toSlug(salon.nom) : 'mon-spa-alger'}
                        className="flex-1 border border-[#3A3830] rounded-xl px-4 py-3 text-sm text-[#F7F4EE] outline-none focus:border-[#BA7517] bg-[#1E1C18] placeholder:text-[#4A4840]"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          if (!salon.slug && salon.nom) setSalon(s => ({ ...s, slug: toSlug(salon.nom!) }))
                        }}
                        className="px-3 py-2 rounded-xl text-xs bg-[#3A3830] text-[#8A8275] hover:text-[#F7F4EE] transition-colors whitespace-nowrap"
                      >
                        Auto
                      </button>
                    </div>
                  </div>
                  {salon.slug && (
                    <div className="flex flex-col gap-2">
                      <div className="flex items-center gap-2 bg-[#1E1C18] rounded-xl px-4 py-3 border border-[#3A3830]">
                        <p className="flex-1 text-xs text-[#BA7517] truncate font-mono">
                          {typeof window !== 'undefined' ? window.location.origin : (process.env.NEXT_PUBLIC_URL || '')}/gift-card/{salon.slug}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          navigator.clipboard.writeText(`${window.location.origin}/gift-card/${salon.slug}`)
                          setCopied(true)
                          setTimeout(() => setCopied(false), 2000)
                        }}
                        className="w-full py-2.5 rounded-xl text-xs font-medium bg-[#BA7517] text-white hover:bg-[#A36714] transition-colors"
                      >
                        {copied ? '✓ Lien copié !' : 'Copier le lien'}
                      </button>
                    </div>
                  )}
                  {!salon.slug && (
                    <p className="text-[10px] text-[#8A8275]">Saisissez un identifiant puis sauvegardez pour activer votre lien.</p>
                  )}
                </div>

                <div className="bg-white border border-[#C4B89E] rounded-2xl p-6 shadow-md flex flex-col gap-4">
                  <div className="flex items-center gap-2 mb-1">
                    <div className="w-1 h-5 bg-[#BA7517] rounded-full" />
                    <p className="text-xs font-semibold text-[#2C2A25] uppercase tracking-wider">Adresse</p>
                  </div>
                  <Field label="Adresse" value={salon.adresse || ''} onChange={v => setSalon(s => ({ ...s, adresse: v }))} placeholder="Rue, numéro, quartier..." />
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs text-[#8A8275] font-medium">Wilaya</label>
                    <select value={salon.wilaya || ''} onChange={e => setSalon(s => ({ ...s, wilaya: e.target.value }))}
                      className="w-full border border-[#C4B89E] rounded-xl px-4 py-3 text-sm text-[#2C2A25] outline-none focus:border-[#BA7517] bg-[#F7F4EE]">
                      <option value="">Sélectionner une wilaya</option>
                      {WILAYAS.map(w => <option key={w} value={w}>{w}</option>)}
                    </select>
                  </div>
                </div>
              </>
            )}

            {/* FIDÉLITÉ */}
            {activeSection === 'fidelite' && (
              <div className="flex flex-col gap-4">
                <div className="bg-white border border-[#C4B89E] rounded-2xl p-6 shadow-md">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-semibold text-[#2C2A25]">Programme de fidélité</p>
                      <p className="text-[11px] text-[#8A8275] mt-0.5">Activer ou désactiver pour tous les clients</p>
                    </div>
                    <button onClick={() => setSalon(s => ({ ...s, fidelite_actif: !s.fidelite_actif }))}
                      className="relative w-12 h-6 rounded-full transition-all duration-300 flex-shrink-0"
                      style={{ background: salon.fidelite_actif ? '#BA7517' : '#C4B89E' }}>
                      <div className="absolute top-1 w-4 h-4 rounded-full bg-white shadow transition-all duration-300"
                        style={{ left: salon.fidelite_actif ? '28px' : '4px' }} />
                    </button>
                  </div>
                </div>

                {salon.fidelite_actif && (
                  <>
                    <div className="bg-white border border-[#C4B89E] rounded-2xl p-6 shadow-md flex flex-col gap-4">
                      <div className="flex items-center gap-2 mb-1">
                        <div className="w-1 h-5 bg-[#BA7517] rounded-full" />
                        <p className="text-xs font-semibold text-[#2C2A25] uppercase tracking-wider">Taux de points</p>
                      </div>
                      <NumberField
                        label="Points gagnés par 100 DA dépensés"
                        sub="Ex : 2 = le client gagne 2 pts pour chaque 100 DA"
                        value={salon.points_par_100da ?? 2}
                        onChange={v => setSalon(s => ({ ...s, points_par_100da: v }))}
                        min={1}
                      />
                      <div className="grid grid-cols-3 gap-2 mt-1">
                        {[1000, 5000, 10000].map(da => (
                          <div key={da} className="flex flex-col items-center p-3 rounded-xl border border-[#E8E2D5] bg-[#F7F4EE]">
                            <p className="text-[10px] text-[#8A8275]">{da.toLocaleString('fr-FR')} DA</p>
                            <p className="text-base font-semibold mt-1" style={{ color: '#BA7517' }}>
                              {Math.round(da / 100 * (salon.points_par_100da ?? 2))} pts
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="bg-white border border-[#C4B89E] rounded-2xl p-6 shadow-md flex flex-col gap-4">
                      <div className="flex items-center gap-2 mb-1">
                        <div className="w-1 h-5 bg-[#BA7517] rounded-full" />
                        <p className="text-xs font-semibold text-[#2C2A25] uppercase tracking-wider">Seuils des niveaux</p>
                      </div>

                      <div className="flex items-center justify-between py-3 border border-[#E8E2D5] rounded-xl px-4"
                        style={{ background: 'rgba(196,129,58,0.05)' }}>
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wide"
                            style={{ background: 'rgba(196,129,58,0.15)', color: '#C4813A' }}>Bronze</span>
                          <p className="text-xs text-[#8A8275]">Niveau de départ</p>
                        </div>
                        <p className="text-sm font-semibold text-[#2C2A25]">0 pts</p>
                      </div>

                      {[
                        { key: 'seuil_argent',  label: 'Argent',  color: '#8A8275', bg: 'rgba(138,130,117,0.05)' },
                        { key: 'seuil_or',      label: 'Or',      color: '#BA7517', bg: 'rgba(186,117,23,0.05)'  },
                        { key: 'seuil_platine', label: 'Platine', color: '#7C6FAE', bg: 'rgba(124,111,174,0.05)' },
                      ].map(({ key, label, color, bg }) => (
                        <div key={key} className="flex items-center justify-between gap-4 py-3 border border-[#E8E2D5] rounded-xl px-4"
                          style={{ background: bg }}>
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wide flex-shrink-0"
                            style={{ background: `${color}20`, color }}>{label}</span>
                          <div className="flex items-center gap-2 flex-1 justify-end">
                            <p className="text-[10px] text-[#8A8275] whitespace-nowrap">À partir de</p>
                            <input type="number" value={(salon as any)[key] ?? 0} min={1}
                              onChange={e => setSalon(s => ({ ...s, [key]: parseInt(e.target.value) || 0 }))}
                              className="w-24 border border-[#C4B89E] rounded-lg px-3 py-1.5 text-sm text-[#2C2A25] outline-none focus:border-[#BA7517] text-right bg-white" />
                            <p className="text-[10px] text-[#8A8275]">pts</p>
                          </div>
                        </div>
                      ))}

                      {(salon.seuil_argent ?? 0) >= (salon.seuil_or ?? 0) && (
                        <p className="text-[11px] text-rose-500">⚠ Le seuil Argent doit être inférieur au seuil Or</p>
                      )}
                      {(salon.seuil_or ?? 0) >= (salon.seuil_platine ?? 0) && (
                        <p className="text-[11px] text-rose-500">⚠ Le seuil Or doit être inférieur au seuil Platine</p>
                      )}
                    </div>

                    <div className="bg-white border border-[#C4B89E] rounded-2xl p-6 shadow-md flex flex-col gap-4">
                      <div className="flex items-center gap-2 mb-1">
                        <div className="w-1 h-5 bg-[#BA7517] rounded-full" />
                        <p className="text-xs font-semibold text-[#2C2A25] uppercase tracking-wider">Avantages par niveau</p>
                      </div>
                      <p className="text-[11px] text-[#8A8275] -mt-2">Décrivez ce que chaque niveau apporte à vos clients (affiché sur leur carte).</p>
                      {([
                        { key: 'bronze',  label: 'Bronze',  color: '#C4813A', bg: 'rgba(196,129,58,0.08)',  placeholder: 'Ex : Accès prioritaire aux réservations' },
                        { key: 'argent',  label: 'Argent',  color: '#8A8275', bg: 'rgba(138,130,117,0.08)', placeholder: 'Ex : -5% sur tous les soins' },
                        { key: 'or',      label: 'Or',      color: '#BA7517', bg: 'rgba(186,117,23,0.08)',  placeholder: 'Ex : Soin offert par trimestre' },
                        { key: 'platine', label: 'Platine', color: '#7C6FAE', bg: 'rgba(124,111,174,0.08)', placeholder: 'Ex : Massage offert + accès VIP' },
                      ] as const).map(({ key, label, color, bg, placeholder }) => (
                        <div key={key} className="flex flex-col gap-1.5 p-4 rounded-xl border border-[#E8E2D5]" style={{ background: bg }}>
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wide self-start"
                            style={{ background: `${color}20`, color }}>{label}</span>
                          <input
                            type="text"
                            value={salon.avantages_fidelite?.[key] ?? ''}
                            onChange={e => setSalon(s => ({
                              ...s,
                              avantages_fidelite: { ...(s.avantages_fidelite ?? defaultAvantages), [key]: e.target.value }
                            }))}
                            placeholder={placeholder}
                            className="w-full border border-[#C4B89E] rounded-xl px-4 py-3 text-sm text-[#2C2A25] outline-none focus:border-[#BA7517] focus:ring-1 focus:ring-[#BA7517]/20 bg-white placeholder:text-[#B0A898]"
                          />
                        </div>
                      ))}
                    </div>

                    <div className="bg-[#2C2A25] rounded-2xl p-5 flex flex-col gap-2">
                      <p className="text-[9px] tracking-[0.2em] uppercase text-[#F7F4EE]/40 mb-1">Résumé du programme</p>
                      {[
                        { niveau: 'Bronze',  pts: '0',                              color: '#C4813A' },
                        { niveau: 'Argent',  pts: `${salon.seuil_argent ?? 500}`,   color: '#8A8275' },
                        { niveau: 'Or',      pts: `${salon.seuil_or ?? 1500}`,      color: '#BA7517' },
                        { niveau: 'Platine', pts: `${salon.seuil_platine ?? 3000}`, color: '#7C6FAE' },
                      ].map(({ niveau, pts, color }) => (
                        <div key={niveau} className="flex items-center justify-between">
                          <span className="text-xs font-semibold" style={{ color }}>{niveau}</span>
                          <span className="text-xs text-[#F7F4EE]/50">{parseInt(pts).toLocaleString('fr-FR')} pts</span>
                        </div>
                      ))}
                      <div className="border-t border-[#F7F4EE]/10 mt-2 pt-2">
                        <p className="text-[10px] text-[#F7F4EE]/40">
                          Taux : {salon.points_par_100da ?? 2} pts / 100 DA · 1 pt = {valeurPoint} DA
                        </p>
                      </div>
                    </div>
                  </>
                )}
              </div>
            )}

            {/* ABONNEMENT */}
            {activeSection === 'abonnement' && (
              <div className="flex flex-col gap-3">
                <div className="bg-white border border-[#C4B89E] rounded-2xl p-5 shadow-md">
                  <div className="flex items-center gap-2 mb-4">
                    <div className="w-1 h-5 bg-[#BA7517] rounded-full" />
                    <p className="text-xs font-semibold text-[#2C2A25] uppercase tracking-wider">Plan actuel</p>
                  </div>
                  <div className="flex items-center gap-3 p-3 rounded-xl" style={{ background: 'rgba(186,117,23,0.08)', border: '1px solid rgba(186,117,23,0.25)' }}>
                    <div className="w-9 h-9 rounded-lg flex items-center justify-center text-sm font-bold"
                      style={{ background: 'rgba(186,117,23,0.15)', color: '#BA7517' }}>P</div>
                    <div>
                      <p className="text-sm font-semibold text-[#2C2A25]">{salon.abonnement || 'Starter'}</p>
                      <p className="text-[10px] text-[#8A8275]">Renouvellement le 1er du mois</p>
                    </div>
                    <span className="ml-auto text-[9px] px-2 py-0.5 rounded-lg uppercase tracking-wide font-medium"
                      style={{ background: 'rgba(16,185,129,0.1)', color: '#10B981', border: '1px solid rgba(16,185,129,0.2)' }}>Actif</span>
                  </div>
                </div>
                {ABONNEMENTS.map(ab => {
                  const isCurrent = (salon.abonnement || 'starter') === ab.id
                  return (
                    <div key={ab.id} className={`bg-white border rounded-2xl p-5 shadow-md transition-all ${isCurrent ? 'border-[#BA7517] shadow-[0_0_0_1px_rgba(186,117,23,0.15)]' : 'border-[#C4B89E]'}`}>
                      <div className="flex items-start justify-between gap-3 mb-3">
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="text-sm font-semibold text-[#2C2A25]">{ab.label}</p>
                            {isCurrent && (
                              <span className="text-[9px] px-2 py-0.5 rounded-full font-medium" style={{ background: 'rgba(186,117,23,0.1)', color: '#BA7517' }}>Actuel</span>
                            )}
                          </div>
                          <p className="text-[11px] text-[#8A8275] mt-0.5">{ab.desc}</p>
                        </div>
                        <p className="text-sm font-semibold flex-shrink-0" style={{ color: '#BA7517' }}>{ab.prix}</p>
                      </div>
                      <div className="flex flex-col gap-1.5 pt-3 border-t border-[#EDE8DE]">
                        {ab.features.map((f, i) => (
                          <div key={i} className="flex items-center gap-2">
                            <span className="text-[10px] text-[#BA7517] flex-shrink-0">✓</span>
                            <p className="text-[11px] text-[#8A8275]">{f}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )
                })}
                <p className="text-[10px] text-[#8A8275] text-center mt-1">
                  Pour changer de plan, contactez le support Hadiya via WhatsApp.
                </p>
              </div>
            )}

            {/* NOTIFICATIONS */}
            {activeSection === 'notifications' && (
              <div className="bg-white border border-[#C4B89E] rounded-2xl p-6 shadow-md flex flex-col gap-4">
                <div className="flex items-center gap-2 mb-1">
                  <div className="w-1 h-5 bg-[#BA7517] rounded-full" />
                  <p className="text-xs font-semibold text-[#2C2A25] uppercase tracking-wider">WhatsApp automatique</p>
                </div>
                {[
                  { label: 'Message de bienvenue',    sub: 'Envoyé à la création d\'une carte'  },
                  { label: 'Confirmation de recharge', sub: 'Envoyé après chaque recharge'       },
                  { label: 'Rappel anniversaire',      sub: 'Envoyé le jour J du client'         },
                  { label: 'Solde faible',             sub: 'Alerte quand le solde < 1 000 DA'   },
                  { label: 'Carte expirée bientôt',    sub: '7 jours avant l\'expiration'        },
                ].map(n => (
                  <div key={n.label} className="flex items-center justify-between py-2 border-b border-[#EDE8DE] last:border-0">
                    <div>
                      <p className="text-sm text-[#2C2A25] font-medium">{n.label}</p>
                      <p className="text-[10px] text-[#8A8275] mt-0.5">{n.sub}</p>
                    </div>
                    <div className="w-10 h-6 rounded-full flex items-center justify-end pr-1 cursor-pointer"
                      style={{ background: 'rgba(186,117,23,0.2)', border: '1px solid rgba(186,117,23,0.3)' }}>
                      <div className="w-4 h-4 rounded-full" style={{ background: '#BA7517' }} />
                    </div>
                  </div>
                ))}
                <p className="text-[10px] text-[#8A8275] mt-1">Les automatisations WhatsApp nécessitent la configuration n8n.</p>
              </div>
            )}

            {/* SECURITE */}
            {activeSection === 'securite' && (
              <div className="flex flex-col gap-4">

                {/* Mot de passe */}
                <div className="bg-white border border-[#C4B89E] rounded-2xl p-6 shadow-md flex flex-col gap-4">
                  <div className="flex items-center gap-2 mb-1">
                    <div className="w-1 h-5 bg-[#BA7517] rounded-full" />
                    <p className="text-xs font-semibold text-[#2C2A25] uppercase tracking-wider">Mot de passe</p>
                  </div>
                  <div className="flex items-center justify-between py-1">
                    <div>
                      <p className="text-sm text-[#2C2A25] font-medium">Changer le mot de passe</p>
                      <p className="text-[10px] text-[#8A8275] mt-0.5">{userEmail}</p>
                    </div>
                    <button
                      onClick={() => { setShowPassForm(f => !f); setPassMsg(null); setNewPass(''); setConfirmPass('') }}
                      className="text-[10px] font-medium uppercase tracking-wide transition-colors hover:opacity-70"
                      style={{ color: '#BA7517' }}>
                      {showPassForm ? 'Annuler' : 'Modifier'}
                    </button>
                  </div>
                  {showPassForm && (
                    <div className="flex flex-col gap-3 pt-2 border-t border-[#EDE8DE]">
                      <div className="flex flex-col gap-1.5">
                        <label className="text-xs text-[#8A8275] font-medium">Nouveau mot de passe</label>
                        <input type="password" value={newPass} onChange={e => setNewPass(e.target.value)}
                          placeholder="Minimum 6 caractères"
                          className="w-full border border-[#C4B89E] rounded-xl px-4 py-3 text-sm text-[#2C2A25] outline-none focus:border-[#BA7517] bg-[#F7F4EE] placeholder:text-[#B0A898]" />
                      </div>
                      <div className="flex flex-col gap-1.5">
                        <label className="text-xs text-[#8A8275] font-medium">Confirmer le mot de passe</label>
                        <input type="password" value={confirmPass} onChange={e => setConfirmPass(e.target.value)}
                          placeholder="Répéter le mot de passe"
                          className="w-full border border-[#C4B89E] rounded-xl px-4 py-3 text-sm text-[#2C2A25] outline-none focus:border-[#BA7517] bg-[#F7F4EE] placeholder:text-[#B0A898]" />
                      </div>
                      {passMsg && (
                        <p className={`text-[11px] font-medium ${passMsg.ok ? 'text-emerald-600' : 'text-rose-500'}`}>{passMsg.text}</p>
                      )}
                      <button onClick={handleChangePassword} disabled={passLoading || !newPass || !confirmPass}
                        className="w-full py-3 rounded-xl text-sm font-medium bg-[#2C2A25] text-[#F7F4EE] hover:opacity-90 transition disabled:opacity-40">
                        {passLoading ? 'Mise à jour...' : 'Mettre à jour le mot de passe'}
                      </button>
                    </div>
                  )}
                </div>

                {/* Sessions */}
                <div className="bg-white border border-[#C4B89E] rounded-2xl p-6 shadow-md flex flex-col gap-4">
                  <div className="flex items-center gap-2 mb-1">
                    <div className="w-1 h-5 bg-[#BA7517] rounded-full" />
                    <p className="text-xs font-semibold text-[#2C2A25] uppercase tracking-wider">Sessions actives</p>
                  </div>
                  <div className="flex items-center gap-3 p-3 rounded-xl border border-[#E8E2D5] bg-[#F7F4EE]">
                    <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center text-emerald-600 text-sm flex-shrink-0">✓</div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-[#2C2A25] font-medium truncate">{userEmail}</p>
                      {sessionInfo?.lastSignIn && (
                        <p className="text-[10px] text-[#8A8275] mt-0.5">
                          Dernière connexion : {new Date(sessionInfo.lastSignIn).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                        </p>
                      )}
                    </div>
                    <span className="text-[9px] px-2 py-0.5 rounded-full font-medium bg-emerald-100 text-emerald-700 flex-shrink-0">Active</span>
                  </div>
                  <button onClick={handleSignOutAll}
                    className="w-full py-2.5 rounded-xl text-xs font-medium uppercase tracking-wide border border-[#C4B89E] text-[#8A8275] hover:text-[#2C2A25] hover:border-[#2C2A25] transition-colors">
                    Se déconnecter de tous les appareils
                  </button>
                </div>

                {/* Zone dangereuse */}
                <div className="bg-white border border-rose-200 rounded-2xl p-6 shadow-md flex flex-col gap-4">
                  <div className="flex items-center gap-2 mb-1">
                    <div className="w-1 h-5 bg-rose-400 rounded-full" />
                    <p className="text-xs font-semibold text-[#2C2A25] uppercase tracking-wider">Zone dangereuse</p>
                  </div>
                  {!showDeleteConfirm ? (
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-[#2C2A25] font-medium">Supprimer le compte</p>
                        <p className="text-[10px] text-[#8A8275] mt-0.5">Action irréversible — contactez le support pour confirmer</p>
                      </div>
                      <button onClick={() => setShowDeleteConfirm(true)}
                        className="text-[10px] text-rose-500 font-medium uppercase tracking-wide border border-rose-500/30 px-3 py-1.5 rounded-lg hover:bg-rose-500/5 transition-colors">
                        Supprimer
                      </button>
                    </div>
                  ) : (
                    <div className="flex flex-col gap-3">
                      <p className="text-sm text-[#2C2A25]">Pour supprimer votre compte et toutes vos données, contactez le support Hadiya via WhatsApp. Cette action est irréversible.</p>
                      <div className="flex gap-2">
                        <button onClick={() => setShowDeleteConfirm(false)}
                          className="flex-1 py-2.5 rounded-xl text-xs font-medium border border-[#C4B89E] text-[#8A8275] hover:text-[#2C2A25] transition-colors">
                          Annuler
                        </button>
                        <a href="https://wa.me/message/HADIYASUPPORT" target="_blank" rel="noopener noreferrer"
                          className="flex-1 py-2.5 rounded-xl text-xs font-medium bg-rose-500 text-white hover:bg-rose-600 transition-colors text-center">
                          Contacter le support
                        </a>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
