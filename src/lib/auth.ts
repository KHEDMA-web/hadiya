import { supabase } from '@/lib/supabase'

export type Permissions = {
  dashboard: boolean
  caisse: boolean
  scanner: boolean
  clients: boolean
  recharge: boolean
  produits: boolean
  statistiques: boolean
  transactions: boolean
  admin: boolean
}

export type UserProfile = {
  isOwner: boolean
  nom: string
  prenom: string
  role: string
  permissions: Permissions
  salonNom: string
  salonId: string | null
}

export const OWNER_PERMISSIONS: Permissions = {
  dashboard: true,
  caisse: true,
  scanner: true,
  clients: true,
  recharge: true,
  produits: true,
  statistiques: true,
  transactions: true,
  admin: true,
}

export const ROLE_DEFAULTS: Record<string, Permissions> = {
  caissier: {
    dashboard: true, caisse: true, scanner: true,
    clients: false, recharge: false, produits: false,
    statistiques: false, transactions: false, admin: false,
  },
  receptionniste: {
    dashboard: true, caisse: false, scanner: true,
    clients: true, recharge: true, produits: false,
    statistiques: false, transactions: true, admin: false,
  },
  manager: {
    dashboard: true, caisse: true, scanner: true,
    clients: true, recharge: true, produits: true,
    statistiques: true, transactions: true, admin: false,
  },
}

export async function getUserProfile(): Promise<UserProfile | null> {
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) return null

  const userEmail = session.user.email || ''

  // Vérifie si c'est le propriétaire
  const { data: salon } = await supabase
    .from('salons')
    .select('id, nom, owner_id')
    .eq('email', userEmail)
    .single()

  if (salon?.owner_id === session.user.id) {
    return {
      isOwner: true,
      nom: '',
      prenom: userEmail.split('@')[0],
      role: 'proprio',
      permissions: OWNER_PERMISSIONS,
      salonNom: salon.nom || userEmail.split('@')[0],
      salonId: salon.id || null,
    }
  }

  // Sinon c'est un employé
  const { data: employe } = await supabase
    .from('employes')
    .select('nom, prenom, role, permissions, salon_id')
    .eq('user_id', session.user.id)
    .single()

  if (!employe) return null

  // Récupère le nom du salon via salon_id
  let salonNom = 'Salon'
  if (employe.salon_id) {
    const { data: salonData } = await supabase
      .from('salons')
      .select('nom')
      .eq('id', employe.salon_id)
      .single()
    if (salonData?.nom) salonNom = salonData.nom
  }

  return {
    isOwner: false,
    nom: employe.nom,
    prenom: employe.prenom,
    role: employe.role,
    permissions: employe.permissions as Permissions,
    salonNom,
    salonId: employe.salon_id || null,
  }
}
