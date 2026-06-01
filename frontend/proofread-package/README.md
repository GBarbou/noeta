# ProofreadAI — Classical Editorial Theme Package

## Οδηγίες Εγκατάστασης

### 1. Εγκατάσταση Fonts

```bash
cd C:\Users\konst\Desktop\APP\frontend
npm install @fontsource/cormorant-garamond @fontsource/inter @fontsource/ibm-plex-mono
```

### 2. Αντιγραφή Αρχείων

Αντικατέστησε τα παρακάτω αρχεία:

| Αρχείο από πακέτο | Προορισμός |
|-------------------|------------|
| `themes/classical-editorial.css` | `frontend/themes/classical-editorial.css` |
| `app/globals.css` | `frontend/app/globals.css` |
| `app/layout.js` | `frontend/app/layout.js` |
| `app/page.js` | `frontend/app/page.js` |
| `app/editor/page.js` | `frontend/app/editor/page.js` |

### 3. Δημιουργία φακέλου themes (αν δεν υπάρχει)

```bash
mkdir themes
```

### 4. Επανεκκίνηση Dev Server

```bash
npm run dev
```

---

## Χαρακτηριστικά

### Classical Editorial Theme
- **Χρώματα:** Forest green (#2D4A3E), cream backgrounds, warm gold accents
- **Fonts:** Cormorant Garamond (headlines), Inter (body), IBM Plex Mono (code)
- **Style:** Κομψό, επαγγελματικό, για 40+ κοινό

### Dark Mode
- Πλήρης υποστήριξη dark mode
- Αυτόματη ανίχνευση system preference
- Toggle button σε header

### Editor Features
- Upload zone με drag & drop
- Progress indicator κατά την επεξεργασία
- Highlighted corrections στο κείμενο
- Corrections panel με accept/reject
- Download διορθωμένου εγγράφου

---

## Δομή Αρχείων

```
frontend/
├── themes/
│   └── classical-editorial.css   ← Theme CSS με όλες τις μεταβλητές
├── app/
│   ├── globals.css               ← Imports theme + global overrides
│   ├── layout.js                 ← Root layout με ThemeProvider
│   ├── page.js                   ← Landing page
│   └── editor/
│       └── page.js               ← Editor interface
```

---

## Σημειώσεις

- Το theme χρησιμοποιεί CSS Variables, οπότε αλλαγές χρωμάτων γίνονται εύκολα στο `classical-editorial.css`
- Για να αλλάξεις σε dark mode programmatically: `document.documentElement.setAttribute('data-theme', 'dark')`
- Τα fonts φορτώνονται τοπικά μέσω @fontsource για καλύτερη performance

---

## Backup του Propaganda Theme

Αν θες να κρατήσεις το propaganda theme για το μέλλον:

1. Αποθήκευσε το παλιό CSS σε `themes/propaganda.css`
2. Για να αλλάξεις theme, άλλαξε το import στο `globals.css`:
   ```css
   /* @import '../themes/classical-editorial.css'; */
   @import '../themes/propaganda.css';
   ```
