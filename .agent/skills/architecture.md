---
name: Architecture Overview
description: Understand the architecture of SenangWebs Tour, including the Viewer and Editor components.
---

# Architecture Overview

SenangWebs Tour (SWT) is a modular virtual tour system built on top of [A-Frame](https://aframe.io/). It consists of two main parts: the **Viewer Library** (`SWT.Tour`) and the **Visual Editor**.

## Core Concepts

### 1. Data-Driven Design
SWT is purely data-driven. The entire tour state is defined by a JSON configuration object.
- **Scenes**: Defined in a dictionary or array.
- **Hotspots**: Nested within scenes.
- **State**: The viewer only maintains the `currentSceneId`.

### 2. A-Frame Dependency
SWT operates within an `<a-scene>`. It does not create the scene itself but attaches to an existing one. This allows developers to add other A-Frame components alongside the tour.

## Viewer Library (`SWT.Tour`)

The viewer is the lightweight runtime for displaying tours.

### Entry Point
- **File**: `src/index.js`
- **Class**: `Tour`
- **Usage**: `new SWT.Tour(sceneElement, config)`

### Managers
The `Tour` class coordinates several managers:
- **SceneManager**: Handles skybox changes (`<a-sky>`) and scene transitions.
- **HotspotManager**: Creates and manages hotspot entities.
- **AssetManager**: Preloads images to ensure smooth transitions.
- **IconRenderer**: Generates SVG icons for hotspots.

## Visual Editor

The editor is a separate bundle (`swt-editor.js`) that provides a UI for creating tours. It follows a "6-Controller" pattern.

### Architecture (The 6-Controller Pattern)
The editor orchestrates interaction between the UI, the Preview (Viewer), and the Data.

1. **TourEditor** (`src/editor/editor.js`)
   - The central hub. Initializes other controllers and routes events.

2. **SceneManagerEditor** (`src/editor/scene-manager.js`)
   - Manages the list of scenes. Adds, removes, updates scene data.

3. **HotspotEditor** (`src/editor/hotspot-editor.js`)
   - Handles hotspot creation, selection, and property editing.
   - Raycasting for hotspot placement.

4. **PreviewController** (`src/editor/preview-controller.js`)
   - Wraps an instance of `SWT.Tour` (the Viewer) to render the live preview.
   - Syncs editor state to the viewer.

5. **UIController** (`src/editor/ui-controller.js`)
   - Manages the DOM elements of the editor interface (panels, forms, buttons).
   - *Note: The editor UI is vanilla JS, no framework.*

6. **ProjectStorageManager** (`src/editor/storage-manager.js`)
   - Handles saving/loading to `localStorage`.

7. **ExportManager** (`src/editor/export-manager.js`)
   - Generates the JSON configuration or the standalone HTML file.

## Build System
- **Bundler**: Rollup
- **Formats**: IIFE (for browser `<script>` tags) and ES Modules.
- **Output**: `dist/swt.js` (Viewer) and `dist/swt-editor.js` (Editor).
