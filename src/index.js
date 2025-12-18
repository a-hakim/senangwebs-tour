/**
 * SenangWebs Tour (SWT) - Main Library Entry Point
 * Version 1.0.3
 */

import AFRAME from "aframe";
import "@bookklik/senangstart-icons/dist/senangstart-icon.min.js";
import "./components/hotspot-listener.js";
import { AssetManager } from "./AssetManager.js";
import { SceneManager } from "./SceneManager.js";
import { HotspotManager } from "./HotspotManager.js";
import { IconRenderer } from "./IconRenderer.js";

/**
 * Main Tour class - The public API for the SWT library
 */
class Tour {
  constructor(aframeSceneEl, tourConfig) {
    if (!aframeSceneEl) {
      throw new Error("SWT.Tour requires an A-Frame scene element");
    }

    if (!tourConfig || !tourConfig.scenes || !tourConfig.initialScene) {
      throw new Error(
        "SWT.Tour requires a valid tour configuration with scenes and initialScene"
      );
    }

    this.sceneEl = aframeSceneEl;
    this.config = tourConfig;
    this.isStarted = false;

    // Initialize managers
    this.assetManager = new AssetManager(this.sceneEl);
    this.sceneManager = new SceneManager(this.sceneEl, this.assetManager);
    this.iconRenderer = new IconRenderer();

    const defaultHotspotSettings = this.config.settings?.defaultHotspot || {};
    this.hotspotManager = new HotspotManager(
      this.sceneEl,
      this.assetManager,
      defaultHotspotSettings,
      this.iconRenderer
    );

    // Event listeners
    this.boundHandleHotspotClick = this.handleHotspotClick.bind(this);
    this.sceneEl.addEventListener(
      "swt-hotspot-clicked",
      this.boundHandleHotspotClick
    );

    // Ensure cursor exists for interaction
    this.ensureCursor();
  }

  /**
   * Ensure the scene has a cursor for interaction
   */
  ensureCursor() {
    const camera = this.sceneEl.querySelector("[camera]");
    if (camera) {
      let cursor = camera.querySelector("[cursor]");
      if (!cursor) {
        cursor = document.createElement("a-cursor");
        cursor.setAttribute("fuse", "true");
        cursor.setAttribute("fuse-timeout", "1500");
        camera.appendChild(cursor);
      }
    }
  }

  /**
   * Start the tour - Load the initial scene
   * @returns {Promise}
   */
  async start() {
    if (this.isStarted) {
      console.warn("Tour has already been started");
      return Promise.resolve();
    }

    const initialSceneId = this.config.initialScene;
    const initialSceneData = this.config.scenes[initialSceneId];

    if (!initialSceneData) {
      throw new Error(
        `Initial scene "${initialSceneId}" not found in tour configuration`
      );
    }

    try {
      // Emit scene-loading event
      this.emit("scene-loading", { sceneId: initialSceneId });

      // Load the scene
      await this.sceneManager.loadScene(initialSceneId, initialSceneData);

      // Create hotspots
      await this.hotspotManager.createHotspots(initialSceneData.hotspots || []);

      this.isStarted = true;

      // Set camera to starting position if set
      if (initialSceneData.startingPosition) {
        this.setCameraToStartingPosition(initialSceneData.startingPosition);
      }

      // Emit events
      this.emit("scene-loaded", { sceneId: initialSceneId });
      this.emit("tour-started", { sceneId: initialSceneId });

      return Promise.resolve();
    } catch (error) {
      console.error("Failed to start tour:", error);
      throw error;
    }
  }

  /**
   * Navigate to a specific scene
   * @param {string} sceneId - The ID of the scene to navigate to
   * @returns {Promise}
   */
  async navigateTo(sceneId) {
    const sceneData = this.config.scenes[sceneId];

    if (!sceneData) {
      throw new Error(`Scene "${sceneId}" not found in tour configuration`);
    }

    if (this.sceneManager.getCurrentSceneId() === sceneId) {
      console.warn(`Already at scene "${sceneId}"`);
      return Promise.resolve();
    }

    try {
      // Emit scene-loading event
      this.emit("scene-loading", { sceneId: sceneId });

      // Remove old hotspots
      this.hotspotManager.removeAllHotspots();

      // Transition to new scene with callback to set camera position while screen is black
      await this.sceneManager.transitionTo(sceneId, sceneData, () => {
        // Set camera to starting position during transition (while screen is still black)
        if (sceneData.startingPosition) {
          this.setCameraToStartingPosition(sceneData.startingPosition);
        }
      });

      // Create new hotspots
      await this.hotspotManager.createHotspots(sceneData.hotspots || []);

      // Emit scene-loaded event
      this.emit("scene-loaded", { sceneId: sceneId });

      return Promise.resolve();
    } catch (error) {
      console.error(`Failed to navigate to scene "${sceneId}":`, error);
      throw error;
    }
  }

  /**
   * Handle hotspot click events
   * @param {CustomEvent} evt - The hotspot click event
   */
  handleHotspotClick(evt) {
    const { hotspotData } = evt.detail;
    const currentSceneId = this.sceneManager.getCurrentSceneId();

    // Emit hotspot-activated event
    this.emit("hotspot-activated", {
      hotspotData: hotspotData,
      sceneId: currentSceneId,
    });

    // Handle the action
    if (hotspotData.action) {
      this.handleAction(hotspotData.action);
    }
  }

  /**
   * Handle a hotspot action
   * @param {Object} action - The action object
   */
  handleAction(action) {
    switch (action.type) {
      case "navigateTo":
        if (action.target) {
          this.navigateTo(action.target).catch((err) => {
            console.error("Navigation failed:", err);
          });
        }
        break;

      default:
        console.warn(`Unknown action type: ${action.type}`);
    }
  }

  /**
   * Set camera to a starting position immediately
   * Uses look-controls internal pitchObject/yawObject for proper A-Frame compatibility
   * @param {Object} startingPosition - Object with pitch and yaw in radians
   */
  setCameraToStartingPosition(startingPosition) {
    if (!startingPosition) return;

    const camera = this.sceneEl.querySelector("[camera]");
    if (!camera) return;

    // Get look-controls component
    const lookControls = camera.components?.["look-controls"];

    // Set rotation using look-controls internal objects (already in radians)
    const setRotation = () => {
      const cam = this.sceneEl.querySelector("[camera]");
      if (!cam) return;
      
      const lc = cam.components?.["look-controls"];
      if (lc && lc.pitchObject && lc.yawObject) {
        lc.pitchObject.rotation.x = startingPosition.pitch;
        lc.yawObject.rotation.y = startingPosition.yaw;
      } else if (cam.object3D) {
        cam.object3D.rotation.set(startingPosition.pitch, startingPosition.yaw, 0);
      }
    };

    // Set immediately and retry a few times to ensure it sticks
    setRotation();
    setTimeout(setRotation, 100);
    setTimeout(setRotation, 300);
    setTimeout(setRotation, 500);
  }

  /**
   * Get the current scene ID
   * @returns {string}
   */
  getCurrentSceneId() {
    return this.sceneManager.getCurrentSceneId();
  }

  /**
   * Emit a custom event
   * @param {string} eventName - The event name
   * @param {Object} detail - Event detail object
   */
  emit(eventName, detail = {}) {
    const event = new CustomEvent(eventName, {
      detail: detail,
      bubbles: true,
      cancelable: true,
    });
    this.sceneEl.dispatchEvent(event);
  }

  /**
   * Add an event listener
   * @param {string} eventName - The event name
   * @param {Function} handler - The event handler
   */
  addEventListener(eventName, handler) {
    this.sceneEl.addEventListener(eventName, handler);
  }

  /**
   * Remove an event listener
   * @param {string} eventName - The event name
   * @param {Function} handler - The event handler
   */
  removeEventListener(eventName, handler) {
    this.sceneEl.removeEventListener(eventName, handler);
  }

  /**
   * Destroy the tour and clean up resources
   */
  destroy() {
    // Remove event listeners
    this.sceneEl.removeEventListener(
      "swt-hotspot-clicked",
      this.boundHandleHotspotClick
    );

    // Clean up managers
    this.hotspotManager.destroy();
    this.sceneManager.destroy();
    this.assetManager.destroy();
    
    // Clean up icon renderer
    if (this.iconRenderer) {
      this.iconRenderer.destroy();
    }

    this.isStarted = false;
  }
}

// Export the Tour class as the main API
export { Tour };

// Also attach to window for UMD usage
if (typeof window !== "undefined") {
  window.SWT = window.SWT || {};
  window.SWT.Tour = Tour;
}
