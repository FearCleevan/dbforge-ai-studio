# DBForge AI Studio — Frontend Implementation Prompt
## MERN Stack · Phase-by-Phase Execution Guide
### For Claude Code · Frontend-First · Vercel (Frontend) + Render (Backend)

---

> **For Claude Code:** Read this entire document completely before executing anything.
> Store the following as active memory:
>
> - **Project:** DBForge AI Studio — an AI-powered database design, visualization, query, and API testing platform
> - **Stack:** MERN (MongoDB, Express.js, React, Node.js) + TypeScript throughout
> - **Frontend:** React 18 + Vite + TypeScript + Tailwind CSS + shadcn/ui
> - **Backend:** Node.js + Express.js + TypeScript (built in Phase 5)
> - **Database:** MongoDB + Mongoose (connected in Phase 5)
> - **Deployment:** Vercel (frontend) + Render Web Services (backend)
> - **Design language:** **Dark-first developer tool** — deep slate surfaces, electric cyan/violet accents, monospace code aesthetics, terminal energy. Think Linear meets VS Code meets a database console. NOT a generic SaaS dashboard.
> - **Phase gate:** STOP after every phase. Output a full report. Ask:
>   **"Phase [N] complete. Continue to Phase [N+1]? Reply 'Yes, Proceed' to continue."**
>   Never auto-proceed. Wait for explicit **"Yes, Proceed"**.
> - **Frontend-first:** Phases 0–4 build the complete working frontend with all mock data and simulated AI. Phase 5 wires in the real backend. Phases 6–9 expand with real database connectors, API testing, collaboration, and production deployment.
> - No real API calls until Phase 5. Everything in Phases 0–4 is simulated locally.

---

## Memory Anchors (Commit Before Starting)

```
PROJECT:        DBForge AI Studio — AI-powered database design platform
APPROACH:       Frontend-first prototype → real backend swap
STACK:          MERN + TypeScript + Tailwind + shadcn/ui
STATE:          React Context + useReducer (Phases 0-4), then backend API (Phase 5+)
PERSISTENCE:    localStorage (Phases 0-4), then MongoDB (Phase 5+)
AI:             Simulated mock functions (Phases 0-4), then real LLM API (Phase 5+)
VISUALIZATION:  React Flow (ER diagrams)
CODE EDITOR:    Monaco Editor (SQL/query editor)
DEPLOY_FRONT:   Vercel
DEPLOY_BACK:    Render Web Services
PHASE_GATE:     STOP after each phase. Report. Ask "Continue to Phase [N+1]?"
                Never auto-proceed. Wait for "Yes, Proceed."
```

---

## Design System (Lock In From Phase 0 — Never Deviate)

### Color Palette

```css
:root {
  /* Surfaces */
  --bg-base:        #0A0C10;   /* App background — near-black */
  --bg-surface:     #0F1117;   /* Card/panel surfaces */
  --bg-elevated:    #161B25;   /* Elevated panels, modals */
  --bg-overlay:     #1C2333;   /* Hover/overlay states */
  --bg-muted:       #242B3D;   /* Input backgrounds, subtle areas */

  /* Borders */
  --border-subtle:  rgba(255,255,255,0.06);
  --border-default: rgba(255,255,255,0.10);
  --border-strong:  rgba(255,255,255,0.18);

  /* Text */
  --text-primary:   #F0F4FF;   /* Primary text */
  --text-secondary: #8892A4;   /* Secondary/muted text */
  --text-tertiary:  #4A5568;   /* Placeholder/dim text */
  --text-code:      #A8D8FF;   /* Code/monospace text */

  /* Accent — Electric Cyan (primary) */
  --cyan:           #00D4FF;
  --cyan-dim:       rgba(0,212,255,0.12);
  --cyan-glow:      rgba(0,212,255,0.25);

  /* Accent — Violet (secondary) */
  --violet:         #8B5CF6;
  --violet-dim:     rgba(139,92,246,0.12);
  --violet-glow:    rgba(139,92,246,0.25);

  /* Accent — Emerald (success/active) */
  --emerald:        #10B981;
  --emerald-dim:    rgba(16,185,129,0.12);

  /* Semantic */
  --error:          #F87171;
  --warning:        #FBBF24;
  --info:           #60A5FA;

  /* Syntax highlighting */
  --syntax-keyword: #C678DD;
  --syntax-string:  #98C379;
  --syntax-number:  #D19A66;
  --syntax-comment: #5C6370;
  --syntax-func:    #61AFEF;
}
```

### Typography

```css
/* Fonts: */
/* Display/UI: 'DM Sans' — clean, modern, developer-appropriate */
/* Mono/Code: 'JetBrains Mono' — the industry standard for dev tools */
/* Accent: 'Space Grotesk' — for headings and brand moments */

:root {
  --font-ui:      'DM Sans', system-ui, sans-serif;
  --font-mono:    'JetBrains Mono', 'Fira Code', ui-monospace, monospace;
  --font-display: 'Space Grotesk', 'DM Sans', sans-serif;
}

/* Type scale */
--text-xs:   11px;   /* Metadata, badges */
--text-sm:   13px;   /* Secondary labels */
--text-base: 14px;   /* Body / UI default */
--text-md:   15px;   /* Slightly larger body */
--text-lg:   18px;   /* Section headings */
--text-xl:   22px;   /* Panel headings */
--text-2xl:  28px;   /* Page headings */
--text-3xl:  36px;   /* Hero headings */
```

### Component Tokens

```css
:root {
  /* Border radius */
  --radius-sm:  4px;
  --radius-md:  8px;
  --radius-lg:  12px;
  --radius-xl:  16px;
  --radius-pill: 100px;

  /* Shadows */
  --shadow-sm:    0 1px 3px rgba(0,0,0,0.4);
  --shadow-md:    0 4px 16px rgba(0,0,0,0.5);
  --shadow-lg:    0 8px 32px rgba(0,0,0,0.6);
  --shadow-cyan:  0 0 24px rgba(0,212,255,0.15);
  --shadow-violet:0 0 24px rgba(139,92,246,0.15);

  /* Transitions */
  --ease-default: cubic-bezier(0.16, 1, 0.3, 1);
  --duration-fast:  150ms;
  --duration-base:  250ms;
  --duration-slow:  400ms;
}
```

---

## Project Structure (Full Target)

```
dbforge-ai-studio/
├── frontend/                         # React + Vite app (deployed to Vercel)
│   ├── src/
│   │   ├── app/
│   │   │   ├── App.tsx               # Root component, routing
│   │   │   ├── Router.tsx            # React Router config
│   │   │   └── Providers.tsx         # Context providers wrapper
│   │   ├── pages/
│   │   │   ├── LandingPage.tsx       # Welcome / marketing page
│   │   │   ├── StudioPage.tsx        # Main app shell (all 4 tools)
│   │   │   ├── NotFoundPage.tsx
│   │   │   └── index.ts
│   │   ├── features/
│   │   │   ├── schema-designer/
│   │   │   │   ├── SchemaDesigner.tsx
│   │   │   │   ├── SchemaPromptInput.tsx
│   │   │   │   ├── SchemaEditor.tsx
│   │   │   │   ├── SchemaDDLPreview.tsx
│   │   │   │   ├── SchemaExport.tsx
│   │   │   │   └── hooks/
│   │   │   │       ├── useSchemaGeneration.ts
│   │   │   │       └── useSchemaEditor.ts
│   │   │   ├── visualizer/
│   │   │   │   ├── SchemaVisualizer.tsx
│   │   │   │   ├── TableNode.tsx
│   │   │   │   ├── RelationshipEdge.tsx
│   │   │   │   ├── NodeDetailPanel.tsx
│   │   │   │   ├── VisualizerToolbar.tsx
│   │   │   │   └── hooks/
│   │   │   │       └── useFlowLayout.ts
│   │   │   ├── query-editor/
│   │   │   │   ├── QueryEditor.tsx
│   │   │   │   ├── QueryToolbar.tsx
│   │   │   │   ├── ResultsPanel.tsx
│   │   │   │   ├── ResultsTable.tsx
│   │   │   │   ├── ResultsJSON.tsx
│   │   │   │   ├── QueryHistory.tsx
│   │   │   │   ├── AIQueryPrompt.tsx
│   │   │   │   └── hooks/
│   │   │   │       └── useQueryExecution.ts
│   │   │   └── api-checker/
│   │   │       ├── APIChecker.tsx
│   │   │       ├── RequestBuilder.tsx
│   │   │       ├── ResponseViewer.tsx
│   │   │       ├── APIFlowBuilder.tsx
│   │   │       ├── TestGenerator.tsx
│   │   │       ├── EnvironmentPanel.tsx
│   │   │       └── hooks/
│   │   │           └── useAPIExecution.ts
│   │   ├── components/
│   │   │   ├── ui/                   # shadcn/ui components
│   │   │   │   ├── button.tsx
│   │   │   │   ├── badge.tsx
│   │   │   │   ├── card.tsx
│   │   │   │   ├── dialog.tsx
│   │   │   │   ├── dropdown-menu.tsx
│   │   │   │   ├── input.tsx
│   │   │   │   ├── label.tsx
│   │   │   │   ├── select.tsx
│   │   │   │   ├── separator.tsx
│   │   │   │   ├── sheet.tsx
│   │   │   │   ├── skeleton.tsx
│   │   │   │   ├── tabs.tsx
│   │   │   │   ├── textarea.tsx
│   │   │   │   ├── toast.tsx
│   │   │   │   ├── tooltip.tsx
│   │   │   │   └── index.ts
│   │   │   ├── layout/
│   │   │   │   ├── AppShell.tsx
│   │   │   │   ├── Sidebar.tsx
│   │   │   │   ├── TopBar.tsx
│   │   │   │   ├── ProjectSwitcher.tsx
│   │   │   │   └── TabNav.tsx
│   │   │   └── shared/
│   │   │       ├── LoadingSpinner.tsx
│   │   │       ├── EmptyState.tsx
│   │   │       ├── CopyButton.tsx
│   │   │       ├── StatusDot.tsx
│   │   │       ├── KeyValueEditor.tsx
│   │   │       └── CodeBlock.tsx
│   │   ├── context/
│   │   │   ├── ProjectContext.tsx    # Global project state
│   │   │   ├── UIContext.tsx         # UI state (active tab, panels)
│   │   │   └── ToastContext.tsx
│   │   ├── lib/
│   │   │   ├── mock/
│   │   │   │   ├── schemas.ts        # Predefined schema templates
│   │   │   │   ├── queries.ts        # Mock query results
│   │   │   │   ├── apiResponses.ts   # Mock API responses
│   │   │   │   └── testimonials.ts   # Demo data
│   │   │   ├── simulation/
│   │   │   │   ├── schemaSimulator.ts
│   │   │   │   ├── querySimulator.ts
│   │   │   │   └── apiSimulator.ts
│   │   │   ├── storage/
│   │   │   │   └── localStorageService.ts
│   │   │   ├── utils/
│   │   │   │   ├── cn.ts
│   │   │   │   ├── formatters.ts
│   │   │   │   ├── sqlParser.ts
│   │   │   │   └── schemaHelpers.ts
│   │   │   └── constants.ts
│   │   ├── types/
│   │   │   ├── project.ts
│   │   │   ├── schema.ts
│   │   │   ├── query.ts
│   │   │   ├── api.ts
│   │   │   └── index.ts
│   │   ├── styles/
│   │   │   └── globals.css
│   │   ├── main.tsx
│   │   └── vite-env.d.ts
│   ├── index.html
│   ├── vite.config.ts
│   ├── tailwind.config.ts
│   ├── tsconfig.json
│   ├── tsconfig.node.json
│   ├── components.json               # shadcn/ui config
│   ├── .env.example
│   └── vercel.json
│
├── backend/                          # Express + Node.js (deployed to Render)
│   ├── src/
│   │   ├── app.ts
│   │   ├── server.ts
│   │   ├── config/
│   │   ├── routes/
│   │   ├── controllers/
│   │   ├── services/
│   │   ├── models/
│   │   ├── middleware/
│   │   └── types/
│   ├── package.json
│   ├── tsconfig.json
│   ├── .env.example
│   └── render.yaml
│
├── .gitignore
└── README.md
```

---

# PHASE 0 — Project Bootstrap & Design System

## Objective
Initialize the Vite + React + TypeScript project inside a `frontend/` directory. Install all dependencies. Configure Tailwind CSS with the full design system. Set up shadcn/ui. Define all TypeScript types. Create all mock data. Wire up the base project structure.

**Deliverable:** Running dev server at `localhost:5173` with the design system loaded. No UI yet — just foundation.

---

## Step 0.1 — Initialize Project Structure

```bash
mkdir dbforge-ai-studio
cd dbforge-ai-studio

# Frontend
npm create vite@latest frontend -- --template react-ts
cd frontend
npm install

# Core dependencies
npm install \
  react-router-dom \
  @tanstack/react-query \
  reactflow \
  @monaco-editor/react \
  lucide-react \
  clsx \
  tailwind-merge \
  class-variance-authority \
  @radix-ui/react-dialog \
  @radix-ui/react-dropdown-menu \
  @radix-ui/react-select \
  @radix-ui/react-tabs \
  @radix-ui/react-tooltip \
  @radix-ui/react-separator \
  @radix-ui/react-label \
  @radix-ui/react-toast \
  @radix-ui/react-slot \
  dagre \
  axios \
  date-fns \
  uuid

npm install -D \
  tailwindcss \
  postcss \
  autoprefixer \
  @types/uuid \
  @types/dagre

# Initialize Tailwind
npx tailwindcss init -p

# Initialize shadcn/ui
npx shadcn-ui@latest init
```

## Step 0.2 — Configure `tailwind.config.ts`

```typescript
import type { Config } from 'tailwindcss'

const config: Config = {
  darkMode: ['class'],
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // Surfaces
        'bg-base':     '#0A0C10',
        'bg-surface':  '#0F1117',
        'bg-elevated': '#161B25',
        'bg-overlay':  '#1C2333',
        'bg-muted':    '#242B3D',
        // Accents
        cyan:    { DEFAULT: '#00D4FF', dim: 'rgba(0,212,255,0.12)', glow: 'rgba(0,212,255,0.25)' },
        violet:  { DEFAULT: '#8B5CF6', dim: 'rgba(139,92,246,0.12)', glow: 'rgba(139,92,246,0.25)' },
        emerald: { DEFAULT: '#10B981', dim: 'rgba(16,185,129,0.12)' },
        // Text
        'text-primary':   '#F0F4FF',
        'text-secondary': '#8892A4',
        'text-tertiary':  '#4A5568',
        'text-code':      '#A8D8FF',
        // Semantic
        'error':   '#F87171',
        'warning': '#FBBF24',
        'info':    '#60A5FA',
        // Borders (use bg-opacity)
        border: {
          subtle:  'rgba(255,255,255,0.06)',
          default: 'rgba(255,255,255,0.10)',
          strong:  'rgba(255,255,255,0.18)',
        },
      },
      fontFamily: {
        ui:      ['"DM Sans"', 'system-ui', 'sans-serif'],
        mono:    ['"JetBrains Mono"', '"Fira Code"', 'ui-monospace', 'monospace'],
        display: ['"Space Grotesk"', '"DM Sans"', 'sans-serif'],
      },
      fontSize: {
        xs:   ['11px', { lineHeight: '1.4' }],
        sm:   ['13px', { lineHeight: '1.5' }],
        base: ['14px', { lineHeight: '1.6' }],
        md:   ['15px', { lineHeight: '1.6' }],
        lg:   ['18px', { lineHeight: '1.4' }],
        xl:   ['22px', { lineHeight: '1.3' }],
        '2xl':['28px', { lineHeight: '1.2' }],
        '3xl':['36px', { lineHeight: '1.1' }],
      },
      borderRadius: {
        sm:   '4px',
        md:   '8px',
        lg:   '12px',
        xl:   '16px',
        pill: '100px',
      },
      boxShadow: {
        sm:     '0 1px 3px rgba(0,0,0,0.4)',
        md:     '0 4px 16px rgba(0,0,0,0.5)',
        lg:     '0 8px 32px rgba(0,0,0,0.6)',
        cyan:   '0 0 24px rgba(0,212,255,0.15)',
        violet: '0 0 24px rgba(139,92,246,0.15)',
      },
      animation: {
        'fade-in':      'fadeIn 0.25s ease forwards',
        'fade-up':      'fadeUp 0.35s ease forwards',
        'slide-in-r':   'slideInRight 0.3s ease forwards',
        'slide-in-l':   'slideInLeft 0.3s ease forwards',
        'pulse-cyan':   'pulseCyan 2s ease-in-out infinite',
        'shimmer':      'shimmer 1.8s linear infinite',
        'spin-slow':    'spin 3s linear infinite',
        'float':        'float 3s ease-in-out infinite',
      },
      keyframes: {
        fadeIn:       { from: { opacity: '0' }, to: { opacity: '1' } },
        fadeUp:       { from: { opacity: '0', transform: 'translateY(12px)' }, to: { opacity: '1', transform: 'translateY(0)' } },
        slideInRight: { from: { transform: 'translateX(24px)', opacity: '0' }, to: { transform: 'translateX(0)', opacity: '1' } },
        slideInLeft:  { from: { transform: 'translateX(-24px)', opacity: '0' }, to: { transform: 'translateX(0)', opacity: '1' } },
        pulseCyan:    { '0%,100%': { boxShadow: '0 0 0 rgba(0,212,255,0)' }, '50%': { boxShadow: '0 0 20px rgba(0,212,255,0.3)' } },
        shimmer:      { '0%': { backgroundPosition: '-200% 0' }, '100%': { backgroundPosition: '200% 0' } },
        float:        { '0%,100%': { transform: 'translateY(0px)' }, '50%': { transform: 'translateY(-6px)' } },
      },
    },
  },
  plugins: [require('tailwindcss-animate')],
}
export default config
```

## Step 0.3 — Global CSS (`src/styles/globals.css`)

```css
@import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600;700&family=Space+Grotesk:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap');

@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  * { box-sizing: border-box; }

  html { font-size: 14px; }

  body {
    background-color: #0A0C10;
    color: #F0F4FF;
    font-family: 'DM Sans', system-ui, sans-serif;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
    overflow: hidden; /* App-like shell */
  }

  /* Selection */
  ::selection { background-color: rgba(0,212,255,0.25); color: #F0F4FF; }

  /* Focus ring */
  :focus-visible { outline: 2px solid rgba(0,212,255,0.6); outline-offset: 2px; }

  /* Scrollbars */
  ::-webkit-scrollbar { width: 6px; height: 6px; }
  ::-webkit-scrollbar-track { background: transparent; }
  ::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.12); border-radius: 3px; }
  ::-webkit-scrollbar-thumb:hover { background: rgba(255,255,255,0.2); }
}

@layer components {
  /* Surface styles */
  .surface { background-color: #0F1117; border: 1px solid rgba(255,255,255,0.06); }
  .surface-elevated { background-color: #161B25; border: 1px solid rgba(255,255,255,0.10); }
  .surface-overlay { background-color: #1C2333; border: 1px solid rgba(255,255,255,0.10); }

  /* Glow effects */
  .glow-cyan  { box-shadow: 0 0 24px rgba(0,212,255,0.2); }
  .glow-violet { box-shadow: 0 0 24px rgba(139,92,246,0.2); }

  /* Gradient text */
  .gradient-text-cyan {
    background: linear-gradient(135deg, #00D4FF, #8B5CF6);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
  }
  .gradient-text-violet {
    background: linear-gradient(135deg, #8B5CF6, #EC4899);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
  }

  /* Code mono label */
  .mono-label {
    font-family: 'JetBrains Mono', monospace;
    font-size: 11px;
    letter-spacing: 0.08em;
    color: #A8D8FF;
  }

  /* Shimmer skeleton */
  .skeleton {
    background: linear-gradient(90deg,
      rgba(255,255,255,0.04) 0%,
      rgba(255,255,255,0.10) 50%,
      rgba(255,255,255,0.04) 100%
    );
    background-size: 200% 100%;
    animation: shimmer 1.8s linear infinite;
  }

  /* Panel borders */
  .panel-border-cyan   { border: 1px solid rgba(0,212,255,0.2); }
  .panel-border-violet { border: 1px solid rgba(139,92,246,0.2); }

  /* Tab active indicator */
  .tab-active-cyan::after {
    content: '';
    position: absolute;
    bottom: -1px;
    left: 0;
    right: 0;
    height: 2px;
    background: #00D4FF;
    border-radius: 2px 2px 0 0;
  }
}
```

## Step 0.4 — TypeScript Types (`src/types/`)

### `schema.ts`
```typescript
export type DatabaseTarget =
  | 'postgresql'
  | 'mysql'
  | 'sqlite'
  | 'mongodb'
  | 'firestore'

export type ColumnType =
  | 'VARCHAR' | 'TEXT' | 'CHAR'
  | 'INTEGER' | 'BIGINT' | 'SMALLINT' | 'DECIMAL' | 'FLOAT' | 'DOUBLE'
  | 'BOOLEAN'
  | 'TIMESTAMP' | 'DATE' | 'TIME'
  | 'UUID' | 'SERIAL'
  | 'JSON' | 'JSONB'
  | 'BLOB' | 'BYTEA'
  // NoSQL types
  | 'String' | 'Number' | 'Boolean' | 'Date' | 'ObjectId' | 'Array' | 'Object'

export interface ColumnDefinition {
  id:           string
  name:         string
  type:         ColumnType
  length?:      number
  nullable:     boolean
  primaryKey:   boolean
  unique:       boolean
  defaultValue?: string
  references?:  { table: string; column: string }
  comment?:     string
}

export interface TableDefinition {
  id:       string
  name:     string
  columns:  ColumnDefinition[]
  indexes?: IndexDefinition[]
  comment?: string
  position?: { x: number; y: number } // For React Flow
}

export interface IndexDefinition {
  id:      string
  name:    string
  columns: string[]
  unique:  boolean
}

export interface SchemaDefinition {
  id:          string
  name:        string
  target:      DatabaseTarget
  tables:      TableDefinition[]
  ddl?:        string
  nosqlSchema?: Record<string, unknown>
  explanation?: string
  createdAt:   string
  updatedAt:   string
}

export interface NamingConvention {
  tableCase:  'snake_case' | 'PascalCase' | 'camelCase'
  columnCase: 'snake_case' | 'camelCase'
  prefix?:    string
  suffix?:    string
}
```

### `query.ts`
```typescript
export interface QueryDefinition {
  id:        string
  name?:     string
  sql:       string
  createdAt: string
}

export interface QueryResult {
  columns:      string[]
  rows:         Record<string, unknown>[]
  rowCount:     number
  executionMs:  number
  error?:       string
}

export interface ExplainPlan {
  steps:      ExplainStep[]
  totalCost:  number
  estimatedRows: number
}

export interface ExplainStep {
  operation:  string
  table?:     string
  index?:     string
  cost:       number
  rows:       number
  detail:     string
}

export type QueryType = 'SELECT' | 'INSERT' | 'UPDATE' | 'DELETE' | 'CREATE' | 'DROP' | 'ALTER'
```

### `api.ts`
```typescript
export type HTTPMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE' | 'HEAD' | 'OPTIONS'

export interface KeyValuePair {
  id:      string
  key:     string
  value:   string
  enabled: boolean
}

export interface APIRequest {
  id:      string
  name?:   string
  method:  HTTPMethod
  url:     string
  headers: KeyValuePair[]
  params:  KeyValuePair[]
  body?:   string
  bodyType: 'json' | 'form-data' | 'raw' | 'none'
  authType: 'none' | 'bearer' | 'basic' | 'api-key'
  authValue?: string
}

export interface APIResponse {
  status:      number
  statusText:  string
  headers:     Record<string, string>
  body:        unknown
  timeMs:      number
  size:        number
}

export interface APITest {
  id:          string
  name:        string
  assertion:   string
  type:        'status' | 'body' | 'header' | 'schema'
  expected:    string
  result?:     'pass' | 'fail'
  error?:      string
}

export interface APIFlowStep {
  id:       string
  name:     string
  request:  APIRequest
  response?: APIResponse
  tests?:   APITest[]
}

export interface APIEnvironment {
  id:        string
  name:      string
  variables: KeyValuePair[]
}
```

### `project.ts`
```typescript
import { SchemaDefinition, NamingConvention } from './schema'
import { QueryDefinition } from './query'
import { APIRequest, APIEnvironment } from './api'

export interface Project {
  id:          string
  name:        string
  description?: string
  schema?:     SchemaDefinition
  queries:     QueryDefinition[]
  apiRequests: APIRequest[]
  environments: APIEnvironment[]
  namingConvention: NamingConvention
  createdAt:   string
  updatedAt:   string
}

export interface ProjectMeta {
  id:        string
  name:      string
  updatedAt: string
}
```

## Step 0.5 — Mock Data (`src/lib/mock/`)

### `schemas.ts` — 5 predefined schema templates

```typescript
// Include complete table definitions for:
// 1. E-Commerce: users, products, categories, orders, order_items, cart, reviews, addresses
// 2. Blog: users, posts, tags, post_tags, comments, likes, media
// 3. Inventory: products, warehouses, stock_levels, suppliers, purchase_orders, transactions
// 4. SaaS: organizations, users, memberships, plans, subscriptions, features, usage_logs
// 5. Social Network: users, profiles, posts, follows, likes, comments, notifications, messages
//
// Each template must have all ColumnDefinition fields populated.
// Include both PostgreSQL DDL strings and MongoDB schema equivalents.
```

### `queries.ts` — Mock query results per table

```typescript
// For each schema template, provide mock SELECT results:
// users: [{id:1, email:'alex@example.com', name:'Alex Chen', created_at:'2024-01-15'...}, ...]
// orders: [{id:101, user_id:1, status:'shipped', total:249.99, ...}, ...]
// etc.
// Results should be realistic, 5-8 rows per table.
```

### `apiResponses.ts` — Mock HTTP responses

```typescript
// REST response templates matching schema endpoints:
// GET /api/users → { data: [...], total: 42, page: 1, limit: 10 }
// POST /api/users → { id: 'uuid', ...user, created_at: '...' }
// GET /api/users/1 → { id:1, ...user }
// Error responses: 400, 401, 404, 422, 500
```

## Step 0.6 — LocalStorage Service (`src/lib/storage/localStorageService.ts`)

```typescript
const STORAGE_KEY = 'dbforge_projects'
const SETTINGS_KEY = 'dbforge_settings'

export const localStorageService = {
  getProjects: (): Project[] => { ... },
  saveProject: (project: Project): void => { ... },
  deleteProject: (id: string): void => { ... },
  getProject: (id: string): Project | null => { ... },
  exportProject: (project: Project): void => { /* downloads JSON */ },
  importProject: (json: string): Project | null => { ... },
  getSettings: (): AppSettings => { ... },
  saveSettings: (settings: Partial<AppSettings>): void => { ... },
}
```

## Step 0.7 — Project Context (`src/context/ProjectContext.tsx`)

Full context with `useReducer`:

```typescript
type ProjectAction =
  | { type: 'SET_PROJECT'; payload: Project }
  | { type: 'CREATE_PROJECT'; payload: Project }
  | { type: 'UPDATE_SCHEMA'; payload: SchemaDefinition }
  | { type: 'ADD_QUERY'; payload: QueryDefinition }
  | { type: 'DELETE_QUERY'; payload: string }
  | { type: 'ADD_API_REQUEST'; payload: APIRequest }
  | { type: 'DELETE_API_REQUEST'; payload: string }
  | { type: 'SET_PROJECTS_LIST'; payload: ProjectMeta[] }

// Context provides:
// - currentProject: Project | null
// - projectsList: ProjectMeta[]
// - dispatch: Dispatch<ProjectAction>
// - createProject, switchProject, saveCurrentProject
```

## Step 0.8 — Constants (`src/lib/constants.ts`)

```typescript
export const DB_TARGETS = [
  { value: 'postgresql', label: 'PostgreSQL',  icon: '🐘', color: '#336791' },
  { value: 'mysql',      label: 'MySQL',       icon: '🐬', color: '#4479A1' },
  { value: 'sqlite',     label: 'SQLite',      icon: '📦', color: '#003B57' },
  { value: 'mongodb',    label: 'MongoDB',     icon: '🍃', color: '#47A248' },
  { value: 'firestore',  label: 'Firestore',   icon: '🔥', color: '#FFCA28' },
]

export const HTTP_METHODS = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'HEAD', 'OPTIONS']

export const HTTP_METHOD_COLORS: Record<string, string> = {
  GET:     '#10B981',
  POST:    '#3B82F6',
  PUT:     '#F59E0B',
  PATCH:   '#8B5CF6',
  DELETE:  '#EF4444',
  HEAD:    '#6B7280',
  OPTIONS: '#6B7280',
}

export const COLUMN_TYPES_SQL = ['VARCHAR','TEXT','INTEGER','BIGINT','DECIMAL','FLOAT','BOOLEAN','TIMESTAMP','DATE','UUID','SERIAL','JSON','JSONB']
export const COLUMN_TYPES_NOSQL = ['String','Number','Boolean','Date','ObjectId','Array','Object']

export const SCHEMA_TEMPLATES = ['e-commerce','blog','inventory','saas','social-network']

export const DEMO_PROJECT_ID = 'demo-project-ecommerce'
```

## Step 0.9 — Utility Functions (`src/lib/utils/`)

### `cn.ts`
```typescript
import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'
export const cn = (...inputs: ClassValue[]) => twMerge(clsx(inputs))
```

### `formatters.ts`
```typescript
export const formatBytes = (bytes: number): string => { ... }
export const formatMs = (ms: number): string => ms < 1000 ? `${ms}ms` : `${(ms/1000).toFixed(2)}s`
export const formatDate = (iso: string): string => { ... }
export const truncate = (str: string, len: number): string => str.length > len ? str.slice(0,len)+'…' : str
```

### `schemaHelpers.ts`
```typescript
export const generateDDL = (schema: SchemaDefinition): string => { ... }
export const generateMongoSchema = (schema: SchemaDefinition): Record<string,unknown> => { ... }
export const getRelationships = (schema: SchemaDefinition): Relationship[] => { ... }
export const validateSchema = (schema: SchemaDefinition): ValidationError[] => { ... }
```

## Step 0.10 — Vite Config + Environment

```typescript
// vite.config.ts
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  resolve: { alias: { '@': path.resolve(__dirname, './src') } },
  server: { port: 5173 },
})
```

```env
# frontend/.env.example
VITE_APP_NAME=DBForge AI Studio
VITE_APP_VERSION=1.0.0
VITE_API_URL=http://localhost:3001   # Render backend URL in production
VITE_USE_MOCK=true                   # Set false when backend is live
```

```json
// vercel.json
{
  "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }],
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        { "key": "X-Content-Type-Options", "value": "nosniff" },
        { "key": "X-Frame-Options", "value": "DENY" }
      ]
    }
  ]
}
```

---

### PHASE 0 STOP ✋

> **Claude Code must output:**
>
> ```
> ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
> PHASE 0 COMPLETE — Project Bootstrap & Design System
> ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
> ✅ Project initialized: frontend/ with Vite + React + TypeScript
> ✅ Dependencies installed: [list with versions]
> ✅ Tailwind: configured with full design token system
> ✅ shadcn/ui: initialized
> ✅ Fonts: DM Sans, Space Grotesk, JetBrains Mono loading
> ✅ TypeScript types: Project, Schema, Query, API — all defined
> ✅ Mock data: [N] schema templates, [N] query fixtures, [N] API responses
> ✅ LocalStorage service: CRUD operations implemented
> ✅ ProjectContext: useReducer with [N] action types
> ✅ Dev server: running at localhost:5173
> ✅ vercel.json: SPA rewrite rules configured
> ⚠️  Deviations: [any, with reason]
>
> Files created: [complete list]
> ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
> Phase 0 complete. Continue to Phase 1?
> Reply 'Yes, Proceed' to continue.
> ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
> ```

---

# PHASE 1 — App Shell, Landing Page & Navigation

## Objective
Build the complete application shell — the landing/welcome page, the main studio layout, sidebar navigation, project switcher, and tab system. No feature panels yet — just the skeleton the rest of the app lives inside.

**Deliverable:** Landing page at `/`, Studio at `/studio` with full navigation, project switcher working from localStorage, and a demo project auto-created on first visit.

---

## Step 1.1 — Landing Page (`src/pages/LandingPage.tsx`)

**Design concept:** Full-screen dark hero. Grid-line background pattern. Animated cyan/violet gradient orbs. Code aesthetic meets product marketing.

**Sections:**

**Hero:**
- Background: `bg-bg-base` + subtle grid pattern (CSS `background-image` with 1px lines at rgba(255,255,255,0.04))
- Two large gradient orbs (blurred, `blur-[120px]`, positioned top-left cyan + bottom-right violet) — purely decorative, CSS `absolute`
- Center-aligned content:
  - Badge: `NEW · AI-Powered Schema Generation` — pill with cyan border, mono font
  - Headline (Space Grotesk, 48–64px): "Design Databases." / "Ship Faster." — second line has `gradient-text-cyan` class
  - Subheadline: DM Sans 18px, text-secondary: "Generate schemas from plain English, visualize relationships, test APIs, and write queries — all in one AI-powered studio."
  - Two CTAs: `Open Studio →` (primary cyan button) + `View Demo` (ghost button)
  - Code snippet card below CTAs — shows a mock AI prompt → SQL generation animation (typewriter effect, pure CSS or simple useState interval)

**Feature grid (3 columns):**
- Schema Designer — DB icon, cyan accent
- ER Visualizer — graph icon, violet accent
- Query Editor — terminal icon, emerald accent
- API Checker — network icon, info blue accent
- Team Collaboration — users icon, warning amber accent (Phase 6 preview label)
- Export & Deploy — rocket icon, text-secondary (coming soon)

**Footer strip:**
- `DBForge AI Studio · Built for developers · Open source friendly`
- DM Sans 12px text-tertiary

## Step 1.2 — Router (`src/app/Router.tsx`)

```typescript
// React Router v6
// Routes:
// / → LandingPage
// /studio → StudioPage (protected: auto-redirect if no project)
// /studio/:projectId → StudioPage with specific project loaded
// * → NotFoundPage
```

## Step 1.3 — App Shell (`src/components/layout/AppShell.tsx`)

**Layout:** Fixed-height viewport app (no page scroll). CSS Grid:

```
┌─────────────────────────────────────────────────┐
│  TopBar (48px)                                  │
├──────────┬──────────────────────────────────────┤
│ Sidebar  │  TabNav (40px)                       │
│ (220px)  ├──────────────────────────────────────┤
│          │  Active Feature Panel (fills rest)   │
│          │                                      │
└──────────┴──────────────────────────────────────┘
```

- `overflow: hidden` on root, each panel scrolls independently
- Sidebar collapsible to icon-only mode (64px) on toggle
- Smooth 250ms width transition

## Step 1.4 — TopBar (`src/components/layout/TopBar.tsx`)

**Design:**
- `bg-bg-surface border-b border-border-subtle` — 48px height
- Left: DBForge logo mark (simple SVG — two intersecting circles suggesting a DB schema) + `DBForge` in Space Grotesk 16px 600 weight + `AI Studio` in mono 11px text-secondary
- Center: `ProjectSwitcher` component (see 1.5)
- Right: Connection status dot (mock — green "Connected to demo" or gray "Mock Mode") + Settings icon + Keyboard shortcuts icon

## Step 1.5 — Project Switcher (`src/components/layout/ProjectSwitcher.tsx`)

**Design:** Dropdown button in TopBar center:
- Shows current project name + dropdown chevron
- Opens a popover with:
  - List of saved projects (from localStorage) — each shows name + last updated date
  - `+ New Project` button at bottom — opens a dialog for name + DB target + optional template
  - `Import Project` button — file upload for JSON
- Active project has cyan left border indicator
- Empty state: "No projects yet. Create one to get started."

**New Project Dialog:**
- Input: Project Name
- Select: Primary Database (dropdown with DB icons)
- Select: Start from template (e-commerce, blog, inventory, saas, blank)
- Toggle: Apply naming conventions
- `Create Project` primary button

## Step 1.6 — Sidebar (`src/components/layout/Sidebar.tsx`)

**Design:** `bg-bg-surface border-r border-border-subtle` — 220px (or 64px collapsed)

**Top section — Navigation:**
- 4 nav items with icon + label:
  - `Schema Designer` — DatabaseIcon (Lucide)
  - `ER Visualizer` — GitBranchIcon
  - `Query Editor` — TerminalIcon
  - `API Checker` — ZapIcon
- Active item: `bg-cyan-dim border-l-2 border-cyan text-text-primary`
- Inactive: `text-text-secondary hover:bg-bg-overlay hover:text-text-primary`
- Each nav item: 40px height, 12px padding, 14px DM Sans 500

**Bottom section:**
- Project metadata: name, DB target badge, created date
- `Export Project` icon button
- `Import Project` icon button
- Settings gear icon
- Collapse sidebar chevron button

## Step 1.7 — Tab Navigation (`src/components/layout/TabNav.tsx`)

Secondary navigation within each feature (used by Query Editor and API Checker):

```typescript
// Props: tabs: Array<{ id, label, icon? }>, activeTab, onTabChange
// Design: 40px height, bg-bg-surface border-b border-border-subtle
// Active tab: text-text-primary with 2px bottom cyan border
// Inactive: text-text-secondary hover:text-text-primary
```

## Step 1.8 — Shared Components

### `LoadingSpinner.tsx`
```typescript
// Props: size? ('sm' | 'md' | 'lg'), color? ('cyan' | 'violet' | 'white')
// Animated rotating ring using CSS border-color
// sm: 16px, md: 24px, lg: 32px
```

### `EmptyState.tsx`
```typescript
// Props: icon, title, description, action?
// Centered layout, icon at top (32px), title in text-xl, description in text-secondary
// Optional action button below
```

### `CopyButton.tsx`
```typescript
// Props: text, size?
// Copies to clipboard on click
// Icon transitions: Copy → Check (after 1.5s reverts)
// Uses navigator.clipboard.writeText
```

### `StatusDot.tsx`
```typescript
// Props: status: 'online' | 'offline' | 'loading' | 'error'
// Colors: emerald (online), text-tertiary (offline), cyan animate-pulse (loading), error (error)
// 8px circle
```

### `CodeBlock.tsx`
```typescript
// Props: code, language, showLineNumbers?, maxHeight?
// Syntax highlighting via <code> with inline color classes
// Copy button top-right
// JetBrains Mono 12px, bg-bg-elevated, rounded-lg
```

## Step 1.9 — Demo Project Auto-Creation

On first visit (no projects in localStorage):
- Auto-create the E-Commerce demo project
- Redirect to `/studio/demo-project-ecommerce`
- Show a `"👋 Welcome! We loaded a demo project to get you started."` toast notification
- Toast: 4s duration, bottom-right, slide-in-right animation

## Step 1.10 — Not Found Page (`src/pages/NotFoundPage.tsx`)

- Dark, centered
- Large `404` in Space Grotesk 96px gradient-text-cyan
- "Page not found" subtitle
- "Back to Studio" button

---

### PHASE 1 STOP ✋

> **Claude Code must output:**
>
> ```
> ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
> PHASE 1 COMPLETE — App Shell, Landing Page & Navigation
> ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
> ✅ Landing page: hero, feature grid, footer
> ✅ Router: / and /studio routes working
> ✅ AppShell: grid layout, sidebar, topbar, tab nav
> ✅ ProjectSwitcher: create project dialog, template selection
> ✅ Sidebar: 4 nav items, collapse/expand, active states
> ✅ Demo project: auto-created on first visit
> ✅ Welcome toast: displays on first load
> ✅ All shared components: Spinner, EmptyState, CopyButton, StatusDot, CodeBlock
> ✅ Responsive: sidebar collapses on < 1024px
> ✅ Routes: / → Landing, /studio → Studio, * → 404
> ⚠️  Deviations: [any, with reason]
>
> Routes live:
>   / → Landing Page
>   /studio → Studio (redirects to demo project)
>   /studio/demo-project-ecommerce → Studio with demo project
>   * → 404
> ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
> Phase 1 complete. Continue to Phase 2?
> Reply 'Yes, Proceed' to continue.
> ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
> ```

---

# PHASE 2 — Schema Designer & ER Visualizer

## Objective
Build the Schema Designer (AI-prompted schema generation with mock simulation) and the ER Visualizer (React Flow interactive diagram). Both features must be fully functional with mock data.

**Deliverable:** `/studio` → Schema Designer tab generates schemas from prompts. ER Visualizer tab shows interactive diagrams of the generated schema.

---

## Step 2.1 — Schema Simulator (`src/lib/simulation/schemaSimulator.ts`)

```typescript
// simulateSchemaGeneration(prompt: string, target: DatabaseTarget, convention: NamingConvention): Promise<SchemaDefinition>
// Logic:
// 1. Normalize prompt to lowercase
// 2. Score each template (e-commerce, blog, inventory, saas, social) by keyword matches
// 3. Select highest-scoring template as base
// 4. Apply naming convention transformations (snake_case, PascalCase, prefix/suffix)
// 5. Generate DDL string via generateDDL() from schemaHelpers
// 6. Generate MongoDB schema if target is mongodb/firestore
// 7. Add a fake explanation paragraph
// 8. Simulate delay: Math.random() * 600 + 400 ms
// 9. Return complete SchemaDefinition

// Keywords map:
// e-commerce: ['shop', 'store', 'product', 'order', 'cart', 'payment', 'checkout', 'inventory']
// blog: ['blog', 'post', 'article', 'comment', 'tag', 'author', 'publish', 'content']
// inventory: ['inventory', 'warehouse', 'stock', 'supplier', 'purchase', 'sku', 'supply']
// saas: ['saas', 'subscription', 'plan', 'org', 'team', 'billing', 'usage', 'tenant', 'workspace']
// social: ['social', 'follow', 'like', 'friend', 'profile', 'feed', 'message', 'notification']
```

## Step 2.2 — Schema Designer (`src/features/schema-designer/SchemaDesigner.tsx`)

**Layout:** 3-column (left prompt panel / center editor / right DDL preview):

```
┌─────────────────┬──────────────────────────┬──────────────┐
│ Prompt & Config │  Table/Column Editor      │ DDL Preview  │
│    (280px)      │     (fills)               │   (320px)    │
└─────────────────┴──────────────────────────┴──────────────┘
```

On mobile (< 768px): stack vertically.

### `SchemaPromptInput.tsx`

**Design:**
- Panel with `surface` class, 280px wide
- Header: "AI Schema Generator" in DM Sans 15px 600 + cyan StatusDot
- Textarea: JetBrains Mono 13px, dark bg, cyan focus border, 120px height, placeholder "Describe your database... e.g., 'Create a multi-tenant SaaS platform with user roles and subscriptions'"
- Target selector: horizontal pill buttons (PostgreSQL · MySQL · SQLite · MongoDB · Firestore) with DB icons, active gets cyan bg
- Naming convention accordion (collapsed by default):
  - Table case: snake_case / PascalCase / camelCase
  - Column case: snake_case / camelCase
  - Prefix input (optional)
- `Generate Schema` button: full-width, primary cyan, Lucide `Sparkles` icon
- Loading state: button shows spinner + "Generating..." text, textarea disabled
- History: last 3 prompts shown as clickable chips below button

### `SchemaEditor.tsx`

**Design:** Center panel, scrollable:
- Table list in a sidebar-within-panel (collapsible, shows table names as clickable rows)
- Active table shows in the main editor area:
  - Table name (editable inline H2)
  - Column table: each row = one column with inline editable cells:
    - Name (text input)
    - Type (select dropdown)
    - Length (number input, only if applicable)
    - Checkboxes: Nullable / PK / Unique
    - References (popover: select table + column)
    - Delete row button (trash icon, appears on hover)
  - `+ Add Column` button at bottom of table
- `+ Add Table` button at the panel's top-right
- Delete Table: confirmation dialog before deleting
- Auto-save debounced (500ms) to ProjectContext on any change

### `SchemaDDLPreview.tsx`

**Design:** Right panel, 320px:
- Tabs: `DDL` | `NoSQL` | `JSON`
- Each tab: scrollable code block (JetBrains Mono 12px, syntax colored)
- Top-right: CopyButton + Download button (downloads as .sql or .json)
- Live update: re-generates DDL whenever SchemaEditor changes
- `Explanation` section below code: collapsible, shows the AI-generated explanation text in italic text-secondary

### AI Generation Flow (complete UX):

1. User types prompt, selects target, clicks Generate
2. Button enters loading state (spinner)
3. `simulateSchemaGeneration()` runs (400-1000ms delay)
4. On completion: populate SchemaEditor + DDLPreview
5. Show success toast: "Schema generated — 6 tables, 48 columns"
6. Auto-switch to ER Visualizer tab (with a 600ms delay)

## Step 2.3 — ER Visualizer (`src/features/visualizer/SchemaVisualizer.tsx`)

**Design:** Full-panel React Flow canvas with dark background.

```
Background: dot pattern (React Flow MiniMap uses it; also add custom bg-[#0A0C10])
Controls: zoom in/out/fit buttons (custom styled, bottom-right)
MiniMap: bottom-right, bg-bg-elevated, node color = cyan-dim
```

### `TableNode.tsx` (Custom React Flow Node)

**Design — this must look exceptional:**
- Container: `surface-elevated` bg, `panel-border-cyan` border, `shadow-cyan` glow, rounded-lg
- Header: dark gradient row — table name in DM Sans 14px 600, DB target badge right
- Column rows: each column shows name + type badge. PK rows have a golden key icon. FK rows have a link icon.
- Hover state: border brightens, slight glow increase
- Min width: 200px, max: 280px
- Selected state: cyan border + stronger glow, shows selection outline

### `RelationshipEdge.tsx` (Custom React Flow Edge)

- Smooth bezier curve in rgba(0,212,255,0.5)
- Label in mono 10px showing relationship type (1:N, N:N, 1:1)
- Animated dash on hover

### `NodeDetailPanel.tsx`

Slides in from right when a table node is clicked:
- `surface-elevated` panel, 300px wide, full height
- Table name + column count
- Full column list with all details (type, constraints, references)
- "Where used" section: mock list of tables that reference this one
- "Impact Analysis" toggle: expands to show mock affected views and API endpoints
- Close button (X) top-right

### `VisualizerToolbar.tsx`

Top-left of canvas:
- `Auto Layout` button — runs Dagre algorithm to arrange nodes in a left-to-right hierarchy
- `Fit View` button
- `Export PNG` button (React Flow's `toBlob` or `toPng`)
- View toggles: `Show Types` / `Show Indexes` / `Compact Mode`
- Search input: filters/highlights nodes by table name

### Dagre Auto-Layout (`hooks/useFlowLayout.ts`)

```typescript
// useFlowLayout(nodes, edges) → { layoutedNodes, layoutedEdges }
// Uses dagre to compute x,y positions
// Direction: LR (left-to-right)
// Node size: 200 x (columns.length * 28 + 48)
// Animate position changes with React Flow's fitView
```

---

### PHASE 2 STOP ✋

> **Claude Code must output:**
>
> ```
> ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
> PHASE 2 COMPLETE — Schema Designer & ER Visualizer
> ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
> ✅ SchemaPromptInput: prompt textarea, target selector, naming conventions
> ✅ simulateSchemaGeneration: [N] templates, keyword scoring, delay simulation
> ✅ SchemaEditor: table list, column editor, inline editing, add/delete
> ✅ SchemaDDLPreview: SQL/NoSQL/JSON tabs, copy/download
> ✅ Auto-save: debounced to ProjectContext
> ✅ React Flow canvas: custom nodes, edges, minimap, controls
> ✅ TableNode: column rows, PK/FK icons, hover/selected states
> ✅ RelationshipEdge: bezier curve, relationship labels
> ✅ NodeDetailPanel: slide-in, column list, impact analysis
> ✅ Dagre auto-layout: working, animates on trigger
> ✅ VisualizerToolbar: layout, fit, export, search, toggles
>
> Tested scenarios:
>   [1] Prompt: "e-commerce with products and orders" → [N] tables generated
>   [2] Prompt: "blog with comments" → [N] tables generated
>   [3] Auto-layout: nodes arrange correctly
>   [4] Node click: detail panel opens/closes
>   [5] DDL copy: copies to clipboard
> ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
> Phase 2 complete. Continue to Phase 3?
> Reply 'Yes, Proceed' to continue.
> ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
> ```

---

# PHASE 3 — Query Editor

## Objective
Build the full-featured SQL/Query editor with Monaco Editor, AI-assisted query generation, mock execution engine, results panel (table + JSON views), explain plan, and query history.

**Deliverable:** Query Editor tab fully functional with mock query execution, AI generation, optimization suggestions, and history persistence.

---

## Step 3.1 — Query Simulator (`src/lib/simulation/querySimulator.ts`)

```typescript
// simulateQueryExecution(sql: string, schema: SchemaDefinition): Promise<QueryResult>
// Logic:
// 1. Parse query type (SELECT/INSERT/UPDATE/DELETE/CREATE/etc.)
// 2. For SELECT: extract table name, generate 5-8 mock rows matching schema columns
// 3. For INSERT/UPDATE/DELETE: return { rowCount: 1, executionMs: random, message: "1 row affected" }
// 4. For invalid SQL: return { error: "Syntax error near..." }
// 5. Simulate delay: 200-800ms

// simulateQueryExplain(sql: string): Promise<ExplainPlan>
// Returns fake explain plan with steps, costs, row estimates

// simulateQueryOptimize(sql: string, schema: SchemaDefinition): Promise<string[]>
// Returns 2-4 optimization suggestions:
// ["Consider adding an index on users.email", "Use LIMIT to reduce result size", ...]

// simulateQueryTranslate(sql: string): Promise<string>
// Converts simple SELECT to MongoDB aggregation pipeline string

// simulateQueryGeneration(prompt: string, schema: SchemaDefinition): Promise<string>
// Maps prompt keywords to pre-built query templates using schema table names
```

## Step 3.2 — Query Editor (`src/features/query-editor/QueryEditor.tsx`)

**Layout:**

```
┌──────────────────────────────────────────────────────────┐
│  QueryToolbar (48px)                                     │
├─────────────────────────────────┬────────────────────────┤
│  Monaco Editor (50% height)     │  QueryHistory (280px)  │
├─────────────────────────────────┤  (collapsible)         │
│  ResultsPanel (50% height)      │                        │
└─────────────────────────────────┴────────────────────────┘
```

Panels are resizable (drag divider). History panel collapses to an icon strip.

### `QueryToolbar.tsx`

Buttons in order:
- `▶ Run Query` — emerald, keyboard shortcut `Ctrl+Enter` / `Cmd+Enter`
- `Explain` — ghost, Lucide `GitBranch` icon
- `→ NoSQL` — ghost, "Translate to MongoDB"
- `✦ Optimize` — ghost, violet accent
- Separator
- `AI Generate` — cyan, Lucide `Sparkles` icon — opens `AIQueryPrompt` panel
- Separator
- Database selector mini-badge (shows current project's DB target)
- Keyboard shortcut tooltip on hover for each button

### Monaco Editor Setup

```typescript
// Language: 'sql' (built-in Monaco SQL support)
// Theme: custom dark theme matching DBForge palette:
//   background: #0F1117
//   foreground: #F0F4FF
//   keywords: #C678DD (violet)
//   strings: #98C379 (green)
//   numbers: #D19A66 (amber)
//   comments: #5C6370 (gray)
//   functions: #61AFEF (blue)
// Options:
//   minimap: { enabled: false }
//   fontSize: 14
//   lineHeight: 22
//   fontFamily: 'JetBrains Mono'
//   padding: { top: 16, bottom: 16 }
//   scrollBeyondLastLine: false
//   automaticLayout: true
// Autocomplete: register schema table/column names as SQL completion items
```

### `AIQueryPrompt.tsx`

Slides in as a side panel (right, 320px):
- Header: "AI Query Generator" + Sparkles icon
- Textarea: "Describe what you want to query..."
- Example chips below textarea: "Find top 10 customers by order total", "Get all products with low stock", "Users who haven't logged in for 30 days"
- `Generate` button
- Generated query inserts into Monaco editor
- Closes panel after generation

### `ResultsPanel.tsx`

- Tabs: `Results` | `Explain Plan` | `JSON View`
- Affixes: `[N] rows · [Xms]` in mono text-secondary right-aligned
- Error state: red border, error message in mono

### `ResultsTable.tsx`

- Styled data table: column headers in text-tertiary mono uppercase, sticky header
- Alternating rows: `bg-bg-surface` / `bg-bg-elevated`
- Cell text: JetBrains Mono 12px
- NULL values: styled as `NULL` badge in text-tertiary italic
- Number columns: right-aligned
- Horizontal scroll when columns overflow
- Column header click to sort (client-side, ascending/descending)
- Row count badge at top-right: `5 rows`

### Explain Plan Display

Visual explain plan tree:
- Each step as a card: operation + table + cost + rows
- Steps connected with vertical lines
- Color coding: `Seq Scan` = warning, `Index Scan` = emerald, `Hash Join` = cyan
- Total cost and row estimate at bottom

### `QueryHistory.tsx`

- List of past queries (from localStorage, per-project)
- Each item: first line of SQL (truncated) + timestamp + execution time
- Click to load into editor
- Delete individual entries (X button on hover)
- Clear all button at top
- Max 50 entries stored

---

### PHASE 3 STOP ✋

> **Claude Code must output:**
>
> ```
> ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
> PHASE 3 COMPLETE — Query Editor
> ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
> ✅ Monaco editor: custom dark theme, SQL syntax highlighting
> ✅ Query toolbar: Run, Explain, Translate, Optimize, AI Generate
> ✅ Ctrl+Enter shortcut: executes query
> ✅ simulateQueryExecution: SELECT returns mock rows, DML returns affected count
> ✅ ResultsTable: sortable columns, NULL badges, horizontal scroll
> ✅ Explain plan: visual tree with operation types
> ✅ JSON view: prettified result
> ✅ AI Query Generator: slide-in panel, example chips, inserts to editor
> ✅ Query History: persisted, clickable, deletable
> ✅ Optimization suggestions: 2-4 tips returned
> ✅ NoSQL translation: MongoDB aggregation pipeline output
>
> Tested scenarios:
>   [1] SELECT * FROM users → [N] mock rows displayed
>   [2] INSERT INTO → "1 row affected" message
>   [3] Invalid SQL → error displayed
>   [4] AI Generate: "top customers" → SQL inserted
>   [5] History: query saved and reloaded correctly
> ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
> Phase 3 complete. Continue to Phase 4?
> Reply 'Yes, Proceed' to continue.
> ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
> ```

---

# PHASE 4 — API Checker (Postman-Like)

## Objective
Build the full API Checker — request builder, mock response viewer, API flow builder, test generator, and environment variables panel. All execution is simulated locally.

**Deliverable:** API Checker tab fully functional with mock HTTP calls, flow builder, test generation, and environment management.

---

## Step 4.1 — API Simulator (`src/lib/simulation/apiSimulator.ts`)

```typescript
// simulateApiCall(request: APIRequest, schema: SchemaDefinition, env: APIEnvironment): Promise<APIResponse>
// Logic:
// 1. Resolve env variables in URL/headers (replace {{base_url}} etc.)
// 2. Parse URL to extract /api/{table} pattern
// 3. Match against schema tables
// 4. Generate response based on method:
//    GET /api/{table} → { data: mockRows, total: N, page: 1, limit: 10 }
//    GET /api/{table}/:id → single mock object or 404
//    POST /api/{table} → validate body, return created object with ID
//    PUT/PATCH /api/{table}/:id → return updated object
//    DELETE /api/{table}/:id → { message: "Deleted successfully" }
//    Non-matching URL → { error: "Not Found" } with 404
// 5. Simulate delay: 100-600ms
// 6. Return complete APIResponse with status, headers, body, timeMs

// simulateValidation(body: string, schema: SchemaDefinition, tableName: string): ValidationResult
// Checks required fields, correct types against schema column definitions

// simulateTestGeneration(request: APIRequest, schema: SchemaDefinition): APITest[]
// Generates 4-6 test cases:
//   "Status should be 200", "Response should have 'data' field",
//   "POST with missing required field should return 422", etc.
```

## Step 4.2 — API Checker Layout (`src/features/api-checker/APIChecker.tsx`)

**Tabs:** `Request Builder` | `API Flow` | `Test Suite` | `Environments`

## Step 4.3 — Request Builder (`src/features/api-checker/RequestBuilder.tsx`)

**Layout:** Left request panel / Right response panel:

```
┌─────────────────────────────┬────────────────────────────┐
│  Method + URL + Send        │                            │
├─────────────────────────────┤  ResponseViewer            │
│  Tabs: Params/Headers/Body  │                            │
│  /Auth/Pre-request          │                            │
└─────────────────────────────┴────────────────────────────┘
```

**Method selector:**
- Dropdown pill showing method with color coding (GET=emerald, POST=info, PUT=warning, DELETE=error, PATCH=violet)
- HTTP_METHOD_COLORS from constants

**URL input:**
- Full-width text input, monospace font
- Variable detection: `{{variable}}` highlighted in cyan within the input (use a custom overlay or contentEditable approach)
- `Import from Schema` button: opens dropdown with auto-generated REST endpoints from schema tables

**Request tabs:**

- `Params` — `KeyValueEditor` table (see shared/KeyValueEditor.tsx)
- `Headers` — same `KeyValueEditor`
- `Body` — body type selector (JSON/Form-Data/Raw/None) + Monaco Editor for JSON body (smaller instance, 200px height)
- `Auth` — auth type selector (None/Bearer Token/Basic/API Key) + relevant input fields
- `Pre-request` — textarea for JS code (mock, no execution)

### `KeyValueEditor.tsx` (shared)

```typescript
// Editable table of key-value pairs
// Each row: enabled toggle + key input + value input + delete button
// + Add Row button at bottom
// Props: pairs, onChange
```

### `ResponseViewer.tsx`

**Design:** Right panel, shows after "Send":

- Status badge: `200 OK` with color coding (2xx=emerald, 4xx=warning, 5xx=error)
- Meta row: `[Xms] · [N bytes] · [content-type]` in mono text-secondary
- Tabs: `Body` | `Headers` | `DB Assertion` | `Tests`
- Body tab: Monaco Editor (read-only, prettified JSON, syntax highlighted)
- Headers tab: table of response headers
- DB Assertion tab: mock result — `✔ Record confirmed in users table` or `✗ Record not found` (simulated)
- Tests tab: list of auto-generated tests with pass/fail badges

**Before sending:** Show `EmptyState` with "Configure your request and click Send"
**Loading state:** Skeleton rows in response area + animated status badge

## Step 4.4 — API Flow Builder (`src/features/api-checker/APIFlowBuilder.tsx`)

**Concept:** Chain multiple API calls in sequence — like Postman Collection Runner.

**Layout:**
- Left: flow steps list (vertical, reorderable via drag)
- Right: step detail (shows request + response for selected step)
- Bottom: `▶ Run Flow` button

**Flow Step:**
- Each step: numbered badge + step name + method badge + URL (truncated)
- Add Step: opens a request picker (from saved requests in project) or "new blank step"
- Between steps: arrow showing data flow

**Run Flow:**
- Executes all steps sequentially using `simulateApiCall`
- Each step animates through: pending → running → success/error
- Timeline at bottom shows all steps with timing bars
- Summary: `4/5 steps passed · 1 failed · Total: 892ms`

## Step 4.5 — Test Generator (`src/features/api-checker/TestGenerator.tsx`)

- `Generate Tests` button triggers `simulateTestGeneration()`
- Displays list of test cases with:
  - Test name
  - Assertion code snippet (mono)
  - Run button per test (always simulates pass/fail)
- `Run All Tests` button: runs all, shows results
- Results: pass count, fail count, execution time
- Export Tests button: copies test list as JSON

## Step 4.6 — Environment Panel (`src/features/api-checker/EnvironmentPanel.tsx`)

- Sidebar-style panel (or full-width tab)
- Multiple environments (dev, staging, prod) — create/delete environments
- Each env: list of variables via `KeyValueEditor`
- Active environment selector at top — changes which env variables are resolved in requests
- Secret values: toggle to show/hide (password input style)

---

### PHASE 4 STOP ✋

> **Claude Code must output:**
>
> ```
> ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
> PHASE 4 COMPLETE — API Checker
> ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
> ✅ Request Builder: method selector, URL, params/headers/body/auth tabs
> ✅ simulateApiCall: GET/POST/PUT/DELETE mock responses from schema
> ✅ ResponseViewer: status badge, body/headers/DB assertion/tests tabs
> ✅ Variable resolution: {{variable}} works in URL and headers
> ✅ Import from Schema: auto-generates endpoint suggestions
> ✅ API Flow Builder: chained steps, sequential run, timeline
> ✅ Test Generator: auto-generated tests, run all, export
> ✅ Environment Panel: multi-env, variable editor, active env selector
> ✅ DB Assertion mock: simulated post-call verification
>
> Tested scenarios:
>   [1] GET /api/users → 200 with mock user array
>   [2] POST /api/users (missing required field) → 422 validation error
>   [3] DELETE /api/users/1 → 200 success message
>   [4] Non-matching URL → 404 response
>   [5] Flow: 3-step chain runs sequentially with results
>   [6] Variable: {{base_url}}/api/users resolves correctly
> ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
> Phase 4 complete. Continue to Phase 5?
> Reply 'Yes, Proceed' to continue.
> ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
> ```

---

# PHASE 5 — Backend Infrastructure (Express + MongoDB)

## Objective
Build the complete Node.js + Express + MongoDB backend inside `backend/`. Replace all mock functions with real API calls. Deploy backend to **Render Web Services**. Connect frontend on Vercel to Render backend.

**Deliverable:** Running backend at `api.dbforge.app` (or Render URL). All frontend features wired to real backend. MongoDB stores all project data.

---

## Step 5.1 — Backend Project Setup

```bash
mkdir backend && cd backend
npm init -y
npm install express mongoose dotenv cors helmet morgan jsonwebtoken bcryptjs uuid express-rate-limit

npm install -D typescript ts-node nodemon @types/express @types/mongoose @types/cors @types/node @types/jsonwebtoken @types/bcryptjs @types/morgan

npx tsc --init
```

### Directory structure:
```
backend/src/
├── app.ts              # Express app setup
├── server.ts           # HTTP server + port binding
├── config/
│   ├── db.ts           # MongoDB connection (Mongoose)
│   └── env.ts          # Validated env vars
├── middleware/
│   ├── auth.ts         # JWT verification
│   ├── errorHandler.ts # Global error handler
│   ├── rateLimiter.ts  # express-rate-limit config
│   └── validate.ts     # Request validation
├── models/
│   ├── User.ts         # User schema
│   └── Project.ts      # Project schema (embeds schema, queries, API defs)
├── routes/
│   ├── auth.routes.ts
│   ├── project.routes.ts
│   ├── schema.routes.ts
│   ├── query.routes.ts
│   └── api.routes.ts
├── controllers/
│   ├── auth.controller.ts
│   ├── project.controller.ts
│   ├── schema.controller.ts
│   ├── query.controller.ts
│   └── api.controller.ts
├── services/
│   ├── ai.service.ts       # LLM integration (Anthropic/OpenAI)
│   ├── schema.service.ts
│   └── query.service.ts
└── types/
    └── index.ts
```

## Step 5.2 — MongoDB Models

### `User.ts`
```typescript
const UserSchema = new Schema({
  email:     { type: String, required: true, unique: true, lowercase: true },
  password:  { type: String, required: true, select: false },
  name:      { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
})
```

### `Project.ts`
```typescript
// Embeds full project data in one MongoDB document
// Schema matches the TypeScript Project interface from frontend/src/types/
// Includes: schema definition, queries[], apiRequests[], environments[]
// userId: ObjectId reference to User
// Use Mongoose timestamps option
```

## Step 5.3 — API Endpoints

```
AUTH
POST   /api/auth/register    → create user, return JWT
POST   /api/auth/login       → verify credentials, return JWT
GET    /api/auth/me          → current user (JWT required)

PROJECTS
GET    /api/projects         → list user's projects (metadata only)
POST   /api/projects         → create project
GET    /api/projects/:id     → get full project
PUT    /api/projects/:id     → update project (full document replace)
DELETE /api/projects/:id     → delete project

SCHEMA AI
POST   /api/schema/generate  → real LLM call, returns SchemaDefinition
POST   /api/schema/validate  → validate schema structure

QUERY AI
POST   /api/query/generate   → real LLM query generation
POST   /api/query/optimize   → real LLM optimization suggestions
POST   /api/query/translate  → real LLM NoSQL translation
POST   /api/query/execute    → stub (Phase 6 adds real DB connectors)

API TEST
POST   /api/request/send     → backend proxy for real HTTP calls (Phase 6)
```

## Step 5.4 — Real AI Integration (`services/ai.service.ts`)

```typescript
// Provider: Anthropic Claude (primary) or OpenAI (fallback)
// Environment variables: ANTHROPIC_API_KEY or OPENAI_API_KEY

// generateSchema(prompt: string, target: DatabaseTarget, convention: NamingConvention): Promise<SchemaDefinition>
// System prompt instructs LLM to output ONLY valid JSON matching SchemaDefinition type
// Response parsing: extract JSON from LLM response, validate, return
// Error handling: if JSON invalid, retry once with stricter prompt

// generateQuery(prompt: string, schema: SchemaDefinition): Promise<string>
// Returns raw SQL string

// optimizeQuery(sql: string, schema: SchemaDefinition): Promise<string[]>
// Returns array of suggestion strings

// translateToNoSQL(sql: string): Promise<string>
// Returns MongoDB aggregation pipeline as formatted string
```

## Step 5.5 — Frontend → Backend Wiring

```typescript
// src/lib/api/client.ts — Axios instance
import axios from 'axios'

const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  headers: { 'Content-Type': 'application/json' },
})

// Request interceptor: add JWT from localStorage
// Response interceptor: handle 401 (clear token, redirect to login)
```

```typescript
// src/lib/api/projects.ts
export const projectsAPI = {
  list: () => apiClient.get('/api/projects'),
  get: (id: string) => apiClient.get(`/api/projects/${id}`),
  create: (data: Partial<Project>) => apiClient.post('/api/projects', data),
  update: (id: string, data: Partial<Project>) => apiClient.put(`/api/projects/${id}`, data),
  delete: (id: string) => apiClient.delete(`/api/projects/${id}`),
}
```

Replace mock functions in each feature with real API calls:
- `simulateSchemaGeneration` → `apiClient.post('/api/schema/generate', ...)`
- `simulateQueryGeneration` → `apiClient.post('/api/query/generate', ...)`
- localStorage → `projectsAPI` calls

**Feature flag:** Keep `VITE_USE_MOCK=true` in `.env.local` for offline development. All API calls check this flag and fall back to simulators.

## Step 5.6 — Authentication UI

### `LoginPage.tsx` / `RegisterPage.tsx`

Simple centered dark card:
- DBForge logo at top
- Email + Password inputs
- Submit button (primary cyan)
- Toggle link: "Don't have an account? Register"
- Error display below form
- Redirect to `/studio` after success

Store JWT in `localStorage['dbforge_token']`.

## Step 5.7 — Render Deployment (`backend/render.yaml`)

```yaml
services:
  - type: web
    name: dbforge-backend
    env: node
    buildCommand: npm install && npm run build
    startCommand: npm start
    envVars:
      - key: MONGODB_URI
        sync: false   # Set in Render dashboard
      - key: JWT_SECRET
        sync: false
      - key: ANTHROPIC_API_KEY
        sync: false
      - key: FRONTEND_URL
        value: https://dbforge.vercel.app
      - key: NODE_ENV
        value: production
```

```json
// backend/package.json scripts
{
  "build": "tsc",
  "start": "node dist/server.js",
  "dev": "nodemon --exec ts-node src/server.ts"
}
```

## Step 5.8 — Vercel Frontend Update

```env
# frontend/.env.production
VITE_API_URL=https://dbforge-backend.onrender.com
VITE_USE_MOCK=false
```

```json
// frontend/vercel.json — add API proxy to avoid CORS issues during dev
{
  "rewrites": [
    { "source": "/api/(.*)", "destination": "https://dbforge-backend.onrender.com/api/$1" },
    { "source": "/(.*)", "destination": "/index.html" }
  ]
}
```

---

### PHASE 5 STOP ✋

> **Claude Code must output:**
>
> ```
> ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
> PHASE 5 COMPLETE — Backend Infrastructure
> ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
> ✅ Backend: Express + TypeScript initialized in backend/
> ✅ MongoDB: Mongoose connected, User + Project models created
> ✅ Auth: register/login/me endpoints with JWT
> ✅ Projects API: CRUD endpoints, user-scoped
> ✅ AI service: LLM integration (Anthropic/OpenAI)
> ✅ Schema generation: real LLM call replacing mock
> ✅ Query generation/optimize/translate: real LLM calls
> ✅ Frontend wired: Axios client, projectsAPI, feature flag
> ✅ Auth UI: Login + Register pages
> ✅ render.yaml: Render deployment configured
> ✅ vercel.json: API proxy configured
>
> Backend running: localhost:3001
> MongoDB: connected to [URI]
> Auth: JWT verified on protected routes
> Feature flag: VITE_USE_MOCK=true (mock still works offline)
>
> Deployment notes:
>   Frontend: push to GitHub → connect to Vercel → set env vars
>   Backend: push to GitHub → connect to Render → set env vars
> ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
> Phase 5 complete. Continue to Phase 6?
> Reply 'Yes, Proceed' to continue.
> ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
> ```

---

# PHASE 6 — Live Database Connectors & Real Query Execution

## Objective
Allow users to connect real databases, reverse-engineer their schemas, and run live queries against actual data.

**Deliverable:** Users can connect PostgreSQL, MySQL, SQLite, and MongoDB; import real schemas; run real queries.

---

## Step 6.1 — Database Connection Manager

### New UI: `DatabaseConnectionPanel.tsx`

Added as a 5th sidebar item: `Connections` — Lucide `PlugIcon`.

- "Add Connection" button opens a dialog:
  - DB type selector (PostgreSQL, MySQL, SQLite, MongoDB)
  - Connection form: host, port, database, username, password
  - SSL toggle
  - `Test Connection` button → calls backend `/api/connections/test`
  - `Save & Connect` button
- Saved connections list: status dot (green/red) + connection name + DB type badge
- Connection credentials stored encrypted in MongoDB (backend)

## Step 6.2 — Backend: Database Driver Service

```typescript
// services/dbConnector.service.ts
// Supported drivers:
//   PostgreSQL: pg (node-postgres)
//   MySQL: mysql2
//   SQLite: better-sqlite3
//   MongoDB: mongodb (native driver, separate from Mongoose)
//
// Methods:
//   testConnection(config): Promise<boolean>
//   reverseEngineerSchema(config): Promise<SchemaDefinition>
//     → Reads information_schema (SQL) or listCollections (Mongo)
//     → Returns SchemaDefinition matching our TypeScript type
//   executeQuery(config, sql): Promise<QueryResult>
//     → Runs query, returns rows, columns, executionMs, rowCount
//   getExplainPlan(config, sql): Promise<ExplainPlan>
```

## Step 6.3 — Reverse Engineering Flow

1. User clicks "Import from Database" in Schema Designer
2. Picks a saved connection
3. Backend reads `information_schema` → transforms to SchemaDefinition
4. Frontend receives and renders the schema in SchemaEditor + ER Visualizer
5. Success toast: "Imported [N] tables from [database name]"

## Step 6.4 — Live Query Execution

- Query Editor: connection selector in toolbar (dropdown of saved connections)
- If a connection is active: `▶ Run Query` calls `/api/query/execute` with real driver
- If no connection: falls back to mock simulation
- Status bar shows active connection name + green dot

## Step 6.5 — Real API Proxy (`POST /api/request/send`)

```typescript
// Receives APIRequest from frontend
// Makes real HTTP request via axios (bypasses CORS since executed server-side)
// Returns APIResponse including real status, headers, body, timing
// Rate limited: 60 requests/minute per user
```

---

### PHASE 6 STOP ✋

> **Claude Code must output:**
>
> ```
> ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
> PHASE 6 COMPLETE — Live Database Connectors
> ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
> ✅ ConnectionPanel: add/test/save connections UI
> ✅ Backend drivers: PostgreSQL, MySQL, SQLite, MongoDB
> ✅ testConnection: endpoint working
> ✅ reverseEngineerSchema: reads real DB, returns schema
> ✅ executeQuery: real query execution with results
> ✅ Query editor: connection selector, live execution
> ✅ API proxy: real HTTP calls via backend
> ✅ Supported DBs tested: [list what was tested]
> ⚠️  Deviations: [any, with reason]
> ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
> Phase 6 complete. Continue to Phase 7?
> Reply 'Yes, Proceed' to continue.
> ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
> ```

---

# PHASE 7 — Collaboration, Versioning & Comments

## Objective
Transform DBForge into a team tool — user workspaces, schema versioning with migration history, and threaded commenting.

**Deliverable:** Teams can share projects, view version history, and leave comments on tables/columns.

---

## Step 7.1 — Workspace & Sharing

### New MongoDB Models:
- `Workspace` — organization container
- `WorkspaceMember` — userId, workspaceId, role (owner/admin/editor/viewer)
- `ProjectShare` — projectId, workspaceId, permissions

### UI: `ShareDialog.tsx`

- Invite by email
- Role selector: Editor / Viewer
- Shared with list: current members + remove button
- Link sharing toggle (generate shareable read-only link)

## Step 7.2 — Schema Versioning

### `SchemaVersion` model:
```typescript
{
  projectId:  ObjectId,
  version:    number,       // Auto-incrementing
  schema:     SchemaDefinition,
  diffSummary: string,     // "Added 2 columns, modified 1 table"
  migrationSQL: string,    // Generated ALTER TABLE statements
  createdBy:  ObjectId,
  createdAt:  Date,
}
```

### `VersionHistory.tsx` — Timeline UI:

- Vertical timeline of schema versions
- Each: version number + timestamp + author + diff summary
- `View Diff` button: side-by-side comparison of two versions
- `Revert to This Version` button with confirmation dialog
- `Download Migration SQL` button for each version

### Auto-versioning:
- Every time a project schema is saved via the backend, create a new `SchemaVersion` document
- Calculate diff between current and previous version
- Generate `ALTER TABLE` SQL for the migration

## Step 7.3 — Commenting

### `Comment` model:
```typescript
{
  projectId:  ObjectId,
  targetType: 'table' | 'column' | 'query' | 'api',
  targetId:   string,
  body:       string,
  resolved:   boolean,
  replies:    Array<{ userId, body, createdAt }>,
  createdBy:  ObjectId,
  createdAt:  Date,
}
```

### UI:
- Comment icon button on each table node in ER Visualizer — shows comment count badge
- Click opens `CommentThread.tsx` popover
- Add comment textarea + submit button
- Resolve/reopen button
- Reply thread below each comment

---

### PHASE 7 STOP ✋

> **Claude Code must output the standard report and ask to proceed to Phase 8.**

---

# PHASE 8 — Advanced API Testing & Environment Management

## Objective
Upgrade the API Checker into a full Postman replacement — real scriptable tests, DB-backed assertions, environment binding, and collection management.

**Deliverable:** Real test scripts execute, DB assertions query connected databases, collections are saved and sharable.

---

## Step 8.1 — Real Test Execution

Replace mock test simulation with a sandboxed JS evaluator:
```typescript
// Use Function() constructor in a try/catch to execute user test scripts
// Provide a pm-like API: pm.response.status, pm.response.body, pm.expect()
// Capture console.log output for display
// Timeout: 3 seconds
```

## Step 8.2 — DB-Backed Assertions (Real)

After a POST/PUT/DELETE request:
- If a DB connection is active, run a real follow-up query to verify the change
- Example: after `POST /api/users` returns 201, query `SELECT * FROM users WHERE email = ?` with the posted email
- Display: `✔ Record confirmed in database` or `✗ Record not found`

## Step 8.3 — Collection Management

- Save named requests into "Collections"
- `Collection` MongoDB model: name, description, requests[], workspaceId
- Collection runner: select a collection, run all requests sequentially, see summary report

## Step 8.4 — Pre-request Scripts

Allow JS execution before each request (using sandboxed Function()):
- Set variables dynamically
- Generate auth tokens
- Transform request body

---

### PHASE 8 STOP ✋

> **Claude Code must output the standard report and ask to proceed to Phase 9.**

---

# PHASE 9 — Production Hardening, Performance & Full Deployment

## Objective
Security audit, performance optimization, production deployment of both frontend (Vercel) and backend (Render), documentation, and onboarding.

**Deliverable:** Production-ready application live on Vercel + Render. All security hardened. Documentation complete.

---

## Step 9.1 — Security Hardening

**Backend:**
- Helmet.js: all security headers enabled
- Input sanitization: sanitize all user-provided strings
- SQL injection prevention: parameterized queries in all DB connector calls
- Rate limiting: 60 req/min for AI endpoints, 200 req/min for CRUD
- JWT expiry: 7 days, refresh token pattern
- Environment validation: crash on startup if required env vars missing
- Dependency audit: `npm audit --audit-level=high`

**Frontend:**
- CSP headers in `vercel.json`
- No sensitive data in `localStorage` (tokens encrypted via simple XOR or use `httpOnly` cookies)
- Input sanitization on all form inputs

## Step 9.2 — Performance Optimization

**Frontend:**
- Code splitting: React.lazy + Suspense for each feature panel
- Monaco Editor: load lazily (it's large — ~2MB)
- React Flow: virtualize large graphs (only render visible nodes)
- TanStack Query: cache project data, stale-while-revalidate
- Bundle analysis: `npm run build -- --report`, target < 500KB initial bundle
- Image optimization: all icons as inline SVG

**Backend:**
- MongoDB indexes: `userId`, `projectId`, `email` fields indexed
- Response compression: `compression` middleware
- Connection pooling: Mongoose pool size = 10
- Caching: Redis for AI responses (same prompt = cache hit, 1hr TTL) — optional

## Step 9.3 — Full Deployment Checklist

**Frontend → Vercel:**
1. Push to GitHub
2. Connect repo to Vercel
3. Framework preset: Vite
4. Root directory: `frontend/`
5. Build command: `npm run build`
6. Output directory: `dist/`
7. Environment variables: `VITE_API_URL`, `VITE_USE_MOCK=false`
8. Custom domain setup (optional)
9. Verify: `https://[project].vercel.app` loads correctly

**Backend → Render:**
1. Push to GitHub
2. New Web Service on Render
3. Root directory: `backend/`
4. Build command: `npm install && npm run build`
5. Start command: `npm start`
6. Environment variables: `MONGODB_URI`, `JWT_SECRET`, `ANTHROPIC_API_KEY`, `FRONTEND_URL`
7. Health check path: `/api/health`
8. Auto-deploy: enable
9. Verify: `https://[service].onrender.com/api/health` returns `{ status: 'ok' }`

## Step 9.4 — Documentation

### `README.md` (root):
- Project description + screenshot
- Tech stack
- Quick start (`npm install && npm run dev` in frontend/)
- Environment variables reference
- Project structure overview
- Deployment guide (Vercel + Render step-by-step)
- API documentation (all endpoints)
- Contributing guide

### In-app onboarding:
- First-time user tooltip tour (4 steps): Schema Designer → ER Visualizer → Query Editor → API Checker
- Each tool has a `?` help icon opening a feature explainer modal
- Keyboard shortcuts modal (`?` key)

## Step 9.5 — Final QA Checklist

```
FRONTEND
[ ] Landing page: loads, all sections display, CTA routes to /studio
[ ] Project create: all 5 templates work
[ ] Schema Designer: generate from 5 different prompts, all produce schemas
[ ] ER Visualizer: nodes render, drag, auto-layout, node detail opens
[ ] Query Editor: run SELECT, INSERT, UPDATE, DELETE; AI generate; history
[ ] API Checker: GET/POST/PUT/DELETE; flow builder; test generator; env vars
[ ] Project export/import: round-trip JSON works
[ ] Authentication: register, login, logout, protected routes

BACKEND
[ ] All endpoints return correct status codes
[ ] Auth: JWT validation, expired token rejected
[ ] AI: real LLM responses for schema/query generation
[ ] DB connectors: test connection works for each supported DB
[ ] Rate limiting: 61st request returns 429

PERFORMANCE
[ ] Initial bundle < 500KB (Monaco lazy loaded)
[ ] LCP < 2.5s on Vercel
[ ] API response < 500ms for CRUD (excluding AI calls)

SECURITY
[ ] Helmet headers present in all responses
[ ] No API keys in frontend code or git history
[ ] SQL injection test: parameterized queries not vulnerable

DEPLOYMENT
[ ] Frontend: live on Vercel URL
[ ] Backend: live on Render URL, health check passing
[ ] CORS: frontend domain allowed on backend
[ ] Env vars: no .env files committed to git
```

---

### PHASE 9 STOP ✋ — FINAL PHASE

> **Claude Code must output:**
>
> ```
> ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
> PHASE 9 COMPLETE — Production Hardening & Deployment
> DBFORGE AI STUDIO — ALL PHASES COMPLETE
> ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
>
> DEPLOYMENT STATUS:
> ✅ Frontend: live at https://[project].vercel.app
> ✅ Backend:  live at https://[service].onrender.com
> ✅ Health check: passing
> ✅ npm run build: 0 errors, 0 warnings
>
> FINAL QA:
>   Frontend:    [N/N] checks passing
>   Backend:     [N/N] checks passing
>   Performance: [N/N] checks passing
>   Security:    [N/N] checks passing
>   Deployment:  [N/N] checks passing
>
> TOTAL FILES CREATED: [N]
> TOTAL COMPONENTS BUILT: [N]
> TOTAL API ENDPOINTS: [N]
>
> KNOWN LIMITATIONS:
>   • SQLite connector: local file only, not suitable for Render deployment
>   • Redis caching: optional, not implemented (AI responses not cached)
>   • Real-time collaboration: WebSocket planned for future phase
>   • Monaco Editor: ~2MB bundle, loaded lazily
>
> FUTURE ENHANCEMENTS:
>   • WebSocket real-time presence (who is viewing a project)
>   • GitHub integration (export schema as migration files to repo)
>   • More AI providers (Gemini, Llama via Ollama)
>   • CLI tool for schema generation outside the browser
>
> ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
> DBForge AI Studio frontend and backend implementation complete.
> Both services deployed and production-ready.
> ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
> ```

---

## Appendix A — MERN Stack Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                     VERCEL (Frontend)                       │
│  React 18 + Vite + TypeScript + Tailwind + shadcn/ui        │
│                                                             │
│  /             → Landing Page                               │
│  /studio       → Studio Shell                               │
│  /studio/:id   → Project Studio                             │
│                                                             │
│  Phases 0-4: All mock/simulation locally                    │
│  Phase 5+:   Axios → Render backend                         │
└───────────────────────────┬─────────────────────────────────┘
                            │ HTTPS (axios)
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                   RENDER (Backend)                          │
│  Node.js + Express + TypeScript                             │
│                                                             │
│  /api/auth/*       → JWT authentication                     │
│  /api/projects/*   → Project CRUD                           │
│  /api/schema/*     → AI schema generation                   │
│  /api/query/*      → AI query generation + execution        │
│  /api/request/*    → HTTP proxy for API checker             │
│  /api/connections/ → DB connector management                │
└───────────────────────────┬─────────────────────────────────┘
                            │ Mongoose
                            ▼
┌─────────────────────────────────────────────────────────────┐
│               MongoDB Atlas (Cloud)                         │
│  Collections: users, projects, connections, comments,       │
│               schema_versions, collections, workspaces      │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│            Anthropic / OpenAI (AI Provider)                 │
│  Schema generation, query generation, optimization,         │
│  NoSQL translation — all via backend service layer          │
└─────────────────────────────────────────────────────────────┘
```

## Appendix B — Environment Variables Reference

### Frontend (`frontend/.env`)
```env
VITE_APP_NAME=DBForge AI Studio
VITE_APP_VERSION=1.0.0
VITE_API_URL=http://localhost:3001       # Render URL in production
VITE_USE_MOCK=true                       # false in production
```

### Backend (`backend/.env`)
```env
PORT=3001
NODE_ENV=development
MONGODB_URI=mongodb+srv://...
JWT_SECRET=your-secret-key-min-32-chars
JWT_EXPIRES_IN=7d
ANTHROPIC_API_KEY=sk-ant-...
OPENAI_API_KEY=sk-...                    # Fallback provider
FRONTEND_URL=http://localhost:5173       # Vercel URL in production
```

## Appendix C — Phase Summary Table

| Phase | What's Built | Frontend/Backend | Data |
|---|---|---|---|
| 0 | Bootstrap, design system, types, mock data | Frontend | Mock |
| 1 | Landing page, app shell, navigation | Frontend | Mock |
| 2 | Schema Designer + ER Visualizer | Frontend | Mock AI |
| 3 | Query Editor (Monaco + mock execution) | Frontend | Mock |
| 4 | API Checker (Postman-like, mock HTTP) | Frontend | Mock |
| 5 | Express backend, MongoDB, real LLM, Vercel+Render deploy | Full Stack | Real |
| 6 | DB connectors, live query execution, real API proxy | Full Stack | Real |
| 7 | Collaboration, versioning, comments | Full Stack | Real |
| 8 | Advanced API testing, real test execution, collections | Full Stack | Real |
| 9 | Security, performance, production hardening, final QA | Full Stack | Production |

---

## Appendix D — Key Design Decisions vs Original Plan

| Original Plan | This Implementation | Reason |
|---|---|---|
| React + Vite (frontend only) | MERN Stack (React + Express + MongoDB) | Full-stack per user request |
| localStorage only | MongoDB (Phase 5+) with localStorage fallback | Production-grade persistence |
| Mock AI only | Real LLM via Anthropic/OpenAI (Phase 5+) | Real intelligence |
| Unnamed CSS framework | Tailwind + shadcn/ui | Consistency + speed |
| No auth | JWT authentication (Phase 5) | Multi-user required |
| No deployment spec | Vercel (frontend) + Render (backend) | Per user specification |
| Single phase frontend | Phase-gated (0-4 frontend, 5-9 backend) | Frontend-first approach |
| Basic mock API | Full API simulator with schema-aware responses | Better prototype fidelity |
| No UI spec | Full dark developer tool design system | Professional quality |

---

*Document prepared for Claude Code execution · DBForge AI Studio · MERN Stack*
*Frontend deployed to Vercel · Backend deployed to Render Web Services*
*Total phases: 0–9 (10 phases) · Estimated components: 60+ · API endpoints: 20+*
*Approach: Frontend-first prototype → real backend swap at Phase 5*