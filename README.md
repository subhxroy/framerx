<div align="center">
  <img src="public/favicon.svg" alt="Framer Clone Logo" width="80" />
  <h1 align="center">Framer Clone</h1>
  <p align="center">
    A full-featured visual website builder and design tool — inspired by Framer.
    <br />
    Drag-and-drop canvas, auto-layout, responsive breakpoints, animations, CMS, and one-click publish.
  </p>
  <p align="center">
    <a href="#features"><strong>Explore Features</strong></a> ·
    <a href="#demo"><strong>View Demo</strong></a> ·
    <a href="#getting-started"><strong>Getting Started</strong></a> ·
    <a href="#deployment"><strong>Deploy</strong></a>
  </p>
  <p align="center">
    <img src="https://img.shields.io/badge/react-19.2-61DAFB?logo=react" alt="React 19" />
    <img src="https://img.shields.io/badge/typescript-6.0-3178C6?logo=typescript" alt="TypeScript 6" />
    <img src="https://img.shields.io/badge/vite-8.1-646CFF?logo=vite" alt="Vite 8" />
    <img src="https://img.shields.io/badge/tailwindcss-4.3-06B6D4?logo=tailwindcss" alt="Tailwind CSS 4" />
    <img src="https://img.shields.io/badge/license-MIT-green" alt="MIT License" />
  </p>
</div>

---

## Table of Contents

- [About](#about)
- [Features](#features)
  - [Canvas & Viewport](#canvas--viewport)
  - [Element System](#element-system)
  - [Selection & Transform](#selection--transform)
  - [Layers Panel](#layers-panel)
  - [Inspector / Properties Panel](#inspector--properties-panel)
  - [Auto Layout](#auto-layout)
  - [Color Picker](#color-picker)
  - [Animations & Interactions](#animations--interactions)
  - [CMS / Dynamic Content](#cms--dynamic-content)
  - [Responsive Breakpoints](#responsive-breakpoints)
  - [Component System](#component-system)
  - [Component Library](#component-library)
  - [Preview Mode](#preview-mode)
  - [Export & Publishing](#export--publishing)
  - [Auth & Dashboard](#auth--dashboard)
  - [Keyboard Shortcuts](#keyboard-shortcuts)
  - [Command Palette](#command-palette)
  - [Context Menu](#context-menu)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
- [Database Schema](#database-schema)
- [Environment Variables](#environment-variables)
- [Deployment](#deployment)
- [Contributing](#contributing)
- [License](#license)

---

## About

This is a **Framer-inspired visual website builder** built entirely from scratch with React, TypeScript, and Vite. It provides a professional-grade design environment where users can create responsive websites through a drag-and-drop interface — no coding required.

The editor includes an infinite canvas with pan/zoom, a multi-panel IDE-like layout, auto-layout (flexbox-powered), responsive breakpoints with per-breakpoint overrides, a full animation system (hover/tap/appear triggers with tween/spring transitions), a built-in CMS for dynamic content, and one-click publishing to Supabase Storage or Firebase Hosting.

---

## Features

### Canvas & Viewport

| Feature | Description |
|---------|-------------|
| **Infinite Canvas** | Pan with Space+drag, middle-mouse, or two-finger trackpad |
| **Zoom** | Cmd+scroll, pinch, preset levels (2%–6400%), Cmd+0 to reset |
| **Dot Grid** | 8px spacing at 100%, fades below 25% zoom, scales proportionally |
| **Smart Guides** | Pink alignment lines + gap labels when dragging elements |
| **Rulers (WIP)** | Cmd+R toggles pixel rulers with draggable guide lines |

### Element System

- **Types:** Frame, Text, Image, Shape (rectangle/ellipse/polygon/star/line), SVG, Video, Stack
- **Properties:** Position, size, rotation, opacity, blend mode, corner radius, fills (solid/gradient/image), strokes, shadows, blur (layer + backdrop)
- **Hierarchy:** Parent-child tree, drag-to-reparent in layers panel
- **Sizing modes:** Fixed, Hug (fit content), Fill (flex: 1) — per-axis within auto-layout

### Selection & Transform

- Click, Shift+click (multi), click-drag (marquee), double-click (enter frame)
- 8 resize handles + rotation, Shift constrains proportion, Alt scales from center
- Multi-select transform with proportional scaling
- Alignment tools (left/center/right, top/middle/bottom, distribute)
- Group (Cmd+G) / Ungroup (Cmd+Shift+G)
- Z-order controls (bring forward/send backward, to front/to back)

### Layers Panel

- Tree view mirroring element hierarchy with indent, icons, expand/collapse
- Inline rename on double-click
- Drag-to-reorder and drag-to-reparent with drop indicators
- Visibility (eye) and Lock toggles on hover
- Bidirectional hover sync: hover a layer → element highlights on canvas, and vice versa
- Search/filter by element name
- Keyboard navigation (up/down, expand/collapse, Enter to rename)

### Inspector / Properties Panel

Organized into collapsible sections in order:

1. **Position & Size** — X/Y, W/H, aspect ratio lock, rotation; shows Fixed/Hug/Fill when inside auto-layout
2. **Auto Layout** — Direction, gap, padding, alignment, wrap (frame only)
3. **Typography** — Font family (Google Fonts), weight, size, line height, letter spacing, color, alignment, transform, truncation
4. **Fill** — Multi-layer fills (solid, linear gradient, radial gradient, image) with reorder, visibility, blend mode
5. **Stroke** — Color, width, style (solid/dashed/dotted), alignment, multi-layer
6. **Corner Radius** — Single input or 4-corner expand; per-corner radius
7. **Shadow** — Multiple drop/inner shadows with X, Y, blur, spread, color
8. **Blur** — Layer blur (filter) and Background blur (backdrop-filter)
9. **Opacity & Blend Mode** — Slider + numeric, dropdown blend mode
10. **Interactions** — Animation triggers and navigation actions
11. **CMS Binding** — Link properties to CMS collection fields

All numeric inputs support drag-to-scrub on labels, arrow keys (+Shift for 10x), and multi-selection with mixed-value placeholders.

### Auto Layout

- Toggle on any Frame to enable CSS flexbox-powered layout
- Direction: horizontal / vertical
- Gap with "auto" (space-between) toggle
- Padding: unified or 4-direction expandable
- Alignment: 3×3 grid for alignItems × justifyContent
- Wrap toggle
- Nested auto-layout (horizontal containing vertical, etc.)
- Drag reorder within auto-layout with insertion indicators

### Color Picker

- Saturation/brightness square (canvas-rendered) + hue slider + alpha slider
- HEX / RGB / HSL format toggle
- Eyedropper (browser EyeDropper API)
- Recently used colors + document colors
- Gradient editor mode: draggable color stops, angle control, double-click to add
- All changes applied live (no confirm button)

### Animations & Interactions

**Triggers:** Hover, Tap/Click, Appear (scroll into view), While in view, Drag, Page load

**Animatable properties:** Opacity, scale, X, Y, rotate, backgroundColor, blur — each with From/To values

**Transitions:** Tween (duration, ease) or Spring (stiffness, damping), configurable delay

**Interactions (actions):** Navigate to page, Open overlay (modal/drawer), Close overlay, Scroll to element, External link, Set/toggle variable

All animations execute in Preview mode using the Motion library.

### CMS / Dynamic Content

- **Collections** — Create typed collections with fields: text, richtext, number, boolean, date, image, color, link, reference
- **Spreadsheet-like UI** — Add/remove columns, inline cell editing, add/delete rows
- **CMS Binding** — Link text/image/color properties to CMS fields via a link icon in the inspector; bound properties show field name and colored badge
- **Collection Lists** — Convert a Frame into a repeating collection list; template renders once per item
- **Detail Pages** — Mark a page as a Collection Page for dynamic routes (e.g., `/blog/[slug]`)
- **Data storage** — Supabase PostgreSQL (see [Schema](#database-schema))

### Responsive Breakpoints

- **Defaults:** Desktop (1440px), Tablet (768px), Mobile (390px) — custom breakpoints supported
- **Switcher bar** below the toolbar to switch editing context
- **Override model:** Changes on non-Desktop breakpoints create overrides; un-overridden properties inherit upward
- **Visual indicators:** Blue dot on overridden inspector fields, click to clear
- **Canvas masking:** Viewport frame clips to breakpoint width; out-of-viewport elements dimmed
- **Responsive visibility:** Hide elements per breakpoint

### Component System

- **Create Component** from selection (right-click) — converts to master component
- **Instances** — Drag from Components panel to create linked instances
- **Overrides** — Per-instance property overrides with visual indicators; "Reset to master" option
- **Component Properties** — Masters expose typed props (text, boolean, variant select, image slot) that appear as friendly controls in the inspector
- **Detach** — Convert instance back to independent elements

### Component Library

- **Project components** — User-created components
- **Built-in library** — 30+ pre-made components across categories:

  | Category | Components |
  |----------|-----------|
  | Navigation | Navbar, Sidebar, Breadcrumbs, Pagination |
  | Forms & Inputs | Button (primary/secondary/ghost), Text input, Textarea, Checkbox, Radio group, Toggle, Select, Search bar |
  | Layout & Sections | Hero, Feature grid, Pricing table, Testimonial, FAQ, Footer, Stats row |
  | Content | Card, Avatar, Badge, Tooltip, Modal, Alert/Banner |
  | Typography | Heading 1–6, Body, Caption, Blockquote |

- Drag from panel with ghost preview, drop into auto-layout with insertion indicators

### Preview Mode

- Cmd+P opens full-screen preview overlay
- All animations and interactions execute live
- CMS collection lists render real data
- Navigate between pages with configured transitions
- Breakpoint toggle inside preview (Desktop/Tablet/Mobile)
- Device frame for mobile previews

### Export & Publishing

- **HTML/CSS Export** — Clean, readable single-file HTML with embedded `<style>`, CSS flexbox for auto-layout, media queries for breakpoints, CSS animations + Web Animations API fallback
- **React Export** — Full React + TypeScript + Tailwind project as downloadable ZIP; one component per top-level Frame, CMS-bound elements as typed props
- **Supabase Deploy** — Upload to Supabase Storage (`sites` bucket) with public URL
- **Firebase Deploy** — Deploy to Firebase Hosting via CLI
- **Custom domains** — SEO fields (title, meta description, social image) per page

### Auth & Dashboard

- **Authentication** — Email/password + Google OAuth (Firebase Auth or Supabase Auth)
- **Dashboard** — Project grid with thumbnails, name, last-edited timestamp; create, duplicate, rename, delete, search, star projects
- **Auto-save** — Debounced writes every ~2s with "Saving… / Saved" indicator
- **Protected routes** — Unauthenticated users redirected to `/auth`

### Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `V` | Select tool |
| `F` | Frame tool |
| `T` | Text tool |
| `R` / `O` | Rectangle / Ellipse tool |
| `Space + drag` | Pan canvas |
| `Cmd+Z / Cmd+Shift+Z` | Undo / Redo |
| `Cmd+C / Cmd+V` | Copy / Paste |
| `Cmd+D` | Duplicate |
| `Cmd+G / Cmd+Shift+G` | Group / Ungroup |
| `Arrow keys` | Nudge 1px (+Shift: 10px) |
| `Cmd+0` / `Cmd++` / `Cmd+-` | Zoom reset / in / out |
| `Shift+1` / `Shift+2` | Zoom to fit all / selection |
| `Cmd+P` | Preview mode |
| `Cmd+K` | Command palette |
| `Cmd+S` | Force save |

### Command Palette

Cmd+K opens a fuzzy-search command palette for:
- Jump to any layer by name
- Run commands (Group, Duplicate, Toggle auto-layout, etc.)
- Switch pages
- Recently used commands shown on open

### Context Menu

Right-click context menu with dynamic contents:
- **Single element:** Copy, Paste, Duplicate, Delete, Group, Frame, Create component, Z-order, Copy/Paste style, Rename, Lock/Unlock, Hide/Show
- **Empty canvas:** Paste, Select all, Zoom to fit
- Shortcut hints displayed right-aligned; dark theme styling with hairline borders

---

## Tech Stack

### Frontend

| Technology | Purpose |
|------------|---------|
| **React 19** | UI framework with concurrent features |
| **TypeScript 6** | Type safety and developer experience |
| **Vite 8** | Build tool and dev server |
| **Tailwind CSS 4** | Utility-first styling |
| **Zustand** | Lightweight state management |
| **React Router v7** | Client-side routing |
| **@dnd-kit** | Drag and drop (layers panel, reorder) |
| **react-moveable** | Element resize/rotate/transform on canvas |
| **Selecto** | Marquee selection engine |
| **Motion** | Animation runtime for preview mode |
| **Lucide React** | Icon library |

### Backend & Services

| Service | Purpose |
|---------|---------|
| **Supabase** | Primary backend — PostgreSQL, Auth, Storage |
| **Firebase** | Secondary backend — Firestore, Auth, Hosting |
| **Google Fonts** | Dynamic font loading |

### Tooling

| Tool | Purpose |
|------|---------|
| **Oxlint** | Fast Rust-based linter |
| **TypeScript 6** | Compiler and type checker |

---

## Project Structure

```
framer/
├── .env.example              # Environment variables template
├── .gitignore                # Git ignore rules
├── .oxlintrc.json            # Oxlint configuration
├── index.html                # Vite entry point
├── package.json              # Dependencies and scripts
├── supabase-schema.sql       # PostgreSQL schema for Supabase
├── tsconfig.json             # TypeScript config (root)
├── tsconfig.app.json         # TypeScript config (app)
├── tsconfig.node.json        # TypeScript config (Node)
├── vite.config.ts            # Vite configuration
├── public/
│   ├── favicon.svg           # Favicon
│   └── icons.svg             # SVG sprite icons
├── dist/                     # Build output
├── node_modules/             # Dependencies
└── src/
    ├── main.tsx              # React entry point
    ├── index.css             # Global styles + Tailwind
    ├── app/
    │   └── App.tsx           # Root component with routing
    ├── assets/               # Static assets
    ├── components/           # Reusable UI components
    │   ├── canvas/           # Canvas renderer, grid, viewport
    │   ├── panels/           # Side panel UIs (layers, components, CMS)
    │   ├── inspector/        # Property inspector sections
    │   ├── toolbar/          # Top toolbar, tools, breakpoints
    │   ├── auth/             # Authentication components
    │   ├── dashboard/        # Project dashboard components
    │   └── ui/               # Shared UI primitives
    ├── editor/               # Editor-specific logic
    ├── hooks/                # React hooks
    ├── lib/                  # Utilities and services
    │   ├── export/           # HTML/React export generators
    │   ├── firebase.ts       # Firebase client
    │   ├── supabase.ts       # Supabase client
    │   ├── supabase-deploy.ts# Supabase Storage deployer
    │   ├── exportHtml.ts     # HTML export logic
    │   ├── elementStyle.ts   # Element-to-CSS conversion
    │   ├── breakpointUtils.ts# Breakpoint inheritance logic
    │   └── hitTest.ts        # Canvas hit testing
    ├── pages/                # Page-level components
    ├── panels/               # Panel sub-components
    └── store/                # Zustand stores
        ├── editorStore.ts    # Core editor state (elements, selection, history)
        ├── projectStore.ts   # Project-level state
        ├── authStore.ts      # Authentication state
        └── cmsStore.ts       # CMS state
```

---

## Getting Started

### Prerequisites

- **Node.js** 20+ (LTS recommended)
- **npm** 10+ or **pnpm** 8+
- A **Supabase** account (for database and auth) — or **Firebase** account
- **Git** (for version control)

### Installation

1. **Clone the repository**

   ```bash
   git clone https://github.com/your-username/framer-clone.git
   cd framer-clone
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Set up environment variables**

   Copy `.env.example` to `.env` and fill in your credentials:

   ```bash
   cp .env.example .env
   ```

   ```
   VITE_SUPABASE_URL=https://your-project.supabase.co
   VITE_SUPABASE_ANON_KEY=your-anon-key-here
   ```

   > **Note:** If using Firebase instead of (or alongside) Supabase, additional variables may be needed. See `src/lib/firebase.ts` for details.

4. **Run database migrations**

   Open your Supabase project's SQL Editor and run the contents of `supabase-schema.sql` to create all tables and RLS policies.

5. **Start the development server**

   ```bash
   npm run dev
   ```

   The app will be available at `http://localhost:5173`.

### Available Scripts

| Script | Command | Description |
|--------|---------|-------------|
| `dev` | `npm run dev` | Start Vite dev server with HMR |
| `build` | `npm run build` | Type-check + build for production |
| `preview` | `npm run preview` | Preview production build locally |
| `lint` | `npm run lint` | Run Oxlint static analysis |

---

## Database Schema

The project uses Supabase (PostgreSQL) with the following tables:

### `projects`
| Column | Type | Description |
|--------|------|-------------|
| `id` | `uuid PK` | Auto-generated |
| `user_id` | `uuid FK → auth.users` | Project owner |
| `name` | `text` | Project name (default: "Untitled") |
| `canvas_width` | `int` | Default canvas width (1440) |
| `canvas_height` | `int` | Default canvas height (900) |
| `thumbnail_url` | `text?` | Project thumbnail |
| `created_at` | `timestamptz` | Auto-generated |
| `updated_at` | `timestamptz` | Auto-updated |

### `project_data`
| Column | Type | Description |
|--------|------|-------------|
| `project_id` | `uuid PK → projects` | FK with cascade delete |
| `elements` | `jsonb` | Full element tree |
| `root_element_ids` | `jsonb` | Ordered root element IDs |
| `canvas_state` | `jsonb` | Pan/zoom state `{x, y, scale}` |
| `updated_at` | `timestamptz` | Auto-updated |

### `cms_collections`
| Column | Type | Description |
|--------|------|-------------|
| `id` | `uuid PK` | Auto-generated |
| `project_id` | `uuid FK → projects` | FK with cascade delete |
| `name` | `text` | Collection name |
| `fields` | `jsonb` | Field definitions (type, name, required) |
| `created_at` | `timestamptz` | Auto-generated |

### `cms_items`
| Column | Type | Description |
|--------|------|-------------|
| `id` | `uuid PK` | Auto-generated |
| `collection_id` | `uuid FK → cms_collections` | FK with cascade delete |
| `values` | `jsonb` | Field values keyed by field ID |
| `created_at` | `timestamptz` | Auto-generated |
| `updated_at` | `timestamptz` | Auto-updated |

**Row-Level Security:** All tables have RLS enabled with policies ensuring users can only access their own data.

**Storage:** A public `sites` bucket stores published site files with per-user folder isolation.

---

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `VITE_SUPABASE_URL` | Yes | Your Supabase project URL |
| `VITE_SUPABASE_ANON_KEY` | Yes | Your Supabase anonymous API key |

For Firebase deployment, additional configuration in `src/lib/firebase.ts` may be needed (Firebase project config, Hosting site name).

---

## Deployment

### Build for Production

```bash
npm run build
```

Output is written to `dist/`. Serve with any static file server:

```bash
npm run preview     # Preview locally
```

### Supabase Storage Deploy

From the editor, use the **Publish** button → select **Supabase** → the app uploads your built site to the `sites` bucket and returns a public URL.

### Firebase Hosting Deploy

From the editor, use the **Publish** button → select **Firebase** → requires a configured Firebase project with Hosting enabled.

### Manual Hosting

The `dist/` folder can be deployed to any static hosting provider:
- Vercel
- Netlify
- Cloudflare Pages
- GitHub Pages
- AWS S3 + CloudFront

---

## Contributing

Contributions are welcome! Please see [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

---

## License

Distributed under the MIT License. See [LICENSE](LICENSE) for more information.
