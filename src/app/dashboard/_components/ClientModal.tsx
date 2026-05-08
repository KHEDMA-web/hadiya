'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { getConfigFidelite, getNiveau, calcPoints, getProgressionNiveau, DEFAULT_CONFIG, type ConfigFidelite } from '@/lib/fidelite'

const NIVEAU_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  Bronze:  { bg: 'rgba(196,129,58,0.12)',  text: '#C4813A', border: 'rgba(196,129,58,0.3)'  },
  Argent:  { bg: 'rgba(138,130,117,0.12)', text: '#8A8275', border: 'rgba(138,130,117,0.3)' },
  Or:      { bg: 'rgba(186,117,23,0.12)',  text: '#BA7517', border: 'rgba(186,117,23,0.3)'  },
  Platine: { bg: 'rgba(124,111,174,0.12)', text: '#7C6FAE', border: 'rgba(124,111,174,0.3)' },
}

const TX_STYLE: Record<string, { color: string; bg: string; sign: string; icon: string }> = {
  debit:    { color: '#EF4444', bg: 'rgba(239,68,68,0.08)',   sign: '−', icon: '↓' },
  recharge: { color: '#10B981', bg: 'rgba(16,185,129,0.08)',  sign: '+', icon: '↑' },
  cadeau:   { color: '#BA7517', bg: 'rgba(186,117,23,0.08)',  sign: '+', icon: '✦' },
  vente:    { color: '#EF4444', bg: 'rgba(239,68,68,0.08)',   sign: '−', icon: '⊞' },
}

export function ClientModal({ carteData, onClose, onNavigate }: {
  carteData: any
  onClose: () => void
  onNavigate: (id: string) => void
}) {
  const [tab, setTab] = useState<'vente' | 'recharge' | 'historique' | 'infos'>('vente')
  const [carte, setCarte] = useState(carteData)
  const [config, setConfig] = useState<ConfigFidelite>(DEFAULT_CONFIG)
  const client = carte.clients

  const [soins, setSoins] = useState<any[]>([])
  const [panier, setPanier] = useState<Record<string, number>>({})
  const [venteLoading, setVenteLoading] = useState(false)
  const [venteSuccess, setVenteSuccess] = useState('')
  const [venteError, setVenteError] = useState('')

  const [rechargeAmt, setRechargeAmt] = useState('')
  const [rechargeLoading, setRechargeLoading] = useState(false)
  const [rechargeSuccess, setRechargeSuccess] = useState('')

  const [form, setForm] = useState({
    prenom: client?.prenom || '',
    nom: client?.nom || '',
    telephone: client?.telephone || '',
    email: client?.email || '',
    allergies: client?.allergies || '',
    preferences_massage: client?.preferences_massage || '',
    notes_praticien: client?.notes_praticien || '',
  })
  const [saving, setSaving] = useState(false)
  const [saveSuccess, setSaveSuccess] = useState(false)

  const [transactions, setTransactions] = useState<any[]>([])
  const [txLoaded, setTxLoaded] = useState(false)

  const points = carte?.points || 0
  const { niveau, next, max, progress } = getProgressionNiveau(points, config)
  const nc = NIVEAU_COLORS[niveau] || NIVEAU_COLORS.Bronze

  const totalPanier = Object.entries(panier).reduce((acc, [id, qty]) => {
    const s = soins.find(s => s.id === id)
    return acc + (s?.prix || 0) * qty
  }, 0)

  useEffect(() => {
    const init = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (session) {
        const cfg = await getConfigFidelite(session.user.email || '')
        setConfig(cfg)
      }
      supabase.from('menu_items').select('*').eq('categorie', 'soin').order('nom')
        .then(({ data }) => setSoins(data || []))
    }
    init()
  }, [])

  useEffect(() => {
    if (tab === 'historique' && !txLoaded && carte?.id) {
      supabase.from('transactions').select('*').eq('carte_id', carte.id)
        .order('created_at', { ascending: false }).limit(20)
        .then(({ data }) => { setTransactions(data || []); setTxLoaded(true) })
    }
  }, [tab, txLoaded, carte?.id])

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onClose])

  const handleVente = async () => {
    if (totalPanier <= 0 || !carte) return
    if (totalPanier > carte.solde) { setVenteError('Solde insuffisant'); return }
    setVenteLoading(true)
    setVenteError('')
    const pts = calcPoints(totalPanier, config)
    const nouveauxPoints = carte.points + pts
    const nouveauSolde = carte.solde - totalPanier
    const bonNiveau = getNiveau(nouveauxPoints, config)
    const desc = Object.entries(panier)
      .filter(([, q]) => q > 0)
      .map(([id, q]) => { const s = soins.find(s => s.id === id); return `${s?.nom} x${q}` })
      .join(', ')
    await Promise.all([
      supabase.from('cartes').update({ solde: nouveauSolde, points: nouveauxPoints, niveau: bonNiveau }).eq('id', carte.id),
      supabase.from('transactions').insert({
        carte_id: carte.id, type: 'debit', montant: totalPanier,
        points_gagnes: pts, description: `Vente : ${desc}`,
      }),
    ])
    setCarte((c: any) => ({ ...c, solde: nouveauSolde, points: nouveauxPoints, niveau: bonNiveau }))
    setPanier({})
    setVenteSuccess(`${totalPanier.toLocaleString('fr-FR')} DA débités · +${pts} pts${bonNiveau !== niveau ? ` · 🎉 Niveau ${bonNiveau} !` : ''}`)
    setVenteLoading(false)
    setTimeout(() => setVenteSuccess(''), 3500)
  }

  const handleRecharge = async (amt: number) => {
    if (!carte || rechargeLoading || isNaN(amt) || amt <= 0) return
    setRechargeLoading(true)
    const pts = calcPoints(amt, config)
    const nouveauxPoints = carte.points + pts
    const nouveauSolde = carte.solde + amt
    const bonNiveau = getNiveau(nouveauxPoints, config)
    await Promise.all([
      supabase.from('cartes').update({ solde: nouveauSolde, points: nouveauxPoints, niveau: bonNiveau }).eq('id', carte.id),
      supabase.from('transactions').insert({
        carte_id: carte.id, type: 'recharge', montant: amt,
        points_gagnes: pts, description: `Recharge — ${amt.toLocaleString('fr-FR')} DA`,
      }),
    ])
    setCarte((c: any) => ({ ...c, solde: nouveauSolde, points: nouveauxPoints, niveau: bonNiveau }))
    setRechargeSuccess(`${amt.toLocaleString('fr-FR')} DA rechargés · +${pts} pts${bonNiveau !== niveau ? ` · 🎉 Niveau ${bonNiveau} !` : ''}`)
    setRechargeAmt('')
    setRechargeLoading(false)
    setTimeout(() => setRechargeSuccess(''), 3500)
  }

  const handleSave = async () => {
    setSaving(true)
    await supabase.from('clients').update(form).eq('id', client.id)
    setSaving(false)
    setSaveSuccess(true)
    setTimeout(() => setSaveSuccess(false), 2500)
  }

  const TABS = [
    { key: 'vente',      label: '⊞ Vente'      },
    { key: 'recharge',   label: '◎ Recharge'   },
    { key: 'historique', label: '≡ Historique' },
    { key: 'infos',      label: '✎ Infos'      },
  ]

  return (
    <div
      className="fixed inset-0 z-50 flex items-end md:items-center justify-center p-0 md:p-6"
      style={{ background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(4px)' }}
      onClick={onClose}
    >
      <div
        className="bg-[#F7F4EE] w-full md:max-w-xl md:rounded-3xl rounded-t-3xl overflow-hidden flex flex-col shadow-2xl"
        style={{ maxHeight: '92vh' }}
        onClick={e => e.stopPropagation()}
      >
        {/* HEADER */}
        <div className="bg-[#2C2A25] px-5 pt-5 pb-5 flex-shrink-0">
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-base font-semibold flex-shrink-0"
                style={{ background: nc.bg, color: nc.text, border: `1px solid ${nc.border}` }}>
                {client?.prenom?.[0]?.toUpperCase()}{client?.nom?.[0]?.toUpperCase()}
              </div>
              <div>
                <p className="text-base font-medium text-[#F7F4EE] leading-tight">{client?.prenom} {client?.nom}</p>
                <p className="text-xs mt-0.5" style={{ color: 'rgba(247,244,238,0.4)' }}>{client?.telephone || 'Aucun téléphone'}</p>
                <span className="inline-block mt-1.5 text-[8px] font-semibold px-2.5 py-0.5 rounded-full tracking-[0.15em] uppercase"
                  style={{ background: nc.bg, color: nc.text, border: `1px solid ${nc.border}` }}>{niveau}</span>
              </div>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0 mt-0.5">
              <button onClick={() => onNavigate(client?.id)}
                className="text-[8px] tracking-[0.08em] uppercase font-semibold px-2.5 py-1.5 rounded-lg transition-all hover:opacity-80"
                style={{ color: '#BA7517', border: '1px solid rgba(186,117,23,0.35)' }}>
                Pleine page →
              </button>
              <button onClick={onClose}
                className="w-8 h-8 rounded-full border border-[#4A4840] flex items-center justify-center text-[#F7F4EE] opacity-50 hover:opacity-100 transition-all text-lg leading-none">×</button>
            </div>
          </div>

          {/* Solde + Points */}
          <div className="grid grid-cols-2 gap-2.5 mb-3">
            <div className="rounded-xl px-4 py-3" style={{ background: 'rgba(247,244,238,0.07)' }}>
              <p className="text-[8px] tracking-[0.2em] uppercase mb-1" style={{ color: 'rgba(247,244,238,0.3)' }}>Solde</p>
              <p className="text-xl font-light leading-none" style={{ color: '#BA7517' }}>
                {carte?.solde?.toLocaleString('fr-FR')}
                <span className="text-xs ml-1" style={{ color: 'rgba(247,244,238,0.3)' }}>DA</span>
              </p>
            </div>
            <div className="rounded-xl px-4 py-3" style={{ background: 'rgba(247,244,238,0.07)' }}>
              <p className="text-[8px] tracking-[0.2em] uppercase mb-1" style={{ color: 'rgba(247,244,238,0.3)' }}>Points</p>
              <p className="text-xl font-light text-[#F7F4EE] leading-none">
                {points.toLocaleString('fr-FR')}
                <span className="text-xs ml-1" style={{ color: 'rgba(247,244,238,0.3)' }}>pts</span>
              </p>
            </div>
          </div>

          {/* Barre niveau */}
          <div>
            <div className="flex justify-between mb-1.5">
              <p className="text-[8px] tracking-[0.12em] uppercase" style={{ color: 'rgba(247,244,238,0.25)' }}>
                {next ? `Vers ${next}` : 'Niveau maximum'}
              </p>
              {next && (
                <p className="text-[8px]" style={{ color: 'rgba(247,244,238,0.25)' }}>
                  {points.toLocaleString('fr-FR')} / {max.toLocaleString('fr-FR')} pts
                </p>
              )}
            </div>
            <div className="h-1 rounded-full overflow-hidden" style={{ background: 'rgba(247,244,238,0.08)' }}>
              <div className="h-full rounded-full transition-all duration-700" style={{ width: `${progress}%`, background: nc.text }} />
            </div>
          </div>
        </div>

        {/* TABS */}
        <div className="flex border-b bg-white flex-shrink-0" style={{ borderColor: 'rgba(196,184,158,0.5)' }}>
          {TABS.map(t => (
            <button key={t.key} onClick={() => setTab(t.key as any)}
              className="flex-1 py-3 text-[10px] font-semibold tracking-[0.06em] uppercase transition-all"
              style={{
                color: tab === t.key ? '#BA7517' : '#8A8275',
                borderBottom: tab === t.key ? '2px solid #BA7517' : '2px solid transparent',
                background: 'white',
              }}>
              {t.label}
            </button>
          ))}
        </div>

        {/* CONTENU */}
        <div className="overflow-y-auto flex-1">

          {/* VENTE */}
          {tab === 'vente' && (
            <div className="p-4 flex flex-col gap-3">
              {venteSuccess && (
                <div className="flex items-center gap-2 px-4 py-3 rounded-xl" style={{ background: 'rgba(186,117,23,0.08)', border: '1px solid rgba(186,117,23,0.2)' }}>
                  <span style={{ color: '#BA7517' }}>✓</span>
                  <p className="text-sm font-medium" style={{ color: '#BA7517' }}>{venteSuccess}</p>
                </div>
              )}
              {venteError && <p className="text-sm text-red-500 px-1">{venteError}</p>}
              {soins.length === 0 && (
                <div className="text-center py-10">
                  <p className="text-sm text-[#8A8275]">Aucun soin dans le catalogue</p>
                  <p className="text-[10px] text-[#8A8275]/60 mt-1">Ajoutez des soins dans Produits</p>
                </div>
              )}
              <div className="flex flex-col gap-2">
                {soins.map(soin => {
                  const qty = panier[soin.id] || 0
                  return (
                    <div key={soin.id} className="flex items-center gap-3 border rounded-xl px-4 py-3 transition-all"
                      style={{ borderColor: qty > 0 ? 'rgba(186,117,23,0.4)' : 'rgba(196,184,158,0.6)', background: qty > 0 ? 'rgba(186,117,23,0.03)' : 'white' }}>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-[#2C2A25] truncate">{soin.nom}</p>
                        {soin.duree_minutes && <p className="text-[10px] text-[#8A8275] mt-0.5">{soin.duree_minutes} min</p>}
                      </div>
                      <p className="text-sm font-semibold flex-shrink-0 mr-1" style={{ color: '#BA7517' }}>
                        {soin.prix?.toLocaleString('fr-FR')} DA
                      </p>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <button onClick={() => setPanier(p => ({ ...p, [soin.id]: Math.max(0, (p[soin.id] || 0) - 1) }))}
                          disabled={qty === 0}
                          className="w-7 h-7 rounded-lg border flex items-center justify-center text-sm transition-colors disabled:opacity-30"
                          style={{ borderColor: qty > 0 ? 'rgba(186,117,23,0.5)' : 'rgba(196,184,158,0.6)', color: qty > 0 ? '#BA7517' : '#8A8275' }}>−</button>
                        <span className="w-5 text-center text-sm font-semibold text-[#2C2A25]">{qty}</span>
                        <button onClick={() => setPanier(p => ({ ...p, [soin.id]: (p[soin.id] || 0) + 1 }))}
                          className="w-7 h-7 rounded-lg border flex items-center justify-center text-sm transition-colors hover:border-[#BA7517] hover:text-[#BA7517]"
                          style={{ borderColor: 'rgba(196,184,158,0.6)', color: '#8A8275' }}>+</button>
                      </div>
                    </div>
                  )
                })}
              </div>
              {totalPanier > 0 && (
                <div className="sticky bottom-0 pt-3 pb-1 flex flex-col gap-2 mt-1"
                  style={{ background: '#F7F4EE', borderTop: '1px solid rgba(196,184,158,0.4)' }}>
                  <div className="flex justify-between items-center px-1">
                    <p className="text-xs text-[#8A8275]">
                      {Object.values(panier).reduce((a, b) => a + b, 0)} article(s) · +{calcPoints(totalPanier, config)} pts
                    </p>
                    <p className="text-lg font-semibold" style={{ color: '#BA7517' }}>{totalPanier.toLocaleString('fr-FR')} DA</p>
                  </div>
                  <button onClick={handleVente} disabled={venteLoading || totalPanier > carte.solde}
                    className="w-full rounded-xl py-3.5 text-sm font-semibold tracking-wide transition-colors disabled:opacity-40"
                    style={{ background: '#2C2A25', color: '#F7F4EE' }}>
                    {venteLoading ? '...' : totalPanier > carte.solde ? '⚠ Solde insuffisant' : `Débiter ${totalPanier.toLocaleString('fr-FR')} DA`}
                  </button>
                </div>
              )}
            </div>
          )}

          {/* RECHARGE */}
          {tab === 'recharge' && (
            <div className="p-4 flex flex-col gap-4">
              {rechargeSuccess && (
                <div className="flex items-center gap-2 px-4 py-3 rounded-xl" style={{ background: 'rgba(186,117,23,0.08)', border: '1px solid rgba(186,117,23,0.2)' }}>
                  <span style={{ color: '#BA7517' }}>✓</span>
                  <p className="text-sm font-medium" style={{ color: '#BA7517' }}>{rechargeSuccess}</p>
                </div>
              )}
              <div className="grid grid-cols-4 gap-2">
                {[2000, 5000, 10000, 20000].map(amt => (
                  <button key={amt} onClick={() => handleRecharge(amt)} disabled={rechargeLoading}
                    className="py-3.5 rounded-xl border text-sm font-semibold text-[#2C2A25] transition-all disabled:opacity-40 active:scale-95 hover:border-[#BA7517] hover:text-[#BA7517] flex flex-col items-center"
                    style={{ borderColor: 'rgba(196,184,158,0.7)' }}>
                    <span>{amt >= 1000 ? `${amt / 1000}k` : amt}</span>
                    <span className="text-[9px] font-normal mt-0.5" style={{ color: '#BA7517' }}>+{calcPoints(amt, config)} pts</span>
                  </button>
                ))}
              </div>
              <div className="flex gap-2">
                <input type="number" placeholder="Montant libre (DA)" value={rechargeAmt}
                  onChange={e => setRechargeAmt(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && rechargeAmt && handleRecharge(parseFloat(rechargeAmt))}
                  className="flex-1 border rounded-xl px-4 py-2.5 text-sm text-[#2C2A25] bg-white outline-none transition-colors placeholder:text-[#B0A898]"
                  style={{ borderColor: 'rgba(196,184,158,0.7)' }} />
                <button onClick={() => rechargeAmt && handleRecharge(parseFloat(rechargeAmt))}
                  disabled={rechargeLoading || !rechargeAmt}
                  className="text-white rounded-xl px-5 py-2.5 text-sm font-medium transition-colors disabled:opacity-40 whitespace-nowrap"
                  style={{ background: '#BA7517' }}>
                  {rechargeLoading ? '...' : 'Recharger'}
                </button>
              </div>
            </div>
          )}

          {/* HISTORIQUE */}
          {tab === 'historique' && (
            <div>
              {!txLoaded && (
                <div className="flex justify-center py-10">
                  <div className="w-5 h-5 rounded-full border-2 border-[#C4B89E] border-t-[#BA7517] animate-spin" />
                </div>
              )}
              {txLoaded && transactions.length === 0 && (
                <p className="text-center text-[9px] tracking-[0.2em] uppercase text-[#8A8275] py-10">Aucune transaction</p>
              )}
              <div className="divide-y" style={{ borderColor: 'rgba(196,184,158,0.3)' }}>
                {transactions.map((tx, i) => {
                  const s = TX_STYLE[tx.type] || TX_STYLE.debit
                  return (
                    <div key={tx.id || i} className="flex items-center gap-3 px-5 py-3.5 bg-white">
                      <div className="w-8 h-8 rounded-lg flex items-center justify-center text-xs flex-shrink-0 font-medium"
                        style={{ background: s.bg, color: s.color }}>{s.icon}</div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium text-[#2C2A25] truncate">{tx.description || tx.type}</p>
                        <p className="text-[10px] text-[#8A8275] mt-0.5">
                          {new Date(tx.created_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </p>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <p className="text-sm font-semibold" style={{ color: s.color }}>{s.sign}{tx.montant?.toLocaleString('fr-FR')} DA</p>
                        {tx.points_gagnes > 0 && <p className="text-[9px] mt-0.5" style={{ color: '#BA7517' }}>+{tx.points_gagnes} pts</p>}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* INFOS */}
          {tab === 'infos' && (
            <div className="p-4 flex flex-col gap-4">
              <div className="grid grid-cols-2 gap-3">
                {(['prenom', 'nom'] as const).map(key => (
                  <div key={key}>
                    <label className="block text-[9px] tracking-[0.18em] uppercase text-[#8A8275] mb-1.5">
                      {key === 'prenom' ? 'Prénom' : 'Nom'}
                    </label>
                    <input value={form[key]} onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
                      className="w-full border rounded-xl px-3.5 py-2.5 text-sm text-[#2C2A25] bg-white outline-none focus:border-[#BA7517] transition-colors"
                      style={{ borderColor: 'rgba(196,184,158,0.7)' }} />
                  </div>
                ))}
              </div>
              <div className="grid grid-cols-2 gap-3">
                {([['telephone', 'Téléphone', 'tel'], ['email', 'Email', 'email']] as const).map(([key, label, type]) => (
                  <div key={key}>
                    <label className="block text-[9px] tracking-[0.18em] uppercase text-[#8A8275] mb-1.5">{label}</label>
                    <input type={type} value={form[key]} onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
                      className="w-full border rounded-xl px-3.5 py-2.5 text-sm text-[#2C2A25] bg-white outline-none focus:border-[#BA7517] transition-colors"
                      style={{ borderColor: 'rgba(196,184,158,0.7)' }} />
                  </div>
                ))}
              </div>
              {([
                ['allergies', 'Allergies & contre-indications', 'Ex : allergie aux huiles essentielles...'],
                ['preferences_massage', 'Préférences massage', 'Ex : pression forte, huile de rose...'],
                ['notes_praticien', 'Notes praticien (privé)', 'Notes internes non visibles par le client...'],
              ] as const).map(([key, label, ph]) => (
                <div key={key}>
                  <label className="block text-[9px] tracking-[0.18em] uppercase text-[#8A8275] mb-1.5">{label}</label>
                  <textarea value={form[key]} onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
                    rows={2} placeholder={ph}
                    className="w-full border rounded-xl px-3.5 py-2.5 text-sm text-[#2C2A25] bg-white outline-none focus:border-[#BA7517] transition-colors resize-none placeholder:text-[#B0A898]"
                    style={{ borderColor: 'rgba(196,184,158,0.7)' }} />
                </div>
              ))}
              <button onClick={handleSave} disabled={saving}
                className="w-full rounded-xl py-3 text-sm font-medium tracking-wide transition-colors disabled:opacity-50"
                style={{ background: '#2C2A25', color: '#F7F4EE' }}>
                {saving ? 'Sauvegarde...' : saveSuccess ? '✓ Sauvegardé' : 'Sauvegarder'}
              </button>
            </div>
          )}

        </div>
      </div>
    </div>
  )
}
