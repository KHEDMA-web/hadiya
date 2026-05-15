'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import BackButton from '../_components/BackButton'
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell,
} from 'recharts'

// ── Types ──────────────────────────────────────────────────────────────────
type Periode = 'jour' | '7j' | '30j' | '3m' | 'tout'
interface ChartPoint { label: string; current: number; previous: number }
interface ClientStat { nom: string; total: number; nb: number; niveau: string }
interface ProduitStat { nom: string; qty: number; ca: number; benefice: number }
interface StockAlert { nom: string; stock_actuel: number; stock_minimum: number; valeur: number }
interface Kpi {
  caTotal: number; caFiltered: number; caMois: number; caSemaine: number
  ticketMoyen: number; clientsActifsMois: number; soldeCirculation: number
  pointsMois: number; nbDebitsMois: number
}

// ── Constants ──────────────────────────────────────────────────────────────
const NIVEAU_COLORS: Record<string, string> = {
  Bronze: '#C4813A', Argent: '#8A8275', Or: '#BA7517', Platine: '#7C6FAE',
}
const NIVEAU_BADGE: Record<string, string> = {
  Bronze:  'bg-[#C4813A]/10 text-[#C4813A] border-[#C4813A]/25',
  Argent:  'bg-[#8A8275]/10 text-[#8A8275] border-[#8A8275]/25',
  Or:      'bg-[#BA7517]/10 text-[#BA7517] border-[#BA7517]/25',
  Platine: 'bg-[#7C6FAE]/10 text-[#7C6FAE] border-[#7C6FAE]/25',
}
const PERIODES: { id: Periode; label: string }[] = [
  { id: 'jour', label: "Aujourd'hui" },
  { id: '7j',   label: '7 jours' },
  { id: '30j',  label: '30 jours' },
  { id: '3m',   label: '3 mois' },
  { id: 'tout', label: 'Tout' },
]

// ── Helpers ────────────────────────────────────────────────────────────────
function getStart(p: Periode): string | null {
  const now = new Date()
  if (p === 'jour') return new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString()
  if (p === '7j')   return new Date(now.getTime() - 7  * 86400000).toISOString()
  if (p === '30j')  return new Date(now.getTime() - 30 * 86400000).toISOString()
  if (p === '3m')   return new Date(now.getTime() - 90 * 86400000).toISOString()
  return null
}

function buildChart(tx: any[], p: Periode): ChartPoint[] {
  const now = new Date()

  if (p === 'tout') {
    return Array.from({ length: 12 }, (_, i) => {
      const idx = 11 - i
      const iso     = new Date(now.getFullYear(), now.getMonth() - idx,      1).toISOString().slice(0, 7)
      const prevIso = new Date(now.getFullYear(), now.getMonth() - idx - 12, 1).toISOString().slice(0, 7)
      const d       = new Date(now.getFullYear(), now.getMonth() - idx, 1)
      return {
        label:    d.toLocaleDateString('fr-FR', { month: 'short' }),
        current:  tx.filter(t => t.type === 'debit' && t.created_at?.slice(0, 7) === iso   ).reduce((s, t) => s + (t.montant || 0), 0),
        previous: tx.filter(t => t.type === 'debit' && t.created_at?.slice(0, 7) === prevIso).reduce((s, t) => s + (t.montant || 0), 0),
      }
    })
  }

  if (p === '3m') {
    return Array.from({ length: 12 }, (_, i) => {
      const idx  = 12 - i
      const ws   = new Date(now.getTime() - idx       * 7 * 86400000).toISOString()
      const we   = new Date(now.getTime() - (idx - 1) * 7 * 86400000).toISOString()
      const pws  = new Date(now.getTime() - (idx + 12) * 7 * 86400000).toISOString()
      const pwe  = new Date(now.getTime() - (idx + 11) * 7 * 86400000).toISOString()
      const d    = new Date(now.getTime() - idx * 7 * 86400000)
      return {
        label:    d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' }),
        current:  tx.filter(t => t.type === 'debit' && t.created_at >= ws  && t.created_at < we ).reduce((s, t) => s + (t.montant || 0), 0),
        previous: tx.filter(t => t.type === 'debit' && t.created_at >= pws && t.created_at < pwe).reduce((s, t) => s + (t.montant || 0), 0),
      }
    })
  }

  const numDays = p === 'jour' ? 7 : p === '7j' ? 7 : 30
  return Array.from({ length: numDays }, (_, i) => {
    const idx     = numDays - 1 - i
    const d       = new Date(now.getTime() - idx           * 86400000)
    const prevD   = new Date(now.getTime() - (idx + numDays) * 86400000)
    const iso     = d.toISOString().slice(0, 10)
    const prevIso = prevD.toISOString().slice(0, 10)
    return {
      label:    numDays <= 7
        ? d.toLocaleDateString('fr-FR', { weekday: 'short' })
        : d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' }),
      current:  tx.filter(t => t.type === 'debit' && t.created_at?.slice(0, 10) === iso    ).reduce((s, t) => s + (t.montant || 0), 0),
      previous: tx.filter(t => t.type === 'debit' && t.created_at?.slice(0, 10) === prevIso).reduce((s, t) => s + (t.montant || 0), 0),
    }
  })
}

// ── Sub-components ─────────────────────────────────────────────────────────
function Skeleton({ className = '' }: { className?: string }) {
  return <div className={`animate-pulse bg-[#E0D9CE] rounded-xl ${className}`} />
}

function SectionCard({ title, children, right }: { title: string; children: React.ReactNode; right?: React.ReactNode }) {
  return (
    <div className="bg-white border border-[#E8E0D4] rounded-2xl p-5 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="w-[3px] h-[18px] bg-[#BA7517] rounded-full" />
          <p className="text-[11px] font-semibold text-[#2C2A25] uppercase tracking-[0.12em]">{title}</p>
        </div>
        {right}
      </div>
      {children}
    </div>
  )
}

function KpiCard({ label, value, unit = 'DA', sub, dark = false, gold = false }: {
  label: string; value: number | string; unit?: string; sub?: string; dark?: boolean; gold?: boolean
}) {
  return (
    <div className={`rounded-2xl p-4 border flex flex-col gap-1 ${
      dark ? 'bg-[#2C2A25] border-[#3A3830]' :
      gold ? 'bg-[#BA7517]/[0.06] border-[#BA7517]/20' :
             'bg-white border-[#E8E0D4]'
    }`}>
      <p className="text-[8px] tracking-[0.22em] uppercase text-[#8A8275] font-medium">{label}</p>
      <p className={`text-[1.6rem] font-light leading-none mt-0.5 ${dark || gold ? 'text-[#BA7517]' : 'text-[#2C2A25]'}`}>
        {typeof value === 'number' ? value.toLocaleString('fr-FR') : value}
        {unit && <span className="text-[10px] font-normal text-[#8A8275] ml-1">{unit}</span>}
      </p>
      {sub && <p className="text-[9px] text-[#8A8275]">{sub}</p>}
    </div>
  )
}

const ChartTip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-[#2C2A25] border border-[#3A3830] rounded-xl px-3 py-2 shadow-xl">
      <p className="text-[9px] text-[#8A8275] mb-1">{label}</p>
      {payload.map((e: any) => (
        <p key={e.dataKey} style={{ color: e.color }} className="text-[11px] font-medium">
          {e.name}: {(e.value || 0).toLocaleString('fr-FR')} DA
        </p>
      ))}
    </div>
  )
}

const DonutTip = ({ active, payload }: any) => {
  if (!active || !payload?.length) return null
  const d = payload[0]
  return (
    <div className="bg-[#2C2A25] border border-[#3A3830] rounded-xl px-3 py-2 shadow-xl">
      <p style={{ color: d.payload.color }} className="text-[11px] font-medium">{d.name}</p>
      <p className="text-[10px] text-[#8A8275]">{d.value} · {(d.payload.montant || 0).toLocaleString('fr-FR')} DA</p>
    </div>
  )
}

function initials(nom: string) {
  return nom.split(' ').map(n => n[0] || '').join('').slice(0, 2).toUpperCase()
}

// ── Page ───────────────────────────────────────────────────────────────────
export default function Statistiques() {
  const router = useRouter()
  const [periode, setPeriode] = useState<Periode>('30j')
  const [loading, setLoading]  = useState(true)

  const [kpi, setKpi] = useState<Kpi>({
    caTotal: 0, caFiltered: 0, caMois: 0, caSemaine: 0,
    ticketMoyen: 0, clientsActifsMois: 0, soldeCirculation: 0, pointsMois: 0, nbDebitsMois: 0,
  })
  const [niveaux, setNiveaux]               = useState<Record<string, number>>({ Bronze: 0, Argent: 0, Or: 0, Platine: 0 })
  const [chartData, setChartData]           = useState<ChartPoint[]>([])
  const [donutTx, setDonutTx]               = useState<{ name: string; value: number; montant: number; color: string }[]>([])
  const [topMontant, setTopMontant]         = useState<ClientStat[]>([])
  const [topVisites, setTopVisites]         = useState<ClientStat[]>([])
  const [clientsArisque, setClientsArisque] = useState<{ nom: string; niveau: string; jours: number }[]>([])
  const [nouveauxClients, setNouveauxClients] = useState({ ceMois: 0, moisPrec: 0 })
  const [topProduits, setTopProduits]       = useState<ProduitStat[]>([])
  const [stockAlerts, setStockAlerts]       = useState<StockAlert[]>([])
  const [stockValeur, setStockValeur]       = useState(0)
  const [allTx, setAllTx]                  = useState<any[]>([])

  useEffect(() => { fetchAll() }, [periode])

  async function fetchAll() {
    setLoading(true)
    const now    = new Date()
    const depuis = getStart(periode)

    const [
      { data: txRaw },
      { data: cartes },
      { data: menuItems },
      { data: commandes },
    ] = await Promise.all([
      supabase.from('transactions').select('type, montant, points_gagnes, created_at, carte_id, cartes(niveau, clients(id, prenom, nom, created_at))'),
      supabase.from('cartes').select('id, niveau, solde, statut, clients(id, prenom, nom, created_at)'),
      supabase.from('menu_items').select('nom, stock_actuel, stock_minimum, prix, cout'),
      supabase.from('commandes').select('id, total, created_at, commande_items(quantite, prix_unitaire, menu_items(nom, cout))'),
    ])

    const tx        = txRaw || []
    const debitsAll = tx.filter(t => t.type === 'debit')
    const txF       = depuis ? tx.filter(t => t.created_at >= depuis) : tx
    const debitsF   = txF.filter(t => t.type === 'debit')
    const rechargesF = txF.filter(t => t.type === 'recharge')
    const cadeauxF  = txF.filter(t => t.type === 'cadeau')

    const debutMois     = new Date(now.getFullYear(), now.getMonth(),      1).toISOString()
    const debutMoisPrec = new Date(now.getFullYear(), now.getMonth() - 1,  1).toISOString()
    const debutSemaine  = new Date(now.getTime() - 7 * 86400000).toISOString()
    const risqueLimit   = new Date(now.getTime() - 30 * 86400000).toISOString()

    // KPIs
    const caTotal          = debitsAll.reduce((s, t) => s + (t.montant || 0), 0)
    const caFiltered       = debitsF.reduce((s, t) => s + (t.montant || 0), 0)
    const caMois           = debitsAll.filter(t => t.created_at >= debutMois).reduce((s, t) => s + (t.montant || 0), 0)
    const caSemaine        = debitsAll.filter(t => t.created_at >= debutSemaine).reduce((s, t) => s + (t.montant || 0), 0)
    const nbDebitsMois     = debitsAll.filter(t => t.created_at >= debutMois).length
    const ticketMoyen      = debitsF.length > 0 ? Math.round(caFiltered / debitsF.length) : 0
    const soldeCirculation = (cartes || []).filter(c => c.statut !== 'expiree').reduce((s, c) => s + (c.solde || 0), 0)
    const pointsMois       = tx.filter(t => t.created_at >= debutMois && t.points_gagnes).reduce((s, t) => s + ((t as any).points_gagnes || 0), 0)
    const clientsActifsMois = new Set(
      debitsAll.filter(t => t.created_at >= debutMois).map(t => (t as any).cartes?.clients?.id).filter(Boolean)
    ).size

    // Niveaux
    const niv: Record<string, number> = { Bronze: 0, Argent: 0, Or: 0, Platine: 0 }
    ;(cartes || []).forEach(c => { if (niv[c.niveau] !== undefined) niv[c.niveau]++ })

    // Donut
    const donut = [
      { name: 'Débits',    value: debitsF.length,    montant: caFiltered,                                                      color: '#F43F5E' },
      { name: 'Recharges', value: rechargesF.length,  montant: rechargesF.reduce((s, t) => s + (t.montant || 0), 0),            color: '#10B981' },
      { name: 'Cadeaux',   value: cadeauxF.length,    montant: cadeauxF.reduce((s, t) => s + (t.montant || 0), 0),              color: '#BA7517' },
    ]

    // Chart
    const chart = buildChart(tx, periode)

    // Top clients
    const cmap: Record<string, ClientStat> = {}
    debitsF.forEach(t => {
      const c = (t as any).cartes?.clients
      if (!c?.id) return
      if (!cmap[c.id]) cmap[c.id] = { nom: `${c.prenom} ${c.nom}`, total: 0, nb: 0, niveau: (t as any).cartes?.niveau || 'Bronze' }
      cmap[c.id].total += t.montant || 0
      cmap[c.id].nb++
    })
    const topM = Object.values(cmap).sort((a, b) => b.total - a.total).slice(0, 5)
    const topV = Object.values(cmap).sort((a, b) => b.nb    - a.nb   ).slice(0, 5)

    // At-risk
    const lastTx: Record<string, string> = {}
    debitsAll.forEach(t => {
      const id = (t as any).cartes?.clients?.id
      if (id && (!lastTx[id] || t.created_at > lastTx[id])) lastTx[id] = t.created_at
    })
    const arisque = (cartes || [])
      .filter(c => { const id = (c as any).clients?.id; return id && lastTx[id] && lastTx[id] < risqueLimit })
      .map(c => {
        const id   = (c as any).clients?.id
        const days = Math.floor((now.getTime() - new Date(lastTx[id]).getTime()) / 86400000)
        return { nom: `${(c as any).clients?.prenom} ${(c as any).clients?.nom}`, niveau: c.niveau || 'Bronze', jours: days }
      })
      .sort((a, b) => b.jours - a.jours)
      .slice(0, 5)

    // Nouveaux clients
    const allC       = (cartes || []).filter(c => (c as any).clients?.id)
    const nouvMois   = allC.filter(c => (c as any).clients?.created_at >= debutMois).length
    const nouvPrec   = allC.filter(c => (c as any).clients?.created_at >= debutMoisPrec && (c as any).clients?.created_at < debutMois).length

    // Produits POS
    const pmap: Record<string, ProduitStat> = {}
    ;(commandes || []).forEach(cmd => {
      if (depuis && (cmd.created_at || '') < depuis) return
      ;(cmd.commande_items || []).forEach((item: any) => {
        const nom   = item.menu_items?.nom || 'Inconnu'
        const cout  = item.menu_items?.cout || 0
        const qty   = item.quantite || 1
        const ca    = (item.prix_unitaire || 0) * qty
        if (!pmap[nom]) pmap[nom] = { nom, qty: 0, ca: 0, benefice: 0 }
        pmap[nom].qty      += qty
        pmap[nom].ca       += ca
        pmap[nom].benefice += cout > 0 ? ca - cout * qty : 0
      })
    })
    const topP = Object.values(pmap).sort((a, b) => b.ca - a.ca).slice(0, 5)

    // Stock
    const alerts: StockAlert[] = (menuItems || [])
      .filter(m => m.stock_actuel !== null && m.stock_minimum !== null && (m.stock_actuel || 0) <= (m.stock_minimum || 0))
      .map(m => ({ nom: m.nom, stock_actuel: m.stock_actuel || 0, stock_minimum: m.stock_minimum || 0, valeur: (m.stock_actuel || 0) * (m.prix || 0) }))
    const valStock = (menuItems || []).reduce((s, m) => s + (m.stock_actuel || 0) * (m.prix || 0), 0)

    // Commit
    setKpi({ caTotal, caFiltered, caMois, caSemaine, ticketMoyen, clientsActifsMois, soldeCirculation, pointsMois, nbDebitsMois })
    setNiveaux(niv)
    setDonutTx(donut)
    setChartData(chart)
    setTopMontant(topM)
    setTopVisites(topV)
    setClientsArisque(arisque)
    setNouveauxClients({ ceMois: nouvMois, moisPrec: nouvPrec })
    setTopProduits(topP)
    setStockAlerts(alerts)
    setStockValeur(valStock)
    setAllTx(txF)
    setLoading(false)
  }

  const exportCSV = () => {
    const headers = ['Date', 'Heure', 'Type', 'Montant (DA)', 'Points gagnés', 'Client', 'Niveau']
    const rows = allTx.map(t => {
      const d = new Date(t.created_at)
      const client = (t as any).cartes?.clients
      return [
        d.toLocaleDateString('fr-FR'),
        d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
        t.type,
        t.montant || 0,
        (t as any).points_gagnes || 0,
        client ? `${client.prenom} ${client.nom}` : '',
        (t as any).cartes?.niveau || '',
      ]
    })
    const csv = [headers, ...rows].map(r => r.map(v => `"${v}"`).join(',')).join('\n')
    const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `hadiya-${periode}-${new Date().toISOString().slice(0, 10)}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  const periodeLabel = periode === 'jour' ? "aujourd'hui" : periode === '7j' ? '7 j' : periode === '30j' ? '30 j' : periode === '3m' ? '3 mois' : 'tout'

  // ── Render ──────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-[#F7F4EE]">

      {/* Header */}
      <div className="bg-[#2C2A25] px-5 pt-4 pb-0 shadow-lg">
        <div className="flex items-center gap-3 mb-4">
          <BackButton href="/dashboard" />
          <div className="flex-1">
            <h1 className="text-base font-medium text-[#F7F4EE]">Statistiques</h1>
            <p className="text-[10px] text-[#BA7517] tracking-wider">Performance & analytiques</p>
          </div>
          <button onClick={exportCSV} disabled={allTx.length === 0}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-[10px] font-medium transition-all bg-[#3A3830] text-[#8A8275] hover:text-[#F7F4EE] disabled:opacity-30 flex-shrink-0">
            ↓ CSV
          </button>
        </div>
        <div className="flex gap-2 overflow-x-auto pb-4" style={{ scrollbarWidth: 'none' }}>
          {PERIODES.map(p => (
            <button key={p.id} onClick={() => setPeriode(p.id)}
              className={`px-4 py-2 rounded-xl text-[11px] font-medium transition-all whitespace-nowrap flex-shrink-0 ${
                periode === p.id
                  ? 'bg-[#BA7517] text-white shadow-[0_2px_8px_rgba(186,117,23,0.4)]'
                  : 'bg-[#3A3830] text-[#8A8275] hover:text-[#F7F4EE]'
              }`}>{p.label}</button>
          ))}
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-5 flex flex-col gap-5">

        {loading ? (
          <div className="flex flex-col gap-4">
            <div className="grid grid-cols-2 gap-3">{Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-24" />)}</div>
            <Skeleton className="h-52" />
            <div className="grid grid-cols-2 gap-3"><Skeleton className="h-44" /><Skeleton className="h-44" /></div>
            <Skeleton className="h-48" /><Skeleton className="h-56" /><Skeleton className="h-44" /><Skeleton className="h-36" />
          </div>
        ) : (<>

          {/* ── 1. KPIs ─────────────────────────────────────────────── */}
          <div>
            <p className="text-[8px] tracking-[0.3em] uppercase text-[#8A8275] font-semibold mb-3">Indicateurs clés</p>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              <KpiCard label="CA total" value={kpi.caTotal} dark />
              <KpiCard label={`CA ${periodeLabel}`} value={kpi.caFiltered} gold />
              <KpiCard label="CA ce mois" value={kpi.caMois} />
              <KpiCard label="CA cette semaine" value={kpi.caSemaine} />
              <KpiCard label="Ticket moyen" value={kpi.ticketMoyen} sub={`sur la période filtrée`} />
              <KpiCard label="Clients actifs / mois" value={kpi.clientsActifsMois} unit="" sub={`${kpi.nbDebitsMois} débits ce mois`} />
            </div>
            <div className="mt-3 grid grid-cols-1 gap-3">
              <KpiCard label="Solde en circulation" value={kpi.soldeCirculation} dark />
            </div>
          </div>

          {/* ── 2. Graphique CA ─────────────────────────────────────── */}
          <SectionCard title="Évolution du CA" right={
            <div className="flex items-center gap-3 text-[9px] text-[#8A8275]">
              <span><span className="inline-block w-2 h-[2px] bg-[#BA7517] mr-1 align-middle" />Période</span>
              <span><span className="inline-block w-2 h-[2px] bg-[#C4B89E] mr-1 align-middle" />Précédente</span>
            </div>
          }>
            <div className="h-52">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData} margin={{ top: 4, right: 4, left: -30, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#F0EBE3" vertical={false} />
                  <XAxis dataKey="label" tick={{ fontSize: 9, fill: '#8A8275' }} axisLine={false} tickLine={false} interval="preserveStartEnd" />
                  <YAxis tick={{ fontSize: 9, fill: '#8A8275' }} axisLine={false} tickLine={false}
                    tickFormatter={v => v >= 1000 ? `${Math.round(v / 1000)}k` : `${v}`} />
                  <Tooltip content={<ChartTip />} />
                  <Line type="monotone" dataKey="current"  name="Période"     stroke="#BA7517" strokeWidth={2}   dot={false} activeDot={{ r: 4, fill: '#BA7517' }} />
                  <Line type="monotone" dataKey="previous" name="Précédente"  stroke="#C4B89E" strokeWidth={1.5} dot={false} strokeDasharray="4 3" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </SectionCard>

          {/* ── 3. Répartition transactions ──────────────────────────── */}
          <SectionCard title="Répartition des transactions">
            <div className="flex flex-col md:flex-row items-center gap-5">
              <div className="h-36 w-36 flex-shrink-0">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={donutTx} cx="50%" cy="50%" innerRadius={36} outerRadius={62}
                      dataKey="value" strokeWidth={3} stroke="#fff">
                      {donutTx.map((e, i) => <Cell key={i} fill={e.color} />)}
                    </Pie>
                    <Tooltip content={<DonutTip />} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="flex-1 w-full flex flex-col gap-2.5">
                {donutTx.map(d => (
                  <div key={d.name} className="flex items-center gap-3">
                    <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: d.color }} />
                    <span className="text-xs text-[#2C2A25] flex-1">{d.name}</span>
                    <span className="text-xs font-semibold text-[#2C2A25] w-7 text-right">{d.value}</span>
                    <span className="text-[10px] text-[#8A8275] w-28 text-right">{d.montant.toLocaleString('fr-FR')} DA</span>
                  </div>
                ))}
                <div className="pt-2 mt-1 border-t border-[#F0EBE3] flex justify-between">
                  <span className="text-[10px] text-[#8A8275]">Total</span>
                  <span className="text-[10px] font-semibold text-[#2C2A25]">{donutTx.reduce((s, d) => s + d.value, 0)} transactions</span>
                </div>
              </div>
            </div>
          </SectionCard>

          {/* ── 4. Produits & bénéfices ──────────────────────────────── */}
          <SectionCard title="Produits & bénéfices">
            {topProduits.length === 0 ? (
              <p className="text-[11px] text-[#8A8275] text-center py-4 opacity-60">Aucune commande POS sur cette période</p>
            ) : (<>
              {/* Star produit */}
              <div className="bg-[#BA7517]/[0.06] border border-[#BA7517]/20 rounded-xl p-3 flex items-center gap-3 mb-4">
                <div className="w-9 h-9 rounded-xl bg-[#BA7517]/15 flex items-center justify-center text-[#BA7517] font-bold flex-shrink-0">✦</div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-[#2C2A25] truncate">{topProduits[0].nom}</p>
                  <p className="text-[9px] text-[#8A8275]">Produit le plus rentable</p>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="text-xs font-semibold text-[#BA7517]">{topProduits[0].ca.toLocaleString('fr-FR')} DA</p>
                  {topProduits[0].benefice > 0 && (
                    <p className="text-[9px] text-emerald-600">+{topProduits[0].benefice.toLocaleString('fr-FR')} bén.</p>
                  )}
                </div>
              </div>
              <div className="flex flex-col gap-3">
                {topProduits.map((p, i) => (
                  <div key={p.nom} className="flex items-center gap-3">
                    <span className="text-[10px] font-bold text-[#BA7517] w-4 flex-shrink-0 text-center">#{i + 1}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-[#2C2A25] truncate">{p.nom}</p>
                      <div className="mt-1 h-1 bg-[#F0EBE3] rounded-full overflow-hidden">
                        <div className="h-full bg-[#BA7517] rounded-full transition-all duration-500"
                          style={{ width: `${Math.round((p.qty / (topProduits[0]?.qty || 1)) * 100)}%` }} />
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="text-[10px] font-semibold text-[#2C2A25]">×{p.qty} · {p.ca.toLocaleString('fr-FR')} DA</p>
                      {p.benefice > 0 && <p className="text-[9px] text-emerald-600">bén. {p.benefice.toLocaleString('fr-FR')} DA</p>}
                    </div>
                  </div>
                ))}
              </div>
            </>)}
          </SectionCard>

          {/* ── 5. Analyse clients ───────────────────────────────────── */}
          <SectionCard title="Analyse clients">
            {/* Nouveaux */}
            <div className="grid grid-cols-2 gap-3 mb-5">
              <div className="bg-[#F7F4EE] rounded-xl p-3 border border-[#E8E0D4]">
                <p className="text-[8px] uppercase tracking-widest text-[#8A8275] mb-1">Nouveaux ce mois</p>
                <p className="text-2xl font-light text-[#2C2A25]">{nouveauxClients.ceMois}</p>
                <p className="text-[9px] text-[#8A8275] mt-0.5">{nouveauxClients.moisPrec} le mois dernier</p>
              </div>
              <div className="bg-[#F7F4EE] rounded-xl p-3 border border-[#E8E0D4]">
                <p className="text-[8px] uppercase tracking-widest text-[#8A8275] mb-1">Actifs ce mois</p>
                <p className="text-2xl font-light text-[#2C2A25]">{kpi.clientsActifsMois}</p>
                <p className="text-[9px] text-[#8A8275] mt-0.5">avec au moins 1 débit</p>
              </div>
            </div>

            {/* Top par dépenses */}
            <p className="text-[9px] tracking-[0.15em] uppercase text-[#8A8275] font-medium mb-2">Top 5 par dépenses</p>
            <div className="flex flex-col gap-2 mb-5">
              {topMontant.length === 0 && <p className="text-[11px] text-[#8A8275] py-2 text-center opacity-60">Aucune donnée</p>}
              {topMontant.map((c, i) => (
                <div key={c.nom + i} className="flex items-center gap-2.5">
                  <span className="text-[10px] font-bold text-[#BA7517] w-4 flex-shrink-0 text-center">#{i + 1}</span>
                  <div className={`w-7 h-7 rounded-lg flex items-center justify-center text-[10px] font-bold flex-shrink-0 border ${NIVEAU_BADGE[c.niveau] || NIVEAU_BADGE.Bronze}`}>
                    {initials(c.nom)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-[#2C2A25] truncate">{c.nom}</p>
                    <p className="text-[9px] text-[#8A8275]">{c.nb} visite{c.nb > 1 ? 's' : ''}</p>
                  </div>
                  <p className="text-xs font-semibold text-[#2C2A25] flex-shrink-0">
                    {c.total.toLocaleString('fr-FR')} <span className="text-[9px] font-normal text-[#8A8275]">DA</span>
                  </p>
                </div>
              ))}
            </div>

            {/* Top par visites */}
            <p className="text-[9px] tracking-[0.15em] uppercase text-[#8A8275] font-medium mb-2">Top 5 par fréquence</p>
            <div className="flex flex-col gap-2 mb-5">
              {topVisites.length === 0 && <p className="text-[11px] text-[#8A8275] py-2 text-center opacity-60">Aucune donnée</p>}
              {topVisites.map((c, i) => (
                <div key={c.nom + i + 'v'} className="flex items-center gap-2.5">
                  <span className="text-[10px] font-bold text-[#BA7517] w-4 flex-shrink-0 text-center">#{i + 1}</span>
                  <div className={`w-7 h-7 rounded-lg flex items-center justify-center text-[10px] font-bold flex-shrink-0 border ${NIVEAU_BADGE[c.niveau] || NIVEAU_BADGE.Bronze}`}>
                    {initials(c.nom)}
                  </div>
                  <p className="flex-1 text-xs font-medium text-[#2C2A25] truncate">{c.nom}</p>
                  <p className="text-xs font-semibold text-[#2C2A25] flex-shrink-0">
                    {c.nb} <span className="text-[9px] font-normal text-[#8A8275]">visites</span>
                  </p>
                </div>
              ))}
            </div>

            {/* À risque */}
            {clientsArisque.length > 0 && (<>
              <p className="text-[9px] tracking-[0.15em] uppercase text-rose-400 font-medium mb-2">Clients à risque · inactifs +30j</p>
              <div className="flex flex-col gap-2">
                {clientsArisque.map((c, i) => (
                  <div key={c.nom + i} className="flex items-center gap-2.5 p-2.5 rounded-xl bg-rose-50 border border-rose-100">
                    <div className={`w-7 h-7 rounded-lg flex items-center justify-center text-[10px] font-bold flex-shrink-0 border ${NIVEAU_BADGE[c.niveau] || NIVEAU_BADGE.Bronze}`}>
                      {initials(c.nom)}
                    </div>
                    <p className="flex-1 text-xs font-medium text-[#2C2A25] truncate">{c.nom}</p>
                    <span className="text-[10px] font-semibold text-rose-500 flex-shrink-0">{c.jours}j sans visite</span>
                  </div>
                ))}
              </div>
            </>)}
          </SectionCard>

          {/* ── 6. Fidélité & niveaux ────────────────────────────────── */}
          <SectionCard title="Fidélité & niveaux" right={
            <span className="text-[10px] text-[#8A8275]">{kpi.pointsMois.toLocaleString('fr-FR')} pts ce mois</span>
          }>
            <div className="flex flex-col md:flex-row items-center gap-4">
              <div className="h-40 w-40 flex-shrink-0">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={Object.entries(niveaux).map(([name, value]) => ({ name, value, color: NIVEAU_COLORS[name] }))}
                      cx="50%" cy="50%" innerRadius={34} outerRadius={62}
                      dataKey="value" strokeWidth={3} stroke="#fff"
                    >
                      {Object.entries(niveaux).map(([name], i) => <Cell key={i} fill={NIVEAU_COLORS[name]} />)}
                    </Pie>
                    <Tooltip formatter={(v: any, name: any) => [`${v} cartes`, name]} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="flex-1 flex flex-col gap-2.5 w-full">
                {Object.entries(niveaux).map(([nv, count]) => {
                  const total = Object.values(niveaux).reduce((s, v) => s + v, 0) || 1
                  return (
                    <div key={nv} className="flex flex-col gap-1">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full" style={{ background: NIVEAU_COLORS[nv] }} />
                          <span className="text-xs text-[#2C2A25]">{nv}</span>
                        </div>
                        <span className="text-xs font-semibold text-[#2C2A25]">{count}</span>
                      </div>
                      <div className="h-1 bg-[#F0EBE3] rounded-full overflow-hidden">
                        <div className="h-full rounded-full transition-all duration-500"
                          style={{ width: `${Math.round((count / total) * 100)}%`, background: NIVEAU_COLORS[nv] }} />
                      </div>
                    </div>
                  )
                })}
                <div className="pt-2 mt-1 border-t border-[#F0EBE3]">
                  <p className="text-[8px] uppercase tracking-widest text-[#8A8275]">Points distribués ce mois</p>
                  <p className="text-xl font-light text-[#BA7517] mt-0.5">
                    {kpi.pointsMois.toLocaleString('fr-FR')} <span className="text-[10px] text-[#8A8275]">pts</span>
                  </p>
                </div>
              </div>
            </div>
          </SectionCard>

          {/* ── 7. Stock & alertes ───────────────────────────────────── */}
          <SectionCard title="Stock & alertes" right={
            <span className="text-[9px] text-[#8A8275]">Valeur stock: {stockValeur.toLocaleString('fr-FR')} DA</span>
          }>
            {stockAlerts.length === 0 ? (
              <div className="flex items-center gap-2 py-1">
                <div className="w-6 h-6 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600 text-xs flex-shrink-0">✓</div>
                <p className="text-[11px] text-[#8A8275]">Tous les stocks sont suffisants</p>
              </div>
            ) : (
              <div className="flex flex-col gap-2">
                {stockAlerts.map((s, i) => (
                  <div key={s.nom + i} className={`flex items-center gap-3 p-2.5 rounded-xl border ${
                    s.stock_actuel === 0 ? 'bg-rose-50 border-rose-200' : 'bg-amber-50 border-amber-200'
                  }`}>
                    <div className={`w-8 h-8 rounded-xl flex items-center justify-center text-sm font-bold flex-shrink-0 ${
                      s.stock_actuel === 0 ? 'bg-rose-100 text-rose-600' : 'bg-amber-100 text-amber-600'
                    }`}>
                      {s.stock_actuel === 0 ? '!' : '↓'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-[#2C2A25] truncate">{s.nom}</p>
                      <p className="text-[9px] text-[#8A8275]">seuil: {s.stock_minimum} · valeur: {s.valeur.toLocaleString('fr-FR')} DA</p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className={`text-lg font-light ${s.stock_actuel === 0 ? 'text-rose-600' : 'text-amber-600'}`}>{s.stock_actuel}</p>
                      <p className="text-[9px] text-[#8A8275]">en stock</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </SectionCard>

        </>)}
      </div>
    </div>
  )
}
