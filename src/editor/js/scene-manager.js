// Scene Manager - Handles scene operations
import { generateThumbnail, loadImageAsDataUrl, sanitizeId, showToast } from './utils.js';

class SceneManagerEditor {
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
                id: sanitizeId(file.name.replace(/\.[^/.]+$/, '')),
                name: file.name.replace(/\.[^/.]+$/, ''),
                imageUrl: imageDataUrl,
                thumbnail: thumbnail,
                hotspots: []
            };
            
            this.scenes.push(scene);
            this.currentSceneIndex = this.scenes.length - 1;
showToast(`Scene "${scene.name}" added successfully`, 'success');
            return scene;
        } catch (error) {
            console.error('Failed to add scene:', error);
            showToast('Failed to add scene', 'error');
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
                this.currentSceneIndex = Math.min(this.currentSceneIndex, this.scenes.length - 1);
            } else if (this.currentSceneIndex > index) {
                this.currentSceneIndex--;
            }
            
            showToast(`Scene "${scene.name}" removed`, 'success');
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
        return this.scenes.find(s => s.id === id) || null;
    }

    /**
     * Update scene property
     */
    updateScene(index, property, value) {
        if (index >= 0 && index < this.scenes.length) {
            this.scenes[index][property] = value;
            
            // If updating ID, update all hotspot target references
            if (property === 'id') {
                this.scenes.forEach(scene => {
                    scene.hotspots.forEach(hotspot => {
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
        if (fromIndex >= 0 && fromIndex < this.scenes.length &&
            toIndex >= 0 && toIndex < this.scenes.length) {
            
            const scene = this.scenes.splice(fromIndex, 1)[0];
            this.scenes.splice(toIndex, 0, scene);
            
            // Update current scene index
            if (this.currentSceneIndex === fromIndex) {
                this.currentSceneIndex = toIndex;
            } else if (fromIndex < this.currentSceneIndex && toIndex >= this.currentSceneIndex) {
                this.currentSceneIndex--;
            } else if (fromIndex > this.currentSceneIndex && toIndex <= this.currentSceneIndex) {
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
     * Clear all scenes
     */
    clearScenes() {
        if (this.scenes.length > 0) {
            if (!confirm('Are you sure you want to clear all scenes?')) {
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
}

export default SceneManagerEditor;
