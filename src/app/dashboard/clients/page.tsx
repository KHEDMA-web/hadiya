'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

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

  const niveauColor: Record<string, { bg: string; text: string }> = {
    Bronze: { bg: '#FAECE7', text: '#712B13' },
    Argent: { bg: '#F1EFE8', text: '#444441' },
    Or: { bg: '#FAEEDA', text: '#633806' },
    Platine: { bg: '#EEEDFE', text: '#3C3489' },
  }

  return (
    <div className="min-h-screen bg-[#F7F4EE]">
      <div className="bg-white border-b border-[#D4CBBA] px-6 py-4 flex items-center gap-4">
        <button onClick={() => router.push('/dashboard')} className="text-[#8A8275] hover:text-[#2C2A25]">←</button>
        <div className="flex-1">
          <h1 className="text-base font-medium text-[#2C2A25]">Clients</h1>
          <p className="text-xs text-[#8A8275]">{clients.length} clients enregistrés</p>
        </div>
      </div>

      <div className="p-6 max-w-2xl mx-auto">
        <input
          placeholder="Rechercher un client..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full border border-[#D4CBBA] rounded-xl px-4 py-3 text-sm text-[#2C2A25] outline-none focus:border-[#2C2A25] bg-white mb-4"
        />

        {loading && <p className="text-sm text-[#8A8275] text-center py-8">Chargement...</p>}

        <div className="flex flex-col gap-3">
          {filtered.map(client => {
            const carte = client.cartes?.[0]
            const niveau = carte?.niveau || 'Bronze'
            const colors = niveauColor[niveau] || niveauColor.Bronze
            return (
              <div key={client.id} className="bg-white border border-[#D4CBBA] rounded-2xl p-4 flex items-center gap-4">
                <div className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium flex-shrink-0"
                  style={{ background: colors.bg, color: colors.text }}>
                  {client.prenom?.[0]}{client.nom?.[0]}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-[#2C2A25] text-sm">{client.prenom} {client.nom}</p>
                  <p className="text-xs text-[#8A8275]">{client.telephone || 'Pas de téléphone'}</p>
                </div>
                <div className="text-right flex-shrink-0">
                  {carte && (
                    <>
                      <p className="text-sm font-medium text-[#2C2A25]">{carte.solde?.toLocaleString('fr-FR')} DA</p>
                      <span className="text-xs font-medium px-2 py-0.5 rounded-full"
                        style={{ background: colors.bg, color: colors.text }}>
                        {niveau}
                      </span>
                    </>
                  )}
                </div>
              </div>
            )
          })}
          {!loading && filtered.length === 0 && (
            <p className="text-sm text-[#8A8275] text-center py-8">Aucun client trouvé</p>
          )}
        </div>
      </div>
    </div>
  )
}
