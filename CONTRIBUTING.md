# Contributing to FramerX

Thank you for your interest in contributing!

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Workflow](#development-workflow)
- [Project Architecture](#project-architecture)
- [Coding Standards](#coding-standards)
- [Pull Request Process](#pull-request-process)
- [Reporting Bugs](#reporting-bugs)
- [Feature Requests](#feature-requests)

## Code of Conduct

By participating, you agree to maintain a respectful and inclusive environment for everyone.

## Getting Started

1. Fork the repository
2. Clone your fork: `git clone https://github.com/your-username/framerx.git`
3. Create a new branch: `git checkout -b feature/your-feature-name`
4. Install dependencies: `npm install`
5. Copy `.env.example` to `.env` and configure Supabase credentials (optional)
6. Start the dev server: `npm run dev`

## Development Workflow

### Branch Naming

- `feature/description` — New features
- `fix/description` — Bug fixes
- `refactor/description` — Code refactoring
- `docs/description` — Documentation updates

### Commit Messages

Use conventional commit format:

```
type(scope): description

feat(canvas): add alignment guides
fix(layers): correct drag-and-drop reordering
refactor(store): simplify element selection logic
```

Types: `feat`, `fix`, `refactor`, `docs`, `style`, `perf`, `test`, `chore`

### Before Submitting

1. Ensure the app builds without errors: `npm run build`
2. Run the linter: `npm run lint`
3. Test your changes thoroughly in both editor and preview modes
4. If adding a feature, update the README if applicable

## Project Architecture

The project follows a feature-based structure inside `src/`:

```
src/
├── app/           # App root + route definitions
├── pages/         # Auth, Dashboard, Editor pages
├── editor/        # Canvas renderer, element system, selection
│   ├── canvas/
│   ├── elements/
│   └── selection/
├── panels/        # All side panel UIs
│   ├── toolbar/
│   ├── layers/
│   ├── inspector/ # 12+ section components
│   ├── components/
│   ├── cms/
│   ├── assets/
│   ├── context/
│   └── publish/
├── components/    # Shared app-level components
├── hooks/         # Shared React hooks
├── lib/           # Utilities, clients, export generators
└── store/         # Zustand state management (5 stores)
```

### State Management (Zustand)

| Store | Purpose |
|-------|---------|
| `editorStore` | Elements tree, selection, history, component instances, canvas state |
| `projectStore` | Project CRUD, save/load, auto-save |
| `authStore` | Auth state, sign-in, sign-up, sign-out |
| `cmsStore` | CMS collections, fields, items |
| `assetsStore` | Uploaded image asset registry |

### Key Libraries

- **@dnd-kit** — Drag-and-drop for layers panel and reordering
- **react-moveable** — On-canvas element resize, rotate, and transform
- **Selecto** — Marquee selection on canvas
- **Motion 12** — Animation execution in preview mode
- **Zustand 5** — Lightweight state management
- **Lucide React** — Icon set

## Coding Standards

### TypeScript

- Strict mode is enabled — avoid `any` unless absolutely necessary
- Define interfaces/types for all data structures
- Use `interface` for public APIs, `type` for unions and utility types

### React

- Functional components with hooks
- Use `React.memo` for components that render often (canvas elements, inspector sections)
- Keep components focused and extract logic into custom hooks where appropriate

### Styling

- Inline styles (`style={}` objects) for dynamic, element-specific styling (canvas elements, panels)
- Tailwind CSS utility classes for static layout and app chrome (toolbar, dashboard, auth pages)
- Follow existing patterns — check neighboring files before introducing a new approach

### State

- Keep state as close to where it's used as possible
- Use Zustand for global state, React state for local UI state
- Avoid prop drilling — use stores for deeply nested data

## Pull Request Process

1. Ensure your branch is up to date with `main`
2. Run `npm run build` and `npm run lint` — both must pass
3. Write a clear PR description explaining what you changed and why
4. Link any related issues
5. Request review from a maintainer
6. Address any review feedback before merge

## Reporting Bugs

Open a [Bug Report](https://github.com/subhxroy/framerx/issues/new) with:

- A clear, descriptive title
- Steps to reproduce (include code snippets if relevant)
- Expected vs. actual behavior
- Screenshots (if applicable)
- Environment info (browser, OS, Node version)

## Feature Requests

Open a [Feature Request](https://github.com/subhxroy/framerx/issues/new) with:

- A clear description of the feature
- Why it would be valuable
- Any implementation ideas or references
- Mockups (if applicable)
