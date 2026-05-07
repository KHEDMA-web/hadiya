'use client'
import { useEffect, useState, useRef } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter, useParams } from 'next/navigation'
import QRCode from 'qrcode'

const NIVEAU_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  Bronze:  { bg: 'rgba(196,129,58,0.12)',  text: '#C4813A', border: 'rgba(196,129,58,0.3)'  },
  Argent:  { bg: 'rgba(138,130,117,0.12)', text: '#8A8275', border: 'rgba(138,130,117,0.3)' },
  Or:      { bg: 'rgba(186,117,23,0.12)',  text: '#BA7517', border: 'rgba(186,117,23,0.3)'  },
  Platine: { bg: 'rgba(124,111,174,0.12)', text: '#7C6FAE', border: 'rgba(124,111,174,0.3)' },
}

const NIVEAU_RANGE: Record<string, { min: number; max: number; next: string | null }> = {
  Bronze:  { min: 0,    max: 500,  next: 'Argent'  },
  Argent:  { min: 500,  max: 1500, next: 'Or'      },
  Or:      { min: 1500, max: 3000, next: 'Platine'  },
  Platine: { min: 3000, max: 3000, next: null        },
}

const TX_STYLE: Record<string, { color: string; bg: string; sign: string; icon: string }> = {
  debit:    { color: '#EF4444', bg: 'rgba(239,68,68,0.08)',   sign: '−', icon: '↓' },
  recharge: { color: '#10B981', bg: 'rgba(16,185,129,0.08)',  sign: '+', icon: '↑' },
  cadeau:   { color: '#BA7517', bg: 'rgba(186,117,23,0.08)',  sign: '+', icon: '✦' },
}

export default function FicheClient() {
  const router = useRouter()
  const params = useParams()
  const clientId = params.id as string

  const [client, setClient] = useState<any>(null)
  const [carte, setCarte] = useState<any>(null)
  const [transactions, setTransactions] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  const [form, setForm] = useState({
    prenom: '', nom: '', telephone: '', email: '',
    date_naissance: '', allergies: '', preferences_massage: '', notes_praticien: '',
  })
  const [saving, setSaving] = useState(false)
  const [saveSuccess, setSaveSuccess] = useState(false)

  const [rfidOpen, setRfidOpen] = useState(false)
  const [rfidValue, setRfidValue] = useState('')
  const [rfidSaving, setRfidSaving] = useState(false)
  const [rfidError, setRfidError] = useState('')
  const rfidRef = useRef<HTMLInputElement>(null)

  const [rechargeAmt, setRechargeAmt] = useState('')
  const [rechargeLoading, setRechargeLoading] = useState(false)
  const [rechargeSuccess, setRechargeSuccess] = useState('')

  const [qrOpen, setQrOpen] = useState(false)
  const [qrDataUrl, setQrDataUrl] = useState('')

  useEffect(() => {
    const load = async () => {
      const { data: clientData } = await supabase
        .from('clients').select('*').eq('id', clientId).single()
      if (!clientData) { setLoading(false); return }

      setClient(clientData)
      setForm({
        prenom:              clientData.prenom || '',
        nom:                 clientData.nom || '',
        telephone:           clientData.telephone || '',
        email:               clientData.email || '',
        date_naissance:      clientData.date_naissance || '',
        allergies:           clientData.allergies || '',
        preferences_massage: clientData.preferences_massage || '',
        notes_praticien:     clientData.notes_praticien || '',
      })

      const { data: carteData } = await supabase
        .from('cartes').select('*').eq('client_id', clientId)
        .order('created_at', { ascending: false }).limit(1).maybeSingle()

      if (carteData) {
        setCarte(carteData)
        const { data: txData } = await supabase
          .from('transactions').select('*').eq('carte_id', carteData.id)
          .order('created_at', { ascending: false }).limit(10)
        setTransactions(txData || [])
      }
      setLoading(false)
    }
    load()
  }, [clientId])

  const handleSave = async () => {
    setSaving(true)
    setSaveSuccess(false)
    await supabase.from('clients').update(form).eq('id', clientId)
    setClient((c: any) => ({ ...c, ...form }))
    setSaving(false)
    setSaveSuccess(true)
    setTimeout(() => setSaveSuccess(false), 2500)
  }

  const openRfid = () => {
    setRfidOpen(true)
    setRfidError('')
    setRfidValue('')
    setTimeout(() => rfidRef.current?.focus(), 60)
  }

  const handleRfidAssociate = async () => {
    if (!rfidValue || !carte) return
    setRfidSaving(true)
    setRfidError('')
    const { data: conflict } = await supabase
      .from('cartes').select('id').eq('uid_rfid', rfidValue).neq('id', carte.id).maybeSingle()
    if (conflict) {
      setRfidError('Cet UID est déjà associé à une autre carte')
      setRfidSaving(false)
      return
    }
    await supabase.from('cartes').update({ uid_rfid: rfidValue }).eq('id', carte.id)
    setCarte((c: any) => ({ ...c, uid_rfid: rfidValue }))
    setRfidOpen(false)
    setRfidValue('')
    setRfidSaving(false)
  }

  const openQr = async () => {
    if (!carte?.uid_rfid) return
    const url = `${window.location.origin}/carte/${carte.uid_rfid}`
    const dataUrl = await QRCode.toDataURL(url, {
      width: 300, margin: 2,
      color: { dark: '#2C2A25', light: '#FFFFFF' },
    })
    setQrDataUrl(dataUrl)
    setQrOpen(true)
  }

  const downloadQr = () => {
    const a = document.createElement('a')
    a.href = qrDataUrl
    a.download = `carte-${carte?.uid_rfid}.png`
    a.click()
  }

  const handleRecharge = async (amt: number) => {
    if (!carte || rechargeLoading || isNaN(amt) || amt <= 0) return
    setRechargeLoading(true)
    setRechargeSuccess('')
    const nouveauSolde = carte.solde + amt
    const pts = Math.round(amt / 100 * 2)
    await Promise.all([
      supabase.from('cartes').update({ solde: nouveauSolde, points: carte.points + pts }).eq('id', carte.id),
      supabase.from('transactions').insert({
        carte_id: carte.id, type: 'recharge', montant: amt,
        points_gagnes: pts, description: `Recharge — ${amt.toLocaleString('fr-FR')} DA`,
      }),
    ])
    setCarte((c: any) => ({ ...c, solde: nouveauSolde, points: c.points + pts }))
    setTransactions(prev => [{
      id: `tmp-${Date.now()}`, type: 'recharge', montant: amt, points_gagnes: pts,
      description: `Recharge — ${amt.toLocaleString('fr-FR')} DA`, created_at: new Date().toISOString(),
    }, ...prev.slice(0, 9)])
    setRechargeSuccess(`${amt.toLocaleString('fr-FR')} DA rechargés · +${pts} points`)
    setRechargeAmt('')
    setRechargeLoading(false)
    setTimeout(() => setRechargeSuccess(''), 3000)
  }

  /* ── Loading ── */
  if (loading) return (
    <div className="min-h-screen bg-[#F7F4EE] flex items-center justify-center">
      <div className="flex flex-col items-center gap-3">
        <div className="w-6 h-6 rounded-full border-2 border-[#C4B89E] border-t-[#BA7517] animate-spin" />
        <p className="text-[9px] tracking-[0.25em] uppercase text-[#8A8275]">Chargement</p>
      </div>
    </div>
  )

  if (!client) return (
    <div className="min-h-screen bg-[#F7F4EE] flex items-center justify-center">
      <div className="text-center flex flex-col gap-3">
        <p className="text-sm text-[#8A8275]">Client introuvable</p>
        <button onClick={() => router.push('/dashboard/clients')} className="text-sm underline" style={{ color: '#BA7517' }}>
          Retour à la liste
        </button>
      </div>
    </div>
  )

  const niveau = carte?.niveau || 'Bronze'
  const nc = NIVEAU_COLORS[niveau] || NIVEAU_COLORS.Bronze
  const nr = NIVEAU_RANGE[niveau] || NIVEAU_RANGE.Bronze
  const points = carte?.points || 0
  const progress = nr.next
    ? Math.min(100, Math.max(0, ((points - nr.min) / (nr.max - nr.min)) * 100))
    : 100

  /* ── Helpers ── */
  const Field = ({
    label, value, onChange, type = 'text',
  }: { label: string; value: string; onChange: (v: string) => void; type?: string }) => (
    <div>
      <label className="block text-[9px] tracking-[0.18em] uppercase text-[#8A8275] mb-1.5">{label}</label>
      <input
        type={type}
        value={value}
        onChange={e => onChange(e.target.value)}
        className="w-full border border-[#C4B89E] rounded-xl px-3.5 py-2.5 text-sm text-[#2C2A25] bg-[#FAFAF8] outline-none focus:border-[#BA7517] focus:ring-1 focus:ring-[#BA7517]/20 transition-colors"
      />
    </div>
  )

  const Textarea = ({
    label, value, onChange, rows = 2, placeholder = '', accent = false,
  }: { label: string; value: string; onChange: (v: string) => void; rows?: number; placeholder?: string; accent?: boolean }) => (
    <div>
      <label className="block text-[9px] tracking-[0.18em] uppercase text-[#8A8275] mb-1.5">
        {label}
        {accent && <span className="ml-1.5" style={{ color: '#BA7517' }}>(privé)</span>}
      </label>
      <textarea
        value={value}
        onChange={e => onChange(e.target.value)}
        rows={rows}
        placeholder={placeholder}
        className="w-full border border-[#C4B89E] rounded-xl px-3.5 py-2.5 text-sm text-[#2C2A25] bg-[#FAFAF8] outline-none focus:border-[#BA7517] focus:ring-1 focus:ring-[#BA7517]/20 transition-colors resize-none placeholder:text-[#B0A898]"
      />
    </div>
  )

  return (
    <div className="min-h-screen bg-[#F7F4EE]">
      <style>{`
        @keyframes rfid-glow {
          0%, 100% { box-shadow: 0 0 0 1px rgba(186,117,23,0.5), 0 0 8px rgba(186,117,23,0.15); }
          50%       { box-shadow: 0 0 0 2px rgba(186,117,23,0.9), 0 0 18px rgba(186,117,23,0.4); }
        }
      `}</style>

      {/* ══ 1. HEADER SOMBRE ══ */}
      <div className="bg-[#2C2A25] px-5 pt-5 pb-8">
        <div className="max-w-2xl mx-auto">
          <button
            onClick={() => router.push('/dashboard/clients')}
            className="w-9 h-9 rounded-full border border-[#4A4840] flex items-center justify-center text-[#F7F4EE] opacity-60 hover:opacity-100 hover:border-[#BA7517] transition-all text-sm mb-6"
          >
            ←
          </button>

          <div className="flex items-start gap-4">
            {/* Avatar */}
            <div
              className="w-16 h-16 rounded-2xl flex items-center justify-center text-xl font-semibold flex-shrink-0"
              style={{ background: nc.bg, color: nc.text, border: `1px solid ${nc.border}` }}
            >
              {client.prenom?.[0]?.toUpperCase()}{client.nom?.[0]?.toUpperCase()}
            </div>

            <div className="flex-1 min-w-0 pt-0.5">
              <h1 className="text-xl font-medium text-[#F7F4EE] tracking-wide leading-tight">
                {client.prenom} {client.nom}
              </h1>
              <p className="text-sm mt-1" style={{ color: 'rgba(247,244,238,0.4)' }}>
                {client.telephone || 'Aucun téléphone'}
              </p>
              <p className="text-[10px] mt-0.5 tracking-wide" style={{ color: 'rgba(247,244,238,0.22)' }}>
                Membre depuis {new Date(client.created_at).toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })}
              </p>
              <span
                className="inline-block mt-3 text-[9px] font-semibold px-3 py-1 rounded-full tracking-[0.15em] uppercase"
                style={{ background: nc.bg, color: nc.text, border: `1px solid ${nc.border}` }}
              >
                {niveau}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-5 py-6 flex flex-col gap-5">

        {/* ══ 2. CARTE & SOLDE ══ */}
        <div className="bg-white border border-[#C4B89E] rounded-2xl shadow-md overflow-hidden">

          {/* Solde / Points */}
          <div className="grid grid-cols-2 divide-x divide-[#E8E2D5]">
            <div className="p-5">
              <p className="text-[8px] tracking-[0.25em] uppercase text-[#8A8275] mb-2">Solde disponible</p>
              <p className="text-3xl font-light leading-none" style={{ color: '#BA7517' }}>
                {carte ? carte.solde?.toLocaleString('fr-FR') : '—'}
                <span className="text-xs text-[#8A8275] font-normal ml-1.5">DA</span>
              </p>
            </div>
            <div className="p-5">
              <p className="text-[8px] tracking-[0.25em] uppercase text-[#8A8275] mb-2">Points cumulés</p>
              <p className="text-3xl font-light text-[#2C2A25] leading-none">
                {points.toLocaleString('fr-FR')}
                <span className="text-xs text-[#8A8275] font-normal ml-1.5">pts</span>
              </p>
            </div>
          </div>

          {/* Barre progression niveau */}
          {carte && (
            <div className="px-5 py-4 border-t border-[#E8E2D5]">
              <div className="flex items-center justify-between mb-2">
                <p className="text-[9px] tracking-[0.15em] uppercase text-[#8A8275]">
                  {nr.next ? `Vers niveau ${nr.next}` : 'Niveau maximum atteint'}
                </p>
                {nr.next && (
                  <p className="text-[9px] text-[#8A8275]">
                    {points.toLocaleString('fr-FR')} / {nr.max.toLocaleString('fr-FR')} pts
                  </p>
                )}
              </div>
              <div className="h-1.5 bg-[#E8E2D5] rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-700"
                  style={{ width: `${progress}%`, background: nc.text }}
                />
              </div>
            </div>
          )}

          {/* UID RFID */}
          <div className="px-5 py-4 border-t border-[#E8E2D5] flex items-center justify-between gap-3">
            <div className="min-w-0 flex-1">
              <p className="text-[8px] tracking-[0.2em] uppercase text-[#8A8275] mb-1">Carte RFID</p>
              {carte?.uid_rfid
                ? <p className="text-xs font-mono text-[#2C2A25] truncate">{carte.uid_rfid}</p>
                : <p className="text-xs italic" style={{ color: '#B0A898' }}>Aucune carte RFID associée</p>
              }
            </div>
            {carte && !rfidOpen && (
              <div className="flex items-center gap-2 flex-shrink-0">
                {carte.uid_rfid && (
                  <button
                    onClick={openQr}
                    className="text-[9px] font-semibold tracking-[0.1em] uppercase px-3 py-1.5 rounded-lg border transition-colors whitespace-nowrap hover:opacity-80"
                    style={{ borderColor: 'rgba(186,117,23,0.4)', color: '#BA7517' }}
                  >
                    Voir QR code
                  </button>
                )}
                <button
                  onClick={openRfid}
                  className="text-[9px] font-semibold tracking-[0.1em] uppercase px-3 py-1.5 rounded-lg border transition-colors whitespace-nowrap hover:opacity-80"
                  style={{ borderColor: 'rgba(186,117,23,0.4)', color: '#BA7517' }}
                >
                  {carte.uid_rfid ? 'Modifier' : 'Associer carte RFID'}
                </button>
              </div>
            )}
          </div>

          {/* Zone saisie RFID */}
          {rfidOpen && (
            <div className="px-5 pb-5 border-t border-[#E8E2D5]">
              <p className="text-[9px] tracking-[0.18em] uppercase text-[#8A8275] mt-4 mb-3">
                Approcher la carte RFID du lecteur
              </p>
              <div className="flex gap-2">
                <input
                  ref={rfidRef}
                  placeholder="UID lu automatiquement..."
                  value={rfidValue}
                  onChange={e => setRfidValue(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleRfidAssociate()}
                  className="flex-1 border rounded-xl px-4 py-2.5 text-sm text-[#2C2A25] outline-none font-mono"
                  style={{
                    borderColor: 'rgba(186,117,23,0.5)',
                    animation: 'rfid-glow 1.5s ease-in-out infinite',
                  }}
                />
                <button
                  onClick={handleRfidAssociate}
                  disabled={rfidSaving || !rfidValue}
                  className="bg-[#BA7517] text-white rounded-xl px-4 py-2.5 text-xs font-medium hover:bg-[#A36714] transition-colors disabled:opacity-40 whitespace-nowrap"
                >
                  {rfidSaving ? '...' : 'Associer'}
                </button>
                <button
                  onClick={() => { setRfidOpen(false); setRfidValue(''); setRfidError('') }}
                  className="w-9 h-9 rounded-xl border border-[#C4B89E] flex items-center justify-center text-base text-[#8A8275] hover:text-[#2C2A25] transition-colors flex-shrink-0 self-center"
                >
                  ×
                </button>
              </div>
              {rfidError && <p className="text-[11px] text-red-500 mt-2">{rfidError}</p>}
            </div>
          )}
        </div>

        {/* ══ 3. INFOS PERSONNELLES ══ */}
        <div className="bg-white border border-[#C4B89E] rounded-2xl shadow-md overflow-hidden">
          <div className="px-5 pt-5 pb-4 border-b border-[#E8E2D5]">
            <p className="text-[8px] tracking-[0.28em] uppercase text-[#8A8275] font-medium">Informations personnelles</p>
          </div>
          <div className="p-5 flex flex-col gap-4">
            <div className="grid grid-cols-2 gap-3">
              <Field label="Prénom"    value={form.prenom}    onChange={v => setForm(f => ({ ...f, prenom: v }))} />
              <Field label="Nom"       value={form.nom}       onChange={v => setForm(f => ({ ...f, nom: v }))} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Téléphone" value={form.telephone} onChange={v => setForm(f => ({ ...f, telephone: v }))} type="tel" />
              <Field label="Email"     value={form.email}     onChange={v => setForm(f => ({ ...f, email: v }))}     type="email" />
            </div>
            <Field label="Date d'anniversaire" value={form.date_naissance} onChange={v => setForm(f => ({ ...f, date_naissance: v }))} type="date" />
            <Textarea
              label="Allergies & contre-indications"
              value={form.allergies}
              onChange={v => setForm(f => ({ ...f, allergies: v }))}
              placeholder="Ex : allergie aux huiles essentielles de lavande..."
            />
            <Textarea
              label="Préférences massage & soins"
              value={form.preferences_massage}
              onChange={v => setForm(f => ({ ...f, preferences_massage: v }))}
              placeholder="Ex : pression forte, musique douce, huile de rose..."
            />
            <Textarea
              label="Notes praticien"
              value={form.notes_praticien}
              onChange={v => setForm(f => ({ ...f, notes_praticien: v }))}
              rows={3}
              placeholder="Notes internes non visibles par le client..."
              accent
            />

            <button
              onClick={handleSave}
              disabled={saving}
              className="w-full bg-[#2C2A25] text-[#F7F4EE] rounded-xl py-3 text-sm font-medium tracking-wide hover:bg-[#3C3A35] transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {saving ? (
                <>
                  <span className="w-4 h-4 rounded-full border-2 border-[#F7F4EE]/30 border-t-[#F7F4EE] animate-spin inline-block" />
                  Sauvegarde...
                </>
              ) : saveSuccess
                ? <span style={{ color: '#BA7517' }}>✓ Sauvegardé</span>
                : 'Sauvegarder'
              }
            </button>
          </div>
        </div>

        {/* ══ 4. HISTORIQUE ══ */}
        <div className="bg-white border border-[#C4B89E] rounded-2xl shadow-md overflow-hidden">
          <div className="px-5 pt-5 pb-4 border-b border-[#E8E2D5]">
            <p className="text-[8px] tracking-[0.28em] uppercase text-[#8A8275] font-medium">Dernières transactions</p>
          </div>
          <div className="divide-y divide-[#E8E2D5]">
            {transactions.length === 0 ? (
              <div className="flex items-center justify-center py-10">
                <p className="text-[9px] tracking-[0.2em] uppercase text-[#8A8275] opacity-40">Aucune transaction</p>
              </div>
            ) : transactions.map((tx, i) => {
              const s = TX_STYLE[tx.type] || TX_STYLE.debit
              return (
                <div key={tx.id || i} className="flex items-center gap-3.5 px-5 py-3.5">
                  <div
                    className="w-8 h-8 rounded-lg flex items-center justify-center text-xs flex-shrink-0 font-medium"
                    style={{ background: s.bg, color: s.color }}
                  >
                    {s.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-[#2C2A25] truncate">
                      {tx.description || tx.type}
                    </p>
                    <p className="text-[10px] text-[#8A8275] mt-0.5">
                      {new Date(tx.created_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-sm font-semibold" style={{ color: s.color }}>
                      {s.sign}{tx.montant?.toLocaleString('fr-FR')} DA
                    </p>
                    {tx.points_gagnes > 0 && (
                      <p className="text-[9px] mt-0.5" style={{ color: '#BA7517' }}>+{tx.points_gagnes} pts</p>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* ══ 5. RECHARGE RAPIDE ══ */}
        {carte && (
          <div className="bg-white border border-[#C4B89E] rounded-2xl shadow-md overflow-hidden">
            <div className="px-5 pt-5 pb-4 border-b border-[#E8E2D5]">
              <p className="text-[8px] tracking-[0.28em] uppercase text-[#8A8275] font-medium">Recharge rapide</p>
            </div>
            <div className="p-5 flex flex-col gap-4">
              {/* Montants rapides */}
              <div className="grid grid-cols-4 gap-2">
                {[2000, 5000, 10000, 20000].map(amt => (
                  <button
                    key={amt}
                    onClick={() => handleRecharge(amt)}
                    disabled={rechargeLoading}
                    className="py-3 rounded-xl border border-[#C4B89E] text-sm font-semibold text-[#2C2A25] hover:border-[#BA7517] hover:text-[#BA7517] transition-all disabled:opacity-40 active:scale-95"
                  >
                    {amt >= 1000 ? `${amt / 1000}k` : amt}
                  </button>
                ))}
              </div>

              {/* Montant libre */}
              <div className="flex gap-2">
                <input
                  type="number"
                  placeholder="Montant libre (DA)"
                  value={rechargeAmt}
                  onChange={e => setRechargeAmt(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && rechargeAmt && handleRecharge(parseFloat(rechargeAmt))}
                  className="flex-1 border border-[#C4B89E] rounded-xl px-4 py-2.5 text-sm text-[#2C2A25] bg-[#FAFAF8] outline-none focus:border-[#BA7517] focus:ring-1 focus:ring-[#BA7517]/20 transition-colors placeholder:text-[#B0A898]"
                />
                <button
                  onClick={() => rechargeAmt && handleRecharge(parseFloat(rechargeAmt))}
                  disabled={rechargeLoading || !rechargeAmt}
                  className="bg-[#BA7517] text-white rounded-xl px-5 py-2.5 text-sm font-medium hover:bg-[#A36714] transition-colors disabled:opacity-40 whitespace-nowrap"
                >
                  {rechargeLoading ? '...' : 'Recharger'}
                </button>
              </div>

              {rechargeSuccess && (
                <div
                  className="flex items-center gap-2.5 px-4 py-3 rounded-xl"
                  style={{ background: 'rgba(186,117,23,0.08)', border: '1px solid rgba(186,117,23,0.2)' }}
                >
                  <span style={{ color: '#BA7517' }}>✓</span>
                  <p className="text-sm font-medium" style={{ color: '#BA7517' }}>{rechargeSuccess}</p>
                </div>
              )}
            </div>
          </div>
        )}

        <div className="h-6" />
      </div>

      {/* ══ MODAL QR CODE ══ */}
      {qrOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-6"
          style={{ background: 'rgba(0,0,0,0.8)' }}
          onClick={() => setQrOpen(false)}
        >
          <div
            className="bg-white rounded-2xl p-8 flex flex-col items-center gap-5 max-w-xs w-full shadow-2xl"
            onClick={e => e.stopPropagation()}
          >
            <p className="text-[9px] tracking-[0.25em] uppercase text-[#8A8275]">QR Code carte</p>
            {qrDataUrl && (
              <img src={qrDataUrl} alt="QR Code" className="w-56 h-56 rounded-xl" />
            )}
            <p className="text-[10px] font-mono text-[#8A8275] text-center break-all">{carte?.uid_rfid}</p>
            <div className="flex gap-3 w-full">
              <button
                onClick={downloadQr}
                className="flex-1 bg-[#BA7517] text-white rounded-xl py-2.5 text-xs font-semibold tracking-wide hover:bg-[#A36714] transition-colors"
              >
                Télécharger
              </button>
              <button
                onClick={() => setQrOpen(false)}
                className="flex-1 border border-[#C4B89E] text-[#2C2A25] rounded-xl py-2.5 text-xs font-semibold hover:border-[#BA7517] hover:text-[#BA7517] transition-colors"
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
