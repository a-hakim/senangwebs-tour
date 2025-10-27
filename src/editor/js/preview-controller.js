// Preview Controller - Manages A-Frame preview integration using SWT library
import { showToast } from "./utils.js";

class PreviewController {
  constructor(editor) {
    this.editor = editor;
    this.tour = null;
    this.isInitialized = false;
    this.previewContainer = null;
    this.hasLoadedScene = false; // Track if we've ever loaded a scene
  }

  /**
   * Initialize A-Frame preview
   */
  async init() {
    this.previewContainer = document.getElementById("preview");
    if (!this.previewContainer) {
      console.error("Preview element not found");
      return false;
    }

    // Wait for A-Frame to be loaded
    if (typeof AFRAME === "undefined") {
      await this.waitForLibrary("AFRAME", 5000);
    }

    // Wait for SWT library to be loaded
    if (typeof SWT === "undefined") {
      await this.waitForLibrary("SWT", 5000);
    }
    this.isInitialized = true;
    return true;
  }

  /**
   * Wait for a global library to be available
   */
  async waitForLibrary(libraryName, timeout = 5000) {
    const startTime = Date.now();

    while (typeof window[libraryName] === "undefined") {
      if (Date.now() - startTime > timeout) {
        throw new Error(`Timeout waiting for ${libraryName} to load`);
      }
      await new Promise((resolve) => setTimeout(resolve, 100));
    }
  }

  /**
   * Load scene into preview using SWT library
   */
  async loadScene(scene, preserveCameraRotation = true) {
    if (!this.isInitialized || !scene) {
      return;
    }

    // Validate scene has required data
    if (!scene.imageUrl || !scene.id) {
      console.error("Invalid scene data:", scene);
      return;
    }

    // Show loading animation
    this.showLoading();

    // Save camera rotation before destroying scene
    let savedRotation = null;
    if (preserveCameraRotation && this.tour) {
      savedRotation = this.getCameraRotation();
    }

    // Destroy existing tour if any
    if (this.tour) {
      try {
        this.tour.destroy();
      } catch (error) {
        console.error("Error destroying tour:", error);
      }
      this.tour = null;
    }

    // Clear preview container carefully
    // Only do complex cleanup if we've actually loaded a scene before
    if (this.hasLoadedScene) {
      const existingScene = this.previewContainer.querySelector("a-scene");
      if (existingScene) {
        try {
          // Remove the scene element - A-Frame will handle cleanup if it's ready
          this.previewContainer.removeChild(existingScene);
        } catch (error) {
          console.error("Error removing scene:", error);
        }
      }
      
      // Clear any remaining children (loading overlays, empty state, etc)
      while (this.previewContainer.firstChild) {
        this.previewContainer.removeChild(this.previewContainer.firstChild);
      }
    } else {
      // First load - only remove non-A-Frame elements (like empty state divs)
      const children = Array.from(this.previewContainer.children);
      children.forEach(child => {
        // Only remove if it's NOT an a-scene (shouldn't be any, but be safe)
        if (child.tagName.toLowerCase() !== 'a-scene') {
          this.previewContainer.removeChild(child);
        }
      });
    }

    // Create loading overlay (will be removed after scene loads)
    const loadingOverlay = this.createLoadingOverlay();
    this.previewContainer.appendChild(loadingOverlay);

    // Create A-Frame scene
    const aframeScene = document.createElement("a-scene");
    aframeScene.id = "preview-scene";
    aframeScene.setAttribute("embedded", "");
    aframeScene.setAttribute("vr-mode-ui", "enabled: false;");
    this.previewContainer.appendChild(aframeScene);

    // Give A-Frame a moment to start initializing before we proceed
    await new Promise((resolve) => setTimeout(resolve, 100));

    // Build tour config for this single scene
    // Transform editor scene format to library format
    const transformedHotspots = (scene.hotspots || []).map((h) => ({
      id: h.id,
      position: h.position,
      action: {
        type: h.type === "navigation" ? "navigateTo" : h.type,
        target: h.targetSceneId,
      },
      appearance: {
        color: h.color || "#00ff00",
        icon: h.icon || null,
        scale: h.scale || "1 1 1",
      },
      tooltip: {
        text: h.title || "Hotspot",
      },
    }));

    const libraryScene = {
      id: scene.id,
      name: scene.name,
      panorama: scene.imageUrl, // Editor uses 'imageUrl', library expects 'panorama'
      hotspots: transformedHotspots,
    };

    // Build scenes object with ALL scenes (for navigation to work)
    const allScenes = {};
    const editorScenes = this.editor.sceneManager.scenes || [];
    editorScenes.forEach((s) => {
      const sceneHotspots = (s.hotspots || []).map((h) => ({
        id: h.id,
        position: h.position,
        action: {
          type: h.type === "navigation" ? "navigateTo" : h.type,
          target: h.targetSceneId,
        },
        appearance: {
          color: h.color || "#00ff00",
          icon: h.icon || null,
          scale: h.scale || "1 1 1",
        },
        tooltip: {
          text: h.title || "Hotspot",
        },
      }));

      allScenes[s.id] = {
        id: s.id,
        name: s.name,
        panorama: s.imageUrl,
        hotspots: sceneHotspots,
      };
    });

    const tourConfig = {
      title: scene.name,
      initialScene: scene.id,
      scenes: allScenes,
      settings: {
        autoRotate: false,
        showCompass: false,
      },
    };

    try {
      // Create new tour instance
      this.tour = new SWT.Tour(aframeScene, tourConfig);

      // Set up event listeners
      this.tour.addEventListener("tour-started", (e) => {});

      this.tour.addEventListener("scene-loaded", (e) => {});

      this.tour.addEventListener("hotspot-activated", (e) => {
        // Find the hotspot index by ID and select it
        const hotspotId = e.detail?.hotspotId;
        if (hotspotId) {
          const scene = this.editor.sceneManager.getCurrentScene();
          if (scene) {
            const hotspotIndex = scene.hotspots.findIndex(
              (h) => h.id === hotspotId
            );
            if (hotspotIndex >= 0) {
              this.editor.selectHotspot(hotspotIndex);
            }
          }
        }
      });

      // Start the tour
      await this.tour.start();

      // Mark that we've successfully loaded a scene
      this.hasLoadedScene = true;

      // Hide loading animation after scene loads
      this.hideLoading();

      // Restore camera rotation if preserved
      if (savedRotation && preserveCameraRotation) {
        this.setCameraRotation(savedRotation);
      }

      // Setup click handler after a short delay to ensure A-Frame is ready
      setTimeout(() => {
        this.setupClickHandler();
      }, 500);
    } catch (error) {
      console.error("Failed to load preview:", error);
      showToast("Failed to load preview: " + error.message, "error");
      // Hide loading on error
      this.hideLoading();
    }
  }

  /**
   * Setup click handler for hotspot placement
   */
  setupClickHandler() {
    if (!this.tour) {
      return;
    }

    const aframeScene = this.previewContainer.querySelector("a-scene");
    if (!aframeScene) {
      setTimeout(() => this.setupClickHandler(), 200); // Retry
      return;
    }

    // Remove any existing click handler to avoid duplicates
    if (this.clickHandler) {
      aframeScene.removeEventListener("click", this.clickHandler);
    }

    // Create and store the click handler
    this.clickHandler = (evt) => {
      if (!this.editor.hotspotEditor.placementMode) {
        return;
      }

      // Try to get intersection from event detail first
      let intersection = evt.detail?.intersection;

      // If no intersection, perform manual raycasting
      if (!intersection) {
        const camera = aframeScene.querySelector("[camera]");
        const sky = aframeScene.querySelector("a-sky");

        if (!camera || !sky) {
          showToast("Scene not ready, please try again", "warning");
          return;
        }

        // Get mouse position relative to canvas
        const canvas = aframeScene.canvas;
        const rect = canvas.getBoundingClientRect();
        const mouse = {
          x: ((evt.clientX - rect.left) / rect.width) * 2 - 1,
          y: -((evt.clientY - rect.top) / rect.height) * 2 + 1,
        };

        // Perform raycasting
        const raycaster = new THREE.Raycaster();
        const cameraEl = camera.object3D;
        raycaster.setFromCamera(mouse, cameraEl.children[0]); // Get the actual camera

        // Raycast against the sky sphere
        const intersects = raycaster.intersectObject(sky.object3D, true);

        if (intersects.length > 0) {
          intersection = intersects[0];
        } else {
          showToast("Click on the panorama image", "warning");
          return;
        }
      }

      const point = intersection.point;
      const position = {
        x: parseFloat(point.x.toFixed(2)),
        y: parseFloat(point.y.toFixed(2)),
        z: parseFloat(point.z.toFixed(2)),
      };
      this.editor.addHotspotAtPosition(position);
    };
    aframeScene.addEventListener("click", this.clickHandler);
  }

  /**
   * Get current camera rotation
   */
  getCameraRotation() {
    const aframeScene = this.previewContainer?.querySelector("a-scene");
    if (!aframeScene) {
      return null;
    }

    const camera = aframeScene.querySelector("[camera]");
    if (!camera) {
      return null;
    }

    // Get rotation from object3D which is more reliable
    const rotation = camera.object3D.rotation;
    const savedRotation = {
      x: rotation.x,
      y: rotation.y,
      z: rotation.z,
    };
    return savedRotation;
  }

  /**
   * Set camera rotation
   */
  setCameraRotation(rotation) {
    if (!rotation) {
      return;
    }

    const aframeScene = this.previewContainer?.querySelector("a-scene");
    if (!aframeScene) {
      return;
    }

    const camera = aframeScene.querySelector("[camera]");
    if (!camera) {
      return;
    }

    // Set rotation on object3D directly
    const setRotation = () => {
      if (camera.object3D) {
        camera.object3D.rotation.set(rotation.x, rotation.y, rotation.z);
      }
    };

    // Try immediately and also after a delay to ensure it sticks
    setRotation();
    setTimeout(setRotation, 100);
    setTimeout(setRotation, 300);
  }

  /**
   * Refresh preview (reload current scene while preserving camera rotation)
   */
  async refresh() {
    const scene = this.editor.sceneManager.getCurrentScene();
    if (scene) {
      // Save current camera rotation
      const savedRotation = this.getCameraRotation();
      // Reload scene
      await this.loadScene(scene);

      // Restore camera rotation
      if (savedRotation) {
        this.setCameraRotation(savedRotation);
      }
    }
  }

  /**
   * Reset camera
   */
  resetCamera() {
    const camera = this.previewContainer?.querySelector("[camera]");
    if (camera) {
      camera.setAttribute("rotation", "0 0 0");
    }
  }

  /**
   * Point camera to hotspot position
   */
  pointCameraToHotspot(hotspotPosition) {
    if (!hotspotPosition) {
      return;
    }

    const aframeScene = this.previewContainer?.querySelector("a-scene");
    if (!aframeScene) {
      return;
    }

    const camera = aframeScene.querySelector("[camera]");
    if (!camera || !camera.object3D) {
      return;
    }

    // Get camera position (usually at origin 0,0,0)
    const cameraPos = camera.object3D.position;

    // Calculate direction vector from camera to hotspot
    const direction = new THREE.Vector3(
      hotspotPosition.x - cameraPos.x,
      hotspotPosition.y - cameraPos.y,
      hotspotPosition.z - cameraPos.z
    );

    // Calculate spherical coordinates (yaw and pitch)
    const distance = direction.length();

    // Pitch (up/down rotation around X-axis) - in degrees
    const pitch = Math.asin(direction.y / distance) * (180 / Math.PI);

    // Yaw (left/right rotation around Y-axis) - in degrees
    // Using atan2 to get correct quadrant
    const yaw = Math.atan2(direction.x, direction.z) * (180 / Math.PI);

    // Apply smooth rotation with animation
    this.animateCameraRotation(camera, { x: pitch, y: yaw, z: 0 });
  }

  /**
   * Animate camera rotation smoothly
   */
  animateCameraRotation(camera, targetRotation, duration = 800) {
    if (!camera || !camera.object3D) return;

    const startRotation = {
      x: camera.object3D.rotation.x * (180 / Math.PI),
      y: camera.object3D.rotation.y * (180 / Math.PI),
      z: camera.object3D.rotation.z * (180 / Math.PI),
    };

    // Handle angle wrapping for smooth rotation
    let deltaY = targetRotation.y - startRotation.y;

    // Normalize to -180 to 180 range
    while (deltaY > 180) deltaY -= 360;
    while (deltaY < -180) deltaY += 360;

    const endRotationY = startRotation.y + deltaY;

    const startTime = Date.now();

    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);

      // Ease-in-out function for smooth animation
      const eased =
        progress < 0.5
          ? 2 * progress * progress
          : 1 - Math.pow(-2 * progress + 2, 2) / 2;

      // Interpolate rotation
      const currentRotation = {
        x: startRotation.x + (targetRotation.x - startRotation.x) * eased,
        y: startRotation.y + (endRotationY - startRotation.y) * eased,
        z: startRotation.z + (targetRotation.z - startRotation.z) * eased,
      };

      // Apply rotation (convert degrees to radians)
      camera.object3D.rotation.set(
        currentRotation.x * (Math.PI / 180),
        currentRotation.y * (Math.PI / 180),
        currentRotation.z * (Math.PI / 180)
      );

      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };

    animate();
  }

  /**
   * Highlight hotspot (not needed with library, but keep for compatibility)
   */
  highlightHotspot(index) {
    // The library handles hotspot visualization
    // This is kept for API compatibility
  }

  /**
   * Update hotspot marker (refresh scene while preserving camera rotation)
   */
  async updateHotspotMarker(index) {
    const scene = this.editor.sceneManager.getCurrentScene();
    if (!scene || !this.tour) return;

    const hotspot = scene.hotspots[index];
    if (!hotspot) return;

    // Refresh the preview to reflect changes, camera rotation will be preserved
    await this.refresh();
  }

  /**
   * Create loading overlay element
   */
  createLoadingOverlay() {
    const overlay = document.createElement("div");
    overlay.className = "preview-loading";
    overlay.innerHTML = `
            <div class="loading-spinner"></div>
            <div class="loading-text">Loading scene...</div>
        `;
    return overlay;
  }

  /**
   * Show loading animation
   */
  showLoading() {
    const existing = this.previewContainer?.querySelector(".preview-loading");
    if (existing) {
      existing.classList.remove("hidden");
    }
  }

  /**
   * Hide loading animation
   */
  hideLoading() {
    const loading = this.previewContainer?.querySelector(".preview-loading");
    if (loading) {
      loading.classList.add("hidden");
      // Remove after transition
      setTimeout(() => {
        if (loading.parentNode) {
          loading.parentNode.removeChild(loading);
        }
      }, 300);
    }
  }
}

export default PreviewController;
