'use client'
import { useRouter } from 'next/navigation'
import BackButton from '../_components/BackButton'

const sections = [
  {
    label: 'Employés',
    sub: 'Gérer l\'équipe & les accès',
    href: '/dashboard/admin/employes',
    icon: '⊹',
  },
  {
    label: 'Paramètres',
    sub: 'Salon, abonnement & configuration',
    href: '/dashboard/admin/parametres',
    icon: '⊞',
  },
]

export default function Admin() {
  const router = useRouter()

  return (
    <div className="min-h-screen bg-[#E8E2D5]">

      {/* Header */}
      <div className="bg-[#2C2A25] px-6 py-4 flex items-center gap-4 shadow-lg">
        <BackButton href="/dashboard" />
        <div>
          <h1 className="text-base font-medium text-[#F7F4EE]">Administration</h1>
          <p className="text-xs text-[#BA7517]">Gestion du salon</p>
        </div>
      </div>

      <div className="p-6 max-w-lg mx-auto flex flex-col gap-4 pt-8">
        <p className="text-[9px] tracking-[0.3em] uppercase text-[#8A8275] font-medium mb-1">
          Espace administrateur
        </p>
        {sections.map(s => (
          <button
            key={s.href}
            onClick={() => router.push(s.href)}
            className="bg-white border border-[#C4B89E] rounded-2xl px-6 py-5 flex items-center gap-4 shadow-md hover:shadow-lg hover:border-[#BA7517] hover:-translate-y-0.5 active:translate-y-0 transition-all duration-200 text-left w-full"
          >
            <div className="w-11 h-11 rounded-xl bg-[#BA7517]/10 border border-[#BA7517]/25 flex items-center justify-center text-lg text-[#BA7517] flex-shrink-0">
              {s.icon}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-[#2C2A25] tracking-wide">{s.label}</p>
              <p className="text-[11px] text-[#8A8275] mt-0.5">{s.sub}</p>
            </div>
            <span className="text-[#BA7517] opacity-50 text-lg flex-shrink-0">→</span>
          </button>
        ))}
      </div>
    </div>
  )
}
