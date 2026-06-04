# Material Dark UI Redesign — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the neon/cyberpunk aesthetic with a Material Design 3 dark theme and swap all emoji DB-target icons for Lucide React icons.

**Architecture:** All color changes live in `tailwind.config.ts` — every component uses Tailwind utility classes so a token value change propagates automatically with zero component edits. Emoji icons are replaced via a new `DbIcon` utility component and targeted edits to the three render sites. The `globals.css` file removes neon utility classes that components reference directly.

**Tech Stack:** React 19, TypeScript, Tailwind CSS v3.4, Lucide React

**Working directory for all commands:** `E:\Projects Version 2\schema-generator\dbforge-ai-studio\frontend`

---

## File Map

| File | Action | Responsibility |
|------|--------|----------------|
| `tailwind.config.ts` | Modify | Color token values — the single source of truth for the whole palette |
| `src/styles/globals.css` | Modify | Remove neon utility classes; update selection/focus/scrollbar |
| `src/lib/constants.ts` | Modify | Replace `icon: emoji` with `iconName: string` on `DB_TARGETS` |
| `src/lib/utils/dbIcons.tsx` | **Create** | `DbIcon` component — maps icon name string → Lucide component |
| `src/features/schema-designer/SchemaPromptInput.tsx` | Modify | Render `DbIcon` instead of emoji span |
| `src/components/layout/Sidebar.tsx` | Modify | Render `DbIcon` instead of emoji span |
| `src/features/connections/DatabaseConnectionPanel.tsx` | Modify | Replace `DRIVER_META` emoji strings; render `DbIcon` at two sites |
| `src/pages/LandingPage.tsx` | Modify | Remove `gradient-text-cyan` class and `hover:shadow-cyan` class |

---

## Task 1: Update Tailwind Color Palette

**Files:**
- Modify: `tailwind.config.ts`

- [ ] **Step 1: Replace the full `tailwind.config.ts`**

Open `tailwind.config.ts` and replace the entire file content with:

```typescript
import type { Config } from 'tailwindcss'

const config: Config = {
  darkMode: ['class'],
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // ── Surfaces (Material dark neutral scale) ───────────────────────────
        'bg-base':     '#1a1a1a',
        'bg-surface':  '#222222',
        'bg-elevated': '#2a2a2a',
        'bg-overlay':  '#313131',
        'bg-muted':    '#383838',
        // ── Primary accent (muted purple) ────────────────────────────────────
        cyan: {
          DEFAULT: '#9B8AF7',
          dim:     'rgba(155,138,247,0.10)',
          glow:    'rgba(155,138,247,0.12)',
        },
        // ── Secondary accent (muted purple, darker) ──────────────────────────
        violet: {
          DEFAULT: '#7965D4',
          dim:     'rgba(121,101,212,0.10)',
          glow:    'rgba(121,101,212,0.12)',
        },
        // ── Teal accent (FK columns, success states) ─────────────────────────
        emerald: {
          DEFAULT: '#26D9C7',
          dim:     'rgba(38,217,199,0.10)',
        },
        // ── Text hierarchy (neutral, no blue tint) ───────────────────────────
        'text-primary':   '#E6E1E5',
        'text-secondary': '#ABA7AF',
        'text-tertiary':  '#5C5760',
        'text-code':      '#C5B8FF',
        // ── Semantic ─────────────────────────────────────────────────────────
        success: '#26D9C7',
        error:   '#F87171',
        warning: '#F59E0B',
        info:    '#60A5FA',
        // ── Borders ──────────────────────────────────────────────────────────
        border: {
          subtle:  'rgba(255,255,255,0.05)',
          default: 'rgba(255,255,255,0.09)',
          strong:  'rgba(255,255,255,0.15)',
        },
      },
      fontFamily: {
        ui:      ['"DM Sans"', 'system-ui', 'sans-serif'],
        mono:    ['"JetBrains Mono"', '"Fira Code"', 'ui-monospace', 'monospace'],
        display: ['"Space Grotesk"', '"DM Sans"', 'sans-serif'],
      },
      fontSize: {
        xs:    ['11px', { lineHeight: '1.4' }],
        sm:    ['13px', { lineHeight: '1.5' }],
        base:  ['14px', { lineHeight: '1.6' }],
        md:    ['15px', { lineHeight: '1.6' }],
        lg:    ['18px', { lineHeight: '1.4' }],
        xl:    ['22px', { lineHeight: '1.3' }],
        '2xl': ['28px', { lineHeight: '1.2' }],
        '3xl': ['36px', { lineHeight: '1.1' }],
      },
      borderRadius: {
        sm:   '4px',
        md:   '8px',
        lg:   '12px',
        xl:   '16px',
        pill: '100px',
      },
      boxShadow: {
        sm: '0 1px 2px rgba(0,0,0,0.5)',
        md: '0 4px 12px rgba(0,0,0,0.6)',
        lg: '0 8px 24px rgba(0,0,0,0.7)',
      },
      animation: {
        'fade-in':    'fadeIn 0.25s ease forwards',
        'fade-up':    'fadeUp 0.35s ease forwards',
        'slide-in-r': 'slideInRight 0.3s ease forwards',
        'slide-in-l': 'slideInLeft 0.3s ease forwards',
        'shimmer':    'shimmer 1.8s linear infinite',
        'spin-slow':  'spin 3s linear infinite',
        'slide-up':   'slideUp 0.3s ease forwards',
      },
      keyframes: {
        fadeIn:       { from: { opacity: '0' }, to: { opacity: '1' } },
        fadeUp:       { from: { opacity: '0', transform: 'translateY(12px)' }, to: { opacity: '1', transform: 'translateY(0)' } },
        slideInRight: { from: { transform: 'translateX(24px)', opacity: '0' }, to: { transform: 'translateX(0)', opacity: '1' } },
        slideInLeft:  { from: { transform: 'translateX(-24px)', opacity: '0' }, to: { transform: 'translateX(0)', opacity: '1' } },
        shimmer:      { '0%': { backgroundPosition: '-200% 0' }, '100%': { backgroundPosition: '200% 0' } },
        slideUp:      { from: { opacity: '0', transform: 'translateY(16px)' }, to: { opacity: '1', transform: 'translateY(0)' } },
      },
    },
  },
  plugins: [require('tailwindcss-animate')],
}
export default config
```

- [ ] **Step 2: Verify TypeScript accepts the new config**

```bash
npx tsc --noEmit
```

Expected: no errors (config file is not type-checked by the app's tsconfig, but running this confirms the app files still compile with the new token names).

---

## Task 2: Update Global CSS

**Files:**
- Modify: `src/styles/globals.css`

- [ ] **Step 1: Replace the entire `globals.css` with the cleaned version**

```css
@import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600;700&family=Space+Grotesk:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap');

@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  * { box-sizing: border-box; }

  html { font-size: 14px; }

  body {
    background-color: #1a1a1a;
    color: #E6E1E5;
    font-family: 'DM Sans', system-ui, sans-serif;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
    overflow: hidden;
  }

  ::selection { background-color: rgba(155,138,247,0.20); color: #E6E1E5; }

  :focus-visible { outline: 2px solid rgba(155,138,247,0.6); outline-offset: 2px; }

  ::-webkit-scrollbar { width: 6px; height: 6px; }
  ::-webkit-scrollbar-track { background: transparent; }
  ::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.10); border-radius: 3px; }
  ::-webkit-scrollbar-thumb:hover { background: rgba(255,255,255,0.18); }
}

@layer components {
  .surface          { background-color: #222222; border: 1px solid rgba(255,255,255,0.06); }
  .surface-elevated { background-color: #2a2a2a; border: 1px solid rgba(255,255,255,0.09); }
  .surface-overlay  { background-color: #313131; border: 1px solid rgba(255,255,255,0.09); }

  .mono-label {
    font-family: 'JetBrains Mono', monospace;
    font-size: 11px;
    letter-spacing: 0.08em;
    color: #C5B8FF;
  }

  .skeleton {
    background: linear-gradient(90deg,
      rgba(255,255,255,0.04) 0%,
      rgba(255,255,255,0.09) 50%,
      rgba(255,255,255,0.04) 100%
    );
    background-size: 200% 100%;
    animation: shimmer 1.8s linear infinite;
  }
}
```

- [ ] **Step 2: Confirm TypeScript still passes**

```bash
npx tsc --noEmit
```

Expected: no errors.

---

## Task 3: Update DB_TARGETS in constants.ts

**Files:**
- Modify: `src/lib/constants.ts`

- [ ] **Step 1: Replace the `DB_TARGETS` array**

Find this block (lines 1–7):
```typescript
export const DB_TARGETS = [
  { value: 'postgresql', label: 'PostgreSQL',  icon: '🐘', color: '#336791' },
  { value: 'mysql',      label: 'MySQL',       icon: '🐬', color: '#4479A1' },
  { value: 'sqlite',     label: 'SQLite',      icon: '📦', color: '#003B57' },
  { value: 'mongodb',    label: 'MongoDB',     icon: '🍃', color: '#47A248' },
  { value: 'firestore',  label: 'Firestore',   icon: '🔥', color: '#FFCA28' },
]
```

Replace with:
```typescript
export const DB_TARGETS = [
  { value: 'postgresql', label: 'PostgreSQL', iconName: 'Database'  },
  { value: 'mysql',      label: 'MySQL',      iconName: 'Database'  },
  { value: 'sqlite',     label: 'SQLite',     iconName: 'HardDrive' },
  { value: 'mongodb',    label: 'MongoDB',    iconName: 'Layers'    },
  { value: 'firestore',  label: 'Firestore',  iconName: 'Flame'     },
]
```

- [ ] **Step 2: Run TypeScript to see expected errors (render sites now broken)**

```bash
npx tsc --noEmit 2>&1 | grep "icon"
```

Expected: errors about `db.icon` and `dbTarget.icon` properties not existing. These are the render sites that Tasks 4–6 will fix.

---

## Task 4: Create DbIcon Utility Component

**Files:**
- Create: `src/lib/utils/dbIcons.tsx`

- [ ] **Step 1: Create the file**

```typescript
import { Database, HardDrive, Layers, Flame } from 'lucide-react'

const ICON_MAP = {
  Database,
  HardDrive,
  Layers,
  Flame,
} as const

type IconName = keyof typeof ICON_MAP

interface Props {
  name: string
  size?: number
  className?: string
}

export function DbIcon({ name, size = 12, className }: Props) {
  const Icon = ICON_MAP[name as IconName] ?? Database
  return <Icon size={size} className={className} />
}
```

- [ ] **Step 2: Verify it compiles**

```bash
npx tsc --noEmit 2>&1 | grep "dbIcons"
```

Expected: no errors for this file.

---

## Task 5: Update SchemaPromptInput.tsx

**Files:**
- Modify: `src/features/schema-designer/SchemaPromptInput.tsx`

- [ ] **Step 1: Add the DbIcon import**

Find the existing import block at the top of the file:
```typescript
import { Sparkles, ChevronDown, ChevronRight, Upload, AlertCircle } from 'lucide-react'
import { DatabaseTarget, NamingConvention } from '@/types'
import { DB_TARGETS } from '@/lib/constants'
import { StatusDot } from '@/components/shared/StatusDot'
import { LoadingSpinner } from '@/components/shared/LoadingSpinner'
import { cn } from '@/lib/utils/cn'
```

Replace with (add the DbIcon import):
```typescript
import { Sparkles, ChevronDown, ChevronRight, Upload, AlertCircle } from 'lucide-react'
import { DatabaseTarget, NamingConvention } from '@/types'
import { DB_TARGETS } from '@/lib/constants'
import { DbIcon } from '@/lib/utils/dbIcons'
import { StatusDot } from '@/components/shared/StatusDot'
import { LoadingSpinner } from '@/components/shared/LoadingSpinner'
import { cn } from '@/lib/utils/cn'
```

- [ ] **Step 2: Replace the emoji span with DbIcon**

Find:
```tsx
                >
                  <span>{db.icon}</span>
                  <span>{db.label}</span>
                </button>
```

Replace with:
```tsx
                >
                  <DbIcon name={db.iconName} size={11} />
                  <span>{db.label}</span>
                </button>
```

- [ ] **Step 3: Verify**

```bash
npx tsc --noEmit 2>&1 | grep "SchemaPromptInput"
```

Expected: no errors for this file.

---

## Task 6: Update Sidebar.tsx

**Files:**
- Modify: `src/components/layout/Sidebar.tsx`

- [ ] **Step 1: Add the DbIcon import**

Find:
```typescript
import { Database, GitBranch, Terminal, Zap, Plug, ChevronLeft, ChevronRight, Download, Settings } from 'lucide-react'
import { useUI } from '@/context/UIContext'
import { useProject } from '@/context/ProjectContext'
import { localStorageService } from '@/lib/storage/localStorageService'
import { DB_TARGETS } from '@/lib/constants'
import { cn } from '@/lib/utils/cn'
```

Replace with:
```typescript
import { Database, GitBranch, Terminal, Zap, Plug, ChevronLeft, ChevronRight, Download, Settings } from 'lucide-react'
import { useUI } from '@/context/UIContext'
import { useProject } from '@/context/ProjectContext'
import { localStorageService } from '@/lib/storage/localStorageService'
import { DB_TARGETS } from '@/lib/constants'
import { DbIcon } from '@/lib/utils/dbIcons'
import { cn } from '@/lib/utils/cn'
```

- [ ] **Step 2: Replace the emoji span with DbIcon**

Find:
```tsx
            {dbTarget && (
              <div className="flex items-center gap-1 mt-1">
                <span className="text-xs">{dbTarget.icon}</span>
                <span className="text-xs text-text-tertiary">{dbTarget.label}</span>
              </div>
            )}
```

Replace with:
```tsx
            {dbTarget && (
              <div className="flex items-center gap-1 mt-1">
                <DbIcon name={dbTarget.iconName} size={12} className="text-text-tertiary" />
                <span className="text-xs text-text-tertiary">{dbTarget.label}</span>
              </div>
            )}
```

- [ ] **Step 3: Verify**

```bash
npx tsc --noEmit 2>&1 | grep "Sidebar"
```

Expected: no errors for this file.

---

## Task 7: Update DatabaseConnectionPanel.tsx

**Files:**
- Modify: `src/features/connections/DatabaseConnectionPanel.tsx`

- [ ] **Step 1: Add the DbIcon import**

Find:
```typescript
import { Plus, Plug, Trash2, RefreshCw, CheckCircle, XCircle, Loader, Download } from 'lucide-react'
import { cn } from '@/lib/utils/cn'
```

Replace with:
```typescript
import { Plus, Plug, Trash2, RefreshCw, CheckCircle, XCircle, Loader, Download } from 'lucide-react'
import { cn } from '@/lib/utils/cn'
import { DbIcon } from '@/lib/utils/dbIcons'
```

- [ ] **Step 2: Replace DRIVER_META icon strings with iconName**

Find:
```typescript
const DRIVER_META: Record<DbDriver, { label: string; icon: string; defaultPort: number | null }> = {
  postgresql: { label: 'PostgreSQL', icon: '🐘', defaultPort: 5432  },
  mysql:      { label: 'MySQL',      icon: '🐬', defaultPort: 3306  },
  sqlite:     { label: 'SQLite',     icon: '📦', defaultPort: null  },
  mongodb:    { label: 'MongoDB',    icon: '🍃', defaultPort: 27017 },
}
```

Replace with:
```typescript
const DRIVER_META: Record<DbDriver, { label: string; iconName: string; defaultPort: number | null }> = {
  postgresql: { label: 'PostgreSQL', iconName: 'Database',  defaultPort: 5432  },
  mysql:      { label: 'MySQL',      iconName: 'Database',  defaultPort: 3306  },
  sqlite:     { label: 'SQLite',     iconName: 'HardDrive', defaultPort: null  },
  mongodb:    { label: 'MongoDB',    iconName: 'Layers',    defaultPort: 27017 },
}
```

- [ ] **Step 3: Replace the first emoji render site (connection list item)**

Find:
```tsx
                <span className="text-base flex-shrink-0">{meta.icon}</span>
```

Replace with:
```tsx
                <DbIcon name={meta.iconName} size={16} className="text-text-secondary flex-shrink-0" />
```

- [ ] **Step 4: Replace the second emoji render site (driver selector grid)**

Find:
```tsx
                    <span className="text-xl">{meta.icon}</span>
```

Replace with:
```tsx
                    <DbIcon name={meta.iconName} size={20} />
```

- [ ] **Step 5: Verify**

```bash
npx tsc --noEmit 2>&1 | grep "DatabaseConnection"
```

Expected: no errors for this file.

---

## Task 8: Clean Up LandingPage.tsx

**Files:**
- Modify: `src/pages/LandingPage.tsx`

- [ ] **Step 1: Remove gradient-text-cyan from the headline**

Find:
```tsx
          <span className="gradient-text-cyan">Ship Faster.</span>
```

Replace with:
```tsx
          <span className="text-text-primary">Ship Faster.</span>
```

- [ ] **Step 2: Remove hover:shadow-cyan from the CTA button**

Find:
```tsx
            className="flex items-center gap-2 px-6 py-3 rounded-lg bg-cyan text-bg-base font-semibold text-sm hover:shadow-cyan transition-all duration-250 hover:scale-[1.02]"
```

Replace with:
```tsx
            className="flex items-center gap-2 px-6 py-3 rounded-lg bg-cyan text-bg-base font-semibold text-sm hover:opacity-90 transition-all duration-250 hover:scale-[1.02]"
```

- [ ] **Step 3: Verify**

```bash
npx tsc --noEmit 2>&1 | grep "LandingPage"
```

Expected: no errors for this file.

---

## Task 9: Full Verification & Build

- [ ] **Step 1: Run full TypeScript check — must be zero errors**

```bash
npx tsc --noEmit
```

Expected output: *(no output)* — blank means zero errors.

- [ ] **Step 2: Run production build — must exit 0**

```bash
npm run build 2>&1 | tail -5
```

Expected last line contains: `✓ built in` with exit code 0.

- [ ] **Step 3: Visual spot-check**

Start the dev server:
```bash
npm run dev
```

Open http://localhost:5173 and verify:

| Location | What to check |
|----------|---------------|
| App shell sidebar | Active tab has purple left-border accent, not cyan-blue |
| Schema Designer → Database Target | All 5 chips show Lucide icons (Database, Database, HardDrive, Layers, Flame) — no emojis |
| Schema Designer → Generate button | Purple filled button, not neon blue |
| ER Visualizer nodes | Selected node border is purple, no glow shadow |
| Connections panel → Driver selector | Grid shows Lucide icons at 20px, not emoji |
| Connections panel → Saved connections | Each connection row shows Lucide icon at 16px, not emoji |
| Landing page headline | "Ship Faster." in plain white text, no gradient |
| Landing page CTA | "Get Started" button is purple, no shadow glow on hover |
| Backgrounds | App background is `#1a1a1a` (warmer dark), not `#0A0C10` (near-black) |
