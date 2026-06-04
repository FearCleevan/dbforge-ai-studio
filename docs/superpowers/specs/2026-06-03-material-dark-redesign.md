# DBForge AI Studio — Material Dark UI Redesign
**Date:** 2026-06-03  
**Status:** Approved  
**Reference:** `frontend/public/Sample.webp` (Material Design 3 dark component library)

---

## Objective

Replace the current neon/cyberpunk aesthetic (bright cyan `#00D4FF`, violet glows, gradient text) with a professional Material Design 3 dark theme. Replace all emoji DB-target icons with Lucide React icons.

---

## 1. Color Token Remapping

All changes live in `tailwind.config.ts`. Because every component uses Tailwind utility classes (`text-cyan`, `bg-cyan/10`, `border-cyan`, etc.), changing the token value automatically propagates everywhere — no component files need color changes.

### New Palette

| Token | Old value | New value | Notes |
|-------|-----------|-----------|-------|
| `cyan` (primary accent) | `#00D4FF` | `#9B8AF7` | Muted purple — primary interactive, active states, CTA |
| `cyan.dim` | `rgba(0,212,255,0.12)` | `rgba(155,138,247,0.10)` | |
| `cyan.glow` | `rgba(0,212,255,0.25)` | `rgba(155,138,247,0.12)` | Barely used after removing glows |
| `violet` (secondary) | `#8B5CF6` | `#7965D4` | Secondary selections, naming conventions |
| `violet.dim` | `rgba(139,92,246,0.12)` | `rgba(121,101,212,0.10)` | |
| `emerald` (teal accent) | `#10B981` | `#26D9C7` | FK columns, success states, teal indicators |
| `emerald.dim` | `rgba(16,185,129,0.12)` | `rgba(38,217,199,0.10)` | |
| `bg-base` | `#0A0C10` | `#1a1a1a` | Page background |
| `bg-surface` | `#0F1117` | `#222222` | Sidebar, panel backgrounds |
| `bg-elevated` | `#161B25` | `#2a2a2a` | Panel headers, raised surfaces |
| `bg-overlay` | `#1C2333` | `#313131` | Dropdowns, popovers |
| `bg-muted` | `#242B3D` | `#383838` | Input backgrounds |
| `text-primary` | `#F0F4FF` (blue-tinted) | `#E6E1E5` | Neutral near-white |
| `text-secondary` | `#8892A4` (blue-tinted) | `#ABA7AF` | Neutral mid-gray |
| `text-tertiary` | `#4A5568` | `#5C5760` | Placeholder, disabled |
| `text-code` | `#A8D8FF` | `#C5B8FF` | Inline code, monospace |

### Box Shadows

Remove colored glows. Keep neutral depth-only shadows:

```
sm:  0 1px 2px rgba(0,0,0,0.5)
md:  0 4px 12px rgba(0,0,0,0.6)
lg:  0 8px 24px rgba(0,0,0,0.7)
```

Remove: `cyan` shadow, `violet` shadow.

---

## 2. Global CSS Cleanup (`globals.css`)

### Remove
- `.glow-cyan` — neon cyan glow
- `.glow-violet` — neon violet glow
- `.gradient-text-cyan` — cyan→violet gradient text
- `.gradient-text-violet` — violet→pink gradient text
- `.panel-border-cyan` — neon border
- `.panel-border-violet` — neon border
- `.tab-active-cyan::after` — neon tab underline
- `animation: pulse-cyan` — neon pulse animation
- `animation: float` — floating animation

### Update
- `::selection` background → `rgba(155,138,247,0.20)` (purple tint)
- `:focus-visible` outline → `rgba(155,138,247,0.6)`
- `.surface` / `.surface-elevated` / `.surface-overlay` → use new bg tokens
- `.mono-label` color → `#C5B8FF` (updated code color)
- Scrollbar thumb → `rgba(255,255,255,0.10)` (slightly more visible on lighter bg)

### Keep
- `animate-fade-in`, `animate-fade-up`, `animate-slide-in-*` — functional animations, keep
- `animate-shimmer` / `.skeleton` — loading state, keep
- `animate-spin-slow` — keep (used for loading indicators)

---

## 3. DB Target Icon Replacement

### Strategy
Replace the `icon: string` (emoji) field in `DB_TARGETS` with `iconName: string` (Lucide component name). Create a single `DbIcon` component that maps names to Lucide icons. Update the three render sites.

### `constants.ts` — DB_TARGETS

```typescript
export const DB_TARGETS = [
  { value: 'postgresql', label: 'PostgreSQL', iconName: 'Database'  },
  { value: 'mysql',      label: 'MySQL',      iconName: 'Database'  },
  { value: 'sqlite',     label: 'SQLite',     iconName: 'HardDrive' },
  { value: 'mongodb',    label: 'MongoDB',    iconName: 'Layers'    },
  { value: 'firestore',  label: 'Firestore',  iconName: 'Flame'     },
]
```

Remove old `icon` (emoji) and `color` fields entirely. Icon color inherits from `currentColor` via Tailwind classes at the render site.

### New file: `lib/utils/dbIcons.tsx`

```typescript
import { Database, HardDrive, Layers, Flame } from 'lucide-react'

const ICON_MAP = { Database, HardDrive, Layers, Flame }

export function DbIcon({ name, size = 12 }: { name: string; size?: number }) {
  const Icon = ICON_MAP[name as keyof typeof ICON_MAP] ?? Database
  return <Icon size={size} />
}
```

### Render sites

| File | Change |
|------|--------|
| `features/schema-designer/SchemaPromptInput.tsx` | Replace `<span>{db.icon}</span>` → `<DbIcon name={db.iconName} size={11} />` |
| `components/layout/Sidebar.tsx` | Replace `<span className="text-xs">{dbTarget.icon}</span>` → `<DbIcon name={dbTarget.iconName} size={12} />` |
| `features/connections/DatabaseConnectionPanel.tsx` | Replace `DRIVER_META` emoji strings: `postgresql→Database`, `mysql→Database`, `sqlite→HardDrive`, `mongodb→Layers`; render via `DbIcon` |

---

## 4. LandingPage Neon Cleanup

Two targeted removals only — do not redesign the landing page:

1. `<span className="gradient-text-cyan">Ship Faster.</span>` → plain `text-text-primary`
2. `hover:shadow-cyan` on CTA button → remove (shadow class no longer exists)

---

## 5. Files Changed

| File | Type |
|------|------|
| `tailwind.config.ts` | Modify — full palette update |
| `src/styles/globals.css` | Modify — remove neon utilities |
| `src/lib/constants.ts` | Modify — emoji → iconName |
| `src/lib/utils/dbIcons.tsx` | **Create** — DbIcon component |
| `src/features/schema-designer/SchemaPromptInput.tsx` | Modify — render DbIcon |
| `src/components/layout/Sidebar.tsx` | Modify — render DbIcon |
| `src/features/connections/DatabaseConnectionPanel.tsx` | Modify — replace DRIVER_META emojis |
| `src/pages/LandingPage.tsx` | Modify — remove 2 neon class references |

**Not changed:** All other component files — colors auto-update via Tailwind token.

---

## 6. Out of Scope

- No layout changes
- No component restructuring
- No new features
- Landing page structural design is unchanged (only the two neon class removals)
- `MouseTrail.tsx` — not modified (doesn't use neon classes directly)

---

## 7. Verification

After implementation, run:
```bash
cd frontend && npx tsc --noEmit && npm run build
```

Visual check: Schema Designer DB target buttons show Lucide icons, active state is purple not neon-blue, no glowing effects anywhere in the app.
