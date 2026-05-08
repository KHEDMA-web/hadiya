'use client'
import { useState, useEffect, useRef } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

const EMOJIS: Record<string, string[]> = {
  'Soins': ['💆','💅','🧖','💇','🛁','🪷','🌸','🌺','🌹','💐','🌿','🍃','🪸','🧴','🕯️','💎','✨','🌟','💫','⭐'],
  'Boissons': ['☕','🍵','🍹','💧','🫖','🍶','🥤','🧃','🧋','🍷','🥂','🍸'],
  'Produits': ['🫙','🧼','🪞','💊','🌿','🧴','🪥','🧽','🎁','🎀','💝','🛍️','📦','🪄','🔮'],
}

const UNITES = ['unité', 'ml', 'L', 'g', 'kg', 'flacon', 'tube', 'boîte']

function EmojiPicker({ value, onChange }: { value: string; onChange: (e: string) => void }) {
  const [open, setOpen] = useState(false)
  const [tab, setTab] = useState('Soins')
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  return (
    <div ref={ref} className="relative">
      <button type="button" onClick={() => setOpen(o => !o)}
        className="w-14 h-[50px] border border-[#4A4840] rounded-xl text-center text-xl bg-[#3A3830] hover:border-[#BA7517] transition-colors flex items-center justify-center">
        {value || <span className="text-[#5A5850] text-sm">🛎️</span>}
      </button>
      {open && (
        <div className="absolute left-0 top-[56px] z-50 bg-[#1E1C18] border border-[#4A4840] rounded-2xl shadow-2xl w-64 overflow-hidden">
          <div className="flex border-b border-[#3A3830]">
            {Object.keys(EMOJIS).map(t => (
              <button key={t} type="button" onClick={() => setTab(t)}
                className={`flex-1 py-2 text-[10px] uppercase tracking-wide font-medium transition-colors ${tab === t ? 'text-[#BA7517] border-b-2 border-[#BA7517]' : 'text-[#5A5850] hover:text-[#8A8275]'}`}>
                {t}
              </button>
            ))}
          </div>
          <div className="grid grid-cols-5 gap-1 p-3">
            {EMOJIS[tab].map(e => (
              <button key={e} type="button" onClick={() => { onChange(e); setOpen(false) }}
                className={`text-xl rounded-lg p-1.5 hover:bg-[#3A3830] transition-colors ${value === e ? 'bg-[#BA7517]/20 ring-1 ring-[#BA7517]/50' : ''}`}>
                {e}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

type Produit = {
  id: string
  nom: string
  emoji: string
  prix: number
  categorie: string
  actif: boolean
  stock_actuel: number
  stock_minimum: number
  stock_unite: string
}

type Section = 'consommable' | 'soin'

const emptyForm = {
  nom: '', emoji: '', prix: '', categorie: 'soin' as Section,
  stock_actuel: '0', stock_minimum: '5', stock_unite: 'unité',
}

function getStockStatus(p: Produit) {
  if (p.stock_actuel <= 0) return 'rupture'
  if (p.stock_actuel <= p.stock_minimum) return 'faible'
  return 'ok'
}

export default function Produits() {
  const router = useRouter()
  const [section, setSection] = useState<Section>('soin')
  const [produits, setProduits] = useState<Produit[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<Produit | null>(null)
  const [form, setForm] = useState(emptyForm)
  const [saving, setSaving] = useState(false)
  const [erreur, setErreur] = useState('')
  const [stockAdjust, setStockAdjust] = useState<string | null>(null)
  const [adjustVal, setAdjustVal] = useState('')

  useEffect(() => { fetchProduits() }, [])

  const fetchProduits = async () => {
    setLoading(true)
    const { data, error } = await supabase.from('menu_items').select('*').order('nom')
    if (!error) setProduits((data ?? []) as Produit[])
    setLoading(false)
  }

  const filtered = produits.filter(p => p.categorie === section)

  const alertes = produits.filter(p => getStockStatus(p) !== 'ok')

  const openAdd = () => {
    setEditing(null)
    setErreur('')
    setForm({ ...emptyForm, categorie: section })
    setShowForm(true)
  }

  const openEdit = (p: Produit) => {
    setEditing(p)
    setErreur('')
    setForm({
      nom: p.nom, emoji: p.emoji ?? '', prix: String(p.prix),
      categorie: p.categorie as Section,
      stock_actuel: String(p.stock_actuel ?? 0),
      stock_minimum: String(p.stock_minimum ?? 5),
      stock_unite: p.stock_unite ?? 'unité',
    })
    setShowForm(true)
  }

  const handleSave = async () => {
    if (!form.nom || !form.prix) return
    setSaving(true)
    setErreur('')
    const payload = {
      nom: form.nom,
      emoji: form.emoji || (form.categorie === 'soin' ? '✨' : '📦'),
      prix: parseFloat(form.prix),
      categorie: form.categorie,
      actif: true,
      stock_actuel:  parseInt(form.stock_actuel)  || 0,
      stock_minimum: parseInt(form.stock_minimum) || 5,
      stock_unite:   form.stock_unite || 'unité',
    }
    const { error } = editing
      ? await supabase.from('menu_items').update(payload).eq('id', editing.id)
      : await supabase.from('menu_items').insert(payload)
    if (error) { setErreur('Erreur : ' + error.message); setSaving(false); return }
    await fetchProduits()
    setShowForm(false)
    setSaving(false)
  }

  const handleToggleActif = async (p: Produit) => {
    await supabase.from('menu_items').update({ actif: !p.actif }).eq('id', p.id)
    setProduits(prev => prev.map(x => x.id === p.id ? { ...x, actif: !x.actif } : x))
  }

  const handleDelete = async (id: string) => {
    await supabase.from('menu_items').delete().eq('id', id)
    setProduits(prev => prev.filter(x => x.id !== id))
  }

  const handleStockAdjust = async (p: Produit, delta: number) => {
    const nouveau = Math.max(0, (p.stock_actuel ?? 0) + delta)
    await supabase.from('menu_items').update({ stock_actuel: nouveau }).eq('id', p.id)
    setProduits(prev => prev.map(x => x.id === p.id ? { ...x, stock_actuel: nouveau } : x))
  }

  const handleStockSet = async (p: Produit) => {
    const val = parseInt(adjustVal)
    if (isNaN(val) || val < 0) return
    await supabase.from('menu_items').update({ stock_actuel: val }).eq('id', p.id)
    setProduits(prev => prev.map(x => x.id === p.id ? { ...x, stock_actuel: val } : x))
    setStockAdjust(null)
    setAdjustVal('')
  }

  return (
    <div className="min-h-screen bg-[#E8E2D5]">

      {/* Header */}
      <div className="bg-[#2C2A25] px-6 py-4 flex items-center gap-4 shadow-lg">
        <button onClick={() => router.push('/dashboard')}
          className="w-9 h-9 rounded-full border border-[#4A4840] flex items-center justify-center text-[#F7F4EE] opacity-70 hover:opacity-100 hover:border-[#BA7517] transition-all text-sm">←</button>
        <div>
          <h1 className="text-base font-medium text-[#F7F4EE]">Produits & Soins</h1>
          <p className="text-xs text-[#BA7517]">Catalogue, tarifs & stock</p>
        </div>
        <button onClick={openAdd}
          className="ml-auto flex items-center gap-2 bg-[#BA7517] text-white rounded-xl px-4 py-2 text-xs font-medium hover:bg-[#A36714] transition-colors shadow-[0_2px_8px_rgba(186,117,23,0.3)]">
          <span className="text-base leading-none">+</span>Ajouter
        </button>
      </div>

      {/* Tabs */}
      <div className="bg-[#2C2A25] px-6 pb-4 flex gap-2">
        {(['soin', 'consommable'] as Section[]).map(s => (
          <button key={s} onClick={() => setSection(s)}
            className={`px-4 py-2 rounded-xl text-xs font-medium transition-all ${section === s ? 'bg-[#BA7517] text-white shadow-[0_2px_8px_rgba(186,117,23,0.3)]' : 'bg-[#3A3830] text-[#8A8275] hover:text-[#F7F4EE]'}`}>
            {s === 'soin' ? '✨ Soins & Services' : '📦 Consommables'}
          </button>
        ))}
      </div>

      <div className="p-6 max-w-2xl mx-auto flex flex-col gap-3">

        {/* Alertes stock */}
        {alertes.length > 0 && (
          <div className="bg-white border border-rose-200 rounded-2xl p-4 shadow-md">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-1.5 h-5 bg-rose-400 rounded-full" />
              <p className="text-xs font-semibold text-[#2C2A25] uppercase tracking-wider">
                Alertes stock ({alertes.length})
              </p>
            </div>
            <div className="flex flex-col gap-2">
              {alertes.map(p => {
                const status = getStockStatus(p)
                return (
                  <div key={p.id} className="flex items-center gap-3">
                    <span className="text-lg">{p.emoji || '📦'}</span>
                    <p className="text-sm text-[#2C2A25] flex-1 truncate">{p.nom}</p>
                    <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wide ${
                      status === 'rupture'
                        ? 'bg-rose-100 text-rose-600'
                        : 'bg-orange-100 text-orange-600'
                    }`}>
                      {status === 'rupture' ? '⚠ Rupture' : `⚠ ${p.stock_actuel} ${p.stock_unite}`}
                    </span>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Liste produits */}
        {loading ? (
          <div className="flex justify-center py-16 opacity-40">
            <p className="text-sm text-[#2C2A25]">Chargement...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 gap-4">
            <div className="text-4xl opacity-30">{section === 'soin' ? '✨' : '📦'}</div>
            <p className="text-sm text-[#8A8275]">Aucun {section === 'soin' ? 'soin' : 'consommable'} pour l'instant</p>
            <button onClick={openAdd} className="text-xs text-[#BA7517] underline">Ajouter le premier</button>
          </div>
        ) : (
          filtered.map(p => {
            const status = getStockStatus(p)
            return (
              <div key={p.id} className={`bg-white border rounded-2xl p-4 shadow-md transition-all ${
                !p.actif ? 'border-[#D4CBBA] opacity-50' :
                status === 'rupture' ? 'border-rose-300' :
                status === 'faible'  ? 'border-orange-300' :
                'border-[#C4B89E]'
              }`}>
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-xl bg-[#E8E2D5] flex items-center justify-center text-xl flex-shrink-0">
                    {p.emoji || (section === 'soin' ? '✨' : '📦')}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-sm font-medium text-[#2C2A25] truncate">{p.nom}</p>
                      {!p.actif && (
                        <span className="text-[9px] bg-[#E8E2D5] text-[#8A8275] rounded-md px-1.5 py-0.5 uppercase tracking-wide flex-shrink-0">Inactif</span>
                      )}
                      {status === 'rupture' && (
                        <span className="text-[9px] bg-rose-100 text-rose-600 rounded-md px-1.5 py-0.5 uppercase tracking-wide font-bold flex-shrink-0">Rupture</span>
                      )}
                      {status === 'faible' && (
                        <span className="text-[9px] bg-orange-100 text-orange-600 rounded-md px-1.5 py-0.5 uppercase tracking-wide font-bold flex-shrink-0">Stock faible</span>
                      )}
                    </div>
                    <p className="text-[11px] text-[#8A8275] mt-0.5 capitalize">{p.categorie}</p>
                  </div>
                  <span className="text-sm font-semibold text-[#2C2A25] flex-shrink-0">
                    {p.prix?.toLocaleString('fr-FR')} DA
                  </span>
                </div>

                {/* Stock bar */}
                <div className="mt-3 pt-3 border-t border-[#EDE8DE]">
                  <div className="flex items-center justify-between mb-1.5">
                    <p className="text-[10px] text-[#8A8275] uppercase tracking-wide">Stock</p>
                    <p className={`text-xs font-semibold ${status === 'rupture' ? 'text-rose-500' : status === 'faible' ? 'text-orange-500' : 'text-[#2C2A25]'}`}>
                      {p.stock_actuel ?? 0} {p.stock_unite ?? 'unité'}
                    </p>
                  </div>

                  {/* Ajustement rapide */}
                  {stockAdjust === p.id ? (
                    <div className="flex gap-2 mt-1">
                      <input type="number" value={adjustVal} onChange={e => setAdjustVal(e.target.value)}
                        placeholder="Nouveau stock"
                        className="flex-1 border border-[#C4B89E] rounded-lg px-3 py-1.5 text-sm text-[#2C2A25] outline-none focus:border-[#BA7517]" />
                      <button onClick={() => handleStockSet(p)}
                        className="bg-[#BA7517] text-white rounded-lg px-3 py-1.5 text-xs font-medium">OK</button>
                      <button onClick={() => { setStockAdjust(null); setAdjustVal('') }}
                        className="border border-[#C4B89E] rounded-lg px-3 py-1.5 text-xs text-[#8A8275]">×</button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <button onClick={() => handleStockAdjust(p, -1)}
                        className="w-7 h-7 rounded-lg border border-[#C4B89E] flex items-center justify-center text-sm text-[#8A8275] hover:border-rose-400 hover:text-rose-400 transition-colors">−</button>
                      <div className="flex-1 h-1.5 bg-[#E8E2D5] rounded-full overflow-hidden">
                        <div className="h-full rounded-full transition-all duration-500"
                          style={{
                            width: `${Math.min(100, ((p.stock_actuel ?? 0) / Math.max(1, (p.stock_minimum ?? 5) * 2)) * 100)}%`,
                            background: status === 'rupture' ? '#EF4444' : status === 'faible' ? '#F97316' : '#BA7517'
                          }} />
                      </div>
                      <button onClick={() => handleStockAdjust(p, 1)}
                        className="w-7 h-7 rounded-lg border border-[#C4B89E] flex items-center justify-center text-sm text-[#8A8275] hover:border-[#BA7517] hover:text-[#BA7517] transition-colors">+</button>
                      <button onClick={() => { setStockAdjust(p.id); setAdjustVal(String(p.stock_actuel ?? 0)) }}
                        className="text-[9px] text-[#8A8275] underline whitespace-nowrap">Définir</button>
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 mt-3 pt-3 border-t border-[#EDE8DE]">
                  <button onClick={() => openEdit(p)} className="flex-1 text-[10px] uppercase tracking-wide text-[#8A8275] hover:text-[#2C2A25] transition-colors py-1">Modifier</button>
                  <div className="w-px h-4 bg-[#EDE8DE]" />
                  <button onClick={() => handleToggleActif(p)} className="flex-1 text-[10px] uppercase tracking-wide text-[#8A8275] hover:text-[#2C2A25] transition-colors py-1">
                    {p.actif ? 'Désactiver' : 'Activer'}
                  </button>
                  <div className="w-px h-4 bg-[#EDE8DE]" />
                  <button onClick={() => handleDelete(p.id)} className="flex-1 text-[10px] uppercase tracking-wide text-[#8A8275] hover:text-rose-500 transition-colors py-1">Supprimer</button>
                </div>
              </div>
            )
          })
        )}
      </div>

      {/* Modal ajout / édition */}
      {showForm && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center z-50 p-4">
          <div className="bg-[#2C2A25] border border-[#4A4840] rounded-2xl p-6 w-full max-w-sm shadow-2xl">
            <div className="flex items-center justify-between mb-5">
              <p className="text-sm font-medium text-[#F7F4EE]">
                {editing ? 'Modifier' : 'Nouveau'} {form.categorie === 'soin' ? 'soin' : 'consommable'}
              </p>
              <button onClick={() => setShowForm(false)} className="text-[#8A8275] hover:text-[#F7F4EE] text-xl leading-none">×</button>
            </div>

            <div className="flex gap-2 mb-4">
              {(['soin', 'consommable'] as Section[]).map(s => (
                <button key={s} onClick={() => setForm(f => ({ ...f, categorie: s }))}
                  className={`flex-1 py-2 rounded-xl text-[10px] uppercase tracking-wide font-medium transition-all ${form.categorie === s ? 'bg-[#BA7517] text-white' : 'bg-[#3A3830] text-[#8A8275]'}`}>
                  {s === 'soin' ? '✨ Soin' : '📦 Consommable'}
                </button>
              ))}
            </div>

            <div className="flex flex-col gap-3">
              <div className="flex gap-3">
                <EmojiPicker value={form.emoji} onChange={e => setForm(f => ({ ...f, emoji: e }))} />
                <input placeholder="Nom *" value={form.nom} onChange={e => setForm(f => ({ ...f, nom: e.target.value }))}
                  className="flex-1 border border-[#4A4840] rounded-xl px-4 py-3 text-sm bg-[#3A3830] text-[#F7F4EE] outline-none focus:border-[#BA7517] placeholder:text-[#5A5850]" />
              </div>

              <input placeholder="Prix (DA) *" type="number" value={form.prix} onChange={e => setForm(f => ({ ...f, prix: e.target.value }))}
                className="w-full border border-[#4A4840] rounded-xl px-4 py-3 text-sm bg-[#3A3830] text-[#F7F4EE] outline-none focus:border-[#BA7517] placeholder:text-[#5A5850]" />

              {/* Stock */}
              <div className="border-t border-[#4A4840] pt-3 flex flex-col gap-2">
                <p className="text-[9px] tracking-[0.2em] uppercase text-[#5A5850]">Gestion du stock</p>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[10px] text-[#8A8275] mb-1 block">Stock actuel</label>
                    <input type="number" value={form.stock_actuel} onChange={e => setForm(f => ({ ...f, stock_actuel: e.target.value }))} min="0"
                      className="w-full border border-[#4A4840] rounded-xl px-3 py-2.5 text-sm bg-[#3A3830] text-[#F7F4EE] outline-none focus:border-[#BA7517]" />
                  </div>
                  <div>
                    <label className="text-[10px] text-[#8A8275] mb-1 block">Seuil alerte</label>
                    <input type="number" value={form.stock_minimum} onChange={e => setForm(f => ({ ...f, stock_minimum: e.target.value }))} min="0"
                      className="w-full border border-[#4A4840] rounded-xl px-3 py-2.5 text-sm bg-[#3A3830] text-[#F7F4EE] outline-none focus:border-[#BA7517]" />
                  </div>
                </div>
                <div>
                  <label className="text-[10px] text-[#8A8275] mb-1 block">Unité</label>
                  <select value={form.stock_unite} onChange={e => setForm(f => ({ ...f, stock_unite: e.target.value }))}
                    className="w-full border border-[#4A4840] rounded-xl px-3 py-2.5 text-sm bg-[#3A3830] text-[#F7F4EE] outline-none focus:border-[#BA7517]">
                    {UNITES.map(u => <option key={u} value={u}>{u}</option>)}
                  </select>
                </div>
              </div>

              {erreur && <p className="text-xs text-rose-400">{erreur}</p>}

              <button onClick={handleSave} disabled={saving || !form.nom || !form.prix}
                className="w-full bg-[#BA7517] text-white rounded-xl py-3 text-[10px] tracking-[0.15em] uppercase font-medium hover:bg-[#A36714] transition-colors disabled:opacity-40 shadow-[0_4px_12px_rgba(186,117,23,0.3)] mt-1">
                {saving ? 'Enregistrement...' : editing ? 'Enregistrer' : 'Ajouter'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
