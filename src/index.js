/**
 * SenangWebs Tour (SWT) - Main Library Entry Point
 * Version 1.0.0
 */

import AFRAME from "aframe";
import "@bookklik/senangstart-icons/dist/senangstart-icon.min.js";
import "./components/hotspot-listener.js";
import { AssetManager } from "./AssetManager.js";
import { SceneManager } from "./SceneManager.js";
import { HotspotManager } from "./HotspotManager.js";

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

    const defaultHotspotSettings = this.config.settings?.defaultHotspot || {};
    this.hotspotManager = new HotspotManager(
      this.sceneEl,
      this.assetManager,
      defaultHotspotSettings
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

      // Transition to new scene
      await this.sceneManager.transitionTo(sceneId, sceneData);

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
