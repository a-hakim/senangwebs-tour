---
description: How to set up and run the development environment
---

# Development Workflow

This workflow describes how to start the development server and work on the SenangWebs Tour library.

## Prerequisites

- Node.js (v16+)
- npm

## 1. Install Dependencies

If you haven't already, install the project dependencies.

```bash
npm install
```

## 2. Start Development Server

Run the development server which uses Rollup in watch mode and starts a local HTTP server.

// turbo
```bash
npm run dev
```

This command acts as a shortcut for `rollup -c -w`. It will:
- Build the bundles in `dist/`
- Watch for changes in `src/` and rebuild automatically

## 3. Run the Example Editor

To test your changes, you can use the built-in HTTP server to serve the examples.

// turbo
```bash
npm run serve
```

Then navigate to:
- Editor: `http://localhost:8080/examples/editor.html`
- Viewer: `http://localhost:8080/examples/viewer.html`
- Declarative Editor: `http://localhost:8080/examples/editor-declarative.html`

## 4. Debugging

- Source maps are enabled by default in development mode.
- Open your browser's DevTools to verify changes.
- The global `SWT` object is available on the window for inspecting the library state.
