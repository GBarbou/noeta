# ProofreadAI Theme System

Δύο themes διαθέσιμα:
- **Classical Editorial** (default) — Κομψό, για 40+ κοινό
- **Propaganda** — Bold vintage, eye-catching

---

## Πώς να αλλάξεις theme

### Μέθοδος 1: Αλλαγή CSS import (απλό)

Στο `app/globals.css`, άλλαξε το import:

```css
/* Για Classical Editorial */
@import './themes/classical-editorial.css';

/* Για Propaganda */
/* @import './themes/propaganda.css'; */
```

Απλά comment/uncomment τη γραμμή που θέλεις.

---

### Μέθοδος 2: Αλλαγή στο themes/index.ts

```typescript
// Άλλαξε αυτή τη γραμμή:
export const CURRENT_THEME: ThemeName = 'classical-editorial';

// σε:
export const CURRENT_THEME: ThemeName = 'propaganda';
```

---

### Μέθοδος 3: Με Claude Code

Πες στο Claude Code:

```
Άλλαξε το theme σε propaganda
```

ή

```
Άλλαξε το theme σε classical-editorial
```

---

## Fonts που χρειάζεται κάθε theme

### Classical Editorial
```bash
npm install @fontsource/cormorant-garamond @fontsource/inter @fontsource/ibm-plex-mono
```

```tsx
// app/layout.tsx
import '@fontsource/cormorant-garamond/400.css';
import '@fontsource/cormorant-garamond/400-italic.css';
import '@fontsource/cormorant-garamond/600.css';
import '@fontsource/inter/400.css';
import '@fontsource/inter/500.css';
import '@fontsource/ibm-plex-mono/400.css';
```

### Propaganda
```bash
npm install @fontsource/bebas-neue @fontsource/work-sans @fontsource/ibm-plex-mono
```

```tsx
// app/layout.tsx
import '@fontsource/bebas-neue';
import '@fontsource/work-sans/400.css';
import '@fontsource/work-sans/500.css';
import '@fontsource/work-sans/600.css';
import '@fontsource/ibm-plex-mono/400.css';
```

---

## Σύγκριση Themes

| Χαρακτηριστικό | Classical Editorial | Propaganda |
|----------------|---------------------|------------|
| **Target** | 40+, professionals | Νεότεροι, creatives |
| **Αίσθηση** | Κομψό, refined | Bold, attention-grabbing |
| **Headlines** | Serif, ελαφρά | Sans-serif, uppercase |
| **Shadows** | Subtle/none | Hard offset (stamp) |
| **Borders** | 1px, subtle | 3px, black |
| **Colors** | Forest green, gold | Red, black, cream |
| **Grain** | Όχι | Ναι |
| **Corners** | Square | Square |

---

## Δομή αρχείων

```
frontend/
├── themes/
│   ├── index.ts                    # Theme config & switcher
│   ├── classical-editorial.css     # Classical theme styles
│   └── propaganda.css              # Propaganda theme styles
├── app/
│   ├── globals.css                 # Import θα theme εδώ
│   └── layout.tsx                  # Font imports εδώ
└── THEME-GUIDE.md                  # Αυτό το αρχείο
```

---

## Quick Switch Checklist

Όταν αλλάζεις theme:

- [ ] Άλλαξε το CSS import στο globals.css
- [ ] Άλλαξε τα font imports στο layout.tsx
- [ ] Εγκατάστησε τα σωστά fonts (npm install)
- [ ] Restart το dev server (npm run dev)

---

## Παραδείγματα component styling

Τα components χρησιμοποιούν CSS variables, οπότε αλλάζουν αυτόματα:

```tsx
// Αυτό δουλεύει και στα 2 themes
<button className="btn btn-primary">
  Click me
</button>

<div className="card">
  Content
</div>

<span className="badge">Label</span>
```

---

## Αν θέλεις να κρατήσεις διαφορετικό theme για landing vs app

```css
/* app/globals.css */

/* Base theme για όλο το app */
@import './themes/classical-editorial.css';

/* Override για specific routes */
.propaganda-mode {
  /* Propaganda CSS variables */
  --color-primary: #D64933;
  --font-display: 'Bebas Neue', sans-serif;
  /* κλπ */
}
```

Και στο component:
```tsx
<div className={isEditorPage ? 'propaganda-mode' : ''}>
  ...
</div>
```
