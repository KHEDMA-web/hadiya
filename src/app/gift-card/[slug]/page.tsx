"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { supabase } from "@/lib/supabase";

interface SalonInfo {
  id: string;
  nom: string;
  slug: string;
  logo_url: string | null;
}

interface FormState {
  firstName: string;
  lastName: string;
  phone: string;
  email: string;
  birthDate: string;
  from: string;
  message: string;
  selectedAmount: number | null;
  customAmount: string;
}

const PRESET_AMOUNTS = [5000, 10000, 15000, 20000];
const STEPS = ["Bénéficiaire", "Message", "Montant", "Paiement"];
const INITIAL_FORM: FormState = {
  firstName: "", lastName: "", phone: "", email: "",
  birthDate: "", from: "", message: "", selectedAmount: null, customAmount: "",
};

export default function GiftCardSalonPage() {
  const params = useParams();
  const slug = params.slug as string;
  const [salon, setSalon] = useState<SalonInfo | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [step, setStep] = useState(0);
  const [form, setForm] = useState<FormState>(INITIAL_FORM);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!slug) return;
    supabase
      .from("salons")
      .select("id, nom, slug, logo_url")
      .eq("slug", slug)
      .single()
      .then(({ data }) => {
        if (data) setSalon(data);
        else setNotFound(true);
      });
  }, [slug]);

  const setField = (field: keyof FormState, value: string | number | null) =>
    setForm((f) => ({ ...f, [field]: value }));

  const amount: number =
    form.selectedAmount !== null ? form.selectedAmount
    : form.customAmount ? parseInt(form.customAmount, 10) : 0;

  const canNext = (): boolean => {
    if (step === 0) return !!(form.firstName && form.lastName && form.phone);
    if (step === 1) return !!form.from;
    if (step === 2) return amount >= 1000;
    return true;
  };

  const handlePay = async () => {
    if (!salon) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount, currency: "dzd",
          salonId: salon.id,
          beneficiaryFirstName: form.firstName,
          beneficiaryLastName: form.lastName,
          beneficiaryPhone: form.phone,
          beneficiaryEmail: form.email || undefined,
          beneficiaryBirthDate: form.birthDate || undefined,
          offeredBy: form.from,
          message: form.message || undefined,
        }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error((body as { error?: string })?.error ?? "Erreur paiement.");
      }
      const data = await res.json() as { checkout_url?: string };
      if (data.checkout_url) window.location.href = data.checkout_url;
      else throw new Error("URL de paiement introuvable.");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Une erreur est survenue.");
      setLoading(false);
    }
  };

  if (notFound) {
    return (
      <div style={{ minHeight: "100vh", background: "#F4EFE6", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 16, padding: 24 }}>
        <p style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 28, color: "#1C1C1A", letterSpacing: "0.1em" }}>Salon introuvable</p>
        <p style={{ fontFamily: "'Jost', sans-serif", fontSize: 14, color: "#8A8070" }}>Ce lien de paiement n&apos;existe pas ou a été désactivé.</p>
      </div>
    );
  }

  if (!salon) {
    return (
      <div style={{ minHeight: "100vh", background: "#F4EFE6", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ width: 24, height: 24, border: "2px solid #E8D9B8", borderTopColor: "#C4922A", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
      </div>
    );
  }

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,600;1,300;1,400&family=Jost:wght@300;400;500&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        html, body { background: #F4EFE6; }
        input, textarea { font-family: 'Jost', sans-serif; outline: none; transition: border-color 0.2s, box-shadow 0.2s; }
        input:focus, textarea:focus { border-color: #C4922A !important; box-shadow: 0 0 0 3px rgba(196,146,42,0.12); }
        ::placeholder { color: #B8AFA0; }
        .amount-card { cursor: pointer; transition: all 0.2s ease; }
        .amount-card:hover { transform: translateY(-2px); border-color: #C4922A !important; }
        .btn-gold { transition: all 0.2s ease; cursor: pointer; }
        .btn-gold:hover:not(:disabled) { background: #A87820 !important; transform: translateY(-1px); box-shadow: 0 6px 20px rgba(196,146,42,0.35) !important; }
        .btn-gold:disabled { opacity: 0.45; cursor: not-allowed; }
        @keyframes fadeUp { from { opacity: 0; transform: translateY(16px); } to { opacity: 1; transform: translateY(0); } }
        .fade-up { animation: fadeUp 0.4s ease forwards; }
        @keyframes spin { to { transform: rotate(360deg); } }
        .spinner { animation: spin 0.8s linear infinite; display: inline-block; }
      `}</style>
      <div style={st.root}>
        <div style={st.header}>
          {salon.logo_url && (
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 18 }}>
              <img src={salon.logo_url} alt={salon.nom} style={{ width: 72, height: 72, borderRadius: 18, objectFit: 'cover', border: '1px solid rgba(196,146,42,0.35)', boxShadow: '0 4px 16px rgba(0,0,0,0.3)' }} />
            </div>
          )}
          <div style={st.headerLines}>
            <span style={st.lineL} />
            <span style={st.brandName}>{salon.nom.toUpperCase()}</span>
            <span style={st.lineR} />
          </div>
          <p style={st.tagline}>Offrez une expérience inoubliable</p>
          <p style={st.poweredBy}>Propulsé par HADIYA</p>
        </div>

        <div style={st.progressWrap}>
          {STEPS.map((label, i) => (
            <div key={i} style={st.stepItem}>
              <div style={{ ...st.stepDot, background: i <= step ? "#C4922A" : "#E0D8CC", border: i === step ? "2px solid #8B6515" : "2px solid transparent", transform: i === step ? "scale(1.2)" : "scale(1)", transition: "all 0.3s ease" }} />
              <span style={{ ...st.stepLabel, color: i <= step ? "#C4922A" : "#B8AFA0", fontWeight: i === step ? 500 : 300 }}>{label}</span>
              {i < STEPS.length - 1 && <div style={{ ...st.stepLine, background: i < step ? "#C4922A" : "#E0D8CC" }} />}
            </div>
          ))}
        </div>

        <div style={st.card} className="fade-up" key={step}>
          {step === 0 && (
            <div>
              <SectionTitle icon="✦" label="BÉNÉFICIAIRE" />
              <p style={st.hint}>La personne qui recevra la carte cadeau</p>
              <div style={st.row}>
                <Field placeholder="Prénom *" value={form.firstName} onChange={(v) => setField("firstName", v)} />
                <Field placeholder="Nom *" value={form.lastName} onChange={(v) => setField("lastName", v)} />
              </div>
              <Field placeholder="Numéro WhatsApp * (ex: 0550 000 000)" value={form.phone} onChange={(v) => setField("phone", v)} type="tel" />
              <Field placeholder="Adresse email" value={form.email} onChange={(v) => setField("email", v)} type="email" />
              <Field placeholder=" " label="Date d'anniversaire (optionnel)" value={form.birthDate} onChange={(v) => setField("birthDate", v)} type="date" />
            </div>
          )}

          {step === 1 && (
            <div>
              <SectionTitle icon="✉" label="MESSAGE PERSONNALISÉ" />
              <p style={st.hint}>Ajoutez une touche personnelle à votre cadeau</p>
              <Field placeholder="Offert par * (votre nom)" value={form.from} onChange={(v) => setField("from", v)} />
              <div style={{ marginTop: 16 }}>
                <textarea rows={5} placeholder="Votre message personnalisé… ✨" value={form.message} onChange={(e) => setField("message", e.target.value)} style={st.textarea} />
              </div>
              {(form.from || form.message) && (
                <div style={st.previewCard}>
                  <div style={st.previewHeader}>
                    <span style={st.previewLogo}>
                      {salon.logo_url
                        ? <img src={salon.logo_url} alt={salon.nom} style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 8 }} />
                        : salon.nom[0].toUpperCase()
                      }
                    </span>
                    <span style={st.previewBrand}>{salon.nom.toUpperCase()}</span>
                  </div>
                  <p style={st.previewTo}>Pour <strong>{form.firstName || "…"} {form.lastName}</strong></p>
                  {form.message && <p style={st.previewMessage}>&ldquo;{form.message}&rdquo;</p>}
                  <p style={st.previewFrom}>— {form.from || "…"}</p>
                </div>
              )}
            </div>
          )}

          {step === 2 && (
            <div>
              <SectionTitle icon="◇" label="CHOISIR LE MONTANT" />
              <p style={st.hint}>Sélectionnez un montant ou saisissez librement</p>
              <div style={st.amountsGrid}>
                {PRESET_AMOUNTS.map((a) => (
                  <div key={a} className="amount-card"
                    onClick={() => { setField("selectedAmount", a); setField("customAmount", ""); }}
                    style={{ ...st.amountCard, background: form.selectedAmount === a ? "#1C1C1A" : "#FFFFFF", border: form.selectedAmount === a ? "2px solid #C4922A" : "2px solid #E8E2D8" }}>
                    <span style={{ ...st.amountValue, color: form.selectedAmount === a ? "#C4922A" : "#1C1C1A" }}>{a.toLocaleString("fr-DZ")}</span>
                    <span style={{ ...st.amountCurrency, color: form.selectedAmount === a ? "#8B6515" : "#8A8070" }}>DA</span>
                  </div>
                ))}
              </div>
              <div style={{ marginTop: 12, position: "relative" }}>
                <input type="number" placeholder="Ou saisir un montant personnalisé (min. 1 000 DA)" value={form.customAmount} min={1000}
                  onChange={(e) => { setField("customAmount", e.target.value); setField("selectedAmount", null); }} style={st.input} />
                <span style={st.inputSuffix}>DA</span>
              </div>
              {amount >= 1000 && (
                <div style={st.amountSummary}>
                  <span style={st.amountSummaryLabel}>Montant sélectionné</span>
                  <span style={st.amountSummaryValue}>{amount.toLocaleString("fr-DZ")} DA</span>
                </div>
              )}
            </div>
          )}

          {step === 3 && (
            <div>
              <SectionTitle icon="✓" label="RÉCAPITULATIF" />
              <p style={st.hint}>Vérifiez les informations avant le paiement</p>
              <div style={st.recap}>
                <RecapRow label="Salon" value={salon.nom} />
                <RecapRow label="Bénéficiaire" value={`${form.firstName} ${form.lastName}`} />
                <RecapRow label="WhatsApp" value={form.phone} />
                {form.email && <RecapRow label="Email" value={form.email} />}
                {form.birthDate && <RecapRow label="Anniversaire" value={form.birthDate} />}
                <RecapRow label="Offert par" value={form.from} />
                {form.message && <RecapRow label="Message" value={`"${form.message}"`} italic />}
                <div style={st.recapDivider} />
                <RecapRow label="Montant" value={`${amount.toLocaleString("fr-DZ")} DA`} gold big />
              </div>
              <div style={st.deliveryNote}>
                <span style={{ fontSize: 18, flexShrink: 0 }}>📲</span>
                <span style={st.deliveryText}>La carte cadeau sera envoyée par <strong>WhatsApp</strong>, <strong>email</strong> et disponible en <strong>PDF</strong> après confirmation du paiement.</span>
              </div>
              {error && <div style={st.errorBox}>⚠️ {error}</div>}
              <button className="btn-gold" onClick={handlePay} disabled={loading} style={st.btnPay}>
                {loading ? (<><span className="spinner" style={st.spinner} />Redirection en cours…</>) : (<><span>Payer {amount.toLocaleString("fr-DZ")} DA</span><span style={{ fontSize: 18 }}>→</span></>)}
              </button>
              <p style={st.secureNote}>🔒 Paiement sécurisé via Chargily Pay · Edahabia &amp; CIB acceptés</p>
            </div>
          )}

          {step < 3 && (
            <div style={st.nav}>
              {step > 0 && <button onClick={() => setStep((s) => s - 1)} style={st.btnBack}>← Retour</button>}
              <button className="btn-gold" disabled={!canNext()} onClick={() => setStep((s) => s + 1)} style={{ ...st.btnNext, marginLeft: step === 0 ? "auto" : 0 }}>Continuer →</button>
            </div>
          )}
        </div>
        <div style={{ textAlign: 'center', marginTop: 32, display: 'flex', flexDirection: 'column', gap: 6 }}>
          <p style={st.footer}>© {salon.nom} · Carte Cadeau · Paiement sécurisé Chargily Pay</p>
          <p style={{ fontFamily: "'Jost', sans-serif", fontSize: 9, color: '#3A3830', letterSpacing: '0.2em', textTransform: 'uppercase', margin: 0 }}>
            Propulsé par <span style={{ color: '#C4922A', fontWeight: 500 }}>HADIYA</span>
          </p>
        </div>
      </div>
    </>
  );
}

function SectionTitle({ icon, label }: { icon: string; label: string }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
      <span style={{ color: "#C4922A", fontSize: 13 }}>{icon}</span>
      <span style={{ fontFamily: "'Jost', sans-serif", fontSize: 11, fontWeight: 500, letterSpacing: "0.15em", color: "#1C1C1A" }}>{label}</span>
    </div>
  );
}

function Field({ placeholder, value, onChange, type = "text", label }: { placeholder: string; value: string; onChange: (v: string) => void; type?: string; label?: string }) {
  return (
    <div style={{ marginBottom: 12 }}>
      {label && <label style={{ display: "block", fontFamily: "'Jost', sans-serif", fontSize: 11, color: "#8A8070", letterSpacing: "0.08em", marginBottom: 4 }}>{label}</label>}
      <input type={type} placeholder={placeholder} value={value} onChange={(e) => onChange(e.target.value)} style={st.input} />
    </div>
  );
}

function RecapRow({ label, value, gold, big, italic }: { label: string; value: string; gold?: boolean; big?: boolean; italic?: boolean }) {
  return (
    <div style={st.recapRow}>
      <span style={st.recapLabel}>{label}</span>
      <span style={{ ...st.recapValue, color: gold ? "#C4922A" : "#1C1C1A", fontSize: big ? 20 : 14, fontWeight: big ? 600 : 400, fontStyle: italic ? "italic" : "normal", fontFamily: big ? "'Cormorant Garamond', serif" : "'Jost', sans-serif" }}>{value}</span>
    </div>
  );
}

const st: Record<string, React.CSSProperties> = {
  root: { minHeight: "100vh", background: "#F4EFE6", fontFamily: "'Jost', sans-serif", paddingBottom: 48 },
  header: { background: "#1C1C1A", padding: "32px 24px 28px", textAlign: "center" },
  headerLines: { display: "flex", alignItems: "center", justifyContent: "center", gap: 16, marginBottom: 8 },
  lineL: { display: "block", width: 40, height: 1, background: "linear-gradient(90deg, transparent, #C4922A)" },
  lineR: { display: "block", width: 40, height: 1, background: "linear-gradient(90deg, #C4922A, transparent)" },
  brandName: { fontFamily: "'Cormorant Garamond', serif", fontSize: 26, fontWeight: 300, letterSpacing: "0.3em", color: "#F4EFE6" },
  tagline: { fontFamily: "'Jost', sans-serif", fontSize: 12, fontWeight: 300, letterSpacing: "0.12em", color: "#8B6515", textTransform: "uppercase" },
  poweredBy: { fontFamily: "'Jost', sans-serif", fontSize: 9, fontWeight: 300, letterSpacing: "0.15em", color: "#3A3830", textTransform: "uppercase", marginTop: 6 },
  progressWrap: { display: "flex", alignItems: "center", justifyContent: "center", padding: "20px 24px 0", gap: 0 },
  stepItem: { display: "flex", flexDirection: "column", alignItems: "center", gap: 4, position: "relative", flex: 1 },
  stepDot: { width: 10, height: 10, borderRadius: "50%" },
  stepLabel: { fontSize: 9, letterSpacing: "0.08em", textTransform: "uppercase", whiteSpace: "nowrap" },
  stepLine: { position: "absolute", top: 5, left: "55%", width: "90%", height: 1, zIndex: 0 },
  card: { margin: "20px 16px 0", background: "#FFFFFF", borderRadius: 20, padding: "28px 24px", boxShadow: "0 4px 24px rgba(28,28,26,0.08)", border: "1px solid #EDE8DF" },
  hint: { fontFamily: "'Jost', sans-serif", fontSize: 12, color: "#8A8070", marginBottom: 20 },
  row: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 12 },
  input: { width: "100%", padding: "13px 16px", border: "1.5px solid #E8E2D8", borderRadius: 12, background: "#FAF8F5", fontFamily: "'Jost', sans-serif", fontSize: 14, color: "#1C1C1A" },
  textarea: { width: "100%", padding: "13px 16px", border: "1.5px solid #E8E2D8", borderRadius: 12, background: "#FAF8F5", fontFamily: "'Jost', sans-serif", fontSize: 14, color: "#1C1C1A", resize: "none", lineHeight: 1.6, outline: "none" },
  previewCard: { marginTop: 20, padding: "20px 24px", background: "linear-gradient(135deg, #1C1C1A 0%, #2E2A22 100%)", borderRadius: 16, border: "1px solid #3A3428" },
  previewHeader: { display: "flex", alignItems: "center", gap: 8, marginBottom: 16 },
  previewLogo: { width: 28, height: 28, borderRadius: 8, background: "#C4922A", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: 13, fontWeight: 600, textAlign: "center", lineHeight: "28px" },
  previewBrand: { fontFamily: "'Cormorant Garamond', serif", color: "#F4EFE6", fontSize: 14, letterSpacing: "0.2em", fontWeight: 300 },
  previewTo: { fontFamily: "'Jost', sans-serif", fontSize: 12, color: "#8B6515", marginBottom: 8 },
  previewMessage: { fontFamily: "'Cormorant Garamond', serif", fontSize: 17, color: "#F4EFE6", fontStyle: "italic", lineHeight: 1.6, marginBottom: 10 },
  previewFrom: { fontFamily: "'Jost', sans-serif", fontSize: 12, color: "#C4922A" },
  amountsGrid: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 },
  amountCard: { borderRadius: 14, padding: "18px 16px", textAlign: "center", display: "flex", flexDirection: "column", gap: 2 },
  amountValue: { fontFamily: "'Cormorant Garamond', serif", fontSize: 26, fontWeight: 600, lineHeight: 1 },
  amountCurrency: { fontFamily: "'Jost', sans-serif", fontSize: 11, letterSpacing: "0.1em", fontWeight: 500 },
  inputSuffix: { position: "absolute", right: 16, top: "50%", transform: "translateY(-50%)", fontFamily: "'Jost', sans-serif", fontSize: 12, color: "#C4922A", fontWeight: 500, pointerEvents: "none" },
  amountSummary: { marginTop: 16, padding: "14px 18px", background: "#FAF6EE", borderRadius: 12, border: "1px solid #E8D9B8", display: "flex", justifyContent: "space-between", alignItems: "center" },
  amountSummaryLabel: { fontFamily: "'Jost', sans-serif", fontSize: 12, color: "#8A8070" },
  amountSummaryValue: { fontFamily: "'Cormorant Garamond', serif", fontSize: 22, color: "#C4922A", fontWeight: 600 },
  recap: { background: "#FAF8F5", borderRadius: 14, padding: "16px 18px", border: "1px solid #EDE8DF", marginBottom: 16 },
  recapRow: { display: "flex", justifyContent: "space-between", alignItems: "flex-start", paddingBottom: 10, marginBottom: 10, borderBottom: "1px solid #F0EBE2", gap: 12 },
  recapLabel: { fontFamily: "'Jost', sans-serif", fontSize: 11, color: "#8A8070", letterSpacing: "0.08em", textTransform: "uppercase", whiteSpace: "nowrap", paddingTop: 2 },
  recapValue: { fontFamily: "'Jost', sans-serif", fontSize: 14, color: "#1C1C1A", textAlign: "right", lineHeight: 1.4 },
  recapDivider: { borderTop: "1.5px solid #E8D9B8", marginBottom: 12 },
  deliveryNote: { display: "flex", gap: 10, alignItems: "flex-start", padding: "12px 14px", background: "#F5F9F5", borderRadius: 10, border: "1px solid #D4E8D0", marginBottom: 20 },
  deliveryText: { fontFamily: "'Jost', sans-serif", fontSize: 12, color: "#4A6B48", lineHeight: 1.6 },
  errorBox: { padding: "12px 16px", background: "#FEF2F2", border: "1px solid #FECACA", borderRadius: 10, fontFamily: "'Jost', sans-serif", fontSize: 13, color: "#DC2626", marginBottom: 16 },
  btnPay: { width: "100%", padding: "16px 24px", background: "#C4922A", color: "#FFFFFF", border: "none", borderRadius: 14, fontFamily: "'Jost', sans-serif", fontSize: 15, fontWeight: 500, letterSpacing: "0.05em", display: "flex", justifyContent: "center", alignItems: "center", gap: 10, boxShadow: "0 4px 16px rgba(196,146,42,0.28)" },
  secureNote: { fontFamily: "'Jost', sans-serif", fontSize: 11, color: "#A0957F", textAlign: "center", marginTop: 12 },
  nav: { display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 28, gap: 12 },
  btnBack: { background: "transparent", border: "1.5px solid #E8E2D8", borderRadius: 12, padding: "12px 20px", fontFamily: "'Jost', sans-serif", fontSize: 13, color: "#8A8070", cursor: "pointer" },
  btnNext: { padding: "13px 28px", background: "#C4922A", color: "#FFFFFF", border: "none", borderRadius: 12, fontFamily: "'Jost', sans-serif", fontSize: 14, fontWeight: 500, letterSpacing: "0.05em", boxShadow: "0 4px 14px rgba(196,146,42,0.25)", display: "flex", alignItems: "center", gap: 8 },
  spinner: { width: 16, height: 16, border: "2px solid rgba(255,255,255,0.3)", borderTopColor: "#fff", borderRadius: "50%" },
  footer: { fontFamily: "'Jost', sans-serif", fontSize: 10, color: "#B8AFA0", textAlign: "center", marginTop: 32, letterSpacing: "0.08em" },
};
