# SenangWebs Tour (SWT) Library - Blueprint Specification

**Library Name:** SenangWebs Tour (SWT)
**Namespace:** `SWT`
**Package Name:** `senangwebs_tour`
**Version:** 1.0.0

## 1. Introduction

The SenangWebs Tour (SWT) library is the core engine for creating and managing interactive, data-driven virtual tours within an A-Frame JS environment. It is designed to be controlled by a GUI editor or used programmatically by developers.

The library's primary responsibilities are:
-   **Parsing Tour Data:** Ingesting a structured JSON object that defines the entire tour.
-   **Scene Management:** Dynamically loading 360° panoramas and managing transitions between scenes.
-   **Hotspot Generation:** Creating and placing interactive navigation hotspots within the A-Frame scene.
-   **State Management:** Tracking the current state of the tour, such as the active scene.

This library acts as a controller that manipulates A-Frame entities, but it is not an A-Frame component itself. It provides a clean API to manage the tour's lifecycle.

## 2. Core Concepts

-   **Tour:** The complete virtual experience, defined by a single JSON object. It contains all scenes, settings, and navigation logic.
-   **Scene:** A single 360° location within the tour. Each scene has a panoramic background (image or video) and a set of hotspots.
-   **Hotspot:** An interactive element placed in 3D space within a scene. Its primary function is to trigger an action, most commonly navigating to another scene.

## 3. Architecture & Design

-   **Modularity:** The library will be written in modern JavaScript (ES6+) and bundled as a UMD module to be easily included via a `<script>` tag or imported into a larger project.
-   **Data-Driven:** The entire tour's structure and behavior are dictated by a single JSON configuration file. The library is stateless in that it simply renders the state described in the JSON.
-   **Decoupling:** The SWT library is decoupled from the user interface (the GUI editor). It operates purely on the provided JSON data and manipulates the target A-Frame `<a-scene>`.
-   **Event-Driven:** The library will use a simple event dispatcher to emit events about the tour's state (e.g., `scene-loaded`, `tour-started`). This allows external code (like a UI layer) to react to changes.

## 4. Data Structure (Tour JSON Schema)

The library is configured by a single JSON object. This structure is what the GUI editor will be responsible for generating.

### 4.1. Root Object

The main object that defines the tour.

| Property      | Type   | Required | Description                                                    |
| :------------ | :----- | :------- | :------------------------------------------------------------- |
| `settings`    | Object | No       | Global settings for the tour.                                  |
| `initialScene`| String | Yes      | The `id` of the scene to load first.                           |
| `scenes`      | Object | Yes      | An object containing all scenes, keyed by their unique `id`.     |

**Example:**
```json
{
  "settings": {
    "defaultHotspot": {
      "scale": "1 1 1",
      "icon": "path/to/default-icon.png"
    }
  },
  "initialScene": "living_room",
  "scenes": { ... }
}```

### 4.2. Scene Object

Defines a single 360° environment.

| Property    | Type    | Required | Description                                                    |
| :---------- | :------ | :------- | :------------------------------------------------------------- |
| `name`      | String  | No       | A user-friendly name for the scene (e.g., "Living Room").      |
| `panorama`  | String  | Yes      | The URL to the 360° image or video asset.                        |
| `hotspots`  | Array   | No       | An array of hotspot objects located within this scene.         |

**Example:**
```json
"living_room": {
  "name": "Living Room",
  "panorama": "assets/living_room.jpg",
  "hotspots": [ ... ]
}
```

### 4.3. Hotspot Object

Defines an interactive element within a scene.

| Property     | Type   | Required | Description                                                               |
| :----------- | :----- | :------- | :------------------------------------------------------------------------ |
| `id`         | String | No       | A unique identifier for the hotspot.                                      |
| `position`   | Object | Yes      | The 3D coordinates `{x, y, z}` for the hotspot's placement.               |
| `action`     | Object | Yes      | Defines what happens when the hotspot is activated.                       |
| `appearance` | Object | No       | Overrides default appearance settings.                                    |
| `tooltip`    | Object | No       | Defines a text label that appears on hover/gaze.                          |

### 4.3.1. Action Object
| Property | Type   | Required | Description                                   |
| :------- | :----- | :------- | :-------------------------------------------- |
| `type`   | String | Yes      | The type of action (e.g., `"navigateTo"`).    |
| `target` | String | Yes      | The target of the action (e.g., a scene `id`).|

### 4.3.2. Appearance Object
| Property | Type   | Required | Description                                      |
| :------- | :----- | :------- | :----------------------------------------------- |
| `icon`   | String | No       | URL to a custom image for the hotspot.           |
| `scale`  | String | No       | A-Frame scale attribute string (e.g., `"1.2 1.2 1.2"`). |
| `color`  | String | No       | A hex color code for the hotspot background/tint. |

### 4.3.3. Tooltip Object
| Property | Type   | Required | Description                                   |
| :------- | :----- | :------- | :-------------------------------------------- |
| `text`   | String | Yes      | The text to display in the tooltip.           |
| `position`| String | No      | Position relative to hotspot (e.g., `"top"`, `"bottom"`). |


**Full Hotspot Example:**
```json
{
  "id": "to_kitchen_hotspot",
  "position": { "x": 10, "y": 1.5, "z": -3 },
  "action": {
    "type": "navigateTo",
    "target": "kitchen"
  },
  "appearance": {
    "icon": "assets/icons/arrow.png",
    "scale": "0.8 0.8 0.8"
  },
  "tooltip": {
    "text": "Go to the Kitchen"
  }
}```

## 5. Library API (`SWT.Tour`)

The library will expose a single main class, `SWT.Tour`.

### 5.1. Constructor

**`new SWT.Tour(aframeSceneEl, tourConfig)`**

-   **`aframeSceneEl`**: The DOM element for the `<a-scene>`. The library will inject entities into this scene.
-   **`tourConfig`**: The Tour JSON object.

### 5.2. Public Methods

-   **`start()`**: Initializes the tour. It pre-loads necessary assets and loads the `initialScene` defined in the config. Returns a `Promise` that resolves when the first scene is visible.
-   **`navigateTo(sceneId)`**: Transitions the view to the specified scene. This involves fading out, changing the `<a-sky>` source, removing old hotspots, and adding new ones. Returns a `Promise` that resolves when the transition is complete.
-   **`getCurrentSceneId()`**: Returns the ID string of the currently active scene.
-   **`destroy()`**: Cleans up the A-Frame scene by removing all entities (sky, hotspots) created by the library. Also removes all event listeners.

### 5.3. Events

The `SWT.Tour` instance will be an event emitter.

-   **`tour-started`**: Fired when the `start()` method has completed and the initial scene is loaded.
    -   `event.detail`: `{ sceneId: 'initial_scene_id' }`
-   **`scene-loading`**: Fired just before a new scene begins to load.
    -   `event.detail`: `{ sceneId: 'target_scene_id' }`
-   **`scene-loaded`**: Fired after a scene and its assets (panorama, hotspots) have been fully loaded and are visible.
    -   `event.detail`: `{ sceneId: 'loaded_scene_id' }`
-   **`hotspot-activated`**: Fired when a user clicks or gazes on a hotspot.
    -   `event.detail`: `{ hotspotData: { ... }, sceneId: 'current_scene_id' }`

### 5.4. Example Usage

```html
<!DOCTYPE html>
<html>
<head>
    <script src="https://aframe.io/releases/1.4.0/aframe.min.js"></script>
    <script src="path/to/dist/senangwebs_tour.min.js"></script>
</head>
<body>
    <a-scene id="vr-scene">
        <!-- The SWT library will manage assets and entities -->
    </a-scene>

    <script>
        const myTourConfig = {
            // ... full JSON configuration ...
        };

        const sceneEl = document.querySelector('#vr-scene');
        const tour = new SWT.Tour(sceneEl, myTourConfig);

        tour.addEventListener('scene-loaded', (e) => {
            console.log(`Scene ${e.detail.sceneId} is now loaded!`);
        });

        tour.start().then(() => {
            console.log('Tour has started!');
        });
    </script>
</body>
</html>
```

## 6. A-Frame Implementation Details

-   **Scene Background:** The library will create or update a single `<a-sky>` entity and change its `src` attribute when navigating between scenes.
-   **Asset Management:** The library will dynamically add assets to A-Frame's `<a-assets>` system to ensure panoramas and icons are preloaded before a scene is displayed, minimizing pop-in.
-   **Hotspot Entity:** Each hotspot will be an `<a-image>` or `<a-plane>` entity parented under an `<a-entity>`. The hotspot entity will have a custom A-Frame component attached, `swt-hotspot-listener`, whose sole responsibility is to emit a DOM event on click/interaction that the main `SWT.Tour` class can listen for. This prevents the library from needing to manage event listeners on every single hotspot.

## 7. Proposed File Structure

```
senangwebs_tour/
├── dist/
│   ├── senangwebs_tour.js         # Development build
│   └── senangwebs_tour.min.js     # Production build
├── src/
│   ├── index.js                   # Main SWT.Tour class and public API
│   ├── SceneManager.js            # Class to handle <a-sky> and scene transitions
│   ├── HotspotManager.js          # Class to create, add, and remove hotspots
│   ├── AssetManager.js            # Utility to manage <a-assets>
│   └── components/
│       └── hotspot-listener.js    # The minimal A-Frame component for hotspots
└── package.json
```