# SenangWebs Tour (SWT) - AI Agent Instructions

## Project Overview

**SenangWebs Tour** is a modular 360° virtual tour system built on A-Frame WebVR with three distinct components:
1. **Core Library** (`src/`) - Data-driven tour engine (UMD module, global: `SWT`)
2. **Visual Editor** (`src/editor/`) - Browser-based tour creation GUI (ES6 modules)
3. **Standalone Viewer** (`examples/viewer.html`) - Drag-and-drop JSON tour player

**Key Principle:** The library is **data-driven and stateless** - it renders tours from JSON configuration objects, not internal state.

## Architecture & Data Flow

### Three-Layer System
```
Editor (GUI) → Generates JSON → Library (SWT.Tour) → Renders in A-Frame
              ↓ Export         ↑ Consumes
              JSON Config      JSON Config
```

**Critical:** The editor and library are **decoupled**. The editor generates JSON that the library consumes. They share no code except the data contract (README.md Configuration Structure).

### Core Library (`src/`)
- **Entry Point:** `src/index.js` exports `SWT.Tour` class via UMD (global: `SWT`)
- **Build:** Rollup bundles to `dist/swt.js` (26KB dev) and `swt.min.js` (12KB prod)
- **Manager Pattern:** Tour delegates to 3 managers:
  - `AssetManager.js` - Preloads panoramas/assets
  - `SceneManager.js` - Handles sky entity, transitions, fade effects
  - `HotspotManager.js` - Creates/updates `<a-entity>` hotspots with `swt-hotspot-listener` component
- **Event System:** Tour emits `scene-loaded`, `hotspot-activated`, `tour-started` via custom `emit()` method
- **A-Frame Integration:** Manipulates DOM entities directly (not an A-Frame component itself)

### Editor Architecture (`src/editor/js/`)
**Six-Controller Pattern** (ES6 modules with exports):
- `editor.js` - Main coordinator (`TourEditor` class), owns all managers, orchestrates actions
- `scene-manager.js` - Scene CRUD (`SceneManagerEditor` class), stores scenes array with `{id, name, imageUrl, thumbnail, hotspots[]}`
- `hotspot-editor.js` - Hotspot CRUD (`HotspotEditor` class), placement mode state, position validation
- `preview-controller.js` - Creates `SWT.Tour` instance for live preview (`PreviewController` class), handles camera rotation
- `ui-controller.js` - DOM rendering (`UIController` class), scene cards, hotspot list, tab switching
- `storage-manager.js` - LocalStorage persistence (`ProjectStorageManager` class, key: `'swt_project'`) - **Note:** Renamed from `StorageManager` to avoid browser API conflict
- `export-manager.js` - JSON generation, viewer HTML templating (`ExportManager` class)
- `utils.js` - Utility functions (exported as named exports)
- `ui-init.js` - DOMContentLoaded initialization

**Build System:**
- **Entry Point:** `src/editor/editor-entry.js` imports all modules, attaches classes to `window` for global access
- **CSS Entry:** `src/editor/editor-entry.css` uses `@import` to bundle all styles (main.css, components.css, editor.css)
- **Rollup Config:** Bundles editor as IIFE (not UMD) → `dist/swt-editor.js` (89KB dev), `swt-editor.min.js` (38KB prod)
- **PostCSS:** Uses `postcss-import` plugin to resolve CSS `@import` statements
- **Output:** JS + CSS bundles (no custom build scripts needed)

**Key Patterns:**
- **ES6 Exports:** All classes use `export default ClassName`, utils use named exports
- **Global Window Access:** Entry point attaches classes to window for backward compatibility (see `editor-entry.js` lines 5-26)
- **Debouncing:** All text inputs use `debounce(fn, 300)` from `utils.js`
- **Editor → Preview Sync:** Changes trigger `editor.render()` → updates UI + reloads preview via `previewController.loadScene()`
- **Scene Reload Optimization:** `lastRenderedSceneIndex` tracks loaded scene - only reloads if scene changes, preserving camera rotation when switching hotspots
- **Camera Preservation:** `loadScene(scene, preserveCameraRotation=true)` saves/restores camera rotation across reloads - set to `false` when switching scenes
- **Data Format Transformation:** Editor stores `imageUrl`, library expects `panorama` (conversion in `preview-controller.js` and `export-manager.js`)
- **Logging Policy:** Use only `console.error()` for critical errors. `console.warn()` is acceptable in viewer library (src/) for runtime warnings (video autoplay, unknown actions). Never use `console.log()`, `console.debug()`, or `console.trace()` in production code. No emojis in console output.
- **Declarative Init Pattern:** `ui-init.js` scans for `[data-swt-editor]` elements on DOMContentLoaded, auto-initializes if `data-swt-auto-init="true"`

## Critical Workflows

### Building Everything
```bash
npm run build      # Rollup bundles viewer + editor (src/ → dist/)
npm run dev        # Watch mode for development
```
**Output:** 
- Viewer: `dist/swt.js` (26KB) + `swt.min.js` (12KB) with sourcemaps
- Editor: `dist/swt-editor.js` (89KB) + `swt-editor.min.js` (38KB) with sourcemaps
- CSS: `dist/swt-editor.css` (39KB) + `swt-editor.min.css` (25KB) with sourcemaps

### Running Examples/Editor
**Must use local server** (A-Frame requires proper CORS):
```bash
npm run serve      # Runs http-server on port 8080

# Then access:
# http://localhost:8080/examples/editor.html (full-featured editor demo)
# http://localhost:8080/examples/editor-declarative.html (declarative HTML-only demo)
# http://localhost:8080/examples/example.html (full viewer integration)
# http://localhost:8080/examples/example-simple.html (minimal viewer demo)
# http://localhost:8080/examples/viewer.html (standalone drag-drop viewer)
```

**Why local server?** A-Frame's texture loading and WebGL require proper CORS headers. File protocol (`file://`) won't work.

### File Structure (Post-Restructuring)
```
dist/           # Built files (generated, in .gitignore)
src/            # Source code
  editor/       # Visual editor (moved from root)
  components/   # A-Frame components
  index.js      # Library entry
examples/       # All HTML demos (moved from root)
```

### Hotspot Placement Flow (Editor)
1. User clicks "Add Hotspot" → `hotspotEditor.enablePlacementMode()`
2. User clicks on A-Frame preview → `preview-controller.js` raycasts against `<a-sky>`
3. Raycast returns 3D position → `editor.addHotspot()` creates hotspot object
4. Preview refreshes with new hotspot entity

### Camera Pointing to Hotspot
When hotspot selected from list:
- `editor.selectHotspot(index)` → `previewController.pointCameraToHotspot(position)`
- Calculates pitch/yaw using spherical coordinates
- Animates camera with `animateCameraRotation()` (800ms ease-in-out)
- **Critical:** `selectHotspot()` does NOT call `render()` to avoid scene reload resetting camera
- Scene reload only happens when `lastRenderedSceneIndex` changes (scene switch, add/remove hotspot)

## Project-Specific Conventions

### Data Schema (JSON Contract)
See README.md Configuration Structure - **do not deviate** without updating both library and editor:
```javascript
{
  initialScene: "scene-id",       // Required
  scenes: {                        // Object (not array!)
    "scene-id": {
      name: "Scene Name",
      panorama: "url-or-dataurl",  // Editor: 'imageUrl', Library: 'panorama'
      hotspots: [                  // Array of hotspot objects
        {
          id: "hotspot-1",
          position: {x, y, z},     // 3D coords
          action: {type: "navigateTo", target: "scene-id"},
          appearance: {color, scale, icon},
          tooltip: {text}
        }
      ]
    }
  }
}
```

### Naming Conventions
- **Class Names:** PascalCase with descriptive suffixes (e.g., `SceneManagerEditor`, `ProjectStorageManager`)
- **Avoid Browser API Conflicts:** `ProjectStorageManager` not `StorageManager` (browser has `StorageManager` API)
- **File Names:** kebab-case for JS files (e.g., `scene-manager.js`, `hotspot-editor.js`)
- **Build Artifacts:** `swt.js` (viewer), `swt-editor.js` (editor), `swt-editor.css` (styles)

### ID Generation
Use `generateId(prefix)` from `utils.js` - generates `prefix-timestamp-random` (e.g., `"scene-1729789123456-a3f"`).

### Position Validation
Hotspot positions are **clamped to 10-unit radius** sphere (see `editor.js` addHotspot method). Three.js math handles spherical constraints.

### File Handling (Editor)
- **Scene Upload:** Converts images to **Data URLs** (base64) via `loadImageAsDataUrl()` in `utils.js`
- **Thumbnail Generation:** Creates 100x50px canvas preview (`generateThumbnail()` in `utils.js`)
- **Why Data URLs?** Enables offline editing and self-contained exports (no external files needed)

### Export Formats
1. **JSON Only:** Tour config for use with library (editor stores `imageUrl`, export converts to `panorama`)
2. **Viewer HTML:** Embeds JSON + minified library (`dist/swt.min.js`) in standalone HTML file (template in `export-manager.js`)

## Common Pitfalls

### 1. A-Frame Scene Not Loading
**Symptom:** Black screen, console errors about A-Frame  
**Cause:** A-Frame needs time to initialize  
**Solution:** Use `waitForLibrary('AFRAME', 5000)` pattern (see `preview-controller.js` init method)

### 2. StorageManager Browser Conflict
**Symptom:** "Illegal constructor" error  
**Cause:** `StorageManager` is a built-in browser API  
**Solution:** Class renamed to `ProjectStorageManager` throughout codebase

### 3. Editor Modules Not Bundling
**Symptom:** Classes undefined in built `swt-editor.js`  
**Cause:** Missing ES6 exports  
**Solution:** All editor classes must have `export default ClassName` at end of file

### 4. CSS Not Loading in Built Editor
**Symptom:** Unstyled editor interface  
**Cause:** CSS `@import` not resolved  
**Solution:** Rollup uses `postcss-import` plugin - ensure `editor-entry.css` imports all CSS files

### 5. LocalStorage Quota Exceeded
**Symptom:** Save fails with QuotaExceededError  
**Cause:** Data URLs embed full images (can be MBs per scene)  
**Solution:** Warn users about image size, consider compression or external hosting

### 6. Camera Rotation Jumping
**Symptom:** Camera jumps/spins 360° instead of shortest path  
**Cause:** Angle wrapping not normalized  
**Solution:** Use modulo normalization: `while (deltaY > 180) deltaY -= 360` (see `preview-controller.js` animateCameraRotation method)

## Key Files Reference

- **Data Schema:** README.md Configuration Structure (source of truth)
- **Library API:** README.md API Documentation
- **Build Config:** `rollup.config.js` - 6 build targets (viewer dev/prod, editor JS dev/prod, editor CSS dev/prod)
- **Editor Entry:** `src/editor/editor-entry.js` - imports all modules, attaches to window
- **Integration Examples:** `examples/example.html` (full), `examples/example-simple.html` (minimal)
- **Utils/Helpers:** `src/editor/js/utils.js` - debounce, ID generation, file conversion (all exported)

## Testing
Open `examples/test.html` in browser - validates library loading, API surface, config validation. **No automated test suite** - manual testing via examples/editor.

## Debugging Tips
- Editor state inspection: `window.editor` global available in dev console after initialization
- Preview not updating: Check `hasUnsavedChanges` flag, call `editor.render()` manually
- A-Frame inspector: Press `Ctrl+Alt+I` in any A-Frame scene for visual debugger
- Console output: Only `console.error()` for critical errors - no debug logging in production
- Rollup sourcemaps: Enable in browser DevTools to debug original ES6 source

## Code Quality Standards

### Console Output Policy
- **Production code:** Use ONLY `console.error()` for critical errors
- **Viewer library (src/):** `console.warn()` acceptable for runtime warnings (autoplay failures, unknown actions)
- **Never use:** `console.log()`, `console.debug()`, `console.trace()`, or any emojis in console output
- **Examples/demos:** Can include minimal logging for educational purposes, but avoid clutter

### Code Style
- **No emojis:** Removed from all production code, error messages, and comments
- **Indentation:** Consistent 4-space indentation (already enforced via cleanup)
- **Comments:** Keep JSDoc for public APIs, remove redundant inline comments explaining obvious code
- **Whitespace:** Clean, consistent formatting without trailing spaces or unnecessary blank lines

## Quick Reference

### Most Common Tasks

**Adding a new editor feature:**
1. Modify appropriate controller in `src/editor/js/` (scene-manager, hotspot-editor, ui-controller)
2. Update `editor.js` if coordination needed between controllers
3. Add UI elements in `ui-controller.js` render methods
4. Test in `examples/editor.html` with `npm run dev` + `npm run serve`
5. Update README.md API/Features section if public-facing

**Changing data format:**
1. Update JSON schema documentation in README.md Configuration Structure
2. Update export conversion in `export-manager.js` (imageUrl → panorama)
3. Update viewer library parsing in `src/index.js` Tour constructor
4. Test both JSON export and standalone viewer export
5. Verify backward compatibility or document breaking change

**Adding CSS styles:**
1. Edit `src/editor/css/main.css` (all editor styles in one file)
2. Build automatically picks up changes via `editor-entry.css` @import
3. Test with `npm run dev` (watch mode rebuilds CSS)
4. Avoid inline styles - keep all CSS in main.css for maintainability

**Debugging A-Frame issues:**
1. Check browser console for A-Frame warnings (texture loading, component errors)
2. Use A-Frame inspector (`Ctrl+Alt+I`) to inspect scene graph
3. Verify `waitForLibrary('AFRAME')` pattern in `preview-controller.js`
4. Check if scene element exists before accessing components
5. Remember A-Frame is async - use `scene.addEventListener('loaded', ...)`
