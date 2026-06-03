"use client";

import { useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { ThemeToggle } from "./components/ThemeProvider";

/* Ambient + Frame rendered client-only to avoid SSR hydration mismatch */
const NoetaAmbient = dynamic(() => Promise.resolve(() => (
  <>
    <div className="noeta-ambient" aria-hidden="true" />
    <div className="noeta-frame" aria-hidden="true"><span /></div>
  </>
)), { ssr: false });

/* ── Demo corrections data ── */
const DEMO_CORRECTIONS = [
  { id: "d1", cat: "Ορθογραφία", sub: "Τόνος", from: "απο", to: "από", reason: "Η πρόθεση «από» γράφεται με τόνο." },
  { id: "d2", cat: "Γραμματική", sub: "Συμφωνία", from: "τρία", to: "τρεις", reason: "«Εβδομάδες» θηλυκό. Το αριθμητικό προσαρμόζεται στο γένος." },
  { id: "d3", cat: "Σύνταξη", sub: "Πρόθεση", from: "διακρίνεται απο", to: "διακρίνεται για", reason: "Το «διακρίνομαι» συντάσσεται με «για» όταν δηλώνει χαρακτηριστικό." },
  { id: "d4", cat: "Ορθογραφία", sub: "Τόνος", from: "την προσοχη", to: "την προσοχή", reason: "Λέξεις παροξύτονες λαμβάνουν τόνο." },
];

/* ── Intersection-observer reveal hook ── */
function useReveal(ref, delay = 0) {
  useEffect(() => {
    if (!ref.current) return;
    const el = ref.current;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setTimeout(() => el.classList.add("in"), delay);
          observer.unobserve(el);
        }
      },
      { threshold: 0.15 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [ref, delay]);
}

/* ── Correction Card (for demo) ── */
function CorrectionCard({ corr, state, onAccept, onReject, focused, onMouseEnter, onMouseLeave }) {
  const isResolved = state === "accepted" || state === "rejected";
  const statusLabel = state === "accepted" ? "Αποδεκτή" : state === "rejected" ? "Απορριφθείσα" : "Εκκρεμής";
  return (
    <div
      className={`correction-card ${state === "pending" ? "pending" : "resolved " + state}${focused ? " focused" : ""}`}
      data-card={corr.id}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
    >
      <div className="cc-head">
        <div className="cc-meta">
          <span className="cat">{corr.cat}</span> · {corr.sub}
        </div>
        <span className="cc-status">{statusLabel}</span>
      </div>
      <div className="cc-diff">
        <span className="from">{corr.from}</span>
        <span className="arrow-mini">→</span>
        <span className="to">{corr.to}</span>
      </div>
      <div className="cc-reason">{corr.reason}</div>
      {!isResolved && (
        <div className="cc-actions">
          <button className="cc-btn accept" onClick={() => onAccept(corr.id)}>
            <span>✓</span> Αποδοχή
          </button>
          <button className="cc-btn reject" onClick={() => onReject(corr.id)}>
            <span>✕</span> Απόρριψη
          </button>
        </div>
      )}
    </div>
  );
}

/* ── Inline corr span ── */
function CorrSpan({ corr, state, focused, onMouseEnter, onMouseLeave, onClick }) {
  return (
    <span
      className={`corr ${state}${focused ? " focused" : ""}`}
      data-id={corr.id}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      onClick={onClick}
    >
      {state === "pending" && (
        <>
          <span className="strike">{corr.from}</span>
          <span className="fix">{corr.to}</span>
        </>
      )}
      {state === "accepted" && <span className="fix">{corr.to}</span>}
      {state === "rejected" && <span className="strike" style={{ textDecoration: "none", color: "inherit", opacity: 1, fontStyle: "inherit", marginRight: 0 }}>{corr.from}</span>}
    </span>
  );
}

export default function HomePage() {
  /* ── Nav scroll state ── */
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 30);
    window.addEventListener("scroll", handler, { passive: true });
    return () => window.removeEventListener("scroll", handler);
  }, []);

  /* ── Hero reveal ── */
  const heroRef = useRef(null);
  useEffect(() => {
    if (!heroRef.current) return;
    const els = heroRef.current.querySelectorAll(".noeta-reveal");
    els.forEach((el, i) => {
      setTimeout(() => el.classList.add("in"), 100 + i * 200);
    });
  }, []);

  /* ── Chapter reveals ── */
  const ch1Ref = useRef(null); useReveal(ch1Ref, 0);
  const ch2Ref = useRef(null); useReveal(ch2Ref, 0);
  const ch3Ref = useRef(null); useReveal(ch3Ref, 0);
  const ch4Ref = useRef(null); useReveal(ch4Ref, 0);

  /* ── Demo state ── */
  const [corrStates, setCorrStates] = useState(
    Object.fromEntries(DEMO_CORRECTIONS.map((c) => [c.id, "pending"]))
  );
  const [focusedId, setFocusedId] = useState(null);

  /* ── Contact form state ── */
  const [contactForm, setContactForm] = useState({ name: "", role: "", email: "", phone: "", message: "" });
  const [contactStatus, setContactStatus] = useState("idle"); // idle | sending | success | error
  const [contactError, setContactError] = useState("");

  const handleContactChange = (field) => (e) => setContactForm((f) => ({ ...f, [field]: e.target.value }));

  const handleContactSubmit = async (e) => {
    e.preventDefault();
    setContactError("");
    if (!contactForm.name.trim() || !contactForm.email.trim() || !contactForm.message.trim()) {
      setContactError("Συμπληρώστε όνομα, email και μήνυμα.");
      return;
    }
    setContactStatus("sending");
    try {
      const res = await fetch("https://formsubmit.co/ajax/noetaapp@gmail.com", {
        method: "POST",
        headers: { "Content-Type": "application/json", "Accept": "application/json" },
        body: JSON.stringify({
          name: contactForm.name,
          role: contactForm.role,
          email: contactForm.email,
          phone: contactForm.phone,
          message: contactForm.message,
          _subject: `Νέο μήνυμα από Noëta — ${contactForm.name}`,
          _template: "table",
        }),
      });
      if (res.ok) {
        setContactStatus("success");
        setContactForm({ name: "", role: "", email: "", phone: "", message: "" });
      } else {
        setContactStatus("error");
        setContactError("Αποτυχία αποστολής. Δοκιμάστε ξανά.");
      }
    } catch {
      setContactStatus("error");
      setContactError("Σφάλμα σύνδεσης. Δοκιμάστε ξανά.");
    }
  };

  const accept = (id) => setCorrStates((s) => ({ ...s, [id]: "accepted" }));
  const reject = (id) => setCorrStates((s) => ({ ...s, [id]: "rejected" }));

  const pending = DEMO_CORRECTIONS.filter((c) => corrStates[c.id] === "pending").length;
  const resolved = DEMO_CORRECTIONS.length - pending;

  return (
    <div style={{ position: "relative", zIndex: 2, backgroundColor: "var(--bg)" }}>
      <NoetaAmbient />

      {/* ── Fixed nav ── */}
      <nav className={`app-nav${scrolled ? " scrolled" : ""}`} id="main-nav">
        <a href="/" className="nav-logo">
          Noëta<span className="dot" />
        </a>
        <div className="nav-links">
          <a href="/editor">Επιμελητής</a>
          <a href="/translate">Μεταφραστής</a>
          <a href="#philosophy">Φιλοσοφία</a>
          <a href="#contact">Επικοινωνία</a>
        </div>
        <div className="nav-cta">
          <ThemeToggle />
          <a href="#contact" className="start"><span>Επικοινωνία</span></a>
        </div>
      </nav>

      {/* ── Hero ── */}
      <section
        ref={heroRef}
        style={{
          minHeight: "100vh", padding: "180px 60px 120px",
          position: "relative", maxWidth: 1440, margin: "0 auto",
        }}
      >
        {/* Eyebrow */}
        <div className="noeta-reveal" style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 56 }}>
          <span style={{
            width: 6, height: 6, borderRadius: "50%", background: "var(--accent)",
            boxShadow: "0 0 12px rgba(31,58,54,0.4)", display: "inline-block",
            animation: "noeta-pulse 4s ease-in-out infinite",
          }} />
          <span style={{ fontFamily: "var(--mono)", fontSize: 11, textTransform: "uppercase", letterSpacing: "0.18em", color: "var(--mid)" }}>
            Επιμέλεια κειμένων &amp; Μετάφραση
          </span>
          <span style={{ width: 40, height: 1, background: "var(--rule)", display: "inline-block" }} />
          <span style={{ fontFamily: "var(--mono)", fontSize: 11, textTransform: "uppercase", letterSpacing: "0.18em", color: "var(--mid)" }}>
            για την ελληνική γλώσσα
          </span>
        </div>

        {/* Headline */}
        <h1 className="noeta-reveal hero-headline-wrapper" style={{ marginBottom: 0 }}>
          <span style={{ display: "block" }}>Η γλώσσα μας</span>
          <span style={{ display: "block", paddingLeft: "0.42em" }}>αξίζει εργαλεία</span>
          <span style={{ display: "block" }}>στο <em style={{ fontStyle: "italic", color: "var(--accent)", position: "relative" }}>επίπεδό της</em>.</span>
        </h1>

        {/* Lede */}
        <p className="noeta-reveal" style={{
          fontFamily: "var(--display)", fontSize: "clamp(20px,2vw,24px)",
          fontWeight: 300, lineHeight: 1.5, letterSpacing: "-0.005em",
          color: "var(--ink-soft)", maxWidth: 620, marginTop: 64,
        }}>
          Το Noëta είναι ένα σύστημα επιμέλειας και μετάφρασης για την ελληνική γλώσσα — με <em style={{ fontStyle: "italic", color: "var(--accent)" }}>τη φροντίδα και την ακρίβεια</em> που απαιτεί ένα κείμενο όταν προορίζεται να εκδοθεί.
        </p>

        {/* Actions */}
        <div className="noeta-reveal" style={{ marginTop: 64, display: "flex", alignItems: "center", gap: 48, flexWrap: "wrap" }}>
          <a href="#contact" className="btn-editorial">
            <span className="arrow" /><span>Επικοινωνία</span>
          </a>
          <a href="/editor" className="btn-editorial ghost">
            <span className="arrow" /><span>Δείτε το σε λειτουργία</span>
          </a>
        </div>

        {/* Live demo */}
        <div className="noeta-reveal" style={{ marginTop: 110, borderTop: "1px solid var(--rule)", paddingTop: 40 }}>
          <div style={{ display: "grid", gridTemplateColumns: "220px 1fr", gap: 60, marginBottom: 32, alignItems: "end" }}>
            <div>
              <div style={{ fontFamily: "var(--mono)", fontSize: 11, textTransform: "uppercase", letterSpacing: "0.16em", color: "var(--mid)" }}>
                Δείγμα διορθώσεων
                <strong style={{ display: "block", fontFamily: "var(--display)", fontStyle: "italic", fontWeight: 400, fontSize: 16, color: "var(--ink)", textTransform: "none", letterSpacing: "-0.01em", marginTop: 8 }}>
                  Αποδεχτείτε ή απορρίψτε κάθε διόρθωση από τη δεξιά στήλη.
                </strong>
              </div>
            </div>
            <div style={{ fontFamily: "var(--mono)", fontSize: 11, letterSpacing: "0.06em", color: "var(--mid)", textTransform: "uppercase", textAlign: "right" }}>
              <strong style={{ color: "var(--accent)" }}>{pending}</strong> εκκρεμείς · {resolved} ολοκληρωμένες
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 360px", gap: 40, alignItems: "start" }}>
            {/* Demo text pad */}
            <div style={{
              background: "rgba(255,253,248,0.5)", border: "1px solid var(--rule)",
              borderRadius: 4, padding: "36px 40px",
              fontFamily: "var(--display)", fontSize: 19, lineHeight: 1.75,
              color: "var(--ink-soft)", position: "relative", minHeight: 200,
            }}>
              <span style={{
                position: "absolute", top: -8, left: 32,
                background: "var(--bg)", padding: "0 10px",
                fontFamily: "var(--mono)", fontSize: 10,
                color: "var(--mid)", letterSpacing: "0.1em", textTransform: "uppercase",
              }}>Δείγμα κειμένου</span>
              Η μετάφραση του Μέλβιλ ολοκληρώθηκε{" "}
              <CorrSpan corr={DEMO_CORRECTIONS[0]} state={corrStates["d1"]} focused={focusedId === "d1"}
                onMouseEnter={() => setFocusedId("d1")} onMouseLeave={() => setFocusedId(null)}
                onClick={() => setFocusedId("d1")}
              />{" "}τον μεταφραστή σε{" "}
              <CorrSpan corr={DEMO_CORRECTIONS[1]} state={corrStates["d2"]} focused={focusedId === "d2"}
                onMouseEnter={() => setFocusedId("d2")} onMouseLeave={() => setFocusedId(null)}
                onClick={() => setFocusedId("d2")}
              />{" "}εβδομάδες. Το κείμενο{" "}
              <CorrSpan corr={DEMO_CORRECTIONS[2]} state={corrStates["d3"]} focused={focusedId === "d3"}
                onMouseEnter={() => setFocusedId("d3")} onMouseLeave={() => setFocusedId(null)}
                onClick={() => setFocusedId("d3")}
              />{" "}την πιστότητα στο πρωτότυπο και{" "}
              <CorrSpan corr={DEMO_CORRECTIONS[3]} state={corrStates["d4"]} focused={focusedId === "d4"}
                onMouseEnter={() => setFocusedId("d4")} onMouseLeave={() => setFocusedId(null)}
                onClick={() => setFocusedId("d4")}
              />{" "}στο ύφος.
            </div>

            {/* Cards panel */}
            <div style={{ display: "flex", flexDirection: "column", gap: 10, maxHeight: 480, overflowY: "auto", paddingRight: 4 }}>
              {DEMO_CORRECTIONS.map((corr) => (
                <CorrectionCard
                  key={corr.id}
                  corr={corr}
                  state={corrStates[corr.id]}
                  focused={focusedId === corr.id}
                  onAccept={accept}
                  onReject={reject}
                  onMouseEnter={() => setFocusedId(corr.id)}
                  onMouseLeave={() => setFocusedId(null)}
                />
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── Chapter I — Επιμέλεια ── */}
      <section ref={ch1Ref} className="noeta-reveal" id="editing-section" style={{ padding: "180px 60px", maxWidth: 1440, margin: "0 auto" }}>
        <div style={{ display: "grid", gridTemplateColumns: "220px 1fr", gap: 60, alignItems: "start" }}>
          <div style={{ fontFamily: "var(--mono)", fontSize: 11, textTransform: "uppercase", letterSpacing: "0.16em", color: "var(--mid)", paddingTop: 8, borderTop: "1px solid var(--ink)", width: "max-content" }}>
            I — Επιμέλεια
          </div>
          <div>
            <h2 className="chapter-title-wrapper">
              <span style={{ display: "block" }}>Διαβάζει</span>
              <span style={{ display: "block", paddingLeft: "0.5em" }}>με <em style={{ fontStyle: "italic", color: "var(--accent)" }}>προσοχή</em>.</span>
            </h2>
            <div style={{ marginTop: 56, fontFamily: "var(--display)", fontSize: 21, fontWeight: 300, lineHeight: 1.55, letterSpacing: "-0.005em", color: "var(--ink-soft)", maxWidth: 640 }}>
              <p>Ορθογραφία, σύνταξη, στίξη, ύφος — με βαθιά κατανόηση της ελληνικής. Το Noëta δεν εφαρμόζει αυτόματα κανόνες· <em style={{ fontStyle: "italic", color: "var(--accent)" }}>υποδεικνύει</em>, αιτιολογεί και αφήνει την κρίση σε εσάς.</p>
              <p style={{ marginTop: 18 }}>Κάθε διόρθωση συνοδεύεται από εξήγηση. Καμία αλλαγή δεν εφαρμόζεται χωρίς τη συγκατάθεσή σας.</p>
            </div>
            <div style={{ marginTop: 64, paddingTop: 24, borderTop: "1px solid var(--rule)", display: "flex", flexDirection: "column", gap: 10 }}>
              <div style={{ fontFamily: "var(--mono)", fontSize: 10, textTransform: "uppercase", letterSpacing: "0.12em", color: "var(--mid)" }}>Είδη που υποστηρίζονται</div>
              <div style={{ fontFamily: "var(--display)", fontStyle: "italic", fontWeight: 300, fontSize: 22, color: "var(--ink)", letterSpacing: "-0.005em" }}>
                Λογοτεχνικά<span style={{ color: "var(--mid)", margin: "0 10px", fontStyle: "normal" }}>·</span>Ακαδημαϊκά<span style={{ color: "var(--mid)", margin: "0 10px", fontStyle: "normal" }}>·</span>Νομικά<span style={{ color: "var(--mid)", margin: "0 10px", fontStyle: "normal" }}>·</span>Δημοσιογραφικά<span style={{ color: "var(--mid)", margin: "0 10px", fontStyle: "normal" }}>·</span>Τεχνικά
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Chapter II — Μετάφραση ── */}
      <div style={{ background: "var(--bg-deep)", margin: 0 }}>
        <section ref={ch2Ref} className="noeta-reveal" style={{ padding: "180px 60px", maxWidth: 1320, margin: "0 auto" }}>
          <div style={{ display: "grid", gridTemplateColumns: "220px 1fr", gap: 60, alignItems: "start" }}>
            <div style={{ fontFamily: "var(--mono)", fontSize: 11, textTransform: "uppercase", letterSpacing: "0.16em", color: "var(--mid)", paddingTop: 8, borderTop: "1px solid var(--ink)", width: "max-content" }}>
              II — Μετάφραση
            </div>
            <div>
              <h2 className="chapter-title-wrapper">
                <span style={{ display: "block" }}>Μεταφράζει</span>
                <span style={{ display: "block", paddingLeft: "0.5em" }}>με <em style={{ fontStyle: "italic", color: "var(--accent)" }}>πιστότητα</em>.</span>
              </h2>
              <div style={{ marginTop: 56, fontFamily: "var(--display)", fontSize: 21, fontWeight: 300, lineHeight: 1.55, letterSpacing: "-0.005em", color: "var(--ink-soft)", maxWidth: 640 }}>
                <p>Από και προς τα ελληνικά, με σεβασμό στο πρωτότυπο. Έλεγχος για παραλείψεις, προσθήκες, ξενισμούς και αστοχίες — γιατί η μετάφραση δεν είναι μηχανική επανατύπωση σε άλλη γλώσσα.</p>
                <p style={{ marginTop: 18 }}>Είναι <em style={{ fontStyle: "italic", color: "var(--accent)" }}>κρίση</em>. Το Noëta υποστηρίζει αυτή την κρίση· δεν την υποκαθιστά.</p>
              </div>
            </div>
          </div>
        </section>
      </div>

      {/* ── Chapter III — Φιλοσοφία ── */}
      <section id="philosophy" style={{ padding: "200px 60px", background: "var(--ink)", color: "var(--bg)", position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", inset: 0, background: "radial-gradient(circle at 30% 50%, rgba(31,58,54,0.3) 0%, transparent 60%)", pointerEvents: "none" }} />
        <div ref={ch3Ref} className="noeta-reveal" style={{ maxWidth: 1440, margin: "0 auto", position: "relative", zIndex: 1 }}>
          <div style={{ display: "grid", gridTemplateColumns: "220px 1fr", gap: 60, alignItems: "start" }}>
            <div style={{ fontFamily: "var(--mono)", fontSize: 11, textTransform: "uppercase", letterSpacing: "0.16em", color: "rgba(255,255,255,0.4)", paddingTop: 8, borderTop: "1px solid rgba(255,255,255,0.4)", width: "max-content" }}>
              III — Φιλοσοφία
            </div>
            <div>
              <h2 style={{ fontFamily: "var(--display)", fontSize: "clamp(44px,6vw,88px)", fontWeight: 300, lineHeight: 0.98, letterSpacing: "-0.03em", color: "var(--bg)" }}>
                <span style={{ display: "block" }}>Δεν αντικαθιστούμε</span>
                <span style={{ display: "block", paddingLeft: "0.5em" }}>τον <em style={{ fontStyle: "italic", color: "#6FA89F" }}>επιμελητή</em>.</span>
              </h2>
              <p style={{ fontFamily: "var(--display)", fontSize: "clamp(26px,3vw,38px)", fontWeight: 300, lineHeight: 1.4, letterSpacing: "-0.015em", color: "var(--bg)", maxWidth: 880, marginTop: 56 }}>
                Το Noëta δεν παίρνει αποφάσεις στη θέση σας. Σας <em style={{ fontStyle: "italic", color: "#B8D9D2" }}>δείχνει</em> τι θα μπορούσε να αλλάξει — και γιατί. Κάθε αλλαγή είναι αναστρέψιμη. Ο άνθρωπος μένει στο τιμόνι· απλώς δεν χρειάζεται πια να ψάχνει με μεγεθυντικό φακό.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── Chapter IV — Επικοινωνία ── */}
      <section id="contact" ref={ch4Ref} className="noeta-reveal" style={{ padding: "200px 60px 160px", maxWidth: 1440, margin: "0 auto" }}>
        <div style={{ display: "grid", gridTemplateColumns: "220px 1fr", gap: 60, alignItems: "start" }}>
          <div style={{ fontFamily: "var(--mono)", fontSize: 11, textTransform: "uppercase", letterSpacing: "0.16em", color: "var(--mid)", paddingTop: 8, borderTop: "1px solid var(--ink)", width: "max-content" }}>
            IV — Επικοινωνία
          </div>
          <div>
            <h2 style={{ fontFamily: "var(--display)", fontSize: "clamp(44px,6vw,84px)", fontWeight: 300, lineHeight: 0.98, letterSpacing: "-0.03em", color: "var(--ink)" }}>
              Πείτε μας<br />για το <em style={{ fontStyle: "italic", color: "var(--accent)", fontWeight: 300 }}>έργο σας</em>.
            </h2>
            <p style={{ fontFamily: "var(--display)", fontSize: 20, fontWeight: 300, lineHeight: 1.55, color: "var(--ink-soft)", maxWidth: 580, marginTop: 40 }}>
              Κάθε κείμενο είναι διαφορετικό. Επικοινωνήστε μαζί μας για προσφορά προσαρμοσμένη στις ανάγκες σας.
            </p>
            <form onSubmit={handleContactSubmit} style={{ marginTop: 56, maxWidth: 640, display: "grid", gap: 24 }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24 }}>
                <label style={{ display: "grid", gap: 8 }}>
                  <span style={{ fontFamily: "var(--mono)", fontSize: 10, textTransform: "uppercase", letterSpacing: "0.14em", color: "var(--mid)" }}>Όνομα *</span>
                  <input type="text" value={contactForm.name} onChange={handleContactChange("name")} required
                    style={{ background: "transparent", border: "none", borderBottom: "1px solid var(--rule)", padding: "10px 0", fontFamily: "var(--display)", fontSize: 16, color: "var(--ink)", outline: "none" }} />
                </label>
                <label style={{ display: "grid", gap: 8 }}>
                  <span style={{ fontFamily: "var(--mono)", fontSize: 10, textTransform: "uppercase", letterSpacing: "0.14em", color: "var(--mid)" }}>Ιδιότητα</span>
                  <input type="text" value={contactForm.role} onChange={handleContactChange("role")}
                    style={{ background: "transparent", border: "none", borderBottom: "1px solid var(--rule)", padding: "10px 0", fontFamily: "var(--display)", fontSize: 16, color: "var(--ink)", outline: "none" }} />
                </label>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24 }}>
                <label style={{ display: "grid", gap: 8 }}>
                  <span style={{ fontFamily: "var(--mono)", fontSize: 10, textTransform: "uppercase", letterSpacing: "0.14em", color: "var(--mid)" }}>Email *</span>
                  <input type="email" value={contactForm.email} onChange={handleContactChange("email")} required
                    style={{ background: "transparent", border: "none", borderBottom: "1px solid var(--rule)", padding: "10px 0", fontFamily: "var(--display)", fontSize: 16, color: "var(--ink)", outline: "none" }} />
                </label>
                <label style={{ display: "grid", gap: 8 }}>
                  <span style={{ fontFamily: "var(--mono)", fontSize: 10, textTransform: "uppercase", letterSpacing: "0.14em", color: "var(--mid)" }}>Τηλέφωνο</span>
                  <input type="tel" value={contactForm.phone} onChange={handleContactChange("phone")}
                    style={{ background: "transparent", border: "none", borderBottom: "1px solid var(--rule)", padding: "10px 0", fontFamily: "var(--display)", fontSize: 16, color: "var(--ink)", outline: "none" }} />
                </label>
              </div>
              <label style={{ display: "grid", gap: 8 }}>
                <span style={{ fontFamily: "var(--mono)", fontSize: 10, textTransform: "uppercase", letterSpacing: "0.14em", color: "var(--mid)" }}>Μήνυμα *</span>
                <textarea value={contactForm.message} onChange={handleContactChange("message")} required rows={5}
                  style={{ background: "transparent", border: "1px solid var(--rule)", borderRadius: 2, padding: "14px 16px", fontFamily: "var(--display)", fontSize: 16, color: "var(--ink)", outline: "none", resize: "vertical", minHeight: 120 }} />
              </label>
              {contactError && <div style={{ fontFamily: "var(--mono)", fontSize: 12, color: "var(--accent, #c41e1e)" }}>{contactError}</div>}
              {contactStatus === "success" && <div style={{ fontFamily: "var(--mono)", fontSize: 12, color: "var(--ink)" }}>✓ Το μήνυμά σας στάλθηκε. Θα επικοινωνήσουμε σύντομα.</div>}
              <div style={{ marginTop: 16, display: "flex", alignItems: "center", gap: 24 }}>
                <button type="submit" disabled={contactStatus === "sending"} className="btn-editorial" style={{ background: "transparent", border: "none", cursor: contactStatus === "sending" ? "not-allowed" : "pointer", opacity: contactStatus === "sending" ? 0.5 : 1, padding: 0 }}>
                  <span className="arrow" /><span>{contactStatus === "sending" ? "Αποστολή..." : "Αποστολή μηνύματος"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer style={{ padding: "60px 60px 50px", borderTop: "1px solid var(--rule)", maxWidth: 1440, margin: "0 auto", display: "flex", justifyContent: "space-between", alignItems: "flex-end", gap: 40, flexWrap: "wrap" }}>
        <div>
          <div style={{ fontFamily: "var(--display)", fontSize: 24, fontWeight: 300, letterSpacing: "-0.01em" }}>
            Noëta<span style={{ display: "inline-block", width: 5, height: 5, background: "var(--accent)", borderRadius: "50%", transform: "translateY(-3px)", marginLeft: 4 }} />
          </div>
          <div style={{ fontFamily: "var(--mono)", fontSize: 11, color: "var(--mid)", letterSpacing: "0.06em", marginTop: 6 }}>
            Επιμέλεια κειμένων &amp; Μετάφραση
          </div>
        </div>
        <div style={{ display: "flex", gap: 28, fontSize: 13, color: "var(--ink-soft)" }}>
          <a href="#contact" style={{ transition: "color 0.3s", cursor: "pointer" }}>Επικοινωνία</a>
          <a style={{ transition: "color 0.3s", cursor: "pointer" }}>Όροι χρήσης</a>
          <a style={{ transition: "color 0.3s", cursor: "pointer" }}>Απόρρητο</a>
        </div>
      </footer>

      <style>{`
        @keyframes noeta-pulse {
          0%,100%{opacity:1;}
          50%{opacity:0.5;}
        }
        @media (max-width: 900px) {
          nav.app-nav { padding: 16px 20px; top: 0; left: 0; right: 0; }
          section { padding-left: 24px !important; padding-right: 24px !important; }
          .hero-headline-wrapper { font-size: clamp(40px, 10vw, 80px) !important; }
          .chapter-title-wrapper { font-size: clamp(32px, 8vw, 60px) !important; }
        }
      `}</style>
    </div>
  );
}
