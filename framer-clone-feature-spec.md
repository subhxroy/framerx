# FramerX — Full Feature Specification & Master Prompt
### Every feature, behavior, and interaction needed for a Framer-identical editor

This document is written as a prompt you can hand to Claude Code directly. Each section is self-contained — paste the section you're working on, plus the relevant files, into a session. Together, all sections form the complete feature surface of the product.

---

## How to use this document

Don't paste the whole thing into one Claude Code session — it's too large to implement in one shot and the output quality drops. Instead:

1. Pick one numbered section below.
2. Paste that section + your current relevant files into Claude Code.
3. Implement, test, commit.
4. Move to the next section.

Sections are ordered roughly by dependency — earlier sections unlock later ones.

---

## 1. Canvas & Viewport

```
Build the core canvas viewport with these exact behaviors:

PAN
- Hold Space + drag with left mouse button to pan
- Middle-mouse-button drag pans without needing Space
- Two-finger trackpad scroll pans (trackpad gesture, not wheel zoom)
- Pan is unbounded in all directions (infinite canvas)
- Cursor changes to "grab" when Space is held, "grabbing" while dragging

ZOOM
- Cmd/Ctrl + scroll wheel zooms, centered on cursor position
- Pinch-to-zoom on trackpad
- Zoom range: 2% to 6400% (Framer's actual range)
- Cmd/Ctrl + "+" / "-" zoom in/out in fixed steps (10%, 25%, 50%, 100%, 150%, 200%, 400%)
- Cmd/Ctrl + 0 resets to 100%
- Shift + 1 zooms to fit all content
- Shift + 2 zooms to fit selection
- Zoom percentage shown bottom-left, click to open a dropdown with preset zoom levels

GRID
- Dot grid background, dot spacing 8px at 100% zoom
- Grid dots fade out below 25% zoom (avoid visual noise)
- Grid scales with zoom level, dots get denser/sparser proportionally
- Grid color: subtle, barely visible against canvas background

RULERS (optional but Framer has these)
- Horizontal ruler top, vertical ruler left, toggle with Cmd+R
- Show pixel measurements at current zoom
- Dragging from ruler creates a guide line

COORDINATE SYSTEM
- Maintain a clean separation between "canvas space" (actual element coordinates)
  and "screen space" (pixels on the user's monitor)
- All math for snapping, selection, and collision must happen in canvas space
- Provide utility functions: screenToCanvas(point), canvasToScreen(point)

PERFORMANCE
- Canvas transform uses CSS transform on a single wrapper div (GPU-accelerated),
  never re-render individual elements on pan/zoom
- RequestAnimationFrame for smooth pan/zoom, not direct state updates per pixel
```

---

## 2. Element System & Types

```
Implement the full element type system. Every object on the canvas is an Element
with this complete shape:

interface Element {
  id: string
  type: ElementType
  name: string                    // user-editable, shown in layers panel

  // Transform (always present)
  x: number
  y: number
  width: number | 'auto' | 'fill'
  height: number | 'auto' | 'fill'
  rotation: number                // degrees
  opacity: number                 // 0-100

  // Hierarchy
  parentId: string | null
  children: string[]              // ordered child IDs

  // State
  visible: boolean
  locked: boolean

  // Visual style (applies to all types)
  fills: Fill[]                   // can have multiple fills, like Figma
  strokes: Stroke[]
  cornerRadius: number | CornerRadiusPerCorner
  shadows: Shadow[]
  blur: number                    // backdrop blur, for glassmorphism
  blendMode: BlendMode

  // Layout (frames only)
  layout?: AutoLayoutConfig

  // Type-specific data
  text?: TextData
  image?: ImageData
  svg?: SvgData
  video?: VideoData

  // Responsive
  breakpointOverrides?: Record<BreakpointId, Partial<Element>>

  // Interactivity
  interactions?: Interaction[]
  cmsBinding?: CmsBinding

  // Component system
  componentId?: string            // if this is an instance
  isComponentMaster?: boolean
  overrides?: Record<string, any> // instance-specific overrides
}

type ElementType =
  | 'frame'      // container, can have auto layout
  | 'text'
  | 'image'
  | 'shape'      // rect, ellipse, polygon, star, line
  | 'svg'
  | 'video'
  | 'component-instance'
  | 'stack'      // shorthand for frame with auto layout pre-enabled

ELEMENT-SPECIFIC REQUIREMENTS:

Frame:
  - Can clip children (overflow: hidden toggle)
  - Can have auto layout (see Section 5)
  - Background can be solid color, gradient, image, or video
  - Can be set as a "page" root (top-level frame = a page)

Text:
  - Rich text: per-character bold/italic/color/link is NOT required for v1,
    but per-element font/size/weight/color/align IS required
  - Auto-width or auto-height or fixed
  - Support for Google Fonts (load dynamically)
  - Line height, letter spacing, text transform (uppercase/lowercase)
  - Vertical alignment within fixed-height boxes (top/center/bottom)

Image:
  - Upload from device or paste from clipboard
  - Object-fit: cover, contain, fill
  - Object-position
  - Built-in crop tool (drag handles on the image itself)
  - Lazy loading flag for export

Shape:
  - Rectangle, ellipse, line, polygon (configurable sides), star (configurable points)
  - Independent corner radius per corner for rectangles
  - Stroke alignment: inside, center, outside

SVG:
  - Paste raw SVG code, renders inline
  - Color override (recolor single-color SVGs via fill)

Video:
  - Upload or embed URL (YouTube/Vimeo/direct file)
  - Autoplay, loop, muted, controls toggles
  - Poster image
```

---

## 3. Selection, Transform & Manipulation

```
Build the full selection and transform interaction model:

SELECTION
- Click an element to select it
- Click empty canvas to deselect
- Shift+click adds/removes from selection
- Click-drag on empty canvas draws a selection box; selects all elements
  whose bounding box intersects the selection rectangle
- Cmd/Ctrl+click on a child inside a frame selects that child directly
  (without first needing to "enter" the frame)
- Double-click enters a frame to select its children at the next level
- Escape exits the current frame level / deselects entirely
- Tab / Shift+Tab cycles selection through sibling elements

TRANSFORM HANDLES
- 8 resize handles on the selection bounding box (4 corners, 4 edges)
- Corner handles resize proportionally when Shift is held
- Edge handles resize on one axis only
- A rotation handle appears slightly outside each corner when hovering near it
  (not a separate handle — same corner, different cursor based on distance from corner)
- Holding Option/Alt while resizing scales from the center
- Holding Cmd while resizing on a frame resizes children proportionally too

MULTI-SELECT TRANSFORM
- When multiple elements are selected, show one bounding box around all of them
- Dragging moves all selected elements together, preserving relative positions
- Resizing the multi-select box scales all elements proportionally within it

ALIGNMENT TOOLS
- Align left/center/right (horizontal)
- Align top/middle/bottom (vertical)
- Distribute horizontally / vertically (equal spacing)
- These appear as buttons in a floating toolbar above the selection
  when 2+ elements are selected

GROUPING
- Cmd/Ctrl+G groups selected elements into a new Frame
- Cmd/Ctrl+Shift+G ungroups, moving children back to the parent level
- Groups maintain relative positions when created

Z-ORDER
- "]" brings forward one step, Cmd+"]" brings to front
- "[" sends backward one step, Cmd+"[" sends to back
- Right-click menu has the same options

SMART GUIDES (critical for the "feels like Framer" quality bar)
- While dragging an element, show pink/magenta guide lines when its edges
  align with: other elements' edges, other elements' centers, canvas center
- Show a numeric distance label when two elements are evenly spaced from a
  third (e.g., "24px" appearing between three evenly-gapped cards)
- Snap tolerance: 4-6px at 100% zoom, scales with zoom level
- Holding Cmd/Ctrl while dragging temporarily disables snapping
```

---

## 4. Layers Panel

```
Build the layers panel matching this exact behavior:

STRUCTURE
- Tree view reflecting the element hierarchy
- Each row: indent (16px per depth level), expand/collapse chevron (if has
  children), type icon, name, and on-hover icons (visibility eye, lock)
- Currently selected element(s) highlighted with accent-tinted background
- Hovering a layer highlights the corresponding element on canvas with an
  outline (without selecting it) — this is the "layer hover sync"
- Hovering an element on canvas highlights its row in the layers panel too
  (bidirectional sync)

INTERACTIONS
- Single click selects (and on canvas)
- Double click enters rename mode (inline text input replaces the label)
- Drag to reorder within the same parent, or drag onto another frame's row
  to reparent (drop indicator line shows insertion point)
- Right-click opens context menu (duplicate, delete, group, etc.)
- Eye icon toggles visibility without selecting
- Lock icon toggles lock (locked elements can't be selected on canvas, but
  can still be selected via the layers panel and unlocked)

SEARCH/FILTER
- Search input at top of panel filters the tree by element name
- Matching elements stay visible, non-matching parents auto-expand to show
  matching descendants

KEYBOARD NAVIGATION
- Up/Down arrow keys move selection through visible rows
- Right arrow expands a collapsed frame, Left arrow collapses
- Enter renames the focused row
```

---

## 5. Auto Layout (Frames)

```
This is Framer's (and Figma's) most distinctive feature. Implement it precisely:

CONCEPT
A Frame with auto layout enabled arranges its children using flexbox-like rules
instead of free positioning. This is what makes responsive, content-driven
layouts possible.

CONFIGURATION
interface AutoLayoutConfig {
  enabled: boolean
  direction: 'horizontal' | 'vertical'
  gap: number | 'auto'            // 'auto' = space-between
  padding: { top: number, right: number, bottom: number, left: number }
  alignItems: 'start' | 'center' | 'end' | 'stretch'
  justifyContent: 'start' | 'center' | 'end' | 'space-between'
  wrap: boolean
}

CHILD SIZING MODES
Every child of an auto-layout frame independently chooses:
  - Fixed: explicit pixel width/height, doesn't change with content or container
  - Hug: sizes to fit its own content (text wraps, frame shrinks to children)
  - Fill: expands to fill available space in the parent (flex: 1 equivalent)

These three modes must be selectable per-axis (width can be Fill while height
is Fixed, for example) — exactly like Framer's W/H size controls.

UI FOR THIS
- When a Frame is selected, Inspector shows an "Auto Layout" toggle
- When enabled, show:
  - Direction buttons (horizontal/vertical icons)
  - Gap input (number) with a quick-toggle for "auto" (space-between)
  - Padding: a single input that sets all sides, expandable to 4 independent
    inputs (click the icon to expand, like Figma's padding control)
  - Alignment: a 3x3 or directional icon grid showing alignItems × justifyContent
  - Wrap toggle
- When a child INSIDE an auto-layout frame is selected, Inspector shows
  Fixed/Hug/Fill segmented control for both width and height

NESTED AUTO LAYOUT
- Auto-layout frames can contain other auto-layout frames
- This must render correctly recursively — a horizontal auto-layout frame
  containing two vertical auto-layout frames, etc.

DRAG REORDER WITHIN AUTO LAYOUT
- Dragging a child within its auto-layout parent should reorder it (not
  free-position it) — show an insertion indicator line between siblings
- Dragging it out of the frame entirely converts it back to free positioning
  in the new parent (or canvas root)
```

---

## 6. Inspector / Properties Panel

```
Build the full property inspector. Sections appear/disappear based on
element type and what's selected. Order matters — match this exactly:

SECTION ORDER (top to bottom)
1. Position & Size (always)
2. Auto Layout (frames only, see Section 5)
3. Typography (text only)
4. Fill (all types except text-only scenarios where fill = text color)
5. Stroke
6. Corner Radius (frames, shapes, images — not text)
7. Shadow
8. Blur
9. Opacity & Blend Mode
10. Interactions (see Section 8)
11. CMS Binding (see Section 9, when applicable)
12. Export Settings (see Section 11)

POSITION & SIZE
- X, Y inputs (canvas coordinates, or relative-to-parent if inside a frame)
- W, H inputs — show "Fixed/Hug/Fill" segmented control if inside auto layout,
  otherwise plain numeric input with a unit suffix
- A chain-link icon between W and H toggles aspect ratio lock
- Rotation input (degrees, 0-360, wraps around)
- All numeric inputs support: typing a value, dragging the label left/right
  to scrub the value (Framer/Figma signature interaction), and arrow
  up/down on focus to increment/decrement by 1 (Shift+arrow for ±10)

TYPOGRAPHY
- Font family: searchable dropdown, loads Google Fonts on selection
- Weight: dropdown showing only weights available for the selected font
- Size, line height (as multiplier or px, toggle between them), letter spacing
- Color: swatch + hex, opens the color picker (Section 7)
- Alignment: left/center/right/justify icon buttons
- Text transform: none/uppercase/lowercase/capitalize
- Truncation: toggle for single-line ellipsis overflow

FILL
- Support multiple fill layers (like Figma) — "+" button adds another fill
- Each fill: type selector (Solid / Linear gradient / Radial gradient / Image)
- Solid: color swatch, opens color picker
- Gradient: gradient bar with draggable stops, angle control for linear
- Image fill: upload button, object-fit selector
- Each fill has its own opacity and a visibility toggle (eye icon) and can
  be reordered or deleted
- Blend mode per fill layer (optional but matches Framer)

STROKE
- Color, width, style (solid/dashed/dotted)
- Alignment: inside/center/outside
- Can have multiple strokes like fills

CORNER RADIUS
- Single input that sets all corners
- Click an expand icon to reveal 4 independent corner inputs
- For shapes only (not applicable to lines/text)

SHADOW
- "+" adds a shadow (drop shadow or inner shadow, toggle between them)
- Per shadow: X, Y, blur, spread, color (with its own opacity), visibility
  toggle, delete button
- Multiple shadows stack (rendered in order)

BLUR
- Layer blur (blurs the element itself) and Background blur (glassmorphism —
  blurs what's BEHIND the element, using backdrop-filter)
- This is essential for the Framer glassmorphism look — must use
  backdrop-filter: blur(Npx) for background blur, not filter: blur()

OPACITY & BLEND MODE
- Opacity: 0-100 slider + numeric input
- Blend mode dropdown: normal, multiply, screen, overlay, etc.

INPUT BEHAVIOR (apply everywhere)
- All numeric fields commit on blur or Enter
- All numeric fields support drag-to-scrub on their label
- Multi-selection with mixed values shows a dash/placeholder, editing it
  applies the new value to all selected elements
```

---

## 7. Color Picker

```
Build a floating color picker popover (not a modal — it floats near the
swatch that triggered it, dismisses on outside click):

LAYOUT
1. Large saturation/brightness square (drag to pick), rendered as an HTML5
   canvas with a gradient, with a draggable circular indicator
2. Hue slider below it — horizontal gradient bar, draggable thumb
3. Opacity/alpha slider — same style, but with a checkered transparency
   background showing through
4. Format toggle: HEX / RGB / HSL — click to cycle the format of the inputs
5. Text inputs matching the current format (e.g., a single HEX field, or
   three RGB fields)
6. Eyedropper tool icon — uses the browser's EyeDropper API where available,
   to pick a color from anywhere on screen
7. A row of 8-10 recently used colors as small clickable swatches
8. A row of "document colors" — colors already used elsewhere in this project,
   so users can stay consistent

GRADIENT MODE
- If editing a gradient fill, the picker instead shows a horizontal gradient
  bar with draggable color stops
- Clicking a stop shows that stop's color in the square/hue/alpha controls
  above
- Double-click on the gradient bar (not on a stop) adds a new stop there
- Dragging a stop off the bar deletes it
- Angle control (rotary dial or numeric degrees) for linear gradients
- Radial gradients show a center-point + radius control instead of angle

BEHAVIOR
- All changes apply live (no "confirm" button) — dragging the hue slider
  updates the actual element fill in real time
- Closing the picker (click outside or Escape) commits the final value
- Picker remembers position relative to its trigger and avoids going off-screen
```

---

## 8. Animations & Interactions

```
Build the interaction system. This has two distinct parts: visual ANIMATIONS
(how an element transitions between states) and INTERACTIONS (what triggers
state changes or navigation).

ANIMATION TRIGGERS
Each element can define behavior for these triggers, added via a "+" button:
  - Hover (mouse enters/leaves)
  - Tap/Click (press down/release)
  - Appear (when scrolled into viewport, fires once or every time — toggle)
  - While in view (continuously tied to scroll position within viewport)
  - Drag (element becomes draggable, optionally constrained to an axis or area)
  - Page load (fires once when the page mounts)

PER-TRIGGER ANIMATION CONFIG
interface AnimationConfig {
  trigger: TriggerType
  properties: {
    opacity?: { from: number, to: number }
    scale?: { from: number, to: number }
    x?: { from: number, to: number }
    y?: { from: number, to: number }
    rotate?: { from: number, to: number }
    backgroundColor?: { from: string, to: string }
    blur?: { from: number, to: number }
  }
  transition: {
    type: 'tween' | 'spring'
    duration?: number        // tween only, in ms
    ease?: 'linear' | 'easeIn' | 'easeOut' | 'easeInOut'
    stiffness?: number       // spring only
    damping?: number         // spring only
    delay?: number
  }
}

UI FOR EDITING ANIMATIONS
- Each property row (opacity, scale, x, y, etc.) has a toggle to enable it
  for this trigger, then shows From/To inputs once enabled
- A small preview area or "test" button that plays the animation once so
  the user can see it without leaving the editor
- Transition type as a segmented control (Tween/Spring), with type-specific
  sub-controls appearing below

INTERACTIONS (navigation & actions, separate from pure animation)
interface Interaction {
  trigger: 'tap' | 'hover' | 'appear' | 'load'
  action:
    | { type: 'navigate', pageId: string, transition?: PageTransition }
    | { type: 'open-overlay', frameId: string, style: 'modal' | 'drawer-left' | 'drawer-right' }
    | { type: 'close-overlay' }
    | { type: 'scroll-to', elementId: string, smooth: boolean }
    | { type: 'link', url: string, newTab: boolean }
    | { type: 'set-variable', variableId: string, value: any }
    | { type: 'toggle-variable', variableId: string }
}

UI FOR INTERACTIONS
- Separate "Interactions" sub-section in inspector, below pure animations
- Dropdown for trigger, then dropdown for action type, then action-specific
  config (e.g., selecting "Navigate" shows a page picker)

PREVIEW MODE REQUIREMENT
- All of the above must actually execute when the project is in Preview mode,
  using the Motion library under the hood
- Hover/tap animations should feel instant and responsive (no lag)
- Page navigation should use the configured transition (fade, slide, etc.)
```

---

## 9. CMS / Dynamic Content

```
Build a lightweight CMS so pages can be data-driven instead of fully static.

COLLECTIONS
interface CmsCollection {
  id: string
  name: string
  fields: CmsField[]
  items: CmsItem[]
}

interface CmsField {
  id: string
  name: string
  type: 'text' | 'richtext' | 'number' | 'boolean' | 'date' | 'image' | 'color' | 'link' | 'reference'
  required: boolean
}

type CmsItem = Record<string /* fieldId */, any>

CMS PANEL UI
- A "CMS" tab alongside Layers/Components in the left panel (or a dedicated
  top-level view — Framer makes this a separate mode)
- List of collections, click to open a spreadsheet-like table view
- Table view: add/remove columns (fields), inline cell editing, add/delete rows
- Field type icons in column headers
- "Add collection" and "Add field" flows with type selection

BINDING ELEMENTS TO CMS DATA
- In the inspector, text/image/color properties show a small "link" icon
  next to them when a CMS collection exists
- Clicking it opens a dropdown: pick a collection, then a field
- Once bound, the editor shows a visual indicator (e.g., a colored badge or
  dashed outline) on that element, and the property shows the bound field
  name instead of a literal value (e.g. "Product → Title")

COLLECTION LISTS (repeating content)
- A Frame can be converted into a "Collection List" — pick a CMS collection,
  and the frame's first child becomes a template that repeats once per item
- In the editor, render the template once with a "showing 1 of N" indicator,
  or render all N if performance allows for small collections
- Properties bound to CMS fields inside the template auto-populate from each
  item when rendering the full list
- Support pagination/limit controls (show first N items) and basic filtering
  (e.g., where field = value) and sorting (by field, asc/desc)

DETAIL PAGES (CMS-driven dynamic routes)
- A page can be marked as a "Collection Page" bound to a collection —
  generates one route per item (e.g., /blog/[slug])
- Elements on that page bind to "current item" fields rather than picking
  a specific item

DATA STORAGE
- Store collections and items in Firestore under the project document
- Support CSV import to bulk-create items
```

---

## 10. Responsive Breakpoints

```
Build the responsive system:

BREAKPOINTS
- Three default breakpoints: Desktop (1440px), Tablet (768px), Mobile (390px)
- Allow adding custom breakpoints with a specific max-width
- A breakpoint switcher bar below the toolbar shows icons + widths, click to
  switch the active editing context

HOW OVERRIDES WORK
- Every element's properties are defined at the "base" (Desktop) level
- Switching to Tablet or Mobile and changing a property creates an override
  for that breakpoint only — base properties are untouched
- Properties NOT overridden at a breakpoint inherit from the next breakpoint
  up (Mobile inherits from Tablet inherits from Desktop, unless overridden)
- Store as: element.breakpointOverrides[breakpointId] = { ...partial props }

VISUAL INDICATION
- When viewing a non-Desktop breakpoint, any property in the Inspector that
  has an override for the current breakpoint shows a colored dot or border
  next to its input
- Right-click (or a small "x" button) on an overridden value lets you reset
  it back to inherited
- The Layers panel can optionally show a small breakpoint badge on elements
  that have any overrides

CANVAS BEHAVIOR AT EACH BREAKPOINT
- The canvas shows a frame exactly as wide as the active breakpoint
- Elements outside that frame width are visually dimmed/clipped to indicate
  they're out of the responsive viewport
- Auto-layout frames reflow live as you resize between breakpoints, showing
  how content will wrap

RESPONSIVE VISIBILITY
- Per breakpoint, an element can be set Hidden — useful for "desktop-only
  nav" vs "mobile hamburger menu" patterns
- This is just another override: breakpointOverrides[bp].visible = false
```

---

## 11. Component System

```
Build reusable components, similar to Figma's components/instances model:

CREATING A COMPONENT
- Select any element (or group), right-click → "Create Component"
- This converts it into a Component Master, stored in a project-level
  components registry, and the original on canvas becomes the first Instance

INSTANCES
- Drag a component from the Components panel (Section 12) onto the canvas
  to create a new Instance
- Instances are linked: editing the Master propagates to all Instances UNLESS
  a specific property has been overridden on that instance

OVERRIDES
- An instance can have per-property overrides (text content, fill color,
  visibility of a sub-element, swapping an icon, etc.)
- Overridden properties are visually marked in the Inspector (similar to
  breakpoint overrides — a colored dot)
- "Reset to master" button clears all overrides on the selected instance

COMPONENT PROPERTIES (variants/props — Framer calls these "Component
Properties")
- A component master can expose configurable properties: text fields,
  boolean toggles (show/hide a sub-element), variant selects (e.g.,
  "Style: Primary / Secondary / Ghost"), and image slots
- These appear as friendly controls in the Inspector when an instance is
  selected — NOT as raw element properties, but as the named props the
  component author defined
- Implementation: component master defines a propsSchema, and instances
  store a props object satisfying that schema; rendering substitutes prop
  values into the appropriate child elements

DETACHING
- "Detach instance" converts an instance into a regular, fully independent
  element tree with no link back to the master
```

---

## 12. Component Library Panel & Built-in Components

```
Build the panel where users browse and drag in components:

PANEL STRUCTURE
- Tab alongside Layers and CMS in the left panel
- Search input at top
- Two sections: "Project components" (user-created, from Section 11) and
  "Library" (built-in starter components, listed below)
- Accordion or flat grid layout, each item shows a small rendered thumbnail
  and a name

BUILT-IN COMPONENT LIBRARY (ship these pre-made, ready to drag in)
Navigation:
  - Navbar (logo + links + CTA button)
  - Sidebar nav
  - Breadcrumbs
  - Pagination

Forms & Inputs:
  - Button (primary, secondary, ghost, outline variants as component props)
  - Text input
  - Textarea
  - Checkbox
  - Radio group
  - Toggle/switch
  - Select dropdown
  - Search bar

Layout & Sections:
  - Hero section (heading + subtext + CTA + image)
  - Feature grid (3 or 4 column cards)
  - Pricing table
  - Testimonial card
  - FAQ accordion
  - Footer
  - Stats/numbers row

Content:
  - Card (image + title + description)
  - Avatar
  - Badge/tag
  - Tooltip
  - Modal/dialog shell
  - Alert/banner

Typography presets:
  - Heading 1-6
  - Body text
  - Caption
  - Quote/blockquote

DRAG BEHAVIOR
- Dragging from the panel shows a ghost preview following the cursor
- Dropping on the canvas creates the element at the drop position
- Dropping inside an auto-layout frame inserts it into that flex flow at the
  nearest valid position (shown via insertion indicator line, same as
  Section 5's reorder behavior)
```

---

## 13. Preview Mode

```
Build a distinct Preview mode, separate from the editor:

ENTERING PREVIEW
- A "Preview" button in the toolbar, or Cmd/Ctrl+P
- Opens either as an in-app overlay (full-screen takeover with an exit
  button) or a new browser tab — support the in-app overlay as the primary
  experience, matching Framer

WHAT CHANGES IN PREVIEW
- All animations and interactions from Section 8 actually execute (they're
  inert in the editor canvas)
- CMS collection lists render their real, full data
- Clicking elements with Navigate interactions actually navigates between
  pages
- The view respects whichever breakpoint frame size you choose at the top
  of the preview (Desktop/Tablet/Mobile toggle inside Preview itself)
- Scrollable content actually scrolls (the editor canvas typically doesn't
  scroll pages the way a real browser would)

DEVICE FRAME
- When previewing Tablet or Mobile, optionally render inside a simple
  device bezel/frame for visual context (not strictly necessary, but matches
  the polish bar)

PERFORMANCE
- Preview should genuinely reflect production rendering — this is a good
  forcing function to make sure your editor's render path and your export's
  render path are the same underlying component tree, not two divergent
  implementations
```

---

## 14. Export & Publishing

```
Build both code export and live publishing:

HTML/CSS EXPORT
- Walk the element tree, output one HTML file with embedded <style>
- Element type → tag mapping: frame → div, text → p/h1-h6 (infer heading
  level from font size, or let the user pick a semantic tag in inspector),
  image → img, shape → div with CSS or inline svg, video → video
- Auto layout → CSS flexbox with the equivalent gap/padding/align properties
- Breakpoint overrides → CSS media queries (max-width matching each
  breakpoint's width)
- Fills/strokes/shadows/blur → direct CSS equivalents (background,
  box-shadow, backdrop-filter, etc.)
- Animations → CSS @keyframes + transition for simple hover/tap cases;
  fall back to a small inline JS snippet using the Web Animations API for
  spring/appear/scroll-triggered cases
- Output should be clean and readable, not minified — this is a portfolio
  signal, dirty output looks bad in a code review

REACT EXPORT
- Generate a React + TypeScript + Tailwind project structure
- One component per named top-level Frame
- Auto layout maps to Tailwind flex utility classes where possible, falls
  back to inline style for values that don't map cleanly to Tailwind's scale
- CMS-bound elements generate components that accept props matching the
  CMS schema, with example data
- Package as a downloadable zip (use a library like JSZip client-side, or
  generate server-side and stream the zip)

PUBLISHING (live hosting)
- "Publish" button opens a modal showing the project's subdomain
  (e.g. my-project.framerx.app), editable
- Publishing triggers: export to static HTML → upload to Firebase Hosting
  (or Storage + CDN) → return the live URL
- Show a publish history / changelog (optional but nice: "Published 2 hours
  ago", with a "view previous version" capability later)
- Custom domain field: accept a domain, show the DNS records (A record/CNAME)
  the user needs to configure on their end
- SEO fields per page: title, meta description, social share image — exposed
  in a "Page settings" panel, written into the exported HTML's <head>
```

---

## 15. Project Management & Auth

```
Build the surrounding product shell:

AUTHENTICATION
- Firebase Auth: email/password + Google OAuth
- Sign up requires name, email, password, password confirmation
- Forgot password flow (Firebase's built-in email reset)
- Session persists across reloads, protected routes redirect to /auth if
  unauthenticated

DASHBOARD
- Grid of project cards: thumbnail (auto-generated screenshot of the first
  page), name, last edited timestamp
- "New project" creates a blank project, prompts for name + starting canvas
  size (Desktop/Mobile/Custom)
- Per-project actions on hover/right-click: Open, Duplicate, Rename, Delete
  (with confirmation), Move to folder (if you implement folders)
- Search/filter projects by name

PROJECT DATA MODEL (Firestore)
project: {
  id, name, ownerId, createdAt, updatedAt, thumbnailUrl,
  pages: Page[],              // each page has its own root Frame + element tree
  elements: Record<id, Element>,
  components: Record<id, ComponentMaster>,
  cmsCollections: CmsCollection[],
  breakpoints: Breakpoint[],
  publishedUrl?: string,
}

AUTO-SAVE
- Debounce element changes (every ~2s of inactivity, or every N changes)
  and write to Firestore
- Show a subtle save status indicator ("Saving…" → "Saved")
- Implement basic conflict handling: if two tabs of the same project are
  open, the most recent write wins (last-write-wins is acceptable for v1;
  real-time collaboration is a stretch goal, not a requirement)

PERMISSIONS (optional, but mentioned for completeness)
- Owner-only by default
- A "Share" flow that adds collaborators by email with edit/view roles is a
  reasonable v2 feature — not required for the core build
```

---

## 16. Keyboard Shortcuts (complete reference)

```
Implement this full shortcut table. All shortcuts must be inert when focus
is inside any text input, textarea, or contenteditable element.

SELECTION & EDITING
  V              Select tool
  F              Frame tool
  T              Text tool
  R              Rectangle tool
  O              Ellipse tool
  Cmd/Ctrl+A      Select all (top level)
  Escape         Deselect / exit current frame level
  Tab            Select next sibling
  Shift+Tab      Select previous sibling
  Enter          Enter selected frame / rename selected layer

CLIPBOARD & DUPLICATION
  Cmd/Ctrl+C      Copy
  Cmd/Ctrl+V      Paste (at cursor position, or offset if pasting at same spot)
  Cmd/Ctrl+D      Duplicate (offset by a few px)
  Delete/Backspace  Delete selected
  Cmd/Ctrl+Shift+C  Copy style (copies fill/stroke/shadow/typography, not layout)
  Cmd/Ctrl+Shift+V  Paste style

HISTORY
  Cmd/Ctrl+Z       Undo
  Cmd/Ctrl+Shift+Z Redo

MOVEMENT
  Arrow keys      Nudge 1px
  Shift+Arrow     Nudge 10px
  Drag with Shift Constrain to axis (horizontal/vertical only)

GROUPING & ORDER
  Cmd/Ctrl+G       Group into frame
  Cmd/Ctrl+Shift+G Ungroup
  ]               Bring forward
  Cmd/Ctrl+]       Bring to front
  [               Send backward
  Cmd/Ctrl+[       Send to back

ZOOM & VIEW
  Cmd/Ctrl+0       Zoom to 100%
  Cmd/Ctrl++       Zoom in
  Cmd/Ctrl+-       Zoom out
  Shift+1         Zoom to fit all
  Shift+2         Zoom to fit selection
  Space (hold)    Pan mode

OTHER
  Cmd/Ctrl+P       Preview mode
  Cmd/Ctrl+S       Force save (in addition to auto-save)
  Cmd/Ctrl+/       Open command palette (Section 17, if implemented)
```

---

## 17. Command Palette (polish feature)

```
Optional but high-impact for the "feels professional" bar:

Cmd/Ctrl+K (or Cmd+/) opens a fuzzy-search command palette:
- Search and jump to any layer by name
- Search and run any command (Group, Duplicate, Toggle auto layout, etc.)
- Search and switch to any page
- Recently used commands shown when the palette opens empty

Style: centered modal, dark background, large search input at top, results
list below with keyboard up/down navigation, Enter to execute.
```

---

## 18. Right-Click Context Menu

```
Build a context-sensitive right-click menu. Contents change based on what's
selected (single element, multiple elements, a frame, the canvas itself).

Standard element menu:
  Copy                    Cmd+C
  Paste                   Cmd+V
  Duplicate               Cmd+D
  Delete                  Delete
  ───────────
  Group selection         Cmd+G
  Frame selection
  ───────────
  Create component
  ───────────
  Bring to front          Cmd+]
  Bring forward           ]
  Send backward           [
  Send to back            Cmd+[
  ───────────
  Copy style               Cmd+Shift+C
  Paste style               Cmd+Shift+V
  ───────────
  Rename
  Lock / Unlock
  Hide / Show

When right-clicking empty canvas: Paste, Select all, Zoom to fit.

Style this exactly per the design tokens in the earlier color/spacing spec
(dark panel, hairline borders, hover states, right-aligned shortcut hints).
```

---

## Build Order Reminder

This document lists *what* to build. For *what order* to build it in,
follow the 9-phase roadmap from the architecture document — roughly:

```
Phase 1  → Sections 1, 2, 3        (canvas, elements, selection)
Phase 2  → Sections 4, 6, 7        (layers, inspector, color picker)
Phase 3  → Sections 5, 11, 12      (auto layout, components, library panel)
Phase 4  → Section 10              (breakpoints)
Phase 5  → Section 8               (animations & interactions)
Phase 6  → Section 9               (CMS)
Phase 7  → Sections 13, 14         (preview, export, publish)
Phase 8  → Section 15              (auth, dashboard, project data)
Phase 9  → Sections 16, 17, 18     (shortcuts, command palette, context menu)
```

Don't skip ahead to Section 8 (animations) before Section 1-3 (canvas) are
rock solid — every later feature assumes the element/selection model
underneath it is already correct. Bugs in the foundation compound.

---

*FramerX Feature Spec v1.0 — companion to the Phase Build Spec*
