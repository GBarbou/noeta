'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import Link from 'next/link';
import { useTheme } from '../layout';

// ============================================
// ICONS
// ============================================
const UploadIcon = () => (
  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M17 8l-5-5-5 5M12 3v12"/>
  </svg>
);

const FileIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
    <polyline points="14 2 14 8 20 8"/>
    <line x1="16" y1="13" x2="8" y2="13"/>
    <line x1="16" y1="17" x2="8" y2="17"/>
  </svg>
);

const CheckIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
    <polyline points="20 6 9 17 4 12"/>
  </svg>
);

const XIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
    <line x1="18" y1="6" x2="6" y2="18"/>
    <line x1="6" y1="6" x2="18" y2="18"/>
  </svg>
);

const DownloadIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3"/>
  </svg>
);

const SunIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
    <circle cx="12" cy="12" r="5"/>
    <line x1="12" y1="1" x2="12" y2="3"/>
    <line x1="12" y1="21" x2="12" y2="23"/>
    <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/>
    <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/>
    <line x1="1" y1="12" x2="3" y2="12"/>
    <line x1="21" y1="12" x2="23" y2="12"/>
    <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/>
    <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
  </svg>
);

const MoonIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
    <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
  </svg>
);

const SpinnerIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="animate-spin">
    <circle cx="12" cy="12" r="10" strokeOpacity="0.25"/>
    <path d="M12 2a10 10 0 0 1 10 10" strokeLinecap="round"/>
  </svg>
);

// ============================================
// CORRECTION TYPE CONFIG
// ============================================
const CORRECTION_TYPES = {
  spelling: { label: 'Ορθογραφία', color: 'error' },
  grammar: { label: 'Γραμματική', color: 'warning' },
  punctuation: { label: 'Στίξη', color: 'info' },
  style: { label: 'Ύφος', color: 'info' },
  typography: { label: 'Τυπογραφία', color: 'warning' },
};

// ============================================
// MAIN EDITOR COMPONENT
// ============================================
export default function EditorPage() {
  const { theme, toggleTheme } = useTheme();
  const fileInputRef = useRef(null);
  
  // State
  const [file, setFile] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [documentText, setDocumentText] = useState('');
  const [corrections, setCorrections] = useState([]);
  const [activeCorrection, setActiveCorrection] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState(null);

  // ============================================
  // FILE HANDLING
  // ============================================
  const handleFileSelect = useCallback((selectedFile) => {
    if (!selectedFile) return;
    
    // Validate file type
    if (!selectedFile.name.endsWith('.docx')) {
      setError('Παρακαλώ επιλέξτε αρχείο .docx');
      return;
    }
    
    setError(null);
    setFile(selectedFile);
    processFile(selectedFile);
  }, []);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    setIsDragging(false);
    const droppedFile = e.dataTransfer.files[0];
    handleFileSelect(droppedFile);
  }, [handleFileSelect]);

  const handleDragOver = useCallback((e) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  // ============================================
  // FILE PROCESSING (MOCK)
  // ============================================
  const processFile = async (selectedFile) => {
    setIsProcessing(true);
    setProgress(0);
    setCorrections([]);
    
    // Simulate progress
    const progressInterval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 90) {
          clearInterval(progressInterval);
          return prev;
        }
        return prev + Math.random() * 15;
      });
    }, 300);

    try {
      // In production, this would call your backend API
      // For demo, we simulate with mock data
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      clearInterval(progressInterval);
      setProgress(100);
      
      // Mock document text
      const mockText = `Η τεχνητή νοημοσύνη αποτελεί μία απο τις πιο σημαντικές τεχνολογικές εξελίξεις του 21ου αιώνα. Οι εφαρμογές της εκτίνονται σε πολλούς τομείς, από την υγεία μέχρι την εκπαίδευση.

Στον τομέα της υγείας, η τεχνητή νοημοσύνη χρησιμοποιείτε για τη διάγνωση ασθενειών με μεγάλη ακρίβεια. Επίσης, βοηθά τους γιατρούς να αναλύουν ιατρικές εικόνες και να εντοπίζουν ανωμαλίες που μπορεί να διαφύγουν απο το ανθρώπινο μάτι.

Η εκπαίδευση είναι άλλος ένας τομέας οπου η τεχνητή νοημοσύνη προσφέρει σημαντικά οφέλη. Τα έξυπνα συστήματα μπορούν να προσαρμόζουν το εκπαιδευτικό υλικό στις ανάγκες κάθε μαθητή, δημιουργώντας εξατομικευμένες εμπειρίες μάθησης.`;

      setDocumentText(mockText);

      // Mock corrections
      const mockCorrections = [
        {
          id: 1,
          type: 'spelling',
          original: 'απο',
          suggested: 'από',
          position: { start: 47, end: 50 },
          explanation: 'Η πρόθεση «από» γράφεται με τόνο.',
          status: 'pending',
        },
        {
          id: 2,
          type: 'grammar',
          original: 'χρησιμοποιείτε',
          suggested: 'χρησιμοποιείται',
          position: { start: 283, end: 297 },
          explanation: 'Το ρήμα πρέπει να είναι στην παθητική φωνή (γ\' ενικό).',
          status: 'pending',
        },
        {
          id: 3,
          type: 'spelling',
          original: 'απο',
          suggested: 'από',
          position: { start: 428, end: 431 },
          explanation: 'Η πρόθεση «από» γράφεται με τόνο.',
          status: 'pending',
        },
        {
          id: 4,
          type: 'spelling',
          original: 'οπου',
          suggested: 'όπου',
          position: { start: 494, end: 498 },
          explanation: 'Το αναφορικό επίρρημα «όπου» γράφεται με τόνο.',
          status: 'pending',
        },
        {
          id: 5,
          type: 'style',
          original: 'εξατομικευμένες',
          suggested: 'εξατομικευμένες',
          position: { start: 650, end: 665 },
          explanation: 'Σωστή χρήση του όρου. Εναλλακτικά: «προσωποποιημένες».',
          status: 'pending',
        },
      ];

      setCorrections(mockCorrections);
      
      await new Promise(resolve => setTimeout(resolve, 500));
      setIsProcessing(false);
      
    } catch (err) {
      clearInterval(progressInterval);
      setError('Σφάλμα κατά την επεξεργασία του αρχείου');
      setIsProcessing(false);
    }
  };

  // ============================================
  // CORRECTION ACTIONS
  // ============================================
  const handleAccept = (correctionId) => {
    setCorrections(prev => 
      prev.map(c => c.id === correctionId ? { ...c, status: 'accepted' } : c)
    );
  };

  const handleReject = (correctionId) => {
    setCorrections(prev => 
      prev.map(c => c.id === correctionId ? { ...c, status: 'rejected' } : c)
    );
  };

  const handleAcceptAll = () => {
    setCorrections(prev => 
      prev.map(c => c.status === 'pending' ? { ...c, status: 'accepted' } : c)
    );
  };

  const handleDownload = () => {
    // In production, this would generate the corrected .docx
    alert('Λήψη διορθωμένου εγγράφου (demo)');
  };

  const handleReset = () => {
    setFile(null);
    setDocumentText('');
    setCorrections([]);
    setActiveCorrection(null);
    setProgress(0);
    setError(null);
  };

  // ============================================
  // RENDER DOCUMENT WITH HIGHLIGHTS
  // ============================================
  const renderDocumentWithHighlights = () => {
    if (!documentText) return null;

    let result = [];
    let lastIndex = 0;
    
    // Sort corrections by position
    const sortedCorrections = [...corrections]
      .filter(c => c.status !== 'rejected')
      .sort((a, b) => a.position.start - b.position.start);

    sortedCorrections.forEach((correction, index) => {
      // Add text before this correction
      if (correction.position.start > lastIndex) {
        result.push(
          <span key={`text-${index}`}>
            {documentText.slice(lastIndex, correction.position.start)}
          </span>
        );
      }

      // Add highlighted correction
      const isActive = activeCorrection === correction.id;
      const isAccepted = correction.status === 'accepted';
      
      result.push(
        <span
          key={`correction-${correction.id}`}
          className={`correction-highlight ${isActive ? 'active' : ''} ${isAccepted ? 'accepted' : ''}`}
          onClick={() => setActiveCorrection(correction.id)}
          title={correction.explanation}
        >
          {isAccepted ? correction.suggested : correction.original}
        </span>
      );

      lastIndex = correction.position.end;
    });

    // Add remaining text
    if (lastIndex < documentText.length) {
      result.push(
        <span key="text-end">
          {documentText.slice(lastIndex)}
        </span>
      );
    }

    return result;
  };

  // ============================================
  // STATS
  // ============================================
  const pendingCount = corrections.filter(c => c.status === 'pending').length;
  const acceptedCount = corrections.filter(c => c.status === 'accepted').length;
  const rejectedCount = corrections.filter(c => c.status === 'rejected').length;

  // ============================================
  // RENDER
  // ============================================
  return (
    <div style={{ minHeight: '100vh', backgroundColor: 'var(--color-background)' }}>
      {/* Header */}
      <header className="app-header no-print">
        <Link href="/" className="app-logo">
          <span className="app-logo-icon">π</span>
          ProofreadAI
        </Link>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          {file && (
            <>
              <span style={{ 
                fontSize: '0.85rem', 
                color: 'var(--color-text-muted)',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
              }}>
                <FileIcon />
                {file.name}
              </span>
              <button onClick={handleReset} className="btn btn-ghost btn-sm">
                Νέο αρχείο
              </button>
            </>
          )}
          
          <button 
            onClick={toggleTheme}
            className="btn-ghost"
            style={{ 
              padding: '0.5rem',
              borderRadius: '6px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
            aria-label="Toggle theme"
          >
            {theme === 'light' ? <MoonIcon /> : <SunIcon />}
          </button>
        </div>
      </header>

      {/* Main Content */}
      {!file ? (
        // Upload State
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center',
          minHeight: 'calc(100vh - 64px)',
          padding: '2rem',
        }}>
          <div style={{ maxWidth: '500px', width: '100%', textAlign: 'center' }}>
            <h1 className="headline-section" style={{ marginBottom: '0.75rem' }}>
              Ανεβάστε το έγγραφό σας
            </h1>
            <p style={{ color: 'var(--color-text-muted)', marginBottom: '2rem' }}>
              Υποστηρίζονται αρχεία Microsoft Word (.docx)
            </p>
            
            <div
              className={`upload-zone ${isDragging ? 'dragging' : ''}`}
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onClick={() => fileInputRef.current?.click()}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".docx"
                onChange={(e) => handleFileSelect(e.target.files?.[0])}
                style={{ display: 'none' }}
              />
              
              <div style={{ color: 'var(--color-primary)', marginBottom: '1rem' }}>
                <UploadIcon />
              </div>
              
              <p style={{ fontWeight: 500, marginBottom: '0.5rem' }}>
                Σύρετε το αρχείο εδώ
              </p>
              <p style={{ fontSize: '0.9rem', color: 'var(--color-text-muted)' }}>
                ή κάντε κλικ για επιλογή
              </p>
            </div>

            {error && (
              <div style={{ 
                marginTop: '1rem',
                padding: '0.75rem 1rem',
                backgroundColor: 'var(--color-error-bg)',
                color: 'var(--color-error)',
                borderRadius: '6px',
                fontSize: '0.9rem',
              }}>
                {error}
              </div>
            )}
          </div>
        </div>
      ) : isProcessing ? (
        // Processing State
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center',
          minHeight: 'calc(100vh - 64px)',
          padding: '2rem',
        }}>
          <div style={{ maxWidth: '400px', width: '100%', textAlign: 'center' }}>
            <div style={{ 
              color: 'var(--color-primary)', 
              marginBottom: '1.5rem',
              display: 'flex',
              justifyContent: 'center',
            }}>
              <SpinnerIcon />
            </div>
            
            <h2 style={{ 
              fontFamily: 'var(--font-display)',
              fontSize: '1.5rem',
              marginBottom: '0.5rem',
            }}>
              Επεξεργασία εγγράφου...
            </h2>
            <p style={{ 
              color: 'var(--color-text-muted)', 
              fontSize: '0.9rem',
              marginBottom: '1.5rem',
            }}>
              Ανάλυση κειμένου και εντοπισμός λαθών
            </p>
            
            <div className="progress-bar" style={{ marginBottom: '0.5rem' }}>
              <div 
                className="progress-fill" 
                style={{ width: `${progress}%` }}
              />
            </div>
            <p style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>
              {Math.round(progress)}%
            </p>
          </div>
        </div>
      ) : (
        // Editor State
        <div className="editor-container">
          {/* Document Panel */}
          <div className="document-panel">
            <div className="document-content">
              {renderDocumentWithHighlights()}
            </div>
          </div>

          {/* Corrections Panel */}
          <div className="corrections-panel">
            {/* Panel Header */}
            <div className="corrections-header">
              <div style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center',
                marginBottom: '1rem',
              }}>
                <h2 style={{ 
                  fontFamily: 'var(--font-display)',
                  fontSize: '1.25rem',
                  fontWeight: 500,
                }}>
                  Διορθώσεις
                </h2>
                <span className="badge">
                  {pendingCount} εκκρεμούν
                </span>
              </div>

              {/* Stats */}
              <div style={{ 
                display: 'flex', 
                gap: '1rem',
                fontSize: '0.8rem',
                color: 'var(--color-text-muted)',
              }}>
                <span style={{ color: 'var(--color-success)' }}>
                  ✓ {acceptedCount} αποδεκτές
                </span>
                <span style={{ color: 'var(--color-error)' }}>
                  ✕ {rejectedCount} απορριφθείσες
                </span>
              </div>

              {/* Actions */}
              {pendingCount > 0 && (
                <div style={{ 
                  display: 'flex', 
                  gap: '0.5rem',
                  marginTop: '1rem',
                }}>
                  <button 
                    onClick={handleAcceptAll}
                    className="btn btn-primary btn-sm"
                    style={{ flex: 1 }}
                  >
                    <CheckIcon />
                    Αποδοχή Όλων
                  </button>
                </div>
              )}

              {pendingCount === 0 && corrections.length > 0 && (
                <button 
                  onClick={handleDownload}
                  className="btn btn-success"
                  style={{ width: '100%', marginTop: '1rem' }}
                >
                  <DownloadIcon />
                  Λήψη Διορθωμένου
                </button>
              )}
            </div>

            {/* Corrections List */}
            <div className="corrections-list">
              {corrections.map((correction) => (
                <div
                  key={correction.id}
                  className={`correction-card ${activeCorrection === correction.id ? 'active' : ''}`}
                  onClick={() => setActiveCorrection(correction.id)}
                  style={{
                    opacity: correction.status === 'rejected' ? 0.5 : 1,
                  }}
                >
                  {/* Type Badge */}
                  <div style={{ marginBottom: '0.75rem' }}>
                    <span className={`badge badge-${CORRECTION_TYPES[correction.type]?.color || 'info'}`}>
                      {CORRECTION_TYPES[correction.type]?.label || correction.type}
                    </span>
                  </div>

                  {/* Original → Suggested */}
                  <div style={{ 
                    fontSize: '0.95rem',
                    marginBottom: '0.75rem',
                    fontFamily: 'var(--font-mono)',
                  }}>
                    <span className="correction-original">{correction.original}</span>
                    <span className="correction-arrow">→</span>
                    <span className="correction-suggested">{correction.suggested}</span>
                  </div>

                  {/* Explanation */}
                  <p style={{ 
                    fontSize: '0.85rem',
                    color: 'var(--color-text-muted)',
                    lineHeight: 1.5,
                    marginBottom: '0.75rem',
                  }}>
                    {correction.explanation}
                  </p>

                  {/* Actions */}
                  {correction.status === 'pending' && (
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleAccept(correction.id);
                        }}
                        className="btn btn-success btn-sm"
                        style={{ flex: 1 }}
                      >
                        <CheckIcon />
                        Αποδοχή
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleReject(correction.id);
                        }}
                        className="btn btn-error btn-sm"
                        style={{ flex: 1 }}
                      >
                        <XIcon />
                        Απόρριψη
                      </button>
                    </div>
                  )}

                  {/* Status indicator for resolved corrections */}
                  {correction.status !== 'pending' && (
                    <div style={{ 
                      fontSize: '0.8rem',
                      color: correction.status === 'accepted' 
                        ? 'var(--color-success)' 
                        : 'var(--color-text-muted)',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.25rem',
                    }}>
                      {correction.status === 'accepted' ? (
                        <>
                          <CheckIcon /> Αποδεκτή
                        </>
                      ) : (
                        <>
                          <XIcon /> Απορρίφθηκε
                        </>
                      )}
                    </div>
                  )}
                </div>
              ))}

              {corrections.length === 0 && (
                <div style={{ 
                  textAlign: 'center',
                  padding: '3rem 1rem',
                  color: 'var(--color-text-muted)',
                }}>
                  <p>Δεν βρέθηκαν διορθώσεις</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* CSS for spinner animation */}
      <style jsx global>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .animate-spin {
          animation: spin 1s linear infinite;
        }
      `}</style>
    </div>
  );
}
