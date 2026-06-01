// ============================================
// PROOFREAD AI — DESIGN SYSTEM
// Classical Editorial Theme
// ============================================

export const theme = {
  // ==========================================
  // COLORS
  // ==========================================
  colors: {
    light: {
      // Backgrounds
      bg: '#faf9f7',
      bgAlt: '#f5f4f1',
      bgRaised: '#ffffff',
      bgHover: '#f0eee9',
      
      // Surfaces
      surface: '#ffffff',
      surfaceHover: '#faf9f7',
      
      // Text
      text: '#1a1918',
      textSecondary: '#5c5a56',
      textMuted: '#9c9a95',
      
      // Primary - Forest Green
      primary: '#2d6a4f',
      primaryHover: '#245a42',
      primaryMuted: 'rgba(45, 106, 79, 0.1)',
      primaryBorder: 'rgba(45, 106, 79, 0.25)',
      
      // Accent - Warm Gold
      accent: '#8b7340',
      accentMuted: 'rgba(139, 115, 64, 0.1)',
      
      // Semantic
      success: '#2d6a4f',
      successMuted: 'rgba(45, 106, 79, 0.1)',
      
      error: '#a04030',
      errorMuted: 'rgba(160, 64, 48, 0.1)',
      errorBorder: 'rgba(160, 64, 48, 0.25)',
      
      warning: '#8b7340',
      warningMuted: 'rgba(139, 115, 64, 0.1)',
      
      info: '#406080',
      infoMuted: 'rgba(64, 96, 128, 0.1)',
      
      // Borders
      border: '#e5e3de',
      borderLight: '#f0eee9',
      borderHover: '#d5d3ce',
      
      // Effects
      shadow: 'rgba(0, 0, 0, 0.08)',
      glow: 'rgba(45, 106, 79, 0.15)',
    },
    
    dark: {
      // Backgrounds
      bg: '#0f0f0e',
      bgAlt: '#161614',
      bgRaised: '#1a1a18',
      bgHover: '#222220',
      
      // Surfaces
      surface: '#1e1e1c',
      surfaceHover: '#262624',
      
      // Text
      text: '#f5f4f1',
      textSecondary: '#a8a6a0',
      textMuted: '#6b6965',
      
      // Primary - Forest Green (lighter for dark mode)
      primary: '#5d9b80',
      primaryHover: '#6dab90',
      primaryMuted: 'rgba(93, 155, 128, 0.15)',
      primaryBorder: 'rgba(93, 155, 128, 0.3)',
      
      // Accent - Warm Gold
      accent: '#c9a355',
      accentMuted: 'rgba(201, 163, 85, 0.15)',
      
      // Semantic
      success: '#5d9b80',
      successMuted: 'rgba(93, 155, 128, 0.15)',
      
      error: '#cf6b5f',
      errorMuted: 'rgba(207, 107, 95, 0.15)',
      errorBorder: 'rgba(207, 107, 95, 0.3)',
      
      warning: '#c9a355',
      warningMuted: 'rgba(201, 163, 85, 0.15)',
      
      info: '#6b8fad',
      infoMuted: 'rgba(107, 143, 173, 0.15)',
      
      // Borders
      border: '#2a2a28',
      borderLight: '#222220',
      borderHover: '#3a3a38',
      
      // Effects
      shadow: 'rgba(0, 0, 0, 0.4)',
      glow: 'rgba(93, 155, 128, 0.2)',
    },
  },

  // ==========================================
  // TYPOGRAPHY
  // ==========================================
  fonts: {
    display: "'Georgia', 'Times New Roman', serif",
    body: "'Georgia', 'Times New Roman', serif",
    ui: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
    mono: "'JetBrains Mono', 'SF Mono', 'Consolas', monospace",
  },
  
  fontSizes: {
    xs: '10px',
    sm: '12px',
    base: '14px',
    md: '15px',
    lg: '17px',
    xl: '20px',
    '2xl': '24px',
    '3xl': '32px',
    '4xl': '40px',
  },
  
  fontWeights: {
    normal: 400,
    medium: 500,
    semibold: 600,
    bold: 700,
  },
  
  lineHeights: {
    tight: 1.2,
    normal: 1.5,
    relaxed: 1.65,
    loose: 1.85,
  },
  
  letterSpacing: {
    tight: '-0.02em',
    normal: '0',
    wide: '0.02em',
    wider: '0.05em',
    widest: '0.1em',
  },

  // ==========================================
  // SPACING
  // ==========================================
  spacing: {
    0: '0',
    1: '4px',
    2: '8px',
    3: '12px',
    4: '16px',
    5: '20px',
    6: '24px',
    8: '32px',
    10: '40px',
    12: '48px',
    16: '64px',
    20: '80px',
  },

  // ==========================================
  // BORDERS
  // ==========================================
  borderRadius: {
    none: '0',
    sm: '4px',
    md: '6px',
    lg: '8px',
    xl: '10px',
    '2xl': '12px',
    '3xl': '14px',
    full: '9999px',
  },

  // ==========================================
  // SHADOWS
  // ==========================================
  shadows: {
    sm: '0 1px 2px var(--shadow)',
    md: '0 2px 8px var(--shadow)',
    lg: '0 4px 16px var(--shadow)',
    xl: '0 8px 32px var(--shadow)',
    glow: '0 4px 14px var(--glow)',
    ring: '0 0 0 3px var(--primary-muted)',
  },

  // ==========================================
  // TRANSITIONS
  // ==========================================
  transitions: {
    fast: '0.15s ease',
    normal: '0.2s ease',
    slow: '0.3s ease',
    smooth: '0.25s cubic-bezier(0.4, 0, 0.2, 1)',
  },

  // ==========================================
  // Z-INDEX
  // ==========================================
  zIndex: {
    base: 0,
    dropdown: 10,
    sticky: 20,
    modal: 50,
    tooltip: 100,
  },

  // ==========================================
  // LAYOUT
  // ==========================================
  layout: {
    headerHeight: '56px',
    sidebarWidth: '300px',
    correctionsPanelWidth: '360px',
    maxContentWidth: '720px',
  },
} as const;

// ==========================================
// TYPE EXPORTS
// ==========================================
export type Theme = typeof theme;
export type ThemeColors = keyof typeof theme.colors.light;
export type ThemeMode = 'light' | 'dark';

// ==========================================
// HELPER: Get CSS Variables
// ==========================================
export function getThemeVars(mode: ThemeMode): Record<string, string> {
  const colors = theme.colors[mode];
  return {
    '--bg': colors.bg,
    '--bg-alt': colors.bgAlt,
    '--bg-raised': colors.bgRaised,
    '--bg-hover': colors.bgHover,
    '--surface': colors.surface,
    '--surface-hover': colors.surfaceHover,
    '--text': colors.text,
    '--text-secondary': colors.textSecondary,
    '--text-muted': colors.textMuted,
    '--primary': colors.primary,
    '--primary-hover': colors.primaryHover,
    '--primary-muted': colors.primaryMuted,
    '--primary-border': colors.primaryBorder,
    '--accent': colors.accent,
    '--accent-muted': colors.accentMuted,
    '--success': colors.success,
    '--success-muted': colors.successMuted,
    '--error': colors.error,
    '--error-muted': colors.errorMuted,
    '--error-border': colors.errorBorder,
    '--warning': colors.warning,
    '--warning-muted': colors.warningMuted,
    '--info': colors.info,
    '--info-muted': colors.infoMuted,
    '--border': colors.border,
    '--border-light': colors.borderLight,
    '--border-hover': colors.borderHover,
    '--shadow': colors.shadow,
    '--glow': colors.glow,
  };
}

// ==========================================
// MODULE STYLES
// ==========================================
export const moduleStyles = {
  core: {
    color: 'var(--primary)',
    bg: 'var(--primary-muted)',
    label: 'Ορθογραφία',
    icon: '✦',
  },
  style: {
    color: 'var(--accent)',
    bg: 'var(--accent-muted)',
    label: 'Ύφος',
    icon: '◈',
  },
  fact_check: {
    color: 'var(--info)',
    bg: 'var(--info-muted)',
    label: 'Fact Check',
    icon: '◉',
  },
  translation: {
    color: '#9a7bbd',
    bg: 'rgba(154, 123, 189, 0.1)',
    label: 'Μετάφραση',
    icon: '❖',
  },
} as const;

// ==========================================
// STYLE TYPES
// ==========================================
export const styleTypes = [
  { id: 'academic', label: 'Ακαδημαϊκό' },
  { id: 'legal', label: 'Νομικό' },
  { id: 'journalistic', label: 'Δημοσιογραφικό' },
  { id: 'literary', label: 'Λογοτεχνικό' },
  { id: 'business', label: 'Επαγγελματικό' },
  { id: 'technical', label: 'Τεχνικό' },
  { id: 'religious', label: 'Θεολογικό' },
  { id: 'history', label: 'Ιστορικό' },
] as const;

// ==========================================
// AI MODELS
// ==========================================
export const aiModels = [
  { id: 'claude-sonnet', name: 'Claude Sonnet 4', provider: 'Anthropic', recommended: true },
  { id: 'claude-opus', name: 'Claude Opus 4', provider: 'Anthropic', recommended: false },
  { id: 'gpt-4o', name: 'GPT-4o', provider: 'OpenAI', recommended: false },
  { id: 'gemini-2-pro', name: 'Gemini 2.0 Pro', provider: 'Google', recommended: false },
] as const;
