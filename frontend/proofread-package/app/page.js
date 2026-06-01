'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useTheme } from './layout';

// Icons as simple SVG components
const UploadIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M17 8l-5-5-5 5M12 3v12"/>
  </svg>
);

const CheckIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <polyline points="20 6 9 17 4 12"/>
  </svg>
);

const ArrowRightIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <line x1="5" y1="12" x2="19" y2="12"/>
    <polyline points="12 5 19 12 12 19"/>
  </svg>
);

const SunIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
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
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
    <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
  </svg>
);

export default function LandingPage() {
  const { theme, toggleTheme } = useTheme();
  const [email, setEmail] = useState('');

  const features = [
    {
      number: '01',
      title: 'Ορθογραφικός Έλεγχος',
      description: 'Εντοπισμός και διόρθωση ορθογραφικών λαθών με βάση το σύγχρονο ελληνικό λεξικό.',
    },
    {
      number: '02',
      title: 'Γραμματική & Σύνταξη',
      description: 'Ανάλυση γραμματικών δομών και εντοπισμός συντακτικών ασυνεπειών.',
    },
    {
      number: '03',
      title: 'Τυπογραφία & Στίξη',
      description: 'Διόρθωση τυπογραφικών λαθών, σημείων στίξης και μορφοποίησης κειμένου.',
    },
  ];

  const benefits = [
    'Υποστήριξη αρχείων Word (.docx)',
    'Διατήρηση μορφοποίησης εγγράφου',
    'Λεπτομερείς εξηγήσεις διορθώσεων',
    'Εξαγωγή διορθωμένου αρχείου',
  ];

  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--color-background)' }}>
      {/* Header */}
      <header className="app-header">
        <Link href="/" className="app-logo">
          <span className="app-logo-icon">π</span>
          ProofreadAI
        </Link>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <button 
            onClick={toggleTheme}
            className="btn-ghost"
            style={{ 
              padding: '0.5rem',
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
            aria-label="Toggle theme"
          >
            {theme === 'light' ? <MoonIcon /> : <SunIcon />}
          </button>
          
          <Link href="/editor" className="btn btn-primary btn-sm">
            Έναρξη
          </Link>
        </div>
      </header>

      {/* Hero Section */}
      <section className="section-lg" style={{ 
        textAlign: 'center',
        paddingTop: '8rem',
        paddingBottom: '6rem',
      }}>
        <div className="container-narrow">
          <p className="label animate-fade-in" style={{ marginBottom: '1.5rem' }}>
            Τεχνητή Νοημοσύνη για Ελληνικά Κείμενα
          </p>
          
          <h1 className="headline-hero animate-fade-in stagger-1" style={{ marginBottom: '1.5rem' }}>
            Επαγγελματική διόρθωση κειμένων με ακρίβεια
          </h1>
          
          <p className="animate-fade-in stagger-2" style={{ 
            fontSize: '1.2rem',
            color: 'var(--color-text-muted)',
            maxWidth: '600px',
            margin: '0 auto 2.5rem',
            lineHeight: '1.7',
          }}>
            Αυτοματοποιημένος έλεγχος ορθογραφίας, γραμματικής και σύνταξης 
            για επαγγελματικά ελληνικά κείμενα.
          </p>
          
          <div className="animate-fade-in stagger-3" style={{ 
            display: 'flex', 
            gap: '1rem', 
            justifyContent: 'center',
            flexWrap: 'wrap',
          }}>
            <Link href="/editor" className="btn btn-primary btn-lg">
              <UploadIcon />
              Ανέβασε Έγγραφο
            </Link>
            <a href="#features" className="btn btn-secondary btn-lg">
              Μάθε Περισσότερα
            </a>
          </div>
        </div>
      </section>

      {/* Divider */}
      <div className="container">
        <div className="divider">
          <div className="divider-line" />
          <span className="label-muted">Δυνατότητες</span>
          <div className="divider-line" />
        </div>
      </div>

      {/* Features Section */}
      <section id="features" className="section">
        <div className="container">
          <div style={{ 
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
            gap: '2rem',
          }}>
            {features.map((feature, index) => (
              <div 
                key={feature.number}
                className="card animate-fade-in"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <span style={{ 
                  fontFamily: 'var(--font-display)',
                  fontSize: '3rem',
                  color: 'var(--color-accent)',
                  lineHeight: 1,
                  display: 'block',
                  marginBottom: '1rem',
                }}>
                  {feature.number}
                </span>
                <h3 className="headline-card" style={{ marginBottom: '0.75rem' }}>
                  {feature.title}
                </h3>
                <p style={{ color: 'var(--color-text-muted)', lineHeight: '1.7' }}>
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it Works */}
      <section className="section" style={{ backgroundColor: 'var(--color-surface)' }}>
        <div className="container">
          <div style={{ 
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '4rem',
            alignItems: 'center',
          }}>
            <div>
              <p className="label" style={{ marginBottom: '1rem' }}>Πώς Λειτουργεί</p>
              <h2 className="headline-section" style={{ marginBottom: '1.5rem' }}>
                Τρία απλά βήματα
              </h2>
              <p style={{ 
                color: 'var(--color-text-muted)', 
                marginBottom: '2rem',
                lineHeight: '1.8',
              }}>
                Ανεβάστε το έγγραφό σας, δείτε τις προτεινόμενες διορθώσεις 
                και κατεβάστε την τελική έκδοση.
              </p>
              
              <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                {benefits.map((benefit, index) => (
                  <li 
                    key={index}
                    style={{ 
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.75rem',
                      padding: '0.75rem 0',
                      borderBottom: '1px solid var(--color-border)',
                    }}
                  >
                    <span style={{ color: 'var(--color-success)' }}>
                      <CheckIcon />
                    </span>
                    {benefit}
                  </li>
                ))}
              </ul>
            </div>
            
            <div className="card" style={{ 
              padding: '3rem',
              backgroundColor: 'var(--color-background)',
            }}>
              <div style={{ marginBottom: '2rem' }}>
                <span className="badge" style={{ marginBottom: '1rem', display: 'inline-block' }}>
                  Βήμα 1
                </span>
                <p style={{ fontWeight: 500 }}>Ανεβάστε το αρχείο .docx</p>
              </div>
              <div style={{ marginBottom: '2rem' }}>
                <span className="badge" style={{ marginBottom: '1rem', display: 'inline-block' }}>
                  Βήμα 2
                </span>
                <p style={{ fontWeight: 500 }}>Εξετάστε τις διορθώσεις</p>
              </div>
              <div>
                <span className="badge badge-success" style={{ marginBottom: '1rem', display: 'inline-block' }}>
                  Βήμα 3
                </span>
                <p style={{ fontWeight: 500 }}>Κατεβάστε το διορθωμένο</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="section-lg" style={{ 
        backgroundColor: 'var(--color-primary)',
        color: 'white',
        textAlign: 'center',
      }}>
        <div className="container-narrow">
          <h2 style={{ 
            fontFamily: 'var(--font-display)',
            fontSize: 'clamp(2rem, 5vw, 3rem)',
            marginBottom: '1rem',
          }}>
            Έτοιμοι να ξεκινήσετε;
          </h2>
          <p style={{ 
            opacity: 0.9,
            marginBottom: '2rem',
            fontSize: '1.1rem',
          }}>
            Ανεβάστε το πρώτο σας έγγραφο δωρεάν
          </p>
          <Link 
            href="/editor" 
            className="btn btn-lg"
            style={{ 
              backgroundColor: 'white',
              color: 'var(--color-primary)',
              border: 'none',
            }}
          >
            Δοκιμάστε Τώρα
            <ArrowRightIcon />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer style={{ 
        padding: '3rem 2rem',
        borderTop: '1px solid var(--color-border)',
        backgroundColor: 'var(--color-surface)',
      }}>
        <div className="container" style={{ 
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '1rem',
        }}>
          <div className="app-logo" style={{ fontSize: '1.25rem' }}>
            <span className="app-logo-icon" style={{ width: '24px', height: '24px', fontSize: '0.8rem' }}>π</span>
            ProofreadAI
          </div>
          <p style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem' }}>
            © 2024 ProofreadAI. Με επιφύλαξη παντός δικαιώματος.
          </p>
        </div>
      </footer>
    </div>
  );
}
