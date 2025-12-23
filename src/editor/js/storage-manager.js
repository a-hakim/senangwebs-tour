// Storage Manager - Handles LocalStorage operations
import { downloadTextAsFile, showToast } from "./utils.js";

class ProjectStorageManager {
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
        showToast("Storage quota exceeded. Project too large!", "error");
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
      showToast("Failed to load project", "error");
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

      // panorama or imageUrl is required for scenes to be valid (support both formats)
      const hasImage = (scene.panorama && typeof scene.panorama === "string") ||
                       (scene.imageUrl && typeof scene.imageUrl === "string");
      if (!hasImage) {
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
      showToast("Failed to export project", "error");
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
          showToast("Invalid project file", "error");
          reject(error);
        }
      };

      reader.onerror = () => {
        console.error("Failed to read file:", reader.error);
        showToast("Failed to read file", "error");
        reject(reader.error);
      };

      reader.readAsText(file);
    });
  }
}

export default ProjectStorageManager;
