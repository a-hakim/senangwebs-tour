(function () {
    'use strict';

    // Utility Functions

    /**
     * Generate a unique ID
     */
    function generateId(prefix = 'id') {
        return `${prefix}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    /**
     * Sanitize string for use as ID
     */
    function sanitizeId$1(str) {
        return str.toLowerCase()
            .replace(/[^a-z0-9]+/g, '_')
            .replace(/^_+|_+$/g, '');
    }

    /**
     * Generate thumbnail from image file
     */
    async function generateThumbnail(file, maxWidth = 200, maxHeight = 150) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            
            reader.onload = (e) => {
                const img = new Image();
                
                img.onload = () => {
                    const canvas = document.createElement('canvas');
                    const ctx = canvas.getContext('2d');
                    
                    let width = img.width;
                    let height = img.height;
                    
                    if (width > height) {
                        if (width > maxWidth) {
                            height *= maxWidth / width;
                            width = maxWidth;
                        }
                    } else {
                        if (height > maxHeight) {
                            width *= maxHeight / height;
                            height = maxHeight;
                        }
                    }
                    
                    canvas.width = width;
                    canvas.height = height;
                    ctx.drawImage(img, 0, 0, width, height);
                    
                    resolve(canvas.toDataURL('image/jpeg', 0.7));
                };
                
                img.onerror = reject;
                img.src = e.target.result;
            };
            
            reader.onerror = reject;
            reader.readAsDataURL(file);
        });
    }

    /**
     * Load image file as data URL
     */
    async function loadImageAsDataUrl(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => resolve(e.target.result);
            reader.onerror = reject;
            reader.readAsDataURL(file);
        });
    }

    /**
     * Show toast notification
     */
    function showToast$1(message, type = 'info', duration = 3000) {
        const toast = document.getElementById('toast');
        toast.textContent = message;
        toast.className = `toast ${type}`;
        toast.classList.add('show');
        
        setTimeout(() => {
            toast.classList.remove('show');
        }, duration);
    }

    /**
     * Show modal
     */
    function showModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.classList.add('show');
        }
    }

    /**
     * Hide modal
     */
    function hideModal$1(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.classList.remove('show');
        }
    }

    /**
     * Format file size
     */
    function formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
    }

    /**
     * Download text as file
     */
    function downloadTextAsFile(text, filename) {
        const blob = new Blob([text], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }

    /**
     * Copy text to clipboard
     */
    async function copyToClipboard(text) {
        try {
            await navigator.clipboard.writeText(text);
            return true;
        } catch (err) {
            // Fallback for older browsers
            const textarea = document.createElement('textarea');
            textarea.value = text;
            textarea.style.position = 'fixed';
            textarea.style.opacity = '0';
            document.body.appendChild(textarea);
            textarea.select();
            const success = document.execCommand('copy');
            document.body.removeChild(textarea);
            return success;
        }
    }

    /**
     * Debounce function
     */
    function debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }

    /**
     * Convert position object to string
     */
    function positionToString(pos) {
        return `${pos.x.toFixed(1)} ${pos.y.toFixed(1)} ${pos.z.toFixed(1)}`;
    }

    /**
     * Parse position string to object
     */
    function parsePosition(str) {
        const parts = str.split(' ').map(Number);
        return { x: parts[0] || 0, y: parts[1] || 0, z: parts[2] || 0 };
    }

    /**
     * Validate email
     */
    function isValidEmail(email) {
        const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return re.test(email);
    }

    /**
     * Deep clone object
     */
    function deepClone$1(obj) {
        return JSON.parse(JSON.stringify(obj));
    }

    var utils = /*#__PURE__*/Object.freeze({
        __proto__: null,
        copyToClipboard: copyToClipboard,
        debounce: debounce,
        deepClone: deepClone$1,
        downloadTextAsFile: downloadTextAsFile,
        formatFileSize: formatFileSize,
        generateId: generateId,
        generateThumbnail: generateThumbnail,
        hideModal: hideModal$1,
        isValidEmail: isValidEmail,
        loadImageAsDataUrl: loadImageAsDataUrl,
        parsePosition: parsePosition,
        positionToString: positionToString,
        sanitizeId: sanitizeId$1,
        showModal: showModal,
        showToast: showToast$1
    });

    // Storage Manager - Handles LocalStorage operations

    let ProjectStorageManager$1 = class ProjectStorageManager {
      constructor() {
        this.storageKey = "swt_project";
        this.autoSaveInterval = null;
        this.autoSaveDelay = 30000; // 30 seconds
      }

      /**
       * Save project to localStorage
       */
      saveProject(projectData) {
        try {
          const json = JSON.stringify(projectData);
          localStorage.setItem(this.storageKey, json);
          localStorage.setItem(
            this.storageKey + "_lastSaved",
            new Date().toISOString()
          );
          return true;
        } catch (error) {
          console.error("Failed to save project:", error);
          if (error.name === "QuotaExceededError") {
            showToast$1("Storage quota exceeded. Project too large!", "error");
          }
          return false;
        }
      }

      /**
       * Load project from localStorage
       */
      loadProject() {
        try {
          const json = localStorage.getItem(this.storageKey);
          if (json) {
            const projectData = JSON.parse(json);

            // Validate and migrate data if needed
            if (!this.validateProjectData(projectData)) {
              console.error("Invalid project data structure");
              return null;
            }

            return projectData;
          }
          return null;
        } catch (error) {
          console.error("Failed to load project:", error);
          showToast$1("Failed to load project", "error");
          return null;
        }
      }

      /**
       * Validate project data structure
       */
      validateProjectData(projectData) {
        if (!projectData || typeof projectData !== "object") {
          return false;
        }

        // Check if scenes array exists and is valid
        if (!projectData.scenes || !Array.isArray(projectData.scenes)) {
          return false;
        }

        // Validate each scene has required properties
        for (const scene of projectData.scenes) {
          if (!scene || typeof scene !== "object") {
            return false;
          }

          // Required scene properties
          if (!scene.id || typeof scene.id !== "string") {
            return false;
          }

          // imageUrl is required for scenes to be valid
          if (!scene.imageUrl || typeof scene.imageUrl !== "string") {
            return false;
          }

          // Hotspots array should exist (can be empty)
          if (!Array.isArray(scene.hotspots)) {
            scene.hotspots = []; // Auto-fix missing hotspots array
          }
        }

        // Ensure config exists
        if (!projectData.config || typeof projectData.config !== "object") {
          projectData.config = { title: "My Virtual Tour" };
        }

        return true;
      }

      /**
       * Clear project from localStorage
       */
      clearProject() {
        try {
          localStorage.removeItem(this.storageKey);
          localStorage.removeItem(this.storageKey + "_lastSaved");
          return true;
        } catch (error) {
          console.error("Failed to clear project:", error);
          return false;
        }
      }

      /**
       * Check if project exists in localStorage
       */
      hasProject() {
        return localStorage.getItem(this.storageKey) !== null;
      }

      /**
       * Get last saved date
       */
      getLastSavedDate() {
        const dateStr = localStorage.getItem(this.storageKey + "_lastSaved");
        return dateStr ? new Date(dateStr) : null;
      }

      /**
       * Start auto-save
       */
      startAutoSave(callback) {
        this.stopAutoSave();
        this.autoSaveInterval = setInterval(() => {
          callback();
        }, this.autoSaveDelay);
      }

      /**
       * Stop auto-save
       */
      stopAutoSave() {
        if (this.autoSaveInterval) {
          clearInterval(this.autoSaveInterval);
          this.autoSaveInterval = null;
        }
      }

      /**
       * Export project to file
       */
      exportToFile(projectData, filename = "tour.json") {
        try {
          const json = JSON.stringify(projectData, null, 2);
          downloadTextAsFile(json, filename);
          return true;
        } catch (error) {
          console.error("Failed to export project:", error);
          showToast$1("Failed to export project", "error");
          return false;
        }
      }

      /**
       * Import project from file
       */
      async importFromFile(file) {
        return new Promise((resolve, reject) => {
          const reader = new FileReader();

          reader.onload = (e) => {
            try {
              const projectData = JSON.parse(e.target.result);
              resolve(projectData);
            } catch (error) {
              console.error("Failed to parse project file:", error);
              showToast$1("Invalid project file", "error");
              reject(error);
            }
          };

          reader.onerror = () => {
            console.error("Failed to read file:", reader.error);
            showToast$1("Failed to read file", "error");
            reject(reader.error);
          };

          reader.readAsText(file);
        });
      }
    };

    // Scene Manager - Handles scene operations

    let SceneManagerEditor$1 = class SceneManagerEditor {
      constructor(editor) {
        this.editor = editor;
        this.scenes = [];
        this.currentSceneIndex = -1;
      }

      /**
       * Add new scene
       */
      async addScene(file) {
        try {
          // Generate thumbnail
          const thumbnail = await generateThumbnail(file);

          // Load full image
          const imageDataUrl = await loadImageAsDataUrl(file);

          const scene = {
            id: sanitizeId$1(file.name.replace(/\.[^/.]+$/, "")),
            name: file.name.replace(/\.[^/.]+$/, ""),
            imageUrl: imageDataUrl,
            thumbnail: thumbnail,
            hotspots: [],
          };

          this.scenes.push(scene);
          this.currentSceneIndex = this.scenes.length - 1;
          showToast$1(`Scene "${scene.name}" added successfully`, "success");
          return scene;
        } catch (error) {
          console.error("Failed to add scene:", error);
          showToast$1("Failed to add scene", "error");
          return null;
        }
      }

      /**
       * Remove scene by index
       */
      removeScene(index) {
        if (index >= 0 && index < this.scenes.length) {
          const scene = this.scenes[index];

          // Confirm deletion
          if (!confirm(`Are you sure you want to delete scene "${scene.name}"?`)) {
            return false;
          }

          this.scenes.splice(index, 1);

          // Update current scene index
          if (this.currentSceneIndex === index) {
            this.currentSceneIndex = Math.min(
              this.currentSceneIndex,
              this.scenes.length - 1
            );
          } else if (this.currentSceneIndex > index) {
            this.currentSceneIndex--;
          }

          showToast$1(`Scene "${scene.name}" removed`, "success");
          return true;
        }
        return false;
      }

      /**
       * Get scene by index
       */
      getScene(index) {
        return this.scenes[index] || null;
      }

      /**
       * Get scene by ID
       */
      getSceneById(id) {
        return this.scenes.find((s) => s.id === id) || null;
      }

      /**
       * Update scene property
       */
      updateScene(index, property, value) {
        if (index >= 0 && index < this.scenes.length) {
          this.scenes[index][property] = value;

          // If updating ID, update all hotspot target references
          if (property === "id") {
            this.scenes.forEach((scene) => {
              scene.hotspots.forEach((hotspot) => {
                if (hotspot.targetSceneId === this.scenes[index].id) {
                  hotspot.targetSceneId = value;
                }
              });
            });
          }

          return true;
        }
        return false;
      }

      /**
       * Reorder scenes
       */
      reorderScenes(fromIndex, toIndex) {
        if (
          fromIndex >= 0 &&
          fromIndex < this.scenes.length &&
          toIndex >= 0 &&
          toIndex < this.scenes.length
        ) {
          const scene = this.scenes.splice(fromIndex, 1)[0];
          this.scenes.splice(toIndex, 0, scene);

          // Update current scene index
          if (this.currentSceneIndex === fromIndex) {
            this.currentSceneIndex = toIndex;
          } else if (
            fromIndex < this.currentSceneIndex &&
            toIndex >= this.currentSceneIndex
          ) {
            this.currentSceneIndex--;
          } else if (
            fromIndex > this.currentSceneIndex &&
            toIndex <= this.currentSceneIndex
          ) {
            this.currentSceneIndex++;
          }

          return true;
        }
        return false;
      }

      /**
       * Get current scene
       */
      getCurrentScene() {
        return this.getScene(this.currentSceneIndex);
      }

      /**
       * Set current scene by index
       */
      setCurrentScene(index) {
        if (index >= 0 && index < this.scenes.length) {
          this.currentSceneIndex = index;
          return true;
        }
        return false;
      }

      /**
       * Get all scenes
       */
      getAllScenes() {
        return this.scenes;
      }

      /**
       * Get all scenes (alias for getAllScenes)
       */
      getScenes() {
        return this.scenes;
      }

      /**
       * Clear all scenes
       */
      clearScenes() {
        if (this.scenes.length > 0) {
          if (!confirm("Are you sure you want to clear all scenes?")) {
            return false;
          }
        }

        this.scenes = [];
        this.currentSceneIndex = -1;
        return true;
      }

      /**
       * Load scenes from data
       */
      loadScenes(scenesData) {
        this.scenes = scenesData || [];
        this.currentSceneIndex = this.scenes.length > 0 ? 0 : -1;
      }
    };

    // Hotspot Editor - Handles hotspot placement and editing

    let HotspotEditor$1 = class HotspotEditor {
        constructor(editor) {
            this.editor = editor;
            this.currentHotspotIndex = -1;
        }

        /**
         * Add hotspot at position
         * @param {Object} position - The 3D position {x, y, z}
         * @param {string} targetSceneId - Target scene ID for navigation
         * @param {Object} cameraOrientation - Camera orientation at creation {pitch, yaw} in radians
         */
        addHotspot(position, targetSceneId = '', cameraOrientation = null) {
            const scene = this.editor.sceneManager.getCurrentScene();
            if (!scene) {
                showToast$1('No scene selected', 'error');
                return null;
            }

            const hotspot = {
                id: generateId('hotspot'),
                type: 'navigation',
                position: position,
                cameraOrientation: cameraOrientation, // Store camera pitch/yaw for reliable pointing
                targetSceneId: targetSceneId,
                title: 'New Hotspot',
                description: '',
                color: '#00ff00',
                icon: '',
                scale: '1 1 1'
            };

            scene.hotspots.push(hotspot);
            this.currentHotspotIndex = scene.hotspots.length - 1;
            
            showToast$1('Hotspot added', 'success');
            
            return hotspot;
        }

        /**
         * Remove hotspot
         */
        removeHotspot(index) {
            const scene = this.editor.sceneManager.getCurrentScene();
            if (!scene || index < 0 || index >= scene.hotspots.length) {
                return false;
            }

            if (!confirm('Are you sure you want to delete this hotspot?')) {
                return false;
            }

            scene.hotspots.splice(index, 1);
            
            // Update current index
            if (this.currentHotspotIndex === index) {
                this.currentHotspotIndex = -1;
            } else if (this.currentHotspotIndex > index) {
                this.currentHotspotIndex--;
            }

            showToast$1('Hotspot removed', 'success');
            return true;
        }

        /**
         * Update hotspot property
         */
        updateHotspot(index, property, value) {
            const scene = this.editor.sceneManager.getCurrentScene();
            if (!scene || index < 0 || index >= scene.hotspots.length) {
                return false;
            }

            scene.hotspots[index][property] = value;
            return true;
        }

        /**
         * Get hotspot by index
         */
        getHotspot(index) {
            const scene = this.editor.sceneManager.getCurrentScene();
            if (!scene || index < 0 || index >= scene.hotspots.length) {
                return null;
            }
            return scene.hotspots[index];
        }

        /**
         * Update hotspot position
         */
        updateHotspotPosition(index, position) {
            return this.updateHotspot(index, 'position', position);
        }

        /**
         * Get current hotspot
         */
        getCurrentHotspot() {
            const scene = this.editor.sceneManager.getCurrentScene();
            if (!scene || this.currentHotspotIndex < 0) {
                return null;
            }
            return scene.hotspots[this.currentHotspotIndex] || null;
        }

        /**
         * Set current hotspot
         */
        setCurrentHotspot(index) {
            const scene = this.editor.sceneManager.getCurrentScene();
            if (!scene || index < 0 || index >= scene.hotspots.length) {
                this.currentHotspotIndex = -1;
                return false;
            }
            
            this.currentHotspotIndex = index;
            return true;
        }

        /**
         * Get all hotspots for current scene
         */
        getAllHotspots() {
            const scene = this.editor.sceneManager.getCurrentScene();
            return scene ? scene.hotspots : [];
        }

        /**
         * Duplicate hotspot
         */
        duplicateHotspot(index) {
            const scene = this.editor.sceneManager.getCurrentScene();
            if (!scene || index < 0 || index >= scene.hotspots.length) {
                return null;
            }

            const original = scene.hotspots[index];
            const duplicate = deepClone(original);
            duplicate.id = generateId('hotspot');
            duplicate.title = original.title + ' (Copy)';
            
            // Offset position slightly
            duplicate.position = {
                x: original.position.x + 0.5,
                y: original.position.y,
                z: original.position.z
            };
            
            // Clear camera orientation since position changed - will fallback to position-based calculation
            duplicate.cameraOrientation = null;

            scene.hotspots.push(duplicate);
            this.currentHotspotIndex = scene.hotspots.length - 1;
            
            showToast$1('Hotspot duplicated', 'success');
            return duplicate;
        }

        /**
         * Clear all hotspots
         */
        clearAllHotspots() {
            const scene = this.editor.sceneManager.getCurrentScene();
            if (!scene) {
                return false;
            }

            if (scene.hotspots.length === 0) {
                return true;
            }

            if (!confirm('Are you sure you want to remove all hotspots from this scene?')) {
                return false;
            }

            scene.hotspots = [];
            this.currentHotspotIndex = -1;
            
            showToast$1('All hotspots removed', 'success');
            return true;
        }
    };

    // Preview Controller - Manages A-Frame preview integration using SWT library

    let PreviewController$1 = class PreviewController {
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
          children.forEach((child) => {
            // Only remove if it's NOT an a-scene (shouldn't be any, but be safe)
            if (child.tagName.toLowerCase() !== "a-scene") {
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
        (scene.hotspots || []).map((h) => ({
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

        ({
          id: scene.id,
          name: scene.name,
          panorama: scene.imageUrl});

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
            startingPosition: s.startingPosition || null,
          };
        });

        const tourConfig = {
          title: scene.name,
          initialScene: scene.id,
          scenes: allScenes,
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

          // Handle camera rotation after scene loads
          if (savedRotation && preserveCameraRotation) {
            // Restore previous camera rotation
            this.setCameraRotation(savedRotation);
          } else if (scene.startingPosition) {
            // Set camera to scene's starting position immediately
            this.setCameraRotation({
              x: scene.startingPosition.pitch,
              y: scene.startingPosition.yaw,
              z: 0
            });
          }
        } catch (error) {
          console.error("Failed to load preview:", error);
          showToast$1("Failed to load preview: " + error.message, "error");
          // Hide loading on error
          this.hideLoading();
        }
      }

      /**
       * Get the current cursor intersection point with the sky sphere.
       * Raycasts from the camera center (where the A-Cursor points) to find the intersection.
       * @returns {Object|null} The 3D position {x, y, z} or null if no intersection
       */
      getCursorIntersection() {
        const aframeScene = this.previewContainer?.querySelector("a-scene");
        if (!aframeScene) {
          return null;
        }

        const camera = aframeScene.querySelector("[camera]");
        const sky = aframeScene.querySelector("a-sky");

        if (!camera || !sky) {
          return null;
        }

        // Get pitch and yaw from look-controls (the authoritative source in A-Frame)
        const lookControls = camera.components?.["look-controls"];
        let pitch = 0;
        let yaw = 0;

        if (lookControls && lookControls.pitchObject && lookControls.yawObject) {
          pitch = lookControls.pitchObject.rotation.x;
          yaw = lookControls.yawObject.rotation.y;
        } else {
          // Fallback to object3D rotation
          pitch = camera.object3D.rotation.x;
          yaw = camera.object3D.rotation.y;
        }

        // Calculate direction vector from pitch/yaw
        // In A-Frame/Three.js coordinate system:
        // - Looking forward is -Z
        // - Yaw rotates around Y axis
        // - Pitch rotates around X axis
        const direction = new THREE.Vector3();
        direction.x = -Math.sin(yaw) * Math.cos(pitch);
        direction.y = Math.sin(pitch);
        direction.z = -Math.cos(yaw) * Math.cos(pitch);
        direction.normalize();

        // Create raycaster from camera position in the direction we're looking
        const raycaster = new THREE.Raycaster();
        const origin = new THREE.Vector3(0, 0, 0); // Camera is typically at origin in 360 viewer
        raycaster.set(origin, direction);

        // Raycast against the sky sphere
        const intersects = raycaster.intersectObject(sky.object3D, true);

        if (intersects.length > 0) {
          const point = intersects[0].point;
          
          // Calculate an upward offset to center the hotspot visual on the cursor
          // The offset is applied along the "up" direction relative to the sphere surface
          // For a sphere, we shift the point slightly in the Y direction (vertical up in world space)
          // The offset compensates for the hotspot visual being centered, so the top aligns with cursor
          const offsetAmount = 200; // Adjust this value to fine-tune alignment
          
          return {
            x: parseFloat(point.x.toFixed(2)),
            y: parseFloat((point.y + offsetAmount).toFixed(2)),
            z: parseFloat(point.z.toFixed(2)),
          };
        }

        return null;
      }

      /**
       * Get current camera rotation
       * Works with A-Frame's look-controls component by reading its internal state
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

        // Try to get rotation from look-controls internal state (more reliable)
        const lookControls = camera.components?.["look-controls"];
        if (lookControls && lookControls.pitchObject && lookControls.yawObject) {
          const savedRotation = {
            x: lookControls.pitchObject.rotation.x,
            y: lookControls.yawObject.rotation.y,
            z: 0,
          };
          return savedRotation;
        }

        // Fallback to object3D rotation
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
       * Works with A-Frame's look-controls component by setting its internal state
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

        // Set rotation via look-controls internal pitchObject/yawObject
        // This is required because look-controls overrides object3D.rotation on each tick
        const setRotation = () => {
          const cam = this.previewContainer?.querySelector("[camera]");
          if (!cam) return;

          const lookControls = cam.components?.["look-controls"];
          if (lookControls && lookControls.pitchObject && lookControls.yawObject) {
            // Set pitch (x rotation) on pitchObject
            lookControls.pitchObject.rotation.x = rotation.x;
            // Set yaw (y rotation) on yawObject
            lookControls.yawObject.rotation.y = rotation.y;
          } else if (cam.object3D) {
            // Fallback to direct object3D if look-controls not ready
            cam.object3D.rotation.set(rotation.x, rotation.y, rotation.z);
          }
        };

        // Try immediately and also after delays to ensure it sticks
        // A-Frame look-controls may not be fully initialized immediately
        setRotation();
        setTimeout(setRotation, 100);
        setTimeout(setRotation, 300);
        setTimeout(setRotation, 500);
      }

      /**
       * Refresh preview (reload current scene while preserving camera rotation)
       */
      async refresh() {
        const scene = this.editor.sceneManager.getCurrentScene();
        if (scene) {
          // loadScene with preserveCameraRotation=true handles save/restore internally
          await this.loadScene(scene, true);
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
       * Point camera to hotspot
       * Uses stored camera orientation if available, otherwise calculates from position
       * @param {Object} hotspot - The hotspot object with position and optional cameraOrientation
       */
      pointCameraToHotspot(hotspot) {
        if (!hotspot) {
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

        let pitch, yaw;

        // Use stored camera orientation if available (more reliable)
        if (hotspot.cameraOrientation) {
          // Stored values are in radians, convert to degrees for animateCameraRotation
          pitch = hotspot.cameraOrientation.pitch * (180 / Math.PI);
          yaw = hotspot.cameraOrientation.yaw * (180 / Math.PI);
        } else if (hotspot.position) {
          // Fallback: calculate from position (for legacy hotspots without cameraOrientation)
          const hotspotPosition = hotspot.position;
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
          pitch = Math.asin(direction.y / distance) * (180 / Math.PI);

          // Yaw (left/right rotation around Y-axis) - in degrees
          yaw = Math.atan2(direction.x, direction.z) * (180 / Math.PI);
        } else {
          return;
        }

        // Apply smooth rotation with animation
        this.animateCameraRotation(camera, { x: pitch, y: yaw, z: 0 });
      }

      /**
       * Animate camera rotation smoothly
       * Uses look-controls internal pitchObject/yawObject to avoid being overwritten
       */
      animateCameraRotation(camera, targetRotation, duration = 800) {
        if (!camera || !camera.object3D) return;

        // Get look-controls component
        const lookControls = camera.components?.["look-controls"];
        
        // Get current rotation - prefer look-controls internal state
        let startRotation;
        if (lookControls && lookControls.pitchObject && lookControls.yawObject) {
          startRotation = {
            x: lookControls.pitchObject.rotation.x * (180 / Math.PI),
            y: lookControls.yawObject.rotation.y * (180 / Math.PI),
            z: 0,
          };
        } else {
          startRotation = {
            x: camera.object3D.rotation.x * (180 / Math.PI),
            y: camera.object3D.rotation.y * (180 / Math.PI),
            z: 0,
          };
        }

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

          // Interpolate rotation (in degrees)
          const currentX = startRotation.x + (targetRotation.x - startRotation.x) * eased;
          const currentY = startRotation.y + (endRotationY - startRotation.y) * eased;

          // Apply rotation using look-controls internal objects (in radians)
          if (lookControls && lookControls.pitchObject && lookControls.yawObject) {
            lookControls.pitchObject.rotation.x = currentX * (Math.PI / 180);
            lookControls.yawObject.rotation.y = currentY * (Math.PI / 180);
          } else {
            // Fallback to direct rotation
            camera.object3D.rotation.set(
              currentX * (Math.PI / 180),
              currentY * (Math.PI / 180),
              0
            );
          }

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
    };

    var iconsData = [
    	{
    		name: "Bars 3",
    		slug: "bars-3",
    		src: "M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5",
    		tags: [
    			"menu",
    			"hamburger",
    			"navigation",
    			"bars-3"
    		]
    	},
    	{
    		name: "X Mark",
    		slug: "x-mark",
    		src: "M6 18L18 6M6 6l12 12",
    		tags: [
    			"close",
    			"delete",
    			"remove",
    			"cancel",
    			"x-mark"
    		]
    	},
    	{
    		name: "Check",
    		slug: "check",
    		src: "M4.5 12.75l6 6 9-13.5",
    		tags: [
    			"tick",
    			"success",
    			"confirm",
    			"done",
    			"check"
    		]
    	},
    	{
    		name: "Double Tick",
    		slug: "double-tick",
    		src: "M4.5 12.75l6 6 9-13.5m-12.5 3.75 3 3 4.6-6.8",
    		tags: [
    			"check",
    			"done",
    			"success",
    			"double-tick"
    		]
    	},
    	{
    		name: "Plus",
    		slug: "plus",
    		src: "M12 4.5v15m7.5-7.5h-15",
    		tags: [
    			"add",
    			"create",
    			"new",
    			"plus"
    		]
    	},
    	{
    		name: "Minus",
    		slug: "minus",
    		src: "M5 12h14",
    		tags: [
    			"subtract",
    			"delete",
    			"remove",
    			"minus"
    		]
    	},
    	{
    		name: "Magnifying Glass",
    		slug: "magnifying-glass",
    		src: "M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z",
    		tags: [
    			"search",
    			"find",
    			"zoom",
    			"magnifying-glass",
    			"senangwebs",
    			"sw-index"
    		]
    	},
    	{
    		name: "Magnifying Glass Focus",
    		slug: "magnifying-glass-focus",
    		src: "M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607zM10 7.5 7.5 7.5V10M13.5 11 13.5 13.5H11",
    		tags: [
    			"search",
    			"find",
    			"zoom fit",
    			"magnifying-glass-focus"
    		]
    	},
    	{
    		name: "Magnifying Glass Plus",
    		slug: "magnifying-glass-plus",
    		src: "M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607zM10.5 7.4v6m3-2.9h-6",
    		tags: [
    			"search",
    			"find",
    			"zoom in",
    			"magnifying-glass-plus",
    			"plus"
    		]
    	},
    	{
    		name: "Magnifying Glass Minus",
    		slug: "magnifying-glass-minus",
    		src: "M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607zM13.5 10.5H7.5",
    		tags: [
    			"search",
    			"find",
    			"zoom out",
    			"magnifying-glass-minus",
    			"minus"
    		]
    	},
    	{
    		name: "Home",
    		slug: "home",
    		src: "M2.25 12l8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25",
    		tags: [
    			"house",
    			"dashboard",
    			"main",
    			"home"
    		]
    	},
    	{
    		name: "Cog 6 Tooth",
    		slug: "cog-6-tooth",
    		src: "M9.90 5.32 L9.14 2.94 A9.5 9.5 0 0 1 14.86 2.94 L14.10 5.32 A7 7 0 0 1 16.73 6.84 L18.42 5.00 A9.5 9.5 0 0 1 21.27 9.94 L18.83 10.48 A7 7 0 0 1 18.83 13.52 L21.27 14.06 A9.5 9.5 0 0 1 18.42 19.00 L16.73 17.16 A7 7 0 0 1 14.10 18.68 L14.86 21.06 A9.5 9.5 0 0 1 9.14 21.06 L9.90 18.68 A7 7 0 0 1 7.27 17.16 L5.58 19.00 A9.5 9.5 0 0 1 2.73 14.06 L5.17 13.52 A7 7 0 0 1 5.17 10.48 L2.73 9.94 A9.5 9.5 0 0 1 5.58 5.00 L7.27 6.84 A7 7 0 0 1 9.90 5.32 Z M14.5 12 A2.5 2.5 0 1 0 9.5 12 A2.5 2.5 0 1 0 14.5 12 Z",
    		tags: [
    			"settings",
    			"gear",
    			"options",
    			"config",
    			"cog-6-tooth"
    		]
    	},
    	{
    		name: "Trash",
    		slug: "trash",
    		src: "M18.2 18 14 18m5.228-12.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0M5.8 18 14 18",
    		tags: [
    			"delete",
    			"remove",
    			"bin",
    			"garbage",
    			"trash"
    		]
    	},
    	{
    		name: "Arrow Left",
    		slug: "arrow-left",
    		src: "M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18",
    		tags: [
    			"back",
    			"previous",
    			"direction",
    			"arrow-left"
    		]
    	},
    	{
    		name: "Arrow Right",
    		slug: "arrow-right",
    		src: "M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3",
    		tags: [
    			"forward",
    			"next",
    			"direction",
    			"arrow-right"
    		]
    	},
    	{
    		name: "Arrow Up",
    		slug: "arrow-up",
    		src: "M4.5 10.5L12 3m0 0l7.5 7.5M12 3v18",
    		tags: [
    			"top",
    			"direction",
    			"arrow-up"
    		]
    	},
    	{
    		name: "Arrow Down",
    		slug: "arrow-down",
    		src: "M19.5 13.5L12 21m0 0l-7.5-7.5M12 21V3",
    		tags: [
    			"bottom",
    			"direction",
    			"arrow-down"
    		]
    	},
    	{
    		name: "Arrow Long Left",
    		slug: "arrow-long-left",
    		src: "M6.75 15.75L3 12m0 0l3.75-3.75M3 12h18",
    		tags: [
    			"back",
    			"previous",
    			"direction",
    			"arrow-long-left"
    		]
    	},
    	{
    		name: "Arrow Long Right",
    		slug: "arrow-long-right",
    		src: "M17.25 8.25L21 12m0 0l-3.75 3.75M21 12H3",
    		tags: [
    			"forward",
    			"next",
    			"direction",
    			"arrow-long-right"
    		]
    	},
    	{
    		name: "Arrow Long Up",
    		slug: "arrow-long-up",
    		src: "M8.25 6.75L12 3m0 0l3.75 3.75M12 3v18",
    		tags: [
    			"top",
    			"direction",
    			"arrow-long-up"
    		]
    	},
    	{
    		name: "Arrow Long Down",
    		slug: "arrow-long-down",
    		src: "M15.75 17.25L12 21m0 0l-3.75-3.75M12 21V3",
    		tags: [
    			"bottom",
    			"direction",
    			"arrow-long-down"
    		]
    	},
    	{
    		name: "Arrow Path",
    		slug: "arrow-path",
    		src: "M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99",
    		tags: [
    			"refresh",
    			"reload",
    			"cycle",
    			"loop",
    			"arrow-path",
    			"senangwebs",
    			"sw-loading"
    		]
    	},
    	{
    		name: "Arrow Rotate Cw",
    		slug: "arrow-rotate-cw",
    		src: "M20.25 12a8.25 8.25 0 11-8.25-8.25c2.3 0 4.5 1 6 2.5L20.25 8.5m0-4.5v4.5h-4.5",
    		tags: [
    			"rotate",
    			"refresh",
    			"reload",
    			"arrow-rotate-cw"
    		]
    	},
    	{
    		name: "Arrow Rotate Ccw",
    		slug: "arrow-rotate-ccw",
    		src: "M3.75 12a8.25 8.25 0 108.25-8.25c-2.3 0-4.5 1-6 2.5L3.75 8.5m0-4.5v4.5h4.5",
    		tags: [
    			"rotate",
    			"undo",
    			"arrow-rotate-ccw"
    		]
    	},
    	{
    		name: "Arrow Top Right On Square",
    		slug: "arrow-top-right-on-square",
    		src: "M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25",
    		tags: [
    			"external",
    			"link",
    			"open",
    			"arrow-top-right-on-square"
    		]
    	},
    	{
    		name: "Arrow Right On Rectangle",
    		slug: "arrow-right-on-rectangle",
    		src: "M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15M12 9l-3 3m0 0l3 3m-3-3h12.75",
    		tags: [
    			"logout",
    			"exit",
    			"signout",
    			"arrow-right-on-rectangle"
    		]
    	},
    	{
    		name: "Arrow Left On Rectangle",
    		slug: "arrow-left-on-rectangle",
    		src: "M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15m3 0l3-3m0 0l-3-3m3 3H9",
    		tags: [
    			"login",
    			"enter",
    			"signin",
    			"arrow-left-on-rectangle"
    		]
    	},
    	{
    		name: "Chevron Left",
    		slug: "chevron-left",
    		src: "M15.75 19.5L8.25 12l7.5-7.5",
    		tags: [
    			"back",
    			"previous",
    			"chevron-left"
    		]
    	},
    	{
    		name: "Chevron Right",
    		slug: "chevron-right",
    		src: "M8.25 4.5l7.5 7.5-7.5 7.5",
    		tags: [
    			"forward",
    			"next",
    			"chevron-right"
    		]
    	},
    	{
    		name: "Chevron Up",
    		slug: "chevron-up",
    		src: "M19.5 15.75l-7.5-7.5-7.5 7.5",
    		tags: [
    			"top",
    			"collapse",
    			"chevron-up"
    		]
    	},
    	{
    		name: "Chevron Down",
    		slug: "chevron-down",
    		src: "M4.5 8.25l7.5 7.5 7.5-7.5",
    		tags: [
    			"bottom",
    			"expand",
    			"chevron-down"
    		]
    	},
    	{
    		name: "Chevron Double Left",
    		slug: "chevron-double-left",
    		src: "M18.75 19.5l-7.5-7.5 7.5-7.5m-6 15L5.25 12l7.5-7.5",
    		tags: [
    			"back",
    			"previous",
    			"fast",
    			"chevron-double-left"
    		]
    	},
    	{
    		name: "Chevron Double Right",
    		slug: "chevron-double-right",
    		src: "M11.25 4.5l7.5 7.5-7.5 7.5m-6-15l7.5 7.5-7.5 7.5",
    		tags: [
    			"forward",
    			"next",
    			"fast",
    			"chevron-double-right"
    		]
    	},
    	{
    		name: "Envelope",
    		slug: "envelope",
    		src: "M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75",
    		tags: [
    			"mail",
    			"email",
    			"message",
    			"contact",
    			"envelope"
    		]
    	},
    	{
    		name: "Envelope Open",
    		slug: "envelope-open",
    		src: "M21.75 9v.906a2.25 2.25 0 01-1.183 1.981l-6.478 3.488M2.25 9v.906a2.25 2.25 0 001.183 1.981l6.478 3.488m8.839 2.51l-4.66-2.51m0 0l-1.023-.55a2.25 2.25 0 00-2.134 0l-1.022.55m0 0l-4.661 2.51m16.5 1.615a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V8.844a2.25 2.25 0 011.183-1.98l7.5-4.04a2.25 2.25 0 012.134 0l7.5 4.04a2.25 2.25 0 011.183 1.98V19.5z",
    		tags: [
    			"mail",
    			"email",
    			"read",
    			"envelope-open"
    		]
    	},
    	{
    		name: "Chat Bubble Left",
    		slug: "chat-bubble-left",
    		src: "M7.5 8.25h9m-9 3H12M2.25 12.76c0 1.6 1.123 2.994 2.707 3.227 1.087.16 2.185.283 3.293.369V21l4.076-4.076a1.526 1.526 0 011.037-.443 48.282 48.282 0 005.68-.494c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0012 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018z",
    		tags: [
    			"message",
    			"comment",
    			"talk",
    			"chat-bubble-left"
    		]
    	},
    	{
    		name: "Chat Bubble Right",
    		slug: "chat-bubble-right",
    		src: "M7.5 8.25h9m0 3H12M21.75 12.76c0 1.6-1.123 2.994-2.707 3.227-1.087.16-2.185.283-3.293.369V21l-4.076-4.076a1.526 1.526 0 01-1.037-.443 48.282 48.282 0 00-5.68-.494c-1.584-.233-2.707-1.626-2.707-3.228V6.741c0-1.602 1.123-2.995 2.707-3.228A48.394 48.394 0 0112 3c2.392 0 4.744.175 7.043.513 1.584.233 2.707 1.627 2.707 3.228v6.018z",
    		tags: [
    			"message",
    			"comment",
    			"talk",
    			"chat-bubble-right"
    		]
    	},
    	{
    		name: "Chat Bubble Left Ellipsis",
    		slug: "chat-bubble-left-ellipsis",
    		src: "M7.8 9.8a.75.75 0 11-1.6 0 .75.75 0 011.6 0M12.8 9.8a.75.75 0 11-1.6 0 .75.75 0 011.6-0M17.8 9.8a.75.75 0 11-1.6 0 .75.75 0 011.6 0M2.25 12.76c0 1.6 1.123 2.994 2.707 3.227 1.087.16 2.185.283 3.293.369V21l4.076-4.076a1.526 1.526 0 011.037-.443 48.282 48.282 0 005.68-.494c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0012 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018z",
    		tags: [
    			"message",
    			"comment",
    			"typing",
    			"chat-bubble-left-ellipsis"
    		]
    	},
    	{
    		name: "Chat Bubble Right Ellipsis",
    		slug: "chat-bubble-right-ellipsis",
    		src: "M7.8 9.8a.75.75 0 11-1.6 0 .75.75 0 011.6 0M12.8 9.8a.75.75 0 11-1.6 0 .75.75 0 011.6 0M17.8 9.8a.75.75 0 11-1.6 0 .75.75 0 011.6 0M21.75 12.76c0 1.6-1.123 2.994-2.707 3.227-1.087.16-2.185.283-3.293.369V21l-4.076-4.076a1.526 1.526 0 01-1.037-.443 48.282 48.282 0 00-5.68-.494c-1.584-.233-2.707-1.626-2.707-3.228V6.741c0-1.602 1.123-2.995 2.707-3.228A48.394 48.394 0 0112 3c2.392 0 4.744.175 7.043.513 1.584.233 2.707 1.627 2.707 3.228v6.018z",
    		tags: [
    			"message",
    			"comment",
    			"typing",
    			"chat-bubble-right-ellipsis"
    		]
    	},
    	{
    		name: "Chat Bubble Left Right",
    		slug: "chat-bubble-left-right",
    		src: "M20.25 8.511c.884.284 1.5 1.128 1.5 2.097v4.286c0 1.136-.847 2.1-1.98 2.193-.34.027-.68.052-1.02.072v3.091l-3-3c-1.354 0-2.694-.055-4.02-.163a2.115 2.115 0 01-.825-.242m9.345-8.334a2.126 2.126 0 00-.476-.095 48.64 48.64 0 00-8.048 0c-1.131.094-1.976 1.057-1.976 2.192v4.286c0 .837.46 1.58 1.155 1.951m9.345-8.334V6.637c0-1.621-1.152-3.026-2.76-3.235A48.455 48.455 0 0011.25 3c-2.115 0-4.198.137-6.24.402-1.608.209-2.76 1.614-2.76 3.235v6.226c0 1.621 1.152 3.026 2.76 3.235.577.075 1.157.14 1.74.194V21l4.155-4.155",
    		tags: [
    			"conversation",
    			"exchange",
    			"chat-bubble-left-right"
    		]
    	},
    	{
    		name: "Phone",
    		slug: "phone",
    		src: "M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 01-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5A2.25 2.25 0 002.25 4.5v2.25z",
    		tags: [
    			"call",
    			"contact",
    			"mobile",
    			"phone"
    		]
    	},
    	{
    		name: "Phone X Mark",
    		slug: "phone-x-mark",
    		src: "M14.25 9.75v-4.5m0 4.5h4.5m-4.5 0l6-6m-3 18c-8.284 0-15-6.716-15-15V4.5A2.25 2.25 0 014.5 2.25h1.372c.516 0 .966.351 1.091.852l1.106 4.423c.11.44-.055.902-.417 1.173l-1.293.97a1.062 1.062 0 00-.38 1.21 12.035 12.035 0 007.143 7.143c.441.162.928-.004 1.21-.38l.97-1.293a1.125 1.125 0 011.173-.417l4.423 1.106c.5.125.852.575.852 1.091V19.5a2.25 2.25 0 01-2.25 2.25h-2.25z",
    		tags: [
    			"missed call",
    			"hang up",
    			"phone-x-mark"
    		]
    	},
    	{
    		name: "User",
    		slug: "user",
    		src: "M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z",
    		tags: [
    			"person",
    			"profile",
    			"account",
    			"user"
    		]
    	},
    	{
    		name: "User Circle",
    		slug: "user-circle",
    		src: "M17.982 18.725A7.488 7.488 0 0012 15.75a7.488 7.488 0 00-5.982 2.975m11.963 0a9 9 0 10-11.963 0m11.963 0A8.966 8.966 0 0112 21a8.966 8.966 0 01-5.982-2.275M15 9.75a3 3 0 11-6 0 3 3 0 016 0z",
    		tags: [
    			"person",
    			"profile",
    			"account",
    			"user-circle"
    		]
    	},
    	{
    		name: "User Plus",
    		slug: "user-plus",
    		src: "M19 7.5v3m0 0v3m0-3h3m-3 0h-3m-2.25-4.125a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zM4 19.235v-.11a6.375 6.375 0 0112.75 0v.109A12.318 12.318 0 0110.374 21c-2.331 0-4.512-.645-6.374-1.766z",
    		tags: [
    			"add user",
    			"register",
    			"user-plus"
    		]
    	},
    	{
    		name: "User Minus",
    		slug: "user-minus",
    		src: "m19 10.5m0 0h3M19 10.5h-3m-2.25-4.125a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zM4 19.235v-.11a6.375 6.375 0 0112.75 0v.109A12.318 12.318 0 0110.374 21c-2.331 0-4.512-.645-6.374-1.766z",
    		tags: [
    			"remove user",
    			"user-minus"
    		]
    	},
    	{
    		name: "User Group",
    		slug: "user-group",
    		src: "M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.94-3.197a5.971 5.971 0 00-.94 3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm-13.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z",
    		tags: [
    			"people",
    			"team",
    			"community",
    			"user-group"
    		]
    	},
    	{
    		name: "Users",
    		slug: "users",
    		src: "M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z",
    		tags: [
    			"people",
    			"team",
    			"community",
    			"users"
    		]
    	},
    	{
    		name: "Alert",
    		slug: "alert",
    		src: "M3 8.25V18a2.25 2.25 0 002.25 2.25h13.5A2.25 2.25 0 0021 18V8.25m-18 0V6a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 6v2.25m-18 0h18zM8 13.3h8v3H8z",
    		tags: [
    			"warning",
    			"danger",
    			"notification",
    			"alert",
    			"senangwebs",
    			"popup",
    			"sw-modals"
    		]
    	},
    	{
    		name: "Play",
    		slug: "play",
    		src: "M5.25 5.653c0-.856.917-1.398 1.667-.986l11.54 6.348a1.125 1.125 0 010 1.971l-11.54 6.347a1.125 1.125 0 01-1.667-.985V5.653z",
    		tags: [
    			"start",
    			"media",
    			"video",
    			"play"
    		]
    	},
    	{
    		name: "Pause",
    		slug: "pause",
    		src: "M9 5.25v13.5m6-13.5v13.5",
    		tags: [
    			"stop",
    			"media",
    			"video",
    			"pause"
    		]
    	},
    	{
    		name: "Stop",
    		slug: "stop",
    		src: "M4.5 7.5a3 3 0 013-3h9a3 3 0 013 3v9a3 3 0 01-3 3h-9a3 3 0 01-3-3v-9z",
    		tags: [
    			"media",
    			"video",
    			"stop"
    		]
    	},
    	{
    		name: "Play Circle",
    		slug: "play-circle",
    		src: "M21 12a9 9 0 11-18 0 9 9 0 0118 0zM15.91 11.672a.375.375 0 010 .656l-5.603 3.113a.375.375 0 01-.557-.328V8.887c0-.286.307-.466.557-.327l5.603 3.112z",
    		tags: [
    			"start",
    			"media",
    			"play-circle"
    		]
    	},
    	{
    		name: "Pause Circle",
    		slug: "pause-circle",
    		src: "M14.25 9v6m-4.5 0V9M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z",
    		tags: [
    			"stop",
    			"media",
    			"pause-circle"
    		]
    	},
    	{
    		name: "Speaker Wave",
    		slug: "speaker-wave",
    		src: "M19.114 5.636a9 9 0 010 12.728M16.463 8.288a5.25 5.25 0 010 7.424M6.75 8.25l4.72-4.72a.75.75 0 011.28.53v15.88a.75.75 0 01-1.28.53l-4.72-4.72H4.51c-.88 0-1.704-.507-1.938-1.354A9.01 9.01 0 012.25 12c0-.83.112-1.633.322-2.396C2.806 8.756 3.63 8.25 4.51 8.25H6.75z",
    		tags: [
    			"sound",
    			"volume",
    			"audio",
    			"speaker-wave"
    		]
    	},
    	{
    		name: "Speaker X Mark",
    		slug: "speaker-x-mark",
    		src: "M17.25 9.75L19.5 12m0 0l2.25 2.25M19.5 12l2.25-2.25M19.5 12l-2.25 2.25m-10.5-6l4.72-4.72a.75.75 0 011.28.53v15.88a.75.75 0 01-1.28.53l-4.72-4.72H4.51c-.88 0-1.704-.507-1.938-1.354A9.01 9.01 0 012.25 12c0-.83.112-1.633.322-2.396C2.806 8.756 3.63 8.25 4.51 8.25H6.75z",
    		tags: [
    			"mute",
    			"silent",
    			"audio",
    			"speaker-x-mark"
    		]
    	},
    	{
    		name: "Microphone",
    		slug: "microphone",
    		src: "M12 18.75a6 6 0 006-6v-1.5m-6 7.5a6 6 0 01-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M12 15.75a3 3 0 01-3-3V4.5a3 3 0 116 0v8.25a3 3 0 01-3 3z",
    		tags: [
    			"record",
    			"audio",
    			"voice",
    			"microphone"
    		]
    	},
    	{
    		name: "Microphone Mute",
    		slug: "microphone-mute",
    		src: "M3.75 3.75l16.5 16.5M12 18.75a6 6 0 006-6v-1.5m-6 7.5a6 6 0 01-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M15 10.932V4.5a3 3 0 00-6 0v3.068m0 0v5.182a3 3 0 003 3c.944 0 1.794-.437 2.347-1.118",
    		tags: [
    			"mute",
    			"silent",
    			"voice",
    			"microphone-mute"
    		]
    	},
    	{
    		name: "Video Camera",
    		slug: "video-camera",
    		src: "M15.75 10.5l4.72-4.72a.75.75 0 011.28.53v11.38a.75.75 0 01-1.28.53l-4.72-4.72M4.5 18.75h9a2.25 2.25 0 002.25-2.25v-9a2.25 2.25 0 00-2.25-2.25h-9A2.25 2.25 0 002.25 7.5v9a2.25 2.25 0 002.25 2.25z",
    		tags: [
    			"movie",
    			"film",
    			"record",
    			"video-camera"
    		]
    	},
    	{
    		name: "Camera",
    		slug: "camera",
    		src: "M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.774 48.774 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316zM16.5 12.75a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0z",
    		tags: [
    			"photo",
    			"picture",
    			"image",
    			"camera"
    		]
    	},
    	{
    		name: "Photo",
    		slug: "photo",
    		src: "M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 4.5h16.5a2.25 2.25 0 002.25-2.25V6a2.25 2.25 0 00-2.25-2.25H3.75A2.25 2.25 0 001.5 6v12a2.25 2.25 0 002.25 2.25zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z",
    		tags: [
    			"image",
    			"picture",
    			"gallery",
    			"photo",
    			"senangwebs",
    			"lightbox",
    			"sw-gallery"
    		]
    	},
    	{
    		name: "Panorama",
    		slug: "panorama",
    		src: "M2 5C8 9 16 9 22 5V19C16 15 8 15 2 19V5ZM8 13 12 11 12 13 16 11",
    		tags: [
    			"image",
    			"picture",
    			"wide",
    			"panorama",
    			"senangwebs",
    			"vr",
    			"sw-tour"
    		]
    	},
    	{
    		name: "Musical Note",
    		slug: "musical-note",
    		src: "M9 9l10.5-3m0 6.553v3.75a2.25 2.25 0 01-1.632 2.163l-1.32.377a1.803 1.803 0 11-.99-3.467l2.31-.66a2.25 2.25 0 001.632-2.163zm0 0V2.25L9 5.25v10.303m0 0v3.75a2.25 2.25 0 01-1.632 2.163l-1.32.377a1.803 1.803 0 11-.99-3.467l2.31-.66A2.25 2.25 0 009 15.553z",
    		tags: [
    			"audio",
    			"song",
    			"sound",
    			"musical-note"
    		]
    	},
    	{
    		name: "Code",
    		slug: "code",
    		src: "M17.25 6.75L22.5 12l-5.25 5.25M6.75 17.25L1.5 12l5.25-5.25M14.25 3.75l-4.5 16.5",
    		tags: [
    			"coding",
    			"programming",
    			"developer",
    			"code"
    		]
    	},
    	{
    		name: "Console",
    		slug: "console",
    		src: "M2.25 6A2.25 2.25 0 014.5 3.75h15A2.25 2.25 0 0121.75 6v12a2.25 2.25 0 01-2.25 2.25h-15A2.25 2.25 0 012.25 18V6zM7 9l3 3-3 3M12 15h5",
    		tags: [
    			"terminal",
    			"cli",
    			"command",
    			"prompt",
    			"console"
    		]
    	},
    	{
    		name: "Horizontal 3 Dots",
    		slug: "horizontal-3-dots",
    		src: "M6.75 12a.75.75 0 11-1.5 0 .75.75 0 011.5 0zM12.75 12a.75.75 0 11-1.5 0 .75.75 0 011.5 0zM18.75 12a.75.75 0 11-1.5 0 .75.75 0 011.5 0z",
    		tags: [
    			"menu",
    			"more",
    			"options",
    			"ellipsis",
    			"horizontal-3-dots"
    		]
    	},
    	{
    		name: "Vertical 3 Dots",
    		slug: "vertical-3-dots",
    		src: "M12 6.75a.75.75 0 110-1.5.75.75 0 010 1.5zM12 12.75a.75.75 0 110-1.5.75.75 0 010 1.5zM12 18.75a.75.75 0 110-1.5.75.75 0 010 1.5z",
    		tags: [
    			"menu",
    			"more",
    			"options",
    			"ellipsis",
    			"vertical-3-dots"
    		]
    	},
    	{
    		name: "Save",
    		slug: "save",
    		src: "M19 21A2.25 2.25 0 0021 19V7L17 3H5A2.25 2.25 0 003 5V19A2.25 2.25 0 005 21H17ZM12 18A3.75 3.75 0 1012 10.25 3.75 3.75 0 0012 18ZM7 3H13V7H7V5.8Z",
    		tags: [
    			"disk",
    			"floppy",
    			"store",
    			"save"
    		]
    	},
    	{
    		name: "Computer Laptop",
    		slug: "computer-laptop",
    		src: "M 2.25 15 h 19.5 v 1.5 a 2.25 2.25 0 0 1 -2.25 2.25 h -15 A 2.25 2.25 0 0 1 2.25 16.5 V 15 Z m 2.25 0 V 6.75 A 2.25 2.25 0 0 1 6.75 4.5 h 10.5 a 2.25 2.25 0 0 1 2.25 2.25 V 15",
    		tags: [
    			"device",
    			"macbook",
    			"pc",
    			"computer-laptop"
    		]
    	},
    	{
    		name: "Computer Code",
    		slug: "computer-code",
    		src: "M 2.25 15 h 19.5 v 1.5 a 2.25 2.25 0 0 1 -2.25 2.25 h -15 A 2.25 2.25 0 0 1 2.25 16.5 V 15 Z m 2.25 0 V 6.75 A 2.25 2.25 0 0 1 6.75 4.5 h 10.5 a 2.25 2.25 0 0 1 2.25 2.25 V 15 M 10 8 L 8 10 l 2 2 m 4 -4 l 2 2 l -2 2",
    		tags: [
    			"develop",
    			"program",
    			"syntax",
    			"computer-code",
    			"senangwebs",
    			"code",
    			"sw-one"
    		]
    	},
    	{
    		name: "Computer Desktop",
    		slug: "computer-desktop",
    		src: "M9 17.25v1.007a3 3 0 01-.879 2.122L7.5 21h9l-.621-.621A3 3 0 0115 18.257V17.25m6-12V15a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 15V5.25m18 0A2.25 2.25 0 0018.75 3H5.25A2.25 2.25 0 003 5.25m18 0V12a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 12V5.25",
    		tags: [
    			"monitor",
    			"screen",
    			"pc",
    			"computer-desktop"
    		]
    	},
    	{
    		name: "Device Phone Mobile",
    		slug: "device-phone-mobile",
    		src: "M10.5 1.5H8.25A2.25 2.25 0 006 3.75v16.5a2.25 2.25 0 002.25 2.25h7.5A2.25 2.25 0 0018 20.25V3.75a2.25 2.25 0 00-2.25-2.25H13.5m-3 0V3h3V1.5m-3 0h3m-3 18.75h3",
    		tags: [
    			"iphone",
    			"smartphone",
    			"cell",
    			"device-phone-mobile",
    			"senangwebs",
    			"sw-roll"
    		]
    	},
    	{
    		name: "Device Tablet",
    		slug: "device-tablet",
    		src: "M10.5 19.5h3m-6.75 2.25h10.5a2.25 2.25 0 002.25-2.25v-15a2.25 2.25 0 00-2.25-2.25H6.75A2.25 2.25 0 004.5 4.5v15a2.25 2.25 0 002.25 2.25z",
    		tags: [
    			"ipad",
    			"kindle",
    			"device-tablet"
    		]
    	},
    	{
    		name: "Battery 0",
    		slug: "battery-0",
    		src: "M21 10.5h.375c.621 0 1.125.504 1.125 1.125v2.25c0 .621-.504 1.125-1.125 1.125H21M3.75 18h15A2.25 2.25 0 0021 15.75v-6a2.25 2.25 0 00-2.25-2.25h-15A2.25 2.25 0 001.5 9.75v6A2.25 2.25 0 003.75 18z",
    		tags: [
    			"power",
    			"empty",
    			"charge",
    			"battery-0"
    		]
    	},
    	{
    		name: "Battery 10",
    		slug: "battery-10",
    		src: "M21 10.5h.375c.621 0 1.125.504 1.125 1.125v2.25c0 .621-.504 1.125-1.125 1.125H21M3.75 18h15A2.25 2.25 0 0021 15.75v-6a2.25 2.25 0 00-2.25-2.25h-15A2.25 2.25 0 001.5 9.75v6A2.25 2.25 0 003.75 18zM4.5 10.5h3L7.5 15 4.5 15 4.5 10.5",
    		tags: [
    			"power",
    			"low",
    			"battery-10"
    		]
    	},
    	{
    		name: "Battery 50",
    		slug: "battery-50",
    		src: "M21 10.5h.375c.621 0 1.125.504 1.125 1.125v2.25c0 .621-.504 1.125-1.125 1.125H21M3.75 18h15A2.25 2.25 0 0021 15.75v-6a2.25 2.25 0 00-2.25-2.25h-15A2.25 2.25 0 001.5 9.75v6A2.25 2.25 0 003.75 18zM4.5 10.5h7.5L12 15 4.5 15 4.5 10.5",
    		tags: [
    			"power",
    			"half",
    			"battery-50"
    		]
    	},
    	{
    		name: "Battery 100",
    		slug: "battery-100",
    		src: "M21 10.5h.375c.621 0 1.125.504 1.125 1.125v2.25c0 .621-.504 1.125-1.125 1.125H21M3.75 18h15A2.25 2.25 0 0021 15.75v-6a2.25 2.25 0 00-2.25-2.25h-15A2.25 2.25 0 001.5 9.75v6A2.25 2.25 0 003.75 18zM4.5 10.5h13.5L18 15 4.5 15 4.5 10.5",
    		tags: [
    			"power",
    			"full",
    			"battery-100"
    		]
    	},
    	{
    		name: "Controller",
    		slug: "controller",
    		src: "M12 2V6M5 6H19C20.6569 6 22 7.34315 22 9V15C22 16.6569 20.6569 18 19 18H5C3.34315 18 2 16.6569 2 15V9C2 7.34315 3.34315 6 5 6Z M6 12H10M8 10V14 M18 12a2 2 0 1 1-4 0 2 2 0 0 1 4 0z",
    		tags: [
    			"game",
    			"play",
    			"joystick",
    			"controller",
    			"senangwebs",
    			"vr",
    			"sw-verse"
    		]
    	},
    	{
    		name: "Game",
    		slug: "game",
    		src: "M 13 13 L 13 4 A 9 9 0 1 0 22 13 Z M 20 8 a 2 2 0 1 1 -4 0 a 2 2 0 0 1 4 0 z M 10 12 a 1.5 1.5 0 1 1 -3 0 a 1.5 1.5 0 0 1 3 0 z",
    		tags: [
    			"controller",
    			"play",
    			"joystick",
    			"game",
    			"senangwebs",
    			"2d",
    			"sw-xperience"
    		]
    	},
    	{
    		name: "Window",
    		slug: "window",
    		src: "M3 8.25V18a2.25 2.25 0 002.25 2.25h13.5A2.25 2.25 0 0021 18V8.25m-18 0V6a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 6v2.25m-18 0h18M5.25 6h.008v.008H5.25V6zM7.5 6h.008v.008H7.5V6zM9.75 6h.008v.008H9.75V6z",
    		tags: [
    			"browser",
    			"app",
    			"ui",
    			"window"
    		]
    	},
    	{
    		name: "Shopping Cart",
    		slug: "shopping-cart",
    		src: "M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 00-3 3h15.75m-12.75-3h11.218c1.121-2.3 2.1-4.684 2.924-7.138a60.114 60.114 0 00-16.536-1.84M7.5 14.25L5.106 5.272M6 20.25a.75.75 0 11-1.5 0 .75.75 0 011.5 0zm12.75 0a.75.75 0 11-1.5 0 .75.75 0 011.5 0z",
    		tags: [
    			"buy",
    			"checkout",
    			"store",
    			"shopping-cart"
    		]
    	},
    	{
    		name: "Shopping Bag",
    		slug: "shopping-bag",
    		src: "M15.75 10.5V6a3.75 3.75 0 10-7.5 0v4.5m11.356-1.993l1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 01-1.12-1.243l1.264-12A1.125 1.125 0 015.513 7.5h12.974c.576 0 1.059.435 1.119 1.007zM8.625 10.5a.375.375 0 11-.75 0 .375.375 0 01.75 0zm7.5 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z",
    		tags: [
    			"buy",
    			"checkout",
    			"store",
    			"shopping-bag"
    		]
    	},
    	{
    		name: "Basket",
    		slug: "basket",
    		src: "m15 11 0 9m4-9-4-7M2 11h20m-18.5 0 1.6 7.4a2 2 0 002 1.6h9.8a2 2 0 002-1.6l1.7-7.4M4.5 15.5h15m-14.5-4.5 4-7m0 7 0 9",
    		tags: [
    			"buy",
    			"checkout",
    			"store",
    			"basket",
    			"senangwebs",
    			"cart",
    			"shop",
    			"sw-buy"
    		]
    	},
    	{
    		name: "Credit Card",
    		slug: "credit-card",
    		src: "M2.25 8.25h19.5M2.25 9h19.5m-16.5 5.25h6m-6 2.25h3m-3.75 3h15a2.25 2.25 0 002.25-2.25V6.75A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25v10.5A2.25 2.25 0 004.5 19.5z",
    		tags: [
    			"payment",
    			"money",
    			"purchase",
    			"credit-card"
    		]
    	},
    	{
    		name: "Banknotes",
    		slug: "banknotes",
    		src: "M2.25 18.75l15.75 2.25c1 .2 1-0 1.2-1L19.4 18.8M3.75 4.5v.75A.75.75 0 013 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 00-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 01-1.125-1.125V15m1.5 1.5v-.75A.75.75 0 003 15h-.75M15 10.5a3 3 0 11-6 0 3 3 0 016 0Zm3 0h.008v.008H18V10.5Zm-12 0h.008v.008H6V10.5Z",
    		tags: [
    			"money",
    			"cash",
    			"payment",
    			"banknotes"
    		]
    	},
    	{
    		name: "Calendar",
    		slug: "calendar",
    		src: "M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5",
    		tags: [
    			"date",
    			"schedule",
    			"time",
    			"calendar"
    		]
    	},
    	{
    		name: "Calendar Plus",
    		slug: "calendar-plus",
    		src: "M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5M12 12v6m3-3h-6",
    		tags: [
    			"date",
    			"schedule",
    			"time",
    			"calendar",
    			"add",
    			"plus"
    		]
    	},
    	{
    		name: "Calendar Minus",
    		slug: "calendar-minus",
    		src: "M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25M15 15H9",
    		tags: [
    			"date",
    			"schedule",
    			"time",
    			"calendar",
    			"subtract",
    			"minus"
    		]
    	},
    	{
    		name: "Calendar Approve",
    		slug: "calendar-approve",
    		src: "M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25M10.5 17.5 15 12.5M9 15.5l1.5 2",
    		tags: [
    			"date",
    			"schedule",
    			"time",
    			"calendar",
    			"approve",
    			"check",
    			"accept"
    		]
    	},
    	{
    		name: "Calendar Reject",
    		slug: "calendar-reject",
    		src: "M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25M9.5 17.5 14.5 12.5M9.5 12.5l5 5",
    		tags: [
    			"date",
    			"schedule",
    			"time",
    			"calendar",
    			"reject",
    			"x-mark",
    			"remove"
    		]
    	},
    	{
    		name: "Calendar Days",
    		slug: "calendar-days",
    		src: "M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5m-9-6h.008v.008H12v-.008zM12 15h.008v.008H12V15zm0 2.25h.008v.008H12v-.008zM9.75 15h.008v.008H9.75V15zm0 2.25h.008v.008H9.75v-.008zM7.5 15h.008v.008H7.5V15zm0 2.25h.008v.008H7.5v-.008zm6.75-4.5h.008v.008h-.008v-.008zm0 2.25h.008v.008h-.008V15zm0 2.25h.008v.008h-.008v-.008zm2.25-4.5h.008v.008H16.5v-.008zm0 2.25h.008v.008H16.5V15z",
    		tags: [
    			"date",
    			"schedule",
    			"time",
    			"calendar-days"
    		]
    	},
    	{
    		name: "Briefcase",
    		slug: "briefcase",
    		src: "M20.25 14.15v4.25c0 1.094-.787 2.036-1.872 2.18-2.087.277-4.216.42-6.378.42s-4.291-.143-6.378-.42c-1.085-.144-1.872-1.086-1.872-2.18v-4.25m16.5 0a2.18 2.18 0 00.75-1.661V8.706c0-1.081-.768-2.015-1.837-2.175a48.114 48.114 0 00-3.413-.387m4.5 8.006c-.194.165-.42.295-.675.38A23.978 23.978 0 0112 15.75c-2.648 0-5.195-.429-7.577-1.22a2.016 2.016 0 01-.675-.38m0 0A2.18 2.18 0 013 12.489V8.706c0-1.081.768-2.015 1.837-2.175a48.111 48.111 0 013.413-.387m7.5 0V5.25A2.25 2.25 0 0013.5 3h-3a2.25 2.25 0 00-2.25 2.25v.894m7.5 0a48.667 48.667 0 00-7.5 0M12 12.75h.008v.008H12v-.008z",
    		tags: [
    			"work",
    			"business",
    			"office",
    			"briefcase"
    		]
    	},
    	{
    		name: "Presentation Chart Line",
    		slug: "presentation-chart-line",
    		src: "M3.75 3v11.25A2.25 2.25 0 006 16.5h2.25M3.75 3h-1.5m1.5 0h16.5m0 0h1.5m-1.5 0v11.25A2.25 2.25 0 0118 16.5h-2.25m-7.5 0h7.5m-7.5 0l-1 3m8.5-3l1 3m0 0l.5 1.5m-.5-1.5h-9.5m0 0l-.5 1.5m.75-9 3-3 2.148 2.148A12.061 12.061 0 0116.5 7.605",
    		tags: [
    			"analytics",
    			"graph",
    			"stats",
    			"presentation-chart-line"
    		]
    	},
    	{
    		name: "Presentation Media",
    		slug: "presentation-media",
    		src: "M 3.75 3 v 11.25 A 2.25 2.25 0 0 0 6 16.5 h 2.25 M 3.75 3 h -1.5 m 1.5 0 h 16.5 m 0 0 h 1.5 m -1.5 0 v 11.25 A 2.25 2.25 0 0 1 18 16.5 h -2.25 m -7.5 0 h 7.5 m -7.5 0 l -1 3 m 8.5 -3 l 1 3 m 0 0 l 0.5 1.5 m -0.5 -1.5 h -9.5 m 0 0 l -0.5 1.5 M 10 7 l 5.005 2.487 l -5.005 2.513 z",
    		tags: [
    			"analytics",
    			"graph",
    			"screen",
    			"presentation-media",
    			"senangwebs",
    			"presentation",
    			"sw-deck"
    		]
    	},
    	{
    		name: "Whiteboard",
    		slug: "whiteboard",
    		src: "M3 5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5zM2 17h20M6 17v4M18 17v4",
    		tags: [
    			"draw",
    			"present",
    			"board",
    			"whiteboard",
    			"senangwebs",
    			"vector",
    			"sw-whiteboard"
    		]
    	},
    	{
    		name: "Chart Line",
    		slug: "chart-line",
    		src: "M4 3v15c0 2 1 3 3 3h13M8 15l3-4 2 2 6-8",
    		tags: [
    			"graph",
    			"analytics",
    			"stats",
    			"chart-line"
    		]
    	},
    	{
    		name: "Chart Bar",
    		slug: "chart-bar",
    		src: "M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z",
    		tags: [
    			"graph",
    			"analytics",
    			"stats",
    			"chart-bar"
    		]
    	},
    	{
    		name: "Chart Pie",
    		slug: "chart-pie",
    		src: "M10.5 6a7.5 7.5 0 1 0 7.5 7.5h-7.5V6Z M13.5 10.5H21A7.5 7.5 0 0 0 13.5 3v7.5Z",
    		tags: [
    			"graph",
    			"analytics",
    			"stats",
    			"chart-pie",
    			"senangwebs",
    			"chart",
    			"sw-yield"
    		]
    	},
    	{
    		name: "Currency Dollar",
    		slug: "currency-dollar",
    		src: "M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z",
    		tags: [
    			"money",
    			"price",
    			"cost",
    			"usd",
    			"currency-dollar"
    		]
    	},
    	{
    		name: "Currency Euro",
    		slug: "currency-euro",
    		src: "M14.25 7.756a4.5 4.5 0 100 8.488M7.5 10.5h5.25m-5.25 3h5.25M21 12a9 9 0 11-18 0 9 9 0 0118 0z",
    		tags: [
    			"money",
    			"price",
    			"cost",
    			"eur",
    			"currency-euro"
    		]
    	},
    	{
    		name: "Currency Pound",
    		slug: "currency-pound",
    		src: "M14.1213 7.62877C12.9497 6.45719 11.0503 6.45719 9.87868 7.62877C9.37424 8.13321 9.08699 8.7726 9.01694 9.43073C8.9944 9.64251 9.01512 9.85582 9.04524 10.0667L9.5512 13.6084C9.68065 14.5146 9.5307 15.4386 9.12135 16.2573L9 16.5L10.5385 15.9872C11.0003 15.8332 11.4997 15.8332 11.9615 15.9872L12.6158 16.2053C13.182 16.394 13.7999 16.3501 14.3336 16.0832L15 15.75M8.25 12H12M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z",
    		tags: [
    			"money",
    			"price",
    			"cost",
    			"gbp",
    			"currency-pound"
    		]
    	},
    	{
    		name: "Currency Yen",
    		slug: "currency-yen",
    		src: "M9 7.5l3 4.5m0 0l3-4.5M12 12v5.25M15 12H9m6 3H9m12-3a9 9 0 11-18 0 9 9 0 0118 0z",
    		tags: [
    			"money",
    			"price",
    			"cost",
    			"jpy",
    			"currency-yen"
    		]
    	},
    	{
    		name: "Currency Ringgit",
    		slug: "currency-ringgit",
    		src: "M7 15V9h2a1.5 1.5 0 0 1 0 3H7m2 0l1.5 3M13 15V9l2 3 2-3v6M21 12a9 9 0 11-18 0 9 9 0 0118 0z",
    		tags: [
    			"money",
    			"price",
    			"cost",
    			"myr",
    			"currency-ringgit"
    		]
    	},
    	{
    		name: "Tabs",
    		slug: "tabs",
    		src: "M21 7.5V18a2.25 2.25 0 0 1-2.25 2.25H5.25A2.25 2.25 0 0 1 3 18V7.5V6a2.25 2.25 0 0 1 2.25-2.25H18.75a2.25 2.25 0 0 1 2.25 2.25V7.5H12V3.75",
    		tags: [
    			"browser",
    			"ui",
    			"navigation",
    			"tabs",
    			"senangwebs",
    			"sw-herd"
    		]
    	},
    	{
    		name: "Document",
    		slug: "document",
    		src: "M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z",
    		tags: [
    			"file",
    			"paper",
    			"page",
    			"document"
    		]
    	},
    	{
    		name: "Document Text",
    		slug: "document-text",
    		src: "M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z",
    		tags: [
    			"file",
    			"paper",
    			"page",
    			"document-text"
    		]
    	},
    	{
    		name: "Document Duplicate",
    		slug: "document-duplicate",
    		src: "M15.75 17.25v3.375c0 .621-.504 1.125-1.125 1.125h-9.75a1.125 1.125 0 01-1.125-1.125V7.875c0-.621.504-1.125 1.125-1.125H6.75a9.06 9.06 0 011.5.124m7.5 10.376h3.375c.621 0 1.125-.504 1.125-1.125V11.25c0-4.46-3.243-8.161-7.5-8.876a9.06 9.06 0 00-1.5-.124H9.375c-.621 0-1.125.504-1.125 1.125v3.5m7.5 10.375H9.375a1.125 1.125 0 01-1.125-1.125v-9.25m12 6.625v-1.875a3.375 3.375 0 00-3.375-3.375h-1.5a1.125 1.125 0 01-1.125-1.125v-1.5a3.375 3.375 0 00-3.375-3.375H9.75",
    		tags: [
    			"copy",
    			"clone",
    			"file",
    			"document-duplicate"
    		]
    	},
    	{
    		name: "Folder",
    		slug: "folder",
    		src: "M2.25 12.75V12A2.25 2.25 0 014.5 9.75h15A2.25 2.25 0 0121.75 12v.75m-8.69-6.44l-2.12-2.12a1.5 1.5 0 00-1.061-.44H4.5A2.25 2.25 0 002.25 6v12a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9a2.25 2.25 0 00-2.25-2.25h-5.379a1.5 1.5 0 01-1.06-.44z",
    		tags: [
    			"directory",
    			"organize",
    			"file",
    			"folder"
    		]
    	},
    	{
    		name: "Folder Open",
    		slug: "folder-open",
    		src: "M3.75 9.776c.112-.017.227-.026.344-.026h15.812c.117 0 .232.009.344.026m-16.5 0a2.25 2.25 0 00-1.883 2.542l.857 6a2.25 2.25 0 002.227 1.932H19.05a2.25 2.25 0 002.227-1.932l.857-6a2.25 2.25 0 00-1.883-2.542m-16.5 0V6A2.25 2.25 0 016 3.75h3.879a1.5 1.5 0 011.06.44l2.122 2.12a1.5 1.5 0 001.06.44H18A2.25 2.25 0 0120.25 9v.776",
    		tags: [
    			"directory",
    			"organize",
    			"file",
    			"folder-open",
    			"senangwebs",
    			"sw-unfold"
    		]
    	},
    	{
    		name: "Folder Plus",
    		slug: "folder-plus",
    		src: "M12 10.5v6m3-3H9m4.06-7.19l-2.12-2.12a1.5 1.5 0 00-1.061-.44H4.5A2.25 2.25 0 002.25 6v12a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9a2.25 2.25 0 00-2.25-2.25h-5.379a1.5 1.5 0 01-1.06-.44z",
    		tags: [
    			"add folder",
    			"new directory",
    			"folder-plus"
    		]
    	},
    	{
    		name: "Folder minus",
    		slug: "folder-minus",
    		src: "M12 13.5 12 13.5m3 0H9m4.06-7.19-2.12-2.12a1.5 1.5 0 00-1.061-.44H4.5A2.25 2.25 0 002.25 6v12a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9a2.25 2.25 0 00-2.25-2.25h-5.379a1.5 1.5 0 01-1.06-.44z",
    		tags: [
    			"remove folder",
    			"delete directory",
    			"folder-minus"
    		]
    	},
    	{
    		name: "Clipboard",
    		slug: "clipboard",
    		src: "M15.666 3.888A2.25 2.25 0 0 0 13.5 2.25h-3c-1.03 0-1.9.693-2.166 1.638m7.332 0c.055.194.084.4.084.612v0a.75.75 0 0 1-.75.75H9a.75.75 0 0 1-.75-.75v0c0-.212.03-.418.084-.612m7.332 0c.646.049 1.288.11 1.927.184 1.1.128 1.907 1.077 1.907 2.185V19.5a2.25 2.25 0 0 1-2.25 2.25H6.75A2.25 2.25 0 0 1 4.5 19.5V6.257c0-1.108.806-2.057 1.907-2.185a48.208 48.208 0 0 1 1.927-.184",
    		tags: [
    			"copy",
    			"paste",
    			"board",
    			"clipboard",
    			"senangwebs",
    			"sw-jot"
    		]
    	},
    	{
    		name: "Clipboard Document Check",
    		slug: "clipboard-document-check",
    		src: "M11.35 3.836c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 0 0 .75-.75 2.25 2.25 0 0 0-.1-.664m-5.8 0A2.251 2.251 0 0 1 13.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m8.9-4.414c.376.023.75.05 1.124.08 1.131.094 1.976 1.057 1.976 2.192V16.5A2.25 2.25 0 0 1 18 18.75h-2.25m-7.5-10.5H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V18.75m-7.5-10.5h6.375c.621 0 1.125.504 1.125 1.125v9.375m-8.25-3 1.5 1.5 3-3.75",
    		tags: [
    			"checklist",
    			"task",
    			"done",
    			"clipboard-document-check"
    		]
    	},
    	{
    		name: "Paper Clip",
    		slug: "paper-clip",
    		src: "M18.375 12.739l-7.693 7.693a4.5 4.5 0 01-6.364-6.364l10.94-10.94A3 3 0 1119.5 7.372L8.552 18.32m.009-.01l-.01.01m5.699-9.941l-7.81 7.81a1.5 1.5 0 002.112 2.13",
    		tags: [
    			"attach",
    			"file",
    			"link",
    			"paper-clip"
    		]
    	},
    	{
    		name: "Archive Box",
    		slug: "archive-box",
    		src: "M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z",
    		tags: [
    			"store",
    			"history",
    			"backup",
    			"archive-box"
    		]
    	},
    	{
    		name: "Inbox",
    		slug: "inbox",
    		src: "M2.25 13.5h3.86a2.25 2.25 0 012.012 1.244l.256.512a2.25 2.25 0 002.013 1.244h3.218a2.25 2.25 0 002.013-1.244l.256-.512a2.25 2.25 0 012.013-1.244h3.859m-19.5.338V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18v-4.162c0-.224-.034-.447-.1-.661L19.24 5.338a2.25 2.25 0 00-2.15-1.588H6.911a2.25 2.25 0 00-2.15 1.588L2.35 13.177a2.25 2.25 0 00-.1.661z",
    		tags: [
    			"email",
    			"message",
    			"tray",
    			"inbox"
    		]
    	},
    	{
    		name: "Book Open",
    		slug: "book-open",
    		src: "M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25",
    		tags: [
    			"read",
    			"learn",
    			"library",
    			"book-open",
    			"senangwebs",
    			"sw-story"
    		]
    	},
    	{
    		name: "Book Close",
    		slug: "book-close",
    		src: "M4 18.5v-13A2.5 2.5 0 016.5 3H19a1 1 0 011 1v16a1 1 0 01-1 1H6.5a1 1 0 010-5H20M7 13.5 7 5.5",
    		tags: [
    			"read",
    			"learn",
    			"library",
    			"book-close"
    		]
    	},
    	{
    		name: "Book Stacked",
    		slug: "book-stacked",
    		src: "M4 3h6a1 1 0 0 1 1 1v16a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1z M7 3v18 M20.4 18.9c.2.5-.1 1.1-.6 1.3l-1.9.7c-.5.2-1.1-.1-1.3-.6L11.1 5.1c-.2-.5.1-1.1.6-1.3l1.9-.7c.5-.2 1.1.1 1.3.6Z",
    		tags: [
    			"read",
    			"learn",
    			"library",
    			"book-stacked"
    		]
    	},
    	{
    		name: "Lock Closed",
    		slug: "lock-closed",
    		src: "M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z",
    		tags: [
    			"secure",
    			"password",
    			"private",
    			"lock-closed"
    		]
    	},
    	{
    		name: "Lock Open",
    		slug: "lock-open",
    		src: "M13.5 10.5V6.75a4.5 4.5 0 119 0v3.75M3.75 21.75h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H3.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z",
    		tags: [
    			"unlock",
    			"public",
    			"access",
    			"lock-open"
    		]
    	},
    	{
    		name: "Key",
    		slug: "key",
    		src: "M15.75 5.25a3 3 0 013 3m3 0a6 6 0 01-7.029 5.912c-.563-.097-1.159.026-1.563.43L10.5 17.25H8.25v2.25H6v2.25H2.25v-2.818c0-.597.237-1.17.659-1.591l6.499-6.499c.404-.404.527-1 .43-1.563A6 6 0 1121.75 8.25z",
    		tags: [
    			"password",
    			"access",
    			"secure",
    			"key"
    		]
    	},
    	{
    		name: "Shield Check",
    		slug: "shield-check",
    		src: "M9 12.75 11.25 15 15 9.75m-3-7.036A11.959 11.959 0 0 1 3.598 6 11.99 11.99 0 0 0 3 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285Z",
    		tags: [
    			"secure",
    			"safe",
    			"verified",
    			"shield-check"
    		]
    	},
    	{
    		name: "Shield Exclamation",
    		slug: "shield-exclamation",
    		src: "M12 9v3.75M12 15.75h.008v.008H12v-.008zM12 2.714A11.959 11.959 0 0 1 3.598 6 11.99 11.99 0 0 0 3 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285Z",
    		tags: [
    			"danger",
    			"warning",
    			"security",
    			"shield-exclamation"
    		]
    	},
    	{
    		name: "Exclamation Circle",
    		slug: "exclamation-circle",
    		src: "M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z",
    		tags: [
    			"error",
    			"warning",
    			"alert",
    			"exclamation-circle"
    		]
    	},
    	{
    		name: "Exclamation Triangle",
    		slug: "exclamation-triangle",
    		src: "M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.008v.008H12v-.008z",
    		tags: [
    			"warning",
    			"danger",
    			"caution",
    			"exclamation-triangle"
    		]
    	},
    	{
    		name: "Information Circle",
    		slug: "information-circle",
    		src: "M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z",
    		tags: [
    			"help",
    			"details",
    			"info",
    			"information-circle"
    		]
    	},
    	{
    		name: "Question Mark Circle",
    		slug: "question-mark-circle",
    		src: "M9.879 7.519c1.171-1.025 3.071-1.025 4.242 0 1.172 1.025 1.172 2.687 0 3.712-.203.179-.43.326-.67.442-.745.361-1.45.999-1.45 1.827v.75M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9 5.25h.008v.008H12v-.008z",
    		tags: [
    			"help",
    			"faq",
    			"support",
    			"question-mark-circle",
    			"senangwebs",
    			"question",
    			"sw-quiz"
    		]
    	},
    	{
    		name: "Bell",
    		slug: "bell",
    		src: "M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0",
    		tags: [
    			"notification",
    			"alert",
    			"alarm",
    			"bell",
    			"senangwebs",
    			"prompt",
    			"sw-notices"
    		]
    	},
    	{
    		name: "Bell Alert",
    		slug: "bell-alert",
    		src: "M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0M3.124 7.5A8.969 8.969 0 015.292 3m13.416 0a8.969 8.969 0 012.168 4.5",
    		tags: [
    			"notification",
    			"alert",
    			"alarm",
    			"bell-alert"
    		]
    	},
    	{
    		name: "Eye",
    		slug: "eye",
    		src: "M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178zM15 12a3 3 0 11-6 0 3 3 0 016 0z",
    		tags: [
    			"view",
    			"show",
    			"visible",
    			"eye"
    		]
    	},
    	{
    		name: "Eye Slash",
    		slug: "eye-slash",
    		src: "M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88",
    		tags: [
    			"hide",
    			"invisible",
    			"password",
    			"eye-slash"
    		]
    	},
    	{
    		name: "Light Bulb",
    		slug: "light-bulb",
    		src: "M12 2.25a7.5 7.5 0 00-7.5 7.5c0 2.5 1.2 4.8 3.1 6.2.8.6 1.4 1.4 1.4 2.4v1.9a.75.75 0 00.75.75h4.5a.75.75 0 00.75-.75v-1.9c0-1 .6-1.8 1.4-2.4 1.9-1.4 3.1-3.7 3.1-6.2a7.5 7.5 0 00-7.5-7.5ZM10 17h4M11 22v0L13 22M9.75 9.75c0-1.25 1.125-2.25 2.25-2.25s2.25 1 2.25 2.25",
    		tags: [
    			"idea",
    			"tip",
    			"solution",
    			"light-bulb"
    		]
    	},
    	{
    		name: "Bolt",
    		slug: "bolt",
    		src: "M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z",
    		tags: [
    			"energy",
    			"power",
    			"fast",
    			"bolt"
    		]
    	},
    	{
    		name: "Moon",
    		slug: "moon",
    		src: "M21.752 15.002A9.718 9.718 0 0118 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 003 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 009.002-5.998z",
    		tags: [
    			"dark mode",
    			"night",
    			"sleep",
    			"moon"
    		]
    	},
    	{
    		name: "Sun",
    		slug: "sun",
    		src: "M12 3v2.25m6.364.386l-1.591 1.591M21 12h-2.25m-.386 6.364l-1.591-1.591M12 18.75V21m-4.773-4.263l-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0z",
    		tags: [
    			"light mode",
    			"day",
    			"bright",
    			"sun"
    		]
    	},
    	{
    		name: "Cloud",
    		slug: "cloud",
    		src: "M2.25 15a4.5 4.5 0 004.5 4.5H18a3.75 3.75 0 001.332-7.257 3 3 0 00-4.232-3.943 5.25 5.25 0 00-10.233 2.33A4.502 4.502 0 002.25 15z",
    		tags: [
    			"weather",
    			"sky",
    			"cloud"
    		]
    	},
    	{
    		name: "Thunder",
    		slug: "thunder",
    		src: "M9 3h5L12 8 18 8 8.5 22l3.5-10h-6l2-9z",
    		tags: [
    			"weather",
    			"storm",
    			"lightning",
    			"thunder"
    		]
    	},
    	{
    		name: "Star",
    		slug: "star",
    		src: "M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.563.045.797.77.364 1.154l-4.22 3.737a.563.563 0 00-.172.527l1.283 5.376c.15.628-.548 1.13-1.066.77l-4.654-3.192a.563.563 0 00-.636 0l-4.654 3.192c-.518.36-1.216-.142-1.066-.77l1.283-5.376a.563.563 0 00-.172-.527l-4.22-3.737c-.433-.384-.199-1.11.364-1.154l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z",
    		tags: [
    			"favorite",
    			"rating",
    			"like",
    			"star"
    		]
    	},
    	{
    		name: "Heart",
    		slug: "heart",
    		src: "M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z",
    		tags: [
    			"like",
    			"love",
    			"favorite",
    			"heart"
    		]
    	},
    	{
    		name: "Hand Thumb Up",
    		slug: "hand-thumb-up",
    		src: "M7.5 11.25h-3v8.25h3m0-8.25v-5.25a2.25 2.25 0 0 1 4.5 0v3.75h3.75a2.25 2.25 0 0 1 2.25 2.25v5.25a2.25 2.25 0 0 1-2.25 2.25h-8.25",
    		tags: [
    			"like",
    			"approve",
    			"good",
    			"hand-thumb-up"
    		]
    	},
    	{
    		name: "Hand Thumb Down",
    		slug: "hand-thumb-down",
    		src: "M7.5 12.75h-3v-8.25h3m0 8.25v5.25a2.25 2.25 0 0 0 4.5 0v-3.75h3.75a2.25 2.25 0 0 0 2.25-2.25v-5.25a2.25 2.25 0 0 0-2.25-2.25h-8.25",
    		tags: [
    			"dislike",
    			"reject",
    			"bad",
    			"hand-thumb-down"
    		]
    	},
    	{
    		name: "Flag",
    		slug: "flag",
    		src: "M3 3v1.5M3 21v-6m0 0l2.77-.693a9 9 0 016.208.682l.108.054a9 9 0 006.086.71l3.114-.732a48.524 48.524 0 01-.005-10.499l-3.11.732a9 9 0 01-6.085-.711l-.108-.054a9 9 0 00-6.208-.682L3 4.5M3 15V4.5",
    		tags: [
    			"report",
    			"country",
    			"goal",
    			"flag"
    		]
    	},
    	{
    		name: "Bookmark",
    		slug: "bookmark",
    		src: "M17.593 3.322c1.1.128 1.907 1.077 1.907 2.185V21L12 17.25 4.5 21V5.507c0-1.108.806-2.057 1.907-2.185a48.507 48.507 0 0111.186 0z",
    		tags: [
    			"save",
    			"favorite",
    			"tag",
    			"bookmark"
    		]
    	},
    	{
    		name: "Map",
    		slug: "map",
    		src: "M3 7.5v13.5l6-3 6 3 6-3V4.5l-6 3-6-3-6 3Z M9 4.5v13.5 M15 7.5v13.5",
    		tags: [
    			"location",
    			"travel",
    			"guide",
    			"map"
    		]
    	},
    	{
    		name: "Map Pin",
    		slug: "map-pin",
    		src: "M15 10.5a3 3 0 11-6 0 3 3 0 016 0zM19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z",
    		tags: [
    			"location",
    			"marker",
    			"spot",
    			"map-pin"
    		]
    	},
    	{
    		name: "Globe Alt",
    		slug: "globe-alt",
    		src: "M12 21a9.004 9.004 0 008.716-6.747M12 21a9.004 9.004 0 01-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 017.843 4.582M12 3a8.997 8.997 0 00-7.843 4.582m15.686 0A11.953 11.953 0 0112 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0121 12c0 .778-.099 1.533-.284 2.253m0 0A17.919 17.919 0 0112 16.5c-3.162 0-6.133-.815-8.716-2.247m0 0A9.015 9.015 0 013 12c0-1.605.42-3.113 1.157-4.418",
    		tags: [
    			"world",
    			"internet",
    			"web",
    			"globe-alt"
    		]
    	},
    	{
    		name: "Truck",
    		slug: "truck",
    		src: "M8.25 18.75a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 01-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 00-3.213-9.193 2.056 2.056 0 00-1.58-.86H14.25M16.5 18.75h-2.25m0-11.177v-.958c0-.568-.422-1.048-.987-1.106a48.554 48.554 0 00-10.026 0 1.106 1.106 0 00-.987 1.106v7.635m12-6.677v6.677m0 4.5v-4.5m0 0h-12",
    		tags: [
    			"delivery",
    			"shipping",
    			"transport",
    			"truck"
    		]
    	},
    	{
    		name: "Cake",
    		slug: "cake",
    		src: "M12 8.25v-1.5m0 1.5c-1.355 0-2.697.056-4.024.166C6.845 8.51 6 9.473 6 10.608v2.513m6-4.871c1.355 0 2.697.056 4.024.166C17.155 8.51 18 9.473 18 10.608v2.513M15 8.25v-1.5m-6 1.5v-1.5m12 9.75l-1.5.75a3.354 3.354 0 01-3 0 3.354 3.354 0 00-3 0 3.354 3.354 0 01-3 0 3.354 3.354 0 00-3 0 3.354 3.354 0 01-3 0L3 16.5m15-3.379a48.474 48.474 0 00-6-.371c-2.032 0-4.034.126-6 .371m12 0c.39.049.777.102 1.163.16 1.07.163 1.837 1.09 1.837 2.175v5.169c0 .621-.504 1.125-1.125 1.125H4.125A1.125 1.125 0 013 20.625v-5.169c0-1.085.768-2.012 1.837-2.175a48.041 48.041 0 011.163-.16",
    		tags: [
    			"birthday",
    			"celebrate",
    			"party",
    			"cake"
    		]
    	},
    	{
    		name: "Gift",
    		slug: "gift",
    		src: "M21 11.25v8.25a1.5 1.5 0 01-1.5 1.5H4.5a1.5 1.5 0 01-1.5-1.5v-8.25M12 4.875A2.625 2.625 0 109.375 7.5H12m0-2.625V7.5m0-2.625A2.625 2.625 0 1114.625 7.5H12m0 0V21m-8.625-9.75h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z",
    		tags: [
    			"present",
    			"reward",
    			"bonus",
    			"gift"
    		]
    	},
    	{
    		name: "Trophy",
    		slug: "trophy",
    		src: "M6 9c-1.5 0-3-1.5-3-3V5h3M18 9c1.5 0 3-1.5 3-3V5h-3M6 9V5h12v4c0 3.3-2.7 6-6 6s-6-2.7-6-6zM12 15v3M9 21h6M10 18h4",
    		tags: [
    			"award",
    			"winner",
    			"achievement",
    			"trophy"
    		]
    	},
    	{
    		name: "Medal",
    		slug: "medal",
    		src: "M7.21 15 2.66 7.14a2 2 0 0 1 .13-2.2L4.4 2.8A2 2 0 0 1 6 2h12a2 2 0 0 1 1.6.8l1.6 2.14a2 2 0 0 1 .14 2.2L16.79 15M11 12 5.12 2.2M13 12l5.88-9.8M8 7h8M12 22a5 5 0 100-10 5 5 0 000 10zM12 18v-2h-.5",
    		tags: [
    			"award",
    			"achievement",
    			"winner",
    			"medal"
    		]
    	},
    	{
    		name: "Qr Code",
    		slug: "qr-code",
    		src: "M4 3h3a1 1 0 011 1v3a1 1 0 01-1 1h-3a1 1 0 01-1-1v-3a1 1 0 011-1zM17 3h3a1 1 0 011 1v3a1 1 0 01-1 1h-3a1 1 0 01-1-1v-3a1 1 0 011-1zM4 16h3a1 1 0 011 1v3a1 1 0 01-1 1h-3a1 1 0 01-1-1v-3a1 1 0 011-1zM20 16h-2a2 2 0 00-2 2v2M12 8v2a2 2 0 01-2 2H8M4 12h0M12 4h0M16 12h5M12 21v-5",
    		tags: [
    			"scan",
    			"code",
    			"link",
    			"qr-code"
    		]
    	},
    	{
    		name: "Wifi",
    		slug: "wifi",
    		src: "M 8.25 13.5 a 3.75 3.75 0 0 1 5.25 0 m -8.25 -3 a 7.5 7.5 0 0 1 11.25 0 m -14.25 -3 a 11.25 11.25 0 0 1 17.25 0 M 11 16.5 a 1.125 1.125 0 1 0 0 2.25 a 1.125 1.125 0 0 0 0 -2.25 z",
    		tags: [
    			"internet",
    			"connection",
    			"network",
    			"wifi"
    		]
    	},
    	{
    		name: "Vr",
    		slug: "vr",
    		src: "M5 7h14a2 2 0 0 1 2 2v6a2 2 0 0 1-2 2h-4l-2.29-2.29a1 1 0 0 0-1.42 0L9 17H5a2 2 0 0 1-2-2V9a2 2 0 0 1 2-2zm2.5 3.5a1.5 1.5 0 1 0 0 3 1.5 1.5 0 0 0 0-3zm9 0a1.5 1.5 0 1 0 0 3 1.5 1.5 0 0 0 0-3z",
    		tags: [
    			"virtual reality",
    			"glasses",
    			"game",
    			"vr"
    		]
    	},
    	{
    		name: "AR",
    		slug: "ar",
    		src: "m21 7.5-2.25-1.313M21 7.5v2.25m0-2.25-2.25 1.313M3 7.5l2.25-1.313M3 7.5l2.25 1.313M3 7.5v2.25m9 3 2.25-1.313M12 12.75l-2.25-1.313M12 12.75V15m0 6.75 2.25-1.313M12 21.75V19.5m0 2.25-2.25-1.313m0-16.875L12 2.25l2.25 1.313M21 14.25v2.25l-2.25 1.313m-13.5 0L3 16.5v-2.25",
    		tags: [
    			"augmented reality",
    			"3d",
    			"ar",
    			"cube"
    		]
    	},
    	{
    		name: "Group Object",
    		slug: "group-object",
    		src: "M3 7V5c0-1.1.9-2 2-2h2M17 3h2c1.1 0 2 .9 2 2v2M21 17v2c0 1.1-.9 2-2 2h-2M7 21H5c-1.1 0-2-.9-2-2v-2M8 7h5a1 1 0 0 1 1 1v3a1 1 0 0 1-1 1H8a1 1 0 0 1-1-1V8a1 1 0 0 1 1-1ZM11 12h5a1 1 0 0 1 1 1v3a1 1 0 0 1-1 1h-5a1 1 0 0 1-1-1v-3a1 1 0 0 1 1-1Z",
    		tags: [
    			"combine",
    			"merge",
    			"group-object"
    		]
    	},
    	{
    		name: "Ungroup Object",
    		slug: "ungroup-object",
    		src: "M6 4h6a1 1 0 0 1 1 1v4a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1ZM12 14h6a1 1 0 0 1 1 1v4a1 1 0 0 1-1 1h-6a1 1 0 0 1-1-1v-4a1 1 0 0 1 1-1Z",
    		tags: [
    			"separate",
    			"split",
    			"ungroup-object"
    		]
    	},
    	{
    		name: "Align Left Object",
    		slug: "align-left-object",
    		src: "M7 4h6a1 1 0 011 1v4a1 1 0 01-1 1H7a1 1 0 01-1-1V5a1 1 0 011-1ZM12 14h6a1 1 0 011 1v4a1 1 0 01-1 1h-11a1 1 0 01-1-1v-4a1 1 0 011-1ZM3 21 3 3",
    		tags: [
    			"align",
    			"left",
    			"object"
    		]
    	},
    	{
    		name: "Align Center Object",
    		slug: "align-center-object",
    		src: "M12 4h3a1 1 0 011 1v4a1 1 0 01-1 1H9a1 1 0 01-1-1V5a1 1 0 011-1ZM12 14h6a1 1 0 011 1v4a1 1 0 01-1 1h-12a1 1 0 01-1-1v-4a1 1 0 011-1ZM12 21 12 3",
    		tags: [
    			"align",
    			"center",
    			"object"
    		]
    	},
    	{
    		name: "Align Right Object",
    		slug: "align-right-object",
    		src: "M13 4h4a1 1 0 011 1v4a1 1 0 01-1 1H11a1 1 0 01-1-1V5a1 1 0 011-1ZM12 14h5a1 1 0 011 1v4a1 1 0 01-1 1h-11a1 1 0 01-1-1v-4a1 1 0 011-1ZM21 21 21 3",
    		tags: [
    			"align",
    			"right",
    			"object"
    		]
    	},
    	{
    		name: "Align Top Object",
    		slug: "align-top-object",
    		src: "M12 15h3a1 1 0 011 1v3a1 1 0 01-1 1H9a1 1 0 01-1-1V16a1 1 0 011-1ZM12 7h6a1 1 0 011 1v3a1 1 0 01-1 1h-12a1 1 0 01-1-1v-3a1 1 0 011-1ZM21 4 3 4",
    		tags: [
    			"align",
    			"top",
    			"object"
    		]
    	},
    	{
    		name: "Align Middle Object",
    		slug: "align-middle-object",
    		src: "M12 4h6a1 1 0 011 1v3a1 1 0 01-1 1H6a1 1 0 01-1-1V5a1 1 0 011-1ZM12 15h6a1 1 0 011 1v3a1 1 0 01-1 1h-12a1 1 0 01-1-1v-3a1 1 0 011-1ZM21 12 3 12",
    		tags: [
    			"align",
    			"middle",
    			"object"
    		]
    	},
    	{
    		name: "Align Bottom Object",
    		slug: "align-bottom-object",
    		src: "M12 4h3a1 1 0 011 1v3a1 1 0 01-1 1H9a1 1 0 01-1-1V5a1 1 0 011-1ZM12 12h6a1 1 0 011 1v3a1 1 0 01-1 1h-12a1 1 0 01-1-1v-3a1 1 0 011-1ZM21 20 3 20",
    		tags: [
    			"align",
    			"bottom",
    			"object"
    		]
    	},
    	{
    		name: "Carousel",
    		slug: "carousel",
    		src: "M3 6v12M21 6v12M8 5h8a2 2 0 012 2v10a2 2 0 01-2 2H8a2 2 0 01-2-2V7a2 2 0 012-2Z",
    		tags: [
    			"senangwebs",
    			"carousel",
    			"sw-frame"
    		]
    	},
    	{
    		name: "Reel",
    		slug: "reel",
    		src: "M6 3h12M6 21h12M19 8v8a2 2 0 01-2 2H7a2 2 0 01-2-2V8a2 2 0 012-2h10a2 2 0 012 2Z",
    		tags: [
    			"video",
    			"movie",
    			"film",
    			"reel",
    			"senangwebs",
    			"sw-reel"
    		]
    	},
    	{
    		name: "Grid",
    		slug: "grid",
    		src: "M9 3v18M15 3v18M3 9h18M3 15h18M3 21h18M3 3h18M3 3v18M21 3v18",
    		tags: [
    			"layout",
    			"view",
    			"grid"
    		]
    	},
    	{
    		name: "Tic Tac Toe",
    		slug: "tic-tac-toe",
    		src: "M9 3v18 M15 3v18 M3 9h18 M3 15h18",
    		tags: [
    			"layout",
    			"view",
    			"tic-tac-toe"
    		]
    	},
    	{
    		name: "Robot",
    		slug: "robot",
    		src: "M6 6h12a2.25 2.25 0 0 1 2.25 2.25v7.5A2.25 2.25 0 0 1 18 18H6a2.25 2.25 0 0 1-2.25-2.25v-7.5A2.25 2.25 0 0 1 6 6zM12 3v3M9 3h6M8.25 12a.75.75 0 1 1 0-1.5.75.75 0 0 1 0 1.5zM15.75 12a.75.75 0 1 1 0-1.5.75.75 0 0 1 0 1.5zM9 15h6M7.5 18v3M16.5 18v3",
    		tags: [
    			"bot",
    			"ai",
    			"automation",
    			"robot"
    		]
    	},
    	{
    		name: "Chatbot",
    		slug: "chatbot",
    		src: "M6 6h12a2.25 2.25 0 012.25 2.25v7.5A2.25 2.25 0 0118 18h-6l-4 3 0-3H6a2.25 2.25 0 01-2.25-2.25v-7.5A2.25 2.25 0 016 6zM12 3v3M9 3h6M8.25 12a.75.75 0 110-1.5.75.75 0 010 1.5zM15.75 12a.75.75 0 110-1.5.75.75 0 010 1.5zM9 15h6",
    		tags: [
    			"bot",
    			"ai",
    			"support",
    			"chatbot",
    			"senangwebs",
    			"sw-chatbot"
    		]
    	},
    	{
    		name: "Arrow Left Arrow Right",
    		slug: "arrow-left-arrow-right",
    		src: "M7.5 21 3 16.5m0 0 4.5-4.5M3 16.5h13.5m0-13.5L21 7.5m0 0-4.5 4.5M21 7.5H7.5",
    		tags: [
    			"swap",
    			"exchange",
    			"switch",
    			"arrow-left-arrow-right"
    		]
    	},
    	{
    		name: "Arrow Up Arrow Down",
    		slug: "arrow-up-arrow-down",
    		src: "M3 7.5 7.5 3m0 0L12 7.5M7.5 3v13.5m13.5 0L16.5 21m0 0L12 16.5m4.5 4.5V7.5",
    		tags: [
    			"sort",
    			"swap",
    			"switch",
    			"arrow-up-arrow-down"
    		]
    	},
    	{
    		name: "Arrow Left Right",
    		slug: "arrow-left-right",
    		src: "M 3 12 h 18 M 7 16 L 3 12 l 4 -4 M 17 8 L 21 12 l -4 4",
    		tags: [
    			"swap",
    			"horizontal",
    			"arrow-left-right"
    		]
    	},
    	{
    		name: "Arrow Up Down",
    		slug: "arrow-up-down",
    		src: "M 12 3 v 18 M 8 7 L 12 3 l 4 4 M 16 17 L 12 21 l -4 -4",
    		tags: [
    			"swap",
    			"vertical",
    			"arrow-up-down"
    		]
    	},
    	{
    		name: "Arrow Up Down Left Right",
    		slug: "arrow-up-down-left-right",
    		src: "M 3 12 h 18 M 12 3 v 18 M 6 15 L 3 12 l 3 -3 M 18 9 L 21 12 l -3 3 M 9 6 L 12 3 l 3 3 M 15 18 L 12 21 l -3 -3",
    		tags: [
    			"move",
    			"all directions",
    			"arrow-up-down-left-right"
    		]
    	},
    	{
    		name: "Maximize",
    		slug: "maximize",
    		src: "M3.75 3.75v4.5m0-4.5h4.5m-4.5 0L9 9M3.75 20.25v-4.5m0 4.5h4.5m-4.5 0L9 15M20.25 3.75h-4.5m4.5 0v4.5m0-4.5L15 9m5.25 11.25h-4.5m4.5 0v-4.5m0 4.5L15 15",
    		tags: [
    			"expand",
    			"fullscreen",
    			"maximize"
    		]
    	},
    	{
    		name: "Minimize",
    		slug: "minimize",
    		src: "M4.5 9h4.5v-4.5m0 4.5L3.75 3.75M19.5 9h-4.5v-4.5m0 4.5L20.25 3.75M19.5 15h-4.5v4.5m0-4.5L20.25 20.25M4.5 15h4.5v4.5m0-4.5L3.75 20.25",
    		tags: [
    			"collapse",
    			"small",
    			"minimize"
    		]
    	},
    	{
    		name: "Layout",
    		slug: "layout",
    		src: "M3 5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5Z M3 9h18 M12 9v12",
    		tags: [
    			"dashboard",
    			"ui",
    			"grid",
    			"layout"
    		]
    	},
    	{
    		name: "Focus",
    		slug: "focus",
    		src: "M3 7V5c0-1.1.9-2 2-2h2M17 3h2c1.1 0 2 .9 2 2v2M21 17v2c0 1.1-.9 2-2 2h-2M7 21H5c-1.1 0-2-.9-2-2v-2M5 3 7 3Z",
    		tags: [
    			"focus",
    			"lock in",
    			"scan",
    			"fullscreen"
    		]
    	},
    	{
    		name: "Hourglass 0",
    		slug: "hourglass-0",
    		src: "M6 2v6h.01L6 8.01 10 12l-4 4 .01.01H6V22h12v-5.99h-.01L18 16l-4-4 4-3.99-.01-.01H18V2H6zM9 6l6 0-3 3z",
    		tags: [
    			"time",
    			"wait",
    			"loading",
    			"hourglass-0"
    		]
    	},
    	{
    		name: "Hourglass 50",
    		slug: "hourglass-50",
    		src: "M6 2v6h.01L6 8.01 10 12l-4 4 .01.01H6V22h12v-5.99h-.01L18 16l-4-4 4-3.99-.01-.01H18V2H6zM10 7l4 0-2 2zM9 18l3-1L15 18l0 1L9 19z",
    		tags: [
    			"time",
    			"wait",
    			"loading",
    			"hourglass-50"
    		]
    	},
    	{
    		name: "Hourglass 80",
    		slug: "hourglass-80",
    		src: "M6 2v6h.01L6 8.01 10 12l-4 4 .01.01H6V22h12v-5.99h-.01L18 16l-4-4 4-3.99-.01-.01H18V2H6zM11 8l2 0-1 1zM9 17l3-1L15 17l0 2L9 19z",
    		tags: [
    			"time",
    			"wait",
    			"loading",
    			"hourglass-80"
    		]
    	},
    	{
    		name: "Hourglass 100",
    		slug: "hourglass-100",
    		src: "M6 2v6h.01L6 8.01 10 12l-4 4 .01.01H6V22h12v-5.99h-.01L18 16l-4-4 4-3.99-.01-.01H18V2H6zM9 17l3-1L15 17l0 2L9 19z",
    		tags: [
    			"time",
    			"wait",
    			"loading",
    			"hourglass-100"
    		]
    	},
    	{
    		name: "Clock",
    		slug: "clock",
    		src: "M12 6V12L16 12M21 12A9 9 0 113 12 9 9 0 0121 12Z",
    		tags: [
    			"time",
    			"watch",
    			"schedule",
    			"clock",
    			"senangwebs",
    			"time",
    			"sw-epoch"
    		]
    	},
    	{
    		name: "Time Reset",
    		slug: "time-reset",
    		src: "M3.75 12a8.25 8.25 0 108.25-8.25c-2.3 0-4.5 1-6 2.5L3.75 8.5m0-4.5v4.5h4.5M12 7v5l3 0",
    		tags: [
    			"undo",
    			"history",
    			"restore",
    			"time-reset"
    		]
    	},
    	{
    		name: "Layer Stacks",
    		slug: "layer-stacks",
    		src: "M3.75 9L12 13.5 20.25 9 12 4.5 3.75 9zm0 4.5l8.25 4.5 8.25-4.5M3.75 18l8.25 4.5 8.25-4.5",
    		tags: [
    			"layers",
    			"stack",
    			"group",
    			"layer-stacks"
    		]
    	},
    	{
    		name: "Cube",
    		slug: "cube",
    		src: "M21 7.5l-9-5.25L3 7.5m18 0l-9 5.25m9-5.25v9l-9 5.25M3 7.5l9 5.25M3 7.5v9l9 5.25m0-9v9",
    		tags: [
    			"3d",
    			"block",
    			"shape",
    			"cube",
    			"senangwebs",
    			"model",
    			"sw-kiln"
    		]
    	},
    	{
    		name: "Sphere",
    		slug: "sphere",
    		src: "M21 12a9 9 0 11-18 0 9 9 0 0118 0z M3 12c0 2.5 4.5 4.5 9 4.5s9-2 9-4.5 M12 3c2.5 0 4.5 4.5 4.5 9s-2 9-4.5 9",
    		tags: [
    			"shape",
    			"round",
    			"3d",
    			"sphere"
    		]
    	},
    	{
    		name: "Cylinder",
    		slug: "cylinder",
    		src: "M21 6.5c0 1.933-4.03 3.5-9 3.5s-9-1.567-9-3.5S7.03 3 12 3s9 1.567 9 3.5z M21 6.5v11c0 1.933-4.03 3.5-9 3.5s-9-1.567-9-3.5v-11",
    		tags: [
    			"shape",
    			"round",
    			"3d",
    			"cylinder"
    		]
    	},
    	{
    		name: "Tube",
    		slug: "tube",
    		src: "M21 6.5c0 1.933-4.03 3.5-9 3.5s-9-1.567-9-3.5S7 3 12 3s9 1.567 9 3.5zM21 6.5v11c0 1.933-4.03 3.5-9 3.5s-9-1.567-9-3.5v-11M17 6.5c0 .7-2 1.5-5 1.5s-5-.8-5-1.5S9 5 12 5s5 .8 5 1.5zM17 20.4 17 9.5",
    		tags: [
    			"shape",
    			"round",
    			"3d",
    			"tube"
    		]
    	},
    	{
    		name: "Cone",
    		slug: "cone",
    		src: "M21 19c0 1-3 3-9 3s-9-2-9-3c0-1 3-3 9-3s9 2 9 3zM3 19 12 3l9 16",
    		tags: [
    			"shape",
    			"triangle",
    			"3d",
    			"cone"
    		]
    	},
    	{
    		name: "Pyramid",
    		slug: "pyramid",
    		src: "M12 3l9.75 15-9.75 3-9.75-3L12 3z M12 3v18",
    		tags: [
    			"shape",
    			"triangle",
    			"3d",
    			"pyramid"
    		]
    	},
    	{
    		name: "Polygon",
    		slug: "polygon",
    		src: "M8 3l8 0L22 7 16 11 8 11 2 7 8 3M22 7v10M2 7v10M16 11v10M8 11v10M2 17l6 4L16 21 22 17",
    		tags: [
    			"shape",
    			"polygon",
    			"3d",
    			"polygon"
    		]
    	},
    	{
    		name: "Torus",
    		slug: "torus",
    		src: "M12 5c5 0 8.7 3 9 6s-1.5 8-9 8-9.3-5-9-8 4-6 9-6zM12 8c2.5 0 4.4 1.3 4.5 3s-2 3-4.5 3-4.6-1.3-4.5-3 2-3 4.5-3z",
    		tags: [
    			"shape",
    			"donut",
    			"3d",
    			"torus",
    			"ring"
    		]
    	},
    	{
    		name: "Plane",
    		slug: "plane",
    		src: "M2 12l10 5 10-5-10-5-10 5zM2 12",
    		tags: [
    			"shape",
    			"flat",
    			"3d",
    			"plane",
    			"surface",
    			"floor"
    		]
    	},
    	{
    		name: "Wedge",
    		slug: "wedge",
    		src: "M3 21H17L3 7V21ZM3 7 17 21m0 0 4-5M3 7 8 3M8 3 21 16",
    		tags: [
    			"shape",
    			"triangle",
    			"3d",
    			"wedge",
    			"ramp"
    		]
    	},
    	{
    		name: "Roof",
    		slug: "roof",
    		src: "M10 7 3 19h14L10 7zM10 7 14 5 21 17 17 19",
    		tags: [
    			"shape",
    			"prism",
    			"3d",
    			"roof",
    			"house"
    		]
    	},
    	{
    		name: "Cylinder Half",
    		slug: "cylinder-half",
    		src: "M3 5a9 3 0 0 1 18 0H3zM3 5v14h18V5M3 19h18",
    		tags: [
    			"shape",
    			"half",
    			"3d",
    			"cylinder-half",
    			"cut"
    		]
    	},
    	{
    		name: "Sphere Half",
    		slug: "sphere-half",
    		src: "M3 14a9 9 0 0118 0v2c0 1-4 3-9 3s-9-2-9-3v-2zM12 13c-5 0-9 2-9 3S7 19 12 19s9-2 9-3-4-3-9-3",
    		tags: [
    			"shape",
    			"hemisphere",
    			"3d",
    			"sphere-half",
    			"dome"
    		]
    	},
    	{
    		name: "Heart Extruded",
    		slug: "heart-extruded",
    		src: "M12 5c-1-1.5-2.5-2-4-2C5.5 3 4 4.5 4 7c0 2 1.5 4 8 9 6.5-5 8-7 8-9 0-2.5-1.5-4-4-4-1.5 0-3 .5-4 2zM4 7v5c0 2 1.5 4 8 9v-5M20 7v5c0 2-1.5 4-8 9",
    		tags: [
    			"shape",
    			"love",
    			"3d",
    			"heart-extruded",
    			"valentine"
    		]
    	},
    	{
    		name: "Torus Knot",
    		slug: "torus-knot",
    		src: "M20.8 12.0 L20.7 13.2 L20.3 14.4 L19.7 15.4 L18.9 16.4 L18.0 17.1 L17.0 17.6 L15.9 17.9 L14.8 18.1 L13.8 18.0 L12.9 17.8 L12.1 17.6 L11.3 17.2 L10.7 16.8 L10.1 16.5 L9.7 16.1 L9.2 15.8 L8.7 15.6 L8.3 15.3 L7.7 15.1 L7.2 14.8 L6.5 14.4 L5.9 14.0 L5.2 13.5 L4.6 12.8 L4.0 12.0 L3.5 11.1 L3.2 10.0 L3.1 8.9 L3.2 7.7 L3.5 6.6 L4.1 5.5 L4.8 4.5 L5.8 3.7 L6.8 3.2 L8.0 2.8 L9.2 2.7 L10.4 2.9 L11.6 3.2 L12.6 3.8 L13.4 4.5 L14.1 5.3 L14.7 6.2 L15.0 7.1 L15.2 8.0 L15.3 8.9 L15.3 9.6 L15.3 10.3 L15.3 10.9 L15.2 11.5 L15.2 12.0 L15.2 12.5 L15.3 13.1 L15.3 13.7 L15.3 14.4 L15.3 15.1 L15.2 16.0 L15.0 16.9 L14.7 17.8 L14.1 18.7 L13.4 19.5 L12.6 20.2 L11.6 20.8 L10.4 21.1 L9.2 21.3 L8.0 21.2 L6.8 20.8 L5.8 20.3 L4.8 19.5 L4.1 18.5 L3.5 17.4 L3.2 16.3 L3.1 15.1 L3.2 14.0 L3.5 12.9 L4.0 12.0 L4.6 11.2 L5.2 10.5 L5.9 10.0 L6.5 9.6 L7.2 9.2 L7.7 8.9 L8.3 8.7 L8.7 8.4 L9.2 8.2 L9.7 7.9 L10.1 7.5 L10.7 7.2 L11.3 6.8 L12.1 6.4 L12.9 6.2 L13.8 6.0 L14.8 5.9 L15.9 6.1 L17.0 6.4 L18.0 6.9 L18.9 7.6 L19.7 8.6 L20.3 9.6 L20.7 10.8 L20.8 12.0Z",
    		tags: [
    			"shape",
    			"knot",
    			"3d",
    			"torus-knot",
    			"twisted"
    		]
    	},
    	{
    		name: "Tetrahedron",
    		slug: "tetrahedron",
    		src: "M12 3l9 18H3L12 3zM12 3v12M12 15l-9 6M12 15l9 6",
    		tags: [
    			"shape",
    			"pyramid",
    			"3d",
    			"tetrahedron",
    			"platonic"
    		]
    	},
    	{
    		name: "Octahedron",
    		slug: "octahedron",
    		src: "M12 2 L22 12 L12 22 L2 12 Z M12 2 L12 14 L22 12 M12 22 L12 14 L2 12",
    		tags: [
    			"shape",
    			"diamond",
    			"3d",
    			"octahedron",
    			"platonic"
    		]
    	},
    	{
    		name: "Icosahedron",
    		slug: "icosahedron",
    		src: "M12 2L21 7L21 17L12 22L3 17L3 7L12 2Z M12 22V15 M12 15L7 9L17 9L12 15Z M12 2L7 9 M12 2L17 9 M21 7L17 9 M21 17L17 9 M21 17L12 15 M3 17L12 15 M3 17L7 9 M3 7L7 9",
    		tags: [
    			"shape",
    			"poly",
    			"3d",
    			"icosahedron",
    			"platonic"
    		]
    	},
    	{
    		name: "Dodecahedron",
    		slug: "dodecahedron",
    		src: "M12 3 18 6 21 11 20 17 18 21H6L4 17 3 11 6 6zM12 3v6M12 9l-6 5M12 9l6 5M6 14l2 7M18 14l-2 7M18 14 21 11M6 14 3 11",
    		tags: [
    			"shape",
    			"pentagon",
    			"3d",
    			"dodecahedron",
    			"platonic"
    		]
    	},
    	{
    		name: "Sparkles",
    		slug: "sparkles",
    		src: "M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456zM16.894 20.567L16.5 21.75l-.394-1.183a2.25 2.25 0 00-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 001.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 001.423 1.423l1.183.394-1.183.394a2.25 2.25 0 00-1.423 1.423z",
    		tags: [
    			"ai",
    			"magic",
    			"new",
    			"sparkles",
    			"senangwebs",
    			"motion",
    			"sw-animations"
    		]
    	},
    	{
    		name: "Magic Wand",
    		slug: "magic-wand",
    		src: "m21.64 3.64-1.28-1.28a1.21 1.21 0 00-1.72 0L2.36 18.64a1.21 1.21 0 000 1.72l1.28 1.28a1.2 1.2 0 001.72 0L21.64 5.36a1.2 1.2 0 000-1.72M10.5 10.5l3 3M5 6v4M19 15v4M10 3v2M7 8H3M21 17h-4M11 4H9",
    		tags: [
    			"magic",
    			"wizard",
    			"spell",
    			"magic-wand"
    		]
    	},
    	{
    		name: "Contrast",
    		slug: "contrast",
    		src: "M12 2.25a9.75 9.75 0 010 19.5m0-19.5a9.75 9.75 0 000 19.5m0-19.5v19.5M8.7 2.827V21.211M5.5 4.736V19.263",
    		tags: [
    			"display",
    			"accessibility",
    			"contrast"
    		]
    	},
    	{
    		name: "Cursor",
    		slug: "cursor",
    		src: "M3 3l7.07 16.97 2.51-7.39 7.39-2.51L3 3z",
    		tags: [
    			"pointer",
    			"mouse",
    			"click",
    			"cursor"
    		]
    	},
    	{
    		name: "Square",
    		slug: "square",
    		src: "M4 4h16v16H4z",
    		tags: [
    			"shape",
    			"box",
    			"square"
    		]
    	},
    	{
    		name: "Rectangle",
    		slug: "rectangle",
    		src: "M3 5h18v14H3z",
    		tags: [
    			"shape",
    			"box",
    			"rectangle"
    		]
    	},
    	{
    		name: "Circle",
    		slug: "circle",
    		src: "M21 12a9 9 0 11-18 0 9 9 0 0118 0z",
    		tags: [
    			"shape",
    			"round",
    			"circle"
    		]
    	},
    	{
    		name: "Diamond",
    		slug: "diamond",
    		src: "M12 3l9 9-9 9-9-9 9-9z",
    		tags: [
    			"shape",
    			"rhombus",
    			"diamond"
    		]
    	},
    	{
    		name: "Hexagon",
    		slug: "hexagon",
    		src: "M12 2l7 4v8l-7 4-7-4V6l7-4z",
    		tags: [
    			"shape",
    			"polygon",
    			"hexagon"
    		]
    	},
    	{
    		name: "Draw Line",
    		slug: "draw-line",
    		src: "M3 21 21 3",
    		tags: [
    			"edit",
    			"write",
    			"draw",
    			"line",
    			"draw-line"
    		]
    	},
    	{
    		name: "Draw Curve",
    		slug: "draw-curve",
    		src: "M3 21C6 4 18 20 21 3",
    		tags: [
    			"draw",
    			"curve",
    			"line",
    			"s-curve"
    		]
    	},
    	{
    		name: "Pencil",
    		slug: "pencil",
    		src: "M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L6.832 19.82a4.5 4.5 0 01-1.897 1.13l-2.685.8.8-2.685a4.5 4.5 0 011.13-1.897L16.863 4.487zm0 0L19.5 7.125",
    		tags: [
    			"edit",
    			"write",
    			"draw",
    			"pencil"
    		]
    	},
    	{
    		name: "Eraser",
    		slug: "eraser",
    		src: "M21 21H8a2 2 0 0 1-1.42-.587l-3.994-3.999a2 2 0 0 1 0-2.828l10-10a2 2 0 0 1 2.829 0l5.999 6a2 2 0 0 1 0 2.828L12.834 21M5.082 11.09l8.828 8.828",
    		tags: [
    			"delete",
    			"remove",
    			"clear",
    			"eraser"
    		]
    	},
    	{
    		name: "Scissor",
    		slug: "scissor",
    		src: "M6 3A3 3 0 116 9 3 3 0 116 3M8.12 8.12 19 19M19 5 8.12 15.88M6 15A3 3 0 116 21 3 3 0 116 15M10 14 10 10",
    		tags: [
    			"cut",
    			"tool",
    			"scissor",
    			"senangwebs",
    			"sw-photobooth"
    		]
    	},
    	{
    		name: "Font",
    		slug: "font",
    		src: "M4 20.3h4M6 20.25l6-16.5 6 16.5M8 15h8M16 20.3h4",
    		tags: [
    			"text",
    			"typography",
    			"letter",
    			"font"
    		]
    	},
    	{
    		name: "Text",
    		slug: "text",
    		src: "M12 20.25V3.8M5.2 5.5 5.2 3.8h13.6L18.8 5.5M10 20.3h4",
    		tags: [
    			"text",
    			"typography",
    			"letter",
    			"type"
    		]
    	},
    	{
    		name: "Text Align Center",
    		slug: "text-align-center",
    		src: "M3.75 5h16.5M5.625 9h12.75M3.75 13h16.5M5.625 17h12.75",
    		tags: [
    			"format",
    			"paragraph",
    			"text-align-center"
    		]
    	},
    	{
    		name: "Text Align Left",
    		slug: "text-align-left",
    		src: "M3.75 5h16.5M3.75 9h12.75M3.75 13h16.5M3.75 17h12.75",
    		tags: [
    			"format",
    			"paragraph",
    			"text-align-left"
    		]
    	},
    	{
    		name: "Text Align Right",
    		slug: "text-align-right",
    		src: "M3.75 5h16.5M7.5 9h12.75M3.75 13h16.5M7.5 17h12.75",
    		tags: [
    			"format",
    			"paragraph",
    			"text-align-right"
    		]
    	},
    	{
    		name: "Text Align Justify",
    		slug: "text-align-justify",
    		src: "M3.75 5h16.5M3.75 9h16.5M3.75 13h16.5M3.75 17h16.5",
    		tags: [
    			"format",
    			"paragraph",
    			"text-align-justify"
    		]
    	},
    	{
    		name: "Sliders Horizontal",
    		slug: "sliders-horizontal",
    		src: "M6 13.5V3.75m0 9.75a1.5 1.5 0 0 1 0 3m0-3a1.5 1.5 0 0 0 0 3m0 3.75V16.5m12-3V3.75m0 9.75a1.5 1.5 0 0 1 0 3m0-3a1.5 1.5 0 0 0 0 3m0 3.75V16.5m-6-9V3.75m0 3.75a1.5 1.5 0 0 1 0 3m0-3a1.5 1.5 0 0 0 0 3m0 9.75V10.5",
    		tags: [
    			"settings",
    			"filters",
    			"adjust",
    			"sliders-horizontal"
    		]
    	},
    	{
    		name: "Sliders Vertical",
    		slug: "sliders-vertical",
    		src: "M13.5 6H3.75m9.75 0a1.5 1.5 0 0 1 3 0m-3 0a1.5 1.5 0 0 0 3 0m3.75 0H16.5m-3 12H3.75m9.75 0a1.5 1.5 0 0 1 3 0m-3 0a1.5 1.5 0 0 0 3 0m3.75 0H16.5m-9-6H3.75m3.75 0a1.5 1.5 0 0 1 3 0m-3 0a1.5 1.5 0 0 0 3 0m9.75 0H10.5",
    		tags: [
    			"settings",
    			"filters",
    			"adjust",
    			"sliders-vertical"
    		]
    	}
    ];

    // UI Controller - Handles DOM manipulation and rendering


    let UIController$1 = class UIController {
      constructor(editor) {
        this.editor = editor;
        this.sceneList = document.getElementById("sceneList");
        this.hotspotList = document.getElementById("hotspotList");
        this.draggedElement = null;
      }

      /**
       * Render scene list
       */
      renderSceneList() {
        if (!this.sceneList) return;

        this.sceneList.innerHTML = "";
        const scenes = this.editor.sceneManager.getAllScenes();
        const currentIndex = this.editor.sceneManager.currentSceneIndex;

        if (scenes.length === 0) {
          const empty = document.createElement("div");
          empty.className = "empty-state";
          empty.innerHTML = `
                <p>No scenes yet</p>
                <p class="hint">Click "Add Scene" to upload a 360° panorama</p>
            `;
          this.sceneList.appendChild(empty);
          return;
        }

        scenes.forEach((scene, index) => {
          const card = this.createSceneCard(scene, index, index === currentIndex);
          this.sceneList.appendChild(card);
        });
      }

      /**
       * Create scene card element
       */
      createSceneCard(scene, index, isActive) {
        const card = document.createElement("div");
        card.className = "scene-card" + (isActive ? " active" : "");
        card.draggable = true;
        card.dataset.index = index;

        // Drag handle
        const dragHandle = document.createElement("div");
        dragHandle.className = "drag-handle";
        dragHandle.innerHTML =
          '<ss-icon icon="arrow-up-down-left-right" thickness="2.2"></ss-icon>';

        // Thumbnail
        const thumbnail = document.createElement("img");
        thumbnail.src = scene.thumbnail || scene.imageUrl;
        thumbnail.alt = scene.name;

        // Info
        const info = document.createElement("div");
        info.className = "scene-info";

        const name = document.createElement("div");
        name.className = "scene-name";
        name.textContent = scene.name;

        const meta = document.createElement("div");
        meta.className = "scene-meta";
        meta.textContent = `${scene.hotspots.length} hotspot${
      scene.hotspots.length !== 1 ? "s" : ""
    }`;

        info.appendChild(name);
        info.appendChild(meta);

        // Actions
        const actions = document.createElement("div");
        actions.className = "scene-actions";

        const deleteBtn = document.createElement("button");
        deleteBtn.className = "btn-icon";
        deleteBtn.innerHTML = '<ss-icon icon="trash" thickness="2.2"></ss-icon>';
        deleteBtn.title = "Delete scene";
        deleteBtn.onclick = (e) => {
          e.stopPropagation();
          this.editor.removeScene(index);
        };

        actions.appendChild(deleteBtn);

        card.appendChild(dragHandle);
        card.appendChild(thumbnail);
        card.appendChild(info);
        card.appendChild(actions);

        // Click handler
        card.onclick = () => {
          this.editor.selectScene(index);
        };

        // Drag and drop handlers
        this.setupDragAndDrop(card);

        return card;
      }

      /**
       * Setup drag and drop for scene reordering
       */
      setupDragAndDrop(card) {
        card.addEventListener("dragstart", (e) => {
          this.draggedElement = card;
          card.classList.add("dragging");
          e.dataTransfer.effectAllowed = "move";
        });

        card.addEventListener("dragend", () => {
          card.classList.remove("dragging");
          this.draggedElement = null;
        });

        card.addEventListener("dragover", (e) => {
          e.preventDefault();
          e.dataTransfer.dropEffect = "move";

          if (this.draggedElement && this.draggedElement !== card) {
            const bounding = card.getBoundingClientRect();
            const offset = bounding.y + bounding.height / 2;

            if (e.clientY - offset > 0) {
              card.style.borderBottom = "2px solid var(--accent-color)";
              card.style.borderTop = "";
            } else {
              card.style.borderTop = "2px solid var(--accent-color)";
              card.style.borderBottom = "";
            }
          }
        });

        card.addEventListener("dragleave", () => {
          card.style.borderTop = "";
          card.style.borderBottom = "";
        });

        card.addEventListener("drop", (e) => {
          e.preventDefault();
          card.style.borderTop = "";
          card.style.borderBottom = "";

          if (this.draggedElement && this.draggedElement !== card) {
            const fromIndex = parseInt(this.draggedElement.dataset.index);
            const toIndex = parseInt(card.dataset.index);
            this.editor.reorderScenes(fromIndex, toIndex);
          }
        });
      }

      /**
       * Render hotspot list
       */
      renderHotspotList() {
        if (!this.hotspotList) return;

        this.hotspotList.innerHTML = "";
        const hotspots = this.editor.hotspotEditor.getAllHotspots();
        const currentIndex = this.editor.hotspotEditor.currentHotspotIndex;

        if (hotspots.length === 0) {
          const empty = document.createElement("div");
          empty.className = "empty-state";
          empty.textContent = 'No hotspots. Click "Add Hotspot" to create one.';
          this.hotspotList.appendChild(empty);
          return;
        }

        hotspots.forEach((hotspot, index) => {
          const item = this.createHotspotItem(
            hotspot,
            index,
            index === currentIndex
          );
          this.hotspotList.appendChild(item);
        });
      }

      /**
       * Create hotspot list item
       */
      createHotspotItem(hotspot, index, isActive) {
        const item = document.createElement("div");
        item.className = "hotspot-item" + (isActive ? " active" : "");

        const colorIndicator = document.createElement("div");
        colorIndicator.className = "hotspot-color";
        colorIndicator.style.backgroundColor = hotspot.color;
        
        // If hotspot has an icon, show it with the color applied
        if (hotspot.icon) {
          colorIndicator.innerHTML = `<ss-icon icon="${hotspot.icon}" thickness="2.2" style="color: ${hotspot.color}; width: 20px; height: 20px;"></ss-icon>`;
          colorIndicator.style.backgroundColor = "transparent";
          colorIndicator.style.display = "flex";
          colorIndicator.style.alignItems = "center";
          colorIndicator.style.justifyContent = "center";
        }

        const info = document.createElement("div");
        info.className = "hotspot-info";

        const title = document.createElement("div");
        title.className = "hotspot-title";
        title.textContent = hotspot.title || "Untitled Hotspot";

        const target = document.createElement("div");
        target.className = "hotspot-target";
        if (hotspot.targetSceneId) {
          const targetScene = this.editor.sceneManager.getSceneById(
            hotspot.targetSceneId
          );
          target.textContent = targetScene
            ? `→ ${targetScene.name}`
            : `→ ${hotspot.targetSceneId}`;
        } else {
          target.textContent = "No target";
        }

        info.appendChild(title);
        info.appendChild(target);

        const actions = document.createElement("div");
        actions.className = "hotspot-actions";

        const deleteBtn = document.createElement("button");
        deleteBtn.className = "btn-delete";
        deleteBtn.innerHTML = '<ss-icon icon="trash" thickness="2.2"></ss-icon>';
        deleteBtn.title = "Delete";
        deleteBtn.onclick = (e) => {
          e.stopPropagation();
          this.editor.removeHotspot(index);
        };

        actions.appendChild(deleteBtn);

        item.appendChild(colorIndicator);
        item.appendChild(info);
        item.appendChild(actions);

        item.onclick = () => {
          this.editor.selectHotspot(index);
        };

        return item;
      }

      /**
       * Set active state on icon grid button
       */
      setActiveIconButton(iconName) {
        const grid = document.getElementById("hotspotIconGrid");
        if (!grid) return;
        
        // Remove active from all buttons
        grid.querySelectorAll(".icon-btn").forEach(btn => {
          btn.classList.remove("active");
        });
        
        // Find and activate the matching button
        const activeBtn = grid.querySelector(`.icon-btn[data-icon="${iconName}"]`);
        if (activeBtn) {
          activeBtn.classList.add("active");
        }
      }

      /**
       * Populate icon grid from SenangStart icons (baked in at build time)
       */
      populateIconGrid() {
        const grid = document.getElementById("hotspotIconGrid");
        if (!grid) return;

        // Clear existing content
        grid.innerHTML = "";

        // Add "No icon" button first
        const noIconBtn = document.createElement("button");
        noIconBtn.type = "button";
        noIconBtn.className = "icon-btn active";
        noIconBtn.dataset.icon = "";
        noIconBtn.title = "No icon";
        noIconBtn.innerHTML = '<ss-icon icon="x-mark" thickness="1.5" style="opacity: 0.5;"></ss-icon>';
        grid.appendChild(noIconBtn);

        // Add buttons for each icon from imported JSON
        iconsData.forEach(icon => {
          const btn = document.createElement("button");
          btn.type = "button";
          btn.className = "icon-btn";
          btn.dataset.icon = icon.slug;
          btn.title = icon.name;
          btn.innerHTML = `<ss-icon icon="${icon.slug}" thickness="2.2"></ss-icon>`;
          grid.appendChild(btn);
        });

        console.log(`Loaded ${iconsData.length} icons`);
      }

      /**
       * Update properties panel for hotspot
       */
      updateHotspotProperties(hotspot) {
        const hotspotAll = document.getElementById("hotspotAll");
        const hotspotProperties = document.getElementById("hotspotProperties");

        if (!hotspot) {
          // No hotspot selected - show list, hide properties
          if (hotspotAll) hotspotAll.style.display = "block";
          if (hotspotProperties) hotspotProperties.style.display = "none";

          // Clear form
          document.getElementById("hotspotTitle").value = "";
          document.getElementById("hotspotDescription").value = "";
          document.getElementById("hotspotTarget").value = "";
          document.getElementById("hotspotColor").value = "#00ff00";
          const colorText = document.getElementById("hotspotColorText");
          if (colorText) colorText.value = "#00ff00";
          // Reset icon grid to "no icon" button
          this.setActiveIconButton("");
          document.getElementById("hotspotPosX").value = "";
          document.getElementById("hotspotPosY").value = "";
          document.getElementById("hotspotPosZ").value = "";
          return;
        }

        // Hotspot selected - show both list and properties
        if (hotspotAll) hotspotAll.style.display = "block";
        if (hotspotProperties) hotspotProperties.style.display = "block";

        document.getElementById("hotspotTitle").value = hotspot.title || "";
        document.getElementById("hotspotDescription").value =
          hotspot.description || "";
        document.getElementById("hotspotTarget").value =
          hotspot.targetSceneId || "";
        document.getElementById("hotspotColor").value = hotspot.color || "#00ff00";

        // Update color text input if it exists
        const colorText = document.getElementById("hotspotColorText");
        if (colorText) {
          colorText.value = hotspot.color || "#00ff00";
        }

        // Update icon grid active button
        this.setActiveIconButton(hotspot.icon || "");

        // Update position inputs
        const pos = hotspot.position || { x: 0, y: 0, z: 0 };
        document.getElementById("hotspotPosX").value = pos.x;
        document.getElementById("hotspotPosY").value = pos.y;
        document.getElementById("hotspotPosZ").value = pos.z;

        // Update target dropdown
        this.updateTargetSceneOptions();
      }

      /**
       * Update properties panel for scene
       */
      updateSceneProperties(scene) {
        const startingPosDisplay = document.getElementById("startingPositionDisplay");
        
        if (!scene) {
          document.getElementById("sceneId").value = "";
          document.getElementById("sceneName").value = "";
          document.getElementById("sceneImageUrl").value = "";
          if (startingPosDisplay) {
            startingPosDisplay.textContent = "Not set (camera keeps current position)";
          }
          return;
        }

        document.getElementById("sceneId").value = scene.id || "";
        document.getElementById("sceneName").value = scene.name || "";
        document.getElementById("sceneImageUrl").value = scene.imageUrl || "";
        
        // Update starting position display
        if (startingPosDisplay) {
          if (scene.startingPosition) {
            const pitchDeg = (scene.startingPosition.pitch * 180 / Math.PI).toFixed(1);
            const yawDeg = (scene.startingPosition.yaw * 180 / Math.PI).toFixed(1);
            startingPosDisplay.textContent = `Pitch: ${pitchDeg}° | Yaw: ${yawDeg}°`;
            startingPosDisplay.style.color = "var(--accent-primary)";
          } else {
            startingPosDisplay.textContent = "Not set (camera keeps current position)";
            startingPosDisplay.style.color = "var(--text-muted)";
          }
        }
      }

      /**
       * Update properties panel for tour
       */
      updateTourProperties(config) {
        document.getElementById("tourTitle").value = config.title || "";
        document.getElementById("tourDescription").value = config.description || "";
        document.getElementById("tourInitialScene").value =
          config.initialSceneId || "";

        // Also update project name in header if it exists
        const projectName = document.getElementById("project-name");
        if (projectName) {
          projectName.value = config.title || "";
        }
      }

      /**
       * Update target scene options in hotspot properties
       */
      updateTargetSceneOptions() {
        const select = document.getElementById("hotspotTarget");
        if (!select) return;

        const scenes = this.editor.sceneManager.getAllScenes();
        const currentValue = select.value;

        select.innerHTML = '<option value="">Select target scene...</option>';

        scenes.forEach((scene) => {
          const option = document.createElement("option");
          option.value = scene.id;
          option.textContent = scene.name;
          select.appendChild(option);
        });

        select.value = currentValue;
      }

      /**
       * Update initial scene options in tour properties
       */
      updateInitialSceneOptions() {
        const select = document.getElementById("tourInitialScene");
        if (!select) return;

        const scenes = this.editor.sceneManager.getAllScenes();
        const currentValue = select.value;

        select.innerHTML = '<option value="">Select initial scene...</option>';

        scenes.forEach((scene) => {
          const option = document.createElement("option");
          option.value = scene.id;
          option.textContent = scene.name;
          select.appendChild(option);
        });

        select.value = currentValue;
      }

      /**
       * Show/hide loading indicator
       */
      setLoading(isLoading) {
        const indicator = document.querySelector(".loading-indicator");
        if (indicator) {
          indicator.style.display = isLoading ? "block" : "none";
        }
      }

      /**
       * Switch properties tab
       */
      switchTab(tabName) {
        // Update tab buttons
        document.querySelectorAll(".tab-btn").forEach((btn) => {
          btn.classList.toggle("active", btn.dataset.tab === tabName);
        });

        // Update tab content
        document.querySelectorAll(".tab-content").forEach((content) => {
          content.classList.toggle("active", content.id === tabName + "Tab");
        });
      }
    };

    /**
     * IconRenderer - Converts SenangStart icon names to image data URLs for A-Frame
     */
    class IconRenderer {
      constructor() {
        this.iconCache = new Map();
        this.renderContainer = null;
      }

      /**
       * Initialize the hidden render container
       */
      init() {
        if (this.renderContainer) return;
        
        this.renderContainer = document.createElement('div');
        this.renderContainer.id = 'swt-icon-renderer';
        this.renderContainer.style.cssText = `
      position: absolute;
      left: -9999px;
      top: -9999px;
      width: 128px;
      height: 128px;
      pointer-events: none;
      visibility: hidden;
    `;
        document.body.appendChild(this.renderContainer);
      }

      /**
       * Generate an image data URL from a SenangStart icon
       * @param {string} iconName - SenangStart icon name (e.g., 'arrow-right')
       * @param {string} color - Hex color for the icon
       * @param {number} size - Size in pixels (default 128)
       * @returns {Promise<string>} - Data URL of the icon image
       */
      async generateIconDataUrl(iconName, color = '#ffffff', size = 128) {
        const cacheKey = `${iconName}-${color}-${size}`;
        
        if (this.iconCache.has(cacheKey)) {
          return this.iconCache.get(cacheKey);
        }

        this.init();

        return new Promise((resolve, reject) => {
          // Create the ss-icon element
          this.renderContainer.innerHTML = `
        <ss-icon 
          icon="${iconName}" 
          thickness="2.5" 
          style="color: ${color}; width: ${size}px; height: ${size}px; display: block;"
        ></ss-icon>
      `;

          // Wait for the custom element to render
          setTimeout(() => {
            try {
              const ssIcon = this.renderContainer.querySelector('ss-icon');
              if (!ssIcon || !ssIcon.shadowRoot) {
                console.warn(`Icon ${iconName} not rendered properly`);
                resolve(null);
                return;
              }

              // Get the SVG from shadow root
              const svg = ssIcon.shadowRoot.querySelector('svg');
              if (!svg) {
                console.warn(`SVG not found for icon ${iconName}`);
                resolve(null);
                return;
              }

              // Clone and prepare SVG
              const svgClone = svg.cloneNode(true);
              svgClone.setAttribute('width', size);
              svgClone.setAttribute('height', size);
              svgClone.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
              
              // Apply the color to all paths/elements
              svgClone.querySelectorAll('path, circle, rect, line, polyline, polygon').forEach(el => {
                el.setAttribute('stroke', color);
                // Keep fill as currentColor if it's set
                const fill = el.getAttribute('fill');
                if (fill && fill !== 'none') {
                  el.setAttribute('fill', color);
                }
              });

              // Convert SVG to data URL
              const svgString = new XMLSerializer().serializeToString(svgClone);
              const dataUrl = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgString)));
              
              // Cache the result
              this.iconCache.set(cacheKey, dataUrl);
              
              resolve(dataUrl);
            } catch (error) {
              console.error('Error generating icon data URL:', error);
              resolve(null);
            }
          }, 100); // Wait for custom element to render
        });
      }

      /**
       * Clear the icon cache
       */
      clearCache() {
        this.iconCache.clear();
      }

      /**
       * Destroy the renderer
       */
      destroy() {
        if (this.renderContainer && this.renderContainer.parentNode) {
          this.renderContainer.parentNode.removeChild(this.renderContainer);
        }
        this.renderContainer = null;
        this.iconCache.clear();
      }
    }

    // Export Manager - Handles JSON generation for SWT library

    let ExportManager$1 = class ExportManager {
      constructor(editor) {
        this.editor = editor;
        this.iconRenderer = new IconRenderer();
      }

      /**
       * Generate JSON compatible with SWT library
       * Follows the tourConfig structure from example-simple.html
       */
      generateJSON() {
        const scenes = this.editor.sceneManager.getAllScenes();
        const config = this.editor.config;

        // Build scenes object (keyed by scene ID)
        const scenesData = {};
        scenes.forEach((scene) => {
          scenesData[scene.id] = {
            name: scene.name,
            panorama: scene.imageUrl,
            hotspots: scene.hotspots.map((hotspot) => {
              const hotspotData = {
                position: hotspot.position,
              };

              // Add action based on hotspot type
              if (hotspot.type === "navigation" && hotspot.targetSceneId) {
                hotspotData.action = {
                  type: "navigateTo",
                  target: hotspot.targetSceneId,
                };
              } else if (hotspot.type === "info") {
                hotspotData.action = {
                  type: "showInfo",
                };
              }

              // Add appearance
              hotspotData.appearance = {
                color: hotspot.color || "#FF6B6B",
                scale: hotspot.scale || "2 2 2",
              };
              
              // Add icon if set
              if (hotspot.icon) {
                hotspotData.appearance.icon = hotspot.icon;
              }

              // Add tooltip if title exists
              if (hotspot.title) {
                hotspotData.tooltip = {
                  text: hotspot.title,
                };
              }

              return hotspotData;
            }),
          };
          
          // Add starting position if set
          if (scene.startingPosition) {
            scenesData[scene.id].startingPosition = scene.startingPosition;
          }
        });

        // Determine initial scene
        let initialScene = config.initialSceneId;
        if (!initialScene && scenes.length > 0) {
          initialScene = scenes[0].id;
        }

        // Build final JSON matching SWT tourConfig format
        const jsonData = {
          initialScene: initialScene,
          scenes: scenesData,
        };

        return jsonData;
      }

      /**
       * Generate JSON with icons baked in as SVG data URLs
       * This ensures the exported HTML doesn't need the SenangStart icons library
       */
      async generateJSONWithBakedIcons() {
        const jsonData = this.generateJSON();
        
        // Process all scenes and convert icon names to data URLs
        for (const sceneId of Object.keys(jsonData.scenes)) {
          const scene = jsonData.scenes[sceneId];
          
          for (let i = 0; i < scene.hotspots.length; i++) {
            const hotspot = scene.hotspots[i];
            const icon = hotspot.appearance?.icon;
            
            // Skip if no icon or if it's already a data URL or URL
            if (!icon) continue;
            if (icon.startsWith('data:') || icon.startsWith('http') || icon.startsWith('/')) continue;
            
            // Generate SVG data URL from icon name
            try {
              const color = hotspot.appearance?.color || '#ffffff';
              const dataUrl = await this.iconRenderer.generateIconDataUrl(icon, color, 128);
              if (dataUrl) {
                hotspot.appearance.icon = dataUrl;
              }
            } catch (err) {
              console.warn(`Failed to bake icon "${icon}" for export:`, err);
            }
          }
        }
        
        return jsonData;
      }

      /**
       * Export as JSON file
       */
      exportJSON() {
        try {
          const jsonData = this.generateJSON();
          const json = JSON.stringify(jsonData, null, 2);

          const title = this.editor.config.title || "tour";
          const filename = sanitizeId(title) + ".json";
          downloadTextAsFile(json, filename);

          showToast("Tour exported successfully", "success");
          return true;
        } catch (error) {
          console.error("Export failed:", error);
          showToast("Export failed", "error");
          return false;
        }
      }

      /**
       * Copy JSON to clipboard
       */
      async copyJSON() {
        try {
          const jsonData = this.generateJSON();
          const json = JSON.stringify(jsonData, null, 2);

          const success = await copyToClipboard(json);
          if (success) {
            showToast("JSON copied to clipboard", "success");
          } else {
            showToast("Failed to copy to clipboard", "error");
          }
          return success;
        } catch (error) {
          console.error("Copy failed:", error);
          showToast("Copy failed", "error");
          return false;
        }
      }

      /**
       * Generate HTML viewer code with icons baked in
       */
      async generateViewerHTML() {
        const jsonData = await this.generateJSONWithBakedIcons();
        const title = this.editor.config.title || "Virtual Tour";

        return `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${title}</title>
    <script src="https://unpkg.com/senangwebs-tour@latest/dist/swt.min.js"></script>
  </head>
  <body>
    <a-scene id="tour-container">
      <a-camera look-controls>
        <a-cursor></a-cursor>
      </a-camera>
    </a-scene>

    <script>
      // Tour configuration
      const tourConfig = ${JSON.stringify(jsonData, null, 8)
        .split("\n")
        .map((line, i) => (i === 0 ? line : "      " + line))
        .join("\n")};

      // Initialize tour when scene is loaded
      const sceneEl = document.querySelector("#tour-container");
      sceneEl.addEventListener("loaded", () => {
        const tour = new SWT.Tour(sceneEl, tourConfig);
        tour.start();
      });
    </script>
  </body>
</html>`;
      }

      /**
       * Export as standalone HTML viewer with icons baked in
       */
      async exportViewerHTML() {
        try {
          const html = await this.generateViewerHTML();
          const title = this.editor.config.title || "tour";
          const filename = sanitizeId(title) + "-viewer.html";

          downloadTextAsFile(html, filename);

          showToast("Viewer HTML exported successfully", "success");
          return true;
        } catch (error) {
          console.error("Export viewer failed:", error);
          showToast("Export viewer failed", "error");
          return false;
        }
      }

      /**
       * Show export preview in modal
       */
      showExportPreview() {
        try {
          const jsonData = this.generateJSON();
          const json = JSON.stringify(jsonData, null, 2);

          const preview = document.getElementById("exportPreview");
          if (preview) {
            preview.textContent = json;
          }

          showModal("exportModal");
          return true;
        } catch (error) {
          console.error("Failed to show export preview:", error);
          showToast("Failed to generate preview", "error");
          return false;
        }
      }
    };

    // Main Editor Controller

    let TourEditor$1 = class TourEditor {
        constructor(options = {}) {
            this.config = {
                title: options.projectName || 'My Virtual Tour',
                description: '',
                initialSceneId: ''
            };
            
            // Store initialization options
            this.options = {
                sceneListElement: options.sceneListElement || null,
                previewElement: options.previewElement || null,
                propertiesElement: options.propertiesElement || null,
                autoSave: options.autoSave !== undefined ? options.autoSave : false,
                autoSaveInterval: options.autoSaveInterval || 30000,
                ...options
            };
            
            this.storageManager = new ProjectStorageManager();
            this.sceneManager = new SceneManagerEditor(this);
            this.hotspotEditor = new HotspotEditor(this);
            this.previewController = new PreviewController(this);
            this.uiController = new UIController(this);
            this.exportManager = new ExportManager(this);
            
            this.hasUnsavedChanges = false;
            this.lastRenderedSceneIndex = -1;
            this.listenersSetup = false;
        }

        /**
         * Initialize editor
         * @param {Object} config - Optional configuration object for programmatic init
         */
        async init(config = {}) {
            // Merge config with existing options
            if (config && Object.keys(config).length > 0) {
                Object.assign(this.options, config);
                if (config.projectName) {
                    this.config.title = config.projectName;
                }
            }
            
            // Initialize preview
            const previewInit = await this.previewController.init();
            if (!previewInit) {
                console.error('Failed to initialize preview controller');
                showToast$1('Failed to initialize preview', 'error');
                return false;
            }
            
            // Setup event listeners
            this.setupEventListeners();
            
            // Populate icon grid
            this.uiController.populateIconGrid();
            
            // Load saved project if exists (but only if it has valid data)
            if (this.storageManager.hasProject()) {
                try {
                    const projectData = this.storageManager.loadProject();
                    if (projectData && projectData.scenes && projectData.scenes.length > 0) {
                        this.loadProject();
                    } else {
                        // Invalid or empty project, clear it
                        console.error('Invalid or empty project data, clearing storage');
                        this.storageManager.clearProject();
                    }
                } catch (error) {
                    console.error('Error loading saved project:', error);
                    this.storageManager.clearProject();
                }
            }
            
            // Start auto-save if enabled
            if (this.options.autoSave) {
                this.storageManager.startAutoSave(() => {
                    this.saveProject();
                }, this.options.autoSaveInterval);
            }
            
            // Initial render (only if no project was loaded)
            if (this.sceneManager.getScenes().length === 0) {
                this.render();
            }
            
            showToast$1('Editor ready', 'success');
            
            return true;
        }

        /**
         * Setup event listeners
         */
        setupEventListeners() {
            if (this.listenersSetup) {
                return;
            }

            const addSceneBtns = document.querySelectorAll('#addSceneBtn');
            const sceneUploads = document.querySelectorAll('#sceneUpload');
            const importBtns = document.querySelectorAll('#importBtn');
            const importUploads = document.querySelectorAll('#importUpload');
            if (addSceneBtns.length > 1 || sceneUploads.length > 1 || importBtns.length > 1 || importUploads.length > 1) {
                console.error('Duplicate IDs found in DOM. This will cause double-trigger issues.');
            }
            
            // Toolbar buttons
            document.getElementById('newBtn')?.addEventListener('click', () => this.newProject());
            document.getElementById('saveBtn')?.addEventListener('click', () => this.saveProject());
            document.getElementById('exportBtn')?.addEventListener('click', () => this.exportManager.showExportPreview());
            document.getElementById('importBtn')?.addEventListener('click', () => this.importProject());
            document.getElementById('helpBtn')?.addEventListener('click', () => showModal('helpModal'));

            document.getElementById('addSceneBtn')?.addEventListener('click', () => {
                const sceneUpload = document.getElementById('sceneUpload');
                if (sceneUpload) {
                    sceneUpload.click();
                }
            });
            
            document.getElementById('sceneUpload')?.addEventListener('change', (e) => {
                if (e.target.files && e.target.files.length > 0) {
                    this.handleSceneUpload(e.target.files);
                    setTimeout(() => {
                        e.target.value = '';
                    }, 100);
                }
            });

            document.getElementById('addHotspotBtn')?.addEventListener('click', () => {
                this.addHotspotAtCursor();
            });
            
            document.getElementById('clearHotspotsBtn')?.addEventListener('click', () => {
                if (this.hotspotEditor.clearAllHotspots()) {
                    this.render();
                }
            });

            // Properties tabs
            document.querySelectorAll('.tab-btn').forEach(btn => {
                btn.addEventListener('click', () => {
                    this.uiController.switchTab(btn.dataset.tab);
                });
            });

            document.getElementById('hotspotTitle')?.addEventListener('input', debounce((e) => {
                this.updateCurrentHotspot('title', e.target.value);
            }, 300));
            
            document.getElementById('hotspotDescription')?.addEventListener('input', debounce((e) => {
                this.updateCurrentHotspot('description', e.target.value);
            }, 300));
            
            document.getElementById('hotspotTarget')?.addEventListener('change', (e) => {
                this.updateCurrentHotspot('targetSceneId', e.target.value);
            });
            
            document.getElementById('hotspotColor')?.addEventListener('input', (e) => {
                this.updateCurrentHotspot('color', e.target.value);
            });

            // Icon grid button clicks
            document.getElementById('hotspotIconGrid')?.addEventListener('click', (e) => {
                const btn = e.target.closest('.icon-btn');
                if (btn) {
                    const iconValue = btn.dataset.icon;
                    // Update active state
                    document.querySelectorAll('#hotspotIconGrid .icon-btn').forEach(b => b.classList.remove('active'));
                    btn.classList.add('active');
                    // Update hotspot
                    this.updateCurrentHotspot('icon', iconValue);
                }
            });

            document.getElementById('hotspotPosX')?.addEventListener('input', debounce((e) => {
                this.updateCurrentHotspotPosition('x', parseFloat(e.target.value) || 0);
            }, 300));
            
            document.getElementById('hotspotPosY')?.addEventListener('input', debounce((e) => {
                this.updateCurrentHotspotPosition('y', parseFloat(e.target.value) || 0);
            }, 300));
            
            document.getElementById('hotspotPosZ')?.addEventListener('input', debounce((e) => {
                this.updateCurrentHotspotPosition('z', parseFloat(e.target.value) || 0);
            }, 300));

            document.getElementById('sceneId')?.addEventListener('input', debounce((e) => {
                this.updateCurrentScene('id', sanitizeId(e.target.value));
            }, 300));
            
            document.getElementById('sceneName')?.addEventListener('input', debounce((e) => {
                this.updateCurrentScene('name', e.target.value);
            }, 300));
            
            document.getElementById('sceneImageUrl')?.addEventListener('input', debounce((e) => {
                this.updateCurrentSceneImage(e.target.value);
            }, 300));

            document.getElementById('setStartingPosBtn')?.addEventListener('click', () => {
                this.setSceneStartingPosition();
            });
            
            document.getElementById('clearStartingPosBtn')?.addEventListener('click', () => {
                this.clearSceneStartingPosition();
            });

            document.getElementById('tourTitle')?.addEventListener('input', debounce((e) => {
                this.config.title = e.target.value;
                this.markUnsavedChanges();
                const projectName = document.getElementById('project-name');
                if (projectName && projectName.value !== e.target.value) {
                    projectName.value = e.target.value;
                }
            }, 300));
            
            document.getElementById('project-name')?.addEventListener('input', debounce((e) => {
                this.config.title = e.target.value;
                this.markUnsavedChanges();
                const tourTitle = document.getElementById('tourTitle');
                if (tourTitle && tourTitle.value !== e.target.value) {
                    tourTitle.value = e.target.value;
                }
            }, 300));
            
            document.getElementById('tourDescription')?.addEventListener('input', debounce((e) => {
                this.config.description = e.target.value;
                this.markUnsavedChanges();
            }, 300));
            
            document.getElementById('tourInitialScene')?.addEventListener('change', (e) => {
                this.config.initialSceneId = e.target.value;
                this.markUnsavedChanges();
            });

            document.getElementById('exportJsonBtn')?.addEventListener('click', () => {
                this.exportManager.exportJSON();
            });
            
            document.getElementById('copyJsonBtn')?.addEventListener('click', () => {
                this.exportManager.copyJSON();
            });
            
            document.getElementById('exportViewerBtn')?.addEventListener('click', async () => {
                await this.exportManager.exportViewerHTML();
            });

            document.querySelectorAll('.modal-close').forEach(btn => {
                btn.addEventListener('click', () => {
                    const modal = btn.closest('.modal');
                    if (modal) {
                        hideModal(modal.id);
                    }
                });
            });

            document.getElementById('importUpload')?.addEventListener('change', (e) => {
                if (e.target.files && e.target.files.length > 0) {
                    this.handleImportFile(e.target.files[0]);
                    setTimeout(() => {
                        e.target.value = '';
                    }, 100);
                }
            });

            window.addEventListener('beforeunload', (e) => {
                if (this.hasUnsavedChanges) {
                    e.preventDefault();
                    e.returnValue = '';
                }
            });
            
            this.listenersSetup = true;
        }

        /**
         * Handle scene upload
         */
        async handleSceneUpload(files) {
            if (!files || files.length === 0) {
                return;
            }

            this.uiController.setLoading(true);

            for (const file of files) {
                if (!file.type.startsWith('image/')) {
                    showToast$1(`${file.name} is not an image`, 'error');
                    continue;
                }

                await this.sceneManager.addScene(file);
            }
            this.uiController.setLoading(false);
            this.render();
            this.markUnsavedChanges();
        }

        /**
         * Add hotspot at position
         */
        addHotspotAtPosition(position) {
            const distance = Math.sqrt(position.x * position.x + position.y * position.y + position.z * position.z);
            if (distance > 5) {
                const scale = 5 / distance;
                position.x *= scale;
                position.y *= scale;
                position.z *= scale;
                position.x = parseFloat(position.x.toFixed(2));
                position.y = parseFloat(position.y.toFixed(2));
                position.z = parseFloat(position.z.toFixed(2));
            }
            
            // Capture current camera orientation for reliable pointing later
            const cameraRotation = this.previewController.getCameraRotation();
            const cameraOrientation = cameraRotation ? {
                pitch: cameraRotation.x,
                yaw: cameraRotation.y
            } : null;
            
            const hotspot = this.hotspotEditor.addHotspot(position, '', cameraOrientation);
            if (hotspot) {
                this.lastRenderedSceneIndex = -1;
                this.render();
                this.markUnsavedChanges();
            } else {
                console.error('Failed to add hotspot');
            }
        }

        /**
         * Add hotspot at current cursor position (center of view)
         * This uses the A-Cursor's raycaster intersection with the sky sphere
         */
        addHotspotAtCursor() {
            const scene = this.sceneManager.getCurrentScene();
            if (!scene) {
                showToast$1('Please select a scene first', 'error');
                return;
            }

            const position = this.previewController.getCursorIntersection();
            if (!position) {
                showToast$1('Could not get cursor position. Please ensure the preview is loaded.', 'error');
                return;
            }

            this.addHotspotAtPosition(position);
        }

        /**
         * Select scene by index
         */
        selectScene(index) {
            if (this.sceneManager.setCurrentScene(index)) {
                this.lastRenderedSceneIndex = -1;
                this.hotspotEditor.currentHotspotIndex = -1;
                
                const scene = this.sceneManager.getCurrentScene();
                if (scene) {
                    this.previewController.loadScene(scene, false);
                    this.lastRenderedSceneIndex = index;
                }
                
                this.uiController.renderSceneList();
                this.uiController.updateSceneProperties(scene);
                this.uiController.renderHotspotList();
                this.uiController.updateHotspotProperties(null);
                this.uiController.updateInitialSceneOptions();
                this.uiController.updateTargetSceneOptions();
            }
        }

        /**
         * Select hotspot by index
         */
        selectHotspot(index) {
            if (this.hotspotEditor.setCurrentHotspot(index)) {
                const hotspot = this.hotspotEditor.getHotspot(index);
                
                this.uiController.renderHotspotList();
                this.uiController.updateHotspotProperties(hotspot);
                this.uiController.updateTargetSceneOptions();
                this.uiController.switchTab('hotspot');
                
                if (hotspot) {
                    this.previewController.pointCameraToHotspot(hotspot);
                }
            }
        }

        /**
         * Remove scene
         */
        removeScene(index) {
            if (this.sceneManager.removeScene(index)) {
                this.render();
                this.markUnsavedChanges();
            }
        }

        /**
         * Remove hotspot
         */
        removeHotspot(index) {
            if (this.hotspotEditor.removeHotspot(index)) {
                this.lastRenderedSceneIndex = -1;
                this.render();
                this.markUnsavedChanges();
            }
        }

        /**
         * Duplicate hotspot
         */
        duplicateHotspot(index) {
            const hotspot = this.hotspotEditor.duplicateHotspot(index);
            if (hotspot) {
                this.lastRenderedSceneIndex = -1;
                this.render();
                this.markUnsavedChanges();
            }
        }

        /**
         * Reorder scenes
         */
        reorderScenes(fromIndex, toIndex) {
            if (this.sceneManager.reorderScenes(fromIndex, toIndex)) {
                this.render();
                this.markUnsavedChanges();
            }
        }

        /**
         * Update current hotspot property
         */
        async updateCurrentHotspot(property, value) {
            const index = this.hotspotEditor.currentHotspotIndex;
            if (this.hotspotEditor.updateHotspot(index, property, value)) {
                await this.previewController.updateHotspotMarker(index);
                this.uiController.renderHotspotList();
                this.markUnsavedChanges();
            }
        }

        /**
         * Update current hotspot position (X, Y, or Z)
         */
        async updateCurrentHotspotPosition(axis, value) {
            const index = this.hotspotEditor.currentHotspotIndex;
            const hotspot = this.hotspotEditor.getHotspot(index);
            
            if (hotspot) {
                if (!hotspot.position) {
                    hotspot.position = { x: 0, y: 0, z: 0 };
                }
                
                hotspot.position[axis] = value;
                
                // Clear camera orientation since position changed manually
                // Will fallback to position-based calculation when pointing camera
                hotspot.cameraOrientation = null;
                
                const pos = hotspot.position;
                const distance = Math.sqrt(pos.x * pos.x + pos.y * pos.y + pos.z * pos.z);
                if (distance > 10) {
                    const scale = 10 / distance;
                    pos.x *= scale;
                    pos.y *= scale;
                    pos.z *= scale;
                    
                    document.getElementById(`hotspotPos${axis.toUpperCase()}`).value = pos[axis].toFixed(2);
                    showToast$1('Position clamped to 10-unit radius', 'info');
                }
                
                await this.previewController.updateHotspotMarker(index);
                this.uiController.renderHotspotList();
                this.markUnsavedChanges();
            }
        }

        /**
         * Update current scene property
         */
        updateCurrentScene(property, value) {
            const index = this.sceneManager.currentSceneIndex;
            if (this.sceneManager.updateScene(index, property, value)) {
                this.uiController.renderSceneList();
                this.markUnsavedChanges();
            }
        }

        /**
         * Update current scene image URL
         */
        async updateCurrentSceneImage(imageUrl) {
            const index = this.sceneManager.currentSceneIndex;
            if (index < 0) return;
            
            if (this.sceneManager.updateScene(index, 'imageUrl', imageUrl)) {
                const scene = this.sceneManager.getCurrentScene();
                if (scene) {
                    scene.thumbnail = imageUrl;
                }
                
                this.uiController.renderSceneList();
                this.lastRenderedSceneIndex = -1;
                
                if (scene) {
                    await this.previewController.loadScene(scene);
                    this.lastRenderedSceneIndex = index;
                    showToast$1('Scene image updated', 'success');
                }
                this.markUnsavedChanges();
            }
        }

        /**
         * Set scene starting position to current camera rotation
         */
        setSceneStartingPosition() {
            const scene = this.sceneManager.getCurrentScene();
            if (!scene) {
                showToast$1('No scene selected', 'error');
                return;
            }
            
            const rotation = this.previewController.getCameraRotation();
            if (!rotation) {
                showToast$1('Could not get camera rotation', 'error');
                return;
            }
            
            scene.startingPosition = {
                pitch: rotation.x,
                yaw: rotation.y
            };
            
            this.uiController.updateSceneProperties(scene);
            this.markUnsavedChanges();
            showToast$1('Starting position set', 'success');
        }

        /**
         * Clear scene starting position
         */
        clearSceneStartingPosition() {
            const scene = this.sceneManager.getCurrentScene();
            if (!scene) {
                showToast$1('No scene selected', 'error');
                return;
            }
            
            scene.startingPosition = null;
            
            this.uiController.updateSceneProperties(scene);
            this.markUnsavedChanges();
            showToast$1('Starting position cleared', 'success');
        }

        /**
         * Render all UI
         */
        render() {
            this.uiController.renderSceneList();
            this.uiController.renderHotspotList();
            
            const currentScene = this.sceneManager.getCurrentScene();
            const currentHotspot = this.hotspotEditor.getCurrentHotspot();
            
            this.uiController.updateSceneProperties(currentScene);
            this.uiController.updateHotspotProperties(currentHotspot);
            this.uiController.updateTourProperties(this.config);
            this.uiController.updateInitialSceneOptions();
            this.uiController.updateTargetSceneOptions();
            
            if (currentScene) {
                const emptyState = document.querySelector('.preview-empty');
                if (emptyState) {
                    emptyState.style.display = 'none';
                }
                
                const currentSceneIndex = this.sceneManager.currentSceneIndex;
                if (currentSceneIndex !== this.lastRenderedSceneIndex) {
                    this.previewController.loadScene(currentScene);
                    this.lastRenderedSceneIndex = currentSceneIndex;
                }
                
                if (currentHotspot) {
                    this.previewController.highlightHotspot(this.hotspotEditor.currentHotspotIndex);
                }
            } else {
                const emptyState = document.querySelector('.preview-empty');
                if (emptyState) {
                    emptyState.style.display = 'flex';
                }
                this.lastRenderedSceneIndex = -1;
            }
        }

        /**
         * Save project
         */
        saveProject() {
            const projectData = {
                config: this.config,
                scenes: this.sceneManager.getAllScenes()
            };

            if (this.storageManager.saveProject(projectData)) {
                this.hasUnsavedChanges = false;
                showToast$1('Project saved', 'success');
                return true;
            }
            return false;
        }

        /**
         * Load project
         */
        loadProject() {
            const projectData = this.storageManager.loadProject();
            if (projectData) {
                this.config = projectData.config || this.config;
                this.sceneManager.loadScenes(projectData.scenes || []);
                this.hasUnsavedChanges = false;
                this.render();
                showToast$1('Project loaded', 'success');
                return true;
            }
            return false;
        }

        /**
         * New project
         */
        newProject() {
            if (this.hasUnsavedChanges) {
                if (!confirm('You have unsaved changes. Create new project?')) {
                    return false;
                }
            }

            this.config = {
                title: 'My Virtual Tour',
                description: '',
                initialSceneId: ''
            };
            
            this.sceneManager.clearScenes();
            this.hasUnsavedChanges = false;
            this.render();
            
            showToast$1('New project created', 'success');
            return true;
        }

        /**
         * Import project
         */
        importProject() {
    const importUpload = document.getElementById('importUpload');
            if (importUpload) {
                importUpload.click();
            }
        }

        /**
         * Handle import file
         */
        async handleImportFile(file) {
            try {
                this.uiController.setLoading(true);
                
                const projectData = await this.storageManager.importFromFile(file);
                
                this.config = projectData.config || projectData;
                this.sceneManager.loadScenes(projectData.scenes || []);
                this.hasUnsavedChanges = true;
                
                this.render();
                this.uiController.setLoading(false);
                
                showToast$1('Project imported successfully', 'success');
            } catch (error) {
                this.uiController.setLoading(false);
                console.error('Import failed:', error);
            }
        }

        /**
         * Mark unsaved changes
         */
        markUnsavedChanges() {
            this.hasUnsavedChanges = true;
        }
    };

    // Initialize editor when DOM is ready
    document.addEventListener('DOMContentLoaded', async () => {
        if (document.querySelector('[data-swt-editor]')) {
            // Declarative initialization will handle it
            return;
        }
        window.editor = new TourEditor$1();
        await window.editor.init();
    });

    // UI Initialization - Handles color picker sync, keyboard shortcuts, tab switching, and declarative init

    /**
     * Initialize editor from declarative HTML attributes
     */
    function initDeclarativeEditor() {
      const editorElement = document.querySelector("[data-swt-editor]");

      if (!editorElement) {
        return null; // No declarative editor found
      }

      // Check if auto-init is enabled
      const autoInit = editorElement.getAttribute("data-swt-auto-init");
      if (autoInit !== "true") {
        return null; // Auto-init disabled
      }

      // Find required elements by data attributes
      const sceneListElement = editorElement.querySelector("[data-swt-scene-list]");
      const previewElement = editorElement.querySelector("[data-swt-preview-area]");
      const propertiesElement = editorElement.querySelector(
        "[data-swt-properties-panel]"
      );

      // Get optional configuration from attributes
      const projectName =
        editorElement.getAttribute("data-swt-project-name") || "My Virtual Tour";
      const autoSave = editorElement.getAttribute("data-swt-auto-save") === "true";
      const autoSaveInterval =
        parseInt(editorElement.getAttribute("data-swt-auto-save-interval")) ||
        30000;

      // Create and initialize editor
      const editor = new TourEditor({
        projectName,
        autoSave,
        autoSaveInterval,
      });

      // Store element references for controllers
      if (sceneListElement) editor.options.sceneListElement = sceneListElement;
      if (previewElement) editor.options.previewElement = previewElement;
      if (propertiesElement) editor.options.propertiesElement = propertiesElement;

      editor.init().catch((err) => {
          console.error("Failed to initialize declarative editor:", err);
        });

      return editor;
    }

    window.addEventListener("DOMContentLoaded", () => {
      // Try declarative initialization first
      const declarativeEditor = initDeclarativeEditor();

      if (declarativeEditor) {
        // Store editor instance globally for declarative mode
        window.editor = declarativeEditor;
      }

      // Setup color picker sync
      const colorPicker = document.getElementById("hotspotColor");
      const colorText = document.getElementById("hotspotColorText");

      if (colorPicker && colorText) {
        colorPicker.addEventListener("input", (e) => {
          colorText.value = e.target.value;
        });

        colorText.addEventListener("input", (e) => {
          if (/^#[0-9A-F]{6}$/i.test(e.target.value)) {
            colorPicker.value = e.target.value;
          }
        });
      }

      // Keyboard shortcuts
      document.addEventListener("keydown", (e) => {
        // Ctrl/Cmd + S to save
        if ((e.ctrlKey || e.metaKey) && e.key === "s") {
          e.preventDefault();
          if (window.editor) window.editor.saveProject();
        }

        // Ctrl/Cmd + E to export
        if ((e.ctrlKey || e.metaKey) && e.key === "e") {
          e.preventDefault();
          if (window.editor) window.editor.exportManager.showExportPreview();
        }

        // ESC to close modals
        if (e.key === "Escape") {
          document.querySelectorAll(".modal.show").forEach((modal) => {
            modal.classList.remove("show");
          });
        }
      });

      // Preview button - just focuses on the preview area
      const previewBtn = document.getElementById("previewBtn");
      if (previewBtn) {
        previewBtn.addEventListener("click", () => {
          const preview = document.getElementById("preview");
          const canvas = document.getElementById("canvasArea");
          if (preview && canvas) {
            canvas.classList.toggle("preview-active");
            // refresh preview
            if (window.editor && window.editor.previewController) {
              window.editor.previewController.refresh();
            }
          }
        });
      }

      // Modal background click to close
      document.querySelectorAll(".modal").forEach((modal) => {
        modal.addEventListener("click", (e) => {
          if (e.target === modal) {
            modal.classList.remove("show");
          }
        });
      });

      // Tab switching functionality
      const tabs = document.querySelectorAll(".tab");
      const tabContents = document.querySelectorAll(".tab-content");

      tabs.forEach((tab) => {
        tab.addEventListener("click", () => {
          const targetTab = tab.dataset.tab;

          // Update tab buttons
          tabs.forEach((t) => t.classList.remove("active"));
          tab.classList.add("active");

          // Update tab content
          tabContents.forEach((content) => {
            content.style.display = "none";
          });

          const targetContent = document.getElementById(targetTab + "Tab");
          if (targetContent) {
            targetContent.style.display = "block";
          }

          // Update panel title (if exists)
          const panelTitle = document.getElementById("panelTitle");
          if (panelTitle) {
            switch (targetTab) {
              case "scene":
                panelTitle.textContent = "Scene Properties";
                break;
              case "hotspot":
                panelTitle.textContent = "Hotspot Properties";
                break;
              case "tour":
                panelTitle.textContent = "Tour Settings";
                break;
            }
          }
        });
      });
    });

    // SenangWebs Tour Editor - Entry Point
    // This file bundles all editor modules for distribution

    Object.assign(window, utils);

    // Attach classes to window for global access
    window.ProjectStorageManager = ProjectStorageManager$1;
    window.SceneManagerEditor = SceneManagerEditor$1;
    window.HotspotEditor = HotspotEditor$1;
    window.PreviewController = PreviewController$1;
    window.UIController = UIController$1;
    window.ExportManager = ExportManager$1;
    window.TourEditor = TourEditor$1;

    return TourEditor$1;

})();
//# sourceMappingURL=swt-editor.js.map
