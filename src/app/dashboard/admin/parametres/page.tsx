'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

type Salon = {
  id: string
  nom: string
  telephone: string | null
  adresse: string | null
  wilaya: string | null
  email_contact: string | null
  whatsapp: string | null
  devise: string
  timezone: string
  abonnement: string | null
  logo_url: string | null
  fidelite_actif: boolean
  points_par_100da: number
  seuil_argent: number
  seuil_or: number
  seuil_platine: number
}

const WILAYAS = [
  'Alger', 'Oran', 'Constantine', 'Annaba', 'Blida', 'Batna', 'Sétif',
  'Tlemcen', 'Béjaïa', 'Tizi Ouzou', 'Médéa', 'Mostaganem', 'Skikda',
  'Biskra', 'Chlef', 'Mascara', 'Ouargla', 'Sidi Bel Abbès', 'Guelma',
  'Jijel', 'Autre',
]

const ABONNEMENTS = [
  { id: 'starter', label: 'Starter',  prix: '2 900 DA/mois', desc: 'Jusqu\'à 100 cartes' },
  { id: 'pro',     label: 'Pro',      prix: '5 900 DA/mois', desc: 'Cartes illimitées + caisse POS' },
  { id: 'premium', label: 'Premium',  prix: '9 900 DA/mois', desc: 'Multi-salon + WhatsApp auto' },
]

export default function Parametres() {
  const router = useRouter()
  const [salon, setSalon] = useState<Partial<Salon>>({
    fidelite_actif: true,
    points_par_100da: 2,
    seuil_argent: 500,
    seuil_or: 1500,
    seuil_platine: 3000,
  })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [userId, setUserId] = useState('')
  const [activeSection, setActiveSection] = useState<'salon' | 'fidelite' | 'abonnement' | 'notifications' | 'securite'>('salon')

  useEffect(() => {
    const init = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) { router.push('/login'); return }
      setUserId(session.user.id)
      const { data } = await supabase.from('salons').select('*').eq('user_id', session.user.id).single()
      if (data) setSalon({
        ...data,
        fidelite_actif:   data.fidelite_actif   ?? true,
        points_par_100da: data.points_par_100da  ?? 2,
        seuil_argent:     data.seuil_argent      ?? 500,
        seuil_or:         data.seuil_or          ?? 1500,
        seuil_platine:    data.seuil_platine      ?? 3000,
      })
      setLoading(false)
    }
    init()
  }, [])

  const handleSave = async () => {
    setSaving(true)
    setSaved(false)

    let payload: any = {}

    if (activeSection === 'salon') {
      payload = {
        nom:           salon.nom,
        telephone:     salon.telephone     || null,
        adresse:       salon.adresse       || null,
        wilaya:        salon.wilaya        || null,
        email_contact: salon.email_contact || null,
        whatsapp:      salon.whatsapp      || null,
      }
    } else if (activeSection === 'fidelite') {
      payload = {
        fidelite_actif:   salon.fidelite_actif,
        points_par_100da: salon.points_par_100da,
        seuil_argent:     salon.seuil_argent,
        seuil_or:         salon.seuil_or,
        seuil_platine:    salon.seuil_platine,
      }
    }

    if (salon.id) {
      await supabase.from('salons').update(payload).eq('id', salon.id)
    } else {
      await supabase.from('salons').insert({ ...payload, user_id: userId })
    }

    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 2500)
  }

  const Field = ({ label, value, onChange, placeholder, type = 'text' }: {
    label: string; value: string; onChange: (v: string) => void; placeholder?: string; type?: string
  }) => (
    <div className="flex flex-col gap-1.5">
      <label className="text-xs text-[#8A8275] font-medium">{label}</label>
      <input type={type} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
        className="w-full border border-[#C4B89E] rounded-xl px-4 py-3 text-sm text-[#2C2A25] outline-none focus:border-[#BA7517] focus:ring-1 focus:ring-[#BA7517]/20 bg-[#F7F4EE] placeholder:text-[#B0A898]" />
    </div>
  )

  const NumberField = ({ label, value, onChange, min, sub }: {
    label: string; value: number; onChange: (v: number) => void; min?: number; sub?: string
  }) => (
    <div className="flex flex-col gap-1.5">
      <label className="text-xs text-[#8A8275] font-medium">{label}</label>
      {sub && <p className="text-[10px] text-[#B0A898] -mt-1">{sub}</p>}
      <input type="number" value={value} min={min ?? 0}
        onChange={e => onChange(parseInt(e.target.value) || 0)}
        className="w-full border border-[#C4B89E] rounded-xl px-4 py-3 text-sm text-[#2C2A25] outline-none focus:border-[#BA7517] focus:ring-1 focus:ring-[#BA7517]/20 bg-[#F7F4EE]" />
    </div>
  )

  const tabs = [
    { id: 'salon',         label: 'Salon',         icon: '⊹' },
    { id: 'fidelite',      label: 'Fidélité',      icon: '✦' },
    { id: 'abonnement',    label: 'Abonnement',    icon: '◎' },
    { id: 'notifications', label: 'Notifications', icon: '◈' },
    { id: 'securite',      label: 'Sécurité',      icon: '⊞' },
  ] as const

  const showSave = activeSection === 'salon' || activeSection === 'fidelite'
  const taux = salon.points_par_100da ?? 2
  const valeurPoint = taux > 0 ? (100 / taux).toFixed(0) : '—'

  return (
    <div className="min-h-screen bg-[#E8E2D5]">

      <div className="bg-[#2C2A25] px-6 py-4 flex items-center gap-4 shadow-lg">
        <button onClick={() => router.push('/dashboard/admin')}
          className="w-9 h-9 rounded-full border border-[#4A4840] flex items-center justify-center text-[#F7F4EE] opacity-70 hover:opacity-100 hover:border-[#BA7517] transition-all text-sm flex-shrink-0">
          ←
        </button>
        <div>
          <h1 className="text-base font-medium text-[#F7F4EE]">Paramètres</h1>
          <p className="text-xs text-[#BA7517]">Configuration du salon</p>
        </div>
        {showSave && (
          <button onClick={handleSave} disabled={saving}
            className="ml-auto flex items-center gap-2 bg-[#BA7517] text-white rounded-xl px-4 py-2 text-xs font-medium hover:bg-[#A36714] transition-colors disabled:opacity-50">
            {saved ? '✓ Sauvegardé' : saving ? 'Sauvegarde...' : 'Sauvegarder'}
          </button>
        )}
      </div>

      <div className="bg-[#2C2A25] px-6 pb-4 flex gap-2 overflow-x-auto">
        {tabs.map(t => (
          <button key={t.id} onClick={() => { setActiveSection(t.id); setSaved(false) }}
            className={`px-4 py-2 rounded-xl text-xs font-medium whitespace-nowrap transition-all flex-shrink-0 ${
              activeSection === t.id
                ? 'bg-[#BA7517] text-white shadow-[0_2px_8px_rgba(186,117,23,0.3)]'
                : 'bg-[#3A3830] text-[#8A8275] hover:text-[#F7F4EE]'
            }`}>
            {t.icon} {t.label}
          </button>
        ))}
      </div>

      <div className="p-6 max-w-lg mx-auto flex flex-col gap-5">
        {loading ? (
          <div className="flex justify-center py-16">
            <div className="w-6 h-6 rounded-full border-2 border-[#C4B89E] border-t-[#BA7517] animate-spin" />
          </div>
        ) : (
          <>
            {/* SALON */}
            {activeSection === 'salon' && (
              <>
                <div className="bg-white border border-[#C4B89E] rounded-2xl p-6 shadow-md flex flex-col gap-4">
                  <div className="flex items-center gap-2 mb-1">
                    <div className="w-1 h-5 bg-[#BA7517] rounded-full" />
                    <p className="text-xs font-semibold text-[#2C2A25] uppercase tracking-wider">Informations générales</p>
                  </div>
                  <Field label="Nom du salon *" value={salon.nom || ''} onChange={v => setSalon(s => ({ ...s, nom: v }))} placeholder="Ex : Spa Lumière" />
                  <Field label="Téléphone" value={salon.telephone || ''} onChange={v => setSalon(s => ({ ...s, telephone: v }))} placeholder="Ex : 0555 123 456" type="tel" />
                  <Field label="WhatsApp" value={salon.whatsapp || ''} onChange={v => setSalon(s => ({ ...s, whatsapp: v }))} placeholder="Ex : +213 555 123 456" type="tel" />
                  <Field label="Email de contact" value={salon.email_contact || ''} onChange={v => setSalon(s => ({ ...s, email_contact: v }))} placeholder="contact@salon.dz" type="email" />
                </div>
                <div className="bg-white border border-[#C4B89E] rounded-2xl p-6 shadow-md flex flex-col gap-4">
                  <div className="flex items-center gap-2 mb-1">
                    <div className="w-1 h-5 bg-[#BA7517] rounded-full" />
                    <p className="text-xs font-semibold text-[#2C2A25] uppercase tracking-wider">Adresse</p>
                  </div>
                  <Field label="Adresse" value={salon.adresse || ''} onChange={v => setSalon(s => ({ ...s, adresse: v }))} placeholder="Rue, numéro, quartier..." />
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs text-[#8A8275] font-medium">Wilaya</label>
                    <select value={salon.wilaya || ''} onChange={e => setSalon(s => ({ ...s, wilaya: e.target.value }))}
                      className="w-full border border-[#C4B89E] rounded-xl px-4 py-3 text-sm text-[#2C2A25] outline-none focus:border-[#BA7517] bg-[#F7F4EE]">
                      <option value="">Sélectionner une wilaya</option>
                      {WILAYAS.map(w => <option key={w} value={w}>{w}</option>)}
                    </select>
                  </div>
                </div>
              </>
            )}

            {/* FIDÉLITÉ */}
            {activeSection === 'fidelite' && (
              <div className="flex flex-col gap-4">
                <div className="bg-white border border-[#C4B89E] rounded-2xl p-6 shadow-md">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-semibold text-[#2C2A25]">Programme de fidélité</p>
                      <p className="text-[11px] text-[#8A8275] mt-0.5">Activer ou désactiver pour tous les clients</p>
                    </div>
                    <button
                      onClick={() => setSalon(s => ({ ...s, fidelite_actif: !s.fidelite_actif }))}
                      className="relative w-12 h-6 rounded-full transition-all duration-300 flex-shrink-0"
                      style={{ background: salon.fidelite_actif ? '#BA7517' : '#C4B89E' }}>
                      <div className="absolute top-1 w-4 h-4 rounded-full bg-white shadow transition-all duration-300"
                        style={{ left: salon.fidelite_actif ? '28px' : '4px' }} />
                    </button>
                  </div>
                </div>

                {salon.fidelite_actif && (
                  <>
                    <div className="bg-white border border-[#C4B89E] rounded-2xl p-6 shadow-md flex flex-col gap-4">
                      <div className="flex items-center gap-2 mb-1">
                        <div className="w-1 h-5 bg-[#BA7517] rounded-full" />
                        <p className="text-xs font-semibold text-[#2C2A25] uppercase tracking-wider">Taux de points</p>
                      </div>
                      <NumberField
                        label="Points gagnés par 100 DA dépensés"
                        sub="Ex : 2 = le client gagne 2 pts pour chaque 100 DA"
                        value={salon.points_par_100da ?? 2}
                        onChange={v => setSalon(s => ({ ...s, points_par_100da: v }))}
                        min={1}
                      />
                      <div className="grid grid-cols-3 gap-2 mt-1">
                        {[1000, 5000, 10000].map(da => (
                          <div key={da} className="flex flex-col items-center p-3 rounded-xl border border-[#E8E2D5] bg-[#F7F4EE]">
                            <p className="text-[10px] text-[#8A8275]">{da.toLocaleString('fr-FR')} DA</p>
                            <p className="text-base font-semibold mt-1" style={{ color: '#BA7517' }}>
                              {Math.round(da / 100 * (salon.points_par_100da ?? 2))} pts
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="bg-white border border-[#C4B89E] rounded-2xl p-6 shadow-md flex flex-col gap-4">
                      <div className="flex items-center gap-2 mb-1">
                        <div className="w-1 h-5 bg-[#BA7517] rounded-full" />
                        <p className="text-xs font-semibold text-[#2C2A25] uppercase tracking-wider">Seuils des niveaux</p>
                      </div>

                      <div className="flex items-center justify-between py-3 border border-[#E8E2D5] rounded-xl px-4"
                        style={{ background: 'rgba(196,129,58,0.05)' }}>
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wide"
                            style={{ background: 'rgba(196,129,58,0.15)', color: '#C4813A' }}>Bronze</span>
                          <p className="text-xs text-[#8A8275]">Niveau de départ</p>
                        </div>
                        <p className="text-sm font-semibold text-[#2C2A25]">0 pts</p>
                      </div>

                      {[
                        { key: 'seuil_argent',  label: 'Argent',  color: '#8A8275', bg: 'rgba(138,130,117,0.05)' },
                        { key: 'seuil_or',      label: 'Or',      color: '#BA7517', bg: 'rgba(186,117,23,0.05)'  },
                        { key: 'seuil_platine', label: 'Platine', color: '#7C6FAE', bg: 'rgba(124,111,174,0.05)' },
                      ].map(({ key, label, color, bg }) => (
                        <div key={key} className="flex items-center justify-between gap-4 py-3 border border-[#E8E2D5] rounded-xl px-4"
                          style={{ background: bg }}>
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wide flex-shrink-0"
                            style={{ background: `${color}20`, color }}>{label}</span>
                          <div className="flex items-center gap-2 flex-1 justify-end">
                            <p className="text-[10px] text-[#8A8275] whitespace-nowrap">À partir de</p>
                            <input type="number" value={(salon as any)[key] ?? 0} min={1}
                              onChange={e => setSalon(s => ({ ...s, [key]: parseInt(e.target.value) || 0 }))}
                              className="w-24 border border-[#C4B89E] rounded-lg px-3 py-1.5 text-sm text-[#2C2A25] outline-none focus:border-[#BA7517] text-right bg-white" />
                            <p className="text-[10px] text-[#8A8275]">pts</p>
                          </div>
                        </div>
                      ))}

                      {(salon.seuil_argent ?? 0) >= (salon.seuil_or ?? 0) && (
                        <p className="text-[11px] text-rose-500">⚠ Le seuil Argent doit être inférieur au seuil Or</p>
                      )}
                      {(salon.seuil_or ?? 0) >= (salon.seuil_platine ?? 0) && (
                        <p className="text-[11px] text-rose-500">⚠ Le seuil Or doit être inférieur au seuil Platine</p>
                      )}
                    </div>

                    <div className="bg-[#2C2A25] rounded-2xl p-5 flex flex-col gap-2">
                      <p className="text-[9px] tracking-[0.2em] uppercase text-[#F7F4EE]/40 mb-1">Résumé du programme</p>
                      {[
                        { niveau: 'Bronze',  pts: '0',                             color: '#C4813A' },
                        { niveau: 'Argent',  pts: `${salon.seuil_argent ?? 500}`,  color: '#8A8275' },
                        { niveau: 'Or',      pts: `${salon.seuil_or ?? 1500}`,     color: '#BA7517' },
                        { niveau: 'Platine', pts: `${salon.seuil_platine ?? 3000}`, color: '#7C6FAE' },
                      ].map(({ niveau, pts, color }) => (
                        <div key={niveau} className="flex items-center justify-between">
                          <span className="text-xs font-semibold" style={{ color }}>{niveau}</span>
                          <span className="text-xs text-[#F7F4EE]/50">{parseInt(pts).toLocaleString('fr-FR')} pts</span>
                        </div>
                      ))}
                      <div className="border-t border-[#F7F4EE]/10 mt-2 pt-2">
                        <p className="text-[10px] text-[#F7F4EE]/40">
                          Taux : {salon.points_par_100da ?? 2} pts / 100 DA · 1 pt = {valeurPoint} DA
                        </p>
                      </div>
                    </div>
                  </>
                )}
              </div>
            )}

            {/* ABONNEMENT */}
            {activeSection === 'abonnement' && (
              <div className="flex flex-col gap-3">
                <div className="bg-white border border-[#C4B89E] rounded-2xl p-5 shadow-md">
                  <div className="flex items-center gap-2 mb-4">
                    <div className="w-1 h-5 bg-[#BA7517] rounded-full" />
                    <p className="text-xs font-semibold text-[#2C2A25] uppercase tracking-wider">Plan actuel</p>
                  </div>
                  <div className="flex items-center gap-3 p-3 rounded-xl" style={{ background: 'rgba(186,117,23,0.08)', border: '1px solid rgba(186,117,23,0.25)' }}>
                    <div className="w-9 h-9 rounded-lg flex items-center justify-center text-sm font-bold"
                      style={{ background: 'rgba(186,117,23,0.15)', color: '#BA7517' }}>P</div>
                    <div>
                      <p className="text-sm font-semibold text-[#2C2A25]">{salon.abonnement || 'Starter'}</p>
                      <p className="text-[10px] text-[#8A8275]">Renouvellement le 1er du mois</p>
                    </div>
                    <span className="ml-auto text-[9px] px-2 py-0.5 rounded-lg uppercase tracking-wide font-medium"
                      style={{ background: 'rgba(16,185,129,0.1)', color: '#10B981', border: '1px solid rgba(16,185,129,0.2)' }}>Actif</span>
                  </div>
                </div>
                {ABONNEMENTS.map(ab => (
                  <div key={ab.id} className={`bg-white border rounded-2xl p-5 shadow-md transition-all ${(salon.abonnement || 'starter') === ab.id ? 'border-[#BA7517]' : 'border-[#C4B89E]'}`}>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-semibold text-[#2C2A25]">{ab.label}</p>
                        <p className="text-[11px] text-[#8A8275] mt-0.5">{ab.desc}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-semibold" style={{ color: '#BA7517' }}>{ab.prix}</p>
                        {(salon.abonnement || 'starter') === ab.id && (
                          <span className="text-[9px]" style={{ color: '#BA7517' }}>Plan actuel</span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
                <p className="text-[10px] text-[#8A8275] text-center mt-1">
                  Pour changer de plan, contactez le support Hadiya via WhatsApp.
                </p>
              </div>
            )}

            {/* NOTIFICATIONS */}
            {activeSection === 'notifications' && (
              <div className="bg-white border border-[#C4B89E] rounded-2xl p-6 shadow-md flex flex-col gap-4">
                <div className="flex items-center gap-2 mb-1">
                  <div className="w-1 h-5 bg-[#BA7517] rounded-full" />
                  <p className="text-xs font-semibold text-[#2C2A25] uppercase tracking-wider">WhatsApp automatique</p>
                </div>
                {[
                  { label: 'Message de bienvenue',    sub: 'Envoyé à la création d\'une carte'  },
                  { label: 'Confirmation de recharge', sub: 'Envoyé après chaque recharge'       },
                  { label: 'Rappel anniversaire',      sub: 'Envoyé le jour J du client'         },
                  { label: 'Solde faible',             sub: 'Alerte quand le solde < 1 000 DA'   },
                  { label: 'Carte expirée bientôt',    sub: '7 jours avant l\'expiration'        },
                ].map(n => (
                  <div key={n.label} className="flex items-center justify-between py-2 border-b border-[#EDE8DE] last:border-0">
                    <div>
                      <p className="text-sm text-[#2C2A25] font-medium">{n.label}</p>
                      <p className="text-[10px] text-[#8A8275] mt-0.5">{n.sub}</p>
                    </div>
                    <div className="w-10 h-6 rounded-full flex items-center justify-end pr-1 cursor-pointer"
                      style={{ background: 'rgba(186,117,23,0.2)', border: '1px solid rgba(186,117,23,0.3)' }}>
                      <div className="w-4 h-4 rounded-full" style={{ background: '#BA7517' }} />
                    </div>
                  </div>
                ))}
                <p className="text-[10px] text-[#8A8275] mt-1">
                  Les automatisations WhatsApp nécessitent la configuration n8n.
                </p>
              </div>
            )}

            {/* SECURITE */}
            {activeSection === 'securite' && (
              <div className="flex flex-col gap-4">
                <div className="bg-white border border-[#C4B89E] rounded-2xl p-6 shadow-md flex flex-col gap-4">
                  <div className="flex items-center gap-2 mb-1">
                    <div className="w-1 h-5 bg-[#BA7517] rounded-full" />
                    <p className="text-xs font-semibold text-[#2C2A25] uppercase tracking-wider">Accès & sécurité</p>
                  </div>
                  {[
                    { label: 'Changer le mot de passe', sub: 'Modifier le mot de passe du compte',    action: 'Modifier'   },
                    { label: 'PIN de caisse',            sub: 'Code PIN pour déverrouiller la caisse', action: 'Configurer' },
                    { label: 'Sessions actives',         sub: '1 session active · Alger',              action: 'Voir'       },
                  ].map(item => (
                    <div key={item.label} className="flex items-center justify-between py-3 border-b border-[#EDE8DE] last:border-0">
                      <div>
                        <p className="text-sm text-[#2C2A25] font-medium">{item.label}</p>
                        <p className="text-[10px] text-[#8A8275] mt-0.5">{item.sub}</p>
                      </div>
                      <button className="text-[10px] font-medium uppercase tracking-wide transition-colors hover:opacity-70"
                        style={{ color: '#BA7517' }}>{item.action}</button>
                    </div>
                  ))}
                </div>
                <div className="bg-white border border-[#C4B89E] rounded-2xl p-6 shadow-md flex flex-col gap-4">
                  <div className="flex items-center gap-2 mb-1">
                    <div className="w-1 h-5 bg-rose-400 rounded-full" />
                    <p className="text-xs font-semibold text-[#2C2A25] uppercase tracking-wider">Zone dangereuse</p>
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-[#2C2A25] font-medium">Supprimer le compte</p>
                      <p className="text-[10px] text-[#8A8275] mt-0.5">Action irréversible — toutes les données seront perdues</p>
                    </div>
                    <button className="text-[10px] text-rose-500 font-medium uppercase tracking-wide border border-rose-500/30 px-3 py-1.5 rounded-lg hover:bg-rose-500/5 transition-colors">
                      Supprimer
                    </button>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
