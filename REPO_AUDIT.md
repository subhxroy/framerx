# REPO_AUDIT.md — FramerX (visual web builder)

> Audit date: 2026-06-30. Method: file-by-file read of all 70 TS/TSX source files + `supabase-schema.sql`, `package.json`, `vite.config.ts`, plus `grep`/`wc` across the tree. Verified by `tsc -b --noEmit` (passes, 0 errors) and `vite build` (passes).
>
> **Honesty note for the reader (you have no access to the source):** Verdicts use WORKING / PARTIAL / STUB / MISSING as defined in the prompt. Where a feature is "real but conditional" (e.g., hits Supabase only when env vars are set, otherwise falls back to localStorage) I say so explicitly rather than rounding up to WORKING. The single biggest correction applied during synthesis: the **Components panel is a preset drag-library, NOT a component/instance system** — those are different things and the prompt asked to distinguish them. Treat Section 2's per-feature detail as more trustworthy than Section 5's headline percentages.

---

## 1. Project Overview

### Stack
React 19 + Vite 8 + TypeScript ~6.0 + Zustand 5 (state) + react-moveable (transform) + selecto (marquee) + @dnd-kit (layers reorder) + motion/framer-motion 12 (animation runtime) + Supabase JS 2 (auth/db/storage) + Tailwind 4 + react-router 7 + lucide-react (icons).

### File count by directory (TS/TSX only)

| Dir | Files | LOC |
|---|---:|---:|
| `src/panels/inspector` | 17 | 3219 |
| `src/store` | 5 | 1513 |
| `src/pages` | 3 | 1345 |
| `src/editor/selection` | 3 | 650 |
| `src/editor/canvas` | 1 | 497 |
| `src/editor/elements` | 6 | 496 |
| `src/lib/export` | 3 | 493 |
| `src/panels/components` | 2 | 492 |
| `src/panels/layers` | 3 | 499 |
| `src/lib` (excl. export) | 7 | 470 |
| `src/panels/cms` | 4 | 407 |
| `src/hooks` | 4 | 399 |
| `src/panels/toolbar` | 1 | 385 |
| `src/components` | 3 | 313 |
| `src/panels/context` | 1 | 274 |
| `src/panels/publish` | 1 | 220 |
| `src/panels/assets` | 1 | 209 |
| `src/app` | 2 | 26 |
| **TOTAL** | **70** | **~11,917** |

Notable: the inspector (3.2k LOC across 17 files) and stores (1.5k) are the heaviest, real surfaces. Pages (1.3k) is large because `Dashboard.tsx` (636) and `Auth.tsx` (477) carry full UI.

### package.json vs actual usage

| Package | In package.json | Imported in `src` | Verdict |
|---|:--:|:--:|---|
| `react` / `react-dom` | ✅ | 51 / 1 | used |
| `zustand` | ✅ | 5 files | used (5 stores) |
| `react-moveable` | ✅ | 1 (`SelectionManager.tsx`) | used |
| `selecto` | ✅ | 2 | used |
| `@dnd-kit/core` `/sortable` `/utilities` | ✅ | 1 / 2 / 1 | used (layers panel only) |
| `motion` | ✅ | 1 (`AnimatedElement.tsx`) | used |
| `react-router-dom` | ✅ | 9 | used |
| `lucide-react` | ✅ | 20 | used |
| `@supabase/supabase-js` | ✅ | 1 (`lib/supabase.ts`) | used |
| `tailwindcss` | ✅ | 1 (`index.css` import) | used |
| `@tailwindcss/vite` | ✅ | 0 in `src` | used in `vite.config.ts` (legit) |
| **`firebase`** | ✅ (`^12.15.0`) | **0 files** | **DEAD DEPENDENCY** — migrated to Supabase; should be uninstalled |

- **Imports referencing packages NOT in package.json:** none. All bare imports resolve to declared deps; everything else is `@/` path-alias (configured in `vite.config.ts` → `./src`).
- **Installed but unused:** `firebase` (entirely unused; ~no code references remain — the old `src/lib/firebase.ts` has been deleted).

---

## 2. Feature-by-Feature Status

### Canvas & Viewport

#### Infinite pan — **WORKING**
`src/editor/canvas/Canvas.tsx`. Three pan paths: middle-mouse button, Space+drag, and trackpad two-finger (plain wheel).
```ts
// Canvas.tsx:64-71 (handleWheel) — plain scroll / two-finger trackpad pan
// Plain scroll / two-finger trackpad pan
setCanvas({
  x: c.x - e.deltaX,
  y: c.y - e.deltaY,
})
```
```ts
// Canvas.tsx:164-174 (handleCanvasPointerDown) — middle-mouse / space-drag pan
if ( e.button === 1 || (e.button === 0 && isSpaceDown.current) ) {
  isPanning.current = true
  lastPos.current = { x: e.clientX, y: e.clientY }
  e.preventDefault()
  return
}
```

#### Zoom (scroll, pinch, keyboard) — **WORKING**
`Ctrl/Cmd + wheel` zooms centered on cursor (trackpad pinch emits ctrl+wheel, so pinch works); keyboard `Ctrl +/-/0`, `Shift+1` zoom-to-fit. Range clamped 0.02–64 (2%–6400%).
```ts
// Canvas.tsx:46-61 — cursor-centered zoom, clamp 0.02..64
if (e.ctrlKey || e.metaKey) {
  const factor = e.deltaY < 0 ? 1.1 : 0.9
  const newScale = Math.min(64, Math.max(0.02, c.scale * factor))
  const rect = containerRef.current?.getBoundingClientRect()
  if (!rect) return
  const mx = e.clientX - rect.left, my = e.clientY - rect.top
  const sx = (mx - c.x) / c.scale, sy = (my - c.y) / c.scale
  setCanvas({ scale: newScale, x: mx - sx * newScale, y: my - sy * newScale })
  return
}
```

#### Dot grid rendering — **WORKING**
`Canvas.tsx:380-389` — radial-gradient dot grid, spacing scales with zoom (`gridSize * canvas.scale`), offset follows pan, hidden in preview mode.

#### Coordinate space conversion (screen↔canvas) — **WORKING**
```ts
// Canvas.tsx:29-39 (screenToCanvas)
const rect = containerRef.current?.getBoundingClientRect()
if (!rect) return { x: 0, y: 0 }
return {
  x: (screenX - rect.left - canvas.x) / canvas.scale,
  y: (screenY - rect.top - canvas.y) / canvas.scale,
}
```
Inverse mapping (canvas→screen) also present in `SmartGuides.tsx:toScreen`.

#### Smart guides / snapping — **WORKING**
Two cooperating layers: (1) react-moveable's built-in snapping to element edges/centers (`SelectionManager.tsx:153-164`, `snapThreshold=6`, element + center snap); (2) a separate visual overlay `src/editor/selection/SmartGuides.tsx` drawing pink (`#E040FB`) alignment lines at a 4px threshold **with numeric distance pills** between the dragged element and aligned neighbors.
```ts
// SmartGuides.tsx:26 + 55-60 — 4px threshold, emit vertical guide + gap label
const SNAP_THRESHOLD = 4 / canvasTransform.scale
...
if (Math.abs(da - ea) < SNAP_THRESHOLD) {
  let gap = 0, labelPos = dCY
  if (dTop >= eBottom) { gap = dTop - eBottom; labelPos = (eBottom + dTop) / 2 }
  else if (eTop >= dBottom) { gap = eTop - dBottom; labelPos = (dBottom + eTop) / 2 }
  guides.push({ type: 'v', pos: ea, gap: Math.round(gap), labelPos })
  break
}
```

#### Rulers — **MISSING**
No ruler component anywhere (`grep -ril ruler src` → 0 hits). Top/left measurement rulers do not exist.

---

### Element System

#### Element data model — **WORKING** (single source of truth)
Verbatim, as it exists today in `src/store/editorStore.ts:7-66`:
```ts
export type SizeMode = 'fixed' | 'fill' | 'hug'

export interface Element {
  id: string
  type: 'frame' | 'text' | 'image' | 'shape' | 'stack'
  name: string
  x: number
  y: number
  width: number
  height: number
  rotation: number
  opacity: number
  visible: boolean
  locked: boolean
  children: string[]
  parentId: string | null
  /** Width/height sizing behaviour. Absent ⇒ treated as 'fixed'. */
  sizing?: { width: SizeMode; height: SizeMode }
  style: {
    backgroundColor?: string
    borderRadius?: number
    borderRadiusCorners?: [number, number, number, number]
    border?: string
    overflow?: 'visible' | 'hidden'
    boxShadow?: ShadowDef[]
    blur?: number
    backdropBlur?: number
    strokeAlignment?: 'inside' | 'center' | 'outside'
    borderWidth?: number
    borderColor?: string
    borderStyle?: 'solid' | 'dashed' | 'dotted'
  }
  text?: { content: string; fontSize: number; fontWeight: number; color: string;
           textAlign: 'left'|'center'|'right'; lineHeight: number; letterSpacing: number }
  image?: { src: string; objectFit: 'cover'|'contain'|'fill' }
  autoLayout?: {
    enabled: boolean
    direction: 'horizontal' | 'vertical'
    gap: number
    padding: { top: number; right: number; bottom: number; left: number }
    alignItems: 'start' | 'center' | 'end' | 'stretch'
    justifyContent: 'start' | 'center' | 'end' | 'space-between' | 'space-around'
    wrap: boolean
  }
  breakpoints?: { tablet?: BreakpointOverrides; mobile?: BreakpointOverrides }
  interactions?: Interaction[]
  cmsBinding?: CMSBinding
}
```
The model is **flat**: `elements: Record<id, Element>` + `rootElementIds: string[]`, with each element holding `children: string[]` and `parentId`. **No duplicate/conflicting type file** — `src/editor/elements/types.ts` is just `export type { Element }` re-export (3 lines).

Note: `BreakpointOverrides` only covers geometry/visibility (`x,y,width,height,visible,opacity,rotation`) — **style/text/autoLayout cannot be overridden per breakpoint** (see Responsive section).

#### Implemented element types — **PARTIAL (5 of "Framer set")**
Render to real DOM: `frame`, `stack` (same renderer as frame), `text`, `image`, `shape` (uses FrameElement). **`svg`, `video`, vector/path, embed/code: MISSING** — not in the `type` union, no renderer.

#### Element rendering pipeline — **WORKING**
`src/editor/elements/Element.tsx` (`ElementRenderer`, memoized) reads the element from the store, merges breakpoint overrides via `getBPMerged`, applies CMS bindings (preview only), computes sizing→flex CSS, and dispatches by type:
```ts
// Element.tsx:87-102 — type dispatch
switch (merged.type) {
  case 'text':  return <TextElement element={merged} />
  case 'image': return <ImageElement element={merged} />
  case 'frame': case 'stack': case 'shape':
    return <FrameElement element={merged}>{isAutoLayoutContainer ? childRenderers : null}</FrameElement>
  default: return <FrameElement element={merged} />
}
```
Children render recursively; auto-layout children render as flex flow, others as absolutely-positioned (`position:absolute, inset:0, pointer-events:none` wrapper). Output wrapped in `AnimatedElement`. Root virtualization: off-viewport root elements render a hidden placeholder (`Element.tsx:66-69`).

---

### Selection & Transform

#### Click / multi / box select — **WORKING**
`src/editor/selection/SelectionManager.tsx` wires **Selecto** for marquee + click selection (`selectableTargets: ['[data-element-id]']`, `toggleContinueSelect: ['shift']` for multi-select).
```ts
// SelectionManager.tsx:45-66
const selecto = new Selecto({
  container: containerRef.current,
  dragContainer: selectoContainerRef.current,
  selectableTargets: ['[data-element-id]'],
  hitRate: 0, selectByClick: true, selectFromInside: false,
  toggleContinueSelect: ['shift'], ratio: 0,
})
selecto.on('selectEnd', (e) => { /* maps selected DOM → ids → setSelectedIds */ })
```
Plus **Cmd/Ctrl+click deep-select** (geometry hit-test, `Canvas.tsx:133-145` + `lib/hitTest.ts`) and **double-click drill-down** into nested children.

#### Drag to move — **WORKING**
react-moveable `onDrag` → `moveElement(id, left, top)` (`SelectionManager.tsx`). For auto-layout children it switches to reorder mode instead (see Layers/reorder).

#### Resize handles — **WORKING (all 8 + edges)**
```ts
// SelectionManager.tsx:169 (approx)
renderDirections={['nw', 'n', 'ne', 'w', 'e', 'sw', 's', 'se']}
```
Shift = proportional (`keepRatio={shiftHeld}`); Alt = scale-from-center (recomputes x/y from captured start-center). Live dimension label during resize.

#### Rotation — **WORKING**
`rotatable={true}`; `onRotate` → `updateElement(id, { rotation })` with a degree label.

#### react-moveable integrated & functional — **WORKING** (it is the transform engine, not just imported).
#### Selecto wired to box-selection — **WORKING** (drives marquee + click selection as above).

---

### State Management

#### Zustand store shapes — **WORKING** (5 domain stores, each authoritative for its slice)
- **`editorStore`** (566+ LOC) — the canvas source of truth. Shape:
```ts
// editorStore.ts:123-161 (EditorStore interface, excerpt)
elements: Record<string, Element>
rootElementIds: string[]
selectedIds: string[]
editingId: string | null
activeTool: Tool
activeBreakpoint: Breakpoint
previewMode: boolean
canvas: { x: number; y: number; scale: number }
history: { entries: Array<Record<string, Element>>; index: number }
// actions: addElement, addElementTree, updateElement, deleteElement, duplicateElement,
// moveElement, bringForward/sendBackward/bringToFront/sendToBack, groupSelection, ungroup,
// reorderChild, setSelectedIds, setEditingId, setActiveTool, setActiveBreakpoint,
// setPreviewMode, setCanvas, pushHistory, undo, redo, canUndo, canRedo
```
- **`projectStore`** — projects CRUD (Supabase `projects` + `project_data`, localStorage fallback).
- **`cmsStore`** — collections/fields/items (Supabase `cms_collections`/`cms_items`, localStorage fallback).
- **`authStore`** — Supabase auth + local mock fallback.
- **`assetsStore`** — image assets (localStorage data-URLs).

#### Actions referenced-but-undefined / defined-but-unreferenced
None found that break the build (`tsc` passes). All store actions referenced in components exist on the store; `reorderChild` (newest) is defined and called by SelectionManager.

#### Undo/redo — **WORKING (with a perf caveat)**
History stores **full deep-cloned snapshots** of the entire `elements` map on each `pushHistory()`, capped at 100 entries.
```ts
// editorStore.ts:601-611 (pushHistory)
const entries = state.history.entries.slice(0, state.history.index + 1)
entries.push(JSON.parse(JSON.stringify(state.elements)))   // full deep clone
if (entries.length > 100) entries.shift()
return { history: { entries, index: entries.length - 1 } }
```
Works correctly; `undo`/`redo` restore by deep-cloning the snapshot back. **Caveat:** O(n) full-map clone per edit + up to 100 retained snapshots → memory/CPU grows with document size. Fine for demos, a concern for large docs. No command/diff-based history.

---

### Layers Panel

#### Renders real element tree — **WORKING**
`src/panels/layers/LayersPanel.tsx` reads `elements`/`rootElementIds`/`selectedIds` from the store and recursively flattens the tree (respecting per-row collapse + search filter). Not mock data.

#### Drag-to-reorder — **PARTIAL (root-level only; nested silently fails)**
@dnd-kit is wired (`useSortable` in `LayerRow.tsx`), but the drop handler only reorders `rootElementIds`:
```ts
// LayersPanel.tsx:112-127 (handleDragEnd)
const oldIdx = rootElementIds.indexOf(active.id as string)
const newIdx = rootElementIds.indexOf(over.id as string)
if (oldIdx < 0 || newIdx < 0) return   // ← nested children fail this guard → no-op
pushHistory()
useEditorStore.setState({ rootElementIds: arrayMove(rootElementIds, oldIdx, newIdx) })
```
Dragging a nested layer does nothing (no parent-context reorder). Note: a separate **canvas** drag-to-reorder for auto-layout children DOES exist (`SelectionManager` + `reorderChild`), so the store CAN reorder children — the layers panel just doesn't call it.

#### Rename / lock / visibility — **WORKING**
All three call `pushHistory()` then `updateElement(id, …)`:
```ts
// LayersPanel.tsx — handlers (excerpt)
handleRename:          updateElement(id, { name })
handleToggleLock:      updateElement(id, { locked: !el.locked })
handleToggleVisibility:updateElement(id, { visible: !el.visible })
```
Double-click row to rename (`LayerRow.tsx`), eye/lock icons toggle.

---

### Inspector Panel

`src/panels/inspector/InspectorPanel.tsx` renders three tabs (`style`, `agent` (placeholder), `code`). On the style tab it always renders Layout, AutoLayout, Fill, Border, BorderRadius, Shadow, Blur, CMSBinding, Animation, Interaction; conditionally ImageSection (type image) and TypographySection (type text). **Every section's inputs write to the store** — verified by tracing each onChange to a real `updateElement` call. **Zero stubs.** Pattern across all sections:
`onChange/onBlur → section handler → pushHistory() + updateElement(id, changes)`.

| Section | File | Verdict | Wiring evidence |
|---|---|---|---|
| Layout (X/Y/W/H/rot/opacity, sizing mode, aspect lock, BP overrides) | `LayoutSection.tsx` | WORKING | `updateWithBP → updateElement(single.id,{[field]:value})` (63-89) |
| Auto Layout | `AutoLayoutSection.tsx` | WORKING | `setAutoLayout → updateElement(el.id,{autoLayout:{...}})` (19-36) |
| Fill (solid/linear/radial, multi-fill, angle, visibility) | `FillSection.tsx` | WORKING (PARTIAL: gradient **stops not editable**) | `saveFills → updateElement(el.id,{style:{...fills}})` (64-76) |
| Border (width/style/color) | `BorderSection.tsx` | WORKING | `handleBorderChange → updateElement(el.id,{style:{border}})` (22-35) |
| Border Radius (uniform + per-corner) | `BorderRadiusSection.tsx` | WORKING | `setUniform`/`setCorner → updateElement` (21-43) |
| Shadow (multiple, x/y/blur/spread/color) | `ShadowSection.tsx` | WORKING | `writeShadows → updateElement(el.id,{style:{boxShadow}})` (50-57) |
| Blur (layer + backdrop) | `BlurSection.tsx` | WORKING | `update → updateElement(el.id,{style:{[field]:v}})` (17-21) |
| Typography (family/size/weight/lh/ls/color/align/transform) | `TypographySection.tsx` | WORKING | `handleTextChange → updateElement(el.id,{text})` (41-48) |
| Image (src URL, objectFit) | `ImageSection.tsx` | WORKING | `setImage → updateElement(el.id,{image})` (14-27) |
| Animation (trigger/anim values/transition) | `AnimationSection.tsx` | WORKING | `updateInteraction → updateElement(elementId,{interactions})` (43-48) |
| Interaction (navigate/overlay actions) | `InteractionSection.tsx` | WORKING | `updateAction → updateElement(elementId,{interactions})` (40-45) |
| CMS Binding (collection/field/collection-frame) | `CMSBindingSection.tsx` | WORKING | `updateElement(elementId,{cmsBinding})` (73-137) |

#### Color picker — **WORKING (real HSV implementation)**
`src/panels/inspector/ColorPicker.tsx` (371 LOC): real saturation/value canvas with drag, hue slider, hex field with validation, RGB 0-255 inputs, recent-colors swatches; continuous `onChange` during drag.
```ts
// ColorPicker.tsx:135-147 (handleSatMove) — drag to set saturation/value
const rect = canvas.getBoundingClientRect()
const x = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width))
const y = Math.max(0, Math.min(1, (e.clientY - rect.top) / rect.height))
setSat(x); setVal(1 - y); applyColor(hue, x, 1 - y)
```

#### Number inputs — **WORKING**
`NumberInput.tsx` commits via onBlur, arrow keys (Shift=×10), Enter, and **drag-scrub on the label**. `RespNumberInput.tsx` adds breakpoint-override UI (auto-creates an override on arrow-key edit when not on desktop).

#### Code tab — **WORKING (read-only viewer)**
`CodePanel.tsx` generates HTML/CSS for the selected element via `exportElementHtml` and shows it with copy-to-clipboard. Read-only (no edit-back). NOTE: it imports the **deprecated** `lib/exportHtml.ts` (see Dead Code §4).

---

### Auto Layout — **WORKING**
Toggling auto-layout on a frame genuinely changes child rendering to flexbox. `AutoLayoutSection` writes `autoLayout`, and `FrameElement.tsx` consumes it:
```ts
// FrameElement.tsx:48-67 — real flexbox output
display: 'flex',
flexDirection: al.direction === 'horizontal' ? 'row' : 'column',
gap: al.gap,
padding: `${al.padding.top}px ${al.padding.right}px ${al.padding.bottom}px ${al.padding.left}px`,
alignItems: alignMap[al.alignItems] ?? 'stretch',
justifyContent: alignMap[al.justifyContent] ?? 'flex-start',
flexWrap: al.wrap ? 'wrap' : 'nowrap',
```
Children in an auto-layout parent render with `flow` styling in `Element.tsx`, translating `sizing` (fixed/fill/hug) into `flex-grow`/`align-self:stretch`/`fit-content`. Align supports start/center/end/stretch; justify supports start/center/end/space-between/space-around.

---

### Animations & Interactions

#### Motion (framer-motion) actually used — **WORKING (preview-mode only)**
`src/editor/elements/AnimatedElement.tsx` renders a real `motion.div` and maps interactions to motion props:
```ts
// AnimatedElement.tsx:46-57
for (const int of interactions) {
  if (int.trigger === 'hover' && int.animation) motionProps.whileHover = getToValues(int.animation)
  if (int.trigger === 'tap'   && int.animation) motionProps.whileTap   = getToValues(int.animation)
  if (int.trigger === 'appear'&& int.animation) {
    motionProps.initial = getFromValues(int.animation)
    motionProps.animate = getToValues(int.animation)
  }
}
```
Interactions are passed only when `previewMode` is true (`Element.tsx:198`: `interactions={previewMode ? element?.interactions : undefined}`); otherwise a plain `<div>` renders. Tap can trigger `window.open(url)` navigation.

#### Trigger system
- Hover — **WORKING** (`whileHover`)
- Tap/press — **WORKING** (`whileTap` + onTap navigate)
- Appear (on mount) — **WORKING** (`initial`/`animate`)
- **Scroll / in-view trigger — MISSING** (trigger union is only `'hover'|'tap'|'appear'`; no IntersectionObserver/`whileInView`)
- **Keyframes (multi-stop) — MISSING** (animation values are `[from,to]` tuples only, for opacity/scale/x/y/rotate)
- **Spring `mass` — MISSING**, **easing curve picker — PARTIAL** (easing is a free-text string input, no visual cubic-bezier editor)

---

### CMS — **WORKING (real Supabase CRUD when configured; localStorage fallback; fire-and-forget writes)**

#### Collections / fields / items CRUD
`src/store/cmsStore.ts` performs real Supabase reads/writes; `src/panels/cms/*` (CMSPanel, CollectionEditor, ItemEditor, ItemsTable) are wired to it. Field types supported: text, rich-text, image, number, boolean, date, color, link, file, video, enum.
```ts
// cmsStore.ts:84-103 (loadCMSData) — real queries
const { data: cols } = await supabase.from('cms_collections').select('*').eq('project_id', projectId)
...
const { data: itms } = await supabase.from('cms_items').select('*').in('collection_id', collIds)
```
```ts
// cmsStore.ts:231-247 (addItem) — optimistic UI + real insert
set((s) => ({ items: { ...s.items, [collectionId]: [...(s.items[collectionId]||[]),
  { id, collectionId, values, createdAt: Date.now() }] }}))
if (isSupabaseConfigured && supabase) {
  supabase.from('cms_items').insert({ id, collection_id: collectionId, values })
    .then(({ error }) => { if (error) console.error(error) })   // fire-and-forget
}
```
**Caveats:** (1) all writes are **fire-and-forget** (`.then(...)`, not awaited) → DB errors are console-logged only, never surfaced to the UI, so silent failures are possible; (2) **without env vars the whole thing is localStorage-only** (still functional locally).

#### Schema vs usage — all tables used
`supabase-schema.sql` defines: `projects`, `project_data`, `cms_collections`, `cms_items`, and a `sites` storage bucket, all with RLS policies. Each is actually queried in code:

| Table | Queried in | Ops |
|---|---|---|
| `projects` | `projectStore.ts` | SELECT/INSERT/UPDATE/DELETE |
| `project_data` | `projectStore.ts` | INSERT/UPSERT/SELECT |
| `cms_collections` | `cmsStore.ts` | SELECT/INSERT/UPDATE/DELETE |
| `cms_items` | `cmsStore.ts` | SELECT/INSERT/UPDATE/DELETE |
| `sites` (storage) | `lib/supabase-deploy.ts` | upload/getPublicUrl |

#### Dynamic bindings + Collection List — **WORKING (PARTIAL on layout)**
Elements bind to fields via `cmsBinding`; `Element.tsx` injects real item values (text content / image src) in preview. A "collection frame" repeats its template once per item — but the repeat layout is **hardcoded vertical stacking** (`top: merged.y + idx * (merged.height + 20)`, `Element.tsx`), no grid/wrap, and only renders in preview mode. No drag-out "Collection List" component preset.

---

### Responsive Breakpoints — **PARTIAL**

#### Switching UI — **WORKING**
Toolbar Desktop/Tablet/Mobile buttons set `activeBreakpoint` and a canvas scale (`Toolbar.tsx:76-79`). Canvas constrains width to the breakpoint (`breakpointWidths`: desktop 1440 / tablet 768 / mobile 390).

#### Does it change rendering? — **WORKING (overrides apply)** but **cascade is BROKEN — PARTIAL**
`getBPMerged` only merges **desktop base + the current breakpoint's own overrides**. It does **not** cascade tablet→phone:
```ts
// lib/breakpointUtils.ts:3-21 (getBPMerged)
if (bp === 'desktop') return element
const overrides = element.breakpoints?.[bp]
if (!overrides) return element        // ← phone with no phone override shows DESKTOP, never tablet
return { ...element, ...(overrides.x !== undefined ? { x: overrides.x } : {}), ... }
```
So a value set on tablet does **not** flow down to phone (phone falls back to desktop). This violates the desktop-first cascade spec. Also `BreakpointOverrides` only supports geometry/visibility — **style, typography, and autoLayout changes cannot be made responsive at all.**

#### Override indicators in UI — **PARTIAL**
Only `LayoutSection` uses `RespNumberInput` (shows accent dot + `+`/`×` to add/clear an override). Fill/Border/Typography/etc. have **no** override indicators or per-breakpoint editing.

---

### Components System — **STUB (it's a preset library, not a component/instance system)**

There is **no** master/instance/variant concept anywhere. `grep -rinE 'variant|instanceOf|masterId|isInstance|componentId' src` returns only `fontVariantNumeric` (a CSS prop). The `Element` interface has no component fields.

What actually exists (`src/panels/components/ComponentsPanel.tsx` + `ComponentDefinitions.ts`): a drag-out library of **hardcoded preset element trees** (Navbar, Hero, Card, Button, etc.). Dragging one onto the canvas calls `addElementTree` to clone the preset. There is no master that, when edited, propagates to instances; no variant states; no instance property overrides; no component isolation view.
```ts
// ComponentDefinitions.ts (Navbar preset, excerpt) — just a static tree factory
{ id: 'navbar', name: 'Navbar', category: 'Navigation',
  create: (x, y) => ({ rootId: frameId, elements: [ /* frame + text children, fixed */ ] }) }
```
**Verdict for "interactive components & variants" (the Framer feature): MISSING.** **Verdict for "component library presets" (the simpler thing): WORKING.**

---

### Export & Publishing

#### HTML/CSS export (tree-walk) — **WORKING**
Active exporter: `src/lib/export/htmlExporter.ts` + `cssGenerator.ts` (wired to PublishModal and React export). Recursively walks the element tree to emit semantic-ish HTML + a `<style>` block.
```ts
// htmlExporter.ts (exportToHTML, excerpt) — tree-walk + media queries
const css = generateCSS(elements, rootIds, options?.includeAnimations !== false)
const bodyContent = rootIds.map(id => elements[id] ? renderElementHTML(elements[id], elements) : '').join('\n')
const mediaQueries = [css.tabletMedia, css.mobileMedia].filter(Boolean).join('\n\n')
return `<!DOCTYPE html> ... <style>${css.base}\n${mediaQueries}\n${css.animations}</style> ...`
```
```ts
// cssGenerator.ts:223-228 — real @media breakpoints matching project widths
tabletMedia: tabletOverrides.length ? `@media (max-width: 768px) {\n${...}\n}` : '',
mobileMedia: mobileOverrides.length ? `@media (max-width: 390px) {\n${...}\n}` : '',
```
- **Tailwind output — MISSING.** Output is plain CSS classes (`.el-N { ... }`), not Tailwind utility classes, despite the spec asking for Tailwind.
- Semantic HTML — minimal (text picks h2/h3/p by font-size; everything else is `<div>`).

#### React export — **WORKING**
`src/lib/export/reactExporter.ts` generates a single React component with inline styles (used by `PublishModal`). Single flat component, no child decomposition.

#### Publish/deploy — **WORKING (real, conditional on Supabase config)**
```ts
// PublishModal.tsx:56-69 (handleDeploy)
const html = exportToHTML(elements, rootElementIds, { includeAnimations: true })
const result = await deployToSupabase(html, projectId)
if (result.success && result.url) setDeployResult({ url: result.url })
else setDeployError(result.error || 'Deploy failed')
```
```ts
// lib/supabase-deploy.ts:31-43 — real Storage upload + public URL
const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8' })
const path = `${user.uid}/${projectId}/index.html`
const { error: uploadError } = await supabase.storage.from('sites').upload(path, blob, { upsert: true, ... })
const { data } = supabase.storage.from('sites').getPublicUrl(path)
```
Real Supabase Storage upload returning a shareable public URL. **No Firebase deploy code remains.** Without Supabase env vars it returns an error string (no local simulation of the deployed URL).

---

### Auth & Dashboard

#### Auth — **WORKING (real Supabase) with an INSECURE local fallback**
`src/store/authStore.ts` calls real `supabase.auth.signInWithPassword` / `signUp` / `signInWithOAuth('google')` when configured, and `Auth.tsx` forms call these. Session bootstrapped via `onAuthStateChange`.
```ts
// authStore.ts:86-105 (signIn)
if (isSupabaseConfigured && supabase) {
  const { error } = await supabase.auth.signInWithPassword({ email, password })
  if (error) { useAuthStore.getState().setError(error.message); return false }
  return true
}
// Local mock — accepts ANY email/password, stores a fake user in localStorage
const user = { uid: 'local_user', email, displayName: email.split('@')[0], photoURL: null }
useAuthStore.getState().setUser(user); localStorage.setItem('framer_auth_user', JSON.stringify(user))
return true
```
**Caveat:** when env vars are absent, login accepts **any** credentials and fabricates a `local_user` — fine for local dev, but it means "auth" is only real in a configured deployment.

#### Dashboard — **WORKING**
`Dashboard.tsx` calls `loadProjects()` on mount; `projectStore.loadProjects` queries `supabase.from('projects').select('*').eq('user_id', uid)` (falls back to localStorage). Create/rename/delete/duplicate all flow through the store to Supabase (or localStorage).

#### Auto-save — **WORKING**
`src/hooks/useAutoSave.ts` subscribes to editorStore, debounces 2s, writes canvas data to `project_data` + bumps `projects.updated_at`; Ctrl/Cmd+S forces an immediate save.
```ts
// useAutoSave.ts:11-20 (doSave)
await useProjectStore.getState().saveProjectData(projectId, {
  elements: JSON.parse(JSON.stringify(s.elements)),
  rootElementIds: s.rootElementIds,
  canvas: { ...s.canvas },
})
await useProjectStore.getState().updateProject(projectId, { updatedAt: Date.now() })
```

---

### Keyboard Shortcuts (every binding actually attached to an event listener)

| Combo | Action | File |
|---|---|---|
| Delete / Backspace | delete selected | `hooks/useKeyboard.ts` |
| Ctrl/Cmd+D | duplicate | `useKeyboard.ts` |
| Ctrl/Cmd+Z / +Shift+Z | undo / redo | `useKeyboard.ts` |
| Ctrl/Cmd+G / +Shift+G | group / ungroup | `useKeyboard.ts` |
| Ctrl/Cmd+A | select all roots | `useKeyboard.ts` |
| Escape | deselect | `useKeyboard.ts` |
| `[` / `]` | send backward / bring forward | `useKeyboard.ts` |
| Arrows (Shift=10px) | nudge | `useKeyboard.ts` |
| Tab / Shift+Tab | cycle siblings | `useKeyboard.ts` |
| Ctrl/Cmd+P | toggle preview | `useKeyboard.ts` |
| Space (hold) | pan mode | `canvas/Canvas.tsx` |
| V/F/T/I/R/O | select/frame/text/image/rect/ellipse tool | `Canvas.tsx` |
| Shift+1 | zoom to fit | `Canvas.tsx` |
| Ctrl/Cmd+0 / +/- | reset / zoom in / out | `Canvas.tsx` |
| Ctrl/Cmd+click | deep-select | `Canvas.tsx` |
| Ctrl/Cmd+wheel; plain wheel | zoom; pan | `Canvas.tsx` |
| Shift / Alt (hold) | proportional / center resize | `selection/SelectionManager.tsx` |
| Ctrl/Cmd+S | force save | `hooks/useAutoSave.ts` |
| Ctrl/Cmd+C / V / X | copy / paste / cut | `hooks/useClipboard.ts` |
| Ctrl/Cmd+K; Escape | open / close command palette | `pages/Editor.tsx` |

~27 distinct bindings across 6 files — all real. **Conflict risk:** copy/paste/duplicate/delete exist in BOTH `useKeyboard.ts`/`useClipboard.ts` AND the right-click `ContextMenu` (consistent, but two code paths to keep in sync). `[`/`]` and Escape are bound in two places each.

---

## 3. Architecture Assessment

**Source of truth:** Clean. `editorStore` is the single authority for element/canvas state; the other four stores (`project`, `cms`, `auth`, `assets`) own disjoint domains with no state duplication. Element state is **not** duplicated across components — components subscribe to store slices via Zustand selectors.

**Coupling / circular deps:** None fatal (build passes, no import cycles surfaced). `Element.tsx` is a sensible recursion hub. `Canvas.tsx` reaches into `useEditorStore.getState()` imperatively in event handlers (pragmatic, not circular). The flat `Record<id,Element>` + `children[]` model keeps tree ops centralized in the store.

**Rendering performance red flags:**
1. **History deep-clone:** `pushHistory` does `JSON.parse(JSON.stringify(elements))` and retains up to 100 snapshots — O(n) per edit, memory grows with doc size.
2. **Auto-save clone:** `doSave` also deep-clones the entire elements map every 2s on change.
3. **SmartGuides** recomputes against `Object.keys(elements)` on every drag-move frame (fine at small scale, scales poorly).
4. Mitigations present: `ElementRenderer` is `React.memo`'d; root elements are viewport-virtualized; Zustand selectors give per-slice subscriptions. Net: smooth for demo-sized docs, not yet optimized for hundreds of elements.

**Other:** `agent` inspector tab is a placeholder. Two HTML exporters coexist (one deprecated). CMS writes swallow errors.

---

## 4. Dead Code & Inconsistencies

- **`firebase` dependency** — installed (`^12.15.0`), imported in **0** files. Remove it.
- **`src/lib/exportHtml.ts`** — explicitly `@deprecated` in its own header ("superseded by `src/lib/export/htmlExporter.ts`"), yet still imported by **`CodePanel.tsx`** for the single-element code preview. Two parallel HTML-export implementations exist (`exportHtml.ts` legacy vs `export/htmlExporter.ts` active) → **duplicate/conflicting implementation** of the same feature. Migrate CodePanel to the active exporter and delete the legacy file.
- **`agent` inspector tab** — rendered as a placeholder with no functionality (`InspectorPanel.tsx`).
- **Layers nested drag-to-reorder** — handler exists but is a silent no-op for non-root rows (see §2 Layers).
- **`BreakpointOverrides` type** — only models geometry/visibility, but the spec/UI imply style responsiveness; the type doesn't match the full intended runtime shape (style/typography can't be overridden). Mild type-vs-intent mismatch.
- No TODO/FIXME comments and no large commented-out blocks found anywhere in `src/` (the codebase is tidy).
- No duplicate ColorPicker / no duplicate element-type files (`editor/elements/types.ts` is a 3-line re-export, not a conflicting definition).

---

## 5. Honest Completion Percentage

Tally from Section 2 (counting sub-features): ~33 WORKING, ~7 PARTIAL, ~2 STUB, ~6 MISSING.

- **Canvas / editor core actually functional: ~85%.** Pan/zoom/grid/coords/selection/transform/resize/rotate/snapping/auto-layout/rendering all real. Docked points: rulers missing, history/perf naïve, nested-layer reorder gap.
- **Panels (layers + inspector) actually functional: ~85%.** Inspector is genuinely complete (every control writes to the store; real HSV color picker). Layers render + rename/lock/visibility work; only nested drag-reorder and per-breakpoint style overrides are missing. Gradient stop editing absent.
- **Backend (CMS, auth, publish, dashboard, autosave): ~75% — but conditional.** All paths are real against Supabase AND build/run, with localStorage fallback. Discounted because: it only behaves as a real backend with env vars configured, the insecure local-auth fallback, fire-and-forget CMS writes (swallowed errors), and no email-confirm/reset UX polish.
- **Overall toward a usable, demo-able real visual editor (NOT Framer parity): ~78%.** You can sign in, create a project, drag/draw/style/arrange/auto-layout elements, bind CMS data, preview animations, and publish a live URL. The gaps that bite a demo are concentrated, not pervasive.

**Reality-check vs the headline number:** the 78% is *not* inflated by fake UI — Section 2 shows the inspector and canvas are real. It *is* propped up by "WORKING-conditional" backend (needs env) and by counting the preset library as a (different) working feature. The genuinely **MISSING** big-ticket items are: real **components/variants/instances**, **scroll/in-view animations + keyframes**, **responsive style cascade** (only geometry cascades, and even that is broken tablet→phone), **rulers**, and **Tailwind export**.

---

## 6. Recommended Next 5 Things To Build

1. **Fix the breakpoint cascade (highest ROI, small).** Rewrite `getBPMerged` in `src/lib/breakpointUtils.ts` to cascade desktop→tablet→phone (phone reads tablet overrides, then desktop). Then extend `BreakpointOverrides` + `RespNumberInput` usage beyond `LayoutSection` so Fill/Typography/etc. can be made responsive. Without this, "responsive" is a half-truth.

2. **Real Components/Variants system (biggest missing feature, largest effort).** Add `componentId`/`isInstance`/`variants`/`activeVariant` to the `Element` model in `src/store/editorStore.ts`; add a "Create Component" action (wire into `src/panels/context/ContextMenu.tsx`); render instances with property overrides in `src/editor/elements/Element.tsx`; add a variants panel and wire variant transitions into the existing `AnimatedElement.tsx`. This is the marquee Framer capability and currently absent.

3. **Finish layers nested drag-to-reorder.** In `src/panels/layers/LayersPanel.tsx:handleDragEnd`, stop assuming root scope — look up each row's `parentId` and call the already-existing `reorderChild(parentId, childId, beforeId)` store action (or `setState` on the parent's `children`). The store half already works (used by canvas reorder); only the panel handler is wrong.

4. **Harden the backend path.** (a) `await` CMS writes in `src/store/cmsStore.ts` and surface errors to the UI instead of `console.error`; (b) gate the insecure local-auth fallback in `src/store/authStore.ts` behind an explicit dev flag; (c) remove the dead `firebase` dependency and migrate `CodePanel.tsx` off the deprecated `src/lib/exportHtml.ts`, then delete it.

5. **Scroll/in-view animations + Tailwind export.** Add an `'inview'` trigger (IntersectionObserver / motion `whileInView`) in `src/editor/elements/AnimatedElement.tsx` and the `Interaction` type — the cheapest way to make the animation system feel "real" in published output. In parallel, switch `src/lib/export/cssGenerator.ts`/`reactExporter.ts` to emit Tailwind utility classes (spec requirement) instead of generated `.el-N` CSS.

---

*End of audit.*
