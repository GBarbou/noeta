// themes/index.ts
// Theme system for ProofreadAI - Easy switching between styles

export type ThemeName = 'classical-editorial' | 'propaganda';

export const CURRENT_THEME: ThemeName = 'classical-editorial'; // ← ΑΛΛΑΞΕ ΕΔΩ ΓΙΑ ΝΑ ΑΛΛΑΞΕΙΣ THEME

// ===========================================
// CLASSICAL EDITORIAL THEME
// Κομψό, λογοτεχνικό, για 40+ κοινό
// ===========================================
export const classicalEditorial = {
  name: 'classical-editorial',
  
  colors: {
    primary: '#2D4A3E',      // Forest green
    secondary: '#8B7355',    // Gold
    accent: '#C4B5A0',       // Light gold
    background: '#FAF8F5',   // Cream
    surface: '#FFFFFF',      // White
    text: '#1a1a1a',         // Ink
    textMuted: '#6B6B6B',    // Gray
    error: '#8B2635',        // Burgundy (subtle)
    success: '#2D4A3E',      // Forest green
  },
  
  fonts: {
    display: '"Cormorant Garamond", Georgia, serif',
    body: '"Inter", sans-serif',
    mono: '"IBM Plex Mono", monospace',
  },
  
  fontSizes: {
    hero: 'clamp(48px, 7vw, 80px)',
    title: 'clamp(36px, 5vw, 56px)',
    subtitle: 'clamp(24px, 3vw, 36px)',
    body: '17px',
    small: '14px',
    label: '11px',
  },
  
  spacing: {
    section: '120px',
    element: '40px',
  },
  
  borders: {
    width: '1px',
    radius: '0',
    color: 'rgba(0,0,0,0.08)',
  },
  
  shadows: {
    card: 'none',
    button: 'none',
    image: '0 20px 60px rgba(0,0,0,0.1)',
  },
  
  effects: {
    grain: false,
    halftone: false,
  },
  
  typography: {
    headingWeight: '400',      // Light, elegant
    headingTransform: 'none',  // No uppercase
    headingTracking: '0.02em',
    labelTransform: 'uppercase',
    labelTracking: '0.15em',
  },
};

// ===========================================
// PROPAGANDA THEME
// Bold, vintage, attention-grabbing
// ===========================================
export const propaganda = {
  name: 'propaganda',
  
  colors: {
    primary: '#D64933',      // Red
    secondary: '#1A1A1A',    // Black
    accent: '#4A8F4A',       // Green
    background: '#F5F0E1',   // Cream
    surface: '#FFFEF9',      // Off-white
    text: '#1A1A1A',         // Black
    textMuted: '#4A4A48',    // Gray
    error: '#D64933',        // Red
    success: '#4A8F4A',      // Green
  },
  
  fonts: {
    display: '"Bebas Neue", sans-serif',
    body: '"Work Sans", sans-serif',
    mono: '"IBM Plex Mono", monospace',
  },
  
  fontSizes: {
    hero: 'clamp(60px, 15vw, 200px)',
    title: 'clamp(40px, 8vw, 100px)',
    subtitle: 'clamp(24px, 4vw, 48px)',
    body: '16px',
    small: '14px',
    label: '10px',
  },
  
  spacing: {
    section: '100px',
    element: '30px',
  },
  
  borders: {
    width: '3px',
    radius: '0',
    color: '#1A1A1A',
  },
  
  shadows: {
    card: '6px 6px 0 #1A1A1A',
    button: '4px 4px 0 #1A1A1A',
    image: '8px 8px 0 #1A1A1A',
  },
  
  effects: {
    grain: true,
    halftone: true,
  },
  
  typography: {
    headingWeight: '400',
    headingTransform: 'uppercase',
    headingTracking: '0.05em',
    labelTransform: 'uppercase',
    labelTracking: '0.2em',
  },
};

// ===========================================
// THEME GETTER
// ===========================================
export const themes = {
  'classical-editorial': classicalEditorial,
  'propaganda': propaganda,
};

export const getTheme = (name: ThemeName = CURRENT_THEME) => themes[name];
export const currentTheme = getTheme(CURRENT_THEME);

export default currentTheme;
