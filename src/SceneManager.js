/**
 * SceneManager - Handles scene transitions and <a-sky> management
 */
export class SceneManager {
  constructor(sceneEl, assetManager) {
    this.sceneEl = sceneEl;
    this.assetManager = assetManager;
    this.skyEl = null;
    this.currentSceneId = null;
    this.transitionDuration = 500; // milliseconds
    this.init();
  }

  init() {
    // Find or create <a-sky> element
    this.skyEl = this.sceneEl.querySelector('a-sky');
    if (!this.skyEl) {
      this.skyEl = document.createElement('a-sky');
      this.skyEl.setAttribute('id', 'swt-sky');
      this.sceneEl.appendChild(this.skyEl);
    }
  }

  /**
   * Load a scene by its ID
   * @param {string} sceneId - The scene ID
   * @param {Object} sceneData - The scene configuration object
   * @returns {Promise} - Resolves when the scene is loaded
   */
  async loadScene(sceneId, sceneData) {
    this.currentSceneId = sceneId;

    // Preload the panorama
    const panoramaUrl = sceneData.panorama;
    const assetId = `scene-${sceneId}`;
    
    const isVideo = this.assetManager.isVideo(panoramaUrl);
    
    if (isVideo) {
      await this.assetManager.preloadVideo(panoramaUrl, assetId);
    } else {
      await this.assetManager.preloadImage(panoramaUrl, assetId);
    }

    // Set the sky source
    this.skyEl.setAttribute('src', `#${assetId}`);

    // If it's a video, play it
    if (isVideo) {
      const videoEl = this.assetManager.getAsset(assetId);
      if (videoEl && videoEl.play) {
        videoEl.play().catch(err => {
          console.warn('Video autoplay failed:', err);
        });
      }
    }

    return Promise.resolve();
  }

  /**
   * Transition to a new scene with fade effect
   * @param {string} sceneId - The target scene ID
   * @param {Object} sceneData - The scene configuration object
   * @param {Function} onSceneLoaded - Optional callback to run after scene loads but before fade-in
   * @returns {Promise} - Resolves when the transition is complete
   */
  async transitionTo(sceneId, sceneData, onSceneLoaded = null) {
    // Fade out
    await this.fadeOut();

    // Load new scene
    await this.loadScene(sceneId, sceneData);

    // Call onSceneLoaded callback (e.g., to set camera position while screen is black)
    if (onSceneLoaded && typeof onSceneLoaded === 'function') {
      onSceneLoaded();
    }

    // Fade in
    await this.fadeIn();

    return Promise.resolve();
  }

  /**
   * Fade out the scene
   * @returns {Promise}
   */
  fadeOut() {
    return new Promise((resolve) => {
      // Create a fade overlay
      const fadeEl = document.createElement('a-entity');
      fadeEl.setAttribute('id', 'swt-fade');
      fadeEl.setAttribute('geometry', 'primitive: sphere; radius: 1');
      fadeEl.setAttribute('material', 'color: black; opacity: 0; shader: flat; side: back');
      fadeEl.setAttribute('scale', '0.1 0.1 0.1');
      
      // Position it at the camera
      const cameraEl = this.sceneEl.querySelector('[camera]');
      if (cameraEl && cameraEl.tagName) {
        fadeEl.setAttribute('position', '0 0 0');
        cameraEl.appendChild(fadeEl);
      } else {
        // Fallback: append to scene
        fadeEl.setAttribute('position', '0 1.6 0');
        this.sceneEl.appendChild(fadeEl);
      }

      // Animate opacity
      fadeEl.setAttribute('animation', {
        property: 'material.opacity',
        to: 1,
        dur: this.transitionDuration,
        easing: 'easeInQuad'
      });

      setTimeout(() => {
        resolve(fadeEl);
      }, this.transitionDuration);
    });
  }

  /**
   * Fade in the scene
   * @returns {Promise}
   */
  fadeIn() {
    return new Promise((resolve) => {
      const fadeEl = document.getElementById('swt-fade');
      if (fadeEl) {
        fadeEl.setAttribute('animation', {
          property: 'material.opacity',
          to: 0,
          dur: this.transitionDuration,
          easing: 'easeOutQuad'
        });

        setTimeout(() => {
          if (fadeEl.parentNode) {
            fadeEl.parentNode.removeChild(fadeEl);
          }
          resolve();
        }, this.transitionDuration);
      } else {
        resolve();
      }
    });
  }

  /**
   * Get the current scene ID
   * @returns {string}
   */
  getCurrentSceneId() {
    return this.currentSceneId;
  }

  /**
   * Clean up the scene manager
   */
  destroy() {
    if (this.skyEl && this.skyEl.parentNode) {
      this.skyEl.setAttribute('src', '');
    }
    this.currentSceneId = null;
  }
}
