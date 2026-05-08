import { supabase } from '@/lib/supabase'

export type ConfigFidelite = {
  fidelite_actif:   boolean
  points_par_100da: number
  seuil_argent:     number
  seuil_or:         number
  seuil_platine:    number
}

export const DEFAULT_CONFIG: ConfigFidelite = {
  fidelite_actif:   true,
  points_par_100da: 2,
  seuil_argent:     500,
  seuil_or:         1500,
  seuil_platine:    3000,
}

export async function getConfigFidelite(userId: string): Promise<ConfigFidelite> {
  const { data } = await supabase
    .from('salons')
    .select('fidelite_actif, points_par_100da, seuil_argent, seuil_or, seuil_platine')
    .eq('user_id', userId)
    .single()
  if (!data) return DEFAULT_CONFIG
  return {
    fidelite_actif:   data.fidelite_actif   ?? DEFAULT_CONFIG.fidelite_actif,
    points_par_100da: data.points_par_100da  ?? DEFAULT_CONFIG.points_par_100da,
    seuil_argent:     data.seuil_argent      ?? DEFAULT_CONFIG.seuil_argent,
    seuil_or:         data.seuil_or          ?? DEFAULT_CONFIG.seuil_or,
    seuil_platine:    data.seuil_platine     ?? DEFAULT_CONFIG.seuil_platine,
  }
}

export function getNiveau(points: number, config: ConfigFidelite = DEFAULT_CONFIG): string {
  if (!config.fidelite_actif) return 'Bronze'
  if (points >= config.seuil_platine) return 'Platine'
  if (points >= config.seuil_or)      return 'Or'
  if (points >= config.seuil_argent)  return 'Argent'
  return 'Bronze'
}

export function calcPoints(montantDA: number, config: ConfigFidelite = DEFAULT_CONFIG): number {
  if (!config.fidelite_actif) return 0
  return Math.round(montantDA / 100 * config.points_par_100da)
}

export function getProgressionNiveau(points: number, config: ConfigFidelite = DEFAULT_CONFIG) {
  const niveaux = ['Bronze', 'Argent', 'Or', 'Platine']
  const seuils  = [0, config.seuil_argent, config.seuil_or, config.seuil_platine]
  const niveau  = getNiveau(points, config)
  const idx     = niveaux.indexOf(niveau)
  const next    = idx < 3 ? niveaux[idx + 1] : null
  const min     = seuils[idx] || 0
  const max     = idx < 3 ? seuils[idx + 1] : config.seuil_platine
  const progress = next ? Math.min(100, Math.max(0, ((points - min) / (max - min)) * 100)) : 100
  return { niveau, next, min, max, progress }
}
