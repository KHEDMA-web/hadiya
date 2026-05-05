'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

export default function Dashboard() {
  const [stats, setStats] = useState({ cartes: 0, clients: 0, transactions: 0 })
  const router = useRouter()

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
    }
    init()
  }, [])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }

  const actions = [
    { icon: '🎁', label: 'Nouvelle carte cadeau', sub: 'Créer et envoyer une carte', href: '/dashboard/cartes/nouvelle', dark: true },
    { icon: '📷', label: 'Scanner une carte', sub: 'Valider ou débiter', href: '/dashboard/scanner', dark: false },
    { icon: '🛎️', label: 'Caisse POS', sub: 'Paiement par carte RFID/QR', href: '/dashboard/caisse', dark: false },
    { icon: '👥', label: 'Clients', sub: 'Gérer les fiches clients', href: '/dashboard/clients', dark: false },
    { icon: '💳', label: 'Recharge solde', sub: 'Ajouter du solde à une carte', href: '/dashboard/recharge', dark: false },
  ]

  return (
    <div className="min-h-screen bg-[#F7F4EE]">
      <div className="bg-white border-b border-[#D4CBBA] px-6 py-4 flex justify-between items-center">
        <div>
          <h1 className="text-lg font-medium text-[#2C2A25]">Hadiya</h1>
          <p className="text-xs text-[#8A8275]">Dashboard salon</p>
        </div>
        <button onClick={handleLogout} className="text-xs text-[#8A8275] hover:text-[#2C2A25] transition">
          Déconnexion
        </button>
      </div>

      <div className="p-6 max-w-4xl mx-auto">
        <div className="grid grid-cols-3 gap-4 mb-8">
          {[
            { label: 'Cartes actives', value: stats.cartes, bg: '#EAF3DE', color: '#27500A' },
            { label: 'Clients', value: stats.clients, bg: '#FAEEDA', color: '#633806' },
            { label: 'Transactions', value: stats.transactions, bg: '#EEEDFE', color: '#3C3489' },
          ].map(s => (
            <div key={s.label} style={{ background: s.bg }} className="rounded-2xl p-5 border border-[#D4CBBA]">
              <div className="text-3xl font-medium mb-1" style={{ color: s.color }}>{s.value}</div>
              <div className="text-xs" style={{ color: s.color, opacity: 0.7 }}>{s.label}</div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-2 gap-4">
          {actions.map(a => (
            <button
              key={a.href}
              onClick={() => router.push(a.href)}
              className={`rounded-2xl p-6 text-left hover:opacity-90 transition border ${
                a.dark
                  ? 'bg-[#2C2A25] text-[#F7F4EE] border-[#2C2A25]'
                  : 'bg-white text-[#2C2A25] border-[#D4CBBA] hover:border-[#2C2A25]'
              }`}
            >
              <div className="text-2xl mb-3">{a.icon}</div>
              <div className="font-medium mb-1">{a.label}</div>
              <div className={`text-xs ${a.dark ? 'opacity-60' : 'text-[#8A8275]'}`}>{a.sub}</div>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}