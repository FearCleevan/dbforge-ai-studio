# DBForge AI Studio — Manual QA Checklist

## Setup
- [ ] Backend running: http://localhost:3001/api/health → `{"status":"ok"}`
- [ ] Frontend running: http://localhost:5173 → landing page loads
- [ ] No console errors in browser DevTools on initial load

---

## Landing Page
- [ ] Hero section renders (headline, subheadline, CTA button)
- [ ] "Start Building Free" / CTA button routes to `/studio/demo`
- [ ] Login / Register links in nav work
- [ ] Page is responsive (resize to 768px width)

---

## Authentication
- [ ] Register with new email → redirects to studio, JWT stored in localStorage
- [ ] Register with duplicate email → shows error message
- [ ] Login with correct credentials → redirects to studio
- [ ] Login with wrong password → shows error message
- [ ] Logout → clears token, redirects to /login
- [ ] Protected route `/studio/abc` without auth → loads in demo mode (not crash)
- [ ] `/api/auth/me` with expired/missing token → 401 (check Network tab)

---

## Schema Designer
- [ ] Prompt input accepts text
- [ ] Select database target (PostgreSQL, MySQL, SQLite, MongoDB, Firestore)
- [ ] Click Generate → AI returns schema with tables and columns
- [ ] Schema appears in editor (DDL preview or JSON view)
- [ ] "Save Schema" button saves to project
- [ ] Schema history panel shows saved schemas
- [ ] "Import from DB" button visible (requires saved Connection)
- [ ] Naming convention selector (snake_case / camelCase) works

---

## ER Visualizer
- [ ] After generating a schema, switch to Visualizer tab
- [ ] Table nodes render with correct column names
- [ ] FK relationships show edges between nodes
- [ ] "Auto Layout" button re-arranges nodes cleanly
- [ ] "Fit View" button centers the diagram
- [ ] Drag a node → repositions correctly
- [ ] Click a node → NodeDetailPanel opens on the right
- [ ] NodeDetailPanel shows table name, columns, FK references
- [ ] "Compact Mode" toggle shows only PK/FK columns
- [ ] Search bar filters nodes by table name (non-matching nodes dim)
- [ ] Comment badge appears on table nodes (if comments exist)
- [ ] Click comment badge → CommentThread popover opens

---

## Query Editor
- [ ] Monaco editor loads (SQL syntax highlighting, autocomplete)
- [ ] Type a query → runs in demo/simulation mode (no connection needed)
- [ ] Ctrl+Enter executes the query
- [ ] Results table renders rows + columns
- [ ] "Generate" button → describe a query → AI produces SQL
- [ ] "Optimize" button → AI suggests performance improvements
- [ ] "Translate" button → converts between SQL dialects
- [ ] Query history panel shows previous queries
- [ ] Connection selector dropdown visible in toolbar
  - [ ] With a saved connection → executes against real DB

---

## API Checker
- [ ] "New request" creates blank draft
- [ ] URL bar + method selector works (GET/POST/PUT/PATCH/DELETE)
- [ ] Send button executes request (demo mode uses mock, real URL hits backend proxy)
- [ ] Response panel shows status code, time, size
- [ ] Body tab → response JSON rendered
- [ ] Headers tab → response headers listed
- [ ] Tests tab → auto-generated tests shown (status, time, Content-Type)
- [ ] Console tab → shows console.log output from test scripts
- [ ] **Pre-request script tab:**
  - [ ] Write `pm.request.headers.add({key:'X-Test', value:'1'})` → header appears in request
  - [ ] `console.log('hello')` → appears in Console tab after send
- [ ] **Test script tab:**
  - [ ] Write `pm.test('Status ok', () => pm.expect(pm.response.status).to.equal(200))`
  - [ ] Send → test result shows PASS/FAIL in Tests tab
- [ ] Save request → appears in Saved Requests sidebar
- [ ] Auth types (Bearer, Basic, API Key) add correct headers
- [ ] Environment variables: `{{baseUrl}}` resolves when var is set
- [ ] **Collections tab** (requires auth):
  - [ ] Create new collection
  - [ ] Add current request to collection
  - [ ] Click Run → CollectionRunner modal opens
  - [ ] Run All → requests execute sequentially, per-request status shown

---

## Database Connections (requires auth + real DB)
- [ ] "+ New Connection" form opens
- [ ] Test Connection button validates credentials
- [ ] Save connection → appears in list
- [ ] "Import Schema" → reverse-engineers DB schema into Schema Designer
- [ ] Delete connection → removed from list
- [ ] Saved connection selectable in Query Editor toolbar

---

## Collaboration Features (requires auth)

### Share Dialog
- [ ] "Share" button in TopBar visible when logged in
- [ ] Opens ShareDialog
- [ ] "Create" a new workspace → workspace appears in dropdown
- [ ] Invite by email with Editor/Viewer role → member appears in list
- [ ] Remove member → member removed
- [ ] Link sharing toggle → generates shareable token URL
- [ ] Copy link button → copies to clipboard

### Version History
- [ ] "History" button in TopBar
- [ ] Opens VersionHistory panel
- [ ] Save a schema → v1 appears in timeline
- [ ] Modify schema + save → v2 appears with diff summary (e.g. "Added 2 columns")
- [ ] View Diff button → shows SchemaDiff (green = added, red = removed, yellow = changed)
- [ ] Download SQL button → downloads .sql migration file
- [ ] Revert button on old version → creates new version confirming revert

### Comments
- [ ] In ER Visualizer, table node shows comment icon
- [ ] Click icon → CommentThread popover opens
- [ ] Add a comment → appears in thread
- [ ] Reply to a comment → reply appears below
- [ ] Resolve button → comment marked as resolved (dimmed)
- [ ] Reopen → removes resolved state
- [ ] Delete comment → removed from thread

---

## Onboarding & Help
- [ ] First visit (clear localStorage) → OnboardingTour appears after ~1s
- [ ] Tour steps through 4 tabs (Schema → ER → Query → API)
- [ ] "Next" / "Back" buttons navigate steps
- [ ] Step dots are clickable and navigate directly
- [ ] "Get started" on last step → tour disappears, won't show again
- [ ] `?` key → KeyboardShortcutsModal opens
- [ ] Keyboard shortcuts listed correctly
- [ ] HelpCircle icon (top right) → HelpModal opens for current tool
- [ ] HelpModal content matches active tool (changes per tab)
- [ ] Escape key closes both modals

---

## Security
- [ ] Check Network tab: Response headers include `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`
- [ ] No API keys visible in frontend source (check Network tab, no ANTHROPIC_API_KEY)
- [ ] `<script>alert(1)</script>` in project name field → rejected or stripped
- [ ] JWT stored in localStorage (not httpOnly cookie — known limitation)
- [ ] Logout clears `dbforge_token` from localStorage

---

## Performance
- [ ] Initial page load < 3s on localhost (Network tab: verify index.js loaded)
- [ ] Monaco Editor does NOT appear in initial network waterfall (only loads when Query Editor tab is clicked)
- [ ] Switching tabs for the first time triggers chunk load (Network tab shows .js being fetched)
- [ ] Subsequent tab switches use cached chunks (no new network requests)

---

## Error States
- [ ] No internet / backend down → app shows error toast, not white screen
- [ ] Generate schema with empty prompt → validation error shown
- [ ] Invalid URL in API Checker → send button disabled or error shown
- [ ] Delete a project while viewing it → graceful redirect

---

## Project Export / Import
- [ ] Export button (sidebar bottom) → downloads .json file
- [ ] Imported JSON round-trips correctly (schema preserved)

---

## Automated Results (pre-verified)

| Check | Result |
|-------|--------|
| Backend TypeScript build | ✅ 0 errors |
| Frontend TypeScript build | ✅ 0 errors |
| Frontend production build | ✅ exit 0 |
| Main bundle size | ✅ 431 kB (under 500 kB limit) |
| Monaco Editor code-split | ✅ 3.5 MB lazy chunk |
| Feature panel chunks | ✅ 6 lazy chunks confirmed |
| GET /api/health | ✅ 200 |
| POST /api/auth/register | ✅ 201 |
| GET /api/auth/me (with JWT) | ✅ 200 |
| Unauthenticated request | ✅ 401 |
| Project CRUD | ✅ create/read/update/delete |
| Auto-versioning on schema save | ✅ v1 "Initial schema version" |
| Version diff (add table) | ✅ "Added 1 table (posts)" |
| Version revert | ✅ creates new revert version |
| Comments create + list + counts | ✅ 201 / 200 |
| Workspace create | ✅ 201 |
| Collection create | ✅ 201 |
| Input sanitization (<script>) | ✅ stripped → Zod rejects empty string |
| All frontend routes (SPA) | ✅ HTTP 200 |
