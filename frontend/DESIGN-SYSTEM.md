# PROOFREAD AI — Design System & Philosophy

## Φιλοσοφία

Αυτό δεν είναι ένα τυπικό SaaS. Είναι **ένα καλλιτεχνικό εργαλείο με αυθεντικότητα**.

Η αισθητική είναι: **Bold vintage propaganda / editorial poster**
- Mid-century propaganda posters (Soviet, wartime, Cold War)
- Vintage comic και pop-art printing (halftone dots, thick ink lines)
- Screen-printed posters και risograph aesthetics
- Modern editorial illustrations

**Κεντρικό σλόγκαν:** "ΤΑ ΛΑΘΗ ΕΙΝΑΙ Ο ΕΧΘΡΟΣ. Η ΑΚΡΙΒΕΙΑ ΕΙΝΑΙ Η ΝΙΚΗ."

---

## Color Palette

```css
:root {
  --red: #D64933;        /* Primary - CTAs, emphasis, errors */
  --black: #1A1A1A;      /* Text, borders, dark backgrounds */
  --cream: #F5F0E1;      /* Main background, light text */
  --white: #FFFEF9;      /* Cards, document areas */
  --gray: #4A4A48;       /* Secondary text */
  --green: #4A8F4A;      /* Success, accepted corrections */
}
```

**Κανόνες:**
- ΠΟΤΕ gradients (εκτός από overlays σε εικόνες)
- ΠΟΤΕ neon χρώματα
- ΠΟΤΕ πολύχρωμες παλέτες
- Flat colors μόνο
- Contrast κάνει τη δουλειά, όχι ποικιλία

---

## Typography

### Fonts
```css
/* Headlines - Bold, condensed, poster-style */
font-family: 'Bebas Neue', sans-serif;

/* Body / UI text - Clean, utilitarian */
font-family: 'Work Sans', sans-serif;

/* Code / Document text - Typewriter feel */
font-family: 'IBM Plex Mono', monospace;
```

### Installation (Next.js)
```bash
npm install @fontsource/bebas-neue @fontsource/work-sans @fontsource/ibm-plex-mono
```

```js
// app/layout.tsx or _app.tsx
import '@fontsource/bebas-neue';
import '@fontsource/work-sans/400.css';
import '@fontsource/work-sans/500.css';
import '@fontsource/work-sans/600.css';
import '@fontsource/work-sans/700.css';
import '@fontsource/ibm-plex-mono/400.css';
import '@fontsource/ibm-plex-mono/600.css';
```

### Usage Rules
- Headlines: ΠΑΝΤΑ uppercase, letter-spacing 0.05-0.1em
- Body: Sentence case, line-height 1.7+
- Labels: UPPERCASE, letter-spacing 0.15-0.2em, font-size 10-12px
- ΠΟΤΕ script/cursive fonts
- ΠΟΤΕ thin weights

---

## Textures & Effects

### Film Grain Overlay
Προσθέτουμε σε όλο το app ένα subtle grain:

```css
body::before {
  content: '';
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  z-index: 10000;
  opacity: 0.3;
  background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%' height='100%' filter='url(%23noise)'/%3E%3C/svg%3E");
}
```

### Halftone Pattern (για backgrounds)
```css
.halftone-bg {
  background-image: url("data:image/svg+xml,%3Csvg width='20' height='20' xmlns='http://www.w3.org/2000/svg'%3E%3Ccircle cx='2' cy='2' r='1' fill='%231A1A1A' fill-opacity='0.08'/%3E%3Ccircle cx='12' cy='12' r='1' fill='%231A1A1A' fill-opacity='0.08'/%3E%3C/svg%3E");
}
```

### Paper Texture
Χρησιμοποιούμε το `background.png` ως texture overlay με:
- `mix-blend-mode: multiply` ή `soft-light`
- `opacity: 0.3-0.5`

---

## UI Components

### Buttons

**Primary (Red)**
```css
.btn-primary {
  background-color: var(--red);
  color: var(--cream);
  border: 3px solid var(--black);
  padding: 12px 32px;
  font-family: 'Bebas Neue', sans-serif;
  font-size: 18px;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  box-shadow: 4px 4px 0 var(--black);
  transition: transform 0.15s, box-shadow 0.15s;
  cursor: pointer;
}

.btn-primary:hover {
  transform: translate(2px, 2px);
  box-shadow: 2px 2px 0 var(--black);
}
```

**Secondary (Outline)**
```css
.btn-secondary {
  background-color: transparent;
  color: var(--black);
  border: 3px solid var(--black);
  /* ... same padding, font, etc */
  box-shadow: none;
}

.btn-secondary:hover {
  background-color: var(--black);
  color: var(--cream);
}
```

**ΠΟΤΕ:**
- Rounded corners (border-radius: 0 πάντα)
- Soft shadows
- Gradient backgrounds
- Thin borders

### Cards

```css
.card {
  background-color: var(--white);
  border: 3px solid var(--black);
  box-shadow: 6px 6px 0 var(--black);
  padding: 24px;
}

.card:hover {
  transform: translate(2px, -2px);
  box-shadow: 8px 8px 0 var(--black);
}
```

### Input Fields

```css
.input {
  background-color: var(--cream);
  border: 3px solid var(--black);
  padding: 12px 16px;
  font-family: 'IBM Plex Mono', monospace;
  font-size: 14px;
}

.input:focus {
  outline: none;
  box-shadow: 4px 4px 0 var(--red);
}
```

### Badges / Labels

```css
.badge {
  background-color: var(--black);
  color: var(--cream);
  padding: 4px 12px;
  font-size: 10px;
  letter-spacing: 0.15em;
  text-transform: uppercase;
  font-weight: 600;
}

.badge-error {
  background-color: var(--red);
}

.badge-success {
  background-color: var(--green);
}
```

---

## Layout Principles

### Grid Breaking
- ΜΗΝ χρησιμοποιείς τέλειο grid παντού
- Overlapping elements είναι καλό
- Asymmetry > symmetry
- Negative space είναι σημαντικό

### Image Treatment
- Εικόνες ΜΕΓΑΛΕΣ, να κυριαρχούν
- Border: 3-4px solid black
- Box-shadow: 8-12px offset
- Μπορεί να έχουν color overlay (red multiply)
- Grayscale ή desaturated είναι OK

### Typography Layout
- Headlines μπορούν να είναι rotated (-3° έως 3°)
- Overlapping text πάνω σε εικόνες είναι OK
- Big numbers ως decorative elements (opacity 0.1-0.3)
- Text shadows: 2-4px offset, solid color (όχι blur)

---

## Page Structure

### Landing Page
1. **Hero** - Full-screen image με giant typography
2. **Manifesto** - Asymmetric 2-column, image + text
3. **Typography break** - Scrolling text marquee
4. **Gallery/Features** - Broken grid με floating cards
5. **Process** - 4 columns ή editorial spread
6. **CTA** - Poster-style με slogan
7. **Footer** - Minimal

### App Interface (Proofreading)
1. **Header** - Red bar με logo, minimal nav
2. **Subheader** - Black bar με document info
3. **Main area** - Document preview (paper-like) + Corrections panel
4. **Decorative** - Corner stamps, small illustrations

---

## Images

Υπάρχουν 3 εικόνες:

1. **hero-proofreader.png** - Άνδρας που διορθώνει έγγραφο
   - Χρήση: Hero section, About section
   
2. **magnifying-glass.png** - Μεγεθυντικός φακός πάνω σε έγγραφο
   - Χρήση: How it works, Features, Loading states

3. **background.png** - Halftone texture
   - Χρήση: Section backgrounds, overlays

### Image Placement Rules
- Minimum width: 50vw για hero images
- Πάντα με border + shadow
- Μπορούν να "σπάνε" το container τους
- Captions/labels: μαύρο background, cream text, positioned absolute

---

## Animation

### Allowed
- Transform transitions (translate, scale, rotate)
- Opacity transitions
- Marquee/scroll animations
- Hover lift effects

### NOT Allowed
- Bouncy animations
- Elastic easing
- Particle effects
- 3D transforms
- Glassmorphism blur

### Timing
```css
transition: all 0.15s ease;
/* ή */
transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
```

---

## Tailwind Config

```js
// tailwind.config.js
module.exports = {
  theme: {
    extend: {
      colors: {
        red: '#D64933',
        black: '#1A1A1A',
        cream: '#F5F0E1',
        white: '#FFFEF9',
        gray: '#4A4A48',
        green: '#4A8F4A',
      },
      fontFamily: {
        display: ['Bebas Neue', 'sans-serif'],
        body: ['Work Sans', 'sans-serif'],
        mono: ['IBM Plex Mono', 'monospace'],
      },
      boxShadow: {
        'stamp': '4px 4px 0 #1A1A1A',
        'stamp-lg': '6px 6px 0 #1A1A1A',
        'stamp-xl': '8px 8px 0 #1A1A1A',
        'stamp-red': '4px 4px 0 #D64933',
      },
      borderWidth: {
        '3': '3px',
      },
    },
  },
}
```

---

## Voice & Tone

### Headlines
- Assertive, commanding
- Short, punchy
- Often imperative mood
- Examples:
  - "ΛΑΘΗ ΤΕΛΟΣ."
  - "ΤΑ ΛΑΘΗ ΕΙΝΑΙ Ο ΕΧΘΡΟΣ."
  - "ΑΝΕΒΑΣΕ. ΔΙΟΡΘΩΣΕ. ΝΙΚΑ."

### Body Copy
- Direct, no fluff
- Slightly ironic undertone is OK
- Professional but not corporate
- Examples:
  - "Κάθε τυπογραφικό σφάλμα είναι μια ρωγμή στην αξιοπιστία σου."
  - "Εμείς τα βλέπουμε όλα. Εσύ διορθώνεις."

### Microcopy
- Functional but with character
- Examples:
  - Button: "ΞΕΚΙΝΑ ΔΩΡΕΑΝ →" (όχι "Get Started")
  - Loading: "ΑΝΑΛΥΣΗ ΣΕ ΕΞΕΛΙΞΗ..." (όχι "Please wait")
  - Success: "ΔΙΟΡΘΩΣΗ ΟΛΟΚΛΗΡΩΘΗΚΕ." (όχι "Done!")

---

## File Organization

```
/public
  /images
    hero-proofreader.png
    magnifying-glass.png
    background.png
    logo.svg
    
/components
  /ui
    Button.tsx
    Card.tsx
    Input.tsx
    Badge.tsx
  /layout
    Header.tsx
    Footer.tsx
    GrainOverlay.tsx
  /landing
    Hero.tsx
    Manifesto.tsx
    TypographyBreak.tsx
    Gallery.tsx
    Process.tsx
    CTA.tsx
  /app
    DocumentPreview.tsx
    CorrectionPanel.tsx
    CorrectionCard.tsx
```

---

## Quick Reference

| Element | Border | Shadow | Border-radius |
|---------|--------|--------|---------------|
| Button | 3px black | 4px 4px 0 black | 0 |
| Card | 3px black | 6px 6px 0 black | 0 |
| Input | 3px black | none (4px red on focus) | 0 |
| Image | 3-4px black | 8-12px offset | 0 |

| Text Type | Font | Size | Transform |
|-----------|------|------|-----------|
| Hero | Bebas Neue | 80-280px | uppercase |
| Section Title | Bebas Neue | 48-120px | uppercase |
| Body | Work Sans | 14-16px | none |
| Label | Work Sans | 10-12px | uppercase |
| Document | IBM Plex Mono | 14px | none |

---

## Claude Code Instructions

Όταν δουλεύεις σε αυτό το project:

1. **ΠΑΝΤΑ** διάβαζε αυτό το αρχείο πριν κάνεις UI αλλαγές
2. **ΠΟΤΕ** μη χρησιμοποιήσεις rounded corners
3. **ΠΟΤΕ** μη χρησιμοποιήσεις gradients σε buttons/cards
4. **ΠΑΝΤΑ** χρησιμοποίησε τα fonts που ορίζονται εδώ
5. **ΠΑΝΤΑ** χρησιμοποίησε box-shadow για depth, όχι blur shadows
6. Οι εικόνες πρέπει να είναι ΜΕΓΑΛΕΣ και να κυριαρχούν
7. Το aesthetic είναι "vintage propaganda poster", όχι "modern SaaS"
8. Embrace imperfection: grain, texture, slight rotations
