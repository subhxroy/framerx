# Contributing to Framer Clone

Thank you for your interest in contributing! This document outlines the process for contributing to this project.

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

By participating in this project, you agree to maintain a respectful and inclusive environment for everyone.

## Getting Started

1. Fork the repository
2. Clone your fork: `git clone https://github.com/your-username/framer-clone.git`
3. Create a new branch: `git checkout -b feature/your-feature-name`
4. Install dependencies: `npm install`
5. Copy `.env.example` to `.env` and configure your Supabase credentials
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

feat(canvas): add ruler guides
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
├── app/           # Root app component and routing
├── components/    # Reusable UI components
│   ├── canvas/    # Canvas renderer, viewport, grid
│   ├── panels/    # Side panels (layers, components, CMS)
│   ├── inspector/ # Property inspector sections
│   ├── toolbar/   # Top toolbar and tools
│   ├── auth/      # Authentication UI
│   ├── dashboard/ # Project dashboard
│   └── ui/        # Shared primitives (inputs, buttons, etc.)
├── editor/        # Editor-specific logic
├── hooks/         # Shared React hooks
├── lib/           # Utilities, clients, export logic
├── pages/         # Top-level page components
├── panels/        # Panel sub-components
└── store/         # Zustand state management
```

### State Management

The app uses **Zustand** stores:
- `editorStore` — Core editor state (elements, selection, history, canvas)
- `projectStore` — Project metadata and settings
- `authStore` — Authentication state
- `cmsStore` — CMS collections and items

### Key Libraries

- **@dnd-kit** — Drag-and-drop for layers panel and reordering
- **react-moveable** — On-canvas element resize, rotate, and transform
- **Selecto** — Marquee selection on canvas
- **Motion** — Animation execution in preview mode

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

- **Tailwind CSS** for all styling — avoid inline styles
- Use the project's design tokens (colors, spacing, typography) via Tailwind classes
- Follow the existing pattern for panel and toolbar styling

### State

- Keep state as close to where it's used as possible
- Use Zustand for global state, React state for local UI state
- Avoid prop drilling — use stores or context for deeply nested data

## Pull Request Process

1. Ensure your branch is up to date with `main`
2. Run `npm run build` and `npm run lint` — both must pass
3. Write a clear PR description explaining what you changed and why
4. Link any related issues
5. Request review from a maintainer
6. Address any review feedback before merge

## Reporting Bugs

Open a [Bug Report](https://github.com/your-username/framer-clone/issues/new?template=bug_report.md) with:

- A clear, descriptive title
- Steps to reproduce (include code snippets if relevant)
- Expected vs. actual behavior
- Screenshots or screen recordings (if applicable)
- Environment info (browser, OS, Node version)

## Feature Requests

Open a [Feature Request](https://github.com/your-username/framer-clone/issues/new?template=feature_request.md) with:

- A clear description of the feature
- Why it would be valuable
- Any implementation ideas or references
- Mockups or examples (if applicable)
