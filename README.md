# SenangWebs Tour (SWT) Library

A powerful, data-driven virtual tour library for A-Frame WebVR experiences.

## Installation

### Via npm (coming soon)
```bash
npm install senangwebs_tour
```

### Via CDN
```html
<script src="path/to/dist/senangwebs_tour.min.js"></script>
```

## Quick Start

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

# Build the library
npm run build

# Watch for changes (development)
npm run dev
```

## API Documentation

### Constructor

```javascript
new SWT.Tour(aframeSceneEl, tourConfig)
```

### Methods

- `start()` - Initialize and start the tour
- `navigateTo(sceneId)` - Navigate to a specific scene
- `getCurrentSceneId()` - Get the current scene ID
- `destroy()` - Clean up and remove the tour

### Events

- `tour-started` - Fired when the tour starts
- `scene-loading` - Fired before a scene loads
- `scene-loaded` - Fired after a scene is loaded
- `hotspot-activated` - Fired when a hotspot is clicked

## License

MIT
