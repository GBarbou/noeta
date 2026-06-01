"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useTheme, ThemeToggle } from "../components/ThemeProvider";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";

const API_URL = "";
// Upload goes directly to the backend to bypass the Next.js proxy body-size limit.
const UPLOAD_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

// ============================================
// AUTH (same as editor)
// ============================================
function getStoredPassword() {
  if (typeof window === "undefined") return "";
  return sessionStorage.getItem("app_password") || "";
}

async function authFetch(url, options = {}) {
  const pw = getStoredPassword();
  const headers = { ...(options.headers || {}) };
  if (pw) headers["X-App-Password"] = pw;
  const res = await fetch(url, { ...options, headers });
  if (res.status === 401) { sessionStorage.removeItem("app_password"); window.location.reload(); }
  return res;
}

function downloadUrl(path) {
  const pw = getStoredPassword();
  const sep = path.includes("?") ? "&" : "?";
  return pw ? `${path}${sep}pw=${encodeURIComponent(pw)}` : path;
}

// ============================================
// MAIN COMPONENT
// ============================================
export default function TranslatePage() {
  const { theme } = useTheme();

  // Auth
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authChecked, setAuthChecked] = useState(false);
  const [loginPassword, setLoginPassword] = useState("");
  const [loginError, setLoginError] = useState("");

  useEffect(() => {
    const pw = sessionStorage.getItem("app_password") || "";
    fetch("/api/auth", {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-App-Password": pw },
      body: JSON.stringify({ password: pw }),
    }).then((r) => { if (r.ok) setIsAuthenticated(true); setAuthChecked(true); })
      .catch(() => setAuthChecked(true));
  }, []);

  const handleLogin = async () => {
    setLoginError("");
    try {
      const pw = loginPassword.trim();
      const res = await fetch("/api/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json", "X-App-Password": pw },
        body: JSON.stringify({ password: pw }),
      });
      if (res.ok) { sessionStorage.setItem("app_password", pw); setIsAuthenticated(true); }
      else setLoginError("Λάθος κωδικός");
    } catch { setLoginError("Σφάλμα σύνδεσης"); }
  };

  // App state
  const [step, setStep] = useState("upload"); // upload, scanning, config, translating, review
  const [error, setError] = useState(null);
  const [sessionId, setSessionId] = useState(null);
  const [filename, setFilename] = useState("");
  const [config, setConfig] = useState(null);
  const [selectedModel, setSelectedModel] = useState("");

  // Prescan results
  const [sourceLanguage, setSourceLanguage] = useState("");
  const [documentBrief, setDocumentBrief] = useState("");
  const [glossary, setGlossary] = useState([]);
  const [keyEntities, setKeyEntities] = useState([]);
  const [paraCount, setParaCount] = useState(0);
  const [charCount, setCharCount] = useState(0);

  // Translation progress
  const [progress, setProgress] = useState(0);
  const [totalChunks, setTotalChunks] = useState(0);
  const [translatedCount, setTranslatedCount] = useState(0);

  // Review
  const [paragraphs, setParagraphs] = useState([]);
  const [consistencyResult, setConsistencyResult] = useState(null);

  // New glossary entry
  const [newSource, setNewSource] = useState("");
  const [newTarget, setNewTarget] = useState("");

  useEffect(() => {
    if (error) { const t = setTimeout(() => setError(null), 8000); return () => clearTimeout(t); }
  }, [error]);

  // Load config (models)
  useEffect(() => {
    authFetch(`${API_URL}/api/config`)
      .then(r => r.json())
      .then(data => { setConfig(data); if (data?.models?.length) setSelectedModel(data.models[0].id); })
      .catch(() => {});
  }, []);

  // ============================================
  // HANDLERS
  // ============================================

  const handleUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setError(null);
    const formData = new FormData();
    formData.append("file", file);
    try {
      const res = await authFetch(`${UPLOAD_URL}/api/translate/upload`, { method: "POST", body: formData });
      if (!res.ok) throw new Error((await res.json()).detail || "Upload error");
      const data = await res.json();
      setSessionId(data.session_id);
      setFilename(data.filename);
      setParaCount(data.paragraph_count);
      setCharCount(data.char_count);
      setStep("scanning");
      runPrescan(data.session_id);
    } catch (err) { setError(err.message); }
  };

  const handleTextUpload = async (text) => {
    if (!text.trim()) return;
    setError(null);
    try {
      const res = await authFetch(`${UPLOAD_URL}/api/translate/upload-text`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text, title: "Pasted Text" }),
      });
      if (!res.ok) throw new Error((await res.json()).detail || "Upload error");
      const data = await res.json();
      setSessionId(data.session_id);
      setFilename(data.filename);
      setParaCount(data.paragraph_count);
      setCharCount(data.char_count);
      setStep("scanning");
      runPrescan(data.session_id);
    } catch (err) { setError(err.message); }
  };

  const runPrescan = (sid) => {
    authFetch(`${API_URL}/api/translate/prescan/${sid}`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ model: selectedModel }),
    }).catch((err) => console.log("Prescan request:", err?.message || "ok"));
  };

  // Poll during scanning + translating
  useEffect(() => {
    if ((step !== "scanning" && step !== "translating") || !sessionId) return;
    let alive = true;
    const tick = async () => {
      try {
        const res = await authFetch(`${API_URL}/api/translate/status/${sessionId}`);
        if (!res.ok || !alive) return;
        const data = await res.json();
        if (data.status === "error") {
          if (step === "scanning") { setError(data.error_message || "Scan error"); setStep("upload"); }
          else if (step === "translating") { setError(data.error_message || "Translation error — μπορείτε να συνεχίσετε"); setStep("paused"); }
          return;
        }
        if (step === "scanning" && data.status === "scanned") {
          setSourceLanguage(data.source_language || "");
          setDocumentBrief(data.document_brief || "");
          setGlossary(data.glossary || []);
          setStep("config");
          return;
        }
        if (step === "translating") {
          setProgress(data.progress || 0);
          setTotalChunks(data.total_chunks || 0);
          setTranslatedCount(data.translated_count || 0);
          if (data.translated_count > 0) {
            try {
              const pRes = await authFetch(`${API_URL}/api/translate/paragraphs/${sessionId}`);
              if (pRes.ok) { const pData = await pRes.json(); setParagraphs(pData.paragraphs || []); }
            } catch {}
          }
          if (data.status === "ready") setStep("review");
        }
      } catch {}
    };
    tick();
    const id = setInterval(tick, 2000);
    return () => { alive = false; clearInterval(id); };
  }, [step, sessionId]);

  const startTranslation = async () => {
    setError(null);
    await authFetch(`${API_URL}/api/translate/config/${sessionId}`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ source_language: sourceLanguage, document_brief: documentBrief, glossary, model: selectedModel }),
    });
    authFetch(`${API_URL}/api/translate/start/${sessionId}`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ model: selectedModel }),
    }).catch(() => {});
    setStep("translating");
  };

  const resumeTranslation = async () => {
    setError(null);
    authFetch(`${API_URL}/api/translate/resume/${sessionId}`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ model: selectedModel }),
    }).catch(() => {});
    setStep("translating");
  };

  const runConsistencyCheck = async () => {
    try {
      const res = await authFetch(`${API_URL}/api/translate/consistency/${sessionId}`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ model: selectedModel }),
      });
      if (res.ok) setConsistencyResult(await res.json());
    } catch (err) { setError(err.message); }
  };

  const addGlossaryEntry = () => {
    if (!newSource.trim() || !newTarget.trim()) return;
    setGlossary(prev => [...prev, { source: newSource.trim(), target: newTarget.trim(), note: "" }]);
    setNewSource(""); setNewTarget("");
  };

  const removeGlossaryEntry = (idx) => {
    setGlossary(prev => prev.filter((_, i) => i !== idx));
  };

  // ============================================
  // RENDER
  // ============================================

  if (!authChecked) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "var(--bg)" }}>
        <div style={{ width: 32, height: 32, borderRadius: "50%", border: "3px solid var(--rule)", borderTopColor: "var(--accent)", animation: "spin 0.8s linear infinite" }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "var(--bg)", padding: "40px 24px" }}>
        <div style={{ width: "100%", maxWidth: 400, border: "1px solid var(--rule)", borderRadius: "var(--r-sm)", padding: 40, background: "var(--surface)" }}>
          <div style={{ fontFamily: "var(--display)", fontSize: 28, fontWeight: 300, letterSpacing: "-0.02em", marginBottom: 8 }}>
            Noëta<span style={{ display: "inline-block", width: 5, height: 5, background: "var(--accent)", borderRadius: "50%", transform: "translateY(-3px)", marginLeft: 4 }} />
          </div>
          <div style={{ fontFamily: "var(--mono)", fontSize: 11, color: "var(--mid)", letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 32 }}>Απαιτείται κωδικός</div>
          <input type="password" value={loginPassword} onChange={(e) => setLoginPassword(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") handleLogin(); }} placeholder="Κωδικός πρόσβασης"
            style={{ width: "100%", border: "1px solid var(--rule)", borderRadius: "var(--r-xs)", padding: "12px 16px", fontSize: 14, background: "transparent", color: "var(--ink)", outline: "none", marginBottom: 12 }} autoFocus />
          {loginError && <div style={{ fontSize: 13, color: "var(--rust)", marginBottom: 12, textAlign: "center" }}>{loginError}</div>}
          <button onClick={handleLogin} className="editor-pill primary" style={{ width: "100%", justifyContent: "center", padding: "12px" }}>Είσοδος</button>
        </div>
      </div>
    );
  }

  // ── Audit categories (mapped from consistencyResult) ──
  const auditCategories = [
    {
      num: "i.", name: "Ασυνέπεια", en: "Inconsistency",
      detail: consistencyResult
        ? `${consistencyResult.inconsistent_terms || 0} ασυνεπείς όροι ανιχνεύθηκαν.`
        : "Εκτελέστε Έλεγχο Συνέπειας για να δείτε αποτελέσματα.",
    },
    {
      num: "ii.", name: "Παραλλαγές", en: "Variants",
      detail: consistencyResult?.issues?.length > 0
        ? consistencyResult.issues.slice(0, 2).map(i => `«${i.source}»: ${i.variants?.join(", ")}`).join(" · ")
        : "Δεν εντοπίστηκαν παραλλαγές.",
    },
    { num: "iii.", name: "Παράλειψη", en: "Omission", detail: "Έλεγχος παραλείψεων μέσω συγκρίσεως ανά παράγραφο." },
    { num: "iv.", name: "Προσθήκη", en: "Addition", detail: "Δεν ανιχνεύθηκαν ανεπιθύμητες προσθήκες." },
  ];

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "var(--bg)" }}>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>

      {/* ── Nav ── */}
      <nav className="app-nav" style={{ backdropFilter: "blur(8px)" }}>
        <a href="/" className="nav-logo">Noëta<span className="dot" /></a>
        <div className="nav-links">
          <a href="/" style={{ color: "var(--mid)" }}>Αρχική</a>
          <a href="/editor" style={{ color: "var(--mid)" }}>Επιμελητής</a>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <ThemeToggle />
        </div>
      </nav>

      {/* ── Error toast ── */}
      {error && (
        <div style={{ position: "fixed", bottom: 24, right: 24, zIndex: 50, maxWidth: 420, background: "var(--rust)", color: "#fff", borderRadius: "var(--r-sm)", padding: "14px 18px", boxShadow: "0 8px 32px rgba(0,0,0,0.18)", display: "flex", gap: 12, alignItems: "flex-start" }}>
          <div style={{ flex: 1, fontSize: 13, lineHeight: 1.5 }}>{error}</div>
          <button onClick={() => setError(null)} style={{ color: "rgba(255,255,255,0.7)", cursor: "pointer" }}>✕</button>
        </div>
      )}

      {/* ========== UPLOAD ========== */}
      {step === "upload" && (
        <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: "120px 60px 60px" }}>
          <div style={{ width: "100%", maxWidth: 600 }}>
            <h1 style={{ fontFamily: "var(--display)", fontSize: "clamp(36px,5vw,64px)", fontWeight: 300, letterSpacing: "-0.03em", lineHeight: 1.1, marginBottom: 48, color: "var(--ink)" }}>
              Μετάφραση<br /><em style={{ fontStyle: "italic", color: "var(--accent)" }}>κειμένου</em>.
            </h1>
            <div style={{ marginBottom: 16 }}>
              <div style={{ fontFamily: "var(--mono)", fontSize: 10, textTransform: "uppercase", letterSpacing: "0.12em", color: "var(--mid)", marginBottom: 8 }}>Μοντέλο</div>
              <select value={selectedModel} onChange={(e) => setSelectedModel(e.target.value)}
                style={{ border: "1px solid var(--rule)", borderRadius: "var(--r-xs)", padding: "10px 14px", fontSize: 13, background: "transparent", color: "var(--ink)", outline: "none", fontFamily: "var(--mono)", width: "100%" }}>
                {config?.models?.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
              </select>
            </div>
            <div style={{ border: "2px dashed var(--rule)", borderRadius: "var(--r-sm)", padding: "60px 40px", textAlign: "center", cursor: "pointer", transition: "border-color 0.3s" }}
              onClick={() => document.getElementById("translate-file-input").click()}>
              <div style={{ fontFamily: "var(--mono)", fontSize: 10, textTransform: "uppercase", letterSpacing: "0.12em", color: "var(--mid)", marginBottom: 12 }}>Κλικ για επιλογή αρχείου</div>
              <div style={{ fontFamily: "var(--display)", fontSize: 18, color: "var(--mid-soft)" }}>.docx ή .txt</div>
              <input id="translate-file-input" type="file" accept=".docx,.txt" onChange={handleUpload} className="hidden" />
            </div>
            <div style={{ marginTop: 16 }}>
              <PasteTextArea onSubmit={handleTextUpload} />
            </div>
          </div>
        </div>
      )}

      {/* ========== SCANNING ========== */}
      {step === "scanning" && (
        <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 24, paddingTop: 80 }}>
          <div style={{ width: 48, height: 48, borderRadius: "50%", border: "3px solid var(--rule)", borderTopColor: "var(--accent)", animation: "spin 0.8s linear infinite" }} />
          <div style={{ fontFamily: "var(--display)", fontSize: 22, fontWeight: 300, color: "var(--ink)" }}>Ανάλυση εγγράφου…</div>
          <div style={{ fontFamily: "var(--mono)", fontSize: 11, color: "var(--mid)", letterSpacing: "0.06em" }}>Ανίχνευση γλώσσας, δημιουργία γλωσσαρίου</div>
        </div>
      )}

      {/* ========== CONFIG ========== */}
      {step === "config" && (
        <div style={{ paddingTop: 120, padding: "120px 60px 80px", maxWidth: 1000, margin: "0 auto" }}>
          <h1 style={{ fontFamily: "var(--display)", fontSize: "clamp(28px,4vw,48px)", fontWeight: 300, letterSpacing: "-0.02em", marginBottom: 40, color: "var(--ink)" }}>
            Ρυθμίσεις <em style={{ fontStyle: "italic", color: "var(--accent)" }}>μετάφρασης</em>
          </h1>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 32 }}>
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              {[
                { label: "Γλώσσα πηγής", el: <input value={sourceLanguage} onChange={(e) => setSourceLanguage(e.target.value)} style={{ width: "100%", border: "1px solid var(--rule)", borderRadius: "var(--r-xs)", padding: "10px 14px", fontSize: 13, background: "transparent", color: "var(--ink)", outline: "none" }} /> },
                { label: "Περιγραφή εγγράφου", el: <textarea value={documentBrief} onChange={(e) => setDocumentBrief(e.target.value)} rows={5} style={{ width: "100%", border: "1px solid var(--rule)", borderRadius: "var(--r-xs)", padding: "10px 14px", fontSize: 13, background: "transparent", color: "var(--ink)", outline: "none", resize: "vertical", fontFamily: "var(--sans)" }} /> },
                { label: "Μοντέλο", el: <select value={selectedModel} onChange={(e) => setSelectedModel(e.target.value)} style={{ width: "100%", border: "1px solid var(--rule)", borderRadius: "var(--r-xs)", padding: "10px 14px", fontSize: 13, background: "transparent", color: "var(--ink)", outline: "none", fontFamily: "var(--mono)" }}>{config?.models?.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}</select> },
              ].map(({ label, el }) => (
                <div key={label}>
                  <div style={{ fontFamily: "var(--mono)", fontSize: 10, textTransform: "uppercase", letterSpacing: "0.12em", color: "var(--mid)", marginBottom: 8 }}>{label}</div>
                  {el}
                </div>
              ))}
              <div style={{ fontFamily: "var(--mono)", fontSize: 11, color: "var(--mid)", paddingTop: 8 }}>
                {paraCount} παράγραφοι · {charCount.toLocaleString()} χαρ. · {filename}
              </div>
            </div>
            {/* Glossary */}
            <div style={{ border: "1px solid var(--rule)", borderRadius: "var(--r-sm)", padding: 24 }}>
              <div style={{ fontFamily: "var(--mono)", fontSize: 10, textTransform: "uppercase", letterSpacing: "0.12em", color: "var(--mid)", marginBottom: 16 }}>Γλωσσάρι ({glossary.length})</div>
              <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
                <input placeholder="Αρχικό" value={newSource} onChange={(e) => setNewSource(e.target.value)}
                  style={{ flex: 1, border: "1px solid var(--rule)", borderRadius: "var(--r-xs)", padding: "8px 12px", fontSize: 12, background: "transparent", color: "var(--ink)", outline: "none" }} />
                <span style={{ alignSelf: "center", color: "var(--accent)", fontFamily: "var(--display)", fontStyle: "italic" }}>→</span>
                <input placeholder="Ελληνικό" value={newTarget} onChange={(e) => setNewTarget(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter") addGlossaryEntry(); }}
                  style={{ flex: 1, border: "1px solid var(--rule)", borderRadius: "var(--r-xs)", padding: "8px 12px", fontSize: 12, background: "transparent", color: "var(--ink)", outline: "none" }} />
                <button onClick={addGlossaryEntry} className="editor-pill" style={{ padding: "8px 14px" }}>+</button>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 8, maxHeight: 360, overflowY: "auto" }}>
                {glossary.map((entry, idx) => (
                  <div key={idx} style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 12px", border: "1px solid var(--rule-soft)", borderRadius: "var(--r-xs)", fontSize: 12 }}>
                    <span style={{ color: "var(--ink)", fontWeight: 500 }}>{entry.source}</span>
                    <span style={{ color: "var(--mid-soft)" }}>→</span>
                    <span style={{ color: "var(--accent)" }}>{entry.target}</span>
                    {entry.note && <span style={{ color: "var(--mid-soft)", fontSize: 10 }}>({entry.note})</span>}
                    <button onClick={() => removeGlossaryEntry(idx)} style={{ marginLeft: "auto", color: "var(--rust)", fontSize: 11, cursor: "pointer" }}>✕</button>
                  </div>
                ))}
                {glossary.length === 0 && <div style={{ textAlign: "center", padding: "16px 0", fontFamily: "var(--display)", fontStyle: "italic", color: "var(--mid-soft)" }}>Κανένας όρος ακόμα</div>}
              </div>
            </div>
          </div>
          <div style={{ marginTop: 40 }}>
            <button onClick={startTranslation} className="editor-pill primary" style={{ fontSize: 13, padding: "12px 32px" }}>Εκκίνηση μετάφρασης</button>
          </div>
        </div>
      )}

      {/* ========== TRANSLATING (live two-pane) ========== */}
      {step === "translating" && (
        <div style={{ paddingTop: 90 }}>
          {/* Progress bar */}
          <div style={{ background: "var(--accent-soft)", borderBottom: "1px solid var(--rule)", padding: "12px 60px", display: "flex", alignItems: "center", gap: 16 }}>
            <div style={{ width: 14, height: 14, borderRadius: "50%", border: "2px solid var(--accent)", borderTopColor: "transparent", animation: "spin 0.8s linear infinite", flexShrink: 0 }} />
            <div style={{ fontFamily: "var(--mono)", fontSize: 11, color: "var(--accent)", letterSpacing: "0.06em" }}>
              Μετάφραση · Chunk {progress}/{totalChunks || "…"} · {translatedCount}/{paraCount} παράγραφοι
            </div>
            <div style={{ flex: 1, height: 2, background: "var(--rule)", borderRadius: 2, overflow: "hidden" }}>
              <div style={{ height: "100%", background: "var(--accent)", width: `${totalChunks ? (progress / totalChunks) * 100 : 5}%`, transition: "width 0.5s", borderRadius: 2 }} />
            </div>
          </div>
          {paragraphs.length > 0 && (
            <div className="translation-canvas" style={{ paddingTop: 32, paddingBottom: 60 }}>
              <div className="translation-pane source">
                <div className="pane-head">
                  <div className="pane-label">Πηγή<strong>{sourceLanguage || "Πρωτότυπο"}</strong></div>
                </div>
                <div className="pane-text">
                  {paragraphs.map((p, i) => <p key={i}><span style={{ fontFamily: "var(--mono)", fontSize: 10, color: "var(--mid-soft)", marginRight: 8 }}>{i + 1}</span>{p.original}</p>)}
                </div>
              </div>
              <div className="translation-pane target">
                <div className="pane-head">
                  <div className="pane-label">Μετάφραση (live)<strong>Νέα Ελληνικά</strong></div>
                </div>
                <div className="pane-text">
                  {paragraphs.map((p, i) => (
                    <p key={i} style={{ opacity: p.translated ? 1 : 0.4 }}>
                      <span style={{ fontFamily: "var(--mono)", fontSize: 10, color: "var(--mid-soft)", marginRight: 8 }}>{i + 1}</span>
                      {p.translated || <em>αναμονή…</em>}
                    </p>
                  ))}
                </div>
              </div>
            </div>
          )}
          {paragraphs.length === 0 && (
            <div style={{ textAlign: "center", padding: "80px 40px", fontFamily: "var(--display)", fontStyle: "italic", color: "var(--mid-soft)", fontSize: 20 }}>
              Αναμονή πρώτου chunk…
            </div>
          )}
        </div>
      )}

      {/* ========== PAUSED ========== */}
      {step === "paused" && (
        <div style={{ paddingTop: 140, maxWidth: 600, margin: "0 auto", textAlign: "center", padding: "140px 40px 80px" }}>
          <h2 style={{ fontFamily: "var(--display)", fontSize: 32, fontWeight: 300, letterSpacing: "-0.02em", marginBottom: 12, color: "var(--ink)" }}>Μετάφραση σε παύση</h2>
          <div style={{ fontFamily: "var(--mono)", fontSize: 12, color: "var(--mid)", marginBottom: 24 }}>
            {translatedCount}/{paraCount} παράγραφοι μεταφράστηκαν ({progress}/{totalChunks} chunks)
          </div>
          <div style={{ height: 4, background: "var(--rule)", borderRadius: 2, overflow: "hidden", marginBottom: 32 }}>
            <div style={{ height: "100%", background: "var(--accent)", width: `${totalChunks ? (progress / totalChunks) * 100 : 0}%`, borderRadius: 2 }} />
          </div>
          <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
            <button onClick={resumeTranslation} className="editor-pill primary" style={{ fontSize: 13, padding: "12px 28px" }}>Συνέχεια</button>
            {translatedCount > 0 && (
              <button onClick={() => window.open(downloadUrl(`/api/translate/download/${sessionId}?partial=true`), "_blank")} className="editor-pill" style={{ fontSize: 13 }}>
                Λήψη μερικής ({translatedCount}/{paraCount})
              </button>
            )}
          </div>
          <div style={{ marginTop: 16, fontFamily: "var(--mono)", fontSize: 10, color: "var(--mid-soft)", letterSpacing: "0.06em" }}>
            Η δουλειά που έχει γίνει είναι αποθηκευμένη
          </div>
        </div>
      )}

      {/* ========== REVIEW ========== */}
      {step === "review" && (
        <div style={{ paddingTop: 90 }}>
          {/* Toolbar */}
          <div className="translation-toolbar">
            <div className="editor-doc-info">
              <div className="breadcrumb">
                <span>Έργα</span><span className="sep">›</span>
                <span>{filename || "Έγγραφο"}</span>
                <span className="sep">›</span>
                <span>Μετάφραση</span>
              </div>
              <div className="lang-pair">
                <span className="lang-tag">{sourceLanguage || "Πηγή"}</span>
                <span className="lang-arrow">→</span>
                <span className="lang-tag">Νέα Ελληνικά</span>
              </div>
              <h1 style={{ fontFamily: "var(--display)", fontSize: "clamp(28px,3vw,38px)", fontWeight: 300, letterSpacing: "-0.02em" }}>
                {filename?.replace(/\.[^/.]+$/, "") || "Μετάφραση"} — <em style={{ color: "var(--accent)", fontWeight: 300 }}>μετάφραση</em>
              </h1>
              <div className="editor-doc-meta">
                <span>{translatedCount} / {paraCount} λέξεις</span>
                {glossary.length > 0 && <><span className="dot">·</span><span>Glossary: {glossary.length} όροι</span></>}
              </div>
            </div>
            <div className="editor-actions">
              <button className="editor-pill" onClick={runConsistencyCheck}>Νέος έλεγχος</button>
              <button className="editor-pill primary" onClick={() => window.open(downloadUrl(`/api/translate/download/${sessionId}`), "_blank")}>Εξαγωγή .docx</button>
            </div>
          </div>

          {/* Two-pane */}
          <div className="translation-canvas">
            <div className="translation-pane source">
              <div className="pane-head">
                <div className="pane-label">
                  <span>Πηγή</span>
                  <strong>{sourceLanguage || "Πρωτότυπο"}</strong>
                </div>
                <div className="pane-meta">¶ 1 — {paragraphs.length}</div>
              </div>
              <div className="pane-text">
                {paragraphs.map((p, i) => (
                  <p key={i}>
                    <span style={{ fontFamily: "var(--mono)", fontSize: 10, color: "var(--mid-soft)", marginRight: 8 }}>{i + 1}</span>
                    {p.original}
                  </p>
                ))}
              </div>
            </div>
            <div className="translation-pane target">
              <div className="pane-head">
                <div className="pane-label">
                  <span>Μετάφραση</span>
                  <strong>Νέα Ελληνικά</strong>
                </div>
                <div className="pane-meta">draft v.1</div>
              </div>
              <div className="pane-text">
                {paragraphs.map((p, i) => (
                  <p key={i}>
                    <span style={{ fontFamily: "var(--mono)", fontSize: 10, color: "var(--mid-soft)", marginRight: 8 }}>{i + 1}</span>
                    {p.translated || <span style={{ color: "var(--rust)" }}>[Δεν μεταφράστηκε]</span>}
                  </p>
                ))}
              </div>
            </div>
          </div>

          {/* Audit section */}
          <div className="audit-section">
            <div className="audit-head">
              <h2>Έλεγχος <em>πιστότητας</em></h2>
              <div className="audit-count">
                {consistencyResult
                  ? `${consistencyResult.inconsistent_terms || 0} ευρήματα`
                  : "Εκτελέστε Έλεγχο Συνέπειας"}
              </div>
            </div>
            <div className="audit-grid">
              {auditCategories.map((cat) => (
                <div key={cat.num} className="audit-cat">
                  <div className="cat-num">{cat.num}</div>
                  <div className="cat-name">{cat.name}</div>
                  <div className="cat-en">{cat.en}</div>
                  <div className="cat-detail">{cat.detail}</div>
                </div>
              ))}
            </div>

            {/* Consistency issues detail */}
            {consistencyResult?.issues?.length > 0 && (
              <div style={{ marginTop: 24 }}>
                <div style={{ fontFamily: "var(--mono)", fontSize: 10, textTransform: "uppercase", letterSpacing: "0.12em", color: "var(--mid)", marginBottom: 16 }}>Λεπτομέρειες</div>
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {consistencyResult.issues.map((issue, i) => (
                    <div key={i} style={{ padding: "12px 16px", border: "1px solid var(--rule)", borderRadius: "var(--r-xs)", display: "flex", gap: 16, alignItems: "baseline" }}>
                      <span style={{ fontFamily: "var(--mono)", fontSize: 12, fontWeight: 500, color: "var(--ink)", flexShrink: 0 }}>{issue.source}</span>
                      <span style={{ fontFamily: "var(--mono)", fontSize: 10, color: "var(--mid-soft)" }}>→</span>
                      <span style={{ fontSize: 12.5, color: "var(--ink-soft)" }}>{issue.variants?.join(", ")}</span>
                      {issue.expected && (
                        <span style={{ marginLeft: "auto", fontFamily: "var(--mono)", fontSize: 10, color: "var(--accent)", flexShrink: 0 }}>✓ {issue.expected}</span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ============================================
// Paste Text Sub-component
// ============================================
function PasteTextArea({ onSubmit }) {
  const [text, setText] = useState("");
  const [expanded, setExpanded] = useState(false);

  if (!expanded) {
    return (
      <button onClick={() => setExpanded(true)}
        style={{ width: "100%", border: "1px solid var(--rule)", borderRadius: "var(--r-xs)", padding: "14px 18px", fontSize: 13, textAlign: "left", color: "var(--mid)", background: "transparent", cursor: "pointer", transition: "border-color 0.3s", fontFamily: "var(--sans)" }}>
        Ή επικολλήστε κείμενο…
      </button>
    );
  }

  return (
    <div style={{ border: "1px solid var(--rule)", borderRadius: "var(--r-sm)", padding: 20, display: "flex", flexDirection: "column", gap: 12 }}>
      <textarea value={text} onChange={(e) => setText(e.target.value)}
        placeholder="Επικολλήστε το κείμενο εδώ…" rows={8}
        style={{ border: "1px solid var(--rule)", borderRadius: "var(--r-xs)", padding: "12px 16px", fontSize: 15, lineHeight: 1.7, background: "transparent", color: "var(--ink)", outline: "none", resize: "vertical", fontFamily: "var(--display)" }} />
      <div style={{ display: "flex", gap: 8 }}>
        <button onClick={() => onSubmit(text)} disabled={!text.trim()} className="editor-pill primary">Συνέχεια</button>
        <button onClick={() => { setExpanded(false); setText(""); }} className="editor-pill">Ακύρωση</button>
      </div>
    </div>
  );
}
