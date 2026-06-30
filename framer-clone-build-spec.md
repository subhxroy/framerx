# FramerX — Complete Build Specification
### A Framer-identical visual web builder, built phase by phase with Claude Code

---

## Design System (Framer-identical)

Copy these exact values before writing a single line of UI.

### Color Tokens

```css
:root {
  /* Canvas */
  --canvas-bg: #1a1a1a;
  --canvas-grid: #282828;

  /* App Chrome */
  --app-bg: #111111;
  --panel-bg: #1c1c1c;
  --panel-border: #2a2a2a;
  --toolbar-bg: #161616;

  /* Surfaces */
  --surface-1: #1f1f1f;
  --surface-2: #252525;
  --surface-3: #2c2c2c;
  --surface-hover: #303030;
  --surface-active: #383838;

  /* Text */
  --text-primary: #f0f0f0;
  --text-secondary: #8a8a8a;
  --text-muted: #555555;
  --text-disabled: #3a3a3a;

  /* Accent — Framer uses a cool blue-purple */
  --accent: #0091ff;
  --accent-hover: #0080e6;
  --accent-bg: rgba(0, 145, 255, 0.12);
  --accent-border: rgba(0, 145, 255, 0.3);

  /* Selection */
  --selection: #0091ff;
  --selection-handle: #ffffff;
  --selection-border: #0091ff;

  /* Borders */
  --border: #2a2a2a;
  --border-strong: #383838;
  --border-subtle: #1f1f1f;

  /* Semantic */
  --error: #ff4757;
  --success: #2ed573;
  --warning: #ffa502;

  /* Shadows */
  --shadow-panel: 0 2px 8px rgba(0,0,0,0.4);
  --shadow-popup: 0 8px 24px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.05);
  --shadow-tooltip: 0 4px 12px rgba(0,0,0,0.5);
}
```

### Typography

```css
/* System stack — identical to Framer */
--font-ui: -apple-system, BlinkMacSystemFont, "Inter", "Segoe UI", sans-serif;
--font-mono: "JetBrains Mono", "Fira Code", ui-monospace, monospace;

/* Scale */
--text-xs:   10px;  /* badges, tiny labels */
--text-sm:   11px;  /* panel labels, secondary info */
--text-base: 12px;  /* default UI text */
--text-md:   13px;  /* property values */
--text-lg:   14px;  /* section headers */
```

### Spacing System

```css
/* 4px base grid — strictly observed */
--space-1:  4px;
--space-2:  8px;
--space-3:  12px;
--space-4:  16px;
--space-5:  20px;
--space-6:  24px;
--space-8:  32px;
--space-10: 40px;
```

### Border Radius

```css
--radius-sm:  3px;   /* inputs, small controls */
--radius-md:  6px;   /* panels, cards */
--radius-lg:  8px;   /* modals, popovers */
--radius-xl:  12px;  /* large cards */
--radius-full: 9999px; /* badges, pills */
```

---

## Tech Stack

```
Framework:     React 18 + Vite 5 + TypeScript 5
Styling:       Tailwind CSS + CSS Variables (design tokens above)
State:         Zustand (global) + React Context (local panels)
Canvas:        React Moveable (drag, resize, rotate)
Selection:     Selecto (box selection, multi-select)
DnD:           dnd-kit (layer panel, component library)
Animations:    Motion (Framer Motion v11)
History:       Custom Undo/Redo with immer snapshots
Icons:         Lucide React
Backend:       Firebase (auth + Firestore + Storage)
Routing:       React Router v6
Build:         Vite + esbuild
```

### Folder Structure

```
src/
├── app/
│   ├── App.tsx
│   ├── routes.tsx
│   └── providers.tsx
│
├── editor/                    # Core editor engine
│   ├── canvas/
│   │   ├── Canvas.tsx         # Main infinite canvas
│   │   ├── CanvasBackground.tsx
│   │   ├── CanvasOverlay.tsx  # Selection, snapping overlays
│   │   └── useCanvasEvents.ts
│   │
│   ├── elements/              # Element system
│   │   ├── Element.tsx        # Base element renderer
│   │   ├── TextElement.tsx
│   │   ├── FrameElement.tsx
│   │   ├── ImageElement.tsx
│   │   ├── StackElement.tsx
│   │   └── types.ts
│   │
│   ├── selection/
│   │   ├── SelectionManager.tsx
│   │   ├── ResizeHandles.tsx
│   │   └── useSelection.ts
│   │
│   ├── history/
│   │   ├── historyStore.ts    # Undo/redo stack
│   │   └── useHistory.ts
│   │
│   └── transform/
│       ├── TransformControls.tsx
│       └── useTransform.ts
│
├── panels/
│   ├── toolbar/               # Top toolbar
│   ├── layers/                # Left panel — layer tree
│   ├── inspector/             # Right panel — properties
│   ├── assets/                # Bottom-left — assets
│   └── components/            # Component library
│
├── store/
│   ├── editorStore.ts         # Main editor state
│   ├── canvasStore.ts         # Canvas viewport state
│   ├── layersStore.ts         # Layer tree state
│   └── projectStore.ts        # Project metadata
│
├── hooks/
│   ├── useKeyboard.ts
│   ├── useClipboard.ts
│   ├── useSnap.ts
│   └── useBreakpoints.ts
│
├── lib/
│   ├── firebase.ts
│   ├── serializer.ts          # Project file format
│   ├── exporter.ts            # HTML/CSS export
│   └── utils.ts
│
└── pages/
    ├── Dashboard.tsx          # Project dashboard
    ├── Editor.tsx             # Main editor page
    └── Auth.tsx
```

---

## Phase 1 — Canvas Engine + Basic Editor

**Goal:** A working infinite canvas with draggable, resizable elements. Feels like Figma but simpler.

**Estimated time with Claude Code:** 3–5 days of focused sessions.

---

### 1.1 — Project Setup

**Prompt for Claude Code:**
```
Create a new React + Vite + TypeScript project called "framerx".
Install: zustand, @dnd-kit/core, @dnd-kit/sortable, react-moveable,
selecto, motion, lucide-react, firebase, react-router-dom, tailwindcss.

Set up:
- Tailwind with the design token CSS variables in the spec
- Path aliases: @/ → src/
- ESLint + Prettier
- Folder structure as specified

App shell: full-screen dark layout, no scrollbars on body.
```

---

### 1.2 — Infinite Canvas

**What to build:**
- Pannable canvas (middle-mouse or Space+drag)
- Zoomable (scroll wheel, Cmd +/-)
- Dot-grid background that scales with zoom
- Zoom indicator in bottom-left
- Canvas coordinate space separate from screen space

**Prompt for Claude Code:**
```
Build an infinite canvas component at src/editor/canvas/Canvas.tsx.

Requirements:
- Pan: middle-mouse drag OR spacebar + left-drag
- Zoom: scroll wheel, range 10%–500%, smooth scaling
- Grid: dot pattern using CSS background, dots scale with zoom
- Transform stored in canvasStore: { x, y, scale }
- Coordinate conversion utils: screenToCanvas(x,y) and canvasToScreen(x,y)
- Canvas background color: #1a1a1a
- Grid dot color: #282828, dot size 1px, spacing 24px at 100% zoom
- Zoom label bottom-left showing "100%", clicking resets to 100%
- No scrollbars

State shape:
{
  x: number,        // pan offset X
  y: number,        // pan offset Y
  scale: number,    // zoom level 0.1–5
}
```

---

### 1.3 — Element System

**What to build:**
- Base element type (position, size, rotation, style)
- Element renderer that places elements on canvas
- Four initial element types: Frame, Text, Image, Shape

**Element type definition:**
```typescript
interface Element {
  id: string;
  type: 'frame' | 'text' | 'image' | 'shape' | 'stack';
  name: string;

  // Transform
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
  opacity: number;

  // Visibility
  visible: boolean;
  locked: boolean;

  // Children (for frames/stacks)
  children: string[];    // element IDs
  parentId: string | null;

  // Style
  style: {
    backgroundColor?: string;
    borderRadius?: number;
    border?: string;
    overflow?: 'visible' | 'hidden';
  };

  // Text specific
  text?: {
    content: string;
    fontSize: number;
    fontWeight: number;
    color: string;
    textAlign: 'left' | 'center' | 'right';
    lineHeight: number;
    letterSpacing: number;
  };

  // Image specific
  image?: {
    src: string;
    objectFit: 'cover' | 'contain' | 'fill';
  };
}
```

**Prompt for Claude Code:**
```
Build the element rendering system.

src/editor/elements/Element.tsx — renders any element type on the canvas.
Elements are positioned with absolute CSS using canvas coordinates.
Transform: `transform: translate(x, y) rotate(rotation)deg`

For the element store (src/store/editorStore.ts):
- elements: Record<string, Element>  — flat map by ID
- rootElementIds: string[]           — top-level order
- selectedIds: string[]              — current selection

Implement:
- addElement(element: Partial<Element>)
- updateElement(id, changes)
- deleteElement(id)
- duplicateElement(id)
- moveElement(id, x, y)
```

---

### 1.4 — Drag, Resize, Rotate

**What to build:**
- Click to select
- Drag to move
- 8 resize handles on selection
- Corner handles for rotation
- Multi-select (Shift+click, box select)
- Selection border (blue, 1px)

**Prompt for Claude Code:**
```
Integrate react-moveable for element transform controls.

When element(s) are selected, show:
- Blue selection border (#0091ff, 1px)
- 8 resize handles (white squares 6×6px, blue border)
- Rotation handle 24px above top-center
- Dimension label while dragging: "240 × 160"

Moveable config:
- Draggable: true
- Resizable: true
- Rotatable: true
- Snappable: true (snap to 8px grid)
- KeepRatio: hold Shift

On drag: update element x, y
On resize: update element width, height (and x, y for NW handles)
On rotate: update element rotation

For box selection, use Selecto:
- Draw selection rect on canvas background click+drag
- Select all elements whose bounds intersect
- Shift+click adds/removes from selection
- Click empty canvas = deselect all
```

---

### 1.5 — Keyboard Shortcuts

```
Delete / Backspace    — delete selected
Cmd+D                 — duplicate
Cmd+Z                 — undo
Cmd+Shift+Z           — redo
Cmd+C / Cmd+V         — copy/paste
Arrow keys            — nudge 1px
Shift+Arrow           — nudge 10px
Cmd+A                 — select all
Escape                — deselect
Cmd+G                 — group into frame
Cmd+Shift+G           — ungroup
[ / ]                 — move layer up/down
```

**Prompt for Claude Code:**
```
Implement all keyboard shortcuts in src/hooks/useKeyboard.ts.

Use useEffect with document.addEventListener('keydown').
Parse modifiers: metaKey (Mac) OR ctrlKey (Windows).
All shortcuts must be no-ops when focus is inside an input/textarea.
```

---

### 1.6 — History (Undo/Redo)

**Prompt for Claude Code:**
```
Build an undo/redo history system in src/editor/history/.

Strategy:
- Store snapshots of the full elements state
- Use immer to create immutable snapshots
- Max 100 history entries
- Every user action pushes a snapshot BEFORE the change

API:
  pushHistory()       — save current state
  undo()              — restore previous snapshot
  redo()              — restore next snapshot
  canUndo: boolean
  canRedo: boolean

Wrap all element-modifying actions (move, resize, add, delete)
with pushHistory() calls automatically.
```

---

### Phase 1 Checklist

```
[ ] Infinite canvas (pan + zoom)
[ ] Dot grid scales with zoom
[ ] Add Frame element
[ ] Add Text element
[ ] Add Image element
[ ] Add Shape element (rect, ellipse)
[ ] Click to select
[ ] Drag to move
[ ] 8-handle resize
[ ] Rotation handle
[ ] Box selection
[ ] Multi-select (Shift+click)
[ ] Delete element
[ ] Duplicate (Cmd+D)
[ ] Undo/Redo (Cmd+Z)
[ ] Copy/Paste
[ ] Nudge with arrow keys
[ ] Keyboard shortcut: select all
[ ] Keyboard shortcut: escape deselects
```

---

## Phase 2 — Panels (Layers + Inspector)

**Goal:** Left panel shows the layer tree. Right panel shows properties of selected element(s). Exactly like Framer.

---

### 2.1 — App Layout

```
┌─────────────────────────────────────────────────┐
│                    Toolbar                       │  48px
├──────────┬──────────────────────┬───────────────┤
│  Layers  │                      │   Inspector   │
│  240px   │       Canvas         │    240px      │
│          │                      │               │
│  (left)  │   (fills rest)       │   (right)     │
└──────────┴──────────────────────┴───────────────┘
```

**Prompt for Claude Code:**
```
Build the editor layout in src/pages/Editor.tsx.

Fixed layout, no scrollbars, full viewport:
- Top toolbar: 48px, background #161616, border-bottom 1px #2a2a2a
- Left panel: 240px wide, background #1c1c1c, border-right 1px #2a2a2a
- Right panel: 240px wide, background #1c1c1c, border-left 1px #2a2a2a
- Canvas: fills remaining space

All panels have their own internal scroll where needed.
Canvas is overflow: hidden.
```

---

### 2.2 — Top Toolbar

**What's in the toolbar:**

```
[Logo] [Tools: Select|Frame|Text|Image|Shape] ─── [Device picker] [Preview] [Publish]
```

**Tools:**
- `V` — Select tool (arrow)
- `F` — Frame tool (draw frame by dragging)
- `T` — Text tool (click to add text)
- `I` — Image tool (opens asset picker)
- `R` — Rectangle shape
- `O` — Ellipse shape

**Prompt for Claude Code:**
```
Build the toolbar at src/panels/toolbar/Toolbar.tsx.

Tool buttons: icon only, 28×28px, border-radius 4px.
Active tool: background #0091ff, icon white.
Inactive: transparent bg, icon #8a8a8a, hover bg #2a2a2a.

Tool icons (Lucide):
  Select:  MousePointer2
  Frame:   Square (dashed)
  Text:    Type
  Image:   Image
  Rect:    Square
  Ellipse: Circle

Right section: "Preview" button (ghost style) and "Publish" button (accent style).

Active tool stored in editorStore.activeTool.
Keyboard shortcuts:
  V → select, F → frame, T → text, R → rect, O → ellipse
```

---

### 2.3 — Layers Panel

**What it looks like:**
- Tree structure, collapsible groups
- Each row: 32px tall, icon + name
- Hover: subtle highlight
- Selected: blue tint background
- Double-click to rename (inline edit)
- Visibility toggle (eye icon) on hover
- Lock toggle on hover
- Drag to reorder
- Indentation: 16px per level

**Prompt for Claude Code:**
```
Build src/panels/layers/LayersPanel.tsx.

Render the element tree from editorStore.
Each layer row:
  - height: 32px
  - padding-left: 12px + (depth × 16px)
  - icon: based on element type (Frame=Square, Text=Type, etc.)
  - name: truncated with ellipsis
  - on hover: show eye icon (right), lock icon (far right)
  - selected state: background rgba(0,145,255,0.15)
  - text: #f0f0f0 for selected, #8a8a8a for unselected

Collapsible frames:
  - Chevron icon left of frame icon
  - Click chevron to collapse/expand children
  - Animate collapse with CSS transition

Drag to reorder using @dnd-kit/sortable.
Double-click name → inline <input> to rename.
Click layer → select element on canvas.
```

---

### 2.4 — Inspector Panel

The most complex panel. Matches Framer exactly.

**Sections (in order):**

```
┌─────────────────────────────┐
│  LAYOUT                     │
│  X [    ] Y [    ]          │
│  W [    ] H [    ] ⛓        │
│  Rotation [    ]°           │
│  Opacity  [    ]%           │
├─────────────────────────────┤
│  FILL                       │
│  [color swatch] [hex value] │
│  Opacity [slider]           │
├─────────────────────────────┤
│  BORDER                     │
│  [color] [width] [style]    │
├─────────────────────────────┤
│  BORDER RADIUS              │
│  [   ] [   ] [   ] [   ]   │
├─────────────────────────────┤
│  SHADOW                     │
│  X Y Blur Spread Color      │
├─────────────────────────────┤
│  TYPOGRAPHY  (text only)    │
│  Font family                │
│  Size Weight Line-H         │
│  Color Align                │
└─────────────────────────────┘
```

**Prompt for Claude Code:**
```
Build src/panels/inspector/InspectorPanel.tsx.

General styling:
- Section headers: uppercase, 10px, #555555, letter-spacing 0.08em
- Input fields: height 28px, background #252525, border 1px #2a2a2a,
  border-radius 4px, text #f0f0f0, font-size 12px
- Two-column grid for X/Y and W/H inputs
- Labels above inputs: 11px, #8a8a8a

Layout section — always visible:
  X, Y (position), W, H (size), Rotation, Opacity
  Chain icon between W+H for aspect ratio lock

Fill section:
  Color swatch (click → color picker popover)
  Hex input
  Opacity slider

Shadow section:
  "+" button to add shadow
  Per shadow: X, Y, Blur, Spread inputs + color swatch

Typography section (visible when text element selected):
  Font family dropdown
  Font size, font weight
  Line height, letter spacing
  Color picker
  Align buttons (L/C/R/J)

All inputs: on blur OR Enter → apply change.
On change, call updateElement(selectedId, changes).
If multiple elements selected, show "Mixed" placeholder.
```

---

### 2.5 — Color Picker

**Prompt for Claude Code:**
```
Build a color picker popover at src/panels/inspector/ColorPicker.tsx.

Appears when clicking a color swatch.
Positioned as a floating panel (not a modal).

Contents:
1. Saturation/brightness gradient square (240×160px)
2. Hue slider (horizontal, full width)
3. Opacity slider (checkered background)
4. Hex input (6 chars)
5. RGB inputs (R G B)
6. Preset swatches row (8 recent colors)

Style: background #1c1c1c, border 1px #2a2a2a, border-radius 8px,
shadow: 0 8px 24px rgba(0,0,0,0.6)
Use a canvas element for the gradient square.
```

---

### Phase 2 Checklist

```
[ ] 3-column editor layout (layers | canvas | inspector)
[ ] Top toolbar with all tool buttons
[ ] Tool switching (keyboard + click)
[ ] Layer panel renders element tree
[ ] Layer indentation by depth
[ ] Layer visibility toggle
[ ] Layer lock toggle
[ ] Layer rename on double-click
[ ] Layer drag-to-reorder
[ ] Layer click selects element
[ ] Inspector: X, Y, W, H inputs
[ ] Inspector: Rotation, Opacity inputs
[ ] Inspector: Fill color + opacity
[ ] Inspector: Border controls
[ ] Inspector: Border radius (4 corners)
[ ] Inspector: Shadow controls
[ ] Inspector: Typography controls (text only)
[ ] Color picker popover
[ ] Hex + RGB inputs in color picker
[ ] Hue + opacity sliders
[ ] Recent colors row
```

---

## Phase 3 — Component Library + Frames

**Goal:** Pre-built components users can drag onto canvas. Frames with auto layout.

---

### 3.1 — Component Library Panel

**Position:** Replaces layers panel when "Components" tab is active.
**Tabs at top of left panel:** Layers | Components | Assets

**Built-in components:**
```
Navigation
  ─ Navbar
  ─ Sidebar

Forms
  ─ Button (Primary, Ghost, Outline)
  ─ Input field
  ─ Checkbox
  ─ Toggle
  ─ Dropdown

Layout
  ─ Card
  ─ Hero section
  ─ Feature grid
  ─ Pricing table

Typography
  ─ Heading
  ─ Paragraph
  ─ Label
  ─ Code block
```

**Prompt for Claude Code:**
```
Build src/panels/components/ComponentsPanel.tsx.

Layout:
- Search input at top
- Accordion sections by category
- Each component shows a thumbnail (rendered mini-preview) + name
- Drag component from panel → drops on canvas at cursor position

Each built-in component is defined as a ComponentDefinition:
{
  id: string,
  name: string,
  category: string,
  thumbnail: string,   // base64 PNG
  defaultElement: Partial<Element>
}

On drop: call addElement() with defaultElement merged with drop position.
```

---

### 3.2 — Auto Layout (Frames)

Framer's most powerful feature. Frames can be set to auto layout mode.

**Auto Layout properties:**
```
Direction:     Horizontal | Vertical
Gap:           [number]px
Padding:       T R B L
Align:         Start | Center | End | Space-between
Wrap:          Yes | No
Fill children: Yes | No
```

**Prompt for Claude Code:**
```
Add auto layout support to Frame elements.

When a frame has autoLayout.enabled = true, render its children using
CSS Flexbox instead of absolute positioning.

autoLayout shape:
{
  enabled: boolean,
  direction: 'horizontal' | 'vertical',
  gap: number,
  padding: { top, right, bottom, left },
  alignItems: 'start' | 'center' | 'end',
  justifyContent: 'start' | 'center' | 'end' | 'space-between',
  wrap: boolean,
}

In the Inspector, when a Frame is selected:
- Show "Auto Layout" section with a toggle
- When enabled, show: direction toggle, gap input, padding inputs, alignment buttons
- Framer-style icons for direction and alignment

Children of auto-layout frames:
- Can set "Fill" width (flex: 1) or fixed width
- Can set "Fill" height or fixed height
```

---

### Phase 3 Checklist

```
[ ] Left panel tabs: Layers / Components / Assets
[ ] Component library with categories
[ ] Component search
[ ] Drag component to canvas
[ ] Frame element supports auto layout toggle
[ ] Auto layout direction (H/V)
[ ] Auto layout gap control
[ ] Auto layout padding control
[ ] Auto layout alignment controls
[ ] Children: fixed vs fill sizing
[ ] Inspector section for auto layout
```

---

## Phase 4 — Responsive Breakpoints

**Goal:** Desktop / Tablet / Mobile views. Different layouts per breakpoint.

---

### 4.1 — Breakpoint Bar

**Positioned below the toolbar, centered:**
```
┌─────────────────────────────────────────┐
│  ◻ Desktop (1440)  ◻ Tablet (768)  ◻ Mobile (390)  │
└─────────────────────────────────────────┘
```

**Breakpoints:**
| Name    | Width | Icon |
|---------|-------|------|
| Desktop | 1440  | Monitor |
| Tablet  | 768   | Tablet  |
| Mobile  | 390   | Phone   |

**Prompt for Claude Code:**
```
Build a breakpoint switcher below the toolbar.

Active breakpoint stored in editorStore.activeBreakpoint.
When switching breakpoints:
- Canvas shows a frame the width of the breakpoint
- Elements can have breakpoint-specific overrides

Element breakpoint override system:
element.breakpoints = {
  tablet: { x, y, width, height, visible },
  mobile: { x, y, width, height, visible },
}

When rendering: merge base element with active breakpoint overrides.
When editing at tablet/mobile: save changes to element.breakpoints[current].
```

---

### 4.2 — Responsive Inspector Controls

**Prompt for Claude Code:**
```
Update Inspector to show breakpoint-aware controls.

When not on Desktop:
- Show a small breakpoint badge next to changed values
- "+" icon to add breakpoint override for this property
- Overridden values display in blue (#0091ff)
- Click the override value to clear it (revert to desktop)
```

---

### Phase 4 Checklist

```
[ ] Breakpoint toolbar below main toolbar
[ ] Desktop / Tablet / Mobile presets
[ ] Canvas shows breakpoint frame width
[ ] Elements have per-breakpoint overrides
[ ] Inspector highlights overridden values
[ ] Adding/clearing breakpoint overrides
[ ] Responsive preview mode
```

---

## Phase 5 — Animations + Interactions

**Goal:** Elements animate on hover, tap, scroll. Interactions navigate or trigger effects.

---

### 5.1 — Animation Panel

**Appears as a section in the Inspector when element is selected.**

**Trigger types:**
- Hover (on mouse enter/leave)
- Tap (on click/touch)
- Appear (on mount / scroll into view)
- Drag
- While in view

**For each trigger, define:**
```
Transition:
  Type:      Tween | Spring | Inertia
  Duration:  [ms]
  Easing:    ease / ease-in / ease-out / spring

Animate properties:
  Opacity: from → to
  Scale: from → to
  X: from → to
  Y: from → to
  Rotate: from → to
  Background color: from → to
```

**Prompt for Claude Code:**
```
Build src/panels/inspector/AnimationSection.tsx.

Add "Interactions" section to Inspector.

Each element can have:
element.interactions = [
  {
    trigger: 'hover' | 'tap' | 'appear',
    animation: {
      opacity?: [number, number],
      scale?: [number, number],
      x?: [number, number],
      y?: [number, number],
      rotate?: [number, number],
    },
    transition: {
      type: 'tween' | 'spring',
      duration?: number,
      ease?: string,
      stiffness?: number,
      damping?: number,
    }
  }
]

In Preview mode, apply these interactions using Motion (framer-motion).
In the editor, show a subtle interaction indicator (lightning bolt icon).
```

---

### 5.2 — Interaction Triggers

**Prompt for Claude Code:**
```
Build src/panels/inspector/InteractionSection.tsx.

Interaction types (beyond animations):
  Navigate:      go to another page
  Open overlay:  show a frame as modal/drawer
  Scroll to:     scroll canvas to element
  Set variable:  change a CMS variable value

UI:
- "+" button to add interaction
- Dropdown: Hover / Tap / Scroll into view / After delay
- Second dropdown: action type
- Action-specific configuration below
```

---

### Phase 5 Checklist

```
[ ] Animations section in Inspector
[ ] Hover trigger + animation config
[ ] Tap trigger + animation config
[ ] Appear trigger + animation config
[ ] Tween transition type controls
[ ] Spring transition type controls
[ ] Navigate interaction
[ ] Open overlay interaction
[ ] Preview mode applies all interactions
[ ] Animation indicator on layer row
```

---

## Phase 6 — CMS (Content Management)

**Goal:** Dynamic content. Collections of data that populate repeating elements.

---

### 6.1 — CMS Collections

**Prompt for Claude Code:**
```
Build a CMS system.

Collection definition:
{
  id: string,
  name: string,
  fields: CmsField[],
  items: CmsItem[],
}

CmsField:
{
  id: string,
  name: string,
  type: 'text' | 'number' | 'image' | 'boolean' | 'date' | 'color' | 'link',
  required: boolean,
}

CmsItem: Record<fieldId, value>

UI:
- CMS tab in left panel (icon: Database)
- Collection list
- Click collection → shows table of items
- Add field, add item, edit inline
- Delete collection, delete item

Store collections in Firebase Firestore under project.
```

---

### 6.2 — Connecting Elements to CMS

**Prompt for Claude Code:**
```
Allow elements to bind their properties to CMS fields.

In the Inspector, for Text elements:
- Each text property shows a ⚡ "connect" icon
- Click → dropdown lists all CMS collections + fields
- Binding stored as: element.cmsBinding = { collectionId, fieldId }

When rendering a bound element:
- Show the field name as placeholder in editor: "{{Product.title}}"
- In Preview: render actual CMS data

For repeating layouts:
- A Frame can be set as "CMS Collection" frame
- It repeats once per CMS item, populating bound children
```

---

### Phase 6 Checklist

```
[ ] CMS tab in left panel
[ ] Create / delete collections
[ ] Add / edit fields (all types)
[ ] Add / edit / delete items
[ ] Table view for items
[ ] Connect text element to CMS field
[ ] Connect image element to CMS field
[ ] Preview renders real CMS data
[ ] Collection frame (repeating layout)
[ ] CMS data stored in Firestore
```

---

## Phase 7 — Publishing + Export

**Goal:** One-click publish to a live URL. Export clean HTML/CSS.

---

### 7.1 — HTML/CSS Export

**Prompt for Claude Code:**
```
Build src/lib/exporter.ts.

exportToHTML(project: Project): string

For each element on the page:
  - Map element type → HTML tag (frame→div, text→p/h1/span, image→img)
  - Convert element style to CSS
  - Handle nested elements (frame children)
  - Handle auto layout (flex CSS)
  - Handle breakpoints (CSS media queries)
  - Handle animations (CSS animations or inline motion)

Output: single HTML file with embedded CSS.
No dependencies — pure vanilla HTML/CSS.

exportToReact(project: Project): string
  - Same as above but generates React + Tailwind components
  - One component per named Frame
  - Returns a zip with index.tsx and components/
```

---

### 7.2 — One-click Publish

**Prompt for Claude Code:**
```
Build a publishing system.

Publish button in top toolbar → opens Publish modal.

Modal:
  - Project URL: [subdomain].framerx.app
  - "Publish" button → exports HTML, uploads to Firebase Hosting
  - Status: "Publishing..." → "Live at [url]"
  - "Copy link" button
  - "View published" button

Firebase Hosting deployment:
  - Use Firebase Admin SDK to deploy via REST API
  - Or: export HTML → upload to Firebase Storage → serve via CDN URL

Custom domain: text field to enter custom domain (Phase 8).
```

---

### Phase 7 Checklist

```
[ ] Export to single HTML file
[ ] Export to React + Tailwind components
[ ] Export applies breakpoint media queries
[ ] Export applies animations
[ ] Publish modal UI
[ ] Publishing uploads to Firebase Hosting
[ ] Live URL generation
[ ] "Copy link" functionality
[ ] "View published" opens in new tab
[ ] Publish status indicator
```

---

## Phase 8 — Dashboard + Auth

**Goal:** Project dashboard like Framer's home screen. Authentication.

---

### 8.1 — Authentication

**Prompt for Claude Code:**
```
Build auth with Firebase Auth.

Auth page at /auth with two tabs: Sign in / Sign up.

Sign in:
  - Email + password
  - "Continue with Google" button (OAuth)
  - Forgot password link

Sign up:
  - Name, email, password, confirm password
  - Terms checkbox

UI matches Framer's auth: centered card, dark background.
Background: #111111
Card: #1c1c1c, border 1px #2a2a2a, border-radius 12px, padding 32px
CTA button: #0091ff, border-radius 6px, full width

After auth → redirect to /dashboard.
Protected route: /editor/:projectId requires auth.
```

---

### 8.2 — Project Dashboard

**Prompt for Claude Code:**
```
Build the project dashboard at /dashboard.

Header: "FramerX" logo left, user avatar right, "New Project" button.

Project grid:
  - 4 columns on desktop, 2 on tablet, 1 on mobile
  - Each project card: thumbnail preview, name, last modified date
  - Hover card: show "Open", "Duplicate", "Delete" actions
  - Click → /editor/:projectId

New project:
  - Modal: enter project name, select canvas size (Web/Mobile/Custom)
  - Creates project in Firestore, redirects to editor

Project Firestore schema:
{
  id: string,
  name: string,
  ownerId: string,
  createdAt: timestamp,
  updatedAt: timestamp,
  thumbnail: string,  // base64 screenshot
  pages: Page[],
  elements: Record<string, Element>,
  cmsCollections: Collection[],
}
```

---

### Phase 8 Checklist

```
[ ] Firebase Auth setup
[ ] Sign in with email/password
[ ] Sign in with Google
[ ] Sign up flow
[ ] Forgot password
[ ] Protected routes
[ ] Dashboard layout
[ ] Project cards grid
[ ] Create new project modal
[ ] Open project → editor
[ ] Duplicate project
[ ] Delete project
[ ] Auto-save to Firestore (debounced 2s)
[ ] Project thumbnail generation
```

---

## Phase 9 — Polish + Performance

**Goal:** Make it feel premium. Fix rough edges. Optimize for real use.

---

### 9.1 — Snap & Guides

**Prompt for Claude Code:**
```
Implement smart snapping.

Snap targets:
  - Canvas center lines (X=0, Y=0)
  - Other element edges (top, right, bottom, left, center)
  - 8px grid

While dragging, show:
  - Pink snap guide lines
  - Distance label between elements ("32px")
  - Snap tolerance: 6px

Shift key: disable snapping temporarily.
```

---

### 9.2 — Performance Optimizations

**Prompt for Claude Code:**
```
Optimize canvas rendering for 100+ elements.

Optimizations:
1. React.memo on every Element component
2. Virtualize off-screen elements (don't render if outside viewport)
3. Use transform3d for GPU compositing
4. Debounce inspector updates (16ms)
5. Batch Zustand store updates
6. Canvas grid: draw with CSS background-image (not SVG)
7. Selection overlay: separate DOM layer with pointer-events:none
```

---

### 9.3 — Contextual Right-Click Menu

**Prompt for Claude Code:**
```
Right-click on element → context menu.

Menu items (varies by selection):
  Copy                  Cmd+C
  Paste                 Cmd+V
  Duplicate             Cmd+D
  Delete                Delete
  ─────────────────
  Group                 Cmd+G
  Frame selection
  ─────────────────
  Bring to Front        ]
  Bring Forward
  Send Backward
  Send to Back          [
  ─────────────────
  Copy styles
  Paste styles
  ─────────────────
  Create component
  Reset overrides

Style: dark panel, #1c1c1c bg, 1px #2a2a2a border, 8px radius.
Items: 28px tall, 12px horizontal padding, hover #2a2a2a.
Separator: 1px #2a2a2a.
Shortcut: right-aligned, #555555.
```

---

### Phase 9 Checklist

```
[ ] Smart snapping (element edges)
[ ] Snap guide lines (pink)
[ ] Distance labels between snapping elements
[ ] Grid snapping
[ ] React.memo on all element components
[ ] Off-screen element virtualization
[ ] Right-click context menu
[ ] All context menu actions functional
[ ] Copy/paste styles
[ ] Loading states on all async actions
[ ] Error boundaries around panels
[ ] Empty states (no elements, no projects)
```

---

## Claude Code Session Strategy

Each session should target ONE feature from a phase. Never ask for an entire phase at once.

**Good prompts:**
```
"Build the layer panel drag-to-reorder using dnd-kit. 
Here's the current LayersPanel.tsx: [paste file]"
```

```
"The color picker needs a hue slider. 
It should render as a canvas gradient from 0°–360°.
Here's the current ColorPicker.tsx: [paste file]"
```

```
"Add keyboard shortcuts for all the actions listed below.
They should be no-ops when focus is inside an <input>.
Current useKeyboard.ts: [paste file]"
```

**Bad prompts:**
```
"Build the entire inspector panel with all features"
"Make the editor work like Framer"
```

**Session cadence:**
1. Paste the current file you're working on
2. Describe ONE specific feature
3. Reference the spec for exact styles/behaviors
4. Review → apply → test → iterate

---

## Suggested First 7 Claude Code Sessions

| Session | Feature | Expected Output |
|---------|---------|----------------|
| 1 | Project setup + app shell | Working Vite app, dark layout |
| 2 | Infinite canvas (pan + zoom) | Pannable dot-grid canvas |
| 3 | Element system + rendering | Elements appear on canvas |
| 4 | react-moveable integration | Drag, resize, rotate working |
| 5 | Box selection (Selecto) | Drag-select multiple elements |
| 6 | Layers panel | Layer tree renders, click selects |
| 7 | Inspector: Layout section | X, Y, W, H inputs work live |

---

*FramerX Build Spec v1.0 — Built for Claude Code + Opus 4.8*
