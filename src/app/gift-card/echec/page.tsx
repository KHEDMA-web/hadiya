"use client";

export default function GiftCardEchecPage() {
  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,600;1,300;1,400&family=Jost:wght@300;400;500&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        html, body { background: #F4EFE6; }
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(20px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes scaleIn {
          from { opacity: 0; transform: scale(0.7); }
          to   { opacity: 1; transform: scale(1); }
        }
        .anim-icon { animation: scaleIn 0.5s cubic-bezier(0.34,1.56,0.64,1) forwards; }
        .anim-text { animation: fadeUp 0.5s ease 0.2s both; }
        .anim-card { animation: fadeUp 0.5s ease 0.35s both; }
        .anim-btn  { animation: fadeUp 0.5s ease 0.5s both; }
      `}</style>

      <div style={st.root}>

        {/* Header */}
        <div style={st.header}>
          <div style={st.headerLines}>
            <span style={st.lineL} />
            <span style={st.brandName}>HADIYA</span>
            <span style={st.lineR} />
          </div>
        </div>

        <div style={st.content}>

          {/* Icon */}
          <div className="anim-icon" style={st.iconWrap}>
            <div style={st.iconCircle}>
              <span style={st.iconX}>✕</span>
            </div>
          </div>

          {/* Title */}
          <div className="anim-text" style={{ textAlign: "center" }}>
            <h1 style={st.title}>Paiement annulé</h1>
            <p style={st.subtitle}>Le paiement n'a pas pu être complété</p>
          </div>

          {/* Reasons */}
          <div className="anim-card" style={st.infoCard}>
            <p style={st.infoHeader}>Raisons possibles</p>
            {[
              { icon: "💳", text: "Solde insuffisant sur la carte Edahabia ou CIB" },
              { icon: "⏱", text: "La session de paiement a expiré" },
              { icon: "❌", text: "Le paiement a été annulé manuellement" },
              { icon: "🔌", text: "Problème de connexion internet" },
            ].map((item, i) => (
              <div key={i}>
                {i > 0 && <div style={st.infoDivider} />}
                <div style={st.infoRow}>
                  <span style={st.infoIcon}>{item.icon}</span>
                  <p style={st.infoText}>{item.text}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Buttons */}
          <div className="anim-btn" style={{ width: "100%", display: "flex", flexDirection: "column", gap: 10 }}>
            <button
              onClick={() => window.location.href = "/gift-card"}
              style={st.btnPrimary}
              onMouseEnter={e => (e.currentTarget.style.background = "#A87820")}
              onMouseLeave={e => (e.currentTarget.style.background = "#C4922A")}
            >
              Réessayer →
            </button>
            <button
              onClick={() => window.history.back()}
              style={st.btnSecondary}
              onMouseEnter={e => (e.currentTarget.style.borderColor = "#C4922A")}
              onMouseLeave={e => (e.currentTarget.style.borderColor = "#E8E2D8")}
            >
              ← Retour
            </button>
          </div>

        </div>

        <p style={st.footer}>© HADIYA · Carte Cadeau Spa · Paiement sécurisé Chargily Pay</p>
      </div>
    </>
  );
}

const st: Record<string, React.CSSProperties> = {
  root:        { minHeight: "100vh", background: "#F4EFE6", fontFamily: "'Jost', sans-serif", paddingBottom: 48 },
  header:      { background: "#1C1C1A", padding: "28px 24px", textAlign: "center" },
  headerLines: { display: "flex", alignItems: "center", justifyContent: "center", gap: 16 },
  lineL:       { display: "block", width: 40, height: 1, background: "linear-gradient(90deg, transparent, #C4922A)" },
  lineR:       { display: "block", width: 40, height: 1, background: "linear-gradient(90deg, #C4922A, transparent)" },
  brandName:   { fontFamily: "'Cormorant Garamond', serif", fontSize: 26, fontWeight: 300, letterSpacing: "0.35em", color: "#F4EFE6" },
  content:     { maxWidth: 480, margin: "0 auto", padding: "40px 20px 0", display: "flex", flexDirection: "column", alignItems: "center", gap: 24 },
  iconWrap:    { display: "flex", justifyContent: "center" },
  iconCircle:  { width: 80, height: 80, borderRadius: "50%", background: "linear-gradient(135deg, #DC2626, #EF4444)", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 8px 32px rgba(220,38,38,0.25)" },
  iconX:       { fontSize: 28, color: "#fff", fontWeight: 300 },
  title:       { fontFamily: "'Cormorant Garamond', serif", fontSize: 32, fontWeight: 400, color: "#1C1C1A", marginBottom: 8 },
  subtitle:    { fontFamily: "'Jost', sans-serif", fontSize: 13, color: "#8A8070", letterSpacing: "0.03em" },
  infoCard:    { width: "100%", background: "#FFFFFF", borderRadius: 20, padding: "8px 0", border: "1px solid #EDE8DF", boxShadow: "0 4px 24px rgba(28,28,26,0.06)" },
  infoHeader:  { fontFamily: "'Jost', sans-serif", fontSize: 10, fontWeight: 500, letterSpacing: "0.15em", textTransform: "uppercase", color: "#B8AFA0", padding: "16px 22px 8px" },
  infoRow:     { display: "flex", alignItems: "center", gap: 14, padding: "14px 22px" },
  infoIcon:    { fontSize: 18, flexShrink: 0 },
  infoText:    { fontFamily: "'Jost', sans-serif", fontSize: 13, color: "#4A4540", lineHeight: 1.5 },
  infoDivider: { height: 1, background: "#F0EBE2", margin: "0 22px" },
  btnPrimary:  { width: "100%", padding: "16px 24px", background: "#C4922A", color: "#FFFFFF", border: "none", borderRadius: 14, fontFamily: "'Jost', sans-serif", fontSize: 15, fontWeight: 500, letterSpacing: "0.05em", cursor: "pointer", boxShadow: "0 4px 16px rgba(196,146,42,0.28)", transition: "background 0.2s" },
  btnSecondary:{ width: "100%", padding: "14px 24px", background: "transparent", color: "#8A8070", border: "1.5px solid #E8E2D8", borderRadius: 14, fontFamily: "'Jost', sans-serif", fontSize: 14, cursor: "pointer", transition: "border-color 0.2s" },
  footer:      { fontFamily: "'Jost', sans-serif", fontSize: 10, color: "#B8AFA0", textAlign: "center", marginTop: 32, letterSpacing: "0.08em" },
};
