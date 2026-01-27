---
description: How to build the project for production
---

# Build Workflow

This workflow describes how to build the SenangWebs Tour library for production.

## 1. Run Build Command

Execute the build script to generate the production bundles.

// turbo
```bash
npm run build
```

## 2. Verify Output

Check the `dist/` directory for the generated files:

- `swt.js` / `swt.min.js`: The main viewer library.
- `swt-editor.js` / `swt-editor.min.js`: The visual editor logic.
- `swt-editor.css`: Styles for the editor interface.

## 3. Build Configuration

The build process is configured in `rollup.config.js`. It handles:
- Resolution of dependencies (including A-Frame peer dependency handling).
- Minification using Terser.
- CSS extraction using PostCSS.
