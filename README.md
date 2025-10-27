# SenangWebs Tour (SWT)

A powerful, data-driven 360° virtual tour system for A-Frame WebVR with a visual editor and standalone viewer.

## Features

- **Visual Editor** - Drag-and-drop interface for creating tours without coding
- **Viewer Library** - Lightweight JavaScript library for embedding tours
- **Standalone Viewer** - Drag-and-drop JSON player, no dependencies needed
- **Mobile-Friendly** - Full touch and VR headset support
- **Customizable** - Custom hotspot colors, icons, and tooltips
- **Export Options** - JSON or self-contained HTML files

## Quick Start

### Editor Quick Start (Visual Tour Builder)

1. **Open the Editor:** Launch `examples/editor.html` in your browser (use `npm run serve` for local server).
2. **Add Scenes:** Click "Add Scene" and upload your 360° panorama images (images are converted to Data URLs for offline editing).
3. **Place Hotspots:** Click "Add Hotspot" and then click on the preview to place interactive hotspots.
4. **Configure Hotspots:** Set hotspot color, icon, tooltip, and navigation target (scene to jump to).
5. **Preview:** See live updates in the A-Frame preview window as you edit.
6. **Export:**

- **JSON Export:** Download a portable tour config for use with the viewer library.
- **Viewer Export:** Download a standalone HTML file with embedded JSON and viewer (no dependencies needed).

### Viewer Library Quick Start (Code Integration)

```html
<!DOCTYPE html>
<html>
<head>
  <script src="https://aframe.io/releases/1.7.0/aframe.min.js"></script>
  <script src="dist/swt.min.js"></script>
</head>
<body>
  <a-scene id="vr-scene">
    <a-camera>
      <a-cursor></a-cursor>
    </a-camera>
  </a-scene>

  <script>
    const tourConfig = {
      initialScene: "scene1",
      scenes: {
        scene1: {
          name: "First Scene",
          panorama: "path/to/panorama1.jpg",
          hotspots: [
            {
              position: { x: 10, y: 1.5, z: -3 },
              action: {
                type: "navigateTo",
                target: "scene2"
              },
              appearance: {
                color: "#00ff00",
                scale: 1.0
              },
              tooltip: {
                text: "Go to Scene 2"
              }
            }
          ]
        },
        scene2: {
          name: "Second Scene",
          panorama: "path/to/panorama2.jpg",
          hotspots: []
        }
      }
    };

    const scene = document.querySelector('#vr-scene');
    const tour = new SWT.Tour(scene, tourConfig);

    tour.addEventListener('scene-loaded', (e) => {
      console.log('Scene loaded:', e.detail.sceneId);
    });

    tour.start();
  </script>
</body>
</html>
```

### Custom Editor Integration (Using swt-editor.js)

The SWT editor supports **two initialization modes**: declarative (HTML-only) and programmatic (JavaScript API).

#### Option 1: Declarative Mode (HTML Attributes)

Zero JavaScript required - just use `data-swt-*` attributes:

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
  <!-- Declarative editor - auto-initializes -->
  <div data-swt-editor 
       data-swt-auto-init="true"
       data-swt-project-name="My Tour"
       data-swt-auto-save="true">
    <div data-swt-scene-list></div>
    <div data-swt-preview-area></div>
    <div data-swt-properties-panel></div>
  </div>
</body>
</html>
```

**Supported Attributes:**
- `data-swt-editor` - Marks the editor container
- `data-swt-auto-init="true"` - Auto-initialize on page load
- `data-swt-project-name="..."` - Initial project name
- `data-swt-auto-save="true"` - Enable auto-save
- `data-swt-auto-save-interval="30000"` - Auto-save interval (ms)

#### Option 2: Programmatic Mode (JavaScript API)

Full control via JavaScript:

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
  <div id="my-editor">
    <div id="scene-list"></div>
    <div id="preview-area"></div>
    <div id="properties-panel"></div>
  </div>

  <script>
    // Initialize with custom configuration
    const editor = new TourEditor({
      projectName: 'My Custom Tour',
      autoSave: true,
      autoSaveInterval: 30000
    });

    editor.init({
      sceneListElement: document.getElementById('scene-list'),
      previewElement: document.getElementById('preview-area'),
      propertiesElement: document.getElementById('properties-panel')
    });

    // Access editor instance
    window.editor = editor;
  </script>
</body>
</html>
```

**Examples:**
- `examples/editor-declarative.html` - Declarative mode (HTML-only)
- `examples/editor-simple.html` - Minimal programmatic example
- `examples/editor.html` - Full-featured editor

**Available Editor Classes:**

- `TourEditor` - Main editor coordinator
- `SceneManagerEditor` - Scene CRUD operations
- `HotspotEditor` - Hotspot placement and editing
- `PreviewController` - A-Frame preview management
- `UIController` - DOM rendering and updates
- `ProjectStorageManager` - LocalStorage persistence
- `ExportManager` - JSON and HTML export functionality

## Building from Source

```bash
# Install dependencies
npm install

# Build all (viewer + editor)
npm run build

# Watch for changes (development)
npm run dev

# Serve locally (required for A-Frame CORS)
npm run serve
# Then open http://localhost:8080
```

### Build Output

- `dist/swt.js` & `swt.min.js` - Viewer library (UMD format, 26KB/12KB) for embedding tours in web pages
- `dist/swt-editor.js` & `swt-editor.min.js` - Editor bundle (IIFE format, 89KB/38KB) providing the complete visual editor interface, scene management, hotspot placement, real-time preview, and export functionality. Loaded in `examples/editor.html`.
- `dist/swt-editor.css` & `swt-editor.min.css` - Editor styles (39KB/25KB) for the editor UI components

## API Documentation

### Constructor

```javascript
new SWT.Tour(aframeSceneEl, tourConfig)
```

**Parameters:**

- `aframeSceneEl` - A-Frame scene element (`<a-scene>`)
- `tourConfig` - Tour configuration object (see structure below)

### Configuration Structure

```javascript
{
  initialScene: "scene-id",      // Required: Starting scene ID
  scenes: {                       // Required: Object of scenes
    "scene-id": {
      name: "Scene Name",         // Required
      panorama: "url-or-dataurl", // Required: Image URL or base64
      hotspots: [                 // Optional: Array of hotspots
        {
          id: "hotspot-1",        // Auto-generated if not provided
          position: { x, y, z },  // Required: 3D coordinates
          action: {
            type: "navigateTo",   // Required: Action type
            target: "scene-id"    // Required: Target scene ID
          },
          appearance: {           // Optional
            color: "#00ff00",     // Default: "#00ff00"
            scale: 1.0,           // Default: 1.0
            icon: "arrow"         // Default: sphere
          },
          tooltip: {              // Optional
            text: "Click here"    // Tooltip text
          }
        }
      ]
    }
  }
}
```

### Methods

- `start()` - Initialize and start the tour
- `navigateTo(sceneId)` - Navigate to a specific scene
- `getCurrentSceneId()` - Get the current scene ID
- `destroy()` - Clean up and remove the tour
- `addEventListener(event, callback)` - Listen to tour events

### Events

- `tour-started` - Fired when the tour starts
  - `detail: { config }`
- `scene-loading` - Fired before a scene loads
  - `detail: { sceneId }`
- `scene-loaded` - Fired after a scene is loaded
  - `detail: { sceneId, sceneName }`
- `hotspot-activated` - Fired when a hotspot is clicked
  - `detail: { hotspotId, sceneId, action }`

## Editor Features

- **Visual Hotspot Placement** - Click-to-place interface with raycasting
- **Real-time Preview** - See changes immediately in A-Frame preview
- **Scene Management** - Add, remove, reorder scenes with drag-and-drop
- **Hotspot Properties** - Customize position, color, target, tooltip
- **Import/Export** - Load and save tour configurations
- **Dual Export Modes:**
  - **JSON Export** - Configuration file for use with SWT library
  - **Viewer Export** - Standalone HTML with embedded tour

## Browser Compatibility

- Chrome 90+ (recommended)
- Firefox 88+
- Safari 14+
- Edge 90+
- Mobile browsers with WebGL support

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

MIT License - see LICENSE file for details
