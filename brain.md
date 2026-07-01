# 🧠 Framer Clone — Project Brain

## 1. OVERVIEW

**Project:** A Framer-inspired visual website builder (drag-drop canvas, inspector panels, CMS, animations, export)
**Author:** Subhankar Roy
**License:** MIT
**Status:** ~78% complete (per REPO_AUDIT.md)
**Total:** ~70 TS/TSX files, ~11,917 LOC

---

## 2. TECH STACK

| Layer | Technology |
|-------|-----------|
| **Framework** | React 19 + TypeScript 6 |
| **Build** | Vite 8 + @vitejs/plugin-react |
| **Styling** | Tailwind CSS 4 (via @tailwindcss/vite) + CSS variables (dark theme) |
| **State** | Zustand 5 (5 stores) |
| **Routing** | React Router v7 (createBrowserRouter) |
| **Animation** | Motion (formerly framer-motion) v12 |
| **Drag/Resize** | react-moveable 0.56 + Selecto 1.26 |
| **DnD** | @dnd-kit/core 6 + @dnd-kit/sortable 10 |
| **Icons** | lucide-react 1.22 |
| **Backend** | Supabase (PostgreSQL + Auth + Storage) w/ localStorage fallback |
| **Linting** | oxlint 1.69 |
| **Path alias** | `@/` → `./src` |

---

## 3. PROJECT STRUCTURE

```
framer/
├── index.html              # Vite entry HTML
├── vite.config.ts          # Build config (React + Tailwind + @ alias)
├── tsconfig*.json          # 3 configs (root, app, node)
├── package.json
├── .oxlintrc.json
├── .env / .env.example     # VITE_SUPABASE_URL + VITE_SUPABASE_ANON_KEY
│
├── public/
│   ├── favicon.svg
│   └── icons.svg
│
├── src/
│   ├── main.tsx            # React entry → <App />
│   ├── index.css           # Global styles, CSS variables, Tailwind
│   │
│   ├── app/
│   │   ├── App.tsx         # <RouterProvider router={router} />
│   │   └── routes.tsx      # 3 routes: /auth, /, /editor/:projectId
│   │
│   ├── pages/
│   │   ├── Auth.tsx        # Sign in/up/reset, Google OAuth, gallery
│   │   ├── Dashboard.tsx   # Project grid, CRUD, search, templates
│   │   └── Editor.tsx      # Main editor layout (toolbar + panels + canvas)
│   │
│   ├── editor/
│   │   ├── canvas/
│   │   │   └── Canvas.tsx       # Infinite canvas, pan/zoom, draw tools, DnD drop
│   │   ├── elements/
│   │   │   ├── Element.tsx      # Core renderer: resolves instances, breakpoints, CMS
│   │   │   ├── FrameElement.tsx # Frame/shape rendering (auto-layout, styles)
│   │   │   ├── TextElement.tsx  # Editable text (contentEditable)
│   │   │   ├── ImageElement.tsx # Image with objectFit
│   │   │   ├── AnimatedElement.tsx  # motion.div wrapper for interactions
│   │   │   └── types.ts        # Re-exports Element type
│   │   ├── selection/
│   │   │   ├── SelectionManager.tsx  # Moveable + Selecto integration
│   │   │   ├── SmartGuides.tsx       # Alignment snapping
│   │   │   └── AlignmentBar.tsx      # Multi-select alignment controls
│   │   ├── history/            # (empty — undo/redo in editorStore)
│   │   └── transform/          # (empty)
│   │
│   ├── panels/
│   │   ├── toolbar/
│   │   │   └── Toolbar.tsx         # Tools, breakpoints, zoom, preview, publish
│   │   ├── layers/
│   │   │   ├── LayersPanel.tsx     # Flattened tree, search, DnD reorder
│   │   │   ├── LayerRow.tsx        # Individual layer row (sortable)
│   │   │   └── LeftPanelTabs.tsx   # Tabs: Layers | Components | Assets | CMS
│   │   ├── inspector/
│   │   │   ├── InspectorPanel.tsx  # Style/Agent/Code tabs, sections
│   │   │   ├── LayoutSection.tsx   # x, y, w, h, rotation, sizing mode
│   │   │   ├── AutoLayoutSection.tsx  # Flexbox controls
│   │   │   ├── TypographySection.tsx  # Font, size, weight, alignment
│   │   │   ├── FillSection.tsx     # Background color
│   │   │   ├── BorderSection.tsx   # Border width/color/style
│   │   │   ├── BorderRadiusSection.tsx  # Radius + independent corners
│   │   │   ├── ShadowSection.tsx   # Box shadow stack
│   │   │   ├── BlurSection.tsx     # Layer blur + backdrop blur
│   │   │   ├── ImageSection.tsx    # Image src + object-fit
│   │   │   ├── AnimationSection.tsx    # Animation controls
│   │   │   ├── InteractionSection.tsx  # Hover/tap/appear/inview + actions
│   │   │   ├── CMSBindingSection.tsx   # Bind element to CMS field
│   │   │   ├── CodePanel.tsx       # Raw CSS/React export preview
│   │   │   ├── ColorPicker.tsx     # Custom color picker
│   │   │   ├── NumberInput.tsx     # Number field with step/unit
│   │   │   ├── RespNumberInput.tsx # Responsive number input
│   │   │   └── useInstanceUpdate.ts   # Instance override hook
│   │   ├── components/
│   │   │   ├── ComponentsPanel.tsx    # Preset + user component library
│   │   │   └── ComponentDefinitions.ts  # 17 preset components
│   │   ├── cms/
│   │   │   ├── CMSPanel.tsx          # Collection list + CRUD
│   │   │   ├── CollectionEditor.tsx  # Field schema editor
│   │   │   ├── ItemsTable.tsx        # Tabular items view
│   │   │   └── ItemEditor.tsx        # Single item form editor
│   │   ├── assets/
│   │   │   └── AssetsPanel.tsx       # Upload from file/URL, drag to canvas
│   │   ├── context/
│   │   │   └── ContextMenu.tsx       # Right-click context menu
│   │   └── publish/
│   │       └── PublishModal.tsx      # Export HTML/React + Supabase deploy
│   │
│   ├── store/
│   │   ├── editorStore.ts   # Elements, selection, canvas, undo/redo, components
│   │   ├── projectStore.ts  # Project CRUD, save/load project data
│   │   ├── authStore.ts     # User state, signIn/signUp/signOut
│   │   ├── cmsStore.ts      # Collections, fields, items (CRUD)
│   │   └── assetsStore.ts   # Image assets (add from file/URL, remove)
│   │
│   ├── hooks/
│   │   ├── useKeyboard.ts       # Delete, duplicate, undo/redo, group, arrows, tab
│   │   ├── useClipboard.ts      # Copy/cut/paste elements
│   │   ├── useAutoSave.ts       # Auto-save (2s debounce) + Ctrl+S
│   │   └── useViewportBounds.ts # Canvas viewport for virtualization
│   │
│   ├── lib/
│   │   ├── supabase.ts          # Supabase client (null if unconfigured)
│   │   ├── supabase-deploy.ts   # Deploy HTML to Supabase Storage
│   │   ├── defaultProject.ts    # Starter project generator (full landing page)
│   │   ├── elementStyle.ts      # getBorderRadiusCSS, getBoxShadowCSS
│   │   ├── breakpointUtils.ts   # Breakpoint widths, getBPMerged
│   │   ├── hitTest.ts           # hitTestDeepest, findContainerAt
│   │   ├── coords.ts            # getAbsolutePos
│   │   ├── clipboard.ts         # Cross-tab clipboard via localStorage
│   │   └── export/
│   │       ├── cssGenerator.ts  # Generate CSS from elements
│   │       ├── htmlExporter.ts  # Export to static HTML file
│   │       └── reactExporter.ts # Export to React component
│   │
│   └── assets/               # Static images (hero.png, vite.svg)
│
├── supabase/                 # Local Supabase (monorepo submodule)
│   ├── config.toml
│   ├── migrations/20260701124714_init.sql
│   ├── docker/               # Docker compose files for supabase services
│   └── ...
│
├── dist/                     # Build output
├── supabase-schema.sql       # Full schema dump
├── framer-clone-build-spec.md  # 1383-line build specification
├── framer-clone-feature-spec.md # 1000-line feature specification
├── README.md                 # 510-line main README
├── REPO_AUDIT.md             # 632-line audit report
└── CONTRIBUTING.md           # Contribution guidelines
```

---

## 4. ROUTES (React Router v7)

| Path | Component | Auth | Description |
|------|-----------|------|-------------|
| `/auth` | `Auth.tsx` | No | Login/signup page |
| `/` | `Dashboard.tsx` | Yes (ProtectedRoute) | Project list |
| `/editor/:projectId` | `Editor.tsx` | Yes (ProtectedRoute) | Visual editor |

---

## 5. STATE MANAGEMENT (Zustand Stores)

### 5.1 editorStore (`src/store/editorStore.ts`, 769 lines)

The core editor state — **the largest and most critical file.**

**State:**
- `elements: Record<string, Element>` — all elements by ID
- `rootElementIds: string[]` — top-level element IDs
- `selectedIds: string[]` — currently selected element IDs
- `componentMasters: Record<string, string>` — compId → elementId mapping
- `editingId: string | null` — currently editing text element
- `activeTool: Tool` — `'select' | 'frame' | 'text' | 'image' | 'rect' | 'ellipse'`
- `activeBreakpoint: Breakpoint` — `'desktop' | 'tablet' | 'mobile'`
- `previewMode: boolean`
- `canvas: { x, y, scale }` — pan/zoom state
- `history: { entries[], index }` — undo/redo stack (max 100)

**Actions:**
- `addElement`, `addElementTree` — create + batch create with auto-remapping IDs
- `updateElement`, `deleteElement`, `duplicateElement`
- `moveElement`, `bringForward/SendBackward/bringToFront/sendToBack`
- `groupSelection`, `ungroup`
- `reorderChild` — for auto-layout drag reorder
- `createComponent`, `createInstance` — component system
- `updateInstanceOverride`, `resetInstanceOverrides`, `detachInstance`
- `pushHistory`, `undo`, `redo`, `canUndo`, `canRedo`

**Element interface** (the data model):
```ts
Element {
  id, type (frame|text|image|shape|stack), name,
  x, y, width, height, rotation, opacity, visible, locked,
  children: string[], parentId: string | null,
  sizing?: { width: SizeMode; height: SizeMode },     // fixed|fill|hug
  style: { backgroundColor, borderRadius, borderRadiusCorners, border, overflow, boxShadow, blur, backdropBlur, strokeAlignment, borderWidth, borderColor, borderStyle },
  text?: { content, fontSize, fontWeight, color, textAlign, lineHeight, letterSpacing },
  image?: { src, objectFit },
  autoLayout?: { enabled, direction, gap, padding, alignItems, justifyContent, wrap },
  breakpoints?: { tablet?, mobile? },   // BreakpointOverrides
  interactions?: Interaction[],         // animations
  cmsBinding?: CMSBinding,              // CMS data binding
  componentId?, isInstance?, masterId?, overrides?, variants?, activeVariant?
}
```

### 5.2 projectStore (`src/store/projectStore.ts`, 299 lines)

**State:** `projects: Record<string, Project>`, `projectList`, `isLoading`

**Actions:** `loadProjects`, `createProject`, `updateProject`, `deleteProject`, `duplicateProject`, `getProject`, `saveProjectData`, `loadProjectData`

**Persistence:** Supabase (projects + project_data tables) with localStorage fallback.

### 5.3 authStore (`src/store/authStore.ts`, 190 lines)

**State:** `user: AuthUser | null`, `loading`, `error`

**Actions:** `setUser`, `setLoading`, `setError`, `clearError`

**Exported functions:** `signIn`, `signUp`, `signInWithGoogle`, `resetPassword`, `signOut`

**Bootstrap:** Subscribes to `supabase.auth.onAuthStateChange`; localStorage mock in dev mode.

### 5.4 cmsStore (`src/store/cmsStore.ts`, 322 lines)

**State:** `activeProjectId`, `collections`, `items`, `error`

**Actions:** Full CRUD for collections, fields, and items. Optimistic UI updates + Supabase sync + localStorage persistence.

**CMS Data model:**
- `CMSCollection { id, name, fields: CMSField[], createdAt }`
- `CMSField { id, name, type (11 types), required, defaultValue, options? }`
- `CMSItem { id, collectionId, values: Record<string, unknown>, createdAt }`

**Also exports:** `CMSDataContext` (React context) and `useCMSData` hook for preview-time CMS data injection.

### 5.5 assetsStore (`src/store/assetsStore.ts`, 82 lines)

**State:** `assets: Asset[]`

**Actions:** `addAsset`, `addAssetFromFile` (FileReader → data URL), `addAssetFromUrl`, `removeAsset`

---

## 6. PAGES — DETAILED

### 6.1 Auth Page (`src/pages/Auth.tsx`, 477 lines)

**Layout:** 50/50 split — left form, right animated gallery.

**Left Panel:**
- Framer logo (SVG)
- Title/subtitle changes by mode
- Google OAuth button (with real G logo SVG)
- OR divider
- Email/password form (name field shown on signup)
- Mode toggles: signin ↔ signup ↔ reset password
- Terms links footer

**Right Panel (RightGallery):**
- 3-column infinite-scroll gallery of template cards
- Each card has: nav dots, headline, skeleton lines, CTA button, corner badge
- Smooth CSS transform animation per column (loop via requestAnimationFrame)
- Top/bottom gradient fades

### 6.2 Dashboard (`src/pages/Dashboard.tsx`, 715 lines)

**Layout:** Left sidebar + main content area.

**Left Sidebar:**
- Workspace dropdown with gradient avatar
- Nav: Home, All Projects, Starred, Templates
- Bottom: Settings + User menu (sign out)

**Main Content:**
- Header: title, search input (animated width), "New Project" button
- Project grid (auto-fill, min 240px cards)
- Each card: gradient thumbnail with fake browser chrome, name, date, hover overlay "Edit" button, three-dot menu (rename/duplicate/open/delete)
- New Project modal: name input, canvas size picker (Web/Mobile/Tablet), create button
- Empty state with prompt
- Settings tab with workspace name/email/signout
- Templates tab with 4 preset template cards

**Canvas sizes:** Web (1440×900), Mobile (390×844), Tablet (768×1024)

### 6.3 Editor (`src/pages/Editor.tsx`, 231 lines)

**Layout:** Toolbar (top) → Main area (flex row).

**Main Area:**
- Left panel (resizable, 180-400px) with tabs: Layers | Components | CMS | Assets
- Resize dividers (4px, hover highlight)
- Canvas (flex-1, center)
- Right panel (resizable, 200-360px) — Inspector Panel
- Preview mode hides both side panels

**Editor bootsrap:**
1. Load project data + CMS data via `Promise.all`
2. Check if project is placeholder → inject starter project (`createStarterProjectData`)
3. Set editor store state

**Hooks used:** `useKeyboard()`, `useClipboard()`, `useAutoSave(projectId)`

---

## 7. EDITOR — DEEP DIVE

### 7.1 Canvas (`src/editor/canvas/Canvas.tsx`, 719 lines)

**Features:**
- **Pan:** Space+drag, middle-mouse, two-finger trackpad (requestAnimationFrame batched)
- **Zoom:** Ctrl/Cmd+scroll (factor 1.08/0.925), zoom presets (2%-6400%), zoom to fit (Shift+1/2), Ctrl+0 reset, Ctrl++/-
- **Draw tools:** Select/Frame/Text/Image/Rect/Ellipse — rubber-band draw on canvas
- **Smart nesting:** Drawing over a frame nests the new element into that frame
- **Drop:** Assets (via `ASSET_DND_TYPE`), user components (`text/x-framer-master`), preset components (`text/plain`)
- **Viewport virtualization:** Root elements outside viewport get `display: none`
- **Grid dots:** Dynamic dot pattern background
- **Breakpoint overlay:** Non-desktop modes show centered viewport with dim backdrop
- **Context menu:** Right-click on elements
- **Deep select:** Cmd/Ctrl+click selects deepest nested element under pointer

### 7.2 Elements

| File | Type | Renders |
|------|------|---------|
| `Element.tsx` | meta | Routes to specific renderer, resolves instances/breakpoints/CMS bindings, handles flow vs absolute layout, collection frame iteration |
| `FrameElement.tsx` | frame/shape/stack | Auto-layout (flex) or static, border-radius, box-shadow, blur/backdrop-blur, custom borders |
| `TextElement.tsx` | text | `contentEditable` editing, double-click to edit, Escape to commit, Enter not intercepted |
| `ImageElement.tsx` | image | `<img>` with object-fit or placeholder |
| `AnimatedElement.tsx` | wrapper | `motion.div` with hover/tap/appear/inview animations + navigate actions |

### 7.3 Element Renderer (`Element.tsx`)

**Key logic:**
1. **Instance resolution:** Merges master element properties → applies instance overrides (deep field patching via dot notation, 3 levels)
2. **Breakpoint merging:** Applies `getBPMerged()` for responsive overrides
3. **CMS data injection:** In preview mode, replaces text content / image src from CMS item values
4. **Collection frame rendering:** Iterates over CMS items and renders each as a separate copy with CMS context
5. **Auto-layout children:** When parent has autoLayout enabled, renders children `flow={true}` (relative positioning, flex CSS)
6. **Viewport culling:** Skips root elements outside visible area

### 7.4 Selection & Manipulation (`SelectionManager.tsx`)

**Uses:**
- **Selecto** — click/shift-click/marquee selection on `[data-element-id]` targets
- **Moveable** — drag, resize, rotate with snapping, guidelines, dimension labels

**Features:**
- Shift + drag → keep aspect ratio
- Alt + resize → resize from center
- Auto-layout reorder → insertion line indicator
- Drag-to-nest → reparent into hovered frame
- Snap to element edges/centers (10px grid)
- Live dimension label during drag/resize
- Rotation degree label
- Alignment bar for multi-select

### 7.5 Component System

**Creating components:** `createComponent(elementId)` assigns a component ID and registers it in `componentMasters`.

**Creating instances:** `createInstance(componentId, x, y)` clones the master's full subtree via `addElementTree`, marks root with `isInstance: true` and `masterId`.

**Instance resolution:** At render time, the master's current properties are read (so edits to master propagate), then instance overrides are applied via dot-notation path patching.

**Instance actions:** Reset overrides, detach (strip all instance metadata), override tracking display.

---

## 8. PANELS — DETAILED

### 8.1 Left Panel Tabs

| Tab | Component | Description |
|-----|-----------|-------------|
| Layers | `LayersPanel.tsx` | Flattened tree with depth indentation, search, collapsible, visibility/lock toggles, drag-to-reorder (dnd-kit), inline rename |
| Components | `ComponentsPanel.tsx` | User-created components + 17 preset components in categories (Navigation, Forms, Layout, Typography), search, drag-to-canvas |
| Assets | `AssetsPanel.tsx` | Upload from file/URL, image grid, double-click or drag to canvas, delete |
| CMS | `CMSPanel.tsx` | Collection CRUD, schema editor, items table, item form editor |

### 8.2 Inspector Panel (`InspectorPanel.tsx`)

Three tabs: **Style** | **Agent** (AI placeholder) | **Code**

**Style tab sections** (in order):
1. Element header (type badge, name, instance info, multi-select count)
2. Instance overrides bar (reset + count)
3. **LayoutSection** — Position (x, y), size (w, h), rotation, sizing mode (fixed/fill/hug)
4. **AutoLayoutSection** — Enable/disable, direction, gap, padding (4 sides), align items, justify content, wrap
5. **FillSection** — Background color picker
6. **ImageSection** (image type only) — Source URL, object-fit dropdown
7. **BorderSection** — Width, color, style (solid/dashed/dotted), stroke alignment
8. **BorderRadiusSection** — Uniform radius + independent corner control, link/unlink corners
9. **ShadowSection** — Multi-shadow stack with add/remove, each has x/y/blur/spread/color
10. **BlurSection** — Layer blur + backdrop blur sliders
11. **TypographySection** (text only) — Font family, size, weight, color, alignment, line height, letter spacing, transform
12. **CMSBindingSection** — Bind element to CMS collection + field
13. **AnimationSection** — Animation trigger config
14. **InteractionSection** — Hover/tap/appear/inview transitions with easing options + navigate actions

### 8.3 Toolbar (`Toolbar.tsx`)

**Left section:** Logo → tools (V, F, T, I, R, O) → hand/pan tool
**Center:** Breakpoint segmented control (Desktop/Tablet/Phone with widths) + add breakpoint button
**Right:** Save status → zoom dropdown → preview toggle → user avatar → publish button

### 8.4 Preset Components (`ComponentDefinitions.ts`)

17 preset components across 4 categories:
- **Navigation:** Navbar, Sidebar
- **Forms:** Button, Ghost Button, Input, Checkbox, Toggle, Dropdown
- **Layout:** Card, Hero Section, Feature Grid, Pricing Table
- **Typography:** Heading, Paragraph, Code Block

---

## 9. RESPONSIVE DESIGN SYSTEM

**Breakpoints:** Desktop (1280px+), Tablet (810px), Mobile (390px)

**Per-element overrides:** Each element can have `breakpoints.tablet` and `breakpoints.mobile` with overrides for x, y, width, height, visible, opacity, rotation.

**Breakpoint switching:** When user switches breakpoint in toolbar, `setActiveBreakpoint(bp)` sets the active breakpoint. The `getBPMerged()` utility merges base element properties with the active breakpoint's overrides.

**Export:** CSS generator outputs media queries for tablet (max-width: 768px) and mobile (max-width: 390px).

---

## 10. ANIMATIONS & INTERACTIONS

**Interaction model:**
```ts
Interaction {
  id, trigger: 'hover' | 'tap' | 'appear' | 'inview',
  animation?: { opacity?, scale?, x?, y?, rotate? } — each is [from, to]
  transition?: { type: 'tween' | 'spring', duration?, easing?, stiffness?, damping? }
  action?: { type: 'navigate' | 'overlay', url?, overlayId? }
}
```

**Runtime:** `AnimatedElement.tsx` wraps children in `motion.div`, mapping interactions to motion props (`whileHover`, `whileTap`, `initial`/`animate`, `whileInView`). Navigate actions open new tabs.

**Export:** `cssGenerator.ts` generates CSS keyframe animations (`@keyframes` + `:hover`/`:active`).

---

## 11. CMS SYSTEM

**Features:**
- Create/delete collections with dynamic field schemas
- 11 field types: text, rich-text, image, number, boolean, date, color, link, file, video, enum
- CRUD items with optimistic UI
- CMS data binding on elements (`cmsBinding` property)
- Collection frame: renders one copy of a frame per CMS item in preview mode
- React context (`CMSDataContext`) for nested element data injection

---

## 12. EXPORT SYSTEM

| Format | File | Output |
|--------|------|--------|
| HTML + CSS | `htmlExporter.ts` | Static HTML page with inline CSS, media queries, animations |
| React + Tailwind | `reactExporter.ts` | React component with inline styles |
| CSS (raw) | `cssGenerator.ts` | Class-based CSS with media queries + keyframes |

**Deploy:** `supabase-deploy.ts` uploads generated HTML to Supabase Storage bucket and returns a public URL.

---

## 13. KEYBOARD SHORTCUTS

| Shortcut | Action |
|----------|--------|
| V | Select tool |
| F | Frame tool |
| T | Text tool |
| I | Image tool |
| R | Rectangle tool |
| O | Ellipse tool |
| Delete/Backspace | Delete selected |
| Cmd+D | Duplicate |
| Cmd+Z | Undo |
| Cmd+Shift+Z | Redo |
| Cmd+G | Group (into frame) |
| Cmd+Shift+G | Ungroup |
| Cmd+A | Select all (root elements) |
| Cmd+C / Cmd+X / Cmd+V | Copy / Cut / Paste |
| Cmd+S | Force save |
| Cmd+P | Toggle preview |
| Cmd+K | Toggle command palette |
| Escape | Deselect / close palette |
| Arrow keys | Nudge 1px (+Shift = 10px) |
| [ / ] | Send backward / bring forward (+Cmd = front/back) |
| Tab / Shift+Tab | Cycle siblings |
| Space + drag | Pan canvas |
| Cmd+scroll | Zoom |
| Shift+1 / Shift+2 | Zoom to fit all / selection |
| Cmd+0 | Reset zoom to 100% |
| Cmd++ / Cmd+- | Zoom in/out |
| Cmd/Ctrl + click | Deep select (most nested) |

---

## 14. BACKEND / SUPABASE

**Client:** `src/lib/supabase.ts` — creates Supabase client from env vars. If vars are unset/default, `supabase` is `null` and all stores fall back to `localStorage`.

**Tables:**
- `projects`: id, user_id, name, created_at, updated_at, canvas_width, canvas_height, thumbnail_url
- `project_data`: project_id, elements (JSONB), root_element_ids (JSONB), canvas_state (JSONB), updated_at
- `cms_collections`: id, project_id, name, fields (JSONB), created_at
- `cms_items`: id, collection_id, values (JSONB), created_at

**Auth:** Supabase Auth (email/password + Google OAuth). localStorage mock in dev mode.

**Deploy:** Uploads HTML to Supabase Storage bucket and makes it publicly accessible.

**Migration:** `supabase/migrations/20260701124714_init.sql` — full schema.

---

## 15. HISTORY / UNDO-REDO

Implemented in `editorStore.ts`:
- `pushHistory()` snapshots full state (elements, rootElementIds, selectedIds, editingId)
- Max 100 entries
- `undo()` / `redo()` restore snapshots
- All mutating operations call `pushHistory()` before making changes (delete, duplicate, group, ungroup, move, resize, rotate, draw, paste, etc.)

---

## 16. CLIPBOARD

Custom implementation (`src/lib/clipboard.ts`) using localStorage (`framer_clipboard` key) for cross-tab copy/paste.

`useClipboard.ts` hook handles Cmd+C/X/V:
- **Copy:** Serializes selected elements + their descendants
- **Cut:** Copies then deletes
- **Paste:** Detaches roots from parent, offsets by 20px, uses `addElementTree`

---

## 17. AUTO-SAVE

`useAutoSave.ts` hook:
- Subscribes to editor store changes
- On change → sets `unsaved`, starts 2s debounce timer
- On save → serializes elements, calls `saveProjectData`, updates project's updatedAt
- Cmd+S triggers immediate save
- Returns status: `'saved' | 'saving' | 'unsaved'`

---

## 18. STARTER PROJECT

`createStarterProjectData()` generates a full landing page with:
- **Page:** 1280×900+ "Home" frame with shadow
- **Navbar:** Auto-layout row with brand, links (Work/Services/Contact), CTA button
- **Hero Section:** Eyebrow, headline (60px), subheadline, two CTAs, media panel with glow effect
- **Features Row:** 3-column auto-layout cards with title + body
- ~30 elements total, realistic preset content

```ts
looksLikePlaceholderProject() // heuristic to detect empty frames → inject starter
```

---

## 19. DESIGN TOKENS (CSS Variables)

Defined in `src/index.css`:
```css
--app-bg: #0d0d0d
--canvas-bg: #121212
--panel-bg: #141414
--toolbar-bg: #131313
--surface-1: #1a1a1a
--surface-2: #1c1c1c
--surface-3: #222222
--surface-4: #2a2a2a
--border: #1f1f1f
--accent: #0091ff
--accent-hover: #0080e6
--accent-dim: rgba(0, 145, 255, 0.08)
--text-primary: #e0e0e0
--text-secondary: #888
--text-tertiary: #555
--text-muted: #444
--font-ui: 'Inter', system-ui, sans-serif
```

---

## 20. BUILD & DEV

```bash
npm run dev      # Vite dev server
npm run build    # tsc -b && vite build
npm run preview  # Vite preview
npm run lint     # oxlint
```

---

## 21. COMPLETION STATUS (from REPO_AUDIT.md)

| Area | Status |
|------|--------|
| Canvas (pan/zoom/draw) | ✅ WORKING |
| Elements (frame/text/image/shape) | ✅ WORKING |
| Selection (click/drag/marquee) | ✅ WORKING |
| Moveable (drag/resize/rotate) | ✅ WORKING |
| Layers panel | ✅ WORKING |
| Inspector (layout/border/shadow/blur/typography) | ✅ WORKING |
| Color picker | ✅ WORKING |
| Auto-layout (flex) | ✅ WORKING |
| Animations (hover/tap/appear/inview) | ✅ WORKING |
| Breakpoints (switch + overrides) | ✅ WORKING |
| Component system (instances + overrides) | ✅ WORKING |
| CMS (collections/fields/items/binding) | ✅ WORKING |
| Preset components (17 items) | ✅ WORKING |
| Export HTML/CSS/React | ✅ WORKING |
| Auth (email + Google) | ✅ WORKING |
| Dashboard (CRUD projects) | ✅ WORKING |
| Keyboard shortcuts | ✅ WORKING |
| Clipboard (copy/cut/paste) | ✅ WORKING |
| Undo/redo | ✅ WORKING |
| Auto-save | ✅ WORKING |
| Publish/deploy to Supabase | ✅ WORKING |
| Command palette | ⏳ PARTIAL (UI exists) |
| Context menu | ⏳ PARTIAL (UI exists) |
| Smart guides | ⏳ PARTIAL (basic) |
| History panel | ❌ MISSING (empty dir) |
| Transform panel | ❌ MISSING (empty dir) |
| AI Agent tab | ❌ STUB (placeholder) |
| **Overall** | **~78%** |

---

## 22. KEY ARCHITECTURAL PATTERNS

1. **Flat element store:** All elements in a flat `Record<string, Element>`, hierarchy via `parentId` + `children[]`
2. **Recursive rendering:** `Element.tsx` recursively renders children via `ElementRenderer`
3. **Instance + override model:** Components clone master subtrees, overrides applied via dot-path memo
4. **Optimistic UI + sync:** CMS and project stores update state immediately, then sync to Supabase
5. **localStorage fallback:** Every Supabase operation has a localStorage alternative for dev offline use
6. **CSS variable theming:** Entire UI uses CSS custom properties for consistent dark theme
7. **Inline styles over Tailwind:** Most panel UIs use inline `style` objects rather than Tailwind classes (only `index.css` and a few panels use Tailwind)
8. **Custom clipboard:** Cross-tab copy/paste via localStorage instead of native clipboard API for structured element data
