# PROOFREAD AI — DESIGN SYSTEM INTEGRATION GUIDE
## Instructions for Claude Code

---

## OBJECTIVE

Εφαρμογή του νέου "Classical Editorial" design system στο υπάρχον Next.js frontend, διατηρώντας πλήρως τη λειτουργικότητα (API calls, state management, corrections logic).

---

## FILES TO CREATE/MODIFY

### 1. COPY THESE FILES TO YOUR PROJECT

```
styles/
  └── theme.ts          # Design tokens (χρώματα, fonts, spacing)
  └── globals.css       # CSS variables, base styles, utilities
```

Τοποθέτησέ τα στο project και κάνε import το globals.css στο `app/layout.tsx`:

```tsx
import '../styles/globals.css'
```

---

### 2. CREATE UI COMPONENTS

Create these reusable components in `components/ui/`:

#### Button.tsx
```tsx
interface ButtonProps {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  children: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  className?: string;
}
```

Styles:
- primary: `bg-[var(--primary)] text-white`
- secondary: `bg-transparent border border-[var(--border)] text-[var(--text)]`
- ghost: `bg-transparent text-[var(--text-secondary)]`
- danger: `bg-transparent border border-[var(--error-border)] text-[var(--error)]`

#### Badge.tsx
```tsx
interface BadgeProps {
  variant?: 'default' | 'primary' | 'success' | 'warning' | 'error' | 'info';
  children: React.ReactNode;
}
```

#### Toggle.tsx
```tsx
interface ToggleProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
}
```

#### Card.tsx, Select.tsx, etc.

---

### 3. MODIFY app/editor/page.tsx

#### Step-by-Step:

**A. Add theme state:**
```tsx
const [theme, setTheme] = useState<'light' | 'dark'>('light');

useEffect(() => {
  document.documentElement.setAttribute('data-theme', theme);
}, [theme]);
```

**B. Replace inline colors with CSS variables:**
```tsx
// BEFORE
style={{ backgroundColor: '#ffffff', color: '#1a1918' }}

// AFTER
style={{ backgroundColor: 'var(--surface)', color: 'var(--text)' }}
```

**C. Apply new layout structure:**
```tsx
<div className="min-h-screen bg-[var(--bg)]">
  <Header /> {/* height: 56px, sticky */}
  <main className="grid grid-cols-[300px_1fr_360px]">
    <Sidebar />      {/* Left: Settings, Modules */}
    <DocumentView /> {/* Center: Document canvas */}
    <CorrectionsPanel /> {/* Right: Corrections list */}
  </main>
</div>
```

**D. Keep all existing logic:**
- API calls to localhost:8000
- Session management
- Correction handling (accept/reject)
- File upload/download
- Module toggles
- Model selection

---

## COLOR MAPPING REFERENCE

| Old Value | New CSS Variable |
|-----------|------------------|
| `#ffffff` | `var(--surface)` |
| `#f8f9fa` | `var(--bg)` |
| `#1a1918` | `var(--text)` |
| `#6c757d` | `var(--text-secondary)` |
| `#adb5bd` | `var(--text-muted)` |
| Green accent | `var(--primary)` |
| Red/error | `var(--error)` |
| Border gray | `var(--border)` |

---

## COMPONENT STYLING GUIDELINES

### Header
- Height: 56px
- Background: `var(--bg-raised)`
- Border bottom: `1px solid var(--border)`
- Logo: Forest green icon with `var(--primary-muted)` background
- Stats badges in center
- Actions (Undo, Redo, Accept All, Export, Theme toggle) on right

### Left Sidebar (300px)
- Background: `var(--bg-raised)`
- Border right: `1px solid var(--border)`
- Sections:
  1. Model selector (dropdown)
  2. Divider with "MODULES" label
  3. Core module card (always active, gradient bg)
  4. Optional modules (Translation, Fact Check, Style Check)
  5. Context textarea

### Document Canvas (flex: 1)
- Background: `var(--surface)`
- Header with chapter title, metadata
- Content area: max-width 720px, centered
- Font: Georgia, 17px, line-height 1.85
- Paragraph indent: 2em (except first)
- Corrections highlighted inline

### Corrections Panel (360px)
- Background: `var(--bg-raised)`
- Border left: `1px solid var(--border)`
- Header with title + filter pills
- Scrollable list of correction cards
- Each card:
  - Module badge (color-coded)
  - Status badge
  - Original → Suggested text
  - Reason
  - Accept/Reject buttons (if pending)
  - Confidence + scope tags

---

## MODULE COLORS

```tsx
const moduleStyles = {
  core:        { color: 'var(--primary)', bg: 'var(--primary-muted)', icon: '✦' },
  style:       { color: 'var(--accent)',  bg: 'var(--accent-muted)',  icon: '◈' },
  fact_check:  { color: 'var(--info)',    bg: 'var(--info-muted)',    icon: '◉' },
  translation: { color: '#9a7bbd',        bg: 'rgba(154,123,189,0.1)', icon: '❖' },
};
```

---

## DARK MODE

Toggle between themes:
```tsx
const toggleTheme = () => {
  setTheme(t => t === 'light' ? 'dark' : 'light');
};
```

The CSS variables automatically switch when `data-theme="dark"` is set on `<html>`.

---

## WORKFLOW

1. **Start with theme.ts + globals.css** — copy to project
2. **Create basic UI components** — Button, Badge, Toggle
3. **Update layout.tsx** — import globals.css
4. **Refactor Header** — new styling, keep functionality
5. **Refactor Sidebar** — new module cards, keep state
6. **Refactor Document** — new typography, keep highlighting
7. **Refactor Corrections** — new cards, keep accept/reject
8. **Test everything** — upload, analyze, accept/reject, export
9. **Add dark mode toggle** — should work automatically

---

## IMPORTANT NOTES

- **DO NOT change API logic** — keep all fetch calls exactly as they are
- **DO NOT change state structure** — corrections, modules, session, etc.
- **DO change only styling** — colors, fonts, spacing, layout
- **USE CSS variables** — not hardcoded colors
- **TEST dark mode** — toggle should switch all colors

---

## EXAMPLE: Refactoring a Correction Card

**Before:**
```tsx
<div style={{ 
  backgroundColor: '#fff', 
  border: '1px solid #ddd',
  padding: '16px',
  borderRadius: '8px'
}}>
  <span style={{ color: 'green' }}>{module}</span>
  <p>{reason}</p>
  <button style={{ backgroundColor: 'green', color: 'white' }}>
    Accept
  </button>
</div>
```

**After:**
```tsx
<div style={{ 
  backgroundColor: 'var(--surface)', 
  border: `1px solid ${isActive ? 'var(--primary)' : 'var(--border)'}`,
  padding: '16px',
  borderRadius: '10px',
  transition: 'all 0.2s ease',
  boxShadow: isActive ? '0 0 0 3px var(--primary-muted)' : 'none',
}}>
  <Badge variant={moduleStyles[module].variant}>
    {moduleStyles[module].icon} {moduleStyles[module].label}
  </Badge>
  <p style={{ color: 'var(--text-secondary)' }}>{reason}</p>
  <Button variant="primary" onClick={() => handleAccept(id)}>
    Accept
  </Button>
</div>
```

---

## CHECKLIST

- [ ] theme.ts copied
- [ ] globals.css copied and imported
- [ ] UI components created (Button, Badge, Toggle)
- [ ] Header refactored
- [ ] Sidebar refactored
- [ ] Document canvas refactored  
- [ ] Corrections panel refactored
- [ ] Dark mode working
- [ ] All API calls working
- [ ] Upload/Download working
- [ ] Accept/Reject working
- [ ] Module toggles working

---

Good luck! 🎉
