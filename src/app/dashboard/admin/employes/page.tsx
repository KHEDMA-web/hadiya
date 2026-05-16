'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import { ROLE_DEFAULTS, type Permissions } from '@/lib/auth'
import BackButton from '../../_components/BackButton'

type Employe = {
  id: string
  nom: string
  prenom: string
  telephone: string | null
  role: string
  actif: boolean
  email: string | null
  user_id: string | null
  permissions: Permissions
  created_at: string
}

const ROLE_BADGE: Record<string, string> = {
  caissier:       'bg-emerald-600/10 text-emerald-600 border-emerald-600/25',
  receptionniste: 'bg-[#7C6FAE]/15 text-[#7C6FAE] border-[#7C6FAE]/30',
  manager:        'bg-[#BA7517]/15 text-[#BA7517] border-[#BA7517]/30',
  praticien:      'bg-rose-500/10 text-rose-600 border-rose-500/25',
}

const ROLE_AVATAR: Record<string, string> = {
  caissier:       'bg-emerald-600/15 text-emerald-600',
  receptionniste: 'bg-[#7C6FAE]/20 text-[#7C6FAE]',
  manager:        'bg-[#BA7517]/20 text-[#BA7517]',
  praticien:      'bg-rose-500/15 text-rose-600',
}

const ROLE_LABEL: Record<string, string> = {
  caissier: 'Caissier', receptionniste: 'Réceptionniste', manager: 'Manager', praticien: 'Praticien',
}

const PAGES = [
  { key: 'scanner',      label: 'Scanner',      icon: '◈' },
  { key: 'caisse',       label: 'Caisse POS',   icon: '⊞' },
  { key: 'clients',      label: 'Clients',      icon: '⊹' },
  { key: 'recharge',     label: 'Recharge',     icon: '◎' },
  { key: 'produits',     label: 'Produits',     icon: '✦' },
  { key: 'statistiques', label: 'Statistiques', icon: '≋' },
  { key: 'transactions', label: 'Historique',   icon: '≡' },
  { key: 'admin',        label: 'Admin',        icon: '◬' },
] as const

const emptyStaffForm = {
  nom: '', prenom: '', telephone: '', email: '', password: '',
  role: 'caissier' as string,
  permissions: { ...ROLE_DEFAULTS.caissier },
}

const emptyPraticienForm = { nom: '', prenom: '', telephone: '' }

export default function Employes() {
  const [employes, setEmployes] = useState<Employe[]>([])
  const [loading, setLoading] = useState(true)
  const [formType, setFormType] = useState<'praticien' | 'staff'>('praticien')
  const [showForm, setShowForm] = useState(false)
  const [editingPerms, setEditingPerms] = useState<string | null>(null)
  const [staffForm, setStaffForm] = useState(emptyStaffForm)
  const [praticienForm, setPraticienForm] = useState(emptyPraticienForm)
  const [saving, setSaving] = useState(false)
  const [erreur, setErreur] = useState('')
  const [showPassword, setShowPassword] = useState(false)

  useEffect(() => { fetchEmployes() }, [])

  const fetchEmployes = async () => {
    setLoading(true)
    const { data } = await supabase.from('employes').select('*').order('prenom')
    setEmployes((data ?? []) as Employe[])
    setLoading(false)
  }

  const getSalonId = async () => {
    const { data: { session } } = await supabase.auth.getSession()
    const { data: salon } = await supabase
      .from('salons')
      .select('id')
      .eq('email', session?.user.email || '')
      .single()
    return salon?.id ?? null
  }

  const handleSavePraticien = async () => {
    if (!praticienForm.nom || !praticienForm.prenom) {
      setErreur('Prénom et nom obligatoires')
      return
    }
    setSaving(true)
    setErreur('')
    const salonId = await getSalonId()
    if (!salonId) { setErreur('Salon introuvable'); setSaving(false); return }

    const { error } = await supabase.from('employes').insert({
      salon_id: salonId,
      prenom: praticienForm.prenom,
      nom: praticienForm.nom,
      telephone: praticienForm.telephone || null,
      role: 'praticien',
      email: null,
      permissions: {},
      actif: true,
    })

    if (error) { setErreur(error.message); setSaving(false); return }
    await fetchEmployes()
    setPraticienForm(emptyPraticienForm)
    setShowForm(false)
    setSaving(false)
  }

  const handleSaveStaff = async () => {
    if (!staffForm.nom || !staffForm.prenom || !staffForm.email || !staffForm.password) {
      setErreur('Tous les champs obligatoires doivent être remplis')
      return
    }
    if (staffForm.password.length < 6) {
      setErreur('Le mot de passe doit contenir au moins 6 caractères')
      return
    }
    setSaving(true)
    setErreur('')
    const salonId = await getSalonId()
    if (!salonId) { setErreur('Salon introuvable'); setSaving(false); return }

    const res = await fetch('/api/employes/create', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: staffForm.email,
        password: staffForm.password,
        nom: staffForm.nom,
        prenom: staffForm.prenom,
        telephone: staffForm.telephone || null,
        role: staffForm.role,
        permissions: staffForm.permissions,
        salonId,
      }),
    })

    const result = await res.json() as { error?: string }
    if (!res.ok) { setErreur(result.error || 'Erreur lors de la création'); setSaving(false); return }

    await fetchEmployes()
    setStaffForm(emptyStaffForm)
    setShowForm(false)
    setSaving(false)
  }

  const handleUpdatePermissions = async (emp: Employe, perms: Permissions) => {
    await supabase.from('employes').update({ permissions: perms }).eq('id', emp.id)
    setEmployes(prev => prev.map(x => x.id === emp.id ? { ...x, permissions: perms } : x))
    setEditingPerms(null)
  }

  const handleToggleActif = async (e: Employe) => {
    await supabase.from('employes').update({ actif: !e.actif }).eq('id', e.id)
    setEmployes(prev => prev.map(x => x.id === e.id ? { ...x, actif: !x.actif } : x))
  }

  const handleDelete = async (emp: Employe) => {
    await supabase.from('employes').delete().eq('id', emp.id)
    setEmployes(prev => prev.filter(x => x.id !== emp.id))
  }

  const praticiens = employes.filter(e => e.role === 'praticien')
  const staff = employes.filter(e => e.role !== 'praticien')

  return (
    <div className="min-h-screen bg-[#E8E2D5]">

      {/* Header */}
      <div className="bg-[#2C2A25] px-6 py-4 flex items-center gap-4 shadow-lg">
        <BackButton href="/dashboard/admin" />
        <div className="flex-1">
          <h1 className="text-base font-medium text-[#F7F4EE]">Équipe</h1>
          <p className="text-[10px] text-[#BA7517]">
            <span className="text-rose-400">{praticiens.length}</span> praticien{praticiens.length > 1 ? 's' : ''}
            <span className="mx-1.5 opacity-30">·</span>
            <span className="text-[#BA7517]">{staff.length}</span> staff
          </p>
        </div>
        <button onClick={() => { setShowForm(true); setErreur('') }}
          className="flex items-center gap-2 bg-[#BA7517] text-white rounded-xl px-4 py-2 text-xs font-medium hover:bg-[#A36714] transition-colors shadow-[0_2px_8px_rgba(186,117,23,0.3)]">
          <span className="text-base leading-none">+</span>Ajouter
        </button>
      </div>

      {/* Formulaire ajout */}
      {showForm && (
        <div className="bg-[#2C2A25] border-b border-[#3A3830] px-6 py-5">
          <div className="max-w-2xl mx-auto flex flex-col gap-4">

            {/* Choix type */}
            <div className="flex gap-1 p-1 bg-[#3A3830] rounded-xl">
              {([
                { id: 'praticien', label: '🪷 Praticien', desc: 'Masseur / Masseuse' },
                { id: 'staff',     label: '⊞ Staff',      desc: 'Caissier / Manager' },
              ] as const).map(t => (
                <button key={t.id} onClick={() => { setFormType(t.id); setErreur('') }}
                  className={`flex-1 py-2.5 px-3 rounded-lg text-left transition-all ${
                    formType === t.id ? 'bg-[#F7F4EE]' : 'hover:bg-[#4A4840]'
                  }`}>
                  <p className={`text-[11px] font-medium ${formType === t.id ? 'text-[#2C2A25]' : 'text-[#8A8275]'}`}>{t.label}</p>
                  <p className={`text-[9px] mt-0.5 ${formType === t.id ? 'text-[#8A8275]' : 'text-[#5A5850]'}`}>{t.desc}</p>
                </button>
              ))}
            </div>

            {/* Formulaire Praticien */}
            {formType === 'praticien' && (
              <>
                <div className="grid grid-cols-2 gap-3">
                  <input placeholder="Prénom *" value={praticienForm.prenom}
                    onChange={e => setPraticienForm(f => ({ ...f, prenom: e.target.value }))}
                    className="border border-[#4A4840] rounded-xl px-4 py-2.5 text-sm bg-[#3A3830] text-[#F7F4EE] outline-none focus:border-[#BA7517] placeholder:text-[#5A5850]" />
                  <input placeholder="Nom *" value={praticienForm.nom}
                    onChange={e => setPraticienForm(f => ({ ...f, nom: e.target.value }))}
                    className="border border-[#4A4840] rounded-xl px-4 py-2.5 text-sm bg-[#3A3830] text-[#F7F4EE] outline-none focus:border-[#BA7517] placeholder:text-[#5A5850]" />
                </div>
                <input placeholder="Téléphone / Contact" value={praticienForm.telephone}
                  onChange={e => setPraticienForm(f => ({ ...f, telephone: e.target.value }))}
                  className="border border-[#4A4840] rounded-xl px-4 py-2.5 text-sm bg-[#3A3830] text-[#F7F4EE] outline-none focus:border-[#BA7517] placeholder:text-[#5A5850]" />
                <p className="text-[10px] text-[#5A5850] flex items-center gap-1.5">
                  <span>ℹ</span> Pas de compte app — visible uniquement dans les réservations
                </p>
              </>
            )}

            {/* Formulaire Staff */}
            {formType === 'staff' && (
              <>
                <div className="grid grid-cols-2 gap-3">
                  <input placeholder="Prénom *" value={staffForm.prenom}
                    onChange={e => setStaffForm(f => ({ ...f, prenom: e.target.value }))}
                    className="border border-[#4A4840] rounded-xl px-4 py-2.5 text-sm bg-[#3A3830] text-[#F7F4EE] outline-none focus:border-[#BA7517] placeholder:text-[#5A5850]" />
                  <input placeholder="Nom *" value={staffForm.nom}
                    onChange={e => setStaffForm(f => ({ ...f, nom: e.target.value }))}
                    className="border border-[#4A4840] rounded-xl px-4 py-2.5 text-sm bg-[#3A3830] text-[#F7F4EE] outline-none focus:border-[#BA7517] placeholder:text-[#5A5850]" />
                </div>
                <input placeholder="Téléphone" value={staffForm.telephone}
                  onChange={e => setStaffForm(f => ({ ...f, telephone: e.target.value }))}
                  className="border border-[#4A4840] rounded-xl px-4 py-2.5 text-sm bg-[#3A3830] text-[#F7F4EE] outline-none focus:border-[#BA7517] placeholder:text-[#5A5850]" />

                <div className="border-t border-[#4A4840] pt-3">
                  <p className="text-[9px] tracking-[0.2em] uppercase text-[#5A5850] mb-2">Identifiants de connexion</p>
                  <div className="flex flex-col gap-3">
                    <input placeholder="Email *" type="email" value={staffForm.email}
                      onChange={e => setStaffForm(f => ({ ...f, email: e.target.value }))}
                      className="border border-[#4A4840] rounded-xl px-4 py-2.5 text-sm bg-[#3A3830] text-[#F7F4EE] outline-none focus:border-[#BA7517] placeholder:text-[#5A5850]" />
                    <div className="relative">
                      <input placeholder="Mot de passe * (min. 6 caractères)"
                        type={showPassword ? 'text' : 'password'}
                        value={staffForm.password}
                        onChange={e => setStaffForm(f => ({ ...f, password: e.target.value }))}
                        className="w-full border border-[#4A4840] rounded-xl px-4 py-2.5 text-sm bg-[#3A3830] text-[#F7F4EE] outline-none focus:border-[#BA7517] placeholder:text-[#5A5850]" />
                      <button type="button" onClick={() => setShowPassword(s => !s)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-[#5A5850] hover:text-[#8A8275] text-xs">
                        {showPassword ? '🙈' : '👁'}
                      </button>
                    </div>
                  </div>
                </div>

                <div>
                  <p className="text-[9px] tracking-[0.2em] uppercase text-[#5A5850] mb-2">Rôle</p>
                  <div className="flex gap-2">
                    {(['caissier', 'receptionniste', 'manager'] as const).map(r => (
                      <button key={r} onClick={() => setStaffForm(f => ({ ...f, role: r, permissions: { ...ROLE_DEFAULTS[r] } }))}
                        className={`flex-1 py-2 rounded-xl text-[10px] uppercase tracking-wide font-medium transition-all border ${staffForm.role === r ? ROLE_BADGE[r] : 'bg-[#3A3830] text-[#5A5850] border-[#4A4840]'}`}>
                        {ROLE_LABEL[r]}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <p className="text-[9px] tracking-[0.2em] uppercase text-[#5A5850] mb-2">Permissions</p>
                  <div className="grid grid-cols-2 gap-2">
                    {PAGES.map(({ key, label, icon }) => (
                      <button key={key}
                        onClick={() => setStaffForm(f => ({ ...f, permissions: { ...f.permissions, [key]: !f.permissions[key as keyof Permissions] } }))}
                        className={`flex items-center gap-2 px-3 py-2 rounded-xl border text-xs transition-all ${
                          staffForm.permissions[key as keyof Permissions]
                            ? 'bg-[#BA7517]/15 border-[#BA7517]/40 text-[#BA7517]'
                            : 'bg-[#3A3830] border-[#4A4840] text-[#5A5850]'
                        }`}>
                        <span>{icon}</span><span>{label}</span>
                        <span className="ml-auto">{staffForm.permissions[key as keyof Permissions] ? '✓' : '−'}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </>
            )}

            {erreur && <p className="text-xs text-rose-400">{erreur}</p>}

            <div className="flex gap-2">
              <button onClick={() => { setShowForm(false); setPraticienForm(emptyPraticienForm); setStaffForm(emptyStaffForm); setErreur('') }}
                className="flex-1 border border-[#4A4840] rounded-xl py-2.5 text-xs text-[#8A8275] hover:text-[#F7F4EE] transition-colors">
                Annuler
              </button>
              <button
                onClick={formType === 'praticien' ? handleSavePraticien : handleSaveStaff}
                disabled={saving}
                className="flex-1 bg-[#BA7517] text-white rounded-xl py-2.5 text-xs font-medium hover:bg-[#A36714] transition-colors disabled:opacity-40">
                {saving ? 'Enregistrement...' : formType === 'praticien' ? 'Ajouter le praticien' : 'Créer le compte'}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="p-6 max-w-2xl mx-auto flex flex-col gap-6">
        {loading ? (
          <div className="flex justify-center py-16">
            <div className="w-6 h-6 rounded-full border-2 border-[#C4B89E] border-t-[#BA7517] animate-spin" />
          </div>
        ) : (
          <>
            {/* ── Section Praticiens ── */}
            <section>
              <div className="flex items-center gap-3 mb-3">
                <p className="text-[10px] font-semibold tracking-[0.15em] uppercase text-[#8A8275]">🪷 Praticiens</p>
                <div className="flex-1 h-px bg-[#C4B89E]/30" />
                <span className="text-[9px] text-[#BA7517] font-medium">{praticiens.length}</span>
              </div>
              {praticiens.length === 0 ? (
                <div className="bg-white/60 border border-dashed border-[#C4B89E] rounded-2xl p-6 text-center">
                  <p className="text-sm text-[#8A8275]">Aucun praticien</p>
                  <button onClick={() => { setFormType('praticien'); setShowForm(true) }}
                    className="mt-2 text-[10px] text-[#BA7517] hover:underline">+ Ajouter</button>
                </div>
              ) : (
                <div className="flex flex-col gap-3">
                  {praticiens.map(emp => (
                    <div key={emp.id} className={`bg-white border rounded-2xl shadow-sm overflow-hidden transition-all ${emp.actif ? 'border-[#C4B89E]' : 'border-[#D4CBBA] opacity-50'}`}>
                      <div className="p-4 flex items-center gap-3">
                        <div className="w-11 h-11 rounded-xl bg-rose-500/15 text-rose-600 flex items-center justify-center text-sm font-semibold flex-shrink-0">
                          {emp.prenom?.[0]?.toUpperCase()}{emp.nom?.[0]?.toUpperCase()}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="text-sm font-medium text-[#2C2A25]">{emp.prenom} {emp.nom}</p>
                            {!emp.actif && <span className="text-[9px] bg-[#E8E2D5] text-[#8A8275] rounded-md px-1.5 py-0.5 uppercase tracking-wide">Inactif</span>}
                          </div>
                          {emp.telephone && <p className="text-[11px] text-[#8A8275] mt-0.5">{emp.telephone}</p>}
                          <span className="inline-block mt-1 text-[9px] font-medium px-2 py-0.5 rounded-md border bg-rose-500/10 text-rose-600 border-rose-500/25 uppercase tracking-wide">Praticien</span>
                        </div>
                      </div>
                      <div className="flex items-center divide-x divide-[#EDE8DE] border-t border-[#EDE8DE]">
                        <button onClick={() => handleToggleActif(emp)}
                          className="flex-1 py-2.5 text-[10px] uppercase tracking-wide text-[#8A8275] hover:text-[#2C2A25] transition-colors">
                          {emp.actif ? 'Désactiver' : 'Activer'}
                        </button>
                        <button onClick={() => handleDelete(emp)}
                          className="flex-1 py-2.5 text-[10px] uppercase tracking-wide text-[#8A8275] hover:text-rose-500 transition-colors">
                          Supprimer
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>

            {/* ── Section Staff ── */}
            <section>
              <div className="flex items-center gap-3 mb-3">
                <p className="text-[10px] font-semibold tracking-[0.15em] uppercase text-[#8A8275]">⊞ Staff</p>
                <div className="flex-1 h-px bg-[#C4B89E]/30" />
                <span className="text-[9px] text-[#BA7517] font-medium">{staff.length}</span>
              </div>
              {staff.length === 0 ? (
                <div className="bg-white/60 border border-dashed border-[#C4B89E] rounded-2xl p-6 text-center">
                  <p className="text-sm text-[#8A8275]">Aucun membre du staff</p>
                  <button onClick={() => { setFormType('staff'); setShowForm(true) }}
                    className="mt-2 text-[10px] text-[#BA7517] hover:underline">+ Ajouter</button>
                </div>
              ) : (
                <div className="flex flex-col gap-3">
                  {staff.map(emp => (
                    <div key={emp.id} className={`bg-white border rounded-2xl shadow-md transition-all overflow-hidden ${emp.actif ? 'border-[#C4B89E]' : 'border-[#D4CBBA] opacity-50'}`}>
                      <div className="p-4">
                        <div className="flex items-center gap-3">
                          <div className={`w-11 h-11 rounded-xl flex items-center justify-center text-sm font-semibold flex-shrink-0 ${ROLE_AVATAR[emp.role] || ROLE_AVATAR.caissier}`}>
                            {emp.prenom?.[0]?.toUpperCase()}{emp.nom?.[0]?.toUpperCase()}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <p className="text-sm font-medium text-[#2C2A25]">{emp.prenom} {emp.nom}</p>
                              {!emp.actif && <span className="text-[9px] bg-[#E8E2D5] text-[#8A8275] rounded-md px-1.5 py-0.5 uppercase tracking-wide">Inactif</span>}
                            </div>
                            <p className="text-[11px] text-[#8A8275] mt-0.5">{emp.email || '—'}</p>
                          </div>
                          <span className={`text-[9px] font-medium px-2.5 py-1 rounded-lg border uppercase tracking-wide flex-shrink-0 ${ROLE_BADGE[emp.role] || ROLE_BADGE.caissier}`}>
                            {ROLE_LABEL[emp.role] || emp.role}
                          </span>
                        </div>
                        <div className="mt-3 flex flex-wrap gap-1">
                          {PAGES.filter(p => emp.permissions?.[p.key as keyof Permissions]).map(p => (
                            <span key={p.key} className="text-[9px] px-1.5 py-0.5 rounded-md bg-[#BA7517]/08 text-[#BA7517] border border-[#BA7517]/20">
                              {p.icon} {p.label}
                            </span>
                          ))}
                        </div>
                      </div>

                      {editingPerms === emp.id && (
                        <div className="px-4 pb-4 border-t border-[#EDE8DE] pt-3">
                          <p className="text-[9px] tracking-[0.2em] uppercase text-[#8A8275] mb-2">Modifier les accès</p>
                          <div className="grid grid-cols-2 gap-2 mb-3">
                            {PAGES.map(({ key, label, icon }) => {
                              const hasAccess = emp.permissions?.[key as keyof Permissions] ?? false
                              return (
                                <button key={key}
                                  onClick={() => setEmployes(prev => prev.map(x => x.id === emp.id
                                    ? { ...x, permissions: { ...x.permissions, [key]: !hasAccess } }
                                    : x
                                  ))}
                                  className={`flex items-center gap-2 px-3 py-2 rounded-xl border text-xs transition-all ${
                                    hasAccess
                                      ? 'bg-[#BA7517]/10 border-[#BA7517]/40 text-[#BA7517]'
                                      : 'bg-[#F7F4EE] border-[#C4B89E] text-[#8A8275]'
                                  }`}>
                                  <span>{icon}</span><span>{label}</span>
                                  <span className="ml-auto">{hasAccess ? '✓' : '−'}</span>
                                </button>
                              )
                            })}
                          </div>
                          <div className="flex gap-2">
                            <button onClick={() => setEditingPerms(null)}
                              className="flex-1 border border-[#C4B89E] rounded-xl py-2 text-xs text-[#8A8275]">Annuler</button>
                            <button onClick={() => handleUpdatePermissions(emp, emp.permissions)}
                              className="flex-1 bg-[#BA7517] text-white rounded-xl py-2 text-xs font-medium hover:bg-[#A36714]">
                              Sauvegarder
                            </button>
                          </div>
                        </div>
                      )}

                      <div className="flex items-center divide-x divide-[#EDE8DE] border-t border-[#EDE8DE]">
                        <button onClick={() => setEditingPerms(editingPerms === emp.id ? null : emp.id)}
                          className="flex-1 py-2.5 text-[10px] uppercase tracking-wide text-[#BA7517] hover:text-[#A36714] transition-colors font-medium">
                          {editingPerms === emp.id ? 'Fermer' : 'Accès'}
                        </button>
                        <button onClick={() => handleToggleActif(emp)}
                          className="flex-1 py-2.5 text-[10px] uppercase tracking-wide text-[#8A8275] hover:text-[#2C2A25] transition-colors">
                          {emp.actif ? 'Désactiver' : 'Activer'}
                        </button>
                        <button onClick={() => handleDelete(emp)}
                          className="flex-1 py-2.5 text-[10px] uppercase tracking-wide text-[#8A8275] hover:text-rose-500 transition-colors">
                          Supprimer
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>
          </>
        )}
      </div>
    </div>
  )
}
