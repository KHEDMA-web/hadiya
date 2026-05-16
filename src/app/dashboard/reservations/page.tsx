'use client'
import { useEffect, useState, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { getUserProfile } from '@/lib/auth'
import { useRouter } from 'next/navigation'
import BackButton from '../_components/BackButton'

type Statut = 'en_attente' | 'confirme' | 'annule' | 'termine'
type ViewMode = 'jour' | 'semaine' | 'mois'

type Reservation = {
  id: string
  date_heure: string
  duree_minutes: number
  statut: Statut
  notes: string | null
  client_id: string | null
  clients: { prenom: string; nom: string; telephone: string } | null
  menu_items: { nom: string; emoji: string; duree_minutes: number | null } | null
  employes: { prenom: string; nom: string } | null
}

type Client = { id: string; prenom: string; nom: string; telephone: string }
type Service = { id: string; nom: string; emoji: string; duree_minutes: number | null; prix: number }
type Employe = { id: string; prenom: string; nom: string }

const STATUT_CONFIG: Record<Statut, { label: string; bg: string; text: string; border: string }> = {
  en_attente: { label: 'En attente', bg: 'rgba(186,117,23,0.1)',   text: '#BA7517', border: 'rgba(186,117,23,0.3)'  },
  confirme:   { label: 'Confirmé',   bg: 'rgba(16,185,129,0.1)',  text: '#059669', border: 'rgba(16,185,129,0.3)'  },
  annule:     { label: 'Annulé',     bg: 'rgba(239,68,68,0.1)',   text: '#DC2626', border: 'rgba(239,68,68,0.3)'   },
  termine:    { label: 'Terminé',    bg: 'rgba(138,130,117,0.1)', text: '#6B6560', border: 'rgba(138,130,117,0.3)' },
}

const JOURS_COURT = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim']
const MOIS_NOMS = ['Janvier','Février','Mars','Avril','Mai','Juin','Juillet','Août','Septembre','Octobre','Novembre','Décembre']
const HEURES_SUGGESTIONS = ['09:00', '10:00', '11:00', '14:00', '15:30', '17:00']

function isoDate(d: Date) { return d.toISOString().slice(0, 10) }
function toTimeLocal(iso: string) { return new Date(iso).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }) }
function addDays(d: Date, n: number) { const r = new Date(d); r.setDate(r.getDate() + n); return r }

function computeEndTime(heure: string, dureeMin: number) {
  if (!heure) return ''
  const [h, m] = heure.split(':').map(Number)
  const total = h * 60 + m + dureeMin
  const eh = Math.floor(total / 60) % 24
  const em = total % 60
  return `${String(eh).padStart(2, '0')}:${String(em).padStart(2, '0')}`
}

function initiales(prenom: string, nom: string) {
  return `${prenom[0] ?? ''}${nom[0] ?? ''}`.toUpperCase()
}

function getWeekStart(offset: number) {
  const today = new Date()
  const mon = new Date(today)
  mon.setDate(today.getDate() - ((today.getDay() + 6) % 7) + offset * 7)
  mon.setHours(0, 0, 0, 0)
  return mon
}

function getMonthBounds(offset: number) {
  const now = new Date()
  const start = new Date(now.getFullYear(), now.getMonth() + offset, 1)
  const end = new Date(now.getFullYear(), now.getMonth() + offset + 1, 0)
  end.setHours(23, 59, 59, 999)
  return { start, end, year: start.getFullYear(), month: start.getMonth() }
}

function SectionLabel({ children, required }: { children: React.ReactNode; required?: boolean }) {
  return (
    <div className="flex items-center gap-2 px-1 mb-2">
      <span className="text-[10px] font-medium tracking-[0.14em] uppercase text-[#8A8275]">{children}</span>
      {required && <span className="text-[#BA7517] text-[10px]">*</span>}
      <div className="h-px flex-1 bg-[#D9D0B8]/40" />
    </div>
  )
}

const emptyForm = {
  clientMode: 'existing' as 'existing' | 'new',
  clientId: '',
  prenomClient: '',
  nomClient: '',
  telClient: '',
  dateNaissance: '',
  serviceId: '',
  employeId: '',
  date: isoDate(new Date()),
  heure: '10:00',
  notes: '',
}

export default function ReservationsPage() {
  const router = useRouter()
  const [salonId, setSalonId] = useState<string | null>(null)
  const [allReservations, setAllReservations] = useState<Reservation[]>([])
  const [loading, setLoading] = useState(true)
  const [viewMode, setViewMode] = useState<ViewMode>('jour')
  const [selectedDate, setSelectedDate] = useState(isoDate(new Date()))
  const [weekOffset, setWeekOffset] = useState(0)
  const [monthOffset, setMonthOffset] = useState(0)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState(emptyForm)
  const [saving, setSaving] = useState(false)
  const [erreur, setErreur] = useState('')
  const [newCarte, setNewCarte] = useState<{ uid: string; prenom: string } | null>(null)
  const [clients, setClients] = useState<Client[]>([])
  const [services, setServices] = useState<Service[]>([])
  const [employes, setEmployes] = useState<Employe[]>([])
  const [clientSearch, setClientSearch] = useState('')
  const [actionLoading, setActionLoading] = useState<string | null>(null)

  const loadRange = useCallback(async (sid: string, from: Date, to: Date) => {
    setLoading(true)
    const { data } = await supabase
      .from('reservations')
      .select('*, clients(prenom, nom, telephone), menu_items(nom, emoji, duree_minutes), employes(prenom, nom)')
      .eq('salon_id', sid)
      .gte('date_heure', from.toISOString())
      .lte('date_heure', to.toISOString())
      .order('date_heure')
    setAllReservations((data ?? []) as Reservation[])
    setLoading(false)
  }, [])

  useEffect(() => {
    const init = async () => {
      const profile = await getUserProfile()
      if (!profile) { router.push('/login'); return }
      const sid = profile.salonId
      if (!sid) return
      setSalonId(sid)
      const [{ data: cls }, { data: svcs }, { data: emps }] = await Promise.all([
        supabase.from('clients').select('id, prenom, nom, telephone').eq('salon_id', sid).order('prenom'),
        supabase.from('menu_items').select('id, nom, emoji, duree_minutes, prix').eq('salon_id', sid).eq('actif', true).neq('categorie', 'consommable').order('nom'),
        supabase.from('employes').select('id, prenom, nom').eq('salon_id', sid).eq('actif', true).eq('role', 'praticien').order('prenom'),
      ])
      setClients((cls ?? []) as Client[])
      setServices((svcs ?? []) as Service[])
      setEmployes((emps ?? []) as Employe[])
    }
    init()
  }, [router])

  useEffect(() => {
    if (!salonId) return
    if (viewMode === 'jour') {
      const from = new Date(selectedDate + 'T00:00:00')
      const to = new Date(selectedDate + 'T23:59:59')
      loadRange(salonId, from, to)
    } else if (viewMode === 'semaine') {
      const from = getWeekStart(weekOffset)
      const to = addDays(from, 6)
      to.setHours(23, 59, 59, 999)
      loadRange(salonId, from, to)
    } else {
      const { start, end } = getMonthBounds(monthOffset)
      loadRange(salonId, start, end)
    }
  }, [salonId, viewMode, selectedDate, weekOffset, monthOffset, loadRange])

  const handleSave = async () => {
    if (!salonId) return
    if (form.clientMode === 'existing' && !form.clientId) { setErreur('Sélectionnez un client'); return }
    if (form.clientMode === 'new' && (!form.prenomClient.trim() || !form.nomClient.trim())) { setErreur('Prénom et nom obligatoires'); return }
    if (!form.serviceId) { setErreur('Sélectionnez un service'); return }
    if (!form.date || !form.heure) { setErreur('Choisissez une date et une heure'); return }

    setSaving(true)
    setErreur('')

    let clientId = form.clientId

    if (form.clientMode === 'new') {
      const prenom = form.prenomClient.trim()
      const nom = form.nomClient.trim()
      const { data: newClient, error: clientError } = await supabase
        .from('clients')
        .insert({
          salon_id: salonId,
          prenom,
          nom,
          telephone: form.telClient || null,
          date_naissance: form.dateNaissance || null,
          points: 0,
        })
        .select('id')
        .single()
      if (clientError) { setErreur(clientError.message); setSaving(false); return }
      clientId = newClient.id
      setClients(prev => [...prev, { id: newClient.id, prenom, nom, telephone: form.telClient || '' }].sort((a, b) => a.prenom.localeCompare(b.prenom)))

      // Créer une carte fidélité automatiquement
      const uid = crypto.randomUUID().replace(/-/g, '').slice(0, 16).toUpperCase()
      await supabase.from('cartes').insert({
        salon_id: salonId,
        client_id: newClient.id,
        uid_rfid: uid,
        type: 'fidelite',
        solde: 0,
        points: 0,
        niveau: 'bronze',
        statut: 'active',
        source: 'comptoir',
      })
      setNewCarte({ uid, prenom })
    }

    const dateHeure = new Date(`${form.date}T${form.heure}:00`).toISOString()
    const service = services.find(s => s.id === form.serviceId)
    const duree = service?.duree_minutes ?? 60

    const { error } = await supabase.from('reservations').insert({
      salon_id: salonId,
      client_id: clientId,
      service_id: form.serviceId,
      date_heure: dateHeure,
      duree_minutes: duree,
      statut: 'en_attente',
      notes: form.notes || null,
      employe_id: form.employeId || null,
    })

    setSaving(false)
    if (error) { setErreur(error.message); return }
    setShowForm(false)
    setForm(emptyForm)
    setClientSearch('')
  }

  const updateStatut = async (id: string, statut: Statut) => {
    setActionLoading(id)
    await supabase.from('reservations').update({ statut }).eq('id', id)
    setAllReservations(prev => prev.map(r => r.id === id ? { ...r, statut } : r))
    setActionLoading(null)
  }

  const deleteReservation = async (id: string) => {
    setActionLoading(id)
    await supabase.from('reservations').delete().eq('id', id)
    setAllReservations(prev => prev.filter(r => r.id !== id))
    setActionLoading(null)
  }

  const today = isoDate(new Date())
  const filteredClients = clientSearch
    ? clients.filter(c => `${c.prenom} ${c.nom} ${c.telephone}`.toLowerCase().includes(clientSearch.toLowerCase())).slice(0, 5)
    : []

  const selectedClient = clients.find(c => c.id === form.clientId)
  const selectedService = services.find(s => s.id === form.serviceId)

  // Day view data
  const dayReservations = allReservations.filter(r => r.date_heure.slice(0, 10) === selectedDate)

  // Week view data
  const weekStart = getWeekStart(weekOffset)
  const weekDays = Array.from({ length: 7 }, (_, i) => {
    const d = addDays(weekStart, i)
    const ds = isoDate(d)
    return { date: d, dateStr: ds, reservations: allReservations.filter(r => r.date_heure.slice(0, 10) === ds) }
  })
  const weekLabel = `${weekDays[0].date.getDate()} ${MOIS_NOMS[weekDays[0].date.getMonth()].slice(0,3)} – ${weekDays[6].date.getDate()} ${MOIS_NOMS[weekDays[6].date.getMonth()].slice(0,3)} ${weekDays[6].date.getFullYear()}`

  // Month view data
  const { start: monthStart, year: mYear, month: mMonth } = getMonthBounds(monthOffset)
  const daysInMonth = new Date(mYear, mMonth + 1, 0).getDate()
  const firstWeekday = (monthStart.getDay() + 6) % 7
  const monthCells: Array<{ day: number | null; dateStr: string | null; count: number }> = []
  for (let i = 0; i < firstWeekday; i++) monthCells.push({ day: null, dateStr: null, count: 0 })
  for (let d = 1; d <= daysInMonth; d++) {
    const dateStr = `${mYear}-${String(mMonth + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`
    const count = allReservations.filter(r => r.date_heure.slice(0, 10) === dateStr).length
    monthCells.push({ day: d, dateStr, count })
  }
  while (monthCells.length % 7 !== 0) monthCells.push({ day: null, dateStr: null, count: 0 })
  const monthSelectedReservations = allReservations.filter(r => r.date_heure.slice(0, 10) === selectedDate)

  const ReservationCard = ({ r }: { r: Reservation }) => {
    const cfg = STATUT_CONFIG[r.statut]
    const clientNom = r.clients ? `${r.clients.prenom} ${r.clients.nom}` : 'Client'
    const tel = r.clients?.telephone
    const isLoading = actionLoading === r.id
    return (
      <div className="bg-white border border-[#E8E0CE] rounded-2xl shadow-[0_1px_0_rgba(44,42,37,0.04),0_4px_16px_-8px_rgba(44,42,37,0.08)] flex flex-col gap-2.5 p-3.5">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <div className="flex flex-col items-center bg-[#F7F4EE] rounded-xl px-3 py-1.5 flex-shrink-0 border border-[#E8E0CE]">
              <span className="text-[13px] font-semibold text-[#BA7517] leading-none">{toTimeLocal(r.date_heure)}</span>
              <span className="text-[9px] text-[#8A8275] mt-0.5">{r.duree_minutes} min</span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[13px] font-semibold text-[#2C2A25] truncate leading-tight">{clientNom}</p>
              {tel && <p className="text-[10px] text-[#8A8275] mt-0.5 leading-tight">{tel}</p>}
              <div className="flex items-center gap-2 mt-1 flex-wrap">
                {r.menu_items && <p className="text-[11px] text-[#BA7517] leading-tight">{r.menu_items.emoji} {r.menu_items.nom}</p>}
                {r.employes && (
                  <>
                    <span className="text-[#D9D0B8] text-[10px]">·</span>
                    <p className="text-[10px] text-[#8A8275] leading-tight">{r.employes.prenom} {r.employes.nom}</p>
                  </>
                )}
              </div>
            </div>
          </div>
          <span className="text-[9px] font-semibold px-2 py-1 rounded-lg flex-shrink-0" style={{ background: cfg.bg, color: cfg.text, border: `1px solid ${cfg.border}` }}>
            {cfg.label}
          </span>
        </div>
        {r.notes && <p className="text-[11px] text-[#8A8275] italic bg-[#F7F4EE] rounded-lg px-3 py-2">💬 {r.notes}</p>}
        <div className="flex gap-1.5 flex-wrap">
          {r.statut === 'en_attente' && (
            <button disabled={isLoading} onClick={() => updateStatut(r.id, 'confirme')}
              className="flex-1 py-1.5 rounded-lg text-[10px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100 transition-colors disabled:opacity-40">
              ✓ Confirmer
            </button>
          )}
          {(r.statut === 'en_attente' || r.statut === 'confirme') && (
            <button disabled={isLoading} onClick={() => updateStatut(r.id, 'termine')}
              className="flex-1 py-1.5 rounded-lg text-[10px] font-medium bg-[#F7F4EE] text-[#2C2A25] border border-[#C4B89E] hover:border-[#BA7517] transition-colors disabled:opacity-40">
              ✦ Terminé
            </button>
          )}
          {r.statut !== 'annule' && r.statut !== 'termine' && (
            <button disabled={isLoading} onClick={() => updateStatut(r.id, 'annule')}
              className="py-1.5 px-3 rounded-lg text-[10px] font-medium bg-rose-50 text-rose-600 border border-rose-200 hover:bg-rose-100 transition-colors disabled:opacity-40">
              Annuler
            </button>
          )}
          {(r.statut === 'annule' || r.statut === 'termine') && (
            <button disabled={isLoading} onClick={() => deleteReservation(r.id)}
              className="py-1.5 px-3 rounded-lg text-[10px] font-medium text-[#8A8275] hover:text-rose-500 transition-colors disabled:opacity-40">
              Supprimer
            </button>
          )}
          {tel && (
            <a href={`https://wa.me/${tel.replace(/[\s\-\+]/g, '').replace(/^0/, '213')}`} target="_blank" rel="noopener noreferrer"
              className="py-1.5 px-3 rounded-lg text-[10px] font-medium bg-[#25D366]/10 text-[#128C7E] border border-[#25D366]/25 hover:bg-[#25D366]/15 transition-colors">
              WA
            </a>
          )}
        </div>
      </div>
    )
  }

  const EmptyDay = ({ date, onNew }: { date: string; onNew: () => void }) => (
    <div className="bg-white border border-[#E8E0CE] rounded-2xl p-10 text-center shadow-sm">
      <p className="text-3xl mb-3 opacity-30">📅</p>
      <p className="text-[13px] font-medium text-[#2C2A25]">Aucune réservation</p>
      <p className="text-[11px] text-[#8A8275] mt-1">
        {date === today ? 'Profitez de la journée 🌿' : new Date(date + 'T12:00:00').toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}
      </p>
      <button onClick={onNew}
        className="mt-4 px-4 py-2 rounded-xl bg-[#BA7517] text-white text-xs font-medium hover:bg-[#A36714] transition-colors">
        Créer une réservation
      </button>
    </div>
  )

  const Spinner = () => (
    <div className="flex justify-center py-12">
      <div className="w-6 h-6 rounded-full border-2 border-[#C4B89E] border-t-[#BA7517] animate-spin" />
    </div>
  )

  const selectedDateLabel = new Date(selectedDate + 'T12:00:00').toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })

  return (
    <div className="min-h-screen bg-[#E8E2D5]">

      {/* Header */}
      <div className="bg-[#2C2A25] shadow-lg">
        <div className="px-6 py-4 flex items-center gap-4">
          <BackButton href="/dashboard" />
          <div className="flex-1">
            <h1 className="text-base font-medium text-[#F7F4EE]">Réservations</h1>
            <p className="text-[10px] text-[#BA7517] capitalize leading-tight mt-0.5">
              {viewMode === 'mois' ? `${MOIS_NOMS[mMonth]} ${mYear}` : selectedDateLabel}
            </p>
          </div>
          <button onClick={() => { setShowForm(true); setErreur('') }}
            className="flex items-center gap-1.5 bg-[#BA7517] text-white rounded-xl px-3.5 py-2 text-[12px] font-medium hover:bg-[#A36714] transition-colors shadow-[0_4px_12px_-4px_rgba(186,117,23,0.6)]">
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M6 1.5v9M1.5 6h9"/></svg>
            Nouvelle
          </button>
        </div>

        {/* View tabs */}
        <div className="px-4 pb-3 flex gap-1">
          {(['jour', 'semaine', 'mois'] as const).map(v => (
            <button key={v} onClick={() => setViewMode(v)}
              className={`flex-1 py-1.5 rounded-lg text-[11px] font-medium transition-colors ${viewMode === v ? 'bg-[#BA7517] text-white' : 'text-[#8A8275] hover:text-[#F7F4EE] hover:bg-[#3A3830]/40'}`}>
              {v === 'jour' ? 'Jour' : v === 'semaine' ? 'Semaine' : 'Mois'}
            </button>
          ))}
        </div>

        {/* Mini weekly strip — jour & semaine */}
        {viewMode !== 'mois' && (
          <div className="px-4 pb-4">
            <div className="flex items-center justify-between mb-3">
              <button onClick={() => setWeekOffset(w => w - 1)}
                className="w-7 h-7 rounded-lg bg-[#3A3830] text-[#8A8275] hover:text-[#F7F4EE] flex items-center justify-center transition-colors">
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
              </button>
              <span className="text-[10px] text-[#8A8275] tracking-widest uppercase capitalize">
                {getWeekStart(weekOffset).toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })}
              </span>
              <button onClick={() => setWeekOffset(w => w + 1)}
                className="w-7 h-7 rounded-lg bg-[#3A3830] text-[#8A8275] hover:text-[#F7F4EE] flex items-center justify-center transition-colors">
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"/></svg>
              </button>
            </div>
            <div className="grid grid-cols-7 gap-1">
              {Array.from({ length: 7 }, (_, i) => {
                const d = addDays(getWeekStart(weekOffset), i)
                const ds = isoDate(d)
                const isSelected = ds === selectedDate
                const isToday = ds === today
                const dayCount = allReservations.filter(r => r.date_heure.slice(0, 10) === ds).length
                return (
                  <button key={i} onClick={() => { setSelectedDate(ds); setViewMode('jour') }}
                    className={`flex flex-col items-center py-2 rounded-xl transition-all ${
                      isSelected ? 'bg-[#BA7517] shadow-[0_2px_8px_rgba(186,117,23,0.4)]'
                      : isToday ? 'bg-[#3A3830] border border-[#BA7517]/40'
                      : 'hover:bg-[#3A3830]'
                    }`}>
                    <span className={`text-[9px] uppercase tracking-wide ${isSelected ? 'text-white/80' : 'text-[#8A8275]'}`}>{JOURS_COURT[i]}</span>
                    <span className={`text-[14px] font-semibold mt-0.5 ${isSelected ? 'text-white' : isToday ? 'text-[#BA7517]' : 'text-[#F7F4EE]/70'}`}>{d.getDate()}</span>
                    {dayCount > 0 && (
                      <span className={`mt-1 text-[8px] font-bold ${isSelected ? 'text-white/90' : 'text-[#BA7517]'}`}>{dayCount}</span>
                    )}
                  </button>
                )
              })}
            </div>
          </div>
        )}

        {/* Month nav */}
        {viewMode === 'mois' && (
          <div className="px-4 pb-4 flex items-center justify-between">
            <button onClick={() => setMonthOffset(m => m - 1)}
              className="w-8 h-8 rounded-xl bg-[#3A3830] text-[#8A8275] hover:text-[#F7F4EE] flex items-center justify-center">
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
            </button>
            <span className="text-[12px] text-[#F7F4EE] font-medium capitalize">{MOIS_NOMS[mMonth]} {mYear}</span>
            <button onClick={() => setMonthOffset(m => m + 1)}
              className="w-8 h-8 rounded-xl bg-[#3A3830] text-[#8A8275] hover:text-[#F7F4EE] flex items-center justify-center">
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"/></svg>
            </button>
          </div>
        )}
      </div>

      {/* Bannière succès nouvelle carte */}
      {newCarte && (
        <div className="mx-4 mt-4 max-w-lg mx-auto">
          <div className="bg-emerald-50 border border-emerald-200 rounded-2xl px-4 py-3 flex items-center gap-3">
            <span className="text-xl flex-shrink-0">🎉</span>
            <div className="flex-1 min-w-0">
              <p className="text-[12px] font-semibold text-emerald-800">Carte fidélité créée pour {newCarte.prenom}</p>
              <a href={`/carte/${newCarte.uid}`} target="_blank" rel="noopener noreferrer"
                className="text-[11px] text-emerald-600 hover:underline">
                Voir la carte & QR code →
              </a>
            </div>
            <button onClick={() => setNewCarte(null)}
              className="text-emerald-400 hover:text-emerald-700 text-lg leading-none flex-shrink-0">×</button>
          </div>
        </div>
      )}

      {/* ── VUE JOUR ── */}
      {viewMode === 'jour' && (
        <div className="p-4 max-w-lg mx-auto flex flex-col gap-3">
          {!loading && dayReservations.length > 0 && (
            <div className="grid grid-cols-3 gap-2">
              {[
                { label: 'Total',      val: dayReservations.length, color: '#2C2A25' },
                { label: 'Confirmés',  val: dayReservations.filter(r => r.statut === 'confirme').length, color: '#059669' },
                { label: 'En attente', val: dayReservations.filter(r => r.statut === 'en_attente').length, color: '#BA7517' },
              ].map(s => (
                <div key={s.label} className="bg-white rounded-xl p-3 text-center border border-[#E8E0CE]">
                  <p className="text-[20px] font-medium leading-none" style={{ color: s.color, fontFamily: 'var(--font-cormorant)' }}>{s.val}</p>
                  <p className="text-[9px] text-[#8A8275] uppercase tracking-wide mt-1">{s.label}</p>
                </div>
              ))}
            </div>
          )}
          {loading ? <Spinner /> : dayReservations.length === 0 ? (
            <EmptyDay date={selectedDate} onNew={() => { setForm(f => ({ ...f, date: selectedDate })); setShowForm(true) }} />
          ) : (
            <div className="flex flex-col gap-2">
              {dayReservations.map(r => <ReservationCard key={r.id} r={r} />)}
            </div>
          )}
        </div>
      )}

      {/* ── VUE SEMAINE ── */}
      {viewMode === 'semaine' && (
        <div className="p-4 max-w-lg mx-auto flex flex-col gap-4">
          {loading ? <Spinner /> : (
            weekDays.map(({ date, dateStr, reservations: dayResos }) => {
              const isToday = dateStr === today
              const label = date.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })
              return (
                <div key={dateStr}>
                  <button onClick={() => { setSelectedDate(dateStr); setViewMode('jour') }}
                    className="w-full flex items-center gap-2 mb-2 text-left">
                    <span className={`text-[12px] font-semibold capitalize ${isToday ? 'text-[#BA7517]' : 'text-[#2C2A25]'}`}>{label}</span>
                    {dayResos.length > 0 && (
                      <span className="text-[9px] bg-[#BA7517]/15 text-[#BA7517] rounded-full px-2 py-0.5 font-medium">{dayResos.length} rdv</span>
                    )}
                    <div className="flex-1 h-px bg-[#C4B89E]/40 ml-2" />
                  </button>
                  {dayResos.length === 0 ? (
                    <div className="bg-white/60 border border-dashed border-[#C4B89E] rounded-2xl p-4 text-center">
                      <p className="text-[11px] text-[#8A8275]">Aucune réservation</p>
                      <button onClick={() => { setForm(f => ({ ...f, date: dateStr })); setShowForm(true) }}
                        className="mt-1 text-[10px] text-[#BA7517] hover:underline">+ Ajouter</button>
                    </div>
                  ) : (
                    <div className="flex flex-col gap-2">
                      {dayResos.map(r => <ReservationCard key={r.id} r={r} />)}
                    </div>
                  )}
                </div>
              )
            })
          )}
        </div>
      )}

      {/* ── VUE MOIS ── */}
      {viewMode === 'mois' && (
        <div className="p-4 max-w-lg mx-auto flex flex-col gap-4">
          <div className="bg-[#2C2A25] rounded-2xl overflow-hidden">
            <div className="grid grid-cols-7 border-b border-[#3A3830]">
              {JOURS_COURT.map(j => (
                <div key={j} className="py-2 text-center text-[9px] text-[#8A8275] uppercase tracking-wider">{j}</div>
              ))}
            </div>
            <div className="grid grid-cols-7">
              {monthCells.map((cell, idx) => {
                if (!cell.day || !cell.dateStr) {
                  return <div key={idx} className="aspect-square border-b border-r border-[#3A3830]/40 last:border-r-0" />
                }
                const isToday = cell.dateStr === today
                const isSelected = cell.dateStr === selectedDate
                const hasResos = cell.count > 0
                return (
                  <button key={idx} onClick={() => setSelectedDate(cell.dateStr!)}
                    className={`aspect-square flex flex-col items-center justify-center border-b border-r border-[#3A3830]/40 transition-all hover:bg-[#3A3830]/60 active:bg-[#BA7517]/20 ${isSelected ? 'bg-[#BA7517]/20' : isToday ? 'bg-[#3A3830]' : ''}`}>
                    <span className={`text-[12px] font-semibold ${isToday ? 'text-[#BA7517]' : isSelected ? 'text-[#F7F4EE]' : 'text-[#F7F4EE]/70'}`}>
                      {cell.day}
                    </span>
                    {hasResos ? (
                      <div className="flex gap-0.5 mt-1 justify-center items-center">
                        {Array.from({ length: Math.min(cell.count, 3) }).map((_, i) => (
                          <span key={i} className="w-1 h-1 rounded-full bg-[#BA7517]" />
                        ))}
                        {cell.count > 3 && <span className="text-[7px] text-[#BA7517] leading-none ml-0.5">+</span>}
                      </div>
                    ) : (
                      <div className="mt-1 h-1" />
                    )}
                  </button>
                )
              })}
            </div>
          </div>

          <div className="flex items-center justify-between px-1">
            <p className="text-[10px] text-[#8A8275]">
              {allReservations.length} réservation{allReservations.length > 1 ? 's' : ''} ce mois · tapez sur un jour pour le voir
            </p>
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-[#BA7517]" />
              <span className="text-[9px] text-[#8A8275]">Réservation</span>
            </div>
          </div>

          {loading ? <Spinner /> : (
            <div>
              <p className="text-xs font-semibold text-[#2C2A25] mb-2 capitalize">
                {new Date(selectedDate + 'T12:00:00').toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}
                {monthSelectedReservations.length > 0 && (
                  <span className="ml-2 text-[9px] bg-[#BA7517]/15 text-[#BA7517] rounded-full px-2 py-0.5 font-medium">{monthSelectedReservations.length} rdv</span>
                )}
              </p>
              {monthSelectedReservations.length === 0 ? (
                <EmptyDay date={selectedDate} onNew={() => { setForm(f => ({ ...f, date: selectedDate })); setShowForm(true) }} />
              ) : (
                <div className="flex flex-col gap-2">
                  {monthSelectedReservations.map(r => <ReservationCard key={r.id} r={r} />)}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* ── MODAL NOUVELLE RÉSERVATION ── */}
      {showForm && (
        <div className="fixed inset-0 bg-black/55 z-50 flex items-end sm:items-center justify-center backdrop-blur-[2px]"
          onClick={e => { if (e.target === e.currentTarget) setShowForm(false) }}>
          <div className="bg-[#F7F4EE] rounded-t-[28px] sm:rounded-[28px] w-full max-w-[460px] max-h-[92vh] sm:max-h-[calc(100vh-48px)] flex flex-col overflow-hidden shadow-[0_-12px_40px_rgba(0,0,0,0.25)] sm:shadow-[0_24px_60px_rgba(0,0,0,0.35)]"
            onClick={e => e.stopPropagation()}>

            {/* Header */}
            <div className="bg-[#2C2A25] px-6 pt-5 pb-5 relative flex-shrink-0">
              <div className="absolute top-2 left-1/2 -translate-x-1/2 w-10 h-1 rounded-full bg-[#5C564B]/60 sm:hidden" />
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <p className="text-[10px] tracking-[0.18em] uppercase text-[#BA7517] font-medium mb-1">Agenda</p>
                  <h2 className="text-[19px] font-medium text-[#F7F4EE] leading-tight">Nouvelle réservation</h2>
                  <p className="text-[11px] text-[#8A8275] mt-0.5">Quelques informations et c'est en route.</p>
                </div>
                <button onClick={() => setShowForm(false)}
                  className="w-9 h-9 rounded-full bg-[#3A3830] text-[#C4B89E] hover:text-[#F7F4EE] hover:bg-[#46443B] transition-colors flex items-center justify-center flex-shrink-0">
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"><path d="M2 2L12 12M12 2L2 12"/></svg>
                </button>
              </div>
            </div>

            {/* Body scrollable */}
            <div className="flex-1 overflow-y-auto px-5 pt-5 pb-4 flex flex-col gap-5">

              {/* Client */}
              <section>
                <SectionLabel>Client</SectionLabel>
                <div className="bg-white rounded-[20px] p-4 flex flex-col gap-3 shadow-[0_1px_0_rgba(44,42,37,0.04),0_4px_16px_-8px_rgba(44,42,37,0.08)]">
                  <div className="flex gap-1 p-1 bg-[#EDE6D6] rounded-xl">
                    {([{ id: 'existing', label: 'Client existant' }, { id: 'new', label: 'Nouveau client' }] as const).map(m => (
                      <button key={m.id} onClick={() => setForm(f => ({ ...f, clientMode: m.id, clientId: '', nomClient: '', telClient: '' }))}
                        className={`flex-1 py-2 rounded-lg text-[11px] font-medium transition-all ${
                          form.clientMode === m.id
                            ? 'bg-white text-[#2C2A25] shadow-[0_1px_3px_rgba(44,42,37,0.08)]'
                            : 'text-[#8A8275] hover:text-[#2C2A25]'
                        }`}>
                        {m.label}
                      </button>
                    ))}
                  </div>

                  {form.clientMode === 'existing' ? (
                    <div className="relative">
                      {selectedClient ? (
                        <div className="flex items-center justify-between bg-[#F7F4EE] border border-[#E8E0CE] rounded-xl px-3.5 py-2.5">
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="w-8 h-8 rounded-full bg-[#BA7517]/15 text-[#BA7517] text-[12px] font-medium flex items-center justify-center flex-shrink-0">
                              {initiales(selectedClient.prenom, selectedClient.nom)}
                            </div>
                            <div className="min-w-0">
                              <p className="text-[13px] font-medium text-[#2C2A25] truncate leading-tight">{selectedClient.prenom} {selectedClient.nom}</p>
                              <p className="text-[10px] text-[#8A8275] truncate leading-tight mt-0.5">{selectedClient.telephone}</p>
                            </div>
                          </div>
                          <button onClick={() => { setForm(f => ({ ...f, clientId: '' })); setClientSearch('') }}
                            className="text-[10px] text-[#BA7517] hover:underline flex-shrink-0">Changer</button>
                        </div>
                      ) : (
                        <div className="relative">
                          <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#B0A898]" width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.6"><circle cx="6" cy="6" r="4.5"/><path d="M12.5 12.5L9.5 9.5"/></svg>
                          <input value={clientSearch} onChange={e => setClientSearch(e.target.value)}
                            placeholder="Rechercher par nom ou téléphone…"
                            className="w-full bg-[#F7F4EE] border border-[#E8E0CE] rounded-xl pl-9 pr-3.5 py-2.5 text-[13px] text-[#2C2A25] outline-none focus:border-[#BA7517] focus:bg-white transition-colors placeholder:text-[#B0A898]" />
                          {filteredClients.length > 0 && (
                            <div className="absolute top-full left-0 right-0 mt-1.5 bg-white border border-[#E8E0CE] rounded-xl shadow-[0_8px_24px_rgba(44,42,37,0.12)] overflow-hidden z-20">
                              {filteredClients.map(c => (
                                <button key={c.id} onClick={() => { setForm(f => ({ ...f, clientId: c.id })); setClientSearch('') }}
                                  className="w-full px-3.5 py-2.5 text-left hover:bg-[#F7F4EE] border-b border-[#F0EADB] last:border-0 flex items-center gap-3 transition-colors">
                                  <div className="w-7 h-7 rounded-full bg-[#BA7517]/15 text-[#BA7517] text-[10px] font-medium flex items-center justify-center flex-shrink-0">
                                    {initiales(c.prenom, c.nom)}
                                  </div>
                                  <div className="min-w-0 flex-1">
                                    <p className="text-[12.5px] font-medium text-[#2C2A25] truncate leading-tight">{c.prenom} {c.nom}</p>
                                    <p className="text-[10px] text-[#8A8275] leading-tight mt-0.5">{c.telephone}</p>
                                  </div>
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="flex flex-col gap-2">
                      <div className="grid grid-cols-2 gap-2">
                        <input value={form.prenomClient} onChange={e => setForm(f => ({ ...f, prenomClient: e.target.value }))}
                          placeholder="Prénom *"
                          className="w-full bg-[#F7F4EE] border border-[#E8E0CE] rounded-xl px-3.5 py-2.5 text-[13px] text-[#2C2A25] outline-none focus:border-[#BA7517] focus:bg-white transition-colors placeholder:text-[#B0A898]" />
                        <input value={form.nomClient} onChange={e => setForm(f => ({ ...f, nomClient: e.target.value }))}
                          placeholder="Nom *"
                          className="w-full bg-[#F7F4EE] border border-[#E8E0CE] rounded-xl px-3.5 py-2.5 text-[13px] text-[#2C2A25] outline-none focus:border-[#BA7517] focus:bg-white transition-colors placeholder:text-[#B0A898]" />
                      </div>
                      <input value={form.telClient} onChange={e => setForm(f => ({ ...f, telClient: e.target.value }))}
                        placeholder="Téléphone" type="tel"
                        className="w-full bg-[#F7F4EE] border border-[#E8E0CE] rounded-xl px-3.5 py-2.5 text-[13px] text-[#2C2A25] outline-none focus:border-[#BA7517] focus:bg-white transition-colors placeholder:text-[#B0A898]" />
                      <div className="flex flex-col gap-1">
                        <label className="text-[10px] text-[#8A8275] uppercase tracking-wider">Date de naissance</label>
                        <input value={form.dateNaissance} onChange={e => setForm(f => ({ ...f, dateNaissance: e.target.value }))}
                          type="date"
                          className="w-full bg-[#F7F4EE] border border-[#E8E0CE] rounded-xl px-3.5 py-2.5 text-[13px] text-[#2C2A25] outline-none focus:border-[#BA7517] focus:bg-white transition-colors" />
                      </div>
                      <p className="text-[10px] text-[#8A8275] flex items-center gap-1.5 mt-0.5">
                        <svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"><circle cx="5" cy="5" r="4"/><path d="M5 3v2.5M5 7v.01"/></svg>
                        Ce client sera ajouté à votre liste.
                      </p>
                    </div>
                  )}
                </div>
              </section>

              {/* Service */}
              <section>
                <SectionLabel required>Service</SectionLabel>
                <div className="bg-white rounded-[20px] p-2 shadow-[0_1px_0_rgba(44,42,37,0.04),0_4px_16px_-8px_rgba(44,42,37,0.08)]">
                  {services.length === 0 ? (
                    <p className="text-xs text-[#8A8275] text-center py-6">Aucun service actif — ajoutez des soins dans Catalogue</p>
                  ) : (
                    <div className="flex flex-col">
                      {services.map((s, i) => {
                        const selected = form.serviceId === s.id
                        return (
                          <button key={s.id} onClick={() => setForm(f => ({ ...f, serviceId: s.id }))}
                            className={`flex items-center gap-3 px-3 py-3 rounded-xl text-left transition-all ${
                              selected ? 'bg-[#BA7517]/8' : 'hover:bg-[#F7F4EE]'
                            } ${i > 0 ? 'border-t border-[#F2EBDB]' : ''}`}>
                            <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-base flex-shrink-0 transition-colors ${selected ? 'bg-[#BA7517]/15' : 'bg-[#F2EBDB]'}`}>
                              {s.emoji}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-[13px] font-medium text-[#2C2A25] truncate leading-tight">{s.nom}</p>
                              <p className="text-[10.5px] text-[#8A8275] leading-tight mt-0.5">
                                {s.prix.toLocaleString('fr-FR')} DA{s.duree_minutes ? ` · ${s.duree_minutes} min` : ''}
                              </p>
                            </div>
                            <div className={`w-5 h-5 rounded-full flex items-center justify-center transition-all flex-shrink-0 ${selected ? 'bg-[#BA7517] text-white' : 'border border-[#D9D0B8]'}`}>
                              {selected && <svg width="9" height="9" viewBox="0 0 9 9" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1.5 4.5L3.5 6.5L7.5 2.5"/></svg>}
                            </div>
                          </button>
                        )
                      })}
                    </div>
                  )}
                </div>
              </section>

              {/* Quand */}
              <section>
                <SectionLabel required>Quand</SectionLabel>
                <div className="bg-white rounded-[20px] p-4 flex flex-col gap-3 shadow-[0_1px_0_rgba(44,42,37,0.04),0_4px_16px_-8px_rgba(44,42,37,0.08)]">
                  <div className="grid grid-cols-2 gap-2.5">
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[10px] text-[#8A8275] uppercase tracking-wider">Date</label>
                      <input type="date" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))}
                        className="w-full bg-[#F7F4EE] border border-[#E8E0CE] rounded-xl px-3 py-2.5 text-[13px] text-[#2C2A25] outline-none focus:border-[#BA7517] focus:bg-white transition-colors" />
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[10px] text-[#8A8275] uppercase tracking-wider">Heure</label>
                      <input type="time" value={form.heure} onChange={e => setForm(f => ({ ...f, heure: e.target.value }))}
                        className="w-full bg-[#F7F4EE] border border-[#E8E0CE] rounded-xl px-3 py-2.5 text-[13px] text-[#2C2A25] outline-none focus:border-[#BA7517] focus:bg-white transition-colors" />
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {HEURES_SUGGESTIONS.map(h => (
                      <button key={h} onClick={() => setForm(f => ({ ...f, heure: h }))}
                        className={`px-2.5 py-1 rounded-lg text-[10.5px] font-medium transition-all border ${
                          form.heure === h
                            ? 'bg-[#2C2A25] text-[#F7F4EE] border-[#2C2A25]'
                            : 'bg-[#F7F4EE] text-[#6B6560] border-[#E8E0CE] hover:border-[#BA7517]/40 hover:text-[#2C2A25]'
                        }`}>
                        {h}
                      </button>
                    ))}
                  </div>
                  {selectedService?.duree_minutes && (
                    <div className="flex items-center gap-2 text-[10.5px] text-[#8A8275] bg-[#F7F4EE] rounded-lg px-3 py-2">
                      <svg width="11" height="11" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"><circle cx="6" cy="6" r="4.5"/><path d="M6 3.5V6L7.5 7"/></svg>
                      Durée : <span className="text-[#2C2A25] font-medium">{selectedService.duree_minutes} min</span>
                      <span className="text-[#D9D0B8]">·</span>
                      Fin vers <span className="text-[#2C2A25] font-medium">{computeEndTime(form.heure, selectedService.duree_minutes)}</span>
                    </div>
                  )}
                </div>
              </section>

              {/* Détails */}
              <section>
                <SectionLabel>Détails <span className="text-[#B0A898] font-normal normal-case tracking-normal text-[10px] ml-1">optionnel</span></SectionLabel>
                <div className="bg-white rounded-[20px] p-4 flex flex-col gap-3 shadow-[0_1px_0_rgba(44,42,37,0.04),0_4px_16px_-8px_rgba(44,42,37,0.08)]">
                  {employes.length > 0 && (
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[10px] text-[#8A8275] uppercase tracking-wider">Praticien</label>
                      <div className="flex gap-1.5 flex-wrap">
                        <button onClick={() => setForm(f => ({ ...f, employeId: '' }))}
                          className={`px-3 py-1.5 rounded-lg text-[11px] transition-all border ${
                            !form.employeId ? 'bg-[#2C2A25] text-[#F7F4EE] border-[#2C2A25]' : 'bg-[#F7F4EE] text-[#6B6560] border-[#E8E0CE] hover:border-[#BA7517]/40'
                          }`}>
                          Non assigné
                        </button>
                        {employes.map(e => (
                          <button key={e.id} onClick={() => setForm(f => ({ ...f, employeId: e.id }))}
                            className={`px-3 py-1.5 rounded-lg text-[11px] transition-all border flex items-center gap-1.5 ${
                              form.employeId === e.id ? 'bg-[#2C2A25] text-[#F7F4EE] border-[#2C2A25]' : 'bg-[#F7F4EE] text-[#6B6560] border-[#E8E0CE] hover:border-[#BA7517]/40'
                            }`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${form.employeId === e.id ? 'bg-[#BA7517]' : 'bg-[#C4B89E]'}`} />
                            {e.prenom} {e.nom}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] text-[#8A8275] uppercase tracking-wider">Notes</label>
                    <textarea value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
                      placeholder="Allergies, préférences, demandes spéciales…"
                      rows={2}
                      className="w-full bg-[#F7F4EE] border border-[#E8E0CE] rounded-xl px-3.5 py-2.5 text-[13px] text-[#2C2A25] outline-none focus:border-[#BA7517] focus:bg-white transition-colors placeholder:text-[#B0A898] resize-none" />
                  </div>
                </div>
              </section>

              {erreur && (
                <div className="bg-rose-50 border border-rose-200 text-rose-700 text-[11.5px] rounded-xl px-3.5 py-2.5 flex items-center gap-2">
                  <svg width="13" height="13" viewBox="0 0 13 13" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><circle cx="6.5" cy="6.5" r="5"/><path d="M6.5 4v3M6.5 9v.01"/></svg>
                  {erreur}
                </div>
              )}
            </div>

            {/* Footer sticky */}
            <div className="flex-shrink-0 px-5 pt-3 pb-5 bg-[#F7F4EE] border-t border-[#E8E0CE]/60 relative">
              <div className="absolute -top-6 left-0 right-0 h-6 bg-gradient-to-t from-[#F7F4EE] to-transparent pointer-events-none" />
              <div className="flex items-center gap-3">
                {selectedService && (
                  <div className="flex flex-col leading-tight">
                    <span className="text-[9.5px] uppercase tracking-wider text-[#8A8275]">Total</span>
                    <span className="text-[16px] font-medium text-[#2C2A25]">
                      {selectedService.prix.toLocaleString('fr-FR')} <span className="text-[11px] text-[#8A8275]">DA</span>
                    </span>
                  </div>
                )}
                <button onClick={handleSave} disabled={saving}
                  className="flex-1 py-3 rounded-xl bg-[#BA7517] text-white text-[13px] font-medium hover:bg-[#A36714] transition-colors disabled:opacity-60 flex items-center justify-center gap-2 shadow-[0_4px_14px_-4px_rgba(186,117,23,0.5)]">
                  {saving ? (
                    <>
                      <svg className="animate-spin" width="14" height="14" viewBox="0 0 14 14" fill="none"><circle cx="7" cy="7" r="5.5" stroke="currentColor" strokeOpacity="0.3" strokeWidth="1.6"/><path d="M12.5 7A5.5 5.5 0 0 0 7 1.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/></svg>
                      Enregistrement…
                    </>
                  ) : (
                    <>
                      Confirmer la réservation
                      <svg width="13" height="13" viewBox="0 0 13 13" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M2.5 6.5h8M7 3l3.5 3.5L7 10"/></svg>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
