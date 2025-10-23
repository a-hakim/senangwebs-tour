# Quick Start Guide - SenangWebs Tour (SWT)

## 🚀 Getting Started in 5 Minutes

### Step 1: Installation

You have two options:

**Option A: Use the built files directly**
```html
<script src="https://aframe.io/releases/1.4.0/aframe.min.js"></script>
<script src="dist/senangwebs_tour.min.js"></script>
```

**Option B: Build from source**
```bash
cd senangwebs_tour
npm install
npm run build
```

### Step 2: Create Your HTML

```html
<!DOCTYPE html>
<html>
<head>
    <script src="https://aframe.io/releases/1.4.0/aframe.min.js"></script>
    <script src="dist/senangwebs_tour.min.js"></script>
</head>
<body>
    <a-scene id="vr-scene">
        <a-camera>
            <a-cursor></a-cursor>
        </a-camera>
    </a-scene>

    <script>
        // Your tour code here (see Step 3)
    </script>
</body>
</html>
```

### Step 3: Define Your Tour Configuration

```javascript
const tourConfig = {
    initialScene: "room1",
    scenes: {
        room1: {
            name: "Room 1",
            panorama: "path/to/room1-360.jpg",
            hotspots: [
                {
                    position: { x: 5, y: 0, z: -5 },
                    action: {
                        type: "navigateTo",
                        target: "room2"
                    },
                    appearance: {
                        color: "#FF6B6B",
                        scale: "2 2 2"
                    },
                    tooltip: {
                        text: "Go to Room 2"
                    }
                }
            ]
        },
        room2: {
            name: "Room 2",
            panorama: "path/to/room2-360.jpg",
            hotspots: [
                {
                    position: { x: -5, y: 0, z: -5 },
                    action: {
                        type: "navigateTo",
                        target: "room1"
                    },
                    appearance: {
                        color: "#4ECDC4",
                        scale: "2 2 2"
                    },
                    tooltip: {
                        text: "Back to Room 1"
                    }
                }
            ]
        }
    }
};
```

### Step 4: Initialize the Tour

```javascript
const sceneEl = document.querySelector('#vr-scene');

// Wait for A-Frame to load
sceneEl.addEventListener('loaded', () => {
    const tour = new SWT.Tour(sceneEl, tourConfig);
    
    // Optional: Listen to events
    tour.addEventListener('scene-loaded', (e) => {
        console.log('Loaded scene:', e.detail.sceneId);
    });
    
    // Start the tour
    tour.start();
});
```

## 📋 Tour Configuration Reference

### Root Object
```javascript
{
    settings: {                    // Optional
        defaultHotspot: {
            scale: "1 1 1",
            icon: "path/to/icon.png"
        }
    },
    initialScene: "scene_id",      // Required
    scenes: { /* ... */ }          // Required
}
```

### Scene Object
```javascript
"scene_id": {
    name: "Scene Name",            // Optional
    panorama: "path/to/360.jpg",   // Required (jpg, png, mp4, webm)
    hotspots: [ /* ... */ ]        // Optional
}
```

### Hotspot Object
```javascript
{
    id: "hotspot_1",               // Optional
    position: { x: 5, y: 0, z: -5 },  // Required
    action: {                      // Required
        type: "navigateTo",
        target: "target_scene_id"
    },
    appearance: {                  // Optional
        icon: "path/to/icon.png",
        scale: "1.5 1.5 1.5",
        color: "#FF6B6B"
    },
    tooltip: {                     // Optional
        text: "Click to navigate"
    }
}
```

## 🎯 API Methods

### Constructor
```javascript
const tour = new SWT.Tour(aframeSceneEl, tourConfig);
```

### Methods
- **`tour.start()`** - Start the tour (returns Promise)
- **`tour.navigateTo(sceneId)`** - Navigate to a scene (returns Promise)
- **`tour.getCurrentSceneId()`** - Get current scene ID
- **`tour.destroy()`** - Clean up and destroy the tour

### Events
Listen to events using `tour.addEventListener(eventName, handler)`:

- **`tour-started`** - Tour has started
- **`scene-loading`** - Before a scene loads
- **`scene-loaded`** - After a scene loads
- **`hotspot-activated`** - When a hotspot is clicked

Example:
```javascript
tour.addEventListener('scene-loaded', (e) => {
    console.log('Scene loaded:', e.detail.sceneId);
});
```

## 🎨 Positioning Hotspots

Hotspots use 3D coordinates:
- **X**: Left (-) to Right (+)
- **Y**: Down (-) to Up (+)
- **Z**: Back (-) to Front (+)

Tips:
- Start with values between -10 and 10
- Use Y=0 for ground level, Y=1.6 for eye level
- Negative Z values place hotspots in front of the camera's initial view

Example positions:
```javascript
{ x: 5, y: 0, z: -5 }    // Right side, ground level
{ x: -5, y: 1.6, z: -5 } // Left side, eye level
{ x: 0, y: 2, z: 8 }     // Above, behind camera
```

## 📦 Demo Files Included

1. **example.html** - Full-featured demo with UI
2. **example-simple.html** - Minimal working example

To run the demos:
```bash
# Option 1: Using Python
python -m http.server 8080

# Option 2: Using Node.js http-server
npx http-server -p 8080

# Then open: http://localhost:8080/example.html
```

## 🎓 Tips & Best Practices

1. **360° Images**: Use equirectangular panoramas (2:1 ratio)
2. **File Formats**: JPG for images, MP4/WebM for videos
3. **Image Size**: 4096x2048 or 8192x4096 for high quality
4. **Hotspot Scale**: Use 1.5-2.0 for visible hotspots
5. **Performance**: Preload assets in the tour config
6. **Testing**: Test in both desktop and VR modes

## 🐛 Troubleshooting

**Problem**: Hotspots not appearing
- Check that hotspot positions are within visible range
- Verify the appearance settings (scale, color)
- Make sure A-Frame scene is fully loaded before starting tour

**Problem**: Images not loading
- Check file paths are correct
- Ensure server supports CORS for external images
- Verify image format is supported (jpg, png)

**Problem**: Click not working
- Ensure cursor is added to camera
- Check that hotspots have the clickable class
- Verify fuse timeout settings

## 📞 Need Help?

- Check the full `blueprint.md` for detailed specifications
- Review `example.html` for working implementation
- Open issues on GitHub (if available)

---

**Happy Touring! 🌍✨**
