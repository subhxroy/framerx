# 🧠 Framer Clone — Project Brain

## 1. OVERVIEW

**Project:** A Framer-inspired visual website builder (drag-drop canvas, inspector panels, CMS, animations, export)
**Author:** Subhankar Roy
**License:** MIT
**Status:** ~88% complete
**Total:** ~85 TS/TSX files, ~14,500 LOC

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
| **SEO** | react-helmet-async (per-page meta tags, JSON-LD structured data) |
| **Path alias** | `@/` → `./src` |
**Edge Functions** | Deno 2 (Supabase) — ai-design copilot |
**Edge Runtime** | Supabase Edge Functions (via `supabase functions serve`) |

---

## 3. PROJECT STRUCTURE

```
framer/
├── index.html              # Vite entry HTML
├── server.js               # Dev server entry: auto-install + Vite + optional Supabase
├── vite.config.ts          # Build config (React + Tailwind + @ alias)
├── tsconfig*.json          # 3 configs (root, app, node)
├── package.json
├── .oxlintrc.json
├── .env / .env.example     # VITE_SUPABASE_URL + VITE_SUPABASE_ANON_KEY
│
├── public/
│   ├── favicon.svg
│   ├── icons.svg
│   ├── robots.txt          # Search engine crawl directives
│   └── sitemap.xml         # XML sitemap for indexing
│
├── src/
│   ├── main.tsx            # React entry → <HelmetProvider><App />
│   ├── index.css           # Global styles, CSS variables, Tailwind
│   │
│   ├── app/
│   │   ├── App.tsx         # <RouterProvider router={router} />
│   │   └── routes.tsx      # 4 routes: /auth, /reset-password, /, /editor/:projectId
│   │
│   ├── pages/
│   │   ├── Auth.tsx        # Sign in/up/reset, Google OAuth, gallery
│   │   ├── Dashboard.tsx   # Project grid, CRUD, search, templates
│   │   ├── Editor.tsx      # Main editor layout (toolbar + panels + canvas)
│   │   └── ResetPassword.tsx # Set new password recovery page
│   │
│   ├── editor/
│   │   ├── canvas/
│   │   │   ├── Canvas.tsx       # Infinite canvas, pan/zoom, draw tools, DnD drop
│   │   │   ├── CanvasRulers.tsx # Tick-mark rulers for canvas
│   │   │   └── InstanceBadge.tsx # Component instance badges on canvas
│   │   ├── elements/
│   │   │   ├── Element.tsx      # Core renderer: resolves instances, breakpoints, CMS
│   │   │   ├── FrameElement.tsx # Frame/shape rendering (auto-layout, styles)
│   │   │   ├── TextElement.tsx  # Editable text (contentEditable)
│   │   │   ├── ImageElement.tsx # Image with objectFit
│   │   │   ├── AnimatedElement.tsx  # motion.div wrapper for interactions
│   │   │   └── types.ts        # Re-exports Element type
│   │   ├── selection/
│   │   │   ├── SelectionManager.tsx  # Moveable + Selecto integration (click-nest, drag-nest, smart-guides)
│   │   │   ├── SmartGuides.tsx       # Alignment snapping (10px snap grid, edge/center)
│   │   │   └── AlignmentBar.tsx      # Multi-select alignment controls
│   │   ├── history/
│   │   │   └── HistoryPanel.tsx # Snapshot list with jump-to-state
│   │   └── transform/
│   │       └── TransformPanel.tsx # X/Y/W/H/Rotate/Opacity inputs
│   │
│   ├── panels/
│   │   ├── toolbar/
│   │   │   └── Toolbar.tsx         # Tools, breakpoints, zoom, preview, publish
│   │   ├── layers/
│   │   │   ├── LayersPanel.tsx     # Flattened tree, search, DnD reorder, page management
│   │   │   ├── LayerRow.tsx        # Individual layer row (sortable, hover/select highlight)
│   │   │   ├── LeftPanelTabs.tsx   # Tabs: Layers | Components | Assets | CMS
│   │   │   └── LeftPanelRail.tsx   # Vertical rail with icon tabs (+ Copilot wand icon)
│   │   ├── inspector/
│   │   │   ├── InspectorPanel.tsx  # Design/Agent/Code tabs, collapsible sections
│   │   │   ├── InspectorSection.tsx # Collapsible section header shared across all sections
│   │   │   ├── SegmentedControl.tsx # Segmented control widget (2-3 options)
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
│   │   │   ├── ColorPicker.tsx     # Custom color picker (EyeDropper API support)
│   │   │   ├── NumberInput.tsx     # Number field with step/unit/label
│   │   │   ├── RespNumberInput.tsx # Responsive number input (X/Y for breakpoints)
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
│   │   ├── copilot/
│   │   │   └── CopilotPanel.tsx   # AI Copilot: chat UI, Generate/Redesign toggle, explanation cards, Accept/Discard/Refine
│   │   ├── context/
│   │   │   └── ContextMenu.tsx       # Right-click context menu
│   │   └── publish/
│   │       └── PublishModal.tsx      # Export HTML/React + Supabase deploy
│   │
│   ├── components/
│   │   ├── CommandPalette.tsx    # Cmd+K command palette
│   │   ├── ErrorBoundary.tsx     # Error boundary wrapper (uses --error CSS var)
│   │   ├── Popover.tsx           # Reusable popover (click-outside + position)
│   │   ├── PressableButton.tsx   # Press-button component with spring feedback
│   │   ├── ProtectedRoute.tsx    # Auth guard wrapper
│   │   ├── ScrollArea.tsx        # Scroll area component (custom, no scrollbar chrome)
│   │   ├── SEO.tsx               # Per-page meta tags (helmet)
│   │   ├── StructuredData.tsx    # JSON-LD schema helpers
│   │   └── ToastHost.tsx         # Toast notification container (zustand-driven)
│   │
│   ├── store/
│   │   ├── editorStore.ts   # Elements, selection, canvas, undo/redo, components
│   │   ├── projectStore.ts  # Project CRUD, save/load project data
│   │   ├── authStore.ts     # User state, signIn/signUp/signOut
│   │   ├── cmsStore.ts      # Collections, fields, items (CRUD)
│   │   ├── assetsStore.ts   # Image assets (add from file/URL, remove)
│   │   ├── uiStore.ts       # Panel layout state: left/right widths, active panel tabs, copilot width
│   │   ├── hoverStore.ts    # Canvas→Layers hover sync (element hover state + source tracking)
│   │   ├── toastStore.ts    # Toast notification queue (auto-dismiss, stack)
│   │   ├── copilotStore.ts  # AI Copilot: messages, generation output, accept/discard, 30s timeout
│   │   └── overlayStore.ts  # Active popover/overlay states
│   │
│   ├── hooks/
│   │   ├── useKeyboard.ts       # Delete, duplicate, undo/redo, group, arrows, tab
│   │   ├── useClipboard.ts      # Copy/cut/paste elements
│   │   ├── useAutoSave.ts       # Auto-save (2s debounce) + Ctrl+S
│   │   ├── useHoverIntent.ts    # Canvas hover→Layers sync with delay
│   │   ├── useScrollShadow.ts   # Scroll-triggered top/bottom shadow
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
│   │   ├── ai.ts                # OpenRouter chat, element context builder, JSON patch parser
│   │   ├── motionTokens.ts      # Shared duration/easing/spring tokens (SPRING.ui, DELAY, THRESHOLD)
│   │   ├── extractDesignTokens.ts # Extracts design tokens from canvas elements (colors/spacing/fonts/radii)
│   │   ├── flashElements.ts     # Visual flash highlight on selected elements
│   │   └── export/
│   │       ├── cssGenerator.ts  # Generate CSS from elements
│   │       ├── htmlExporter.ts  # Export to static HTML file
│   │       └── reactExporter.ts # Export to React component
│   │
│   └── assets/               # Static images (hero.png, vite.svg)
│
├── supabase/                 # Backend configuration & Edge functions
│   ├── config.toml           # Supabase config
│   ├── functions/            # Edge functions
│   │   ├── ai-design/        # AI Copilot assistant
│   │   └── send-reset-email/ # Password reset email generator
│   └── smtp-relay/           # SMTP local relay server
│
├── dist/                     # Build output (ignored)
├── supabase-schema.sql       # Full schema dump
├── README.md                 # Main project README
└── CONTRIBUTING.md           # Contribution guidelines
```

---

## 4. ROUTES (React Router v7)

| Path | Component | Auth | Description |
|------|-----------|------|-------------|
| `/auth` | `Auth.tsx` | No | Login/signup page |
| `/reset-password` | `ResetPassword.tsx` | No | Set new password recovery page |
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
- `activeTool: Tool` — `'select' | 'frame' | 'text' | 'image' | 'rect' | 'ellipse' | 'hand'`
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
  scrollLinks?: ScrollLink[],           // scroll-linked animations
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

### 5.6 uiStore (`src/store/uiStore.ts`, ~60 lines)

**State:**
- `leftPanelWidth: number` — width of the secondary left panel (Layers/CMS/etc.)
- `rightPanelWidth: number` — width of the secondary right panel (Inspector)
- `copilotPanelWidth: number` — width of the AI Copilot panel
- `activeLeftTab: string` — `'layers' | 'components' | 'assets' | 'cms'`
- `copilotOpen: boolean` — whether the Copilot panel is open
- `historyOpen: boolean` — whether the History snapshot list is open

**Actions:**
- `setLeftPanelWidth`, `setRightPanelWidth`, `setCopilotPanelWidth`
- `setActiveLeftTab`, `setCopilotOpen`, `toggleCopilotOpen`, `setHistoryOpen`

### 5.7 hoverStore (`src/store/hoverStore.ts`, ~30 lines)

**State:**
- `hoveredId: string | null` — currently hovered element ID on canvas or layers panel

**Actions:**
- `setHoveredId` — sets the hovered ID with optional delay to avoid flash states

### 5.8 toastStore (`src/store/toastStore.ts`, ~40 lines)

**State:**
- `toasts: Toast[]` — active toast notifications

**Actions:**
- `addToast(message, type)` — adds a new toast (`'success' | 'error' | 'warning' | 'info'`) that auto-dismisses after 3 seconds
- `dismissToast(id)` — manually dismisses a toast

### 5.9 copilotStore (`src/store/copilotStore.ts`, ~150 lines)

**State:**
- `messages: Message[]` — AI chat messages history
- `status: 'idle' | 'streaming' | 'completed' | 'error'` — copilot current status
- `error: string | null`
- `activeMode: 'generate' | 'redesign'`
- `currentGeneration: CopilotGeneration | null` — the uncommitted code patch returned by the AI

**Actions:**
- `setMode`, `clearMessages`, `addMessage`, `sendMessage(prompt, context)`
- `setGeneration`, `acceptGeneration`, `discardGeneration`, `cancelStreaming`

### 5.10 overlayStore (`src/store/overlayStore.ts`, 24 lines)

**State:**
- `openOverlays: string[]` — list of currently open overlay/popover IDs

**Actions:**
- `openOverlay(elementId)` — registers a popover as open
- `closeOverlay(elementId)` — closes a specific popover
- `closeAllOverlays()` — closes all open popovers/overlays
- `isOverlayOpen(elementId)` — checks if a popover is active

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
- Left panel rail (44px fixed) — icons for Layers, Components, Assets, CMS, Copilot, spacer
- Left secondary panel (resizable, 180-400px) — active tab content (Layers/Components/Assets/CMS)
- Resize dividers (4px, hover highlight)
- Canvas (flex-1, center)
- Right-side Copilot panel (360px, animated) — visible only when copilot is active
- Right panel (resizable, 200-360px) — Inspector Panel
- Preview mode hides all side panels

**Editor bootsrap:**
1. Load project data + CMS data via `Promise.all`
2. Check if project is placeholder → inject starter project (`createStarterProjectData`)
3. Set editor store state

**Hooks used:** `useKeyboard()`, `useClipboard()`, `useAutoSave(projectId)`

### 6.4 Reset Password Page (`src/pages/ResetPassword.tsx`, 195 lines)

**Features:**
- Verifies reset token (recovery link params `type=recovery` and `access_token` in query or hash fragment)
- Shows "Verifying link..." loading state or "Invalid or expired link" error page if validation fails
- Simple, centered 50/50 split interface with brand styling and password input form
- Integrates `SEO` component and `StructuredData` (organizationSchema)
- Successfully updates user password via Supabase Auth client (`supabase.auth.updateUser`) and redirects to `/auth` on success

---

## 7. EDITOR — DEEP DIVE

### 7.1 Canvas (`src/editor/canvas/Canvas.tsx`, 750 lines)

**Features:**
- **Pan:** Space+drag, middle-mouse, two-finger trackpad (requestAnimationFrame batched), **Hand tool (H)** — click-drag to pan
- **Zoom:** Ctrl/Cmd+scroll (factor 1.08/0.925), zoom presets (2%-6400%), zoom to fit (Shift+1/2), Ctrl+0 reset, Ctrl++/-
- **Shift+scroll:** Horizontal pan (swap axes) when Shift is held
- **Draw tools:** Select/Frame/Text/Image/Rect/Ellipse — rubber-band draw on canvas
- **Smart nesting:** Drawing over a frame nests the new element into that frame
- **Drop:** Assets (via `ASSET_DND_TYPE`), user components (`text/x-framer-master`), preset components (`text/plain`)
- **Viewport virtualization:** Root elements outside viewport get `display: none`
- **Grid dots:** Dynamic dot pattern background (scales with zoom, fades below 25%)
- **Tick-mark rulers:** Top + left canvas rulers with tick marks at correct zoom scale
- **Instance badges:** "Instance of ComponentName" label on component instances
- **Breakpoint overlay:** Non-desktop modes show centered viewport with dim backdrop
- **Context menu:** Right-click on elements
- **Hierarchical click selection:** Click child elements to select directly (not just root frames)
- **Deep select:** Cmd/Ctrl+click selects deepest nested element under pointer
- **Canvas hover→Layers sync:** Hovering an element highlights it in Layers panel
- **AI Copilot preview overlay:** Dashed accent rects + labels for AI-generated elements

### 7.2 Elements

| File | Type | Renders |
|------|------|---------|
| `Element.tsx` | meta | Routes to specific renderer, resolves instances/breakpoints/CMS bindings, handles flow vs absolute layout, collection frame iteration |
| `FrameElement.tsx` | frame/shape/stack | Auto-layout (flex) or static, border-radius, box-shadow, blur/backdrop-blur, custom borders |
| `TextElement.tsx` | text | `contentEditable` editing, double-click to edit, Escape to commit, Enter not intercepted |
| `ImageElement.tsx` | image | `<img>` with object-fit or placeholder |
| `AnimatedElement.tsx` | wrapper | `motion.div` with hover/tap/appear/inview animations, scroll-linked styles, variant triggers (whileHover/whileTap from component variants), layout FLIP, navigate actions |

### 7.3 Element Renderer (`Element.tsx`)

**Key logic:**
1. **Instance resolution:** Merges master element properties → applies instance overrides (deep field patching via dot notation, 3 levels)
2. **Breakpoint merging:** Applies `getBPMerged()` for responsive overrides
3. **CMS data injection:** In preview mode, replaces text content / image src from CMS item values
4. **Collection frame rendering:** Iterates over CMS items and renders each as a separate copy with CMS context
5. **Auto-layout children:** When parent has autoLayout enabled, renders children `flow={true}` (relative positioning, flex CSS)
6. **Variant triggers:** For instances whose master has `triggerOn` variants, builds motion animation targets (style props + opacity/scale/rotate) and passes them as `variantTriggers` to AnimatedElement
7. **Viewport culling:** Skips root elements outside visible area

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
- **Performance:** Drag/resize/rotate state buffered in refs during interaction (`dragEndPos`, `resizeEndState`, `rotateEndState`); store updates committed once per interaction via `onDragEnd`/`onResizeEnd`/`onRotateEnd` — loops over all affected IDs for multi-select support
- **Multi-select drag fix:** `onDragEnd` now commits all accumulated positions (not just the first element), matching the pattern already used by resize and rotate

### 7.5 Component System

**Creating components:** `createComponent(elementId)` assigns a component ID and registers it in `componentMasters`.

**Creating instances:** `createInstance(componentId, x, y)` clones the master's full subtree via `addElementTree`, marks root with `isInstance: true` and `masterId`.

**Instance resolution:** At render time, the master's current properties are read (so edits to master propagate), then instance overrides are applied via dot-notation path patching.

**Instance actions:** Reset overrides, detach (strip all instance metadata), override tracking display.

**Variants (`VariantsSection.tsx`):** Component masters can define multiple variant states. Each variant has:
- `name` — display label
- `triggerOn: 'hover' | 'tap' | 'focus' | undefined` — when to activate (undefined = base/manual)
- `overrides` — key-value dot-path property changes (e.g. `style.backgroundColor`, `scale`)

**Override editor (`VariantsSection.tsx`):** Each variant card is expandable with an inline override editor:
- **Quick-add buttons** for common fields (Background color, Border radius, Opacity, Scale, Text color, Box shadow, Border width/color, Rotation)
- **Custom field rows** — each row shows the field path (editable) + value input (auto-detects color picker for hex/rgb values, number input for numeric fields, text otherwise)
- **Base value reference** — placeholder shows the current element's value for context
- **Add custom field** via dashed input (Enter or blur to commit)
- **Duplicate variant** button (copy icon) — deep-clones overrides, inserts after source
- Trigger selector (None/Hover/Tap/Focus) always visible

**Rendering:** At render time, `Element.tsx` extracts variant targets (style properties → motion CSS props, direct fields `opacity`/`scale`/`rotate` → motion values) from the master and passes them as `variantTriggers` to `AnimatedElement.tsx`, which merges them into motion's `whileHover`/`whileTap` props with a default spring transition (stiffness 500, damping 30). Layout properties (`x`/`y`/`width`/`height`) are ignored for trigger-based variants since they aren't valid motion animation targets.

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

Three tabs: **Style** | **Agent** (AI-powered design assistant) | **Code**

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
13. **AnimationSection** — Animation trigger config with spring presets (Snappy/Smooth/Bouncy) + mass control
14. **ScrollAnimationSection** — Map scroll progress through viewport to visual properties (opacity, x, y, scale, rotate)
15. **VariantsSection** — (component masters only) List variant states with name + trigger dropdown + add/remove
16. **InteractionSection** — Hover/tap/appear/inview transitions with easing options + navigate actions

**Agent tab** (`AgentPanel.tsx`):
- Streaming chat with OpenRouter (model: `google/gemini-2.0-flash-lite-001`)
- Sends element context (type, position, size, style, text, autoLayout) as JSON
- System prompt instructs the AI to return a JSON patch of element property changes
- Parsed response is applied via `updateElement` with history push
- Cancel button to abort streaming, status indicator
- Requires `VITE_OPENROUTER_API_KEY` in `.env`

### 8.3 Toolbar (`Toolbar.tsx`)

**Left section:** Logo → tools (V, F, T, I, R, O) → hand/pan tool (H)
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
  transition?: { type: 'tween' | 'spring', duration?, easing?, stiffness?, damping?, mass? }
  action?: { type: 'navigate' | 'overlay', url?, overlayId? }
}
```

**Runtime:** `AnimatedElement.tsx` wraps children in `motion.div`, mapping interactions to motion props (`whileHover`, `whileTap`, `initial`/`animate`, `whileInView`). Navigate actions open new tabs.

**Spring physics:** Spring transitions include `mass` (default 1), configurable via number input or preset buttons (Snappy: 500/35/0.5, Smooth: 300/20/1, Bouncy: 300/10/0.3).

**Layout FLIP:** In preview mode, auto-layout children (`flow={true}`) and auto-layout containers (`isAutoLayoutFrame`) get `motion.div` wrapping with `layout` prop and default spring (500/35) for smooth flex reflow.

**Scroll-linked animations:** Elements can have `scrollLinks[]` defining property mapping over scroll progress. `AnimatedElement.tsx` uses `useScroll` with element ref + `scrollYProgress.on('change')` subscription to compute and merge scroll-driven style values. Only active in preview mode.

**Variant triggers:** Component masters define `triggerOn` variants; extractable style/opacity/scale/rotate targets are merged into `whileHover`/`whileTap` motion props with a default spring (500/30).

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

### Exported HTML SEO

`htmlExporter.ts` now includes SEO meta tags in generated pages:
- `<meta name="description">`
- Open Graph tags: `og:title`, `og:description`, `og:image`
- Twitter Card tags: `twitter:card`, `twitter:title`, `twitter:description`, `twitter:image`
- Customizable via `exportToHTML()` options: `description`, `ogImage`

---

## 13. SEO & AEO (ANSWER ENGINE OPTIMIZATION)

### 13.1 Base HTML (`index.html`)

Comprehensive base meta tags for crawlers and social platforms:
- **Standard:** `<title>`, description, keywords, author, robots, googlebot, canonical, theme-color
- **Open Graph:** `og:type`, `og:site_name`, `og:title`, `og:description`, `og:url`, `og:image` (1200×630), `og:locale`
- **Twitter Cards:** `twitter:card` (summary_large_image), `twitter:title`, `twitter:description`, `twitter:image`, `twitter:creator`
- **PWA:** `mobile-web-app-capable`, `apple-touch-icon`
- **JSON-LD:** `WebApplication` schema with `Offer` (free) and `author` metadata

### 13.2 Per-Page SEO (`src/components/SEO.tsx`)

Reusable component wrapping `react-helmet-async`:
- Dynamic `<title>` per route (e.g. "Dashboard – Framer", "Sign In – Framer")
- Per-page `<meta name="description">` and `<link rel="canonical">`
- OG / Twitter tag overrides per page
- `noIndex` support for private pages (`/auth`, `/editor/:projectId`)

Usage in pages:
| Page | noIndex | Title |
|------|---------|-------|
| `Auth.tsx` | ✅ yes | `"Sign In – Framer"` |
| `Dashboard.tsx` | no | `"Dashboard – Framer"` |
| `Editor.tsx` | ✅ yes | `"{projectName} – Framer"` |

### 13.3 Structured Data (`src/components/StructuredData.tsx`)

JSON-LD schema helpers for AEO / rich snippets:
- `webAppSchema()` — WebApplication (software application)
- `organizationSchema()` — Organization with logo + sameAs
- `faqSchema(questions[])` — FAQPage for voice search / featured snippets
- `breadcrumbSchema(items[])` — BreadcrumbList for SERP breadcrumbs

### 13.4 Public Files

| File | Purpose |
|------|---------|
| `public/robots.txt` | Allows all crawlers, disallows `/editor/` and `/auth`, points to sitemap |
| `public/sitemap.xml` | Lists `/`, `/auth`, `/login`, `/signup` with priority and change frequency |

---

## 14. KEYBOARD SHORTCUTS

| Shortcut | Action |
|----------|--------|
| V | Select tool |
| F | Frame tool |
| T | Text tool |
| I | Image tool |
| R | Rectangle tool |
| O | Ellipse tool |
| H | Hand/pan tool (toggle) |
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
| H + click-drag | Pan canvas (hand tool) |
| Shift+scroll | Horizontal pan |
| Cmd+scroll | Zoom |
| Shift+1 / Shift+2 | Zoom to fit all / selection |
| Cmd+0 | Reset zoom to 100% |
| Cmd++ / Cmd+- | Zoom in/out |
| Cmd/Ctrl + click | Deep select (most nested) |

---

## 15. BACKEND / SUPABASE

**Client:** `src/lib/supabase.ts` — creates Supabase client from env vars. If vars are unset/default, `supabase` is `null` and all stores fall back to `localStorage`.

**Tables:**
- `projects`: id, user_id, name, created_at, updated_at, canvas_width, canvas_height, thumbnail_url
- `project_data`: project_id, elements (JSONB), root_element_ids (JSONB), canvas_state (JSONB), updated_at
- `cms_collections`: id, project_id, name, fields (JSONB), created_at
- `cms_items`: id, collection_id, values (JSONB), created_at

**Auth & Recovery:** Supabase Auth (email/password + Google OAuth). Has a fallback to mock localStorage in dev mode.
For password recovery, a password reset email is generated using a custom Edge Function (`send-reset-email`) which interacts with the Supabase Admin API and triggers the Resend API to deliver the recovery email.

**Edge Functions:**
- `ai-design`: Deno serverless function that integrates with OpenRouter for generating/redesigning canvas elements based on a user prompt and design tokens.
- `send-reset-email`: Deno serverless function that generates recovery links and sends reset emails via the Resend API.

**SMTP Relay Server:**
- A local Node.js SMTP relay server is provided in `supabase/smtp-relay/server.mjs`. It listens on port 1025 and forwards all outgoing emails from the local Supabase instance to Resend.

**Deploy:** Uploads HTML to Supabase Storage bucket and makes it publicly accessible.

**Migration:** `supabase/migrations/20260701124714_init.sql` — full schema.

---

## 16. HISTORY / UNDO-REDO

Implemented in `editorStore.ts`:
- `pushHistory()` snapshots full state (elements, rootElementIds, selectedIds, editingId)
- Max 100 entries
- `undo()` / `redo()` restore snapshots
- All mutating operations call `pushHistory()` before making changes (delete, duplicate, group, ungroup, move, resize, rotate, draw, paste, etc.)

---

## 17. CLIPBOARD

Custom implementation (`src/lib/clipboard.ts`) using localStorage (`framer_clipboard` key) for cross-tab copy/paste.

`useClipboard.ts` hook handles Cmd+C/X/V:
- **Copy:** Serializes selected elements + their descendants
- **Cut:** Copies then deletes
- **Paste:** Detaches roots from parent, offsets by 20px, uses `addElementTree`

---

## 18. AUTO-SAVE

`useAutoSave.ts` hook:
- Subscribes to editor store changes
- On change → sets `unsaved`, starts 2s debounce timer
- On save → serializes elements, calls `saveProjectData`, updates project's updatedAt
- Cmd+S triggers immediate save
- Returns status: `'saved' | 'saving' | 'unsaved'`

---

## 19. STARTER PROJECT

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

## 20. DESIGN TOKENS (CSS Variables)

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

## 21. AI COPILOT

The AI Copilot is a full-stack feature spanning a Supabase Edge Function (Deno) and a React chat panel.

**Architecture:**
1. **Edge Function** (`supabase/functions/ai-design/index.ts`) — receives prompt + design tokens, forwards to AI provider (OpenRouter default), validates structured JSON output, returns generation data
2. **copilotStore** (`src/store/copilotStore.ts`) — manages messages, streaming state, generated output, accept/discard flow
3. **CopilotPanel** (`src/panels/copilot/CopilotPanel.tsx`) — chat UI with Generate/Redesign mode, explanation cards (Type/Move/Palette/Layout/..., with lucide icons), Accept/Discard/Refine buttons
4. **design token extraction** (`src/lib/extractDesignTokens.ts`) — extracts top 10 colors, font sizes/weights, 4px-grid spacing, border radii from canvas to ground the AI
5. **Preview overlay** (`Canvas.tsx`) — dashed accent-colored rects at reduced opacity with label badges for AI-generated changes

**Flow:** User prompt → token extraction → Edge Function → structured response → explanation cards → preview overlay → Accept (flattens tree + addElementTree + pushHistory) or Discard

**Limits:** 20 req/min/user rate limiting, 30s client timeout with AbortController.

---

## 22. BUILD & DEV

```bash
npm run dev      # Vite dev server
npm run build    # tsc -b && vite build
npm run start    # Production server (serves dist/ with SPA fallback on :3000)
npm run preview  # Vite preview
npm run lint     # oxlint
node server.js   # Auto-install + Vite + optional Supabase (all-in-one start)
npx supabase functions serve ai-design --no-verify-jwt  # AI Copilot Edge Function (local)
```

## 23. Deployment Configs

### Netlify (`netlify.toml`)

```toml
[build]
  command = "npm run build"
  publish = "dist"

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200

[[headers]]
  for = "/assets/*"
  [headers.values]
    Cache-Control = "public, max-age=31536000, immutable"
```

- SPA fallback: all routes serve `index.html`
- Security headers: `X-Frame-Options`, `X-Content-Type-Options`, `Referrer-Policy`, `Permissions-Policy`
- Asset caching: 1 year immutable for `/assets/*`, `.svg`, `.png`

### Railway (`railway.json`)

```json
{
  "build": {
    "builder": "NIXPACKS",
    "buildCommand": "npm run build"
  },
  "deploy": {
    "startCommand": "node server.js",
    "healthcheckPath": "/"
  }
}
```

- Builds with Nixpacks, starts `server.js` in production mode
- Health check on `GET /`
- Server serves `dist/` statically with SPA fallback for client-side routes
- Port configurable via `PORT` env (default: 3000)

---

## 22. COMPLETION STATUS (from REPO_AUDIT.md)

| Area | Status |
|------|--------|
| Canvas (pan/zoom/draw) | ✅ WORKING |
| Canvas rulers (tick marks) | ✅ WORKING |
| Elements (frame/text/image/shape) | ✅ WORKING |
| Instance badges | ✅ WORKING |
| Hierarchical click selection (direct child select) | ✅ WORKING |
| Selection (click/drag/marquee) | ✅ WORKING |
| Moveable (drag/resize/rotate) | ✅ WORKING |
| Smart guides (snapping) | ✅ WORKING |
| Layers panel (tree, search, DnD, pages) | ✅ WORKING |
| Canvas→Layers hover sync | ✅ WORKING |
| Inspector (layout/border/shadow/blur/typography) | ✅ WORKING |
| Collapsible inspector sections | ✅ WORKING |
| Color picker (+ EyeDropper API) | ✅ WORKING |
| Auto-layout (flex) | ✅ WORKING |
| Animations (hover/tap/appear/inview) | ✅ WORKING |
| Breakpoints (switch + overrides) | ✅ WORKING |
| Component system (instances + overrides + variants) | ✅ WORKING |
| CMS (collections/fields/items/binding) | ✅ WORKING |
| Preset components (17 items) | ✅ WORKING |
| Export HTML/CSS/React (+ SEO) | ✅ WORKING |
| Auth (email + Google) | ✅ WORKING |
| Dashboard (CRUD projects) | ✅ WORKING |
| Keyboard shortcuts | ✅ WORKING |
| Clipboard (copy/cut/paste) | ✅ WORKING |
| Undo/redo (100-entry history) | ✅ WORKING |
| Auto-save (2s debounce + Cmd+S) | ✅ WORKING |
| Publish/deploy to Supabase Storage | ✅ WORKING |
| SEO / AEO (meta tags, OG, JSON-LD, robots.txt, sitemap) | ✅ WORKING |
| Command palette | ✅ WORKING |
| Context menu | ✅ WORKING |
| History panel (snapshot list) | ✅ WORKING |
| Transform panel (X/Y/W/H/rotate/opacity) | ✅ WORKING |
| Toast notifications | ✅ WORKING |
| Toolbar (tools, breakpoints, zoom, preview, publish) | ✅ WORKING |
| AI Agent (OpenRouter streaming) | ✅ WORKING |
| AI Copilot (Edge Function + chat + preview overlay) | ✅ WORKING |
| Design token extraction (for AI grounding) | ✅ WORKING |
| Scroll-linked animations | ✅ WORKING |
| Hand tool (H key pan) | ✅ WORKING |
| Password reset flow & direct recovery link verification | ✅ WORKING |
| Local SMTP relay server (forwarding to Resend) | ✅ WORKING |
| **Overall** | **~90%** |

---

## 23. KEY ARCHITECTURAL PATTERNS

1. **Flat element store:** All elements in a flat `Record<string, Element>`, hierarchy via `parentId` + `children[]`
2. **Recursive rendering:** `Element.tsx` recursively renders children via `ElementRenderer`
3. **Instance + override model:** Components clone master subtrees, overrides applied via dot-path memo
4. **Optimistic UI + sync:** CMS and project stores update state immediately, then sync to Supabase
5. **localStorage fallback:** Every Supabase operation has a localStorage alternative for dev offline use
6. **CSS variable theming:** Entire UI uses CSS custom properties for consistent dark theme
7. **Inline styles over Tailwind:** Most panel UIs use inline `style` objects rather than Tailwind classes (only `index.css` and a few panels use Tailwind)
8. **Custom clipboard:** Cross-tab copy/paste via localStorage instead of native clipboard API for structured element data
