// Hotspot Editor - Handles hotspot placement and editing
import { generateId, showToast } from './utils.js';

class HotspotEditor {
    constructor(editor) {
        this.editor = editor;
        this.currentHotspotIndex = -1;
        this.placementMode = false;
    }

    /**
     * Enable hotspot placement mode
     */
    enablePlacementMode() {
        const scene = this.editor.sceneManager.getCurrentScene();
        if (!scene) {
            showToast('Please select a scene first', 'error');
            return false;
        }

        this.placementMode = true;
        
        // Visual feedback
        document.body.style.cursor = 'crosshair';
        const preview = document.getElementById('preview');
        if (preview) {
            preview.style.border = '3px solid #4CC3D9';
            preview.style.boxShadow = '0 0 20px rgba(76, 195, 217, 0.5)';
        }
        
        // Update button state
        const btn = document.getElementById('addHotspotBtn');
        if (btn) {
            btn.textContent = 'Click on Preview...';
            btn.classList.add('btn-active');
        }
        
        showToast('Click on the 360° preview to place hotspot', 'info', 5000);
        return true;
    }

    /**
     * Disable hotspot placement mode
     */
    disablePlacementMode() {
        this.placementMode = false;
        document.body.style.cursor = 'default';
        
        // Remove visual feedback
        const preview = document.getElementById('preview');
        if (preview) {
            preview.style.border = '';
            preview.style.boxShadow = '';
        }
        
        // Reset button state
        const btn = document.getElementById('addHotspotBtn');
        if (btn) {
            btn.textContent = '+ Add Hotspot';
            btn.classList.remove('btn-active');
        }
}

    /**
     * Add hotspot at position
     */
    addHotspot(position, targetSceneId = '') {
        const scene = this.editor.sceneManager.getCurrentScene();
        if (!scene) {
            showToast('No scene selected', 'error');
            return null;
        }

        const hotspot = {
            id: generateId('hotspot'),
            type: 'navigation',
            position: position,
            targetSceneId: targetSceneId,
            title: 'New Hotspot',
            description: '',
            color: '#00ff00',
            icon: ''
        };

        scene.hotspots.push(hotspot);
        this.currentHotspotIndex = scene.hotspots.length - 1;
        
        this.disablePlacementMode();
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
     */
    updateHotspot(index, property, value) {
        const scene = this.editor.sceneManager.getCurrentScene();
        if (!scene || index < 0 || index >= scene.hotspots.length) {
            return false;
        }

        scene.hotspots[index][property] = value;
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
        duplicate.title = original.title + ' (Copy)';
        
        // Offset position slightly
        duplicate.position = {
            x: original.position.x + 0.5,
            y: original.position.y,
            z: original.position.z
        };

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
