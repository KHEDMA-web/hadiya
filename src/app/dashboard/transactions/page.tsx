'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import BackButton from '../_components/BackButton'
import { getUserProfile } from '@/lib/auth'

type Transaction = {
  id: string
  carte_id: string
  type: 'debit' | 'recharge' | 'cadeau'
  montant: number
  points_gagnes?: number
  description: string
  created_at: string
  cartes?: {
    uid_rfid: string
    type: string
    niveau: string
    clients?: { prenom: string; nom: string; telephone: string }
  }
}

const TYPE_CONFIG = {
  debit:    { label: 'Débit',    sign: '−', badge: 'bg-rose-500/10 text-rose-500 border-rose-500/20',       montant: 'text-rose-500' },
  recharge: { label: 'Recharge', sign: '+', badge: 'bg-emerald-600/10 text-emerald-600 border-emerald-600/20', montant: 'text-emerald-600' },
  cadeau:   { label: 'Cadeau',   sign: '✦', badge: 'bg-[#BA7517]/10 text-[#BA7517] border-[#BA7517]/20',    montant: 'text-[#BA7517]' },
}

const NIVEAU_AVATAR: Record<string, string> = {
  Bronze:  'bg-[#C4813A]/20 text-[#C4813A]',
  Argent:  'bg-[#8A8275]/20 text-[#8A8275]',
  Or:      'bg-[#BA7517]/20 text-[#BA7517]',
  Platine: 'bg-[#7C6FAE]/20 text-[#7C6FAE]',
}

export default function Transactions() {
  const router = useRouter()
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filterType, setFilterType] = useState<'all' | 'debit' | 'recharge' | 'cadeau'>('all')

  useEffect(() => {
    const init = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) { router.push('/login'); return }
      const profile = await getUserProfile()
      const sid = profile?.salonId
      const q = supabase
        .from('transactions')
        .select('*, cartes(uid_rfid, type, niveau, clients(prenom, nom, telephone))')
        .order('created_at', { ascending: false })
      const { data } = sid ? await q.eq('salon_id', sid) : await q
      setTransactions(data || [])
      setLoading(false)
    }
    init()
  }, [])

  const filtered = transactions.filter(t => {
    const client = t.cartes?.clients
    const clientName = client ? `${client.prenom} ${client.nom} ${client.telephone}` : ''
    const matchSearch = clientName.toLowerCase().includes(search.toLowerCase()) ||
      t.description?.toLowerCase().includes(search.toLowerCase())
    const matchType = filterType === 'all' || t.type === filterType
    return matchSearch && matchType
  })

  const totalDebit    = filtered.filter(t => t.type === 'debit').reduce((s, t) => s + (t.montant || 0), 0)
  const totalRecharge = filtered.filter(t => t.type === 'recharge').reduce((s, t) => s + (t.montant || 0), 0)

  const formatDate = (iso: string) =>
    new Date(iso).toLocaleDateString('fr-FR', {
      day: '2-digit', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit'
    })

  return (
    <div className="min-h-screen bg-[#E8E2D5]">

      {/* Header */}
      <div className="bg-[#2C2A25] px-6 py-4 flex items-center gap-4 shadow-lg">
        <BackButton href="/dashboard" />
        <div>
          <h1 className="text-base font-medium text-[#F7F4EE]">Historique</h1>
          <p className="text-xs text-[#BA7517]">
            {transactions.length} transaction{transactions.length > 1 ? 's' : ''}
          </p>
        </div>
      </div>

      <div className="p-6 max-w-2xl mx-auto">

        {/* Stats */}
        <div className="grid grid-cols-2 gap-3 mb-5">
          <div className="bg-white border border-[#C4B89E] rounded-2xl p-5 shadow-md">
            <p className="text-[9px] tracking-[0.2em] uppercase text-[#8A8275] mb-2">Total débité</p>
            <p className="text-3xl font-light text-[#2C2A25]">
              {totalDebit.toLocaleString('fr-FR')}
              <span className="text-xs text-[#8A8275] ml-1">DA</span>
            </p>
          </div>
          <div className="bg-[#2C2A25] border border-[#3A3830] rounded-2xl p-5 shadow-md">
            <p className="text-[9px] tracking-[0.2em] uppercase text-[#8A8275] mb-2">Total rechargé</p>
            <p className="text-3xl font-light text-[#BA7517]">
              {totalRecharge.toLocaleString('fr-FR')}
              <span className="text-xs text-[#8A8275] ml-1">DA</span>
            </p>
          </div>
        </div>

        {/* Recherche */}
        <div className="relative mb-3">
          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[#8A8275] text-sm pointer-events-none">◎</span>
          <input
            placeholder="Rechercher par client ou description..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full border border-[#C4B89E] rounded-2xl pl-10 pr-5 py-3.5 text-sm text-[#2C2A25] outline-none focus:border-[#BA7517] focus:ring-1 focus:ring-[#BA7517]/20 bg-white shadow-md transition-colors placeholder:text-[#B0A898]"
          />
        </div>

        {/* Filtres */}
        <div className="flex gap-2 mb-5">
          {(['all', 'debit', 'recharge', 'cadeau'] as const).map(type => (
            <button
              key={type}
              onClick={() => setFilterType(type)}
              className={`text-[9px] px-3.5 py-2 rounded-xl border tracking-[0.12em] uppercase font-medium transition-all duration-200 ${
                filterType === type
                  ? 'bg-[#2C2A25] text-[#F7F4EE] border-[#2C2A25] shadow-md'
                  : 'bg-white text-[#8A8275] border-[#C4B89E] hover:border-[#BA7517] hover:text-[#2C2A25]'
              }`}
            >
              {type === 'all' ? 'Tout' : TYPE_CONFIG[type].label}
            </button>
          ))}
        </div>

        {/* Chargement */}
        {loading && (
          <div className="flex flex-col items-center justify-center py-16 gap-3">
            <div className="w-6 h-6 rounded-full border-2 border-[#C4B89E] border-t-[#BA7517] animate-spin" />
            <p className="text-[9px] tracking-[0.25em] uppercase text-[#8A8275]">Chargement</p>
          </div>
        )}

        {/* Liste */}
        <div className="flex flex-col gap-3">
          {filtered.map(t => {
            const cfg = TYPE_CONFIG[t.type] || TYPE_CONFIG.debit
            const client = t.cartes?.clients
            const niveau = t.cartes?.niveau || 'Bronze'
            const avatarStyle = NIVEAU_AVATAR[niveau] || NIVEAU_AVATAR.Bronze

            return (
              <div key={t.id} className="bg-white border border-[#C4B89E] rounded-2xl p-4 flex items-center gap-4 shadow-md hover:shadow-lg hover:border-[#BA7517]/50 transition-all duration-200">
                {/* Avatar */}
                <div className={`w-11 h-11 rounded-xl flex items-center justify-center text-sm font-semibold flex-shrink-0 ${avatarStyle}`}>
                  {client
                    ? `${client.prenom?.[0]?.toUpperCase() || ''}${client.nom?.[0]?.toUpperCase() || ''}`
                    : '?'}
                </div>

                {/* Infos */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-[#2C2A25] truncate">
                    {client ? `${client.prenom} ${client.nom}` : 'Carte anonyme'}
                  </p>
                  <p className="text-[10px] text-[#8A8275] truncate mt-0.5">{t.description || '—'}</p>
                  <p className="text-[9px] text-[#8A8275]/60 mt-1">{formatDate(t.created_at)}</p>
                </div>

                {/* Montant & badge */}
                <div className="text-right flex-shrink-0 flex flex-col items-end gap-1">
                  <p className={`text-sm font-semibold ${cfg.montant}`}>
                    {cfg.sign}{t.type !== 'cadeau' ? ` ${t.montant?.toLocaleString('fr-FR')} DA` : ''}
                  </p>
                  <span className={`text-[9px] font-medium px-2 py-0.5 rounded-lg tracking-[0.1em] uppercase border ${cfg.badge}`}>
                    {cfg.label}
                  </span>
                  {t.points_gagnes ? (
                    <p className="text-[9px] text-[#8A8275]">+{t.points_gagnes} pts</p>
                  ) : null}
                </div>
              </div>
            )
          })}

          {!loading && filtered.length === 0 && (
            <div className="flex flex-col items-center justify-center py-16 gap-3 opacity-40">
              <div className="text-3xl">≡</div>
              <p className="text-[9px] tracking-[0.25em] uppercase text-[#2C2A25]">Aucune transaction trouvée</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
