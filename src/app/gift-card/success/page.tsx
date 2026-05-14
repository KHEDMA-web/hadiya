"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";

export default function GiftCardSuccessPage() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    setTimeout(() => setVisible(true), 100);
  }, []);

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
        .anim-icon  { animation: scaleIn 0.5s cubic-bezier(0.34,1.56,0.64,1) forwards; }
        .anim-text  { animation: fadeUp 0.5s ease 0.2s both; }
        .anim-card  { animation: fadeUp 0.5s ease 0.35s both; }
        .anim-note  { animation: fadeUp 0.5s ease 0.5s both; }
        .anim-btn   { animation: fadeUp 0.5s ease 0.65s both; }
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

        {/* Content */}
        <div style={st.content}>

          {/* Icon */}
          <div className="anim-icon" style={st.iconWrap}>
            <div style={st.iconCircle}>
              <span style={st.iconCheck}>✦</span>
            </div>
          </div>

          {/* Title */}
          <div className="anim-text" style={{ textAlign: "center" }}>
            <h1 style={st.title}>Paiement confirmé</h1>
            <p style={st.subtitle}>Votre carte cadeau a été créée avec succès</p>
          </div>

          {/* Info card */}
          <div className="anim-card" style={st.infoCard}>
            <div style={st.infoRow}>
              <span style={st.infoIcon}>📲</span>
              <div>
                <p style={st.infoTitle}>WhatsApp</p>
                <p style={st.infoDesc}>Un message avec la carte cadeau a été envoyé au bénéficiaire</p>
              </div>
            </div>
            <div style={st.infoDivider} />
            <div style={st.infoRow}>
              <span style={st.infoIcon}>📧</span>
              <div>
                <p style={st.infoTitle}>Email</p>
                <p style={st.infoDesc}>Un email de confirmation a été envoyé avec le PDF de la carte</p>
              </div>
            </div>
            <div style={st.infoDivider} />
            <div style={st.infoRow}>
              <span style={st.infoIcon}>🎁</span>
              <div>
                <p style={st.infoTitle}>Carte activée</p>
                <p style={st.infoDesc}>La carte est immédiatement utilisable au salon</p>
              </div>
            </div>
          </div>

          {/* Note */}
          <div className="anim-note" style={st.note}>
            <p style={st.noteText}>
              Le salon a été notifié et la carte est prête à être utilisée.
              Conservez le message WhatsApp reçu comme justificatif.
            </p>
          </div>

          {/* Button */}
          <div className="anim-btn" style={{ width: "100%" }}>
            <button
              onClick={() => window.location.href = "/gift-card"}
              style={st.btn}
              onMouseEnter={e => (e.currentTarget.style.background = "#A87820")}
              onMouseLeave={e => (e.currentTarget.style.background = "#C4922A")}
            >
              Offrir une autre carte cadeau
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
  iconCircle:  { width: 80, height: 80, borderRadius: "50%", background: "linear-gradient(135deg, #C4922A, #E8B84B)", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 8px 32px rgba(196,146,42,0.35)" },
  iconCheck:   { fontSize: 32, color: "#fff" },
  title:       { fontFamily: "'Cormorant Garamond', serif", fontSize: 32, fontWeight: 400, color: "#1C1C1A", marginBottom: 8 },
  subtitle:    { fontFamily: "'Jost', sans-serif", fontSize: 13, color: "#8A8070", letterSpacing: "0.03em" },
  infoCard:    { width: "100%", background: "#FFFFFF", borderRadius: 20, padding: "8px 0", border: "1px solid #EDE8DF", boxShadow: "0 4px 24px rgba(28,28,26,0.06)" },
  infoRow:     { display: "flex", alignItems: "flex-start", gap: 14, padding: "18px 22px" },
  infoIcon:    { fontSize: 22, flexShrink: 0, marginTop: 1 },
  infoTitle:   { fontFamily: "'Jost', sans-serif", fontSize: 13, fontWeight: 500, color: "#1C1C1A", marginBottom: 3 },
  infoDesc:    { fontFamily: "'Jost', sans-serif", fontSize: 12, color: "#8A8070", lineHeight: 1.5 },
  infoDivider: { height: 1, background: "#F0EBE2", margin: "0 22px" },
  note:        { width: "100%", padding: "14px 18px", background: "#FAF6EE", borderRadius: 12, border: "1px solid #E8D9B8" },
  noteText:    { fontFamily: "'Jost', sans-serif", fontSize: 12, color: "#8A7050", lineHeight: 1.7, textAlign: "center" },
  btn:         { width: "100%", padding: "16px 24px", background: "#C4922A", color: "#FFFFFF", border: "none", borderRadius: 14, fontFamily: "'Jost', sans-serif", fontSize: 15, fontWeight: 500, letterSpacing: "0.05em", cursor: "pointer", boxShadow: "0 4px 16px rgba(196,146,42,0.28)", transition: "background 0.2s" },
  footer:      { fontFamily: "'Jost', sans-serif", fontSize: 10, color: "#B8AFA0", textAlign: "center", marginTop: 32, letterSpacing: "0.08em" },
};
