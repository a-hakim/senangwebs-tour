/**
 * IconRenderer - Converts SenangStart icon names to image data URLs for A-Frame
 */
export class IconRenderer {
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
