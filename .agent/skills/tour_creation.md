---
name: Tour Creation & Configuration
description: comprehensive guide to the JSON configuration format for creating tours.
---

# Tour Creation & Configuration

All tours in SenangWebs Tour are defined by a JSON configuration object. This document outlines the schema and how to construct it.

## Configuration Object

```javascript
const config = {
  initialScene: "living-room", // ID of the starting scene
  cursor: true, // Auto-inject cursor? (true/false or selector string)
  settings: {
    defaultHotspot: {
      appearance: { color: "#FFFFFF" }
    }
  },
  scenes: [ /* Array of Scene Objects */ ]
};
```

## Scene Object

A scene represents a single 360° view.

```javascript
{
  id: "living-room",          // Unique ID
  name: "Living Room",        // Display name
  panorama: "images/living.jpg", // URL to 360 image (or base64)
  thumbnail: "images/thumb.jpg", // (Optional) URL for editor thumbnail
  startingPosition: {         // (Optional) Initial camera angle in radians
    pitch: 0,
    yaw: 1.57
  },
  hotspots: [ /* Array of Hotspot Objects */ ]
}
```

## Hotspot Object

Hotspots are interactive points within a scene.

```javascript
{
  id: "hs-1",                 // Unique ID
  position: { x: 10, y: 1.5, z: 0 }, // 3D coordinates (usually on 10m sphere)
  
  // Action to perform on click
  action: {
    type: "navigateTo",       // Currently supported: 'navigateTo'
    target: "kitchen"         // ID of target scene
  },

  // Visual appearance
  appearance: {
    color: "#FF0000",         // Hex color
    scale: { x: 1, y: 1, z: 1 }, // Scale vector or string "1 1 1"
    icon: "arrow"             // Icon name (default: "arrow")
  },

  // Tooltip on hover
  tooltip: {
    text: "Go to Kitchen"
  }
}
```

## Coordinate System

- **World**: A-Frame uses a Right-Handed generic 3D coordinate system.
- **Unit**: Meters.
- **Sphere**: The background skybox typically has a radius of 50m (variable). Hotspots are usually placed on a radius of 10m to be reachable but "far enough".

## Event System

The `SWT.Tour` instance emits events on the `<a-scene>` element.

### Listening to Events

```javascript
const tour = new SWT.Tour(sceneEl, config);

tour.addEventListener("scene-loaded", (e) => {
  console.log("Current Scene:", e.detail.sceneName);
});

tour.addEventListener("hotspot-activated", (e) => {
  console.log("Clicked Hotspot:", e.detail.hotspotId);
});
```

### Event List
- `tour-started`: Fired when `start()` is called.
- `scene-loading`: Fired before transition begins.
- `scene-loaded`: Fired after transition completes.
- `hotspot-activated`: Fired when a hotspot is clicked.
