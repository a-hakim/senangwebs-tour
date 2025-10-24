# SenangWebs Tour (SWT)

A powerful, data-driven 360° virtual tour system for A-Frame WebVR with a visual editor and standalone viewer.

## Features

- **Visual Editor** - Drag-and-drop interface for creating tours without coding
- **Viewer Library** - Lightweight JavaScript library for embedding tours (12KB minified)
- **Standalone Viewer** - Drag-and-drop JSON player, no dependencies needed
- **Mobile-Friendly** - Full touch and VR headset support
- **Auto-Save** - Projects automatically saved to localStorage
- **Customizable** - Custom hotspot colors, icons, and tooltips
- **Export Options** - JSON or self-contained HTML files
- **Offline-First** - Works without internet connection

## Project Structure

```
senangwebs_tour/
├── dist/                       # Built files (generated)
│   ├── swt.js                 # Viewer library (26KB, dev)
│   ├── swt.min.js             # Viewer library (12KB, prod)
│   ├── swt-editor.js          # Editor bundle (89KB, dev)
│   ├── swt-editor.min.js      # Editor bundle (38KB, prod)
│   ├── swt-editor.css         # Editor styles (39KB, dev)
│   └── swt-editor.min.css     # Editor styles (25KB, prod)
├── src/                        # Source files
│   ├── editor/                # Visual editor source
│   │   ├── index.html         # Editor interface
│   │   ├── css/               # Editor styles
│   │   └── js/                # Editor modules (ES6)
│   ├── components/            # A-Frame components
│   ├── index.js               # Library entry point
│   └── *Manager.js            # Core managers
├── examples/                   # Example files
│   ├── editor.html            # Editor demo
│   ├── example.html           # Full tour demo
│   ├── example-simple.html    # Minimal example
│   ├── viewer.html            # Standalone viewer
│   └── test.html              # Library tests
└── index.html                  # Project landing page
```

## Quick Start

### Option 1: Use the Visual Editor

1. Open `src/editor/index.html` or `examples/editor.html` in a browser
2. Click "Add Scene" and upload 360° panorama images
3. Click "Add Hotspot" and place hotspots by clicking the preview
4. Configure hotspot properties and navigation targets
5. Export as JSON or standalone HTML

### Option 2: Use the Library (Code)

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

- `dist/swt.js` & `swt.min.js` - Viewer library (UMD format)
- `dist/swt-editor.js` & `swt-editor.min.js` - Editor bundle (IIFE format)
- `dist/swt-editor.css` & `swt-editor.min.css` - Editor styles

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
- **Camera Auto-Point** - Camera automatically points to selected hotspots
- **Project Persistence** - Auto-save to localStorage
- **Import/Export** - Load and save tour configurations
- **Dual Export Modes:**
  - **JSON Export** - Configuration file for use with SWT library
  - **Viewer Export** - Standalone HTML with embedded tour (no dependencies)

## Browser Compatibility

- Chrome 90+ (recommended)
- Firefox 88+
- Safari 14+
- Edge 90+
- Mobile browsers with WebGL support

## Documentation Files

- `README.md` - This file, main documentation
- `RESTRUCTURING.md` - Project restructuring guide
- `.github/copilot-instructions.md` - AI agent development guide
- `blueprint.md` - Library architecture blueprint
- `blueprint-gui-editor.md` - Editor architecture blueprint

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

MIT License - see LICENSE file for details

## Support

- **Issues**: Open an issue on GitHub
- **Documentation**: See `examples/` folder for working demos
- **Local Testing**: Always use `npm run serve` (A-Frame requires proper CORS)
