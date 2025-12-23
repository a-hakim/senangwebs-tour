// Export Manager - Handles JSON generation for SWT library
import { downloadTextAsFile, showModal, copyToClipboard } from "./utils.js";
import { IconRenderer } from "../../IconRenderer.js";
import { buildTourConfig } from "./data-transform.js";

class ExportManager {
  constructor(editor) {
    this.editor = editor;
    this.iconRenderer = new IconRenderer();
  }

  /**
   * Generate JSON compatible with SWT library
   * Follows the tourConfig structure from example-simple.html
   * Uses shared data-transform utilities for consistent transformation
   */
  generateJSON() {
    const scenes = this.editor.sceneManager.getAllScenes();
    const config = this.editor.config;

    return buildTourConfig(config, scenes);
  }

  /**
   * Generate JSON with icons baked in as SVG data URLs
   * This ensures the exported HTML doesn't need the SenangStart icons library
   */
  async generateJSONWithBakedIcons() {
    const jsonData = this.generateJSON();
    
    // Process all scenes and convert icon names to data URLs
    // Scenes are an array in unified format
    for (const scene of jsonData.scenes) {
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
}

export default ExportManager;
