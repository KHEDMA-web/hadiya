// Reservations page — all 3 views (Jour / Semaine / Mois) sharing one Date
// state so clicks anywhere navigate consistently. Mock data is keyed by
// weekday-index since the original prototype was, but the UI uses real Dates.

const RESERVATIONS_MOCK = [
  // r.date is a weekday-index (0=Mon … 6=Sun) — the prototype reuses the same
  // shape for any week.
  { id: 'r1', date: 0, heure: '09:30', duree: 60, client: 'Yasmine Belkacem', tel: '0555 12 34 56', service: '✦ Massage',        employe: 'Khadija B.', statut: 'confirme'   },
  { id: 'r2', date: 0, heure: '11:00', duree: 45, client: 'Amina Hadj',       tel: '0660 90 11 22', service: '🌿 Massage visage', employe: 'Rania M.',   statut: 'confirme'   },
  { id: 'r3', date: 0, heure: '14:00', duree: 90, client: 'Sarah Mansouri',   tel: '0551 78 45 33', service: '♨ Hammam',         employe: 'Khadija B.', statut: 'en_attente' },
  { id: 'r4', date: 0, heure: '16:30', duree: 30, client: 'Leila Bouzid',     tel: '0770 12 88 99', service: '🫧 Huile argan',    employe: null,         statut: 'en_attente' },

  { id: 'r5', date: 1, heure: '10:00', duree: 60, client: 'Nadia Kaci',       tel: '0666 33 21 90', service: '✦ Massage',        employe: 'Rania M.',   statut: 'confirme'   },
  { id: 'r6', date: 1, heure: '15:00', duree: 45, client: 'Sofia Lounis',     tel: '0555 99 88 77', service: '✿ Manucure',       employe: 'Khadija B.', statut: 'en_attente' },

  { id: 'r7', date: 2, heure: '11:30', duree: 90, client: 'Inès Brahimi',     tel: '0770 55 44 33', service: '♨ Hammam',         employe: 'Sofiane K.', statut: 'confirme'   },

  { id: 'r8', date: 4, heure: '09:00', duree: 30, client: 'Hanane Saidi',     tel: '0551 11 22 33', service: '🫧 Huile argan',    employe: 'Rania M.',   statut: 'confirme'   },
  { id: 'r9', date: 4, heure: '14:30', duree: 60, client: 'Mounia Rahim',     tel: '0660 77 66 55', service: '🌿 Massage visage', employe: 'Khadija B.', statut: 'en_attente' },
];

const STATUT_CFG = {
  en_attente: { label: 'En attente', dot: '#BA7517', bg: 'rgba(186,117,23,0.10)', text: '#BA7517', border: 'rgba(186,117,23,0.25)' },
  confirme:   { label: 'Confirmé',   dot: '#059669', bg: 'rgba(16,185,129,0.10)', text: '#059669', border: 'rgba(16,185,129,0.25)' },
  annule:     { label: 'Annulé',     dot: '#DC2626', bg: 'rgba(239,68,68,0.10)',  text: '#DC2626', border: 'rgba(239,68,68,0.25)'  },
  termine:    { label: 'Terminé',    dot: '#6B6560', bg: 'rgba(138,130,117,0.10)',text: '#6B6560', border: 'rgba(138,130,117,0.25)'},
};

const JOURS_COURT = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];
const MOIS_NOMS   = ['Janvier','Février','Mars','Avril','Mai','Juin','Juillet','Août','Septembre','Octobre','Novembre','Décembre'];

// Weekday index Mon=0 … Sun=6
function weekdayIdx(d) { return (d.getDay() + 6) % 7; }
function startOfWeek(d) {
  const r = new Date(d);
  r.setDate(d.getDate() - weekdayIdx(d));
  r.setHours(0, 0, 0, 0);
  return r;
}
function addDays(d, n) { const r = new Date(d); r.setDate(d.getDate() + n); return r; }
function sameDay(a, b) { return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate(); }

function reservationsForDate(d) {
  return RESERVATIONS_MOCK.filter(r => r.date === weekdayIdx(d)).sort((a, b) => a.heure.localeCompare(b.heure));
}
function countForDate(d) { return reservationsForDate(d).length; }

function ReservationsPage({ layout = 'mobile', onOpenModal }) {
  const [viewMode, setViewMode] = React.useState('jour');
  const today = React.useMemo(() => new Date(), []);
  const [selectedDate, setSelectedDate] = React.useState(today);
  // Month view shows the month of viewedMonth (anchored on 1st)
  const [viewedMonth, setViewedMonth] = React.useState(new Date(today.getFullYear(), today.getMonth(), 1));

  const isMobile = layout === 'mobile';

  const weekStart = startOfWeek(selectedDate);
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
  const monLabel = selectedDate.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });
  const selectedDateLabel = selectedDate.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' });

  const pickDate = (d) => {
    setSelectedDate(d);
    setViewMode('jour');
  };

  return (
    <div className="h-full w-full bg-[#E8E2D5] overflow-hidden flex flex-col">

      {/* ── Top header ── */}
      <div className="bg-[#2C2A25] flex-shrink-0" style={{ paddingTop: isMobile ? 48 : 0 }}>
        <div className={`flex items-center gap-3 ${isMobile ? 'px-4 pt-2 pb-3.5' : 'px-6 py-4'}`}>
          <button className="w-9 h-9 rounded-full bg-[#3A3830] text-[#C4B89E] hover:text-[#F7F4EE] flex items-center justify-center transition-colors">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
          </button>
          <div className="flex-1 min-w-0">
            <h1 className="font-medium text-[#F7F4EE] leading-tight" style={{ fontFamily: 'var(--font-cormorant)', fontSize: isMobile ? 18 : 20 }}>Réservations</h1>
            <p className="text-[10px] text-[#BA7517] tracking-wide capitalize leading-tight mt-0.5">
              {viewMode === 'mois'
                ? `${MOIS_NOMS[viewedMonth.getMonth()]} ${viewedMonth.getFullYear()}`
                : selectedDateLabel}
            </p>
          </div>
          <button onClick={onOpenModal}
            className="flex items-center gap-1.5 bg-[#BA7517] text-white rounded-xl px-3.5 py-2 text-[12px] font-medium hover:bg-[#A36714] transition-colors shadow-[0_4px_12px_-4px_rgba(186,117,23,0.6)]">
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M6 1.5v9M1.5 6h9"/></svg>
            Nouvelle
          </button>
        </div>

        {/* View tabs */}
        <div className={`flex gap-1 ${isMobile ? 'px-4 pb-3' : 'px-6 pb-3'}`}>
          {[
            { id: 'jour',    label: 'Jour' },
            { id: 'semaine', label: 'Semaine' },
            { id: 'mois',    label: 'Mois' },
          ].map(v => (
            <button key={v.id} onClick={() => setViewMode(v.id)}
              className={`flex-1 py-1.5 rounded-lg text-[11px] font-medium transition-colors ${
                viewMode === v.id ? 'bg-[#BA7517] text-white' : 'text-[#8A8275] hover:text-[#F7F4EE] hover:bg-[#3A3830]/40'
              }`}>
              {v.label}
            </button>
          ))}
        </div>

        {/* Mini weekly strip — visible in jour & semaine */}
        {viewMode !== 'mois' && (
          <div className={`${isMobile ? 'px-4 pb-4' : 'px-6 pb-5'}`}>
            <div className="flex items-center justify-between mb-3">
              <button onClick={() => setSelectedDate(addDays(selectedDate, viewMode === 'jour' ? -1 : -7))}
                className="w-7 h-7 rounded-lg bg-[#3A3830] text-[#8A8275] hover:text-[#F7F4EE] flex items-center justify-center transition-colors">
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
              </button>
              <span className="text-[10px] text-[#8A8275] tracking-widest uppercase capitalize">
                {viewMode === 'jour' ? selectedDateLabel : monLabel}
              </span>
              <button onClick={() => setSelectedDate(addDays(selectedDate, viewMode === 'jour' ? 1 : 7))}
                className="w-7 h-7 rounded-lg bg-[#3A3830] text-[#8A8275] hover:text-[#F7F4EE] flex items-center justify-center transition-colors">
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"/></svg>
              </button>
            </div>
            <div className="grid grid-cols-7 gap-1">
              {weekDays.map((d, i) => {
                const isSelected = sameDay(d, selectedDate);
                const isToday = sameDay(d, today);
                const dayCount = countForDate(d);
                return (
                  <button key={i} onClick={() => setSelectedDate(d)}
                    className={`flex flex-col items-center py-2 rounded-xl transition-all ${
                      isSelected
                        ? 'bg-[#BA7517] shadow-[0_2px_8px_rgba(186,117,23,0.4)]'
                        : isToday
                        ? 'bg-[#3A3830] border border-[#BA7517]/40'
                        : 'hover:bg-[#3A3830]'
                    }`}>
                    <span className={`text-[9px] uppercase tracking-wide ${isSelected ? 'text-white/80' : 'text-[#8A8275]'}`}>{JOURS_COURT[i]}</span>
                    <span className={`text-[14px] font-semibold mt-0.5 ${isSelected ? 'text-white' : isToday ? 'text-[#BA7517]' : 'text-[#F7F4EE]/70'}`}>{d.getDate()}</span>
                    {dayCount > 0 && (
                      <span className={`mt-1 text-[8px] font-bold ${isSelected ? 'text-white/90' : 'text-[#BA7517]'}`}>{dayCount}</span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Month-view nav */}
        {viewMode === 'mois' && (
          <div className={`${isMobile ? 'px-4 pb-4' : 'px-6 pb-5'} flex items-center justify-between`}>
            <button onClick={() => setViewedMonth(new Date(viewedMonth.getFullYear(), viewedMonth.getMonth() - 1, 1))}
              className="w-8 h-8 rounded-xl bg-[#3A3830] text-[#8A8275] hover:text-[#F7F4EE] flex items-center justify-center">
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
            </button>
            <span className="text-[12px] text-[#F7F4EE] font-medium capitalize">{MOIS_NOMS[viewedMonth.getMonth()]} {viewedMonth.getFullYear()}</span>
            <button onClick={() => setViewedMonth(new Date(viewedMonth.getFullYear(), viewedMonth.getMonth() + 1, 1))}
              className="w-8 h-8 rounded-xl bg-[#3A3830] text-[#8A8275] hover:text-[#F7F4EE] flex items-center justify-center">
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"/></svg>
            </button>
          </div>
        )}
      </div>

      {/* ── Body ── */}
      <div className={`flex-1 overflow-y-auto app-scroll ${isMobile ? 'p-4 pb-12' : 'p-6'}`}>
        {viewMode === 'jour'    && <DayView    selectedDate={selectedDate} />}
        {viewMode === 'semaine' && <WeekView   weekDays={weekDays} today={today} onPickDay={pickDate} />}
        {viewMode === 'mois'    && <MonthView  viewedMonth={viewedMonth} today={today} onPickDay={pickDate} />}
      </div>
    </div>
  );
}

// ── DAY VIEW ─────────────────────────────────────────────────
function DayView({ selectedDate }) {
  const dayResos = reservationsForDate(selectedDate);
  const totals = {
    total: dayResos.length,
    confirme: dayResos.filter(r => r.statut === 'confirme').length,
    en_attente: dayResos.filter(r => r.statut === 'en_attente').length,
  };

  return (
    <div className="max-w-lg mx-auto flex flex-col gap-3">
      {dayResos.length > 0 ? (
        <>
          <div className="grid grid-cols-3 gap-2">
            {[
              { label: 'Total',     val: totals.total,      color: '#2C2A25' },
              { label: 'Confirmés', val: totals.confirme,   color: '#059669' },
              { label: 'En attente',val: totals.en_attente, color: '#BA7517' },
            ].map(s => (
              <div key={s.label} className="bg-white rounded-xl p-3 text-center border border-[#E8E0CE]">
                <p className="text-[20px] font-medium leading-none" style={{ color: s.color, fontFamily: 'var(--font-cormorant)' }}>{s.val}</p>
                <p className="text-[9px] text-[#8A8275] uppercase tracking-wide mt-1">{s.label}</p>
              </div>
            ))}
          </div>
          {dayResos.map(r => <ReservationCard key={r.id} r={r} />)}
        </>
      ) : (
        <EmptyState />
      )}
    </div>
  );
}

// ── WEEK VIEW ────────────────────────────────────────────────
function WeekView({ weekDays, today, onPickDay }) {
  return (
    <div className="max-w-lg mx-auto flex flex-col gap-4">
      {weekDays.map((d, i) => {
        const dayResos = reservationsForDate(d);
        const isToday = sameDay(d, today);
        const label = d.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' });
        return (
          <div key={i}>
            <button onClick={() => onPickDay(d)} className="w-full flex items-center gap-2 mb-2 text-left">
              <span className={`text-[12px] font-semibold capitalize ${isToday ? 'text-[#BA7517]' : 'text-[#2C2A25]'}`}>{label}</span>
              {dayResos.length > 0 && (
                <span className="text-[9px] bg-[#BA7517]/15 text-[#BA7517] rounded-full px-2 py-0.5 font-medium">{dayResos.length} rdv</span>
              )}
              <div className="flex-1 h-px bg-[#C4B89E]/40 ml-2" />
            </button>
            {dayResos.length === 0 ? (
              <div className="bg-white/60 border border-dashed border-[#C4B89E] rounded-2xl p-4 text-center">
                <p className="text-[11px] text-[#8A8275]">Aucune réservation</p>
              </div>
            ) : (
              <div className="flex flex-col gap-2">
                {dayResos.map(r => <ReservationCard key={r.id} r={r} compact />)}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ── MONTH VIEW ───────────────────────────────────────────────
// Click on ANY date → switch to jour view for that date.
function MonthView({ viewedMonth, today, onPickDay }) {
  const year = viewedMonth.getFullYear();
  const month = viewedMonth.getMonth();
  const firstDay = new Date(year, month, 1);
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstWeekday = weekdayIdx(firstDay);

  const cells = [];
  for (let i = 0; i < firstWeekday; i++) cells.push({ date: null });
  for (let d = 1; d <= daysInMonth; d++) {
    const dateObj = new Date(year, month, d);
    cells.push({ date: dateObj, count: countForDate(dateObj), isToday: sameDay(dateObj, today) });
  }
  while (cells.length % 7 !== 0) cells.push({ date: null });

  const monthTotal = cells.reduce((sum, c) => sum + (c.count || 0), 0);

  return (
    <div className="max-w-lg mx-auto flex flex-col gap-4">
      <div className="bg-[#2C2A25] rounded-2xl overflow-hidden">
        <div className="grid grid-cols-7 border-b border-[#3A3830]">
          {JOURS_COURT.map(j => (
            <div key={j} className="py-2 text-center text-[9px] text-[#8A8275] uppercase tracking-wider">{j}</div>
          ))}
        </div>
        <div className="grid grid-cols-7">
          {cells.map((cell, idx) => {
            if (!cell.date) return <div key={idx} className="aspect-square border-b border-r border-[#3A3830]/40 last:border-r-0" />;
            const hasResos = cell.count > 0;
            return (
              <button key={idx} onClick={() => onPickDay(cell.date)}
                className={`aspect-square flex flex-col items-center justify-center border-b border-r border-[#3A3830]/40 transition-all hover:bg-[#3A3830]/60 active:bg-[#BA7517]/20 ${cell.isToday ? 'bg-[#3A3830]' : ''}`}>
                <span className={`text-[12px] font-semibold ${cell.isToday ? 'text-[#BA7517]' : 'text-[#F7F4EE]/70'}`}>
                  {cell.date.getDate()}
                </span>
                {hasResos ? (
                  <div className="flex gap-0.5 mt-1 justify-center items-center">
                    {Array.from({ length: Math.min(cell.count, 3) }).map((_, i) => (
                      <span key={i} className="w-1 h-1 rounded-full bg-[#BA7517]" />
                    ))}
                    {cell.count > 3 && <span className="text-[7px] text-[#BA7517] leading-none ml-0.5">+</span>}
                  </div>
                ) : (
                  <div className="mt-1 h-1" />
                )}
              </button>
            );
          })}
        </div>
      </div>

      <div className="flex items-center justify-between px-1">
        <p className="text-[10px] text-[#8A8275]">{monthTotal} réservation{monthTotal > 1 ? 's' : ''} ce mois · tapez sur un jour pour le voir</p>
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-[#BA7517]" />
          <span className="text-[9px] text-[#8A8275]">Réservation</span>
        </div>
      </div>
    </div>
  );
}

// ── Sub-components ───────────────────────────────────────────
function ReservationCard({ r, compact = false }) {
  const cfg = STATUT_CFG[r.statut];
  return (
    <div className={`bg-white border border-[#E8E0CE] rounded-2xl shadow-[0_1px_0_rgba(44,42,37,0.04)] flex flex-col gap-2.5 ${compact ? 'p-3' : 'p-3.5'}`}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <div className="flex flex-col items-center bg-[#F7F4EE] rounded-xl px-3 py-1.5 flex-shrink-0 border border-[#E8E0CE]">
            <span className="text-[13px] font-semibold text-[#BA7517] leading-none">{r.heure}</span>
            <span className="text-[9px] text-[#8A8275] mt-0.5">{r.duree} min</span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[13px] font-semibold text-[#2C2A25] truncate leading-tight">{r.client}</p>
            <p className="text-[10px] text-[#8A8275] mt-0.5 leading-tight">{r.tel}</p>
            <div className="flex items-center gap-2 mt-1">
              <p className="text-[11px] text-[#BA7517] leading-tight">{r.service}</p>
              {r.employe && <span className="text-[#D9D0B8] text-[10px]">·</span>}
              {r.employe && <p className="text-[10px] text-[#8A8275] leading-tight">{r.employe}</p>}
            </div>
          </div>
        </div>
        <span className="text-[9px] font-semibold px-2 py-1 rounded-lg flex-shrink-0" style={{ background: cfg.bg, color: cfg.text, border: `1px solid ${cfg.border}` }}>
          {cfg.label}
        </span>
      </div>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="bg-white border border-[#E8E0CE] rounded-2xl p-10 text-center shadow-sm">
      <p className="text-3xl mb-3 opacity-30">📅</p>
      <p className="text-[13px] font-medium text-[#2C2A25]">Aucune réservation</p>
      <p className="text-[11px] text-[#8A8275] mt-1">Profitez de la journée 🌿</p>
    </div>
  );
}

Object.assign(window, { ReservationsPage, RESERVATIONS_MOCK });
