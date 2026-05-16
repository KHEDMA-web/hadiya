'use client'
import { useState, useEffect, useRef } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import BackButton from '../_components/BackButton'
import { getUserProfile } from '@/lib/auth'

const SOIN_CATS = [
  { value: 'massage',     label: 'Massage',           emoji: '💆' },
  { value: 'soin_visage', label: 'Soin visage',       emoji: '🧖' },
  { value: 'corps',       label: 'Soin corps',        emoji: '🛁' },
  { value: 'manucure',    label: 'Manucure & Pédi',   emoji: '💅' },
  { value: 'coiffure',    label: 'Coiffure',          emoji: '💇' },
  { value: 'soin',        label: 'Autre',             emoji: '✨' },
]

const UNITES = ['unité', 'ml', 'L', 'g', 'kg', 'flacon', 'tube', 'boîte']
const EMOJIS_SOIN  = ['💆','💅','🧖','💇','🛁','🪷','🌸','🌺','🌹','💐','🌿','🍃','🧴','🕯️','💎','✨','🌟','💫','⭐','🎋']
const EMOJIS_CONSO = ['🫙','🧼','🪞','🌿','🧴','🪥','🧽','🎁','🎀','💝','🛍️','📦','🔮','🫧','🪨','💊','🌡️','🫗']

function isSoin(cat: string) { return cat !== 'consommable' }

function getCatInfo(val: string) {
  return SOIN_CATS.find(c => c.value === val) ?? { value: val, label: 'Soin', emoji: '✨' }
}

function EmojiPicker({ value, onChange, type }: { value: string; onChange: (e: string) => void; type: 'soin' | 'consommable' }) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const emojis = type === 'soin' ? EMOJIS_SOIN : EMOJIS_CONSO
  useEffect(() => {
    const h = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false) }
    document.addEventListener('mousedown', h)
    return () => document.removeEventListener('mousedown', h)
  }, [])
  return (
    <div ref={ref} className="relative flex-shrink-0">
      <button type="button" onClick={() => setOpen(o => !o)}
        className="w-12 h-[46px] border border-[#C4B89E] rounded-xl text-xl bg-[#F7F4EE] hover:border-[#BA7517] transition-colors flex items-center justify-center">
        {value || <span className="text-[#B0A898] text-sm">+</span>}
      </button>
      {open && (
        <div className="absolute left-0 top-[52px] z-50 bg-white border border-[#C4B89E] rounded-2xl shadow-xl p-3 w-52">
          <div className="grid grid-cols-5 gap-1">
            {emojis.map(e => (
              <button key={e} type="button" onClick={() => { onChange(e); setOpen(false) }}
                className={`text-xl rounded-lg p-1.5 hover:bg-[#F7F4EE] transition-colors ${value === e ? 'bg-[#BA7517]/15 ring-1 ring-[#BA7517]/40' : ''}`}>
                {e}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

type Item = {
  id: string; nom: string; emoji: string; prix: number; categorie: string
  actif: boolean; duree_minutes: number | null
  stock_actuel: number | null; stock_minimum: number | null; stock_unite: string | null
}
type Section = 'soin' | 'consommable'

function getStockStatus(item: Item) {
  if (isSoin(item.categorie)) return 'ok'
  if ((item.stock_actuel ?? 0) <= 0) return 'rupture'
  if ((item.stock_actuel ?? 0) <= (item.stock_minimum ?? 5)) return 'faible'
  return 'ok'
}

const emptySoin = { categorie: 'massage', nom: '', emoji: '', prix: '', duree: '60' }
const emptyConso = { nom: '', emoji: '', prix: '', stock: '0', minimum: '5', unite: 'unité' }

export default function Produits() {
  const router = useRouter()
  const [section, setSection] = useState<Section>('soin')
  const [items, setItems] = useState<Item[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [salonId, setSalonId] = useState<string | null | undefined>(undefined)

  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<Item | null>(null)
  const [formType, setFormType] = useState<Section>('soin')
  const [soin, setSoin] = useState(emptySoin)
  const [conso, setConso] = useState(emptyConso)
  const [saving, setSaving] = useState(false)
  const [erreur, setErreur] = useState('')

  const [stockAdjust, setStockAdjust] = useState<string | null>(null)
  const [adjustVal, setAdjustVal] = useState('')

  const [showImport, setShowImport] = useState(false)
  const [importText, setImportText] = useState('')
  const [importPreview, setImportPreview] = useState<Record<string, unknown>[]>([])
  const [importing, setImporting] = useState(false)

  useEffect(() => { getUserProfile().then(p => setSalonId(p?.salonId ?? null)) }, [])
  useEffect(() => { if (salonId !== undefined) fetchItems() }, [salonId])

  const fetchItems = async () => {
    setLoading(true)
    const q = supabase.from('menu_items').select('*').order('nom')
    const { data } = salonId ? await q.eq('salon_id', salonId) : await q
    setItems((data ?? []) as Item[])
    setLoading(false)
  }

  const filtered = items.filter(p => {
    const matchSection = section === 'soin' ? isSoin(p.categorie) : !isSoin(p.categorie)
    const matchSearch = !search || p.nom.toLowerCase().includes(search.toLowerCase())
    return matchSection && matchSearch
  })

  const soinsCount = items.filter(p => isSoin(p.categorie) && p.actif).length
  const consosCount = items.filter(p => !isSoin(p.categorie) && p.actif).length
  const alertes = items.filter(p => !isSoin(p.categorie) && getStockStatus(p) !== 'ok')

  const openAdd = () => {
    setEditing(null); setErreur(''); setFormType(section)
    setSoin({ ...emptySoin }); setConso({ ...emptyConso }); setShowForm(true)
  }

  const openEdit = (item: Item) => {
    setEditing(item); setErreur('')
    const t: Section = isSoin(item.categorie) ? 'soin' : 'consommable'
    setFormType(t)
    if (t === 'soin') setSoin({ categorie: item.categorie, nom: item.nom, emoji: item.emoji ?? '', prix: String(item.prix), duree: String(item.duree_minutes ?? 60) })
    else setConso({ nom: item.nom, emoji: item.emoji ?? '', prix: String(item.prix), stock: String(item.stock_actuel ?? 0), minimum: String(item.stock_minimum ?? 5), unite: item.stock_unite ?? 'unité' })
    setShowForm(true)
  }

  const openDuplicate = (item: Item) => {
    setEditing(null); setErreur('')
    const t: Section = isSoin(item.categorie) ? 'soin' : 'consommable'
    setFormType(t)
    if (t === 'soin') setSoin({ categorie: item.categorie, nom: item.nom + ' (copie)', emoji: item.emoji ?? '', prix: String(item.prix), duree: String(item.duree_minutes ?? 60) })
    else setConso({ nom: item.nom + ' (copie)', emoji: item.emoji ?? '', prix: String(item.prix), stock: '0', minimum: String(item.stock_minimum ?? 5), unite: item.stock_unite ?? 'unité' })
    setShowForm(true)
  }

  const handleSave = async () => {
    const hasNom = formType === 'soin' ? soin.nom : conso.nom
    const hasPrix = formType === 'soin' ? soin.prix : conso.prix
    if (!hasNom || !hasPrix) { setErreur('Nom et prix obligatoires'); return }
    setSaving(true); setErreur('')

    const payload: Record<string, unknown> = formType === 'soin'
      ? { nom: soin.nom, emoji: soin.emoji || getCatInfo(soin.categorie).emoji, prix: parseFloat(soin.prix), categorie: soin.categorie, duree_minutes: parseInt(soin.duree) || null, actif: true, stock_actuel: null, stock_minimum: null, stock_unite: null }
      : { nom: conso.nom, emoji: conso.emoji || '📦', prix: parseFloat(conso.prix), categorie: 'consommable', duree_minutes: null, actif: true, stock_actuel: parseInt(conso.stock) || 0, stock_minimum: parseInt(conso.minimum) || 5, stock_unite: conso.unite }

    if (!editing && salonId) payload.salon_id = salonId

    const { error } = editing
      ? await supabase.from('menu_items').update(payload).eq('id', editing.id)
      : await supabase.from('menu_items').insert(payload)

    if (error) { setErreur(error.message); setSaving(false); return }
    await fetchItems(); setShowForm(false); setSaving(false)
  }

  const handleToggle = async (item: Item) => {
    await supabase.from('menu_items').update({ actif: !item.actif }).eq('id', item.id)
    setItems(prev => prev.map(x => x.id === item.id ? { ...x, actif: !x.actif } : x))
  }

  const handleDelete = async (id: string) => {
    await supabase.from('menu_items').delete().eq('id', id)
    setItems(prev => prev.filter(x => x.id !== id))
  }

  const handleStockAdjust = async (item: Item, delta: number) => {
    const n = Math.max(0, (item.stock_actuel ?? 0) + delta)
    await supabase.from('menu_items').update({ stock_actuel: n }).eq('id', item.id)
    setItems(prev => prev.map(x => x.id === item.id ? { ...x, stock_actuel: n } : x))
  }

  const handleStockSet = async (item: Item) => {
    const val = parseInt(adjustVal)
    if (isNaN(val) || val < 0) return
    await supabase.from('menu_items').update({ stock_actuel: val }).eq('id', item.id)
    setItems(prev => prev.map(x => x.id === item.id ? { ...x, stock_actuel: val } : x))
    setStockAdjust(null); setAdjustVal('')
  }

  const parseImport = () => {
    const lines = importText.split('\n').filter(l => l.trim())
    const parsed = lines.map(line => {
      const parts = line.split(',').map(p => p.trim())
      const isConso = parts[3]?.toLowerCase().startsWith('conso')
      const dureeVal = !isConso && parts[3] && !isNaN(parseInt(parts[3])) ? parseInt(parts[3]) : null
      return {
        nom: parts[0] || '', prix: parseFloat(parts[1]) || 0,
        emoji: parts[2] || (isConso ? '📦' : '✨'),
        categorie: isConso ? 'consommable' : 'soin',
        duree_minutes: isConso ? null : (dureeVal ?? 60),
        actif: true,
        stock_actuel: isConso ? 0 : null, stock_minimum: isConso ? 5 : null, stock_unite: isConso ? 'unité' : null,
      }
    }).filter(p => p.nom && p.prix > 0)
    setImportPreview(parsed)
  }

  const handleImport = async () => {
    if (!importPreview.length) return
    setImporting(true)
    const rows = salonId ? importPreview.map(p => ({ ...p, salon_id: salonId })) : importPreview
    await supabase.from('menu_items').insert(rows)
    await fetchItems()
    setShowImport(false); setImportText(''); setImportPreview([]); setImporting(false)
  }

  return (
    <div className="min-h-screen bg-[#E8E2D5]">

      {/* Header */}
      <div className="bg-[#2C2A25] shadow-lg">
        <div className="px-6 py-4 flex items-center gap-4">
          <BackButton href="/dashboard" />
          <div className="flex-1">
            <h1 className="text-base font-medium text-[#F7F4EE]">Catalogue</h1>
            <p className="text-[10px] text-[#8A8275] mt-0.5">
              <span className="text-[#BA7517]">{soinsCount}</span> soin{soinsCount !== 1 ? 's' : ''} actif{soinsCount !== 1 ? 's' : ''}
              <span className="mx-1.5 opacity-30">·</span>
              <span className="text-[#BA7517]">{consosCount}</span> consommable{consosCount !== 1 ? 's' : ''}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => setShowImport(true)}
              className="flex items-center gap-1.5 bg-[#3A3830] text-[#8A8275] rounded-xl px-3 py-2 text-xs font-medium hover:text-[#F7F4EE] transition-colors border border-[#4A4840]">
              ↑ Import
            </button>
            <button onClick={openAdd}
              className="flex items-center gap-2 bg-[#BA7517] text-white rounded-xl px-4 py-2 text-xs font-medium hover:bg-[#A36714] transition-colors shadow-[0_2px_8px_rgba(186,117,23,0.3)]">
              + Ajouter
            </button>
          </div>
        </div>

        {/* Tabs avec compteurs */}
        <div className="px-6 pb-4 flex gap-2">
          {([
            { key: 'soin',        label: 'Soins & Services', icon: '✨', count: items.filter(p => isSoin(p.categorie)).length },
            { key: 'consommable', label: 'Consommables',     icon: '📦', count: items.filter(p => !isSoin(p.categorie)).length },
          ] as const).map(t => (
            <button key={t.key} onClick={() => { setSection(t.key); setSearch('') }}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-medium transition-all ${section === t.key ? 'bg-[#BA7517] text-white shadow-[0_2px_8px_rgba(186,117,23,0.3)]' : 'bg-[#3A3830] text-[#8A8275] hover:text-[#F7F4EE]'}`}>
              {t.icon} {t.label}
              <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-semibold ${section === t.key ? 'bg-white/25 text-white' : 'bg-[#2C2A25] text-[#8A8275]'}`}>{t.count}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="p-4 max-w-2xl mx-auto flex flex-col gap-3">

        {/* Recherche */}
        <div className="relative">
          <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#8A8275] text-base select-none">⌕</span>
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder={`Rechercher un ${section === 'soin' ? 'soin ou service' : 'consommable'}...`}
            className="w-full pl-9 pr-9 py-2.5 rounded-xl border border-[#C4B89E] bg-white text-sm text-[#2C2A25] outline-none focus:border-[#BA7517] placeholder:text-[#B0A898]" />
          {search && (
            <button onClick={() => setSearch('')} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#8A8275] hover:text-[#2C2A25] text-lg leading-none">×</button>
          )}
        </div>

        {/* Alertes stock */}
        {section === 'consommable' && alertes.length > 0 && (
          <div className="bg-white border border-rose-200 rounded-2xl p-4 shadow-sm">
            <p className="text-[10px] font-semibold text-rose-500 uppercase tracking-wider mb-2">⚠ Stock faible ({alertes.length})</p>
            <div className="flex flex-col gap-1.5">
              {alertes.map(p => {
                const s = getStockStatus(p)
                return (
                  <div key={p.id} className="flex items-center gap-2">
                    <span>{p.emoji || '📦'}</span>
                    <p className="text-sm text-[#2C2A25] flex-1 truncate">{p.nom}</p>
                    <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full uppercase ${s === 'rupture' ? 'bg-rose-100 text-rose-600' : 'bg-orange-100 text-orange-600'}`}>
                      {s === 'rupture' ? 'Rupture' : `${p.stock_actuel} ${p.stock_unite}`}
                    </span>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Liste */}
        {loading ? (
          <div className="flex justify-center py-16">
            <div className="w-6 h-6 rounded-full border-2 border-[#C4B89E] border-t-[#BA7517] animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 gap-3">
            <p className="text-4xl opacity-20">{section === 'soin' ? '✨' : '📦'}</p>
            <p className="text-sm text-[#8A8275]">
              {search ? `Aucun résultat pour "${search}"` : `Aucun ${section === 'soin' ? 'soin' : 'consommable'}`}
            </p>
            {!search && <button onClick={openAdd} className="text-xs text-[#BA7517] underline">Ajouter le premier</button>}
          </div>
        ) : (
          filtered.map(item => {
            const cat = getCatInfo(item.categorie)
            const status = getStockStatus(item)
            return (
              <div key={item.id} className={`bg-white border rounded-2xl shadow-sm overflow-hidden transition-all ${
                !item.actif ? 'opacity-55 border-[#D4CBBA]' :
                status === 'rupture' ? 'border-rose-300' :
                status === 'faible'  ? 'border-orange-200' : 'border-[#C4B89E]'
              }`}>
                <div className="p-4">
                  <div className="flex items-start gap-3">
                    <div className="w-11 h-11 rounded-xl bg-[#F7F4EE] border border-[#E8E2D5] flex items-center justify-center text-xl flex-shrink-0">
                      {item.emoji || cat.emoji}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-[#2C2A25] truncate">{item.nom}</p>
                          <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                            <span className="text-[9px] px-1.5 py-0.5 rounded-md bg-[#F7F4EE] text-[#8A8275] border border-[#E8E2D5]">{cat.label}</span>
                            {isSoin(item.categorie) && item.duree_minutes && (
                              <span className="text-[9px] font-semibold px-1.5 py-0.5 rounded-md bg-[#BA7517]/10 text-[#BA7517] border border-[#BA7517]/20">
                                ◷ {item.duree_minutes} min
                              </span>
                            )}
                            {!item.actif && <span className="text-[9px] px-1.5 py-0.5 rounded-md bg-[#E8E2D5] text-[#8A8275]">Inactif</span>}
                          </div>
                        </div>
                        <div className="text-right flex-shrink-0">
                          <p className="text-sm font-bold text-[#2C2A25]">{item.prix.toLocaleString('fr-FR')}</p>
                          <p className="text-[9px] text-[#8A8275]">DA</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Stock — consommables seulement */}
                  {!isSoin(item.categorie) && (
                    <div className="mt-3 pt-3 border-t border-[#EDE8DE]">
                      <div className="flex items-center justify-between mb-1.5">
                        <p className="text-[9px] text-[#8A8275] uppercase tracking-wider">Stock</p>
                        <p className={`text-xs font-semibold ${status === 'rupture' ? 'text-rose-500' : status === 'faible' ? 'text-orange-500' : 'text-[#2C2A25]'}`}>
                          {item.stock_actuel ?? 0} {item.stock_unite ?? 'unité'}
                        </p>
                      </div>
                      {stockAdjust === item.id ? (
                        <div className="flex gap-2">
                          <input type="number" value={adjustVal} onChange={e => setAdjustVal(e.target.value)}
                            placeholder="Nouveau stock" autoFocus
                            className="flex-1 border border-[#C4B89E] rounded-lg px-3 py-1.5 text-sm text-[#2C2A25] outline-none focus:border-[#BA7517] bg-[#F7F4EE]" />
                          <button onClick={() => handleStockSet(item)} className="bg-[#BA7517] text-white rounded-lg px-3 py-1.5 text-xs font-medium">OK</button>
                          <button onClick={() => { setStockAdjust(null); setAdjustVal('') }} className="border border-[#C4B89E] rounded-lg px-3 py-1.5 text-xs text-[#8A8275]">×</button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <button onClick={() => handleStockAdjust(item, -1)}
                            className="w-7 h-7 rounded-lg border border-[#C4B89E] flex items-center justify-center text-sm text-[#8A8275] hover:border-rose-400 hover:text-rose-400 transition-colors">−</button>
                          <div className="flex-1 h-1.5 bg-[#E8E2D5] rounded-full overflow-hidden">
                            <div className="h-full rounded-full transition-all duration-500"
                              style={{ width: `${Math.min(100, ((item.stock_actuel ?? 0) / Math.max(1, (item.stock_minimum ?? 5) * 2)) * 100)}%`, background: status === 'rupture' ? '#EF4444' : status === 'faible' ? '#F97316' : '#BA7517' }} />
                          </div>
                          <button onClick={() => handleStockAdjust(item, 1)}
                            className="w-7 h-7 rounded-lg border border-[#C4B89E] flex items-center justify-center text-sm text-[#8A8275] hover:border-[#BA7517] hover:text-[#BA7517] transition-colors">+</button>
                          <button onClick={() => { setStockAdjust(item.id); setAdjustVal(String(item.stock_actuel ?? 0)) }}
                            className="text-[9px] text-[#8A8275] underline whitespace-nowrap">Définir</button>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Barre d'actions */}
                <div className="border-t border-[#EDE8DE] grid grid-cols-4 divide-x divide-[#EDE8DE]">
                  {[
                    { label: 'Modifier',   icon: '✎', onClick: () => openEdit(item),        cls: 'hover:text-[#2C2A25] hover:bg-[#F7F4EE]' },
                    { label: 'Dupliquer',  icon: '⧉', onClick: () => openDuplicate(item),   cls: 'hover:text-[#2C2A25] hover:bg-[#F7F4EE]' },
                    { label: item.actif ? 'Désactiver' : 'Activer', icon: item.actif ? '◌' : '●',
                      onClick: () => handleToggle(item), cls: item.actif ? 'hover:text-orange-500 hover:bg-orange-50' : 'hover:text-emerald-600 hover:bg-emerald-50' },
                    { label: 'Supprimer',  icon: '✕', onClick: () => handleDelete(item.id), cls: 'hover:text-rose-500 hover:bg-rose-50' },
                  ].map(a => (
                    <button key={a.label} onClick={a.onClick}
                      className={`py-2.5 flex flex-col items-center gap-0.5 text-[#8A8275] transition-colors ${a.cls}`}>
                      <span className="text-sm leading-none">{a.icon}</span>
                      <span className="text-[8px] uppercase tracking-wide mt-0.5">{a.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            )
          })
        )}
      </div>

      {/* Modal formulaire */}
      {showForm && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-end justify-center" onClick={e => { if (e.target === e.currentTarget) setShowForm(false) }}>
          <div className="bg-[#F7F4EE] rounded-t-3xl w-full max-w-lg max-h-[92vh] overflow-y-auto">
            <div className="sticky top-0 bg-[#2C2A25] px-6 py-4 rounded-t-3xl flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-[#F7F4EE]">{editing ? 'Modifier' : 'Nouveau'} {formType === 'soin' ? 'soin' : 'consommable'}</p>
                {editing && <p className="text-[10px] text-[#BA7517]">{editing.nom}</p>}
              </div>
              <button onClick={() => setShowForm(false)} className="w-8 h-8 rounded-xl bg-[#3A3830] text-[#8A8275] hover:text-[#F7F4EE] text-lg flex items-center justify-center">×</button>
            </div>

            <div className="p-5 flex flex-col gap-4">
              {/* Toggle type — seulement en création */}
              {!editing && (
                <div className="flex gap-2">
                  {([{ key: 'soin', label: '✨ Soin' }, { key: 'consommable', label: '📦 Consommable' }] as const).map(t => (
                    <button key={t.key} type="button" onClick={() => setFormType(t.key)}
                      className={`flex-1 py-2.5 rounded-xl text-xs font-medium transition-all border ${formType === t.key ? 'bg-[#BA7517] text-white border-[#BA7517]' : 'bg-white text-[#8A8275] border-[#C4B89E] hover:border-[#BA7517]'}`}>
                      {t.label}
                    </button>
                  ))}
                </div>
              )}

              {formType === 'soin' ? (
                <div className="bg-white border border-[#C4B89E] rounded-2xl p-4 flex flex-col gap-4">
                  {/* Catégorie */}
                  <div>
                    <label className="text-[10px] text-[#8A8275] font-medium block mb-2 uppercase tracking-wider">Catégorie</label>
                    <div className="grid grid-cols-3 gap-1.5">
                      {SOIN_CATS.map(c => (
                        <button key={c.value} type="button"
                          onClick={() => setSoin(f => ({ ...f, categorie: c.value, emoji: f.emoji || c.emoji }))}
                          className={`py-2 px-1 rounded-xl text-[10px] font-medium text-center transition-all border ${soin.categorie === c.value ? 'bg-[#BA7517]/10 border-[#BA7517]/40 text-[#BA7517]' : 'border-[#E8E2D5] text-[#8A8275] hover:border-[#C4B89E]'}`}>
                          {c.emoji} {c.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Emoji + Nom */}
                  <div className="flex gap-2 items-center">
                    <EmojiPicker value={soin.emoji} onChange={e => setSoin(f => ({ ...f, emoji: e }))} type="soin" />
                    <input placeholder="Nom du soin *" value={soin.nom} onChange={e => setSoin(f => ({ ...f, nom: e.target.value }))}
                      className="flex-1 border border-[#C4B89E] rounded-xl px-4 py-2.5 text-sm text-[#2C2A25] outline-none focus:border-[#BA7517] bg-[#F7F4EE] placeholder:text-[#B0A898]" />
                  </div>

                  {/* Prix + Durée */}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-[10px] text-[#8A8275] block mb-1.5">Prix (DA) *</label>
                      <input type="number" value={soin.prix} onChange={e => setSoin(f => ({ ...f, prix: e.target.value }))}
                        placeholder="3500" min="0"
                        className="w-full border border-[#C4B89E] rounded-xl px-4 py-2.5 text-sm text-[#2C2A25] outline-none focus:border-[#BA7517] bg-[#F7F4EE]" />
                    </div>
                    <div>
                      <label className="text-[10px] text-[#8A8275] block mb-1.5">Durée (minutes)</label>
                      <input type="number" value={soin.duree} onChange={e => setSoin(f => ({ ...f, duree: e.target.value }))}
                        placeholder="60" min="5" step="5"
                        className="w-full border border-[#C4B89E] rounded-xl px-4 py-2.5 text-sm text-[#2C2A25] outline-none focus:border-[#BA7517] bg-[#F7F4EE]" />
                    </div>
                  </div>
                </div>
              ) : (
                <div className="bg-white border border-[#C4B89E] rounded-2xl p-4 flex flex-col gap-4">
                  {/* Emoji + Nom */}
                  <div className="flex gap-2 items-center">
                    <EmojiPicker value={conso.emoji} onChange={e => setConso(f => ({ ...f, emoji: e }))} type="consommable" />
                    <input placeholder="Nom du produit *" value={conso.nom} onChange={e => setConso(f => ({ ...f, nom: e.target.value }))}
                      className="flex-1 border border-[#C4B89E] rounded-xl px-4 py-2.5 text-sm text-[#2C2A25] outline-none focus:border-[#BA7517] bg-[#F7F4EE] placeholder:text-[#B0A898]" />
                  </div>

                  <div>
                    <label className="text-[10px] text-[#8A8275] block mb-1.5">Prix de vente (DA) *</label>
                    <input type="number" value={conso.prix} onChange={e => setConso(f => ({ ...f, prix: e.target.value }))}
                      placeholder="1200" min="0"
                      className="w-full border border-[#C4B89E] rounded-xl px-4 py-2.5 text-sm text-[#2C2A25] outline-none focus:border-[#BA7517] bg-[#F7F4EE]" />
                  </div>

                  <div className="border-t border-[#EDE8DE] pt-3">
                    <p className="text-[9px] text-[#8A8275] uppercase tracking-widest mb-3">Gestion du stock</p>
                    <div className="grid grid-cols-3 gap-2">
                      <div>
                        <label className="text-[10px] text-[#8A8275] block mb-1">Actuel</label>
                        <input type="number" value={conso.stock} onChange={e => setConso(f => ({ ...f, stock: e.target.value }))} min="0"
                          className="w-full border border-[#C4B89E] rounded-xl px-3 py-2 text-sm text-[#2C2A25] outline-none focus:border-[#BA7517] bg-[#F7F4EE]" />
                      </div>
                      <div>
                        <label className="text-[10px] text-[#8A8275] block mb-1">Seuil alerte</label>
                        <input type="number" value={conso.minimum} onChange={e => setConso(f => ({ ...f, minimum: e.target.value }))} min="0"
                          className="w-full border border-[#C4B89E] rounded-xl px-3 py-2 text-sm text-[#2C2A25] outline-none focus:border-[#BA7517] bg-[#F7F4EE]" />
                      </div>
                      <div>
                        <label className="text-[10px] text-[#8A8275] block mb-1">Unité</label>
                        <select value={conso.unite} onChange={e => setConso(f => ({ ...f, unite: e.target.value }))}
                          className="w-full border border-[#C4B89E] rounded-xl px-2 py-2 text-sm text-[#2C2A25] outline-none focus:border-[#BA7517] bg-[#F7F4EE]">
                          {UNITES.map(u => <option key={u} value={u}>{u}</option>)}
                        </select>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {erreur && <p className="text-xs text-rose-500 text-center">{erreur}</p>}

              <button onClick={handleSave} disabled={saving}
                className="w-full py-3.5 rounded-2xl bg-[#BA7517] text-white text-sm font-medium hover:bg-[#A36714] transition-colors disabled:opacity-50">
                {saving ? 'Enregistrement...' : editing ? 'Enregistrer les modifications' : `Ajouter le ${formType === 'soin' ? 'soin' : 'consommable'}`}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal import */}
      {showImport && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center z-50 p-4">
          <div className="bg-[#2C2A25] border border-[#4A4840] rounded-2xl p-6 w-full max-w-sm shadow-2xl flex flex-col gap-4 max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-[#F7F4EE]">Import en masse</p>
              <button onClick={() => { setShowImport(false); setImportText(''); setImportPreview([]) }} className="text-[#8A8275] hover:text-[#F7F4EE] text-xl leading-none">×</button>
            </div>

            <div className="bg-[#1E1C18] rounded-xl p-3 flex flex-col gap-1">
              <p className="text-[9px] tracking-widest uppercase text-[#5A5850] mb-1.5">Format — une ligne par article</p>
              <p className="text-[10px] text-[#6A6860] font-mono">Massage relaxant, 3500, 💆, 60</p>
              <p className="text-[10px] text-[#6A6860] font-mono">Soin du visage, 4500, 🧖</p>
              <p className="text-[10px] text-[#6A6860] font-mono">Huile essentielle, 1200, 🌿, consommable</p>
              <p className="text-[9px] text-[#5A5850] mt-2 leading-relaxed">nom, prix, emoji (optionnel), durée en min ou "consommable"</p>
            </div>

            <textarea value={importText} onChange={e => { setImportText(e.target.value); setImportPreview([]) }}
              placeholder="Coller votre liste ici..." rows={6}
              className="w-full border border-[#4A4840] rounded-xl px-4 py-3 text-sm bg-[#3A3830] text-[#F7F4EE] outline-none focus:border-[#BA7517] placeholder:text-[#5A5850] resize-none font-mono" />

            <button onClick={parseImport} disabled={!importText.trim()}
              className="w-full py-2.5 rounded-xl text-xs font-medium bg-[#3A3830] text-[#8A8275] hover:text-[#F7F4EE] transition-colors disabled:opacity-40 border border-[#4A4840]">
              Analyser ({importText.split('\n').filter(l => l.trim()).length} lignes)
            </button>

            {importPreview.length > 0 && (
              <>
                <div className="flex flex-col gap-1.5 max-h-44 overflow-y-auto">
                  <p className="text-[9px] tracking-widest uppercase text-[#5A5850]">{importPreview.length} article{importPreview.length > 1 ? 's' : ''} détecté{importPreview.length > 1 ? 's' : ''}</p>
                  {importPreview.map((p, i) => (
                    <div key={i} className="flex items-center gap-3 bg-[#3A3830] rounded-xl px-3 py-2">
                      <span className="text-lg flex-shrink-0">{p.emoji as string}</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium text-[#F7F4EE] truncate">{p.nom as string}</p>
                        <p className="text-[9px] text-[#5A5850]">
                          {p.categorie === 'consommable' ? 'Consommable' : `Soin${p.duree_minutes ? ` · ${p.duree_minutes} min` : ''}`}
                        </p>
                      </div>
                      <p className="text-xs font-semibold text-[#BA7517] flex-shrink-0">{(p.prix as number).toLocaleString('fr-FR')} DA</p>
                    </div>
                  ))}
                </div>
                <button onClick={handleImport} disabled={importing}
                  className="w-full bg-[#BA7517] text-white rounded-xl py-3 text-xs font-medium hover:bg-[#A36714] transition-colors disabled:opacity-40">
                  {importing ? 'Import...' : `Importer ${importPreview.length} article${importPreview.length > 1 ? 's' : ''}`}
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
