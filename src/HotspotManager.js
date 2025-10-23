/**
 * HotspotManager - Creates, manages, and removes hotspot entities in the A-Frame scene
 */
export class HotspotManager {
  constructor(sceneEl, assetManager, defaultHotspotSettings = {}) {
    this.sceneEl = sceneEl;
    this.assetManager = assetManager;
    this.defaultSettings = defaultHotspotSettings;
    this.activeHotspots = [];
    this.tooltipEl = null;
    this.tooltipCreated = false;
    
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
      
      // Make tooltip face the camera
      this.tooltipEl.setAttribute('look-at', '[camera]');
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

    // First, preload all hotspot icons (with error handling)
    const iconPromises = hotspots.map((hotspot, index) => {
      const icon = hotspot.appearance?.icon || this.defaultSettings.icon;
      if (icon) {
        const assetId = `hotspot-icon-${index}`;
        return this.assetManager.preloadImage(icon, assetId).catch(err => {
          console.warn(`Failed to load icon for hotspot ${index}, will use color instead`);
          return null; // Continue even if icon fails to load
        });
      }
      return Promise.resolve();
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

    // Set icon or fallback to plane with color
    const icon = hotspot.appearance?.icon || this.defaultSettings.icon;
    const assetId = `hotspot-icon-${index}`;
    const assetEl = icon ? document.getElementById(assetId) : null;
    
    let visualEl;
    
    // Check if icon was successfully loaded
    if (icon && assetEl) {
      visualEl = document.createElement('a-image');
      visualEl.setAttribute('src', `#${assetId}`);
    } else {
      // Fallback to a plane with color
      visualEl = document.createElement('a-plane');
      visualEl.setAttribute('color', hotspot.appearance?.color || '#4CC3D9');
      visualEl.setAttribute('width', '1');
      visualEl.setAttribute('height', '1');
    }

    // Set scale
    const scale = hotspot.appearance?.scale || this.defaultSettings.scale || '1 1 1';
    visualEl.setAttribute('scale', scale);

    // Make it face the camera
    visualEl.setAttribute('look-at', '[camera]');

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
