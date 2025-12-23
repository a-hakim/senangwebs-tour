// Hotspot Editor - Handles hotspot placement and editing
import { generateId, showToast } from './utils.js';

class HotspotEditor {
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
            showToast('No scene selected', 'error');
            return null;
        }

        // Use unified library format with nested structure
        const hotspot = {
            id: generateId('hotspot'),
            position: position,
            cameraOrientation: cameraOrientation,
            action: {
                type: 'navigateTo',
                target: targetSceneId
            },
            appearance: {
                color: '#00ff00',
                scale: '1 1 1',
                icon: ''
            },
            tooltip: {
                text: 'New Hotspot',
                description: ''
            }
        };

        scene.hotspots.push(hotspot);
        this.currentHotspotIndex = scene.hotspots.length - 1;
        
        showToast('Hotspot added', 'success');
        
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

        showToast('Hotspot removed', 'success');
        return true;
    }

    /**
     * Update hotspot property
     * Supports nested properties like 'appearance.color', 'action.target', 'tooltip.text'
     */
    updateHotspot(index, property, value) {
        const scene = this.editor.sceneManager.getCurrentScene();
        if (!scene || index < 0 || index >= scene.hotspots.length) {
            return false;
        }

        const hotspot = scene.hotspots[index];
        
        // Handle nested properties (e.g., 'appearance.color')
        if (property.includes('.')) {
            const parts = property.split('.');
            let obj = hotspot;
            for (let i = 0; i < parts.length - 1; i++) {
                if (!obj[parts[i]]) {
                    obj[parts[i]] = {};
                }
                obj = obj[parts[i]];
            }
            obj[parts[parts.length - 1]] = value;
        } else {
            hotspot[property] = value;
        }
        
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
        if (duplicate.tooltip) {
            duplicate.tooltip.text = (original.tooltip?.text || 'Hotspot') + ' (Copy)';
        }
        
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
        
        showToast('Hotspot duplicated', 'success');
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
        
        showToast('All hotspots removed', 'success');
        return true;
    }
}

export default HotspotEditor;
