'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import BackButton from '../_components/BackButton'

type CommandeItem = {
  id: string
  nom: string
  prix: number
  quantite: number
  emoji: string
}

type Commande = {
  id: string
  total: number
  statut: string
  created_at: string
  clients?: { prenom: string; nom: string }
  commande_items?: CommandeItem[]
}

const STATUT_CONFIG: Record<string, { label: string; badge: string }> = {
  payee:    { label: 'Payée',    badge: 'bg-emerald-600/10 text-emerald-600 border-emerald-600/20' },
  en_cours: { label: 'En cours', badge: 'bg-[#BA7517]/10 text-[#BA7517] border-[#BA7517]/20' },
  annulee:  { label: 'Annulée',  badge: 'bg-rose-500/10 text-rose-500 border-rose-500/20' },
}

export default function Commandes() {
  const router = useRouter()
  const [commandes, setCommandes] = useState<Commande[]>([])
  const [loading, setLoading] = useState(true)
  const [expanded, setExpanded] = useState<string | null>(null)
  const [search, setSearch] = useState('')

  useEffect(() => {
    const init = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) { router.push('/login'); return }
      const { data } = await supabase
        .from('commandes')
        .select('*, clients(prenom, nom), commande_items(id, nom, prix, quantite, emoji)')
        .order('created_at', { ascending: false })
        .limit(100)
      setCommandes(data || [])
      setLoading(false)
    }
    init()
  }, [])

  const filtered = commandes.filter(c => {
    const client = c.clients
    const name = client ? `${client.prenom} ${client.nom}` : ''
    return name.toLowerCase().includes(search.toLowerCase())
  })

  const totalCA = filtered.reduce((s, c) => s + (c.total || 0), 0)

  const formatDate = (iso: string) =>
    new Date(iso).toLocaleDateString('fr-FR', {
      day: '2-digit', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    })

  return (
    <div className="min-h-screen bg-[#E8E2D5]">

      <div className="bg-[#2C2A25] px-6 py-4 flex items-center gap-4 shadow-lg">
        <BackButton href="/dashboard" />
        <div className="flex-1">
          <h1 className="text-base font-medium text-[#F7F4EE]">Commandes</h1>
          <p className="text-xs text-[#BA7517]">
            {commandes.length} commande{commandes.length > 1 ? 's' : ''}
          </p>
        </div>
      </div>

      <div className="p-6 max-w-2xl mx-auto">

        {/* Stats */}
        <div className="grid grid-cols-2 gap-3 mb-5">
          <div className="bg-white border border-[#C4B89E] rounded-2xl p-5 shadow-md">
            <p className="text-[9px] tracking-[0.2em] uppercase text-[#8A8275] mb-2">CA total</p>
            <p className="text-3xl font-light text-[#2C2A25]">
              {totalCA.toLocaleString('fr-FR')}
              <span className="text-xs text-[#8A8275] ml-1">DA</span>
            </p>
          </div>
          <div className="bg-[#2C2A25] border border-[#3A3830] rounded-2xl p-5 shadow-md">
            <p className="text-[9px] tracking-[0.2em] uppercase text-[#8A8275] mb-2">Commandes</p>
            <p className="text-3xl font-light text-[#BA7517]">{filtered.length}</p>
          </div>
        </div>

        {/* Recherche */}
        <div className="relative mb-5">
          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[#8A8275] text-sm pointer-events-none">◎</span>
          <input
            placeholder="Rechercher par client..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full border border-[#C4B89E] rounded-2xl pl-10 pr-5 py-3.5 text-sm text-[#2C2A25] outline-none focus:border-[#BA7517] focus:ring-1 focus:ring-[#BA7517]/20 bg-white shadow-md transition-colors placeholder:text-[#B0A898]"
          />
        </div>

        {loading && (
          <div className="flex flex-col items-center justify-center py-16 gap-3">
            <div className="w-6 h-6 rounded-full border-2 border-[#C4B89E] border-t-[#BA7517] animate-spin" />
            <p className="text-[9px] tracking-[0.25em] uppercase text-[#8A8275]">Chargement</p>
          </div>
        )}

        <div className="flex flex-col gap-3">
          {filtered.map(c => {
            const cfg = STATUT_CONFIG[c.statut] || STATUT_CONFIG.payee
            const client = c.clients
            const isOpen = expanded === c.id
            const items = c.commande_items || []

            return (
              <div key={c.id}
                className="bg-white border border-[#C4B89E] rounded-2xl shadow-md hover:shadow-lg hover:border-[#BA7517]/50 transition-all duration-200 overflow-hidden">

                {/* Row principal */}
                <button
                  onClick={() => setExpanded(isOpen ? null : c.id)}
                  className="w-full flex items-center gap-4 p-4 text-left"
                >
                  <div className="w-11 h-11 rounded-xl bg-[#BA7517]/10 border border-[#BA7517]/20 flex items-center justify-center text-sm font-semibold text-[#BA7517] flex-shrink-0">
                    {client?.prenom?.[0]?.toUpperCase()}{client?.nom?.[0]?.toUpperCase() || '?'}
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-[#2C2A25] truncate">
                      {client ? `${client.prenom} ${client.nom}` : 'Client anonyme'}
                    </p>
                    <p className="text-[10px] text-[#8A8275] mt-0.5">
                      {items.length} article{items.length > 1 ? 's' : ''} · {formatDate(c.created_at)}
                    </p>
                  </div>

                  <div className="text-right flex-shrink-0 flex flex-col items-end gap-1.5">
                    <p className="text-sm font-semibold text-[#2C2A25]">
                      {c.total?.toLocaleString('fr-FR')} <span className="text-[10px] text-[#8A8275]">DA</span>
                    </p>
                    <span className={`text-[9px] font-medium px-2 py-0.5 rounded-lg tracking-[0.1em] uppercase border ${cfg.badge}`}>
                      {cfg.label}
                    </span>
                  </div>

                  <span className={`text-[#8A8275] text-xs ml-1 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}>▾</span>
                </button>

                {/* Détail articles */}
                {isOpen && items.length > 0 && (
                  <div className="border-t border-[#EDE8DE] px-4 pb-4 pt-3">
                    <p className="text-[9px] tracking-[0.2em] uppercase text-[#8A8275] mb-3">Détail</p>
                    <div className="flex flex-col gap-2">
                      {items.map(item => (
                        <div key={item.id} className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="text-base">{item.emoji}</span>
                            <span className="text-sm text-[#2C2A25]">{item.nom}</span>
                            {item.quantite > 1 && (
                              <span className="text-[10px] text-[#8A8275] bg-[#F0EBE2] rounded px-1.5 py-0.5">×{item.quantite}</span>
                            )}
                          </div>
                          <span className="text-sm font-medium text-[#2C2A25]">
                            {(item.prix * item.quantite).toLocaleString('fr-FR')} DA
                          </span>
                        </div>
                      ))}
                    </div>
                    <div className="flex justify-between items-center mt-3 pt-3 border-t border-[#EDE8DE]">
                      <span className="text-[10px] uppercase tracking-[0.15em] text-[#8A8275]">Total</span>
                      <span className="text-base font-semibold text-[#BA7517]">
                        {c.total?.toLocaleString('fr-FR')} DA
                      </span>
                    </div>
                  </div>
                )}
              </div>
            )
          })}

          {!loading && filtered.length === 0 && (
            <div className="flex flex-col items-center justify-center py-16 gap-3 opacity-40">
              <div className="text-3xl">⊞</div>
              <p className="text-[9px] tracking-[0.25em] uppercase text-[#2C2A25]">Aucune commande</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
