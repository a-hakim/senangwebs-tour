# SenangWebs Tour (SWT) - AI Agent Instructions

## Project Overview

**SenangWebs Tour** is a modular 360° virtual tour system built on A-Frame WebVR with three distinct components:
1. **Core Library** (`src/`) - Data-driven tour engine (UMD module, global: `SWT`)
2. **Visual Editor** (`editor/`) - Browser-based tour creation GUI (vanilla JS)
3. **Standalone Viewer** (`viewer.html`) - Drag-and-drop JSON tour player

**Key Principle:** The library is **data-driven and stateless** - it renders tours from JSON configuration objects, not internal state.

## Architecture & Data Flow

### Three-Layer System
```
Editor (GUI) → Generates JSON → Library (SWT.Tour) → Renders in A-Frame
              ↓ Export         ↑ Consumes
              JSON Config      JSON Config
```

**Critical:** The editor and library are **decoupled**. The editor generates JSON that the library consumes. They share no code except the data contract (blueprint.md § 4).

### Core Library (`src/`)
- **Entry Point:** `src/index.js` exports `SWT.Tour` class via UMD
- **Build:** Rollup bundles to `dist/senangwebs_tour.js` (dev) and `.min.js` (prod)
- **Manager Pattern:** Tour delegates to 3 managers:
  - `AssetManager.js` - Preloads panoramas/assets
  - `SceneManager.js` - Handles sky entity, transitions, fade effects
  - `HotspotManager.js` - Creates/updates `<a-entity>` hotspots with `swt-hotspot-listener` component
- **Event System:** Tour emits `scene-loaded`, `hotspot-activated`, `tour-started` via custom `emit()` method
- **A-Frame Integration:** Manipulates DOM entities directly (not an A-Frame component itself)

### Editor Architecture (`editor/js/`)
**Six-Controller Pattern** (all vanilla JS classes, no frameworks):
- `editor.js` - Main coordinator, owns all managers, orchestrates actions
- `scene-manager.js` - Scene CRUD, stores scenes array with `{id, name, imageUrl, thumbnail, hotspots[]}`
- `hotspot-editor.js` - Hotspot CRUD, placement mode state, position validation
- `preview-controller.js` - Creates SWT.Tour instance for live preview, handles camera rotation
- `ui-controller.js` - DOM rendering (scene cards, hotspot list), tab switching
- `storage-manager.js` - LocalStorage persistence (key: `'swt_project'`)
- `export-manager.js` - JSON generation, viewer HTML templating

**Key Patterns:**
- **Debouncing:** All text inputs use `debounce(fn, 300)` from `utils.js`
- **Editor → Preview Sync:** Changes trigger `editor.render()` → updates UI + reloads preview via `previewController.loadScene()`
- **Scene Reload Optimization:** `lastRenderedSceneIndex` tracks loaded scene - only reloads if scene changes, preserving camera rotation when switching hotspots
- **Camera Preservation:** `loadScene(scene, preserveCameraRotation=true)` saves/restores camera rotation across reloads - set to `false` when switching scenes
- **Data Format Transformation:** Editor stores `imageUrl`, library expects `panorama` (see `preview-controller.js` L98-109)

## Critical Workflows

### Building the Library
```bash
npm run build      # Rollup bundles src/ → dist/
npm run dev        # Watch mode for development
```
**Output:** `dist/senangwebs_tour.js` (with sourcemap) + `.min.js`

### Running Examples/Editor
**Must use local server** (A-Frame requires proper CORS):
```bash
# Option 1: Node
npx http-server -p 8080

# Option 2: Python
python -m http.server 8080

# Then access:
# http://localhost:8080/editor/
# http://localhost:8080/viewer.html
```

### Hotspot Placement Flow (Editor)
1. User clicks "Add Hotspot" → `hotspotEditor.enablePlacementMode()`
2. User clicks on A-Frame preview → `preview-controller.js` raycasts against `<a-sky>`
3. Raycast returns 3D position → `editor.addHotspot()` creates hotspot object
4. Preview refreshes with new hotspot entity

### Camera Pointing to Hotspot (Recent Addition)
When hotspot selected from list:
- `editor.selectHotspot(index)` → `previewController.pointCameraToHotspot(position)`
- Calculates pitch/yaw using spherical coordinates
- Animates camera with `animateCameraRotation()` (800ms ease-in-out)
- **Critical:** `selectHotspot()` does NOT call `render()` to avoid scene reload resetting camera
- Scene reload only happens when `lastRenderedSceneIndex` changes (scene switch, add/remove hotspot)

## Project-Specific Conventions

### Data Schema (JSON Contract)
See `blueprint.md` § 4 - **do not deviate** without updating both library and editor:
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

### ID Generation
Use `generateId(prefix)` from `utils.js` - generates `prefix-timestamp-random` (e.g., `"scene-1729789123456-a3f"`).

### Position Validation
Hotspot positions are **clamped to 10-unit radius** sphere (see `editor.js` L346-365). Three.js math handles spherical constraints.

### File Handling (Editor)
- **Scene Upload:** Converts images to **Data URLs** (base64) via `loadImageAsDataUrl()` in `utils.js`
- **Thumbnail Generation:** Creates 100x50px canvas preview (`generateThumbnail()`)
- **Why Data URLs?** Enables offline editing and self-contained exports (no external files needed)

### Export Formats
1. **JSON Only:** Tour config for use with library
2. **Viewer HTML:** Embeds JSON + library in standalone HTML file (template in `export-manager.js` L145-236)

## Common Pitfalls

### 1. A-Frame Scene Not Loading
**Symptom:** Black screen, console errors about A-Frame  
**Cause:** A-Frame needs time to initialize  
**Solution:** Use `waitForLibrary('AFRAME', 5000)` pattern (see `preview-controller.js` L21-31)

### 2. Hotspot Click Not Working in Editor
**Symptom:** Placement mode active but clicks don't register  
**Cause:** Raycasting requires valid camera and sky entities  
**Solution:** Ensure `setupClickHandler()` runs after scene loads (500ms delay, L183)

### 3. Camera Rotation Not Smooth
**Symptom:** Camera jumps/spins 360° instead of shortest path  
**Cause:** Angle wrapping not normalized  
**Solution:** Use modulo normalization: `while (deltaY > 180) deltaY -= 360` (see `preview-controller.js` L438-441)

### 4. LocalStorage Quota Exceeded
**Symptom:** Save fails with QuotaExceededError  
**Cause:** Data URLs embed full images (can be MBs per scene)  
**Solution:** Warn users about image size, consider compression or external hosting

### 5. THREE.js Undefined
**Symptom:** `THREE is not defined` in preview-controller  
**Cause:** THREE.js is bundled with A-Frame but not exposed globally  
**Solution:** It IS available - check if A-Frame loaded first (L23-29)

## Key Files Reference

- **Data Schema:** `blueprint.md` § 4 (source of truth)
- **Library API:** `README.md` (public API docs)
- **Editor Architecture:** `blueprint-gui-editor.md` § 3-4
- **Integration Examples:** `example.html` (full), `example-simple.html` (minimal)
- **Utils/Helpers:** `editor/js/utils.js` - debounce, ID generation, file conversion

## Testing
Open `test.html` in browser - validates library loading, API surface, config validation. **No automated test suite** - manual testing via examples/editor.

## Debugging Tips
- Enable verbose logging in library: Check console for manager lifecycle events
- Editor state inspection: `window.editor` global available in dev console
- Preview not updating: Check `hasUnsavedChanges` flag, call `render()` manually
- A-Frame inspector: Press `Ctrl+Alt+I` in any A-Frame scene for visual debugger
