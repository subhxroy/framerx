<div align="center">
  <img src="public/favicon.svg" alt="FramerX Logo" width="80" />
  <h1 align="center">FramerX</h1>
  <p align="center">
    A visual website builder and design tool — inspired by Framer.
    <br />
    Drag-and-drop canvas, auto-layout, responsive breakpoints, animations, CMS, and one-click publish.
  </p>
  <p align="center">
    <a href="#features"><strong>Explore Features</strong></a> ·
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

A **Framer-inspired visual website builder** built from scratch with React, TypeScript, and Vite. Provides a design environment where users can create responsive websites through a drag-and-drop interface.

The editor includes an infinite canvas with pan/zoom, a multi-panel layout, auto-layout (flexbox-powered), responsive breakpoints with per-breakpoint overrides, an animation system (hover/tap/appear/inview triggers with tween/spring transitions), a built-in CMS for dynamic content, and one-click publishing to Supabase Storage.

---

## Features

### Canvas & Viewport

| Feature | Description |
|---------|-------------|
| **Infinite Canvas** | Pan with Space+drag, middle-mouse, or two-finger trackpad |
| **Zoom** | Cmd+scroll, preset levels (2%–6400%), zoom to fit, Cmd+0 to reset |
| **Dot Grid** | 8px spacing, fades below 25% zoom, scales proportionally |
| **Rubber-band draw** | Drag out new elements with Frame/Text/Image/Rect/Ellipse tools |
| **Breakpoint overlay** | Non-desktop breakpoints show centered viewport with dim backdrop |

### Element System

- **Types:** Frame, Text, Image, Shape, Stack
- **Properties:** Position, size, rotation, opacity, visibility, lock, corner radius, background, borders, shadows, blur (layer + backdrop)
- **Hierarchy:** Parent-child tree, drag-to-reparent in layers panel
- **Sizing modes:** Fixed, Hug (fit content), Fill (flex: 1) — per-axis within auto-layout

### Selection & Transform

- Click, Shift+click (multi), click-drag (marquee with Selecto)
- 8 resize handles + rotation, Shift constrains proportion, Alt scales from center
- Snap-to-element alignment guides
- Group (Cmd+G) / Ungroup (Cmd+Shift+G)
- Z-order controls (bring forward/send backward, to front/to back)

### Layers Panel

- Tree view with depth indentation, expand/collapse
- Inline rename on double-click
- Drag-to-reorder with @dnd-kit
- Visibility (eye) and Lock toggles on hover
- Search/filter by element name

### Inspector / Properties Panel

Tabs: **Design** | **Agent** (AI) | **Code**

Design tab sections (collapsible):

1. **Layout** — X/Y, W/H, rotation, sizing mode (fixed/fill/hug)
2. **Auto Layout** — Direction, gap, padding (4 sides), align items, justify content, wrap
3. **Fill** — Background color picker with EyeDropper API support
4. **Image** (image type only) — Source URL, object-fit
5. **Border** — Width, color, style (solid/dashed/dotted), stroke alignment
6. **Border Radius** — Uniform radius + independent 4-corner control
7. **Shadow** — Multi-shadow stack (x, y, blur, spread, color)
8. **Blur** — Layer blur + backdrop blur sliders
9. **Typography** (text only) — Font size, weight, color, alignment, line height, letter spacing
10. **CMS Binding** — Bind element to CMS collection field
11. **Animation** — Animation config for triggers
12. **Scroll Animation** — Map scroll progress to visual properties
13. **Variants** (component masters only) — Variant states with trigger conditions
14. **Interaction** — Hover/tap/appear/inview transitions + navigate actions

### Auto Layout

- Toggle on any Frame to enable CSS flexbox layout
- Direction: horizontal / vertical
- Gap, padding (4-direction), align items, justify content, wrap
- Drag reorder within auto-layout with insertion indicators

### Animations & Interactions

**Triggers:** Hover, Tap, Appear (page load), While in view

**Animatable properties:** Opacity, scale, X, Y, rotate — each with From/To values

**Transitions:** Tween (duration, ease) or Spring (stiffness, damping)

**Actions:** Navigate to URL, Open Overlay

All animations execute in Preview mode using the Motion library.

### CMS / Dynamic Content

- **Collections** — Create typed collections with fields: text, rich-text, image, number, boolean, date, color, link, file, video, enum
- **Field editor** — Add/remove/reorder fields per collection
- **Item editor** — Add/edit/delete items with form fields
- **CMS Binding** — Link text/image element properties to CMS fields
- **Collection Frame** — Convert a Frame into a repeating collection list (renders once per CMS item in preview)
- **Data storage** — Supabase PostgreSQL or localStorage

### Responsive Breakpoints

- **Defaults:** Desktop (1280px), Tablet (810px), Mobile (390px)
- **Switcher** in toolbar to switch editing context
- **Override model:** Each element stores per-breakpoint overrides for x, y, width, height, visible, opacity, rotation
- **Canvas masking:** Viewport centered with dim overlay in non-desktop modes

### Component System

- **Create Component** from selection — converts to master component
- **Instances** — Drag from Components panel to create linked instances
- **Overrides** — Per-instance property overrides; "Reset to master" option
- **Detach** — Convert instance back to independent elements
- **Preset components** — 15 pre-made components across categories:

  | Category | Components |
  |----------|-----------|
  | Navigation | Navbar, Sidebar |
  | Forms | Button, Ghost Button, Input, Checkbox, Toggle, Dropdown |
  | Layout | Card, Hero Section, Feature Grid, Pricing Table |
  | Typography | Heading, Paragraph, Code Block |

### AI Copilot

- **Supabase Edge Function** — Structured AI generation with rate limiting (20 req/min/user)
- **Chat panel** — Generate/Redesign mode, explanation cards with icons
- **Design grounding** — Extracts canvas colors, fonts, spacing, radii for context-aware generation
- **Preview overlay** — Dashed accent rects + labels before accepting AI changes
- **Accept/Discard** — One-click apply with history push or discard

### Preview Mode

- Cmd+P toggles full-screen preview overlay
- All animations and interactions execute live
- CMS collection frames render real data
- Side panels hidden for distraction-free preview

### Export & Publishing

- **HTML/CSS Export** — Single-file HTML with embedded `<style>`, CSS flexbox for auto-layout, media queries for breakpoints, CSS keyframe animations. Generated HTML includes SEO meta tags (description, Open Graph, Twitter Cards).
- **React Export** — React + TypeScript component with inline styles
- **Supabase Deploy** — Upload generated HTML to Supabase Storage with public URL

### Search Engine Optimization (SEO & AEO)

| Feature | Description |
|---------|-------------|
| **Base meta tags** | `index.html` includes description, keywords, author, robots, canonical, theme-color, PWA tags |
| **Open Graph** | `og:title`, `og:description`, `og:image`, `og:url`, `og:type`, `og:site_name`, `og:locale` |
| **Twitter Cards** | `twitter:card` (summary_large_image), `twitter:title`, `twitter:description`, `twitter:image`, `twitter:creator` |
| **Per-page SEO** | `SEO.tsx` component manages per-route `<title>`, description, canonical, OG/Twitter overrides, noIndex |
| **JSON-LD Structured Data** | `StructuredData.tsx` provides helpers for WebApplication, Organization, FAQPage, BreadcrumbList schemas |
| **robots.txt** | Allows indexing of public pages, disallows `/editor/` and `/auth` |
| **sitemap.xml** | Lists public pages with priority and change frequency |
| **Exported HTML SEO** | Generated pages include description, Open Graph, and Twitter Card meta tags |
| **AEO (Answer Engine Optimization)** | FAQPage schema for voice search and featured snippet eligibility |

### Auth & Dashboard

- **Authentication** — Email/password + Google OAuth (Supabase Auth), localStorage mock in dev mode
- **Dashboard** — Project grid with thumbnails, name, last-edited timestamp; create, duplicate, rename, delete, search projects
- **Auto-save** — Debounced writes every ~2s with "Saving… / Saved" indicator
- **Protected routes** — Unauthenticated users redirected to `/auth`

### Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `V` | Select tool |
| `F` | Frame tool |
| `T` | Text tool |
| `I` | Image tool |
| `R` / `O` | Rectangle / Ellipse tool |
| `Space + drag` | Pan canvas |
| `Delete` / `Backspace` | Delete selected |
| `Cmd+Z` / `Cmd+Shift+Z` | Undo / Redo |
| `Cmd+C` / `Cmd+X` / `Cmd+V` | Copy / Cut / Paste |
| `Cmd+D` | Duplicate |
| `Cmd+G` / `Cmd+Shift+G` | Group / Ungroup |
| `Arrow keys` | Nudge 1px (+Shift: 10px) |
| `[` / `]` | Send backward / Bring forward (+Cmd: front/back) |
| `Tab` / `Shift+Tab` | Cycle siblings |
| `H` | Hand/pan tool toggle |
| `Cmd+0` / `Cmd++` / `Cmd+-` | Zoom reset / in / out |
| `Shift+1` / `Shift+2` | Zoom to fit all / selection |
| `Cmd+P` | Toggle preview |
| `Cmd+K` | Toggle command palette |
| `Cmd+S` | Force save |
| `Tab` / `Shift+Tab` | Cycle siblings |
| `[` / `]` | Send backward / Bring forward (+Cmd: front/back) |
| `Shift+scroll` | Horizontal pan |

---

## Tech Stack

### Frontend

| Technology | Purpose |
|------------|---------|
| **React 19** | UI framework |
| **TypeScript 6** | Type safety |
| **Vite 8** | Build tool and dev server |
| **Tailwind CSS 4** | Utility-first styling |
| **Zustand 5** | Lightweight state management (10 stores) |
| **React Router v7** | Client-side routing |
| **@dnd-kit** | Drag and drop (layers panel) |
| **react-moveable** | Element resize/rotate/transform on canvas |
| **Selecto** | Marquee selection engine |
| **Motion 12** | Animation runtime for preview mode |
| **Lucide React** | Icon library |
| **react-helmet-async** | Per-page SEO meta tag management |

### Backend

| Service | Purpose |
|---------|---------|
| **Supabase** | PostgreSQL, Auth, Storage (optional — localStorage fallback) |
| **Supabase Edge Functions** | Deno-based serverless functions for AI Copilot and Reset Email sending |

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
├── supabase-schema.sql       # PostgreSQL schema
├── tsconfig.json             # TypeScript config (root)
├── tsconfig.app.json         # TypeScript config (app)
├── tsconfig.node.json        # TypeScript config (Node)
├── vite.config.ts            # Vite configuration
├── README.md
├── CONTRIBUTING.md
├── brain.md                  # Full project documentation
├── public/
│   ├── favicon.svg
│   ├── icons.svg
│   ├── robots.txt
│   └── sitemap.xml
├── dist/                     # Build output (ignored)
├── supabase/                 # Supabase configuration & Edge functions
│   ├── config.toml           # Supabase configuration
│   ├── functions/            # Edge functions
│   │   ├── ai-design/        # AI Copilot assistant
│   │   └── send-reset-email/ # Password reset email generator
│   └── smtp-relay/           # SMTP local relay server
└── src/
    ├── main.tsx              # React entry point
    ├── index.css             # Global styles + CSS variables + Tailwind
    ├── app/
    │   ├── App.tsx           # RouterProvider
    │   └── routes.tsx        # 4 routes: /auth, /reset-password, /, /editor/:projectId
    ├── pages/
    │   ├── Auth.tsx          # Sign in/up/reset with animated gallery
    │   ├── Dashboard.tsx     # Project grid + CRUD
    │   ├── Editor.tsx        # Main editor layout
    │   └── ResetPassword.tsx # Set new password recovery page
    ├── editor/
    │   ├── canvas/
    │   │   └── Canvas.tsx    # Infinite canvas, pan/zoom, draw, DnD
    │   ├── elements/
    │   │   ├── Element.tsx   # Core renderer (instances, breakpoints, CMS)
    │   │   ├── FrameElement.tsx
    │   │   ├── TextElement.tsx
    │   │   ├── ImageElement.tsx
    │   │   ├── AnimatedElement.tsx
    │   │   └── types.ts
    │   └── selection/
    │       ├── SelectionManager.tsx  # Moveable + Selecto
    │       ├── SmartGuides.tsx
    │       └── AlignmentBar.tsx
    ├── panels/
    │   ├── toolbar/Toolbar.tsx
    │   ├── layers/           # LayersPanel, LayerRow, LeftPanelTabs, LeftPanelRail
    │   ├── inspector/        # Layout, AutoLayout, Typography, Fill, Border, BorderRadius, etc. (18 files)
    │   ├── components/       # ComponentsPanel, ComponentDefinitions
    │   ├── cms/              # CMSPanel, CollectionEditor, ItemsTable, ItemEditor
    │   ├── assets/AssetsPanel.tsx
    │   ├── context/ContextMenu.tsx
    │   └── publish/PublishModal.tsx
    ├── components/
    │   ├── CommandPalette.tsx
    │   ├── ErrorBoundary.tsx
    │   ├── ProtectedRoute.tsx
    │   ├── SEO.tsx
    │   ├── StructuredData.tsx
    │   └── ToastHost.tsx
    ├── hooks/
    │   ├── useKeyboard.ts
    │   ├── useClipboard.ts
    │   ├── useAutoSave.ts
    │   └── useViewportBounds.ts
    ├── lib/
    │   ├── supabase.ts           # Supabase client (null if unconfigured)
    │   ├── supabase-deploy.ts    # Deploy HTML to Supabase Storage
    │   ├── defaultProject.ts     # Starter project generator
    │   ├── elementStyle.ts       # getBorderRadiusCSS, getBoxShadowCSS
    │   ├── breakpointUtils.ts    # Breakpoint widths, getBPMerged
    │   ├── hitTest.ts            # hitTestDeepest, findContainerAt
    │   ├── coords.ts             # getAbsolutePos
    │   ├── clipboard.ts          # Cross-tab clipboard
    │   └── export/
    │       ├── cssGenerator.ts
    │       ├── htmlExporter.ts
    │       └── reactExporter.ts
    └── store/
        ├── editorStore.ts     # Elements, selection, canvas, history, components
        ├── projectStore.ts    # Project CRUD, save/load
        ├── authStore.ts       # Auth state, signIn/signUp/signOut
        ├── cmsStore.ts        # CMS collections, fields, items
        ├── assetsStore.ts     # Image assets
        ├── uiStore.ts         # Panel widths, active tabs, layout state
        ├── hoverStore.ts      # Canvas <-> Layers hover sync
        ├── toastStore.ts      # Toast notification queue
        ├── copilotStore.ts    # AI Copilot chat messages & streaming state
        └── overlayStore.ts    # Overlay/Popover active states
```

---

## Getting Started

### Prerequisites

- **Node.js** 20+ (LTS recommended)
- **npm** 10+
- A **Supabase** account (optional — works with localStorage in dev mode)
- **Git**

### Installation

1. **Clone the repository**

   ```bash
   git clone https://github.com/subhxroy/framerx.git
   cd framerx
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Set up environment variables (optional)**

   Copy `.env.example` to `.env`:

   ```bash
   cp .env.example .env
   ```

   ```
   VITE_SUPABASE_URL=https://your-project.supabase.co
   VITE_SUPABASE_ANON_KEY=your-anon-key-here
   ```

   > Without these, the app runs entirely on localStorage — all features work for development.

4. **Run database migrations (if using Supabase)**

   Run `supabase-schema.sql` in your Supabase project's SQL Editor.

5. **Start the dev server**

   ```bash
   npm run dev
   ```

   The app is available at `http://localhost:5173`.

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
| `name` | `text` | Project name |
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
| `fields` | `jsonb` | Field definitions |
| `created_at` | `timestamptz` | Auto-generated |

### `cms_items`
| Column | Type | Description |
|--------|------|-------------|
| `id` | `uuid PK` | Auto-generated |
| `collection_id` | `uuid FK → cms_collections` | FK with cascade delete |
| `values` | `jsonb` | Field values keyed by field ID |
| `created_at` | `timestamptz` | Auto-generated |

**RLS:** All tables have RLS enabled.

---

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `VITE_SUPABASE_URL` | No | Your Supabase project URL |
| `VITE_SUPABASE_ANON_KEY` | No | Your Supabase anonymous API key |
| `VITE_OPENROUTER_API_KEY` | No | OpenRouter API key for AI Agent panel & Copilot Edge Function |
| `OPENROUTER_API_KEY` | No | (Supabase secret) AI Copilot Edge Function provider key |

Without these variables, the app uses localStorage for all persistence.

---

## Deployment

### Build for Production

```bash
npm run build
```

Output in `dist/`. Serve with any static file server:

```bash
npm run preview
```

### Production Server

Start the built app with the built-in Node.js production server (auto-serves `dist/` with SPA fallback):

```bash
npm start
```

The server runs on `http://0.0.0.0:3000` (configurable via `PORT` env).

### Netlify

The project includes a `netlify.toml` for one-click deployment:

1. Push to GitHub
2. In Netlify, connect repo → build command auto-detected → deploy
3. SPA routing, security headers, and asset caching are pre-configured

| Setting | Value |
|---------|-------|
| Build command | `npm run build` |
| Publish directory | `dist` |
| SPA redirects | `/*` → `/index.html` (200) |

### Railway

The project includes a `railway.json` for one-click deployment:

1. Push to GitHub
2. In Railway, connect repo → build/start auto-detected → deploy
3. The production server handles SPA fallback and static file serving

| Setting | Value |
|---------|-------|
| Build command | `npm run build` |
| Start command | `node server.js` |
| Health check | `GET /` |
| Port | `3000` (set via `PORT` env) |

### Supabase Storage Deploy

From the editor, use the **Publish** button → this uploads your site HTML to the Supabase `sites` bucket and returns a public URL.

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
