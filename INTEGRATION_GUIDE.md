# SenangWebs Tour - Complete Integration Guide

## Overview

SenangWebs Tour (SWT) now includes a complete **visual editor** and **standalone viewer**, allowing users to create immersive 360° virtual tours without writing any code.

## Components

### 1. **SWT Library** (`dist/senangwebs_tour.js`)
Core JavaScript library for creating and displaying 360° virtual tours.

### 2. **SWT Editor** (`editor/index.html`)
Visual GUI tool for creating tour configurations through an intuitive interface.

### 3. **SWT Viewer** (`viewer.html`)
Standalone viewer for loading and displaying exported tour configurations.

---

## Quick Start

### Option A: Create Tour with Editor (Recommended)

1. **Open the Editor**
   ```
   Open: editor/index.html
   ```

2. **Add Scenes**
   - Click "+ Add Scene" button
   - Select one or more 360° panorama images
   - Scenes will appear in the left sidebar

3. **Place Hotspots**
   - Select a scene from the sidebar
   - Click "+ Add Hotspot" button
   - Click on the preview to place the hotspot
   - Configure hotspot properties in the right panel:
     - Title and description
     - Target scene (for navigation)
     - Color
     - Position (auto-filled)

4. **Configure Tour Settings**
   - Switch to "Tour" tab
   - Set tour title and description
   - Choose initial scene
   - Enable optional features (auto-rotate, compass)

5. **Export**
   - Click "Export" button
   - Choose export type:
     - **Download JSON** - For use with SWT library or viewer
     - **Export Viewer HTML** - Complete standalone HTML file
     - **Copy JSON** - Copy to clipboard

### Option B: Use Standalone Viewer

1. **Open the Viewer**
   ```
   Open: viewer.html
   ```

2. **Load Tour**
   - Drag and drop your exported JSON file
   - Or click "Choose File" to browse

3. **Navigate**
   - Look around with mouse/touch
   - Click hotspots to navigate between scenes
   - Use "Reset View" button to center camera

---

## Editor Features

### Scene Management
- ✅ Upload multiple 360° panoramas
- ✅ Drag-and-drop reordering
- ✅ Automatic thumbnail generation
- ✅ Scene naming and ID management
- ✅ Delete individual scenes

### Hotspot Editor
- ✅ Visual hotspot placement (click on preview)
- ✅ Configurable properties:
  - Title and description
  - Target scene for navigation
  - Custom colors
  - 3D position
- ✅ Duplicate hotspots
- ✅ Delete hotspots
- ✅ Hotspot list view

### Preview
- ✅ Real-time A-Frame preview
- ✅ Interactive navigation
- ✅ Hotspot visualization
- ✅ Camera controls (look around)

### Project Management
- ✅ Auto-save to localStorage
- ✅ Manual save/load
- ✅ Import/export projects
- ✅ New project creation
- ✅ Unsaved changes warning

### Export Options
- ✅ JSON configuration (for library integration)
- ✅ Standalone HTML viewer (complete package)
- ✅ Copy to clipboard
- ✅ JSON preview before export

---

## File Structure

```
senangwebs_tour/
├── src/                          # Library source code
│   ├── index.js                  # Main Tour class
│   ├── AssetManager.js           # Asset loading
│   ├── SceneManager.js           # Scene transitions
│   ├── HotspotManager.js         # Hotspot creation
│   └── components/
│       └── hotspot-listener.js   # A-Frame component
├── dist/                         # Built library
│   ├── senangwebs_tour.js        # Development build
│   └── senangwebs_tour.min.js    # Production build (minified)
├── editor/                       # Visual editor
│   ├── index.html                # Editor interface
│   ├── css/
│   │   ├── editor.css            # Main styles
│   │   └── components.css        # UI component styles
│   └── js/
│       ├── utils.js              # Utility functions
│       ├── storage-manager.js    # LocalStorage operations
│       ├── scene-manager.js      # Scene CRUD
│       ├── hotspot-editor.js     # Hotspot operations
│       ├── preview-controller.js # A-Frame integration
│       ├── ui-controller.js      # DOM rendering
│       ├── export-manager.js     # JSON generation
│       └── editor.js             # Main controller
├── viewer.html                   # Standalone viewer
├── example.html                  # Full demo
├── example-simple.html           # Minimal demo
└── package.json                  # Project configuration
```

---

## JSON Configuration Format

The editor generates JSON in this format:

```json
{
  "title": "My Virtual Tour",
  "description": "Tour description",
  "initialSceneId": "scene-1",
  "scenes": [
    {
      "id": "scene-1",
      "name": "Living Room",
      "imageUrl": "data:image/jpeg;base64,...",
      "hotspots": [
        {
          "id": "hotspot_123",
          "type": "navigation",
          "position": { "x": 5, "y": 0, "z": -3 },
          "targetSceneId": "scene-2",
          "title": "Go to Kitchen",
          "description": "Navigate to the kitchen",
          "color": "#00ff00",
          "icon": ""
        }
      ]
    }
  ],
  "settings": {
    "autoRotate": false,
    "showCompass": false
  }
}
```

---

## Using Exported Tours

### Method 1: With SWT Library (Code Integration)

```html
<!DOCTYPE html>
<html>
<head>
    <script src="https://aframe.io/releases/1.4.0/aframe.min.js"></script>
    <script src="dist/senangwebs_tour.min.js"></script>
</head>
<body>
    <div id="tour-container"></div>
    
    <script>
        // Load your exported JSON
        fetch('my-tour.json')
            .then(r => r.json())
            .then(config => {
                const tour = new SenangWebsTour('tour-container', config);
                tour.start();
            });
    </script>
</body>
</html>
```

### Method 2: With SWT Viewer (No Code)

1. Open `viewer.html` in browser
2. Load your exported JSON file
3. Navigate the tour

### Method 3: Standalone HTML (All-in-One)

1. Use "Export Viewer HTML" from editor
2. Share the single HTML file
3. No additional setup needed

---

## Development Workflow

### Building the Library

```bash
# Install dependencies
npm install

# Build development version
npm run build

# Build production version (minified)
npm run build:prod
```

### Testing

1. **Library Tests**: Open `test.html` in browser
2. **Simple Demo**: Open `example-simple.html`
3. **Full Demo**: Open `example.html`
4. **Editor**: Open `editor/index.html`
5. **Viewer**: Open `viewer.html`

---

## Browser Requirements

- **Modern browsers** with WebGL support
- **A-Frame 1.4.0** (included via CDN)
- **ES6+ JavaScript** support
- **LocalStorage** (for editor auto-save)
- **File API** (for image uploads in editor)

---

## Image Requirements

### Panoramas
- **Format**: JPEG, PNG
- **Type**: Equirectangular 360° images
- **Resolution**: 4096x2048 recommended (2:1 aspect ratio)
- **File Size**: Optimize images for web (< 2MB per image)

### Capture Methods
- 360° cameras (Ricoh Theta, Insta360, etc.)
- Smartphone panorama apps
- 3D rendering software (Blender, V-Ray, etc.)

---

## Tips & Best Practices

### For Best Performance
- Optimize images before upload (compress to ~1-2MB)
- Use reasonable hotspot counts (5-10 per scene)
- Test on target devices

### For Better UX
- Use descriptive hotspot titles
- Add scene descriptions
- Set logical initial scene
- Use consistent color coding for hotspot types
- Test navigation flow

### For Deployment
- Host on HTTPS (required for some browser features)
- Use CDN for A-Frame library
- Consider image CDN for panoramas
- Test on mobile devices

---

## Troubleshooting

### Editor Issues

**Problem**: Scenes not loading
- **Solution**: Check image format (JPEG/PNG only)
- **Solution**: Reduce image file size if too large

**Problem**: Hotspots not appearing
- **Solution**: Ensure scene is selected
- **Solution**: Check target scene is set
- **Solution**: Refresh preview

**Problem**: Export fails
- **Solution**: Check browser console for errors
- **Solution**: Ensure at least one scene exists
- **Solution**: Try "Copy JSON" instead

### Viewer Issues

**Problem**: JSON not loading
- **Solution**: Validate JSON format (use JSONLint)
- **Solution**: Check file permissions
- **Solution**: Try drag-and-drop instead

**Problem**: Images not displaying
- **Solution**: Check imageUrl paths in JSON
- **Solution**: Ensure CORS headers if loading from different domain
- **Solution**: Convert to data URLs (editor does this automatically)

### Library Issues

**Problem**: Navigation not working
- **Solution**: Ensure targetSceneId matches actual scene IDs
- **Solution**: Check browser console for errors
- **Solution**: Verify A-Frame is loaded

---

## API Reference

### Tour Class

```javascript
const tour = new SenangWebsTour(containerId, config);

// Methods
await tour.start();                    // Initialize and start tour
tour.navigateTo(sceneId);             // Navigate to specific scene
const currentId = tour.getCurrentSceneId(); // Get current scene ID
tour.destroy();                        // Clean up and remove tour

// Events
tour.on('ready', () => {...});        // Tour ready
tour.on('sceneChanged', (id) => {...}); // Scene changed
tour.on('error', (error) => {...});   // Error occurred
```

---

## License

MIT License - Free for personal and commercial use.

---

## Support

For issues, questions, or contributions, please refer to the project documentation or contact support.

---

## Changelog

### Version 1.1.0 (Current)
- ✅ Complete visual editor with drag-and-drop
- ✅ Standalone viewer application
- ✅ Auto-save and project management
- ✅ Multiple export formats
- ✅ Thumbnail generation
- ✅ Real-time preview

### Version 1.0.0
- ✅ Core library implementation
- ✅ Basic examples
- ✅ Documentation

---

**Ready to create amazing 360° tours? Start with `editor/index.html`!** 🎉
