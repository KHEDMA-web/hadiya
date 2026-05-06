'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

type Periode = 'jour' | 'semaine' | 'mois' | 'tout'

const NIVEAU_STYLE: Record<string, { avatar: string; badge: string; label: string }> = {
  Bronze:  { avatar: 'bg-[#C4813A]/20 text-[#C4813A]', badge: 'bg-[#C4813A]/10 text-[#C4813A] border-[#C4813A]/20', label: 'Bronze'  },
  Argent:  { avatar: 'bg-[#8A8275]/20 text-[#8A8275]', badge: 'bg-[#8A8275]/10 text-[#8A8275] border-[#8A8275]/20', label: 'Argent'  },
  Or:      { avatar: 'bg-[#BA7517]/20 text-[#BA7517]', badge: 'bg-[#BA7517]/10 text-[#BA7517] border-[#BA7517]/20', label: 'Or'      },
  Platine: { avatar: 'bg-[#7C6FAE]/20 text-[#7C6FAE]', badge: 'bg-[#7C6FAE]/10 text-[#7C6FAE] border-[#7C6FAE]/20', label: 'Platine' },
}

function Skeleton({ className = '' }: { className?: string }) {
  return <div className={`animate-pulse bg-[#E0D9CE] rounded-xl ${className}`} />
}

function KpiCard({ label, value, unit = 'DA', sub, dark = false }: {
  label: string; value: number | string; unit?: string; sub?: string; dark?: boolean
}) {
  return (
    <div className={`rounded-2xl p-5 shadow-md border ${dark ? 'bg-[#2C2A25] border-[#3A3830]' : 'bg-white border-[#C4B89E]'}`}>
      <p className={`text-[9px] tracking-[0.2em] uppercase mb-2 ${dark ? 'text-[#8A8275]' : 'text-[#8A8275]'}`}>{label}</p>
      <p className={`text-3xl font-light leading-none ${dark ? 'text-[#BA7517]' : 'text-[#2C2A25]'}`}>
        {typeof value === 'number' ? value.toLocaleString('fr-FR') : value}
        {unit && <span className={`text-xs ml-1 font-normal ${dark ? 'text-[#8A8275]' : 'text-[#8A8275]'}`}>{unit}</span>}
      </p>
      {sub && <p className={`text-[10px] mt-1.5 ${dark ? 'text-[#5A5850]' : 'text-[#8A8275]'}`}>{sub}</p>}
    </div>
  )
}

export default function Statistiques() {
  const router = useRouter()
  const [periode, setPeriode] = useState<Periode>('mois')
  const [loading, setLoading] = useState(true)

  const [kpi, setKpi] = useState({
    caTotal: 0, caMois: 0, caSemaine: 0, caJour: 0,
    nbDebits: 0, nbRecharges: 0, nbCadeaux: 0,
    soldeCirculation: 0,
    totalRecharges: 0,
  })
  const [niveaux, setNiveaux] = useState<Record<string, number>>({ Bronze: 0, Argent: 0, Or: 0, Platine: 0 })
  const [barData, setBarData] = useState<{ date: string; label: string; montant: number }[]>([])
  const [topClients, setTopClients] = useState<{ nom: string; total: number; niveau: string; nb: number }[]>([])
  const [posStats, setPosStats] = useState({ ca: 0, nbCommandes: 0, topProduits: [] as { nom: string; qty: number; ca: number }[] })

  useEffect(() => { fetchAll() }, [periode])

  const dateDebut = (p: Periode): string | null => {
    const now = new Date()
    if (p === 'jour')    return new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString()
    if (p === 'semaine') return new Date(now.getTime() - 7  * 86400000).toISOString()
    if (p === 'mois')    return new Date(now.getTime() - 30 * 86400000).toISOString()
    return null
  }

  const fetchAll = async () => {
    setLoading(true)
    const depuis = dateDebut(periode)
    const now = new Date()

    // ── Transactions ──────────────────────────────────────────────
    let txQ = supabase.from('transactions')
      .select('type, montant, created_at, carte_id, cartes(niveau, clients(prenom, nom))')
    if (depuis) txQ = txQ.gte('created_at', depuis)
    const { data: txAll } = await txQ

    // KPI par type
    const debits    = (txAll || []).filter(t => t.type === 'debit')
    const recharges = (txAll || []).filter(t => t.type === 'recharge')
    const cadeaux   = (txAll || []).filter(t => t.type === 'cadeau')
    const caFiltré  = debits.reduce((s, t) => s + (t.montant || 0), 0)

    // CA global (all time) pour comparaison
    const { data: txTout } = await supabase.from('transactions').select('type, montant, created_at')
    const caTotal   = (txTout || []).filter(t => t.type === 'debit').reduce((s, t) => s + (t.montant || 0), 0)
    const totalRech = (txTout || []).filter(t => t.type === 'recharge').reduce((s, t) => s + (t.montant || 0), 0)

    // CA mois / semaine / jour (toujours calculés depuis txTout)
    const debutMois    = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()
    const debutSemaine = new Date(now.getTime() - 7 * 86400000).toISOString()
    const debutJour    = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString()
    const caMois    = (txTout || []).filter(t => t.type === 'debit' && t.created_at >= debutMois).reduce((s, t) => s + (t.montant || 0), 0)
    const caSemaine = (txTout || []).filter(t => t.type === 'debit' && t.created_at >= debutSemaine).reduce((s, t) => s + (t.montant || 0), 0)
    const caJour    = (txTout || []).filter(t => t.type === 'debit' && t.created_at >= debutJour).reduce((s, t) => s + (t.montant || 0), 0)

    setKpi({
      caTotal, caMois, caSemaine, caJour,
      nbDebits: debits.length,
      nbRecharges: recharges.length,
      nbCadeaux: cadeaux.length,
      soldeCirculation: 0,
      totalRecharges: totalRech,
    })

    // ── Graphique 7 derniers jours ─────────────────────────────────
    const jours: { date: string; label: string; montant: number }[] = []
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now.getTime() - i * 86400000)
      const iso = d.toISOString().slice(0, 10)
      const label = d.toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric' })
      const montant = (txTout || [])
        .filter(t => t.type === 'debit' && t.created_at?.slice(0, 10) === iso)
        .reduce((s, t) => s + (t.montant || 0), 0)
      jours.push({ date: iso, label, montant })
    }
    setBarData(jours)

    // ── Top clients ────────────────────────────────────────────────
    const clientMap: Record<string, { nom: string; total: number; niveau: string; nb: number }> = {}
    debits.forEach(t => {
      const c = (t as any).cartes?.clients
      const n = (t as any).cartes?.niveau || 'Bronze'
      if (!c) return
      const key = `${c.prenom} ${c.nom}`
      if (!clientMap[key]) clientMap[key] = { nom: key, total: 0, niveau: n, nb: 0 }
      clientMap[key].total += t.montant || 0
      clientMap[key].nb++
    })
    setTopClients(Object.values(clientMap).sort((a, b) => b.total - a.total).slice(0, 5))

    // ── Cartes par niveau + solde ──────────────────────────────────
    const { data: cartes } = await supabase.from('cartes').select('niveau, solde, statut')
    const niv: Record<string, number> = { Bronze: 0, Argent: 0, Or: 0, Platine: 0 }
    let solde = 0
    ;(cartes || []).forEach(c => {
      if (c.niveau && niv[c.niveau] !== undefined) niv[c.niveau]++
      if (c.statut !== 'expiree') solde += c.solde || 0
    })
    setNiveaux(niv)
    setKpi(prev => ({ ...prev, soldeCirculation: solde }))

    // ── Caisse POS (commandes) ─────────────────────────────────────
    let cmdQ = supabase.from('commandes').select('id, total, created_at, commande_items(quantite, prix_unitaire, menu_items(nom))')
    if (depuis) cmdQ = cmdQ.gte('created_at', depuis)
    const { data: commandes } = await cmdQ
    const caPos = (commandes || []).reduce((s, c) => s + (c.total || 0), 0)

    // Top produits
    const prodMap: Record<string, { nom: string; qty: number; ca: number }> = {}
    ;(commandes || []).forEach(cmd => {
      ;(cmd.commande_items || []).forEach((item: any) => {
        const nom = item.menu_items?.nom || 'Inconnu'
        if (!prodMap[nom]) prodMap[nom] = { nom, qty: 0, ca: 0 }
        prodMap[nom].qty += item.quantite || 1
        prodMap[nom].ca += (item.prix_unitaire || 0) * (item.quantite || 1)
      })
    })
    const topProd = Object.values(prodMap).sort((a, b) => b.qty - a.qty).slice(0, 5)
    setPosStats({ ca: caPos, nbCommandes: (commandes || []).length, topProduits: topProd })

    setLoading(false)
  }

  const barMax = Math.max(...barData.map(d => d.montant), 1)

  const PERIODES: { id: Periode; label: string }[] = [
    { id: 'jour',    label: "Aujourd'hui" },
    { id: 'semaine', label: '7 jours' },
    { id: 'mois',    label: '30 jours' },
    { id: 'tout',    label: 'Tout' },
  ]

  return (
    <div className="min-h-screen bg-[#F7F4EE]">

      {/* Header */}
      <div className="bg-[#2C2A25] px-6 py-4 flex items-center gap-4 shadow-lg">
        <button
          onClick={() => router.push('/dashboard')}
          className="w-9 h-9 rounded-full border border-[#4A4840] flex items-center justify-center text-[#F7F4EE] opacity-70 hover:opacity-100 hover:border-[#BA7517] transition-all text-sm flex-shrink-0"
        >
          ←
        </button>
        <div>
          <h1 className="text-base font-medium text-[#F7F4EE]">Statistiques</h1>
          <p className="text-xs text-[#BA7517]">Performance & chiffres</p>
        </div>
      </div>

      {/* Filtres */}
      <div className="bg-[#2C2A25] px-6 pb-4 flex gap-2">
        {PERIODES.map(p => (
          <button
            key={p.id}
            onClick={() => setPeriode(p.id)}
            className={`px-4 py-2 rounded-xl text-xs font-medium transition-all whitespace-nowrap ${
              periode === p.id
                ? 'bg-[#BA7517] text-white shadow-[0_2px_8px_rgba(186,117,23,0.3)]'
                : 'bg-[#3A3830] text-[#8A8275] hover:text-[#F7F4EE]'
            }`}
          >
            {p.label}
          </button>
        ))}
      </div>

      <div className="p-5 max-w-2xl mx-auto flex flex-col gap-5">

        {loading ? (
          <>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-24" />)}
            </div>
            <Skeleton className="h-48" />
            <div className="grid grid-cols-2 gap-3">
              <Skeleton className="h-32" />
              <Skeleton className="h-32" />
            </div>
            <Skeleton className="h-56" />
            <Skeleton className="h-40" />
          </>
        ) : (
          <>
            {/* ── KPIs CA ── */}
            <div>
              <p className="text-[9px] tracking-[0.3em] uppercase text-[#8A8275] font-medium mb-3">Chiffre d'affaires</p>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <KpiCard label="Aujourd'hui"  value={kpi.caJour}    dark />
                <KpiCard label="Cette semaine" value={kpi.caSemaine} />
                <KpiCard label="Ce mois"       value={kpi.caMois}    />
                <KpiCard label="Total"         value={kpi.caTotal}   />
              </div>
            </div>

            {/* ── Graphique 7 jours ── */}
            <div className="bg-white border border-[#C4B89E] rounded-2xl p-5 shadow-md">
              <div className="flex items-center gap-2 mb-5">
                <div className="w-1 h-5 bg-[#BA7517] rounded-full" />
                <p className="text-xs font-semibold text-[#2C2A25] uppercase tracking-wider">7 derniers jours</p>
              </div>
              <div className="flex items-end gap-2 h-32">
                {barData.map(d => (
                  <div key={d.date} className="flex-1 flex flex-col items-center gap-1.5">
                    <span className={`text-[9px] font-medium ${d.montant > 0 ? 'text-[#BA7517]' : 'text-transparent'}`}>
                      {d.montant > 0 ? (d.montant >= 1000 ? `${Math.round(d.montant / 1000)}k` : d.montant) : ''}
                    </span>
                    <div className="w-full rounded-t-lg transition-all duration-500"
                      style={{
                        height: `${Math.max((d.montant / barMax) * 88, d.montant > 0 ? 6 : 2)}px`,
                        background: d.montant > 0
                          ? 'linear-gradient(to top, #BA7517, #D4901F)'
                          : '#EDE8DE',
                      }}
                    />
                    <span className="text-[8px] text-[#8A8275] text-center leading-tight capitalize">
                      {d.label.split(' ')[0]}<br />{d.label.split(' ')[1]}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* ── Par type + solde ── */}
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-white border border-[#C4B89E] rounded-2xl p-5 shadow-md flex flex-col gap-3">
                <div className="flex items-center gap-2">
                  <div className="w-1 h-5 bg-[#BA7517] rounded-full" />
                  <p className="text-xs font-semibold text-[#2C2A25] uppercase tracking-wider">Transactions</p>
                </div>
                {[
                  { label: 'Débits',    value: kpi.nbDebits,    color: 'bg-rose-500/10 text-rose-500' },
                  { label: 'Recharges', value: kpi.nbRecharges, color: 'bg-emerald-500/10 text-emerald-600' },
                  { label: 'Cadeaux',   value: kpi.nbCadeaux,   color: 'bg-[#BA7517]/10 text-[#BA7517]' },
                ].map(r => (
                  <div key={r.label} className="flex items-center justify-between">
                    <span className="text-[11px] text-[#8A8275]">{r.label}</span>
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-lg ${r.color}`}>{r.value}</span>
                  </div>
                ))}
              </div>

              <div className="bg-[#2C2A25] border border-[#3A3830] rounded-2xl p-5 shadow-md flex flex-col justify-between">
                <div>
                  <p className="text-[9px] tracking-[0.2em] uppercase text-[#8A8275] mb-1">Solde en circulation</p>
                  <p className="text-2xl font-light text-[#BA7517] leading-none">
                    {kpi.soldeCirculation.toLocaleString('fr-FR')}
                    <span className="text-xs text-[#8A8275] ml-1">DA</span>
                  </p>
                </div>
                <div className="mt-3">
                  <p className="text-[9px] tracking-[0.2em] uppercase text-[#8A8275] mb-1">Total rechargé</p>
                  <p className="text-lg font-light text-[#F7F4EE]">
                    {kpi.totalRecharges.toLocaleString('fr-FR')}
                    <span className="text-xs text-[#8A8275] ml-1">DA</span>
                  </p>
                </div>
              </div>
            </div>

            {/* ── Cartes par niveau ── */}
            <div className="bg-white border border-[#C4B89E] rounded-2xl p-5 shadow-md">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-1 h-5 bg-[#BA7517] rounded-full" />
                <p className="text-xs font-semibold text-[#2C2A25] uppercase tracking-wider">Cartes par niveau</p>
              </div>
              <div className="grid grid-cols-4 gap-3">
                {Object.entries(niveaux).map(([nv, count]) => {
                  const s = NIVEAU_STYLE[nv] || NIVEAU_STYLE.Bronze
                  return (
                    <div key={nv} className="flex flex-col items-center gap-1.5">
                      <span className="text-2xl font-light text-[#2C2A25]">{count}</span>
                      <span className={`text-[9px] px-2 py-0.5 rounded-lg border uppercase tracking-wide font-medium ${s.badge}`}>
                        {s.label}
                      </span>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* ── Top clients ── */}
            {topClients.length > 0 && (
              <div className="bg-white border border-[#C4B89E] rounded-2xl p-5 shadow-md">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-1 h-5 bg-[#BA7517] rounded-full" />
                  <p className="text-xs font-semibold text-[#2C2A25] uppercase tracking-wider">Top clients</p>
                </div>
                <div className="flex flex-col gap-3">
                  {topClients.map((c, i) => {
                    const s = NIVEAU_STYLE[c.niveau] || NIVEAU_STYLE.Bronze
                    return (
                      <div key={c.nom} className="flex items-center gap-3">
                        <span className="text-xs font-bold text-[#BA7517] w-4 text-center flex-shrink-0">#{i + 1}</span>
                        <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-xs font-semibold flex-shrink-0 ${s.avatar}`}>
                          {c.nom.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-[#2C2A25] truncate">{c.nom}</p>
                          <p className="text-[10px] text-[#8A8275]">{c.nb} transaction{c.nb > 1 ? 's' : ''}</p>
                        </div>
                        <div className="text-right flex-shrink-0">
                          <p className="text-sm font-semibold text-[#2C2A25]">{c.total.toLocaleString('fr-FR')} <span className="text-[10px] text-[#8A8275] font-normal">DA</span></p>
                          <span className={`text-[9px] px-1.5 py-0.5 rounded-md border ${s.badge}`}>{c.niveau}</span>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            {/* ── Caisse POS ── */}
            <div className="flex flex-col gap-3">
              <p className="text-[9px] tracking-[0.3em] uppercase text-[#8A8275] font-medium">Caisse POS</p>
              <div className="grid grid-cols-2 gap-3">
                <KpiCard label="CA Caisse POS" value={posStats.ca} dark />
                <KpiCard label="Commandes"     value={posStats.nbCommandes} unit="" sub="commandes traitées" />
              </div>

              {posStats.topProduits.length > 0 && (
                <div className="bg-white border border-[#C4B89E] rounded-2xl p-5 shadow-md">
                  <div className="flex items-center gap-2 mb-4">
                    <div className="w-1 h-5 bg-[#BA7517] rounded-full" />
                    <p className="text-xs font-semibold text-[#2C2A25] uppercase tracking-wider">Produits les plus vendus</p>
                  </div>
                  <div className="flex flex-col gap-3">
                    {posStats.topProduits.map((p, i) => (
                      <div key={p.nom} className="flex items-center gap-3">
                        <span className="text-xs font-bold text-[#BA7517] w-4 text-center flex-shrink-0">#{i + 1}</span>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-[#2C2A25] truncate">{p.nom}</p>
                          <div className="mt-1 h-1.5 bg-[#EDE8DE] rounded-full overflow-hidden">
                            <div
                              className="h-full bg-[#BA7517] rounded-full transition-all duration-700"
                              style={{ width: `${(p.qty / posStats.topProduits[0].qty) * 100}%` }}
                            />
                          </div>
                        </div>
                        <div className="text-right flex-shrink-0">
                          <p className="text-xs font-semibold text-[#2C2A25]">×{p.qty}</p>
                          <p className="text-[10px] text-[#8A8275]">{p.ca.toLocaleString('fr-FR')} DA</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {posStats.topProduits.length === 0 && (
                <div className="bg-white border border-[#C4B89E] rounded-2xl p-8 shadow-md flex flex-col items-center gap-2 opacity-50">
                  <span className="text-2xl">⊞</span>
                  <p className="text-[10px] text-[#8A8275] uppercase tracking-wide">Aucune commande POS sur cette période</p>
                </div>
              )}
            </div>

          </>
        )}
      </div>
    </div>
  )
}
