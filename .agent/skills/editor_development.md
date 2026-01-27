---
name: Editor Development
description: Guide for modifying and extending the SenangWebs Tour Visual Editor.
---

# Editor Development

The Visual Editor is a standalone application that wraps the Viewer library. This guide explains how to work with the editor codebase.

## Directory Structure

All editor logic resides in `src/editor/`.

- `editor.js`: Main entry point class `TourEditor`.
- `js/`: UI templates and logic are NOT here (this folder seems to contain old/unused assets or example scripts). Logic is in the root of `src/editor/`.

## Key Components

### TourEditor (`src/editor/editor.js`)
This is the root class. It initializes:
- `SceneManagerEditor`
- `HotspotEditor`
- `PreviewController`
- `UIController`

**Extending initialization:**
If you need to add a new manager, instantiate it in the `TourEditor` constructor and pass the necessary references.

### UIController (`src/editor/ui-controller.js`)
This class handles all DOM manipulations for the editor interface.
- It finds elements using attributes like `data-swt-scene-list`.
- It renders HTML strings for scene lists and property panels.

**Adding a UI Helper:**
1. Add the markup in the `render*` methods.
2. Add event listeners in `setupEventListeners`. All DOM events for the UI are handled here.

### PreviewController (`src/editor/preview-controller.js`)
This controls the "Live Preview".
- It creates an `SWT.Tour` instance internally.
- It exposes methods like `setCameraRotation` or `addHotspot` which call the underlying A-Frame/SWT methods.

## Message Passing

The components communicate via a custom event emitter pattern or direct method calls orchestrated by the `TourEditor`.

**Example: Adding a Scene**
1. User clicks "Add Scene" in UI.
2. `UIController` captures click -> calls `editor.addScene()`.
3. `TourEditor` calls `sceneManager.addScene()`.
4. `SceneManager` emits `scene-added`.
5. `TourEditor` listens to `scene-added` -> calls `uiController.renderSceneList()` and `previewController.refresh()`.

## CSS / Styling
Styles are in `src/editor/css/`. The main file is typically imported in JS or included via a `<link>` tag in the HTML.
- `swt-editor.css`: Main stylesheet.

## Debugging
- The `editor` instance is often attached to `window.editor` in the examples (e.g., `examples/editor.html`).
- Use `editor.exportJSON()` in the console to inspect the current state of the tour configuration.
