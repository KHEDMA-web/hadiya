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

function isoDate(d: Date) { return d.toISOString().slice(0, 10) }
function toTimeLocal(iso: string) { return new Date(iso).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }) }
function addDays(d: Date, n: number) { const r = new Date(d); r.setDate(r.getDate() + n); return r }

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

const emptyForm = {
  clientMode: 'existing' as 'existing' | 'new',
  clientId: '',
  nomClient: '',
  telClient: '',
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
        supabase.from('employes').select('id, prenom, nom').eq('salon_id', sid).eq('actif', true).order('prenom'),
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
    if (form.clientMode === 'new' && !form.nomClient.trim()) { setErreur('Saisissez le nom du client'); return }
    if (!form.serviceId) { setErreur('Sélectionnez un service'); return }
    if (!form.date || !form.heure) { setErreur('Choisissez une date et une heure'); return }

    setSaving(true)
    setErreur('')

    let clientId = form.clientId

    if (form.clientMode === 'new') {
      const parts = form.nomClient.trim().split(' ')
      const prenom = parts[0]
      const nom = parts.slice(1).join(' ') || '-'
      const { data: newClient, error: clientError } = await supabase
        .from('clients')
        .insert({ salon_id: salonId, prenom, nom, telephone: form.telClient || null, points: 0, niveau: 'bronze' })
        .select('id')
        .single()
      if (clientError) { setErreur(clientError.message); setSaving(false); return }
      clientId = newClient.id
      setClients(prev => [...prev, { id: newClient.id, prenom, nom, telephone: form.telClient || '' }].sort((a, b) => a.prenom.localeCompare(b.prenom)))
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
  const firstWeekday = (monthStart.getDay() + 6) % 7 // Mon=0
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
      <div className="bg-white border border-[#C4B89E] rounded-2xl p-4 shadow-sm flex flex-col gap-3">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <div className="flex flex-col items-center bg-[#F7F4EE] rounded-xl px-3 py-2 flex-shrink-0 border border-[#E8E2D5]">
              <span className="text-sm font-bold text-[#BA7517]">{toTimeLocal(r.date_heure)}</span>
              <span className="text-[9px] text-[#8A8275]">{r.duree_minutes} min</span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-[#2C2A25] truncate">{clientNom}</p>
              {tel && <p className="text-[10px] text-[#8A8275]">{tel}</p>}
              {r.menu_items && <p className="text-xs text-[#BA7517] mt-0.5">{r.menu_items.emoji} {r.menu_items.nom}</p>}
              {r.employes && <p className="text-[10px] text-[#8A8275]">avec {r.employes.prenom} {r.employes.nom}</p>}
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
    <div className="bg-white/60 border border-dashed border-[#C4B89E] rounded-2xl p-6 text-center">
      <p className="text-xs text-[#8A8275]">Aucune réservation</p>
      <button onClick={onNew} className="mt-2 text-[10px] text-[#BA7517] hover:underline">+ Ajouter</button>
    </div>
  )

  const Spinner = () => (
    <div className="flex justify-center py-12">
      <div className="w-6 h-6 rounded-full border-2 border-[#C4B89E] border-t-[#BA7517] animate-spin" />
    </div>
  )

  return (
    <div className="min-h-screen bg-[#E8E2D5]">
      {/* Header */}
      <div className="bg-[#2C2A25] px-6 py-4 flex items-center gap-4 shadow-lg">
        <BackButton href="/dashboard" />
        <div className="flex-1">
          <h1 className="text-base font-medium text-[#F7F4EE]">Réservations</h1>
          <p className="text-[10px] text-[#BA7517]">Agenda du salon</p>
        </div>
        <button
          onClick={() => { setShowForm(true); setErreur('') }}
          className="flex items-center gap-2 bg-[#BA7517] text-white rounded-xl px-4 py-2 text-xs font-medium hover:bg-[#A36714] transition-colors"
        >
          + Nouvelle
        </button>
      </div>

      {/* View mode tabs */}
      <div className="bg-[#2C2A25] px-4 pb-3 flex gap-1">
        {(['jour', 'semaine', 'mois'] as const).map(v => (
          <button key={v} onClick={() => setViewMode(v)}
            className={`flex-1 py-1.5 rounded-xl text-[10px] font-medium capitalize transition-colors ${viewMode === v ? 'bg-[#BA7517] text-white' : 'text-[#8A8275] hover:text-[#F7F4EE]'}`}>
            {v === 'jour' ? 'Jour' : v === 'semaine' ? 'Semaine' : 'Mois'}
          </button>
        ))}
      </div>

      {/* ── VUE JOUR ── */}
      {viewMode === 'jour' && (
        <>
          {/* Mini calendrier */}
          <div className="bg-[#2C2A25] px-4 pb-4">
            <div className="flex items-center justify-between mb-3">
              <button onClick={() => setWeekOffset(w => w - 1)} className="w-7 h-7 rounded-lg bg-[#3A3830] text-[#8A8275] hover:text-[#F7F4EE] text-sm flex items-center justify-center">‹</button>
              <span className="text-[10px] text-[#8A8275] tracking-widest uppercase">
                {getWeekStart(weekOffset).toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })}
              </span>
              <button onClick={() => setWeekOffset(w => w + 1)} className="w-7 h-7 rounded-lg bg-[#3A3830] text-[#8A8275] hover:text-[#F7F4EE] text-sm flex items-center justify-center">›</button>
            </div>
            <div className="grid grid-cols-7 gap-1">
              {Array.from({ length: 7 }, (_, i) => {
                const d = addDays(getWeekStart(weekOffset), i)
                const ds = isoDate(d)
                const isSelected = ds === selectedDate
                const isToday = ds === today
                return (
                  <button key={i} onClick={() => setSelectedDate(ds)}
                    className={`flex flex-col items-center py-2 rounded-xl transition-all ${isSelected ? 'bg-[#BA7517] shadow-[0_2px_8px_rgba(186,117,23,0.4)]' : isToday ? 'bg-[#3A3830] border border-[#BA7517]/40' : 'hover:bg-[#3A3830]'}`}>
                    <span className={`text-[9px] uppercase tracking-wide ${isSelected ? 'text-white/70' : 'text-[#8A8275]'}`}>{JOURS_COURT[i]}</span>
                    <span className={`text-sm font-semibold mt-0.5 ${isSelected ? 'text-white' : isToday ? 'text-[#BA7517]' : 'text-[#F7F4EE]/70'}`}>{d.getDate()}</span>
                  </button>
                )
              })}
            </div>
          </div>

          <div className="p-4 max-w-lg mx-auto flex flex-col gap-3">
            {/* Stats */}
            {!loading && dayReservations.length > 0 && (
              <div className="grid grid-cols-3 gap-2">
                {[
                  { label: 'Total', val: dayReservations.length, color: '#F7F4EE' },
                  { label: 'Confirmés', val: dayReservations.filter(r => r.statut === 'confirme').length, color: '#059669' },
                  { label: 'En attente', val: dayReservations.filter(r => r.statut === 'en_attente').length, color: '#BA7517' },
                ].map(s => (
                  <div key={s.label} className="bg-[#2C2A25] rounded-xl p-3 text-center border border-[#3A3830]">
                    <p className="text-xl font-semibold" style={{ color: s.color }}>{s.val}</p>
                    <p className="text-[9px] text-[#8A8275] uppercase tracking-wide mt-0.5">{s.label}</p>
                  </div>
                ))}
              </div>
            )}
            {loading ? <Spinner /> : dayReservations.length === 0 ? (
              <div className="bg-white border border-[#C4B89E] rounded-2xl p-10 text-center shadow-sm">
                <p className="text-3xl mb-3 opacity-30">📅</p>
                <p className="text-sm font-medium text-[#2C2A25]">Aucune réservation</p>
                <p className="text-xs text-[#8A8275] mt-1">{selectedDate === today ? "Pas de réservation aujourd'hui" : new Date(selectedDate + 'T12:00:00').toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}</p>
                <button onClick={() => { setForm(f => ({ ...f, date: selectedDate })); setShowForm(true) }}
                  className="mt-4 px-4 py-2 rounded-xl bg-[#BA7517] text-white text-xs font-medium hover:bg-[#A36714] transition-colors">
                  Créer une réservation
                </button>
              </div>
            ) : (
              <div className="flex flex-col gap-2">
                {dayReservations.map(r => <ReservationCard key={r.id} r={r} />)}
              </div>
            )}
          </div>
        </>
      )}

      {/* ── VUE SEMAINE ── */}
      {viewMode === 'semaine' && (
        <>
          <div className="bg-[#2C2A25] px-4 pb-4 flex items-center justify-between">
            <button onClick={() => setWeekOffset(w => w - 1)} className="w-8 h-8 rounded-xl bg-[#3A3830] text-[#8A8275] hover:text-[#F7F4EE] flex items-center justify-center">‹</button>
            <span className="text-[10px] text-[#8A8275] tracking-wide">{weekLabel}</span>
            <button onClick={() => setWeekOffset(w => w + 1)} className="w-8 h-8 rounded-xl bg-[#3A3830] text-[#8A8275] hover:text-[#F7F4EE] flex items-center justify-center">›</button>
          </div>

          {/* Bandeau jours + compteurs */}
          <div className="bg-[#2C2A25] px-4 pb-3">
            <div className="grid grid-cols-7 gap-1">
              {weekDays.map(({ date, dateStr, reservations: dayResos }) => {
                const isToday = dateStr === today
                const hasResos = dayResos.length > 0
                return (
                  <button key={dateStr} onClick={() => { setSelectedDate(dateStr); setViewMode('jour') }}
                    className={`flex flex-col items-center py-2 rounded-xl transition-all hover:bg-[#3A3830] ${isToday ? 'bg-[#3A3830] border border-[#BA7517]/40' : ''}`}>
                    <span className="text-[9px] text-[#8A8275] uppercase">{JOURS_COURT[(date.getDay() + 6) % 7]}</span>
                    <span className={`text-sm font-semibold mt-0.5 ${isToday ? 'text-[#BA7517]' : 'text-[#F7F4EE]/70'}`}>{date.getDate()}</span>
                    {hasResos ? (
                      <span className="mt-1 text-[9px] font-bold text-[#BA7517] bg-[#BA7517]/20 rounded-full w-4 h-4 flex items-center justify-center">{dayResos.length}</span>
                    ) : (
                      <span className="mt-1 w-1 h-1 rounded-full bg-[#3A3830]" />
                    )}
                  </button>
                )
              })}
            </div>
          </div>

          <div className="p-4 max-w-lg mx-auto flex flex-col gap-4">
            {loading ? <Spinner /> : (
              weekDays.map(({ date, dateStr, reservations: dayResos }) => {
                const isToday = dateStr === today
                const label = date.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })
                return (
                  <div key={dateStr}>
                    <div className="flex items-center gap-2 mb-2">
                      <span className={`text-xs font-semibold capitalize ${isToday ? 'text-[#BA7517]' : 'text-[#2C2A25]'}`}>{label}</span>
                      {dayResos.length > 0 && (
                        <span className="text-[9px] bg-[#BA7517]/15 text-[#BA7517] rounded-full px-2 py-0.5 font-medium">{dayResos.length} rdv</span>
                      )}
                    </div>
                    {dayResos.length === 0 ? (
                      <EmptyDay date={dateStr} onNew={() => { setForm(f => ({ ...f, date: dateStr })); setShowForm(true) }} />
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
        </>
      )}

      {/* ── VUE MOIS ── */}
      {viewMode === 'mois' && (
        <>
          <div className="bg-[#2C2A25] px-4 pb-4 flex items-center justify-between">
            <button onClick={() => setMonthOffset(m => m - 1)} className="w-8 h-8 rounded-xl bg-[#3A3830] text-[#8A8275] hover:text-[#F7F4EE] flex items-center justify-center">‹</button>
            <span className="text-xs text-[#F7F4EE] font-medium">{MOIS_NOMS[mMonth]} {mYear}</span>
            <button onClick={() => setMonthOffset(m => m + 1)} className="w-8 h-8 rounded-xl bg-[#3A3830] text-[#8A8275] hover:text-[#F7F4EE] flex items-center justify-center">›</button>
          </div>

          <div className="p-4 max-w-lg mx-auto flex flex-col gap-4">
            {/* Grille calendrier */}
            <div className="bg-[#2C2A25] rounded-2xl overflow-hidden">
              {/* En-têtes jours */}
              <div className="grid grid-cols-7 border-b border-[#3A3830]">
                {JOURS_COURT.map(j => (
                  <div key={j} className="py-2 text-center text-[9px] text-[#8A8275] uppercase tracking-wider">{j}</div>
                ))}
              </div>
              {/* Cellules */}
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
                      className={`aspect-square flex flex-col items-center justify-center border-b border-r border-[#3A3830]/40 transition-all hover:bg-[#3A3830]/60 ${isSelected ? 'bg-[#BA7517]/20 border-[#BA7517]/30' : ''}`}>
                      <span className={`text-xs font-semibold ${isToday ? 'text-[#BA7517]' : isSelected ? 'text-[#F7F4EE]' : 'text-[#F7F4EE]/60'}`}>
                        {cell.day}
                      </span>
                      {hasResos ? (
                        <div className="flex gap-0.5 mt-0.5 flex-wrap justify-center max-w-[20px]">
                          {Array.from({ length: Math.min(cell.count, 3) }).map((_, i) => (
                            <span key={i} className="w-1 h-1 rounded-full bg-[#BA7517]" />
                          ))}
                          {cell.count > 3 && <span className="text-[7px] text-[#BA7517] leading-none">+</span>}
                        </div>
                      ) : (
                        <div className="mt-0.5 h-1" />
                      )}
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Légende + résumé mois */}
            <div className="flex items-center justify-between px-1">
              <p className="text-[10px] text-[#8A8275]">
                {allReservations.length} réservation{allReservations.length > 1 ? 's' : ''} ce mois
              </p>
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-[#BA7517]" />
                <span className="text-[9px] text-[#8A8275]">Réservation</span>
              </div>
            </div>

            {/* Réservations du jour sélectionné */}
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
        </>
      )}

      {/* ── MODAL NOUVELLE RÉSERVATION ── */}
      {showForm && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
          onClick={e => { if (e.target === e.currentTarget) setShowForm(false) }}>
          <div className="bg-[#F7F4EE] rounded-t-3xl sm:rounded-3xl w-full max-w-lg max-h-[92vh] overflow-y-auto">
            <div className="sticky top-0 bg-[#2C2A25] px-6 py-4 rounded-t-3xl sm:rounded-t-3xl flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-[#F7F4EE]">Nouvelle réservation</p>
                <p className="text-[10px] text-[#BA7517]">Remplissez les informations</p>
              </div>
              <button onClick={() => setShowForm(false)} className="w-8 h-8 rounded-xl bg-[#3A3830] text-[#8A8275] hover:text-[#F7F4EE] transition-colors text-lg flex items-center justify-center">×</button>
            </div>

            <div className="p-5 flex flex-col gap-4">
              {/* Client */}
              <div className="bg-white border border-[#C4B89E] rounded-2xl p-4 flex flex-col gap-3">
                <p className="text-[10px] font-semibold text-[#2C2A25] uppercase tracking-wider">Client</p>
                <div className="flex gap-2">
                  {(['existing', 'new'] as const).map(m => (
                    <button key={m} onClick={() => setForm(f => ({ ...f, clientMode: m, clientId: '', nomClient: '', telClient: '' }))}
                      className={`flex-1 py-2 rounded-xl text-[10px] font-medium transition-colors ${form.clientMode === m ? 'bg-[#2C2A25] text-[#F7F4EE]' : 'bg-[#F7F4EE] text-[#8A8275] border border-[#C4B89E]'}`}>
                      {m === 'existing' ? 'Client existant' : 'Nouveau client'}
                    </button>
                  ))}
                </div>

                {form.clientMode === 'existing' ? (
                  <div className="relative">
                    <input
                      value={form.clientId ? (clients.find(c => c.id === form.clientId) ? `${clients.find(c => c.id === form.clientId)!.prenom} ${clients.find(c => c.id === form.clientId)!.nom}` : '') : clientSearch}
                      onChange={e => { setClientSearch(e.target.value); setForm(f => ({ ...f, clientId: '' })) }}
                      placeholder="Rechercher un client..."
                      className="w-full border border-[#C4B89E] rounded-xl px-4 py-2.5 text-sm text-[#2C2A25] outline-none focus:border-[#BA7517] bg-[#F7F4EE] placeholder:text-[#B0A898]"
                    />
                    {filteredClients.length > 0 && !form.clientId && (
                      <div className="absolute top-full left-0 right-0 bg-white border border-[#C4B89E] rounded-xl mt-1 shadow-lg z-10 overflow-hidden">
                        {filteredClients.map(c => (
                          <button key={c.id} onClick={() => { setForm(f => ({ ...f, clientId: c.id })); setClientSearch('') }}
                            className="w-full px-4 py-2.5 text-left text-sm text-[#2C2A25] hover:bg-[#F7F4EE] border-b border-[#EDE8DE] last:border-0 transition-colors">
                            <span className="font-medium">{c.prenom} {c.nom}</span>
                            <span className="text-[10px] text-[#8A8275] ml-2">{c.telephone}</span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="flex flex-col gap-2">
                    <input value={form.nomClient} onChange={e => setForm(f => ({ ...f, nomClient: e.target.value }))}
                      placeholder="Nom complet *"
                      className="w-full border border-[#C4B89E] rounded-xl px-4 py-2.5 text-sm text-[#2C2A25] outline-none focus:border-[#BA7517] bg-[#F7F4EE] placeholder:text-[#B0A898]" />
                    <input value={form.telClient} onChange={e => setForm(f => ({ ...f, telClient: e.target.value }))}
                      placeholder="Téléphone" type="tel"
                      className="w-full border border-[#C4B89E] rounded-xl px-4 py-2.5 text-sm text-[#2C2A25] outline-none focus:border-[#BA7517] bg-[#F7F4EE] placeholder:text-[#B0A898]" />
                    <p className="text-[10px] text-[#8A8275]">Ce client sera ajouté à votre liste clients.</p>
                  </div>
                )}
              </div>

              {/* Service */}
              <div className="bg-white border border-[#C4B89E] rounded-2xl p-4 flex flex-col gap-3">
                <p className="text-[10px] font-semibold text-[#2C2A25] uppercase tracking-wider">Service *</p>
                <div className="flex flex-col gap-1.5 max-h-48 overflow-y-auto">
                  {services.map(s => (
                    <button key={s.id} onClick={() => setForm(f => ({ ...f, serviceId: s.id }))}
                      className={`flex items-center gap-3 p-3 rounded-xl text-left transition-all border ${form.serviceId === s.id ? 'bg-[#BA7517]/10 border-[#BA7517]/40' : 'border-[#E8E2D5] hover:border-[#BA7517]/30'}`}>
                      <span className="text-lg">{s.emoji}</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-[#2C2A25] truncate">{s.nom}</p>
                        <p className="text-[10px] text-[#8A8275]">{s.prix.toLocaleString('fr-FR')} DA{s.duree_minutes ? ` · ${s.duree_minutes} min` : ''}</p>
                      </div>
                      {form.serviceId === s.id && <span className="text-[#BA7517] text-sm flex-shrink-0">✓</span>}
                    </button>
                  ))}
                  {services.length === 0 && <p className="text-xs text-[#8A8275] text-center py-2">Aucun service actif — ajoutez des soins dans Produits & services</p>}
                </div>
              </div>

              {/* Date & Heure */}
              <div className="bg-white border border-[#C4B89E] rounded-2xl p-4 flex flex-col gap-3">
                <p className="text-[10px] font-semibold text-[#2C2A25] uppercase tracking-wider">Date & Heure *</p>
                <div className="grid grid-cols-2 gap-3">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] text-[#8A8275]">Date</label>
                    <input type="date" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))}
                      className="w-full border border-[#C4B89E] rounded-xl px-3 py-2.5 text-sm text-[#2C2A25] outline-none focus:border-[#BA7517] bg-[#F7F4EE]" />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] text-[#8A8275]">Heure</label>
                    <input type="time" value={form.heure} onChange={e => setForm(f => ({ ...f, heure: e.target.value }))}
                      className="w-full border border-[#C4B89E] rounded-xl px-3 py-2.5 text-sm text-[#2C2A25] outline-none focus:border-[#BA7517] bg-[#F7F4EE]" />
                  </div>
                </div>
              </div>

              {/* Employé & Notes */}
              <div className="bg-white border border-[#C4B89E] rounded-2xl p-4 flex flex-col gap-3">
                <p className="text-[10px] font-semibold text-[#2C2A25] uppercase tracking-wider">Détails</p>
                {employes.length > 0 && (
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] text-[#8A8275]">Praticien (optionnel)</label>
                    <select value={form.employeId} onChange={e => setForm(f => ({ ...f, employeId: e.target.value }))}
                      className="w-full border border-[#C4B89E] rounded-xl px-4 py-2.5 text-sm text-[#2C2A25] outline-none focus:border-[#BA7517] bg-[#F7F4EE]">
                      <option value="">Non assigné</option>
                      {employes.map(e => <option key={e.id} value={e.id}>{e.prenom} {e.nom}</option>)}
                    </select>
                  </div>
                )}
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] text-[#8A8275]">Notes (optionnel)</label>
                  <textarea value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
                    placeholder="Allergies, préférences, demandes spéciales..."
                    rows={2}
                    className="w-full border border-[#C4B89E] rounded-xl px-4 py-2.5 text-sm text-[#2C2A25] outline-none focus:border-[#BA7517] bg-[#F7F4EE] placeholder:text-[#B0A898] resize-none" />
                </div>
              </div>

              {erreur && <p className="text-xs text-rose-500 text-center">{erreur}</p>}

              <button onClick={handleSave} disabled={saving}
                className="w-full py-3.5 rounded-2xl bg-[#BA7517] text-white text-sm font-medium hover:bg-[#A36714] transition-colors disabled:opacity-50">
                {saving ? 'Enregistrement...' : 'Créer la réservation'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
