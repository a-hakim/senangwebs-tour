# SenangWebs Tour (SWT)

A powerful, data-driven 360° virtual tour system built on A-Frame WebVR. Create immersive virtual tours with a visual editor, or integrate the lightweight viewer library into your own projects.

## Table of Contents

- [Features](#-features)
- [Quick Start](#-quick-start)
  - [Using the Visual Editor](#using-the-visual-editor-no-coding-required)
  - [Integrating with Code](#integrating-with-code-viewer-library)
- [Custom Editor Integration](#-custom-editor-integration)
  - [Declarative Mode](#option-1-declarative-mode-html-attributes)
  - [Programmatic Mode](#option-2-programmatic-mode-javascript-api)
- [Building from Source](#️-building-from-source)
- [API Documentation](#-api-documentation)
- [Editor Features](#-editor-features)
- [Browser Compatibility](#-browser-compatibility)
- [Documentation](#-documentation)
- [Contributing](#-contributing)
- [License](#-license)

## Features

### Core Capabilities
- **Visual Editor** - No-code tour builder with click-to-place hotspot interface
- **Viewer Library** - Lightweight (12KB minified) JavaScript library for embedding tours
- **Standalone Viewer** - Self-contained HTML viewer with drag-and-drop JSON support
- **Mobile & VR Ready** - Full touch, mouse, and VR headset support
- **Customizable Hotspots** - Custom colors, scales, and tooltip text
- **Multiple Export Formats** - JSON configuration or standalone HTML files

### Developer-Friendly
- **Two Integration Modes** - Declarative (HTML attributes) or Programmatic (JavaScript API)
- **Modular Architecture** - Six-controller editor pattern with clear separation of concerns
- **Event System** - React to scene loads, hotspot clicks, and navigation events
- **Data-Driven** - Pure JSON configuration, no internal state management
- **Built with Rollup** - Modern ES6+ modules with sourcemaps for debugging

## Quick Start

### Using the Visual Editor (No Coding Required)

1. **Start Local Server** (required for A-Frame CORS):
   ```bash
   npm install
   npm run serve
   ```

2. **Open Editor**: Navigate to `http://localhost:8080/examples/editor.html`

3. **Create Your Tour**:
   - Click **"Add Scene"** and upload 360° panorama images (JPG/PNG)
   - Click **"Add Hotspot"** then click on the preview to place navigation points
   - Configure hotspot properties: color, scale, tooltip text, target scene
   - See changes instantly in the live A-Frame preview

4. **Export Your Tour**:
   - **JSON Export** → Portable config file for library integration
   - **Viewer Export** → Self-contained HTML file (no dependencies needed)

5. **Test Standalone Viewer**: Open `http://localhost:8080/examples/viewer.html` and drag-and-drop your exported JSON

### Integrating with Code (Viewer Library)

**Minimal Example** (see `examples/example-simple.html`):

```html
<!DOCTYPE html>
<html>
<head>
  <script src="https://aframe.io/releases/1.7.0/aframe.min.js"></script>
  <script src="https://cdn.jsdelivr.net/gh/a-hakim/senangwebs-tour@latest/dist/swt.min.js"></script>
</head>
<body>
  <a-scene id="tour-scene">
    <a-camera><a-cursor></a-cursor></a-camera>
  </a-scene>

  <script>
    const config = {
      initialScene: "room1",
      scenes: {
        room1: {
          name: "Living Room",
          panorama: "path/to/panorama1.jpg",
          hotspots: [{
            position: { x: 5, y: 0, z: -5 },
            action: { type: "navigateTo", target: "room2" },
            appearance: { color: "#FF6B6B", scale: 1.5 },
            tooltip: { text: "Go to Kitchen" }
          }]
        },
        room2: {
          name: "Kitchen",
          panorama: "path/to/panorama2.jpg",
          hotspots: [{
            position: { x: -5, y: 0, z: 5 },
            action: { type: "navigateTo", target: "room1" },
            appearance: { color: "#4ECDC4", scale: 1.5 },
            tooltip: { text: "Back to Living Room" }
          }]
        }
      }
    };

    const scene = document.querySelector('#tour-scene');
    scene.addEventListener('loaded', () => {
      const tour = new SWT.Tour(scene, config);
      tour.addEventListener('scene-loaded', (e) => {
        console.log('Now viewing:', e.detail.sceneName);
      });
      tour.start();
    });
  </script>
</body>
</html>
```

## Custom Editor Integration

Build your own tour editor using the `swt-editor.js` bundle. Two initialization modes are supported:

### Option 1: Declarative Mode (HTML Attributes)

**Zero JavaScript** - perfect for quick prototypes:

```html
<!DOCTYPE html>
<html>
<head>
  <script src="https://aframe.io/releases/1.7.0/aframe.min.js"></script>
  <script src="dist/swt.js"></script>
  <script src="dist/swt-editor.js"></script>
  <link rel="stylesheet" href="dist/swt-editor.css">
</head>
<body>
  <!-- Auto-initializes on page load -->
  <div data-swt-editor 
       data-swt-auto-init="true"
       data-swt-project-name="My Virtual Tour">
    <div data-swt-scene-list></div>
    <div data-swt-preview-area></div>
    <div data-swt-properties-panel></div>
  </div>
</body>
</html>
```

**Supported HTML Attributes:**
| Attribute | Description | Default |
|-----------|-------------|---------|
| `data-swt-editor` | Marks the editor container (required) | - |
| `data-swt-auto-init` | Auto-initialize on DOMContentLoaded | `false` |
| `data-swt-project-name` | Initial project name | `"Untitled Tour"` |
| `data-swt-auto-save` | Enable LocalStorage auto-save | `false` |
| `data-swt-auto-save-interval` | Auto-save interval (milliseconds) | `30000` |
| `data-swt-scene-list` | Scene list panel container | - |
| `data-swt-preview-area` | A-Frame preview container | - |
| `data-swt-properties-panel` | Hotspot properties panel | - |

**Example:** `examples/editor-declarative.html`

### Option 2: Programmatic Mode (JavaScript API)

**Full control** - for custom workflows and advanced integrations:

```html
<!DOCTYPE html>
<html>
<head>
  <script src="https://aframe.io/releases/1.7.0/aframe.min.js"></script>
  <script src="dist/swt.js"></script>
  <script src="dist/swt-editor.js"></script>
  <link rel="stylesheet" href="dist/swt-editor.css">
</head>
<body>
  <div id="editor-container">
    <div id="scenes"></div>
    <div id="preview"></div>
    <div id="properties"></div>
  </div>

  <script>
    // Create editor instance with custom config
    const editor = new TourEditor({
      projectName: 'My Custom Tour',
      autoSave: true,
      autoSaveInterval: 30000
    });

    // Initialize with DOM elements
    editor.init({
      sceneListElement: document.getElementById('scenes'),
      previewElement: document.getElementById('preview'),
      propertiesElement: document.getElementById('properties')
    });

    // Access editor programmatically
    editor.addEventListener('scene-added', (scene) => {
      console.log('New scene:', scene.name);
    });

    // Export tour configuration
    const config = editor.exportJSON();
  </script>
</body>
</html>
```

**Available Classes** (all attached to `window` after loading `swt-editor.js`):
- `TourEditor` - Main coordinator, orchestrates all managers
- `SceneManagerEditor` - Scene CRUD operations
- `HotspotEditor` - Hotspot placement and editing
- `PreviewController` - A-Frame preview rendering
- `UIController` - DOM rendering and updates
- `ProjectStorageManager` - LocalStorage persistence
- `ExportManager` - JSON and HTML export

**Examples:**
- `examples/editor-declarative.html` - Declarative HTML-only mode
- `examples/editor.html` - Full-featured programmatic editor

## Building from Source

### Installation & Build

```bash
# Install dependencies
npm install

# Build all bundles (viewer + editor)
npm run build

# Development mode (watch for changes)
npm run dev

# Serve locally (required for A-Frame CORS)
npm run serve
# Access at http://localhost:8080
```

### Build Output

| File | Size | Format | Purpose |
|------|------|--------|---------|
| `dist/swt.js` | 26KB | UMD | Viewer library (development) |
| `dist/swt.min.js` | 12KB | UMD | Viewer library (production) |
| `dist/swt-editor.js` | 89KB | IIFE | Editor bundle (development) |
| `dist/swt-editor.min.js` | 38KB | IIFE | Editor bundle (production) |
| `dist/swt-editor.css` | 39KB | CSS | Editor styles (development) |
| `dist/swt-editor.min.css` | 25KB | CSS | Editor styles (production) |

All builds include **sourcemaps** for debugging.

### Project Structure

```
src/
├── index.js                    # Viewer library entry (UMD export)
├── AssetManager.js             # Panorama preloading
├── SceneManager.js             # Sky entity, transitions, fades
├── HotspotManager.js           # Hotspot creation & updates
├── components/
│   └── hotspot-listener.js     # A-Frame hotspot component
└── editor/
    ├── editor-entry.js         # Editor bundle entry (IIFE)
    ├── editor-entry.css        # CSS bundle entry (@import)
    ├── css/
    │   └── main.css           # Editor UI styles
    └── js/
        ├── editor.js           # Main coordinator (TourEditor)
        ├── scene-manager.js    # Scene CRUD (SceneManagerEditor)
        ├── hotspot-editor.js   # Hotspot placement (HotspotEditor)
        ├── preview-controller.js # A-Frame preview (PreviewController)
        ├── ui-controller.js    # DOM rendering (UIController)
        ├── storage-manager.js  # LocalStorage (ProjectStorageManager)
        ├── export-manager.js   # JSON/HTML export (ExportManager)
        ├── utils.js            # Helper functions
        └── ui-init.js          # DOMContentLoaded initialization

examples/
├── example.html               # Full viewer demo
├── example-simple.html        # Minimal viewer demo
├── editor.html               # Full editor demo
├── editor-declarative.html   # Declarative editor demo
└── viewer.html               # Standalone drag-and-drop viewer
```

## API Documentation

### Viewer Library API

#### Constructor

```javascript
new SWT.Tour(aframeSceneElement, tourConfiguration)
```

**Parameters:**
- `aframeSceneElement` (HTMLElement) - A-Frame `<a-scene>` DOM element
- `tourConfiguration` (Object) - Tour config (see structure below)

**Returns:** `Tour` instance

---

#### Configuration Structure

```javascript
{
  initialScene: "scene-id",       // Required: Starting scene ID
  scenes: {                        // Required: Object (not array!)
    "scene-id": {                  // Key = scene ID
      name: "Scene Name",          // Required: Display name
      panorama: "url-or-dataurl",  // Required: Image URL or base64
      hotspots: [                  // Optional: Array of hotspots
        {
          id: "hotspot-1",         // Optional: Auto-generated if omitted
          position: {              // Required: 3D coordinates
            x: 10,
            y: 1.5,
            z: -3
          },
          action: {                // Required: Hotspot action
            type: "navigateTo",    // Required: Action type
            target: "scene-id-2"   // Required: Target scene ID
          },
          appearance: {            // Optional: Visual customization
            color: "#00ff00",      // Default: "#00ff00"
            scale: 1.5,            // Default: 1.0 (number or "x y z" string)
            icon: "arrow"          // Default: sphere (future: custom icons)
          },
          tooltip: {               // Optional: Hover/focus text
            text: "Click to navigate" // Tooltip content
          }
        }
      ]
    }
  }
}
```

**Important Notes:**
- `scenes` is an **object** (keys are scene IDs), not an array
- Hotspot `position` is in 3D space (typically on 10-unit sphere surface)
- Editor stores `imageUrl`, library expects `panorama` (export handles conversion)
- Images can be URLs or Data URLs (base64) for offline tours

---

#### Methods

##### `tour.start()`
Initialize and start the tour. Loads the initial scene and sets up event listeners.

**Returns:** `void`

**Example:**
```javascript
const tour = new SWT.Tour(sceneElement, config);
tour.start();
```

---

##### `tour.navigateTo(sceneId)`
Navigate to a specific scene by ID.

**Parameters:**
- `sceneId` (String) - Target scene ID (must exist in `scenes` object)

**Returns:** `void`

**Example:**
```javascript
tour.navigateTo('bedroom'); // Loads scene with id "bedroom"
```

---

##### `tour.getCurrentSceneId()`
Get the ID of the currently active scene.

**Returns:** `String` - Current scene ID

**Example:**
```javascript
const currentScene = tour.getCurrentSceneId();
console.log('Viewing:', currentScene); // "living-room"
```

---

##### `tour.destroy()`
Clean up and remove the tour. Removes all hotspots, event listeners, and resets scene.

**Returns:** `void`

**Example:**
```javascript
tour.destroy(); // Cleanup before removing from DOM
```

---

##### `tour.addEventListener(eventName, callback)`
Listen to tour events. Custom event system (not DOM events).

**Parameters:**
- `eventName` (String) - Event name (see Events section)
- `callback` (Function) - Handler function receiving event object

**Returns:** `void`

**Example:**
```javascript
tour.addEventListener('scene-loaded', (event) => {
  console.log('Scene:', event.detail.sceneName);
});
```

---

#### Events

All events include a `detail` object with event-specific data.

##### `tour-started`
Fired when `tour.start()` is called.

**Detail:**
```javascript
{
  config: Object // Full tour configuration
}
```

---

##### `scene-loading`
Fired before a scene begins loading.

**Detail:**
```javascript
{
  sceneId: String // ID of scene being loaded
}
```

---

##### `scene-loaded`
Fired after a scene is fully loaded and rendered.

**Detail:**
```javascript
{
  sceneId: String,   // ID of loaded scene
  sceneName: String  // Display name of scene
}
```

---

##### `hotspot-activated`
Fired when a hotspot is clicked/activated.

**Detail:**
```javascript
{
  hotspotId: String,     // Hotspot ID
  sceneId: String,       // Current scene ID
  action: Object         // Hotspot action object { type, target }
}
```

---

#### Usage Example

```javascript
const scene = document.querySelector('#vr-scene');
const tour = new SWT.Tour(scene, {
  initialScene: "room1",
  scenes: {
    room1: {
      name: "Living Room",
      panorama: "360-living-room.jpg",
      hotspots: [{
        position: { x: 5, y: 0, z: -5 },
        action: { type: "navigateTo", target: "room2" },
        appearance: { color: "#FF6B6B" },
        tooltip: { text: "Kitchen" }
      }]
    },
    room2: {
      name: "Kitchen",
      panorama: "360-kitchen.jpg",
      hotspots: []
    }
  }
});

// Listen to events
tour.addEventListener('tour-started', (e) => {
  console.log('Tour configuration:', e.detail.config);
});

tour.addEventListener('scene-loading', (e) => {
  console.log('Loading scene:', e.detail.sceneId);
  // Show loading indicator
});

tour.addEventListener('scene-loaded', (e) => {
  console.log('Loaded:', e.detail.sceneName);
  // Hide loading indicator
});

tour.addEventListener('hotspot-activated', (e) => {
  console.log('Hotspot clicked:', e.detail.hotspotId);
  console.log('Navigating to:', e.detail.action.target);
});

// Start the tour
tour.start();

// Programmatic navigation
setTimeout(() => {
  tour.navigateTo('room2');
}, 5000);

// Cleanup
// tour.destroy();
```

## Editor Features

### Visual Tour Creation
- **Click-to-Place Hotspots** - Raycast-based placement on panorama sphere
- **Real-Time Preview** - Instant A-Frame rendering as you edit
- **Scene Management** - Add, remove, reorder scenes with thumbnails
- **Camera Control** - Auto-point camera to selected hotspot with animation
- **Position Validation** - Hotspots clamped to 10-unit sphere radius

### Hotspot Configuration
- **3D Position** - Click-to-place or manual X/Y/Z coordinate input
- **Navigation Target** - Link to any scene in the tour
- **Visual Customization** - Color picker and scale slider
- **Tooltips** - Custom hover text for each hotspot

### Data Management
- **LocalStorage Persistence** - Auto-save projects (configurable interval)
- **Import/Export** - Load and save tour JSON configurations
- **Data URLs** - Panoramas embedded as base64 (no external files needed)
- **Thumbnail Generation** - Auto-generated scene previews (100x50px)

### Export Options
1. **JSON Export** - Portable configuration file for library integration
   - Converts editor's `imageUrl` to library's `panorama` format
   - Compatible with `SWT.Tour` viewer library
   - Use in custom integrations or standalone viewer

2. **Viewer Export** - Self-contained HTML file
   - Embeds minified `swt.min.js` library
   - Includes full tour JSON configuration
   - No external dependencies - works offline
   - Drag-and-drop ready for distribution

### Developer Tools
- **ES6 Module Architecture** - Six-controller pattern with clear separation
- **Sourcemaps** - Debug original ES6 source in browser DevTools
- **Two Init Modes** - Declarative (HTML) or Programmatic (JS API)
- **Event System** - React to scene-added, hotspot-clicked events
- **Global Access** - All classes attached to `window` for console debugging

## Browser Compatibility

| Browser | Version | Notes |
|---------|---------|-------|
| Chrome | 90+ | Recommended - best performance |
| Firefox | 88+ | Full support |
| Safari | 14+ | WebGL support required |
| Edge | 90+ | Chromium-based |
| Mobile Safari | iOS 14+ | Touch and gyroscope support |
| Chrome Mobile | Android 90+ | Touch and gyroscope support |

**Requirements:**
- WebGL 1.0 or higher
- ES6 module support (for editor)
- LocalStorage (for editor persistence)

**VR Headsets:**
- Oculus Quest 1/2/3
- Meta Quest Pro
- HTC Vive
- Valve Index
- Any WebXR-compatible headset

## Documentation

- **[EDITOR.md](./EDITOR.md)** - Complete guide to building custom editors
- **[.github/copilot-instructions.md](./.github/copilot-instructions.md)** - AI agent development instructions
- **[examples/](./examples/)** - Live code examples and demos

## Contributing

Contributions are welcome! Here's how you can help:

1. **Report Bugs** - Open an issue with reproduction steps
2. **Suggest Features** - Share your ideas in GitHub Issues
3. **Submit PRs** - Fork, create a feature branch, and submit a pull request
4. **Improve Docs** - Help make documentation clearer and more comprehensive

### Development Workflow

```bash
# Fork and clone the repository
git clone https://github.com/your-username/senangwebs-tour.git
cd senangwebs-tour

# Install dependencies
npm install

# Start development server with watch mode
npm run dev

# In another terminal, serve the examples
npm run serve

# Make changes, test in browser at http://localhost:8080
# Build for production
npm run build

# Submit a pull request
```

### Code Guidelines
- Use ES6+ syntax (modules, classes, arrow functions)
- Follow existing naming conventions (see copilot-instructions.md)
- No debug `console.log()` - only `console.error()` for critical errors
- All editor classes must use `export default`
- Debounce text inputs (300ms) using `debounce()` from utils.js
- Test in Chrome, Firefox, and Safari before submitting

## License

MIT License - see [LICENSE.md](./LICENSE.md) for details.

## Acknowledgments

- **[A-Frame](https://aframe.io/)** - WebVR framework powering the 3D rendering
- **[Rollup](https://rollupjs.org/)** - Module bundler for clean ES6+ builds
