// Export Manager - Handles JSON generation for SWT library
import { downloadTextAsFile, showModal } from "./utils.js";

class ExportManager {
  constructor(editor) {
    this.editor = editor;
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
   * Generate HTML viewer code
   */
  generateViewerHTML() {
    const jsonData = this.generateJSON();
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
      <a-camera>
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
   * Export as standalone HTML viewer
   */
  exportViewerHTML() {
    try {
      const html = this.generateViewerHTML();
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
