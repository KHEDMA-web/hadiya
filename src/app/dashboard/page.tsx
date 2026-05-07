'use client'
import { useEffect, useState, useRef } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

const CARD_DELAYS = ['[animation-delay:0.15s]','[animation-delay:0.23s]','[animation-delay:0.31s]','[animation-delay:0.39s]','[animation-delay:0.47s]','[animation-delay:0.55s]','[animation-delay:0.63s]','[animation-delay:0.71s]']

const NIVEAU_AVATAR: Record<string, string> = {
  Bronze:  'bg-[#C4813A]/20 text-[#C4813A]',
  Argent:  'bg-[#8A8275]/20 text-[#8A8275]',
  Or:      'bg-[#BA7517]/20 text-[#BA7517]',
  Platine: 'bg-[#7C6FAE]/20 text-[#7C6FAE]',
}

export default function Dashboard() {
  const [stats, setStats] = useState({ cartes: 0, clients: 0, transactions: 0 })
  const [salonNom, setSalonNom] = useState('')
  const [scanNotif, setScanNotif] = useState('')
  const router = useRouter()

  const [uid, setUid] = useState('')
  const [carte, setCarte] = useState<any>(null)
  const [montant, setMontant] = useState('')
  const [scanLoading, setScanLoading] = useState(false)
  const [scanError, setScanError] = useState('')
  const [scanSuccess, setScanSuccess] = useState('')
  const [rfidMode, setRfidMode] = useState(false)

  const uidRef = useRef<HTMLInputElement>(null)
  const montantRef = useRef<HTMLInputElement>(null)
  const rfidModeRef = useRef(false)
  const carteFoundRef = useRef(false)

  useEffect(() => {
    const init = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) { router.push('/login'); return }
      const [{ count: cartes }, { count: clients }, { count: transactions }] = await Promise.all([
        supabase.from('cartes').select('*', { count: 'exact', head: true }),
        supabase.from('clients').select('*', { count: 'exact', head: true }),
        supabase.from('transactions').select('*', { count: 'exact', head: true }),
      ])
      setStats({ cartes: cartes || 0, clients: clients || 0, transactions: transactions || 0 })
      const { data: salon } = await supabase.from('salons').select('nom').eq('user_id', session.user.id).single()
      setSalonNom(salon?.nom || session.user.email?.split('@')[0] || 'Salon')
    }
    init()

    // ── REALTIME SCANS (téléphone → PC) ──
    const channel = supabase
      .channel('scans-realtime')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'scans',
      }, async (payload) => {
        const uid = payload.new.uid_carte
        const { data: carte } = await supabase
          .from('cartes')
          .select('*, clients(*)')
          .eq('uid_rfid', uid)
          .single()
        if (carte?.clients) {
          const nom = `${carte.clients.prenom} ${carte.clients.nom}`
          setScanNotif(`📱 Scan — ${nom}`)
          setTimeout(() => setScanNotif(''), 3000)
          router.push(`/dashboard/clients/${carte.clients.id}`)
        }
      })
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }

  const handleScan = async () => {
    if (!uid) return
    setScanLoading(true)
    setScanError('')
    setCarte(null)
    carteFoundRef.current = false
    setScanSuccess('')
    setMontant('')
    const { data } = await supabase.from('cartes').select('*, clients(*)').eq('uid_rfid', uid).single()
    if (!data) {
      setScanError('Carte introuvable')
    } else if (data.statut === 'expiree') {
      setScanError('Carte expirée')
    } else {
      carteFoundRef.current = true
      setCarte(data)
      if (rfidModeRef.current) setTimeout(() => montantRef.current?.focus(), 100)
    }
    setScanLoading(false)
  }

  const handleDebit = async () => {
    if (!montant || !carte) return
    const amt = parseFloat(montant)
    if (amt > carte.solde) { setScanError('Solde insuffisant'); return }
    setScanLoading(true)
    const nouveauSolde = carte.solde - amt
    const pts = Math.round(amt / 100 * 1.5)
    await supabase.from('cartes').update({ solde: nouveauSolde, points: carte.points + pts }).eq('id', carte.id)
    await supabase.from('transactions').insert({
      carte_id: carte.id, type: 'debit', montant: amt,
      points_gagnes: pts, description: `Débit en salon — ${amt} DA`,
    })
    setCarte({ ...carte, solde: nouveauSolde, points: carte.points + pts })
    setScanSuccess(`${amt.toLocaleString('fr-FR')} DA débités · +${pts} pts`)
    setMontant('')
    setScanLoading(false)
    setStats(s => ({ ...s, transactions: s.transactions + 1 }))
    if (rfidModeRef.current) {
      setTimeout(() => {
        setUid(''); setCarte(null); carteFoundRef.current = false
        setScanSuccess(''); uidRef.current?.focus()
      }, 2000)
    }
  }

  const resetScan = () => {
    setUid(''); setCarte(null); carteFoundRef.current = false
    setScanError(''); setScanSuccess(''); setMontant('')
    if (rfidModeRef.current) setTimeout(() => uidRef.current?.focus(), 50)
  }

  const toggleRfidMode = () => {
    const next = !rfidMode
    setRfidMode(next)
    rfidModeRef.current = next
    if (next) {
      setUid(''); setCarte(null); carteFoundRef.current = false
      setScanError(''); setScanSuccess(''); setMontant('')
      setTimeout(() => uidRef.current?.focus(), 60)
    }
  }

  const handleUidBlur = () => {
    if (!rfidModeRef.current || carteFoundRef.current) return
    setTimeout(() => {
      if (rfidModeRef.current && !carteFoundRef.current) uidRef.current?.focus()
    }, 100)
  }

  const secondary = [
    { label: 'Scanner',      sub: 'Lire & débiter une carte',    href: '/dashboard/scanner',      icon: '◈' },
    { label: 'Caisse POS',   sub: 'Paiement RFID / QR code',     href: '/dashboard/caisse',       icon: '⊞' },
    { label: 'Clients',      sub: 'Fiches & fidélité',           href: '/dashboard/clients',      icon: '⊹' },
    { label: 'Recharge',     sub: 'Ajouter du solde',            href: '/dashboard/recharge',     icon: '◎' },
    { label: 'Produits',     sub: 'Soins, tarifs & catalogue',   href: '/dashboard/produits',     icon: '✦' },
    { label: 'Statistiques', sub: "Chiffre d'affaires & KPIs",   href: '/dashboard/statistiques', icon: '≋' },
    { label: 'Historique',   sub: 'Toutes les transactions',     href: '/dashboard/transactions', icon: '≡' },
    { label: 'Admin',        sub: 'Employés & paramètres',       href: '/dashboard/admin',        icon: '◬' },
  ]

  const niveau = carte?.niveau || 'Bronze'

  return (
    <div className="min-h-screen bg-[#F7F4EE]">
      <style>{`
        @keyframes rfid-dot-pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.4; transform: scale(0.75); }
        }
        @keyframes rfid-border-glow {
          0%, 100% { box-shadow: 0 0 0 1px rgba(186,117,23,0.55), 0 0 8px rgba(186,117,23,0.2); }
          50% { box-shadow: 0 0 0 2px rgba(186,117,23,1), 0 0 18px rgba(186,117,23,0.45); }
        }
      `}</style>

      {/* Notification Realtime */}
      {scanNotif && (
        <div className="fixed top-4 right-4 z-50 bg-[#2C2A25] text-[#F7F4EE] px-5 py-3 rounded-2xl shadow-lg text-sm font-medium border border-[#BA7517]/40">
          {scanNotif}
        </div>
      )}

      {/* ── DARK HERO ── */}
      <div className="bg-gradient-to-b from-[#18160F] to-[#2C2A25] border-b border-[#BA7517]/[0.18]">
        <div className="max-w-[1040px] mx-auto px-6 md:px-12 py-6 md:py-8">

          {/* NAV */}
          <div className="flex items-center justify-between mb-6 md:mb-8 pb-5 border-b border-[#F7F4EE]/[0.06]">
            <div className="flex items-center gap-4">
              <div className="w-6 h-px bg-[#BA7517] opacity-80" />
              <h1 className="font-display text-2xl md:text-3xl font-light tracking-[0.5em] text-[#F7F4EE] uppercase leading-none">
                Hadiya
              </h1>
              <div className="w-6 h-px bg-[#BA7517] opacity-80" />
            </div>
            <div className="flex flex-col items-end gap-1.5">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-[#BA7517]/15 border border-[#BA7517]/30 flex items-center justify-center">
                  <span className="text-[10px] font-semibold text-[#BA7517] uppercase">{salonNom?.[0] || 'S'}</span>
                </div>
                <span className="text-xs font-medium text-[#F7F4EE]/60 max-w-[120px] truncate capitalize">{salonNom}</span>
              </div>
              <button onClick={handleLogout} className="text-[8px] tracking-[0.25em] text-[#F7F4EE] opacity-20 uppercase hover:opacity-50 transition-opacity">
                Déconnexion
              </button>
            </div>
          </div>

          {/* STATS + SCANNER */}
          <div className="flex flex-col md:flex-row gap-6 md:gap-10 md:items-start">

            {/* Stats */}
            <div className="flex items-center gap-5 md:gap-7 flex-shrink-0">
              {[
                { label: 'Cartes actives', value: stats.cartes },
                { label: 'Clients',        value: stats.clients },
                { label: 'Transactions',   value: stats.transactions },
              ].map((s, i) => (
                <div key={s.label} className="flex items-center gap-5 md:gap-7">
                  <div className="flex flex-col">
                    <span className="text-2xl md:text-3xl font-light text-[#BA7517] leading-none tabular-nums">{s.value}</span>
                    <span className="text-[7px] tracking-[0.25em] uppercase text-[#F7F4EE]/25 font-medium mt-1">{s.label}</span>
                  </div>
                  {i < 2 && <div className="w-px h-7 bg-[#F7F4EE]/[0.08]" />}
                </div>
              ))}
            </div>

            <div className="hidden md:block w-px self-stretch bg-[#F7F4EE]/[0.08]" />

            {/* ── SCANNER ── */}
            <div className="flex-1 min-w-0">
              {!carte ? (
                <div className="flex flex-col gap-2">
                  <div className="flex items-center justify-between mb-0.5">
                    <p className="text-[8px] tracking-[0.28em] uppercase text-[#F7F4EE]/30 font-medium">
                      Scanner une carte
                    </p>
                    <button
                      onClick={toggleRfidMode}
                      className="text-[8px] font-bold tracking-[0.1em] uppercase px-2.5 py-1 rounded-full transition-all whitespace-nowrap"
                      style={{
                        background: rfidMode ? '#BA7517' : 'transparent',
                        color:      rfidMode ? '#ffffff' : '#BA7517',
                        border:     rfidMode ? 'none'    : '1px solid rgba(186,117,23,0.4)',
                      }}
                    >
                      {rfidMode ? 'RFID ON' : 'Mode RFID'}
                    </button>
                  </div>

                  {rfidMode && (
                    <div
                      className="flex items-center gap-2 px-3 py-2 rounded-xl"
                      style={{ background: 'rgba(186,117,23,0.07)', border: '1px solid rgba(186,117,23,0.18)' }}
                    >
                      <div style={{
                        width: '6px', height: '6px', borderRadius: '50%',
                        background: '#BA7517', flexShrink: 0,
                        animation: 'rfid-dot-pulse 1.2s ease-in-out infinite',
                      }} />
                      <p className="text-[9px] tracking-[0.15em] uppercase font-medium" style={{ color: '#BA7517' }}>
                        En attente de la carte...
                      </p>
                    </div>
                  )}

                  <div className="flex gap-2">
                    <input
                      ref={uidRef}
                      placeholder={rfidMode ? 'Approcher la carte RFID...' : 'UID ou QR code...'}
                      value={uid}
                      onChange={e => setUid(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && handleScan()}
                      onBlur={handleUidBlur}
                      className="flex-1 bg-[#F7F4EE]/[0.07] border border-[#F7F4EE]/[0.1] rounded-xl px-4 py-2.5 text-sm text-[#F7F4EE] placeholder:text-[#F7F4EE]/20 outline-none focus:border-[#BA7517]/60 transition-colors"
                      style={rfidMode ? { animation: 'rfid-border-glow 1.5s ease-in-out infinite' } : {}}
                    />
                    <button
                      onClick={handleScan}
                      disabled={scanLoading || !uid}
                      className="bg-[#BA7517] text-white rounded-xl px-4 py-2.5 text-xs font-medium hover:bg-[#A36714] transition-colors disabled:opacity-40 whitespace-nowrap"
                    >
                      {scanLoading ? '...' : '→'}
                    </button>
                  </div>
                  {scanError && <p className="text-[11px] text-rose-400">{scanError}</p>}
                </div>

              ) : (
                <div className="bg-[#F7F4EE]/[0.05] border border-[#F7F4EE]/[0.1] rounded-2xl overflow-hidden">
                  <div className="flex items-start gap-3 px-4 py-3.5 border-b border-[#F7F4EE]/[0.07]">
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-xs font-semibold flex-shrink-0 mt-0.5 ${NIVEAU_AVATAR[niveau]}`}>
                      {carte.clients?.prenom?.[0]?.toUpperCase()}{carte.clients?.nom?.[0]?.toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-[#F7F4EE] truncate">
                        {carte.clients?.prenom} {carte.clients?.nom}
                      </p>
                      <p className="text-[10px] text-[#F7F4EE]/35 mt-0.5">
                        {carte.niveau} · {carte.points} pts
                        {carte.clients?.telephone ? ` · ${carte.clients.telephone}` : ''}
                      </p>
                    </div>
                    <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
                      <p className="text-base font-light" style={{ color: '#BA7517' }}>
                        {carte.solde?.toLocaleString('fr-FR')}
                        <span className="text-[10px] text-[#F7F4EE]/30 ml-1">DA</span>
                      </p>
                      <button
                        onClick={() => router.push(`/dashboard/clients/${carte.clients?.id}`)}
                        className="text-[8px] tracking-[0.08em] uppercase font-semibold px-2 py-0.5 rounded-md transition-all whitespace-nowrap hover:opacity-80"
                        style={{ color: '#BA7517', border: '1px solid rgba(186,117,23,0.35)' }}
                      >
                        Voir fiche →
                      </button>
                    </div>
                    <button
                      onClick={resetScan}
                      className="text-[#F7F4EE]/20 hover:text-[#F7F4EE]/60 transition-colors text-lg leading-none ml-1 mt-0.5 flex-shrink-0"
                    >
                      ×
                    </button>
                  </div>
                  <div className="px-4 py-3 flex flex-col gap-2">
                    {scanSuccess && (
                      <p className="text-[11px] font-medium" style={{ color: '#BA7517' }}>✓ {scanSuccess}</p>
                    )}
                    {scanError && <p className="text-[11px] text-rose-400">{scanError}</p>}
                    <div className="flex gap-2">
                      <input
                        ref={montantRef}
                        type="number"
                        placeholder="Montant à débiter (DA)"
                        value={montant}
                        onChange={e => { setMontant(e.target.value); setScanError(''); setScanSuccess('') }}
                        onKeyDown={e => e.key === 'Enter' && handleDebit()}
                        className="flex-1 bg-[#F7F4EE]/[0.07] border border-[#F7F4EE]/[0.1] rounded-xl px-3 py-2 text-sm text-[#F7F4EE] placeholder:text-[#F7F4EE]/20 outline-none focus:border-[#BA7517]/60 transition-colors"
                      />
                      <button
                        onClick={handleDebit}
                        disabled={scanLoading || !montant}
                        className="bg-[#BA7517] text-white rounded-xl px-4 py-2 text-xs font-medium hover:bg-[#A36714] transition-colors disabled:opacity-40 whitespace-nowrap"
                      >
                        {scanLoading ? '...' : 'Débiter'}
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ── CREAM ZONE ── */}
      <div className="max-w-[1040px] mx-auto px-6 md:px-12 pt-8 md:pt-11 pb-16 md:pb-[72px]">
        <button
          className="hd-fade w-full bg-[#BA7517] border border-[#BA7517]/35 rounded-[22px] px-6 py-7 md:px-10 md:py-[34px] mb-3.5 flex items-center justify-between cursor-pointer shadow-[0_8px_36px_rgba(186,117,23,0.28)] text-left hover:bg-[#A36714] hover:shadow-[0_16px_48px_rgba(186,117,23,0.5)] hover:-translate-y-0.5 active:translate-y-0 transition-all duration-200"
          onClick={() => router.push('/dashboard/cartes/nouvelle')}
        >
          <div>
            <p className="font-display text-2xl md:text-[2.4rem] font-normal text-[#FFF6E0] leading-none tracking-[0.02em]">
              Nouvelle carte cadeau
            </p>
            <p className="text-xs text-[#FFF6E0]/50 mt-2 tracking-[0.05em]">
              Créer &amp; offrir une expérience unique
            </p>
          </div>
          <div className="w-12 h-12 md:w-[60px] md:h-[60px] rounded-2xl bg-white/[0.14] border border-white/[0.22] flex items-center justify-center text-xl md:text-2xl text-[#FFF6E0] shrink-0">
            ✦
          </div>
        </button>

        <div className="grid grid-cols-2 gap-3 md:gap-3.5">
          {secondary.map((a, i) => (
            <button
              key={a.href}
              className={`hd-fade hd-card text-left cursor-pointer shadow-[0_2px_20px_rgba(20,18,14,0.25)] hover:border-[#BA7517]/35 hover:-translate-y-0.5 hover:shadow-[0_12px_40px_rgba(20,18,14,0.45)] active:-translate-y-px transition-all duration-200 ${CARD_DELAYS[i]} ${
                i === 7
                  ? 'col-span-2 flex flex-row items-center gap-4 md:gap-5 py-6 md:py-7 px-6 md:px-9'
                  : 'flex flex-col items-start py-6 md:py-[30px] px-5 md:px-8'
              }`}
              onClick={() => router.push(a.href)}
            >
              <div className={`w-11 h-11 md:w-[46px] md:h-[46px] rounded-xl md:rounded-[13px] bg-[#BA7517]/[0.09] border border-[#BA7517]/[0.22] flex items-center justify-center text-[17px] md:text-[19px] text-[#BA7517] shrink-0 ${i === 7 ? '' : 'mb-4 md:mb-[22px]'}`}>
                {a.icon}
              </div>
              <div className={i === 7 ? 'flex-1' : ''}>
                <p className="text-sm md:text-[15px] font-semibold text-[#F7F4EE] tracking-[0.025em] mb-1">{a.label}</p>
                <p className="text-[10px] md:text-[11px] text-[#F7F4EE]/30 tracking-[0.05em] leading-relaxed">{a.sub}</p>
              </div>
              {i === 7 && <span className="text-base md:text-lg text-[#BA7517] opacity-45">→</span>}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}