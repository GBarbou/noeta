# ProofreadAI Design System - Οδηγίες Εγκατάστασης

## Τι περιλαμβάνεται

```
📁 outputs/
├── DESIGN-SYSTEM.md          # Πλήρης φιλοσοφία & κανόνες
├── tailwind.config.js        # Tailwind configuration
├── globals.css               # Global styles + grain overlay
├── proofread-art-landing.html # Landing page (standalone HTML)
├── components/
│   ├── ui/
│   │   ├── Button.tsx
│   │   ├── Card.tsx
│   │   ├── Badge.tsx
│   │   ├── Input.tsx
│   │   ├── GrainOverlay.tsx
│   │   └── index.ts
│   └── layout/
│       └── Header.tsx
└── images/
    ├── background.png
    ├── hero-proofreader.png
    └── magnifying-glass.png
```

---

## Βήμα 1: Εγκατάσταση Fonts

```bash
npm install @fontsource/bebas-neue @fontsource/work-sans @fontsource/ibm-plex-mono
```

---

## Βήμα 2: Αντιγραφή αρχείων στο project σου

### Εικόνες
Αντίγραψε τα PNG στο `/public/images/`:
- `background.png` → `/public/images/background.png`
- `hero-proofreader.png` → `/public/images/hero-proofreader.png`  
- `magnifying-glass.png` → `/public/images/magnifying-glass.png`

### Tailwind Config
Αντικατάστησε ή merge το `tailwind.config.js` με αυτό που σου έδωσα.

### Global CSS
Αντικατάστησε το `app/globals.css` (ή `styles/globals.css`) με αυτό που σου έδωσα.

### Components
Αντίγραψε τον φάκελο `components/` στο project σου.

### DESIGN-SYSTEM.md
Βάλε το `DESIGN-SYSTEM.md` στο root του project σου (δίπλα στο `package.json`).
**Αυτό θα το διαβάζει το Claude Code!**

---

## Βήμα 3: Update του app/layout.tsx

```tsx
// app/layout.tsx
import './globals.css';
import '@fontsource/bebas-neue';
import '@fontsource/work-sans/400.css';
import '@fontsource/work-sans/500.css';
import '@fontsource/work-sans/600.css';
import '@fontsource/work-sans/700.css';
import '@fontsource/ibm-plex-mono/400.css';
import '@fontsource/ibm-plex-mono/600.css';

import { GrainOverlay } from '@/components/ui';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="el">
      <body className="bg-[#F5F0E1] text-[#1A1A1A] font-body">
        <GrainOverlay />
        {children}
      </body>
    </html>
  );
}
```

---

## Βήμα 4: Χρήση με Claude Code

Τώρα μπορείς να ανοίξεις το terminal στο project σου και να γράψεις:

```bash
cd C:\Users\konst\Desktop\APP
claude
```

Και μετά να πεις:

> "Διάβασε το DESIGN-SYSTEM.md και εφάρμοσε αυτή τη φιλοσοφία στο landing page"

ή

> "Αντικατάστησε το proofreading interface με το νέο design system"

ή

> "Πρόσθεσε τις εικόνες hero-proofreader.png και magnifying-glass.png στο landing page σε κατάλληλα σημεία"

---

## Χρήση Components

```tsx
// Παράδειγμα χρήσης
import { Button, Card, Badge, Input } from '@/components/ui';
import Header, { Subheader } from '@/components/layout/Header';

export default function Page() {
  return (
    <>
      <Header variant="app" documentCount={3} />
      <Subheader 
        filename="document.docx" 
        correctionsCount={4} 
        acceptedCount={1} 
      />
      
      <main className="p-8">
        <Card>
          <Badge variant="red">ΟΡΘΟΓΡΑΦΙΑ</Badge>
          <h3 className="font-display text-2xl mt-4">Διόρθωση #1</h3>
          <p className="text-sm text-gray-600 mt-2">Εταιρία → Εταιρεία</p>
          <div className="flex gap-3 mt-4">
            <Button variant="primary" size="sm">Αποδοχή</Button>
            <Button variant="outline" size="sm">Απόρριψη</Button>
          </div>
        </Card>
      </main>
    </>
  );
}
```

---

## Quick Reference - CSS Classes

### Buttons
- `.btn-primary` - Κόκκινο, κύρια action
- `.btn-secondary` - Cream background
- `.btn-dark` - Μαύρο με κόκκινη σκιά
- `.btn-outline` - Transparent με border

### Cards
- `.card` - Default card με σκιά
- `.card-dark` - Μαύρο background

### Typography
- `.font-display` - Bebas Neue (headlines)
- `.font-body` - Work Sans (body)
- `.font-mono` - IBM Plex Mono (code/document)
- `.headline-hero` - Giant headline
- `.headline-section` - Section title
- `.label` - Small uppercase label

### Backgrounds
- `.bg-halftone` - Halftone dot pattern
- `.section-dark` - Dark section
- `.section-red` - Red section

### Images
- `.img-frame` - Large bordered image
- `.img-frame-sm` - Smaller bordered image
- `.img-overlay-red` - Red multiply overlay

---

## Checklist

- [ ] Fonts εγκατεστημένα
- [ ] Tailwind config updated
- [ ] globals.css αντικαταστάθηκε
- [ ] Εικόνες στο `/public/images/`
- [ ] Components αντιγραμμένα
- [ ] DESIGN-SYSTEM.md στο root
- [ ] GrainOverlay στο layout

---

## Tips για Claude Code

1. **Πριν κάνεις αλλαγές**, πες του:
   > "Διάβασε πρώτα το DESIGN-SYSTEM.md"

2. **Για μεγάλες αλλαγές**, σπάσε το σε βήματα:
   > "Πρώτα άλλαξε μόνο το Header"
   > "Τώρα άλλαξε τα buttons"
   > "Τώρα πρόσθεσε τις εικόνες"

3. **Αν κάνει λάθος** (π.χ. rounded corners):
   > "Θυμήσου: ΠΟΤΕ rounded corners. Διάβασε ξανά το DESIGN-SYSTEM.md"

4. **Για να δεις τι έκανε**:
   > "Δείξε μου τι αλλαγές έκανες"
