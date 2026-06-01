'use client';

import { useState, useEffect, useRef, useCallback } from 'react';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

// ============================================
// AUTHENTICATED FETCH HELPER
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

  if (res.status === 401) {
    sessionStorage.removeItem("app_password");
    window.location.reload();
  }

  return res;
}

function downloadUrl(path) {
  const pw = getStoredPassword();
  const separator = path.includes("?") ? "&" : "?";
  return pw ? `${path}${separator}pw=${encodeURIComponent(pw)}` : path;
}

// Available models — must match AVAILABLE_MODELS keys in main.py
const MODELS = [
  { value: 'gemini-3.1-pro', label: 'Gemini 3.1 Pro' },
  { value: 'claude-sonnet-4.6', label: 'Claude Sonnet 4.6' },
  { value: 'claude-opus-4.6', label: 'Claude Opus 4.6' },
  { value: 'gpt-5.4-pro', label: 'GPT-5.4 Pro' },
  { value: 'gemini-2.5-pro', label: 'Gemini 2.5 Pro' },
  { value: 'gemini-3-flash', label: 'Gemini 3 Flash' },
  { value: 'step-3.5-flash', label: 'Step 3.5 Flash (Free)' },
];

export default function ParaphrasePage() {
  // Auth state
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authChecked, setAuthChecked] = useState(false);
  const [loginPassword, setLoginPassword] = useState("");
  const [loginError, setLoginError] = useState("");

  useEffect(() => {
    const pw = sessionStorage.getItem("app_password") || "";
    fetch(`${API_BASE}/api/auth`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-App-Password": pw },
      body: JSON.stringify({ password: pw }),
    })
      .then((r) => {
        if (r.ok) setIsAuthenticated(true);
        setAuthChecked(true);
      })
      .catch(() => setAuthChecked(true));
  }, []);

  const handleLogin = async () => {
    setLoginError("");
    try {
      const pw = loginPassword.trim();
      const res = await fetch(`${API_BASE}/api/auth`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "X-App-Password": pw },
        body: JSON.stringify({ password: pw }),
      });
      if (res.ok) {
        sessionStorage.setItem("app_password", pw);
        setIsAuthenticated(true);
      } else {
        setLoginError("Λάθος κωδικός");
      }
    } catch {
      setLoginError("Σφάλμα σύνδεσης");
    }
  };

  // State
  const [step, setStep] = useState('upload'); // upload, prescan, config, paraphrasing, results
  const [sessionId, setSessionId] = useState(null);
  const [sourceFilename, setSourceFilename] = useState('');
  const [transFilename, setTransFilename] = useState('');
  const [sourceParagraphs, setSourceParagraphs] = useState(0);
  const [transParagraphs, setTransParagraphs] = useState(0);
  const [totalChunks, setTotalChunks] = useState(0);
  const [currentChunk, setCurrentChunk] = useState(0);
  const [completedChunks, setCompletedChunks] = useState(0);
  const [selectedModel, setSelectedModel] = useState('gemini-3.1-pro');
  const [analysis, setAnalysis] = useState(null);
  const [documentBrief, setDocumentBrief] = useState('');
  const [styleNotes, setStyleNotes] = useState('');
  const [sideBySide, setSideBySide] = useState([]);
  const [error, setError] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [activeChunk, setActiveChunk] = useState(0);
  const [previewSource, setPreviewSource] = useState([]);
  const [previewTrans, setPreviewTrans] = useState([]);
  const [sourceFile, setSourceFile] = useState(null);
  const [transFile, setTransFile] = useState(null);

  const pollRef = useRef(null);
  const sourceInputRef = useRef(null);
  const transInputRef = useRef(null);

  // ---- UPLOAD (two files) ----
  const handleUpload = async () => {
    if (!sourceFile || !transFile) {
      setError('Πρέπει να ανεβάσετε και τα δύο αρχεία');
      return;
    }

    setIsUploading(true);
    setError('');

    const formData = new FormData();
    formData.append('source_file', sourceFile);
    formData.append('translation_file', transFile);

    try {
      const res = await authFetch(`${API_BASE}/api/paraphrase/upload`, {
        method: 'POST',
        body: formData,
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.detail || 'Upload failed');
      }
      const data = await res.json();
      setSessionId(data.session_id);
      setSourceFilename(data.source_filename);
      setTransFilename(data.trans_filename);
      setSourceParagraphs(data.source_paragraphs);
      setTransParagraphs(data.trans_paragraphs);
      setTotalChunks(data.total_chunks);
      setPreviewSource(data.preview_source || []);
      setPreviewTrans(data.preview_trans || []);
      setStep('prescan');
    } catch (err) {
      setError(err.message);
    } finally {
      setIsUploading(false);
    }
  };

  // ---- PRESCAN ----
  const handlePrescan = async () => {
    setIsScanning(true);
    setError('');

    try {
      const res = await authFetch(`${API_BASE}/api/paraphrase/prescan/${sessionId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ model: selectedModel }),
      });
      if (!res.ok) throw new Error('Prescan failed');
      const data = await res.json();
      setAnalysis(data.analysis);
      setDocumentBrief(data.document_brief);
      setStyleNotes(data.style_notes);
      setTotalChunks(data.total_chunks);
      setStep('config');
    } catch (err) {
      setError(err.message);
    } finally {
      setIsScanning(false);
    }
  };

  // ---- START ----
  const handleStart = async () => {
    setError('');

    // Save config first
    await authFetch(`${API_BASE}/api/paraphrase/config/${sessionId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        document_brief: documentBrief,
        style_notes: styleNotes,
      }),
    });

    // Start paraphrasing
    const res = await authFetch(`${API_BASE}/api/paraphrase/start/${sessionId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ model: selectedModel }),
    });

    if (!res.ok) {
      setError('Failed to start');
      return;
    }

    setStep('paraphrasing');
    startPolling();
  };

  // ---- POLLING ----
  const startPolling = useCallback(() => {
    if (pollRef.current) clearInterval(pollRef.current);

    pollRef.current = setInterval(async () => {
      try {
        const res = await authFetch(`${API_BASE}/api/paraphrase/status/${sessionId}`);
        const data = await res.json();

        setCurrentChunk(data.current_chunk);
        setCompletedChunks(data.completed_chunks);
        setTotalChunks(data.total_chunks);

        if (data.status === 'completed') {
          clearInterval(pollRef.current);
          pollRef.current = null;
          setStep('results');
          fetchResults();
        } else if (data.status === 'error') {
          clearInterval(pollRef.current);
          pollRef.current = null;
          setError(data.error || 'Paraphrase error');
        } else if (data.status === 'paused') {
          clearInterval(pollRef.current);
          pollRef.current = null;
          setIsPaused(true);
        }

        // Fetch partial results
        if (data.completed_chunks > 0) {
          fetchResults();
        }
      } catch (err) {
        console.error('Poll error:', err);
      }
    }, 3000);
  }, [sessionId]);

  const fetchResults = async () => {
    try {
      const res = await authFetch(`${API_BASE}/api/paraphrase/results/${sessionId}`);
      const data = await res.json();
      setSideBySide(data.side_by_side || []);
    } catch (err) {
      console.error('Results fetch error:', err);
    }
  };

  // ---- PAUSE / RESUME ----
  const handlePause = async () => {
    await authFetch(`${API_BASE}/api/paraphrase/pause/${sessionId}`, { method: 'POST' });
    setIsPaused(true);
  };

  const handleResume = async () => {
    const res = await authFetch(`${API_BASE}/api/paraphrase/resume/${sessionId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ model: selectedModel }),
    });
    if (res.ok) {
      setIsPaused(false);
      startPolling();
    }
  };

  // ---- DOWNLOAD ----
  const handleDownload = () => {
    window.open(downloadUrl(`${API_BASE}/api/paraphrase/download/${sessionId}`), '_blank');
  };

  // Cleanup polling
  useEffect(() => {
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, []);

  // ---- Progress percentage ----
  const progress = totalChunks > 0 ? Math.round((completedChunks / totalChunks) * 100) : 0;

  // ---- Auth check ----
  if (!authChecked) {
    return (
      <div style={{ ...styles.page, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p style={{ color: '#888' }}>Φόρτωση...</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div style={{ ...styles.page, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ ...styles.card, maxWidth: 380, textAlign: 'center' }}>
          <h2 style={styles.cardTitle}>Κωδικός πρόσβασης</h2>
          {loginError && <p style={{ color: '#c41e1e', fontSize: 13, marginBottom: 12 }}>{loginError}</p>}
          <input
            type="password"
            value={loginPassword}
            onChange={(e) => setLoginPassword(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") handleLogin(); }}
            placeholder="Κωδικός πρόσβασης"
            style={{ ...styles.select, marginBottom: 14 }}
          />
          <button onClick={handleLogin} style={{ ...styles.btn, width: '100%' }}>Είσοδος</button>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.page}>
      {/* Header */}
      <header style={styles.header}>
        <a href="/" style={styles.backLink}>← Αρχική</a>
        <h1 style={styles.title}>Παραφραστική Βελτίωση</h1>
        <p style={styles.subtitle}>Ελαφριά παράφραση & βελτίωση υφιστάμενων μεταφράσεων</p>
      </header>

      <main style={styles.main}>
        {error && <div style={styles.errorBanner}>{error}</div>}

        {/* ============ UPLOAD ============ */}
        {step === 'upload' && (
          <div style={styles.card}>
            <h2 style={styles.cardTitle}>Ανέβασμα κειμένων</h2>
            <p style={styles.cardDesc}>
              Ανεβάστε δύο αρχεία: το αγγλικό πρωτότυπο και την υπάρχουσα ελληνική μετάφραση.
              Η εφαρμογή θα παράγει μια εναλλακτική ελληνική απόδοση, πιστή στο αγγλικό αλλά
              διαφορετική από τη μετάφραση.
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 24 }}>
              {/* English source */}
              <div
                style={{
                  ...styles.dropzone,
                  borderColor: sourceFile ? '#4a7c2e' : '#c5bfad',
                  backgroundColor: sourceFile ? '#f0f7eb' : '#fdfcf8',
                }}
                onClick={() => sourceInputRef.current?.click()}
              >
                <input
                  ref={sourceInputRef}
                  type="file"
                  accept=".docx,.txt"
                  onChange={(e) => setSourceFile(e.target.files?.[0] || null)}
                  style={{ display: 'none' }}
                />
                <p style={styles.dropzoneIcon}>🇬🇧</p>
                <p style={styles.dropzoneText}>
                  {sourceFile ? sourceFile.name : 'Αγγλικό πρωτότυπο'}
                </p>
                <p style={styles.dropzoneHint}>.docx ή .txt</p>
              </div>

              {/* Greek translation */}
              <div
                style={{
                  ...styles.dropzone,
                  borderColor: transFile ? '#4a7c2e' : '#c5bfad',
                  backgroundColor: transFile ? '#f0f7eb' : '#fdfcf8',
                }}
                onClick={() => transInputRef.current?.click()}
              >
                <input
                  ref={transInputRef}
                  type="file"
                  accept=".docx,.txt"
                  onChange={(e) => setTransFile(e.target.files?.[0] || null)}
                  style={{ display: 'none' }}
                />
                <p style={styles.dropzoneIcon}>🇬🇷</p>
                <p style={styles.dropzoneText}>
                  {transFile ? transFile.name : 'Ελληνική μετάφραση'}
                </p>
                <p style={styles.dropzoneHint}>.docx ή .txt</p>
              </div>
            </div>

            <button
              onClick={handleUpload}
              disabled={!sourceFile || !transFile || isUploading}
              style={{
                ...styles.btn,
                ...(!sourceFile || !transFile || isUploading ? styles.btnDisabled : {}),
                width: '100%',
              }}
            >
              {isUploading ? 'Φόρτωση...' : 'Ανέβασμα αρχείων'}
            </button>
          </div>
        )}

        {/* ============ PRESCAN ============ */}
        {step === 'prescan' && (
          <div style={styles.card}>
            <h2 style={styles.cardTitle}>Ανάλυση κειμένων</h2>
            <div style={styles.fileInfo}>
              <span style={styles.fileLabel}>Αγγλικό:</span> {sourceFilename} ({sourceParagraphs} παράγραφοι)
              <br />
              <span style={styles.fileLabel}>Ελληνικό:</span> {transFilename} ({transParagraphs} παράγραφοι)
              <br />
              <span style={styles.fileLabel}>Τμήματα:</span> {totalChunks}
            </div>

            {previewTrans.length > 0 && (
              <div style={styles.previewBox}>
                <h3 style={styles.previewTitle}>Προεπισκόπηση μετάφρασης</h3>
                {previewTrans.map((p, i) => (
                  <p key={i} style={styles.previewPara}>{p}</p>
                ))}
              </div>
            )}

            <div style={styles.modelSelect}>
              <label style={styles.label}>Μοντέλο AI:</label>
              <select
                value={selectedModel}
                onChange={(e) => setSelectedModel(e.target.value)}
                style={styles.select}
              >
                {MODELS.map((m) => (
                  <option key={m.value} value={m.value}>{m.label}</option>
                ))}
              </select>
            </div>

            <button
              onClick={handlePrescan}
              disabled={isScanning}
              style={{
                ...styles.btn,
                ...(isScanning ? styles.btnDisabled : {}),
              }}
            >
              {isScanning ? 'Ανάλυση σε εξέλιξη...' : 'Ανάλυση κειμένου'}
            </button>
          </div>
        )}

        {/* ============ CONFIG ============ */}
        {step === 'config' && (
          <div style={styles.card}>
            <h2 style={styles.cardTitle}>Ρυθμίσεις παράφρασης</h2>

            {analysis && (
              <div style={styles.analysisBox}>
                <h3 style={styles.analysisTitle}>Αποτελέσματα ανάλυσης</h3>
                <div style={styles.analysisGrid}>
                  <div style={styles.analysisPair}>
                    <span style={styles.analysisLabel}>Είδος:</span>
                    <span>{analysis.genre}</span>
                  </div>
                  <div style={styles.analysisPair}>
                    <span style={styles.analysisLabel}>Ύφος:</span>
                    <span>{analysis.register}</span>
                  </div>
                  <div style={styles.analysisPair}>
                    <span style={styles.analysisLabel}>Εποχή:</span>
                    <span>{analysis.era_style}</span>
                  </div>
                  {analysis.key_names?.length > 0 && (
                    <div style={styles.analysisPair}>
                      <span style={styles.analysisLabel}>Ονόματα:</span>
                      <span>{analysis.key_names.join(', ')}</span>
                    </div>
                  )}
                </div>
                {analysis.improvement_areas && (
                  <div style={{ marginTop: 12 }}>
                    <span style={styles.analysisLabel}>Τομείς βελτίωσης:</span>
                    <p style={{ marginTop: 4 }}>{analysis.improvement_areas}</p>
                  </div>
                )}
              </div>
            )}

            <div style={styles.configField}>
              <label style={styles.label}>Περιγραφή εγγράφου:</label>
              <textarea
                value={documentBrief}
                onChange={(e) => setDocumentBrief(e.target.value)}
                style={styles.textarea}
                rows={3}
              />
            </div>

            <div style={styles.configField}>
              <label style={styles.label}>Σημειώσεις ύφους:</label>
              <textarea
                value={styleNotes}
                onChange={(e) => setStyleNotes(e.target.value)}
                style={styles.textarea}
                rows={3}
              />
            </div>

            <div style={styles.modelSelect}>
              <label style={styles.label}>Μοντέλο AI:</label>
              <select
                value={selectedModel}
                onChange={(e) => setSelectedModel(e.target.value)}
                style={styles.select}
              >
                {MODELS.map((m) => (
                  <option key={m.value} value={m.value}>{m.label}</option>
                ))}
              </select>
            </div>

            <button onClick={handleStart} style={styles.btn}>
              Έναρξη παράφρασης
            </button>
          </div>
        )}

        {/* ============ PARAPHRASING / RESULTS ============ */}
        {(step === 'paraphrasing' || step === 'results') && (
          <>
            {/* Progress bar */}
            <div style={styles.progressContainer}>
              <div style={styles.progressHeader}>
                <span style={styles.progressLabel}>
                  {step === 'results'
                    ? `Ολοκληρώθηκε — ${totalChunks} τμήματα`
                    : isPaused
                      ? `Σε παύση — ${completedChunks}/${totalChunks}`
                      : `Επεξεργασία τμήματος ${currentChunk + 1} από ${totalChunks}`
                  }
                </span>
                <span style={styles.progressPercent}>{progress}%</span>
              </div>
              <div style={styles.progressTrack}>
                <div
                  style={{
                    ...styles.progressBar,
                    width: `${progress}%`,
                    backgroundColor: step === 'results' ? '#2d5016' : '#4a7c2e',
                  }}
                />
              </div>

              <div style={styles.progressActions}>
                {step === 'paraphrasing' && !isPaused && (
                  <button onClick={handlePause} style={styles.btnSecondary}>
                    Παύση
                  </button>
                )}
                {isPaused && (
                  <button onClick={handleResume} style={styles.btn}>
                    Συνέχεια
                  </button>
                )}
                {step === 'results' && (
                  <button onClick={handleDownload} style={styles.btn}>
                    Λήψη .docx
                  </button>
                )}
              </div>
            </div>

            {/* Chunk navigation */}
            {sideBySide.length > 0 && (
              <div style={styles.chunkNav}>
                {sideBySide.map((chunk, i) => (
                  <button
                    key={i}
                    onClick={() => setActiveChunk(i)}
                    style={{
                      ...styles.chunkBtn,
                      ...(i === activeChunk ? styles.chunkBtnActive : {}),
                      ...(chunk.status === 'done' ? styles.chunkBtnDone : {}),
                      ...(chunk.status === 'processing' ? styles.chunkBtnProcessing : {}),
                    }}
                  >
                    {i + 1}
                  </button>
                ))}
              </div>
            )}

            {/* Side-by-side view */}
            {sideBySide.length > 0 && sideBySide[activeChunk] && (
              <div style={styles.sideBySide}>
                <div style={styles.sidePanel}>
                  <h3 style={styles.sidePanelTitle}>Υπάρχουσα Μετάφραση</h3>
                  <div style={styles.textContent}>
                    {sideBySide[activeChunk].original.split('\n\n').map((para, i) => (
                      <p key={i} style={styles.paragraph}>{para}</p>
                    ))}
                  </div>
                </div>

                <div style={styles.divider} />

                <div style={styles.sidePanel}>
                  <h3 style={{
                    ...styles.sidePanelTitle,
                    color: sideBySide[activeChunk].status === 'done' ? '#2d5016' : '#999',
                  }}>
                    Νέα Απόδοση
                    {sideBySide[activeChunk].status === 'processing' && (
                      <span style={styles.processingDot}>●</span>
                    )}
                  </h3>
                  <div style={styles.textContent}>
                    {sideBySide[activeChunk].paraphrased ? (
                      sideBySide[activeChunk].paraphrased.split('\n\n').map((para, i) => (
                        <p key={i} style={styles.paragraph}>{para}</p>
                      ))
                    ) : (
                      <p style={styles.pendingText}>
                        {sideBySide[activeChunk].status === 'processing'
                          ? 'Επεξεργασία σε εξέλιξη...'
                          : 'Αναμονή...'}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}

// ============== STYLES (Classical Editorial) ==============
const styles = {
  page: {
    minHeight: '100vh',
    backgroundColor: '#faf8f3',
    fontFamily: '"Source Serif 4", "Noto Serif", Georgia, serif',
    color: '#2c2c2c',
  },
  header: {
    padding: '32px 40px 24px',
    borderBottom: '2px solid #2d5016',
    marginBottom: 32,
  },
  backLink: {
    color: '#4a7c2e',
    textDecoration: 'none',
    fontSize: 14,
    fontFamily: '"Source Sans 3", sans-serif',
    display: 'inline-block',
    marginBottom: 8,
  },
  title: {
    fontSize: 28,
    fontWeight: 600,
    color: '#2d5016',
    margin: 0,
    letterSpacing: '-0.01em',
  },
  subtitle: {
    fontSize: 15,
    color: '#6b6b5e',
    marginTop: 4,
    fontStyle: 'italic',
  },
  main: {
    maxWidth: 1400,
    margin: '0 auto',
    padding: '0 40px 60px',
  },
  errorBanner: {
    backgroundColor: '#fce8e8',
    color: '#c41e1e',
    padding: '12px 20px',
    borderRadius: 6,
    marginBottom: 20,
    fontSize: 14,
    border: '1px solid #f5c6c6',
  },
  card: {
    backgroundColor: '#fff',
    border: '1px solid #e2ddd3',
    borderRadius: 8,
    padding: '36px 40px',
    maxWidth: 680,
    margin: '0 auto',
    boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
  },
  cardTitle: {
    fontSize: 22,
    fontWeight: 600,
    color: '#2d5016',
    margin: '0 0 8px',
  },
  cardDesc: {
    fontSize: 15,
    color: '#6b6b5e',
    lineHeight: 1.6,
    marginBottom: 28,
  },
  dropzone: {
    border: '2px dashed #c5bfad',
    borderRadius: 8,
    padding: '48px 24px',
    textAlign: 'center',
    cursor: 'pointer',
    transition: 'border-color 0.2s',
    backgroundColor: '#fdfcf8',
  },
  dropzoneIcon: {
    fontSize: 36,
    marginBottom: 8,
  },
  dropzoneText: {
    fontSize: 15,
    color: '#555',
    margin: '4px 0',
  },
  dropzoneHint: {
    fontSize: 13,
    color: '#999',
    marginTop: 4,
  },
  fileInfo: {
    backgroundColor: '#f5f2eb',
    padding: '14px 20px',
    borderRadius: 6,
    fontSize: 14,
    color: '#444',
    marginBottom: 20,
    lineHeight: 1.8,
  },
  fileLabel: {
    fontWeight: 600,
    color: '#2d5016',
  },
  previewBox: {
    backgroundColor: '#fdfcf8',
    border: '1px solid #e8e3d8',
    borderRadius: 6,
    padding: '16px 20px',
    marginBottom: 24,
    maxHeight: 240,
    overflowY: 'auto',
  },
  previewTitle: {
    fontSize: 13,
    fontWeight: 600,
    color: '#888',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
    marginBottom: 12,
    fontFamily: '"Source Sans 3", sans-serif',
  },
  previewPara: {
    fontSize: 14,
    lineHeight: 1.7,
    color: '#555',
    marginBottom: 8,
  },
  modelSelect: {
    marginBottom: 24,
  },
  label: {
    display: 'block',
    fontSize: 13,
    fontWeight: 600,
    color: '#555',
    marginBottom: 6,
    fontFamily: '"Source Sans 3", sans-serif',
    textTransform: 'uppercase',
    letterSpacing: '0.04em',
  },
  select: {
    width: '100%',
    padding: '10px 14px',
    fontSize: 15,
    border: '1px solid #ccc7b9',
    borderRadius: 6,
    backgroundColor: '#fff',
    fontFamily: '"Source Serif 4", Georgia, serif',
    color: '#2c2c2c',
    outline: 'none',
  },
  textarea: {
    width: '100%',
    padding: '10px 14px',
    fontSize: 14,
    border: '1px solid #ccc7b9',
    borderRadius: 6,
    fontFamily: '"Source Serif 4", Georgia, serif',
    color: '#2c2c2c',
    lineHeight: 1.6,
    resize: 'vertical',
    outline: 'none',
    boxSizing: 'border-box',
  },
  configField: {
    marginBottom: 20,
  },
  btn: {
    backgroundColor: '#2d5016',
    color: '#fff',
    border: 'none',
    padding: '12px 28px',
    fontSize: 15,
    borderRadius: 6,
    cursor: 'pointer',
    fontFamily: '"Source Sans 3", sans-serif',
    fontWeight: 600,
    letterSpacing: '0.02em',
    transition: 'background-color 0.2s',
  },
  btnDisabled: {
    backgroundColor: '#9aab8e',
    cursor: 'not-allowed',
  },
  btnSecondary: {
    backgroundColor: 'transparent',
    color: '#2d5016',
    border: '1px solid #2d5016',
    padding: '10px 24px',
    fontSize: 14,
    borderRadius: 6,
    cursor: 'pointer',
    fontFamily: '"Source Sans 3", sans-serif',
    fontWeight: 600,
  },
  analysisBox: {
    backgroundColor: '#f0ede4',
    border: '1px solid #d6d0c1',
    borderRadius: 6,
    padding: '20px 24px',
    marginBottom: 28,
  },
  analysisTitle: {
    fontSize: 14,
    fontWeight: 600,
    color: '#2d5016',
    margin: '0 0 14px',
    fontFamily: '"Source Sans 3", sans-serif',
    textTransform: 'uppercase',
    letterSpacing: '0.04em',
  },
  analysisGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '8px 24px',
    fontSize: 14,
  },
  analysisPair: {
    display: 'flex',
    gap: 8,
  },
  analysisLabel: {
    fontWeight: 600,
    color: '#555',
    minWidth: 60,
  },

  // Progress
  progressContainer: {
    backgroundColor: '#fff',
    border: '1px solid #e2ddd3',
    borderRadius: 8,
    padding: '20px 28px',
    marginBottom: 20,
  },
  progressHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  progressLabel: {
    fontSize: 14,
    color: '#555',
    fontFamily: '"Source Sans 3", sans-serif',
  },
  progressPercent: {
    fontSize: 18,
    fontWeight: 700,
    color: '#2d5016',
  },
  progressTrack: {
    height: 6,
    backgroundColor: '#e8e3d8',
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: 14,
  },
  progressBar: {
    height: '100%',
    borderRadius: 3,
    transition: 'width 0.5s ease',
  },
  progressActions: {
    display: 'flex',
    gap: 12,
  },

  // Chunk navigation
  chunkNav: {
    display: 'flex',
    gap: 6,
    flexWrap: 'wrap',
    marginBottom: 16,
    padding: '12px 0',
  },
  chunkBtn: {
    width: 36,
    height: 36,
    border: '1px solid #ccc7b9',
    borderRadius: 6,
    backgroundColor: '#fff',
    cursor: 'pointer',
    fontSize: 13,
    fontWeight: 600,
    color: '#888',
    fontFamily: '"Source Sans 3", sans-serif',
    transition: 'all 0.15s',
  },
  chunkBtnActive: {
    borderColor: '#2d5016',
    color: '#2d5016',
    boxShadow: '0 0 0 2px rgba(45,80,22,0.2)',
  },
  chunkBtnDone: {
    backgroundColor: '#edf5e6',
    color: '#2d5016',
    borderColor: '#b5d4a0',
  },
  chunkBtnProcessing: {
    backgroundColor: '#fff8e1',
    borderColor: '#e0c960',
    color: '#9a7d10',
  },

  // Side-by-side
  sideBySide: {
    display: 'grid',
    gridTemplateColumns: '1fr 1px 1fr',
    gap: 0,
    backgroundColor: '#fff',
    border: '1px solid #e2ddd3',
    borderRadius: 8,
    overflow: 'hidden',
    minHeight: 400,
  },
  sidePanel: {
    padding: '20px 28px',
    overflowY: 'auto',
    maxHeight: '70vh',
  },
  sidePanelTitle: {
    fontSize: 13,
    fontWeight: 600,
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
    color: '#888',
    marginBottom: 16,
    fontFamily: '"Source Sans 3", sans-serif',
    position: 'sticky',
    top: 0,
    backgroundColor: '#fff',
    paddingBottom: 8,
    borderBottom: '1px solid #eee',
  },
  divider: {
    backgroundColor: '#e2ddd3',
    width: 1,
  },
  textContent: {
    paddingTop: 8,
  },
  paragraph: {
    fontSize: 15,
    lineHeight: 1.85,
    color: '#2c2c2c',
    marginBottom: 16,
    textAlign: 'justify',
    textIndent: '1.5em',
  },
  pendingText: {
    fontSize: 14,
    color: '#aaa',
    fontStyle: 'italic',
    textAlign: 'center',
    paddingTop: 60,
  },
  processingDot: {
    color: '#e0c960',
    marginLeft: 8,
    animation: 'pulse 1.5s infinite',
    fontSize: 10,
  },
};
