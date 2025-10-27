# Custom Editor Development Guide

This guide explains how to build your own custom tour editor using the SWT editor components (`swt-editor.js`).

## Overview

The SWT editor system is built with modular ES6 classes that can be used independently to create custom editor interfaces. Instead of using the pre-built `examples/editor.html`, you can compose your own editor with only the components you need.

## Quick Start

### Basic Setup

Create a minimal HTML file with the required dependencies:

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
  <!-- Your custom editor UI -->
  <div id="my-editor">
    <div id="scene-list"></div>
    <div id="preview-area"></div>
    <div id="properties-panel"></div>
  </div>

  <script>
    // Your editor initialization code here
  </script>
</body>
</html>
```

### Minimal Working Example

See `examples/editor-simple.html` for a complete minimal implementation.

## Editor Architecture

The SWT editor uses a **six-controller pattern** with these main classes:

### Core Classes

| Class | Purpose | Key Methods |
|-------|---------|-------------|
| `TourEditor` | Main coordinator, orchestrates all other components | `initialize()`, `render()`, `addScene()`, `addHotspot()` |
| `SceneManagerEditor` | Scene CRUD operations | `addScene()`, `removeScene()`, `getScenes()` |
| `HotspotEditor` | Hotspot placement and editing | `enablePlacementMode()`, `addHotspot()`, `updateHotspot()` |
| `PreviewController` | A-Frame preview management | `loadScene()`, `pointCameraToHotspot()` |
| `UIController` | DOM rendering and updates | `renderSceneList()`, `renderHotspotList()` |
| `ProjectStorageManager` | LocalStorage persistence | `saveProject()`, `loadProject()` |
| `ExportManager` | JSON and HTML export | `generateTourConfig()`, `exportAsViewer()` |

## Building a Custom Editor

### Step 1: Initialize Components

```javascript
// Create instances of the editor components
const editor = new TourEditor();
const sceneManager = new SceneManagerEditor();
const hotspotEditor = new HotspotEditor();
const previewController = new PreviewController(document.getElementById('preview-area'));
const uiController = new UIController();
const storageManager = new ProjectStorageManager();
const exportManager = new ExportManager();
```

### Step 2: Configure the Editor

```javascript
// Set up editor with your custom DOM elements
editor.initialize({
  sceneListElement: document.getElementById('scene-list'),
  previewElement: document.getElementById('preview-area'),
  propertiesElement: document.getElementById('properties-panel')
});
```

### Step 3: Add Event Handlers

```javascript
// Listen to editor events
editor.addEventListener('scene-added', (e) => {
  console.log('Scene added:', e.detail.scene);
  // Update your custom UI
});

editor.addEventListener('hotspot-placed', (e) => {
  console.log('Hotspot placed:', e.detail.position);
  // Handle hotspot placement in your UI
});

editor.addEventListener('scene-loaded', (e) => {
  console.log('Scene loaded:', e.detail.sceneId);
  // Update preview state
});
```

## Advanced Usage

### Custom Scene Management

```javascript
// Add a scene programmatically
const sceneData = {
  id: 'my-scene-1',
  name: 'Living Room',
  imageUrl: 'data:image/jpeg;base64,...', // Data URL or regular URL
  hotspots: []
};

sceneManager.addScene(sceneData);
editor.render(); // Update UI
```

### Custom Hotspot Placement

```javascript
// Enable hotspot placement mode
hotspotEditor.enablePlacementMode();

// Add hotspot at specific position
const hotspot = {
  id: 'hotspot-1',
  position: { x: 5, y: 1.5, z: -3 },
  action: {
    type: 'navigateTo',
    target: 'scene-2'
  },
  appearance: {
    color: '#ff0000',
    scale: 1.2
  },
  tooltip: {
    text: 'Go to Kitchen'
  }
};

editor.addHotspot(hotspot);
```

### Custom Export

```javascript
// Generate tour configuration
const tourConfig = exportManager.generateTourConfig(sceneManager.getScenes());

// Export as JSON file
const jsonBlob = new Blob([JSON.stringify(tourConfig, null, 2)], {
  type: 'application/json'
});
const url = URL.createObjectURL(jsonBlob);

// Create download link
const a = document.createElement('a');
a.href = url;
a.download = 'my-tour.json';
a.click();
```

### Custom Storage

```javascript
// Save project to localStorage
storageManager.saveProject({
  name: 'My Custom Tour',
  scenes: sceneManager.getScenes(),
  settings: {
    initialScene: 'scene-1',
    autoRotate: false
  }
});

// Load project from localStorage
const project = storageManager.loadProject();
if (project) {
  // Restore scenes
  project.scenes.forEach(scene => {
    sceneManager.addScene(scene);
  });
  editor.render();
}
```

## Event System

The editor emits custom events that you can listen to:

### Available Events

| Event | When Fired | Event Detail |
|-------|------------|--------------|
| `scene-added` | New scene uploaded | `{ scene }` |
| `scene-removed` | Scene deleted | `{ sceneId }` |
| `scene-loaded` | Scene loaded in preview | `{ sceneId, sceneName }` |
| `hotspot-placed` | Hotspot placed via click | `{ position, sceneId }` |
| `hotspot-selected` | Hotspot selected from list | `{ hotspot, index }` |
| `hotspot-updated` | Hotspot properties changed | `{ hotspot, property, value }` |
| `project-saved` | Project saved to storage | `{ projectName }` |
| `export-ready` | Tour ready for export | `{ config }` |

### Event Handler Example

```javascript
// Listen to multiple events
const events = ['scene-added', 'hotspot-placed', 'project-saved'];

events.forEach(eventName => {
  editor.addEventListener(eventName, (e) => {
    console.log(`${eventName}:`, e.detail);
    // Update your custom UI accordingly
  });
});
```

## UI Customization

### Using Editor CSS Classes

The `swt-editor.css` file provides CSS classes you can use in your custom UI:

```html
<!-- Scene card styling -->
<div class="scene-card">
  <img class="scene-thumbnail" src="..." alt="Scene">
  <div class="scene-info">
    <h3 class="scene-name">Living Room</h3>
  </div>
</div>

<!-- Button styling -->
<button class="btn btn-primary">Add Scene</button>
<button class="btn btn-secondary">Export</button>

<!-- Form styling -->
<div class="form-group">
  <label class="form-label">Scene Name</label>
  <input type="text" class="form-input" placeholder="Enter name">
</div>
```

### Custom CSS Variables

Override CSS variables to match your design:

```css
:root {
  --primary-color: #your-color;
  --background-color: #your-bg;
  --text-primary: #your-text;
  --border-color: #your-border;
}
```

## Data Flow

Understanding the data flow helps in building custom interfaces:

```
User Action → Editor Method → Manager Update → UI Render → Event Emission
```

### Example Flow: Adding a Scene

1. User uploads image file
2. `editor.addScene()` called
3. `sceneManager.addScene()` stores scene data
4. `uiController.renderSceneList()` updates DOM
5. `scene-added` event emitted
6. Your custom handlers execute

## Best Practices

### 1. Always Call `editor.render()`

After making changes to scenes or hotspots, call `editor.render()` to update all UI components:

```javascript
sceneManager.addScene(newScene);
editor.render(); // Updates UI
```

### 2. Handle Async Operations

Image loading and A-Frame initialization are asynchronous:

```javascript
// Wait for A-Frame to be ready
previewController.waitForLibrary('AFRAME', 5000).then(() => {
  // A-Frame is ready, safe to load scenes
  previewController.loadScene(sceneData);
});
```

### 3. Debounce User Input

Use the provided `debounce` utility for text inputs:

```javascript
// Import from utils (if available)
import { debounce } from './utils.js';

// Or implement your own
const debouncedUpdate = debounce((value) => {
  hotspotEditor.updateProperty('tooltip.text', value);
}, 300);

document.getElementById('hotspot-title').addEventListener('input', (e) => {
  debouncedUpdate(e.target.value);
});
```

### 4. Error Handling

Always handle potential errors:

```javascript
try {
  const config = exportManager.generateTourConfig(scenes);
  // Process config
} catch (error) {
  console.error('Export failed:', error);
  // Show user-friendly error message
}
```

## Common Use Cases

### Simplified Editor

Create a minimal editor with just scene upload and basic preview:

```javascript
// Minimal setup - just scene management and preview
const sceneManager = new SceneManagerEditor();
const previewController = new PreviewController(document.getElementById('preview'));

// Simple scene upload
document.getElementById('upload').addEventListener('change', async (e) => {
  const file = e.target.files[0];
  if (file) {
    const dataUrl = await loadImageAsDataUrl(file);
    const scene = {
      id: `scene-${Date.now()}`,
      name: file.name,
      imageUrl: dataUrl,
      hotspots: []
    };
    
    sceneManager.addScene(scene);
    previewController.loadScene(scene);
  }
});
```

### Read-Only Viewer with Edit Mode

Create a viewer that can switch to edit mode:

```javascript
let editMode = false;

function toggleEditMode() {
  editMode = !editMode;
  
  if (editMode) {
    // Enable hotspot placement
    hotspotEditor.enablePlacementMode();
    document.getElementById('edit-panel').style.display = 'block';
  } else {
    // Disable editing
    hotspotEditor.disablePlacementMode();
    document.getElementById('edit-panel').style.display = 'none';
  }
}
```

### Integration with Backend

Save/load tours from your server:

```javascript
// Save to server
async function saveTourToServer(tourConfig) {
  const response = await fetch('/api/tours', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(tourConfig)
  });
  
  if (response.ok) {
    const result = await response.json();
    console.log('Tour saved with ID:', result.id);
  }
}

// Load from server
async function loadTourFromServer(tourId) {
  const response = await fetch(`/api/tours/${tourId}`);
  
  if (response.ok) {
    const tourConfig = await response.json();
    
    // Load scenes into editor
    Object.values(tourConfig.scenes).forEach(scene => {
      sceneManager.addScene(scene);
    });
    
    editor.render();
  }
}
```

## Troubleshooting

### Common Issues

1. **A-Frame not loading**: Ensure A-Frame script loads before `swt.js`
2. **Classes undefined**: Make sure `swt-editor.js` loads after A-Frame and `swt.js`
3. **CSS not applied**: Include `swt-editor.css` in your HTML head
4. **Events not firing**: Check that event listeners are added after editor initialization
5. **Preview blank**: Verify the preview container element exists and has dimensions

### Debug Mode

Enable debug logging (in development builds):

```javascript
// Enable verbose logging
window.SWT_DEBUG = true;

// Check editor state
console.log('Scenes:', sceneManager.getScenes());
console.log('Current scene:', previewController.getCurrentScene());
```

## API Reference

For detailed API documentation of each class and method, see the main README.md file and the source code comments in `src/editor/js/`.

## Examples

- `examples/editor.html` - Full-featured editor
- `examples/editor-simple.html` - Minimal custom editor implementation
- `examples/viewer.html` - Standalone viewer (for reference)

## Contributing

To contribute to the editor system or report issues, please see the main project repository.