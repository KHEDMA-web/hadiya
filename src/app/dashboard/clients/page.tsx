'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

const NIVEAU: Record<string, { badge: string; text: string; avatar: string }> = {
  Bronze:  { badge: 'bg-[#C4813A]/15 text-[#C4813A] border-[#C4813A]/30',  text: '#C4813A', avatar: 'bg-[#C4813A]/20 text-[#C4813A]' },
  Argent:  { badge: 'bg-[#8A8275]/15 text-[#8A8275] border-[#8A8275]/30',  text: '#8A8275', avatar: 'bg-[#8A8275]/20 text-[#8A8275]' },
  Or:      { badge: 'bg-[#BA7517]/15 text-[#BA7517] border-[#BA7517]/30',  text: '#BA7517', avatar: 'bg-[#BA7517]/20 text-[#BA7517]' },
  Platine: { badge: 'bg-[#7C6FAE]/15 text-[#7C6FAE] border-[#7C6FAE]/30',  text: '#7C6FAE', avatar: 'bg-[#7C6FAE]/20 text-[#7C6FAE]' },
}

export default function Clients() {
  const router = useRouter()
  const [clients, setClients] = useState<any[]>([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase
      .from('clients')
      .select('*, cartes(*)')
      .order('created_at', { ascending: false })
      .then(({ data }) => {
        setClients(data || [])
        setLoading(false)
      })
  }, [])

  const filtered = clients.filter(c =>
    `${c.prenom} ${c.nom} ${c.telephone}`.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="min-h-screen bg-[#E8E2D5]">

      {/* Header */}
      <div className="bg-[#2C2A25] px-6 py-4 flex items-center gap-4 shadow-lg">
        <button
          onClick={() => router.push('/dashboard')}
          className="w-9 h-9 rounded-full border border-[#4A4840] flex items-center justify-center text-[#F7F4EE] opacity-70 hover:opacity-100 hover:border-[#BA7517] transition-all text-sm flex-shrink-0"
        >
          ←
        </button>
        <div>
          <h1 className="text-base font-medium text-[#F7F4EE]">Clients</h1>
          <p className="text-xs text-[#BA7517]">
            {clients.length} membre{clients.length > 1 ? 's' : ''} enregistré{clients.length > 1 ? 's' : ''}
          </p>
        </div>
      </div>

      <div className="p-6 max-w-2xl mx-auto">

        {/* Recherche */}
        <div className="relative mb-5">
          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[#8A8275] text-sm pointer-events-none">◎</span>
          <input
            placeholder="Rechercher par nom, prénom, téléphone..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full border border-[#C4B89E] rounded-2xl pl-10 pr-5 py-3.5 text-sm text-[#2C2A25] outline-none focus:border-[#BA7517] focus:ring-1 focus:ring-[#BA7517]/20 bg-white shadow-md transition-colors placeholder:text-[#B0A898]"
          />
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
          {filtered.map(client => {
            const carte = client.cartes?.[0]
            const niveau = carte?.niveau || 'Bronze'
            const style = NIVEAU[niveau] || NIVEAU.Bronze
            return (
              <div
                key={client.id}
                onClick={() => router.push(`/dashboard/clients/${client.id}`)}
                className="bg-white border border-[#C4B89E] rounded-2xl p-4 flex items-center gap-4 shadow-md hover:shadow-lg hover:border-[#BA7517] transition-all duration-200 cursor-pointer active:scale-[0.99]"
              >
                {/* Avatar */}
                <div className={`w-11 h-11 rounded-xl flex items-center justify-center text-sm font-semibold flex-shrink-0 ${style.avatar}`}>
                  {client.prenom?.[0]?.toUpperCase()}{client.nom?.[0]?.toUpperCase()}
                </div>

                {/* Infos */}
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-[#2C2A25] text-sm tracking-wide truncate">
                    {client.prenom} {client.nom}
                  </p>
                  <p className="text-[10px] text-[#8A8275] mt-0.5 tracking-wide">
                    {client.telephone || 'Aucun téléphone'}
                  </p>
                </div>

                {/* Carte & niveau */}
                <div className="text-right flex-shrink-0">
                  {carte ? (
                    <div className="flex flex-col items-end gap-1">
                      <p className="text-sm font-semibold text-[#2C2A25]">
                        {carte.solde?.toLocaleString('fr-FR')} <span className="text-[10px] text-[#8A8275] font-normal">DA</span>
                      </p>
                      <span className={`text-[9px] font-medium px-2 py-0.5 rounded-lg tracking-[0.1em] uppercase border ${style.badge}`}>
                        {niveau}
                      </span>
                    </div>
                  ) : (
                    <span className="text-[10px] text-[#8A8275] bg-[#E8E2D5] px-2.5 py-1 rounded-lg">Sans carte</span>
                  )}
                </div>
              </div>
            )
          })}

          {!loading && filtered.length === 0 && (
            <div className="flex flex-col items-center justify-center py-16 gap-3 opacity-40">
              <div className="text-3xl">⊹</div>
              <p className="text-[9px] tracking-[0.25em] uppercase text-[#2C2A25]">Aucun client trouvé</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
