/**
 * AssetManager - Handles preloading and management of assets in A-Frame's <a-assets>
 */
export class AssetManager {
  constructor(sceneEl) {
    this.sceneEl = sceneEl;
    this.assetsEl = null;
    this.loadedAssets = new Map();
    this.init();
  }

  init() {
    // Find or create <a-assets> element
    this.assetsEl = this.sceneEl.querySelector('a-assets');
    if (!this.assetsEl) {
      this.assetsEl = document.createElement('a-assets');
      // Wait for scene to be ready before inserting
      if (this.sceneEl.hasLoaded) {
        this.sceneEl.insertBefore(this.assetsEl, this.sceneEl.firstChild);
      } else {
        this.sceneEl.addEventListener('loaded', () => {
          this.sceneEl.insertBefore(this.assetsEl, this.sceneEl.firstChild);
        }, { once: true });
      }
    }
  }

  /**
   * Ensure assets element is ready
   * @returns {Promise}
   */
  ensureAssetsReady() {
    return new Promise((resolve) => {
      if (this.assetsEl && this.assetsEl.parentNode) {
        resolve();
      } else if (this.sceneEl.hasLoaded) {
        if (this.assetsEl && !this.assetsEl.parentNode) {
          this.sceneEl.insertBefore(this.assetsEl, this.sceneEl.firstChild);
        }
        resolve();
      } else {
        this.sceneEl.addEventListener('loaded', () => {
          if (this.assetsEl && !this.assetsEl.parentNode) {
            this.sceneEl.insertBefore(this.assetsEl, this.sceneEl.firstChild);
          }
          resolve();
        }, { once: true });
      }
    });
  }

  /**
   * Preload an image asset
   * @param {string} url - URL of the image
   * @param {string} id - Unique ID for the asset
   * @returns {Promise} - Resolves when the asset is loaded
   */
  async preloadImage(url, id) {
    // Check if asset exists and if the URL is the same
    const existingAsset = this.loadedAssets.get(id);
    if (existingAsset) {
      const existingSrc = existingAsset.getAttribute('src');
      if (existingSrc === url) {
        // Same URL, return cached asset
        return Promise.resolve(existingAsset);
      }
      // URL changed - remove old asset and create new one
      if (existingAsset.parentNode) {
        existingAsset.parentNode.removeChild(existingAsset);
      }
      this.loadedAssets.delete(id);
    }

    // Ensure assets element is ready
    await this.ensureAssetsReady();

    return new Promise((resolve, reject) => {
      const imgEl = document.createElement('img');
      imgEl.setAttribute('id', id);
      imgEl.setAttribute('src', url);
      imgEl.setAttribute('crossorigin', 'anonymous');

      imgEl.addEventListener('load', () => {
        this.loadedAssets.set(id, imgEl);
        resolve(imgEl);
      });

      imgEl.addEventListener('error', (err) => {
        console.error(`Failed to load asset: ${url}`, err);
        reject(err);
      });

      this.assetsEl.appendChild(imgEl);
    });
  }

  /**
   * Preload a video asset
   * @param {string} url - URL of the video
   * @param {string} id - Unique ID for the asset
   * @returns {Promise} - Resolves when the asset is loaded
   */
  async preloadVideo(url, id) {
    if (this.loadedAssets.has(id)) {
      return Promise.resolve(this.loadedAssets.get(id));
    }

    // Ensure assets element is ready
    await this.ensureAssetsReady();

    return new Promise((resolve, reject) => {
      const videoEl = document.createElement('video');
      videoEl.setAttribute('id', id);
      videoEl.setAttribute('src', url);
      videoEl.setAttribute('crossorigin', 'anonymous');
      videoEl.setAttribute('preload', 'auto');
      videoEl.setAttribute('playsinline', '');
      videoEl.setAttribute('loop', '');

      videoEl.addEventListener('loadeddata', () => {
        this.loadedAssets.set(id, videoEl);
        resolve(videoEl);
      });

      videoEl.addEventListener('error', (err) => {
        console.error(`Failed to load video asset: ${url}`, err);
        reject(err);
      });

      this.assetsEl.appendChild(videoEl);
    });
  }

  /**
   * Get an asset by ID
   * @param {string} id - Asset ID
   * @returns {HTMLElement} - The asset element
   */
  getAsset(id) {
    return this.loadedAssets.get(id) || document.getElementById(id);
  }

  /**
   * Check if asset is a video based on URL
   * @param {string} url - Asset URL
   * @returns {boolean}
   */
  isVideo(url) {
    const videoExtensions = ['.mp4', '.webm', '.ogg', '.ogv'];
    return videoExtensions.some(ext => url.toLowerCase().endsWith(ext));
  }

  /**
   * Clean up all assets created by the manager
   */
  destroy() {
    this.loadedAssets.forEach((asset, id) => {
      if (asset && asset.parentNode) {
        asset.parentNode.removeChild(asset);
      }
    });
    this.loadedAssets.clear();
  }
}
