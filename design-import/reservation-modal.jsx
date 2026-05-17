// Nouvelle réservation — modal redesign
// Fixes:
//   - scrollbar: custom thin webkit scrollbar in beige
//   - header overflow: outer container has overflow:hidden so rounded corners clip header
//   - card rhythm: drop heavy white cards w/ borders → grouped sections with labels outside,
//     subtle dividers, single airy flow + sticky CTA at bottom
//   - radius consistency: modal 28, cards 20, inputs 12, chips 12

const SERVICES_MOCK = [
  { id: 's1', nom: 'Huile argan',    emoji: '🫧', prix: 2200, duree_minutes: 30 },
  { id: 's2', nom: 'Massage',        emoji: '✦', prix: 4500, duree_minutes: 60 },
  { id: 's3', nom: 'Massage visage', emoji: '🌿', prix: 3000, duree_minutes: 45 },
  { id: 's4', nom: 'Hammam',         emoji: '♨', prix: 3500, duree_minutes: 90 },
  { id: 's5', nom: 'Manucure',       emoji: '✿', prix: 1800, duree_minutes: 45 },
];

const CLIENTS_MOCK = [
  { id: 'c1', prenom: 'Yasmine',  nom: 'Belkacem',  telephone: '0555 12 34 56' },
  { id: 'c2', prenom: 'Amina',    nom: 'Hadj',      telephone: '0660 90 11 22' },
  { id: 'c3', prenom: 'Sarah',    nom: 'Mansouri',  telephone: '0551 78 45 33' },
  { id: 'c4', prenom: 'Leila',    nom: 'Bouzid',    telephone: '0770 12 88 99' },
  { id: 'c5', prenom: 'Nadia',    nom: 'Kaci',      telephone: '0666 33 21 90' },
];

const EMPLOYES_MOCK = [
  { id: 'e1', prenom: 'Khadija', nom: 'B.' },
  { id: 'e2', prenom: 'Rania',   nom: 'M.' },
  { id: 'e3', prenom: 'Sofiane', nom: 'K.' },
];

const HEURES_SUGGESTIONS = ['09:00', '10:00', '11:00', '14:00', '15:30', '17:00'];

function todayISO() { return new Date().toISOString().slice(0, 10); }

function NouvelleReservationModal({ open, onClose, layout = 'mobile', defaultDate }) {
  const [clientMode, setClientMode] = React.useState('existing');
  const [clientId, setClientId] = React.useState('');
  const [clientSearch, setClientSearch] = React.useState('');
  const [nomClient, setNomClient] = React.useState('');
  const [telClient, setTelClient] = React.useState('');
  const [serviceId, setServiceId] = React.useState('s2');
  const [employeId, setEmployeId] = React.useState('');
  const [date, setDate] = React.useState(defaultDate || todayISO());
  const [heure, setHeure] = React.useState('10:00');
  const [notes, setNotes] = React.useState('');
  const [erreur, setErreur] = React.useState('');
  const [saving, setSaving] = React.useState(false);

  React.useEffect(() => { if (open && defaultDate) setDate(defaultDate); }, [open, defaultDate]);

  if (!open) return null;

  const selectedClient = CLIENTS_MOCK.find(c => c.id === clientId);
  const selectedService = SERVICES_MOCK.find(s => s.id === serviceId);
  const filteredClients = clientSearch
    ? CLIENTS_MOCK.filter(c => `${c.prenom} ${c.nom} ${c.telephone}`.toLowerCase().includes(clientSearch.toLowerCase())).slice(0, 5)
    : [];

  const isMobile = layout === 'mobile';

  // ── Layout container ─────────────────────────────────────────
  // Mobile  → bottom-sheet, rounded-t only, anchored bottom, fills width
  // Desktop → centered card, rounded all sides, max-w-lg
  const overlayCls = isMobile
    ? 'absolute inset-0 bg-black/55 z-50 flex items-end justify-center backdrop-blur-[2px]'
    : 'absolute inset-0 bg-black/55 z-50 flex items-center justify-center p-6 backdrop-blur-[2px]';

  // max-h is % of parent (= device frame content area), not vh, so the sheet
  // never leaks below the iPhone / browser-window frames.
  const sheetCls = isMobile
    ? 'bg-[#F7F4EE] rounded-t-[28px] w-full max-h-[92%] flex flex-col overflow-hidden shadow-[0_-12px_40px_rgba(0,0,0,0.25)]'
    : 'bg-[#F7F4EE] rounded-[28px] w-full max-w-[460px] max-h-[calc(100%-48px)] flex flex-col overflow-hidden shadow-[0_24px_60px_rgba(0,0,0,0.35)]';

  const handleSave = () => {
    setErreur('');
    if (clientMode === 'existing' && !clientId) return setErreur('Sélectionnez un client');
    if (clientMode === 'new' && !nomClient.trim()) return setErreur('Saisissez le nom du client');
    if (!serviceId) return setErreur('Sélectionnez un service');
    setSaving(true);
    setTimeout(() => { setSaving(false); onClose(); }, 800);
  };

  return (
    <div className={overlayCls} onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className={sheetCls} onClick={e => e.stopPropagation()}>

        {/* ── Header (no own radius — parent overflow:hidden clips it cleanly) ── */}
        <div className="bg-[#2C2A25] px-6 pt-5 pb-5 relative flex-shrink-0">
          {isMobile && (
            <div className="absolute top-2 left-1/2 -translate-x-1/2 w-10 h-1 rounded-full bg-[#5C564B]/60" />
          )}
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              <p className="text-[10px] tracking-[0.18em] uppercase text-[#BA7517] font-medium mb-1">Agenda</p>
              <h2 className="text-[19px] font-medium text-[#F7F4EE] leading-tight" style={{ fontFamily: 'var(--font-cormorant)' }}>
                Nouvelle réservation
              </h2>
              <p className="text-[11px] text-[#8A8275] mt-0.5">Quelques informations et c'est en route.</p>
            </div>
            <button onClick={onClose}
              className="w-9 h-9 rounded-full bg-[#3A3830] text-[#C4B89E] hover:text-[#F7F4EE] hover:bg-[#46443B] transition-colors flex items-center justify-center flex-shrink-0">
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"><path d="M2 2L12 12M12 2L2 12"/></svg>
            </button>
          </div>
        </div>

        {/* ── Body (scroll area with custom thin scrollbar) ── */}
        <div className="modal-scroll flex-1 overflow-y-auto px-5 pt-5 pb-4 flex flex-col gap-5">

          {/* ── Section: Client ── */}
          <section>
            <SectionLabel>Client</SectionLabel>
            <div className="bg-white rounded-[20px] p-4 flex flex-col gap-3 shadow-[0_1px_0_rgba(44,42,37,0.04),0_4px_16px_-8px_rgba(44,42,37,0.08)]">
              <div className="flex gap-1 p-1 bg-[#EDE6D6] rounded-xl">
                {[
                  { id: 'existing', label: 'Client existant' },
                  { id: 'new',      label: 'Nouveau client' },
                ].map(m => (
                  <button key={m.id} onClick={() => { setClientMode(m.id); setClientId(''); setNomClient(''); setTelClient(''); setClientSearch(''); }}
                    className={`flex-1 py-2 rounded-lg text-[11px] font-medium transition-all ${
                      clientMode === m.id
                        ? 'bg-white text-[#2C2A25] shadow-[0_1px_3px_rgba(44,42,37,0.08)]'
                        : 'text-[#8A8275] hover:text-[#2C2A25]'
                    }`}>
                    {m.label}
                  </button>
                ))}
              </div>

              {clientMode === 'existing' ? (
                <div className="relative">
                  {selectedClient ? (
                    <div className="flex items-center justify-between bg-[#F7F4EE] border border-[#E8E0CE] rounded-xl px-3.5 py-2.5">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-8 h-8 rounded-full bg-[#BA7517]/15 text-[#BA7517] text-[12px] font-medium flex items-center justify-center flex-shrink-0">
                          {selectedClient.prenom[0]}{selectedClient.nom[0]}
                        </div>
                        <div className="min-w-0">
                          <p className="text-[13px] font-medium text-[#2C2A25] truncate leading-tight">{selectedClient.prenom} {selectedClient.nom}</p>
                          <p className="text-[10px] text-[#8A8275] truncate leading-tight mt-0.5">{selectedClient.telephone}</p>
                        </div>
                      </div>
                      <button onClick={() => { setClientId(''); setClientSearch(''); }}
                        className="text-[10px] text-[#BA7517] hover:underline flex-shrink-0">Changer</button>
                    </div>
                  ) : (
                    <>
                      <div className="relative">
                        <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#B0A898]" width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.6"><circle cx="6" cy="6" r="4.5"/><path d="M12.5 12.5L9.5 9.5"/></svg>
                        <input value={clientSearch} onChange={e => setClientSearch(e.target.value)}
                          placeholder="Rechercher par nom ou téléphone…"
                          className="w-full bg-[#F7F4EE] border border-[#E8E0CE] rounded-xl pl-9 pr-3.5 py-2.5 text-[13px] text-[#2C2A25] outline-none focus:border-[#BA7517] focus:bg-white transition-colors placeholder:text-[#B0A898]" />
                      </div>
                      {filteredClients.length > 0 && (
                        <div className="absolute top-full left-0 right-0 mt-1.5 bg-white border border-[#E8E0CE] rounded-xl shadow-[0_8px_24px_rgba(44,42,37,0.12)] overflow-hidden z-20">
                          {filteredClients.map(c => (
                            <button key={c.id} onClick={() => { setClientId(c.id); setClientSearch(''); }}
                              className="w-full px-3.5 py-2.5 text-left hover:bg-[#F7F4EE] border-b border-[#F0EADB] last:border-0 flex items-center gap-3 transition-colors">
                              <div className="w-7 h-7 rounded-full bg-[#BA7517]/15 text-[#BA7517] text-[10px] font-medium flex items-center justify-center flex-shrink-0">
                                {c.prenom[0]}{c.nom[0]}
                              </div>
                              <div className="min-w-0 flex-1">
                                <p className="text-[12.5px] font-medium text-[#2C2A25] truncate leading-tight">{c.prenom} {c.nom}</p>
                                <p className="text-[10px] text-[#8A8275] leading-tight mt-0.5">{c.telephone}</p>
                              </div>
                            </button>
                          ))}
                        </div>
                      )}
                    </>
                  )}
                </div>
              ) : (
                <div className="flex flex-col gap-2">
                  <input value={nomClient} onChange={e => setNomClient(e.target.value)}
                    placeholder="Nom complet *"
                    className="w-full bg-[#F7F4EE] border border-[#E8E0CE] rounded-xl px-3.5 py-2.5 text-[13px] text-[#2C2A25] outline-none focus:border-[#BA7517] focus:bg-white transition-colors placeholder:text-[#B0A898]" />
                  <input value={telClient} onChange={e => setTelClient(e.target.value)}
                    placeholder="Téléphone" type="tel"
                    className="w-full bg-[#F7F4EE] border border-[#E8E0CE] rounded-xl px-3.5 py-2.5 text-[13px] text-[#2C2A25] outline-none focus:border-[#BA7517] focus:bg-white transition-colors placeholder:text-[#B0A898]" />
                  <p className="text-[10px] text-[#8A8275] flex items-center gap-1.5 mt-0.5">
                    <svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"><circle cx="5" cy="5" r="4"/><path d="M5 3v2.5M5 7v.01"/></svg>
                    Ce client sera ajouté à votre liste.
                  </p>
                </div>
              )}
            </div>
          </section>

          {/* ── Section: Service ── */}
          <section>
            <SectionLabel required>Service</SectionLabel>
            <div className="bg-white rounded-[20px] p-2 shadow-[0_1px_0_rgba(44,42,37,0.04),0_4px_16px_-8px_rgba(44,42,37,0.08)]">
              <div className="flex flex-col">
                {SERVICES_MOCK.map((s, i) => {
                  const selected = serviceId === s.id;
                  return (
                    <button key={s.id} onClick={() => setServiceId(s.id)}
                      className={`flex items-center gap-3 px-3 py-3 rounded-xl text-left transition-all ${
                        selected ? 'bg-[#BA7517]/8' : 'hover:bg-[#F7F4EE]'
                      } ${i > 0 && !selected ? 'border-t border-[#F2EBDB]' : ''}`}
                      style={selected ? {} : (i > 0 ? { marginTop: 0 } : {})}>
                      <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-base flex-shrink-0 transition-colors ${
                        selected ? 'bg-[#BA7517]/15' : 'bg-[#F2EBDB]'
                      }`}>
                        {s.emoji}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[13px] font-medium text-[#2C2A25] truncate leading-tight">{s.nom}</p>
                        <p className="text-[10.5px] text-[#8A8275] leading-tight mt-0.5">
                          {s.prix.toLocaleString('fr-FR')} DA · {s.duree_minutes} min
                        </p>
                      </div>
                      <div className={`w-5 h-5 rounded-full flex items-center justify-center transition-all flex-shrink-0 ${
                        selected ? 'bg-[#BA7517] text-white' : 'border border-[#D9D0B8]'
                      }`}>
                        {selected && <svg width="9" height="9" viewBox="0 0 9 9" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1.5 4.5L3.5 6.5L7.5 2.5"/></svg>}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </section>

          {/* ── Section: Quand ── */}
          <section>
            <SectionLabel required>Quand</SectionLabel>
            <div className="bg-white rounded-[20px] p-4 flex flex-col gap-3 shadow-[0_1px_0_rgba(44,42,37,0.04),0_4px_16px_-8px_rgba(44,42,37,0.08)]">
              <div className="grid grid-cols-2 gap-2.5">
                <DateField label="Date" type="date" value={date} onChange={setDate} />
                <DateField label="Heure" type="time" value={heure} onChange={setHeure} />
              </div>
              <div className="flex flex-wrap gap-1.5">
                {HEURES_SUGGESTIONS.map(h => (
                  <button key={h} onClick={() => setHeure(h)}
                    className={`px-2.5 py-1 rounded-lg text-[10.5px] font-medium transition-all border ${
                      heure === h
                        ? 'bg-[#2C2A25] text-[#F7F4EE] border-[#2C2A25]'
                        : 'bg-[#F7F4EE] text-[#6B6560] border-[#E8E0CE] hover:border-[#BA7517]/40 hover:text-[#2C2A25]'
                    }`}>
                    {h}
                  </button>
                ))}
              </div>
              {selectedService && (
                <div className="flex items-center gap-2 text-[10.5px] text-[#8A8275] bg-[#F7F4EE] rounded-lg px-3 py-2">
                  <svg width="11" height="11" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"><circle cx="6" cy="6" r="4.5"/><path d="M6 3.5V6L7.5 7"/></svg>
                  Durée prévue : <span className="text-[#2C2A25] font-medium">{selectedService.duree_minutes} min</span>
                  <span className="text-[#D9D0B8]">·</span>
                  Fin estimée à <span className="text-[#2C2A25] font-medium">{computeEndTime(heure, selectedService.duree_minutes)}</span>
                </div>
              )}
            </div>
          </section>

          {/* ── Section: Détails ── */}
          <section>
            <SectionLabel>Détails <span className="text-[#B0A898] font-normal normal-case tracking-normal text-[10px] ml-1">optionnel</span></SectionLabel>
            <div className="bg-white rounded-[20px] p-4 flex flex-col gap-3 shadow-[0_1px_0_rgba(44,42,37,0.04),0_4px_16px_-8px_rgba(44,42,37,0.08)]">
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] text-[#8A8275] uppercase tracking-wider">Praticien</label>
                <div className="flex gap-1.5 flex-wrap">
                  <button onClick={() => setEmployeId('')}
                    className={`px-3 py-1.5 rounded-lg text-[11px] transition-all border ${
                      !employeId ? 'bg-[#2C2A25] text-[#F7F4EE] border-[#2C2A25]' : 'bg-[#F7F4EE] text-[#6B6560] border-[#E8E0CE] hover:border-[#BA7517]/40'
                    }`}>
                    Non assigné
                  </button>
                  {EMPLOYES_MOCK.map(e => (
                    <button key={e.id} onClick={() => setEmployeId(e.id)}
                      className={`px-3 py-1.5 rounded-lg text-[11px] transition-all border flex items-center gap-1.5 ${
                        employeId === e.id ? 'bg-[#2C2A25] text-[#F7F4EE] border-[#2C2A25]' : 'bg-[#F7F4EE] text-[#6B6560] border-[#E8E0CE] hover:border-[#BA7517]/40'
                      }`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${employeId === e.id ? 'bg-[#BA7517]' : 'bg-[#C4B89E]'}`} />
                      {e.prenom} {e.nom}
                    </button>
                  ))}
                </div>
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] text-[#8A8275] uppercase tracking-wider">Notes</label>
                <textarea value={notes} onChange={e => setNotes(e.target.value)}
                  placeholder="Allergies, préférences, demandes spéciales…"
                  rows={2}
                  className="w-full bg-[#F7F4EE] border border-[#E8E0CE] rounded-xl px-3.5 py-2.5 text-[13px] text-[#2C2A25] outline-none focus:border-[#BA7517] focus:bg-white transition-colors placeholder:text-[#B0A898] resize-none" />
              </div>
            </div>
          </section>

          {erreur && (
            <div className="bg-rose-50 border border-rose-200 text-rose-700 text-[11.5px] rounded-xl px-3.5 py-2.5 flex items-center gap-2">
              <svg width="13" height="13" viewBox="0 0 13 13" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><circle cx="6.5" cy="6.5" r="5"/><path d="M6.5 4v3M6.5 9v.01"/></svg>
              {erreur}
            </div>
          )}
        </div>

        {/* ── Sticky footer ── */}
        <div className="flex-shrink-0 px-5 pt-3 pb-5 bg-[#F7F4EE] border-t border-[#E8E0CE]/60 relative">
          <div className="absolute -top-6 left-0 right-0 h-6 bg-gradient-to-t from-[#F7F4EE] to-transparent pointer-events-none" />
          <div className="flex items-center gap-3">
            {selectedService && (
              <div className="flex flex-col leading-tight">
                <span className="text-[9.5px] uppercase tracking-wider text-[#8A8275]">Total</span>
                <span className="text-[16px] font-medium text-[#2C2A25]" style={{ fontFamily: 'var(--font-cormorant)' }}>
                  {selectedService.prix.toLocaleString('fr-FR')} <span className="text-[11px] text-[#8A8275]">DA</span>
                </span>
              </div>
            )}
            <button onClick={handleSave} disabled={saving}
              className="flex-1 py-3 rounded-xl bg-[#BA7517] text-white text-[13px] font-medium hover:bg-[#A36714] transition-colors disabled:opacity-60 flex items-center justify-center gap-2 shadow-[0_4px_14px_-4px_rgba(186,117,23,0.5)]">
              {saving ? (
                <>
                  <svg className="animate-spin" width="14" height="14" viewBox="0 0 14 14" fill="none"><circle cx="7" cy="7" r="5.5" stroke="currentColor" strokeOpacity="0.3" strokeWidth="1.6"/><path d="M12.5 7A5.5 5.5 0 0 0 7 1.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/></svg>
                  Enregistrement…
                </>
              ) : (
                <>
                  Confirmer la réservation
                  <svg width="13" height="13" viewBox="0 0 13 13" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M2.5 6.5h8M7 3l3.5 3.5L7 10"/></svg>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function SectionLabel({ children, required }) {
  return (
    <div className="flex items-center gap-2 px-1 mb-2">
      <span className="text-[10px] font-medium tracking-[0.14em] uppercase text-[#8A8275]">
        {children}
      </span>
      {required && <span className="text-[#BA7517] text-[10px]">*</span>}
      <div className="h-px flex-1 bg-[#D9D0B8]/40" />
    </div>
  );
}

function DateField({ label, type, value, onChange }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-[10px] text-[#8A8275] uppercase tracking-wider">{label}</label>
      <input type={type} value={value} onChange={e => onChange(e.target.value)}
        className="w-full bg-[#F7F4EE] border border-[#E8E0CE] rounded-xl px-3 py-2.5 text-[13px] text-[#2C2A25] outline-none focus:border-[#BA7517] focus:bg-white transition-colors" />
    </div>
  );
}

function computeEndTime(heure, dureeMin) {
  if (!heure) return '';
  const [h, m] = heure.split(':').map(Number);
  const total = h * 60 + m + dureeMin;
  const eh = Math.floor(total / 60) % 24;
  const em = total % 60;
  return `${String(eh).padStart(2, '0')}:${String(em).padStart(2, '0')}`;
}

Object.assign(window, { NouvelleReservationModal, SERVICES_MOCK, CLIENTS_MOCK, EMPLOYES_MOCK });
