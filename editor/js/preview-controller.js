// Preview Controller - Manages A-Frame preview integration

class PreviewController {
    constructor(editor) {
        this.editor = editor;
        this.aframeScene = null;
        this.camera = null;
        this.sky = null;
        this.hotspotsContainer = null;
        this.isInitialized = false;
        this.hotspotMarkers = [];
    }

    /**
     * Initialize A-Frame preview
     */
    async init() {
        const preview = document.getElementById('preview');
        if (!preview) {
            console.error('Preview element not found');
            return false;
        }

        // Wait for A-Frame to be loaded
        if (typeof AFRAME === 'undefined') {
            console.error('A-Frame not loaded');
            return false;
        }

        this.aframeScene = preview.querySelector('a-scene');
        if (!this.aframeScene) {
            console.error('A-Frame scene not found');
            return false;
        }

        // Wait for scene to load
        await new Promise(resolve => {
            if (this.aframeScene.hasLoaded) {
                resolve();
            } else {
                this.aframeScene.addEventListener('loaded', resolve, { once: true });
            }
        });

        this.camera = this.aframeScene.querySelector('[camera]');
        this.sky = this.aframeScene.querySelector('a-sky');
        this.hotspotsContainer = this.aframeScene.querySelector('#hotspots');

        // Setup click handler for hotspot placement
        this.setupClickHandler();

        this.isInitialized = true;
        return true;
    }

    /**
     * Setup click handler for hotspot placement
     */
    setupClickHandler() {
        this.aframeScene.addEventListener('click', (evt) => {
            if (!this.editor.hotspotEditor.placementMode) {
                return;
            }

            const intersection = evt.detail.intersection;
            if (!intersection) {
                return;
            }

            const point = intersection.point;
            const position = {
                x: parseFloat(point.x.toFixed(2)),
                y: parseFloat(point.y.toFixed(2)),
                z: parseFloat(point.z.toFixed(2))
            };

            this.editor.addHotspotAtPosition(position);
        });
    }

    /**
     * Load scene into preview
     */
    loadScene(scene) {
        if (!this.isInitialized || !scene) {
            return;
        }

        // Update sky
        if (this.sky && scene.imageUrl) {
            this.sky.setAttribute('src', scene.imageUrl);
        }

        // Clear and reload hotspots
        this.clearHotspots();
        this.loadHotspots(scene.hotspots);
    }

    /**
     * Load hotspots into preview
     */
    loadHotspots(hotspots) {
        if (!this.hotspotsContainer) {
            return;
        }

        hotspots.forEach((hotspot, index) => {
            this.createHotspotMarker(hotspot, index);
        });
    }

    /**
     * Create hotspot marker
     */
    createHotspotMarker(hotspot, index) {
        const marker = document.createElement('a-sphere');
        marker.setAttribute('radius', '0.3');
        marker.setAttribute('color', hotspot.color || '#00ff00');
        marker.setAttribute('position', positionToString(hotspot.position));
        marker.setAttribute('class', 'hotspot-marker');
        marker.setAttribute('data-hotspot-index', index);

        // Add hover effect
        marker.setAttribute('animation__mouseenter', {
            property: 'scale',
            to: '1.3 1.3 1.3',
            dur: 200,
            startEvents: 'mouseenter'
        });
        marker.setAttribute('animation__mouseleave', {
            property: 'scale',
            to: '1 1 1',
            dur: 200,
            startEvents: 'mouseleave'
        });

        // Add click handler
        marker.addEventListener('click', () => {
            this.editor.selectHotspot(index);
        });

        this.hotspotsContainer.appendChild(marker);
        this.hotspotMarkers.push(marker);
    }

    /**
     * Update hotspot marker
     */
    updateHotspotMarker(index) {
        if (index < 0 || index >= this.hotspotMarkers.length) {
            return;
        }

        const scene = this.editor.sceneManager.getCurrentScene();
        if (!scene) {
            return;
        }

        const hotspot = scene.hotspots[index];
        const marker = this.hotspotMarkers[index];

        if (hotspot && marker) {
            marker.setAttribute('position', positionToString(hotspot.position));
            marker.setAttribute('color', hotspot.color || '#00ff00');
        }
    }

    /**
     * Highlight hotspot marker
     */
    highlightHotspot(index) {
        this.hotspotMarkers.forEach((marker, i) => {
            if (i === index) {
                marker.setAttribute('material', 'emissive', '#ffffff');
                marker.setAttribute('material', 'emissiveIntensity', 0.5);
            } else {
                marker.setAttribute('material', 'emissive', '#000000');
                marker.setAttribute('material', 'emissiveIntensity', 0);
            }
        });
    }

    /**
     * Clear all hotspots
     */
    clearHotspots() {
        if (!this.hotspotsContainer) {
            return;
        }

        while (this.hotspotsContainer.firstChild) {
            this.hotspotsContainer.removeChild(this.hotspotsContainer.firstChild);
        }

        this.hotspotMarkers = [];
    }

    /**
     * Refresh preview
     */
    refresh() {
        const scene = this.editor.sceneManager.getCurrentScene();
        if (scene) {
            this.loadScene(scene);
        }
    }

    /**
     * Reset camera
     */
    resetCamera() {
        if (this.camera) {
            this.camera.setAttribute('rotation', '0 0 0');
        }
    }
}
