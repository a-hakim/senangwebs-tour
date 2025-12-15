/**
 * HotspotManager - Creates, manages, and removes hotspot entities in the A-Frame scene
 */
export class HotspotManager {
  constructor(sceneEl, assetManager, defaultHotspotSettings = {}, iconRenderer = null) {
    this.sceneEl = sceneEl;
    this.assetManager = assetManager;
    this.defaultSettings = defaultHotspotSettings;
    this.iconRenderer = iconRenderer;
    this.activeHotspots = [];
    this.tooltipEl = null;
    this.tooltipCreated = false;
    this.iconDataUrls = new Map(); // Cache for generated icon data URLs
    
    // Listen for hover events
    this.sceneEl.addEventListener('swt-hotspot-hover', (evt) => {
      this.handleHotspotHover(evt.detail);
    });
  }

  /**
   * Create a tooltip element for displaying hotspot information
   */
  createTooltip() {
    if (this.tooltipCreated) {
      return;
    }

    this.tooltipEl = document.createElement('a-entity');
    this.tooltipEl.setAttribute('id', 'swt-tooltip');
    this.tooltipEl.setAttribute('visible', 'false');
    
    // Text element
    const textEl = document.createElement('a-text');
    textEl.setAttribute('value', '');
    textEl.setAttribute('align', 'center');
    textEl.setAttribute('color', '#FFFFFF');
    textEl.setAttribute('width', '2');
    textEl.setAttribute('wrap-count', '20');
    this.tooltipEl.appendChild(textEl);
    
    // Background plane
    const bgEl = document.createElement('a-plane');
    bgEl.setAttribute('color', '#000000');
    bgEl.setAttribute('opacity', '0.7');
    bgEl.setAttribute('width', '2');
    bgEl.setAttribute('height', '0.5');
    bgEl.setAttribute('position', '0 0 -0.01');
    this.tooltipEl.appendChild(bgEl);
    
    this.sceneEl.appendChild(this.tooltipEl);
    this.tooltipCreated = true;
  }

  /**
   * Handle hotspot hover events to show/hide tooltip
   */
  handleHotspotHover(detail) {
    if (detail.isHovering && detail.hotspotData.tooltip) {
      const text = detail.hotspotData.tooltip.text;
      const position = detail.hotspotData.position;
      
      // Update tooltip text
      const textEl = this.tooltipEl.querySelector('a-text');
      textEl.setAttribute('value', text);
      
      // Position tooltip above the hotspot
      const offsetY = 1.5;
      this.tooltipEl.setAttribute('position', `${position.x} ${position.y + offsetY} ${position.z}`);
      this.tooltipEl.setAttribute('visible', 'true');
      
      // Make tooltip face the camera (using billboard component)
      if (!this.tooltipEl.hasAttribute('swt-billboard')) {
        this.tooltipEl.setAttribute('swt-billboard', 'enabled: true');
      }
    } else {
      this.tooltipEl.setAttribute('visible', 'false');
    }
  }

  /**
   * Create hotspots for a scene
   * @param {Array} hotspots - Array of hotspot objects
   * @returns {Promise} - Resolves when all hotspots are created
   */
  async createHotspots(hotspots = []) {
    // Create tooltip if not already created
    if (!this.tooltipCreated) {
      this.createTooltip();
    }

    // Clear previous icon data URLs cache
    this.iconDataUrls.clear();

    // Process all hotspot icons
    const iconPromises = hotspots.map(async (hotspot, index) => {
      const icon = hotspot.appearance?.icon || this.defaultSettings.icon;
      const color = hotspot.appearance?.color || '#ffffff';
      
      if (!icon) return;
      
      // Check if it's an image URL
      const isImageUrl = icon.startsWith('http') || icon.startsWith('data:') || icon.startsWith('/');
      
      if (isImageUrl) {
        // Preload as image asset
        const assetId = `hotspot-icon-${index}`;
        try {
          await this.assetManager.preloadImage(icon, assetId);
        } catch (err) {
          console.warn(`Failed to load icon for hotspot ${index}, will use color instead`);
        }
      } else if (this.iconRenderer) {
        // Generate icon data URL from SenangStart icon name
        try {
          const dataUrl = await this.iconRenderer.generateIconDataUrl(icon, color, 128);
          if (dataUrl) {
            this.iconDataUrls.set(index, dataUrl);
            // Preload the generated data URL as an asset
            const assetId = `hotspot-icon-${index}`;
            await this.assetManager.preloadImage(dataUrl, assetId);
          }
        } catch (err) {
          console.warn(`Failed to generate icon for hotspot ${index}:`, err);
        }
      }
    });

    await Promise.all(iconPromises);

    // Then create the hotspot entities
    hotspots.forEach((hotspot, index) => {
      this.createHotspot(hotspot, index);
    });
  }

  /**
   * Create a single hotspot entity
   * @param {Object} hotspot - Hotspot configuration
   * @param {number} index - Hotspot index
   */
  createHotspot(hotspot, index) {
    const hotspotEl = document.createElement('a-entity');
    hotspotEl.classList.add('swt-hotspot');
    
    // Set position
    const pos = hotspot.position;
    hotspotEl.setAttribute('position', `${pos.x} ${pos.y} ${pos.z}`);

    // Get icon and color
    const icon = hotspot.appearance?.icon || this.defaultSettings.icon;
    const color = hotspot.appearance?.color || '#4CC3D9';
    
    // Check if we have a preloaded icon asset (either from URL or generated from icon name)
    const assetId = `hotspot-icon-${index}`;
    const assetEl = document.getElementById(assetId);
    
    let visualEl;
    
    // Check if icon asset was successfully loaded/generated
    if (icon && assetEl) {
      visualEl = document.createElement('a-image');
      visualEl.setAttribute('src', `#${assetId}`);
      // Make images double-sided
      visualEl.setAttribute('material', 'side: double; transparent: true; alphaTest: 0.1');
    } else {
      // Fallback to a colored plane
      visualEl = document.createElement('a-plane');
      visualEl.setAttribute('color', color);
      visualEl.setAttribute('width', '1');
      visualEl.setAttribute('height', '1');
      // Make plane double-sided
      visualEl.setAttribute('material', 'side', 'double');
    }

    // Set scale
    const scale = hotspot.appearance?.scale || this.defaultSettings.scale || '1 1 1';
    visualEl.setAttribute('scale', scale);

    // Make it always face the camera (billboard effect)
    visualEl.setAttribute('swt-billboard', 'enabled: true');

    // Add cursor interaction
    visualEl.setAttribute('class', 'clickable');

    // Add the swt-hotspot-listener component
    visualEl.setAttribute('swt-hotspot-listener', {
      hotspotData: JSON.stringify(hotspot)
    });

    hotspotEl.appendChild(visualEl);
    this.sceneEl.appendChild(hotspotEl);
    this.activeHotspots.push(hotspotEl);
  }

  /**
   * Remove all active hotspots from the scene
   */
  removeAllHotspots() {
    this.activeHotspots.forEach(hotspot => {
      if (hotspot.parentNode) {
        hotspot.parentNode.removeChild(hotspot);
      }
    });
    this.activeHotspots = [];
    
    // Hide tooltip
    if (this.tooltipEl) {
      this.tooltipEl.setAttribute('visible', 'false');
    }
  }

  /**
   * Clean up the hotspot manager
   */
  destroy() {
    this.removeAllHotspots();
    if (this.tooltipEl && this.tooltipEl.parentNode) {
      this.tooltipEl.parentNode.removeChild(this.tooltipEl);
    }
  }
}
