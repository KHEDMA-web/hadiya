'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

type Employe = {
  id: string
  nom: string
  prenom: string
  telephone: string | null
  role: 'admin' | 'employe' | 'praticien'
  actif: boolean
  created_at: string
}

const ROLE_BADGE: Record<string, string> = {
  admin:     'bg-[#BA7517]/15 text-[#BA7517] border-[#BA7517]/30',
  employe:   'bg-emerald-600/10 text-emerald-600 border-emerald-600/25',
  praticien: 'bg-[#7C6FAE]/15 text-[#7C6FAE] border-[#7C6FAE]/30',
}

const ROLE_AVATAR: Record<string, string> = {
  admin:     'bg-[#BA7517]/20 text-[#BA7517]',
  employe:   'bg-emerald-600/15 text-emerald-600',
  praticien: 'bg-[#7C6FAE]/20 text-[#7C6FAE]',
}

const ROLE_LABEL: Record<string, string> = {
  admin: 'Admin', employe: 'Employé', praticien: 'Praticien',
}

const emptyForm = { nom: '', prenom: '', telephone: '', role: 'employe' as Employe['role'], pin: '' }

export default function Employes() {
  const router = useRouter()
  const [employes, setEmployes] = useState<Employe[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState(emptyForm)
  const [saving, setSaving] = useState(false)
  const [erreur, setErreur] = useState('')

  useEffect(() => { fetchEmployes() }, [])

  const fetchEmployes = async () => {
    setLoading(true)
    const { data } = await supabase.from('employes').select('*').order('prenom')
    setEmployes((data ?? []) as Employe[])
    setLoading(false)
  }

  const handleSave = async () => {
    if (!form.nom || !form.prenom || !form.role) return
    if (form.pin && (form.pin.length !== 4 || !/^\d{4}$/.test(form.pin))) {
      setErreur('Le PIN doit contenir exactement 4 chiffres')
      return
    }
    setSaving(true)
    setErreur('')
    const payload: any = {
      nom: form.nom,
      prenom: form.prenom,
      telephone: form.telephone || null,
      role: form.role,
      actif: true,
    }
    if (form.pin) payload.pin = form.pin

    const { error } = await supabase.from('employes').insert(payload)
    if (error) { setErreur('Erreur : ' + error.message); setSaving(false); return }
    await fetchEmployes()
    setForm(emptyForm)
    setShowForm(false)
    setSaving(false)
  }

  const handleToggleActif = async (e: Employe) => {
    await supabase.from('employes').update({ actif: !e.actif }).eq('id', e.id)
    setEmployes(prev => prev.map(x => x.id === e.id ? { ...x, actif: !x.actif } : x))
  }

  const handleDelete = async (id: string) => {
    await supabase.from('employes').delete().eq('id', id)
    setEmployes(prev => prev.filter(x => x.id !== id))
  }

  return (
    <div className="min-h-screen bg-[#E8E2D5]">

      {/* Header */}
      <div className="bg-[#2C2A25] px-6 py-4 flex items-center gap-4 shadow-lg">
        <button
          onClick={() => router.push('/dashboard/admin')}
          className="w-9 h-9 rounded-full border border-[#4A4840] flex items-center justify-center text-[#F7F4EE] opacity-70 hover:opacity-100 hover:border-[#BA7517] transition-all text-sm flex-shrink-0"
        >
          ←
        </button>
        <div className="flex-1">
          <h1 className="text-base font-medium text-[#F7F4EE]">Employés</h1>
          <p className="text-xs text-[#BA7517]">{employes.length} membre{employes.length > 1 ? 's' : ''}</p>
        </div>
        <button
          onClick={() => { setShowForm(true); setErreur('') }}
          className="flex items-center gap-2 bg-[#BA7517] text-white rounded-xl px-4 py-2 text-xs font-medium hover:bg-[#A36714] transition-colors shadow-[0_2px_8px_rgba(186,117,23,0.3)]"
        >
          <span className="text-base leading-none">+</span>
          Ajouter
        </button>
      </div>

      {/* Formulaire inline */}
      {showForm && (
        <div className="bg-[#2C2A25] border-b border-[#3A3830] px-6 py-5">
          <div className="max-w-2xl mx-auto flex flex-col gap-3">
            <p className="text-xs font-medium text-[#F7F4EE] mb-1">Nouvel employé</p>

            <div className="grid grid-cols-2 gap-3">
              <input
                placeholder="Prénom *"
                value={form.prenom}
                onChange={e => setForm(f => ({ ...f, prenom: e.target.value }))}
                className="border border-[#4A4840] rounded-xl px-4 py-2.5 text-sm bg-[#3A3830] text-[#F7F4EE] outline-none focus:border-[#BA7517] placeholder:text-[#5A5850]"
              />
              <input
                placeholder="Nom *"
                value={form.nom}
                onChange={e => setForm(f => ({ ...f, nom: e.target.value }))}
                className="border border-[#4A4840] rounded-xl px-4 py-2.5 text-sm bg-[#3A3830] text-[#F7F4EE] outline-none focus:border-[#BA7517] placeholder:text-[#5A5850]"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <input
                placeholder="Téléphone"
                value={form.telephone}
                onChange={e => setForm(f => ({ ...f, telephone: e.target.value }))}
                className="border border-[#4A4840] rounded-xl px-4 py-2.5 text-sm bg-[#3A3830] text-[#F7F4EE] outline-none focus:border-[#BA7517] placeholder:text-[#5A5850]"
              />
              <input
                placeholder="PIN 4 chiffres"
                value={form.pin}
                onChange={e => setForm(f => ({ ...f, pin: e.target.value.replace(/\D/g, '').slice(0, 4) }))}
                maxLength={4}
                className="border border-[#4A4840] rounded-xl px-4 py-2.5 text-sm bg-[#3A3830] text-[#F7F4EE] outline-none focus:border-[#BA7517] placeholder:text-[#5A5850] tracking-[0.3em]"
              />
            </div>

            {/* Rôle */}
            <div className="flex gap-2">
              {(['admin', 'employe', 'praticien'] as const).map(r => (
                <button
                  key={r}
                  onClick={() => setForm(f => ({ ...f, role: r }))}
                  className={`flex-1 py-2 rounded-xl text-[10px] uppercase tracking-wide font-medium transition-all border ${
                    form.role === r
                      ? ROLE_BADGE[r]
                      : 'bg-[#3A3830] text-[#5A5850] border-[#4A4840]'
                  }`}
                >
                  {ROLE_LABEL[r]}
                </button>
              ))}
            </div>

            {erreur && <p className="text-xs text-rose-400">{erreur}</p>}

            <div className="flex gap-2">
              <button
                onClick={() => { setShowForm(false); setForm(emptyForm); setErreur('') }}
                className="flex-1 border border-[#4A4840] rounded-xl py-2.5 text-xs text-[#8A8275] hover:text-[#F7F4EE] transition-colors"
              >
                Annuler
              </button>
              <button
                onClick={handleSave}
                disabled={saving || !form.nom || !form.prenom}
                className="flex-1 bg-[#BA7517] text-white rounded-xl py-2.5 text-xs font-medium hover:bg-[#A36714] transition-colors disabled:opacity-40"
              >
                {saving ? 'Enregistrement...' : 'Ajouter'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Liste */}
      <div className="p-6 max-w-2xl mx-auto flex flex-col gap-3">

        {loading ? (
          <div className="flex flex-col items-center justify-center py-16 gap-3">
            <div className="w-6 h-6 rounded-full border-2 border-[#C4B89E] border-t-[#BA7517] animate-spin" />
            <p className="text-[9px] tracking-[0.25em] uppercase text-[#8A8275]">Chargement</p>
          </div>
        ) : employes.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 gap-4">
            <div className="text-4xl opacity-30">⊹</div>
            <p className="text-sm text-[#8A8275]">Aucun employé enregistré</p>
            <button onClick={() => setShowForm(true)} className="text-xs text-[#BA7517] underline">
              Ajouter le premier
            </button>
          </div>
        ) : (
          employes.map(emp => (
            <div
              key={emp.id}
              className={`bg-white border rounded-2xl p-4 shadow-md transition-all ${emp.actif ? 'border-[#C4B89E]' : 'border-[#D4CBBA] opacity-50'}`}
            >
              <div className="flex items-center gap-3">
                {/* Avatar */}
                <div className={`w-11 h-11 rounded-xl flex items-center justify-center text-sm font-semibold flex-shrink-0 ${ROLE_AVATAR[emp.role] || ROLE_AVATAR.employe}`}>
                  {emp.prenom?.[0]?.toUpperCase()}{emp.nom?.[0]?.toUpperCase()}
                </div>

                {/* Infos */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-sm font-medium text-[#2C2A25]">
                      {emp.prenom} {emp.nom}
                    </p>
                    {!emp.actif && (
                      <span className="text-[9px] bg-[#E8E2D5] text-[#8A8275] rounded-md px-1.5 py-0.5 uppercase tracking-wide">
                        Inactif
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-[#8A8275] mt-0.5">
                    {emp.telephone || 'Aucun téléphone'}
                  </p>
                </div>

                {/* Badge rôle */}
                <span className={`text-[9px] font-medium px-2.5 py-1 rounded-lg border uppercase tracking-wide flex-shrink-0 ${ROLE_BADGE[emp.role] || ROLE_BADGE.employe}`}>
                  {ROLE_LABEL[emp.role]}
                </span>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2 mt-3 pt-3 border-t border-[#EDE8DE]">
                <button
                  onClick={() => handleToggleActif(emp)}
                  className="flex-1 text-[10px] uppercase tracking-wide text-[#8A8275] hover:text-[#2C2A25] transition-colors py-1"
                >
                  {emp.actif ? 'Désactiver' : 'Activer'}
                </button>
                <div className="w-px h-4 bg-[#EDE8DE]" />
                <button
                  onClick={() => handleDelete(emp.id)}
                  className="flex-1 text-[10px] uppercase tracking-wide text-[#8A8275] hover:text-rose-500 transition-colors py-1"
                >
                  Supprimer
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
