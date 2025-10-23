// Preview Controller - Manages A-Frame preview integration using SWT library

class PreviewController {
    constructor(editor) {
        this.editor = editor;
        this.tour = null;
        this.isInitialized = false;
        this.previewContainer = null;
    }

    /**
     * Initialize A-Frame preview
     */
    async init() {
        this.previewContainer = document.getElementById('preview');
        if (!this.previewContainer) {
            console.error('Preview element not found');
            return false;
        }

        // Wait for A-Frame to be loaded
        if (typeof AFRAME === 'undefined') {
            console.log('Waiting for A-Frame to load...');
            await this.waitForLibrary('AFRAME', 5000);
        }

        // Wait for SWT library to be loaded
        if (typeof SWT === 'undefined') {
            console.log('Waiting for SWT library to load...');
            await this.waitForLibrary('SWT', 5000);
        }

        console.log('Preview initialized successfully');
        this.isInitialized = true;
        return true;
    }

    /**
     * Wait for a global library to be available
     */
    async waitForLibrary(libraryName, timeout = 5000) {
        const startTime = Date.now();
        
        while (typeof window[libraryName] === 'undefined') {
            if (Date.now() - startTime > timeout) {
                throw new Error(`Timeout waiting for ${libraryName} to load`);
            }
            await new Promise(resolve => setTimeout(resolve, 100));
        }
        
        console.log(`${libraryName} loaded successfully`);
    }

    /**
     * Load scene into preview using SWT library
     */
    async loadScene(scene) {
        if (!this.isInitialized || !scene) {
            console.warn('Cannot load scene:', { initialized: this.isInitialized, scene: !!scene });
            return;
        }

        console.log('Loading scene into preview:', scene.name);

        // Destroy existing tour if any
        if (this.tour) {
            console.log('Destroying existing tour');
            this.tour.destroy();
            this.tour = null;
        }

        // Clear preview container
        this.previewContainer.innerHTML = '';

        // Create A-Frame scene
        const aframeScene = document.createElement('a-scene');
        aframeScene.id = 'preview-scene';
        aframeScene.setAttribute('embedded', '');
        aframeScene.setAttribute('vr-mode-ui', 'enabled: false');
        this.previewContainer.appendChild(aframeScene);

        // Build tour config for this single scene
        // Transform editor scene format to library format
        const transformedHotspots = (scene.hotspots || []).map(h => ({
            id: h.id,
            position: h.position,
            action: {
                type: h.type === 'navigation' ? 'navigateTo' : h.type,
                target: h.targetSceneId
            },
            appearance: {
                color: h.color || '#00ff00',
                icon: h.icon || null,
                scale: h.scale || '1 1 1'
            },
            tooltip: {
                text: h.title || 'Hotspot'
            }
        }));

        const libraryScene = {
            id: scene.id,
            name: scene.name,
            panorama: scene.imageUrl, // Editor uses 'imageUrl', library expects 'panorama'
            hotspots: transformedHotspots
        };

        const tourConfig = {
            title: scene.name,
            initialScene: scene.id,
            scenes: {
                [scene.id]: libraryScene
            },
            settings: {
                autoRotate: false,
                showCompass: false
            }
        };

        // Wait for A-Frame scene to be loaded
        await new Promise((resolve, reject) => {
            const timeout = setTimeout(() => {
                reject(new Error('Timeout waiting for A-Frame scene to load'));
            }, 5000);

            aframeScene.addEventListener('loaded', () => {
                clearTimeout(timeout);
                console.log('A-Frame scene loaded');
                resolve();
            });
        });

        try {
            // Create new tour instance
            console.log('Creating tour with config:', tourConfig);
            this.tour = new SWT.Tour(aframeScene, tourConfig);

            // Set up event listeners
            this.tour.addEventListener('tour-started', (e) => {
                console.log('Preview tour started:', e.detail);
            });

            this.tour.addEventListener('scene-loaded', (e) => {
                console.log('Preview scene loaded:', e.detail);
            });

            this.tour.addEventListener('hotspot-activated', (e) => {
                console.log('Preview hotspot clicked:', e.detail);
            });

            // Start the tour
            await this.tour.start();
            console.log('Preview tour started successfully');
            
            // Setup click handler after a short delay to ensure A-Frame is ready
            setTimeout(() => {
                this.setupClickHandler();
            }, 500);

        } catch (error) {
            console.error('Failed to load preview:', error);
            showToast('Failed to load preview: ' + error.message, 'error');
        }
    }

    /**
     * Setup click handler for hotspot placement
     */
    setupClickHandler() {
        if (!this.tour) {
            console.warn('Tour not initialized, cannot setup click handler');
            return;
        }

        const aframeScene = this.previewContainer.querySelector('a-scene');
        if (!aframeScene) {
            console.warn('A-Frame scene not found in preview');
            setTimeout(() => this.setupClickHandler(), 200); // Retry
            return;
        }

        // Remove any existing click handler to avoid duplicates
        if (this.clickHandler) {
            aframeScene.removeEventListener('click', this.clickHandler);
        }

        // Create and store the click handler
        this.clickHandler = (evt) => {
            console.log('Preview clicked', { placementMode: this.editor.hotspotEditor.placementMode });
            
            if (!this.editor.hotspotEditor.placementMode) {
                return;
            }

            // Try to get intersection from event detail first
            let intersection = evt.detail?.intersection;
            
            // If no intersection, perform manual raycasting
            if (!intersection) {
                const camera = aframeScene.querySelector('[camera]');
                const sky = aframeScene.querySelector('a-sky');
                
                if (!camera || !sky) {
                    console.warn('Camera or sky not found');
                    showToast('Scene not ready, please try again', 'warning');
                    return;
                }

                // Get mouse position relative to canvas
                const canvas = aframeScene.canvas;
                const rect = canvas.getBoundingClientRect();
                const mouse = {
                    x: ((evt.clientX - rect.left) / rect.width) * 2 - 1,
                    y: -((evt.clientY - rect.top) / rect.height) * 2 + 1
                };

                // Perform raycasting
                const raycaster = new THREE.Raycaster();
                const cameraEl = camera.object3D;
                raycaster.setFromCamera(mouse, cameraEl.children[0]); // Get the actual camera

                // Raycast against the sky sphere
                const intersects = raycaster.intersectObject(sky.object3D, true);
                
                if (intersects.length > 0) {
                    intersection = intersects[0];
                } else {
                    console.warn('No intersection found with raycasting');
                    showToast('Click on the panorama image', 'warning');
                    return;
                }
            }

            const point = intersection.point;
            const position = {
                x: parseFloat(point.x.toFixed(2)),
                y: parseFloat(point.y.toFixed(2)),
                z: parseFloat(point.z.toFixed(2))
            };

            console.log('Hotspot position:', position);
            this.editor.addHotspotAtPosition(position);
        };

        console.log('Setting up click handler for hotspot placement');
        aframeScene.addEventListener('click', this.clickHandler);
    }

    /**
     * Refresh preview (reload current scene)
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
        const camera = this.previewContainer?.querySelector('[camera]');
        if (camera) {
            camera.setAttribute('rotation', '0 0 0');
        }
    }

    /**
     * Highlight hotspot (not needed with library, but keep for compatibility)
     */
    highlightHotspot(index) {
        // The library handles hotspot visualization
        // This is kept for API compatibility
        console.log('Hotspot highlighted:', index);
    }

    /**
     * Update hotspot marker (update without full refresh to preserve camera)
     */
    updateHotspotMarker(index) {
        const scene = this.editor.sceneManager.getCurrentScene();
        if (!scene || !this.tour) return;
        
        const hotspot = scene.hotspots[index];
        if (!hotspot) return;
        
        // Find the hotspot entity in the scene
        const aframeScene = this.previewContainer.querySelector('a-scene');
        if (aframeScene) {
            // The library creates hotspots as entities with class 'swt-hotspot'
            const hotspotElements = aframeScene.querySelectorAll('.swt-hotspot');
            const hotspotEl = hotspotElements[index];
            
            if (hotspotEl) {
                // Update color - find the visual element (a-plane or a-image)
                const visualEl = hotspotEl.querySelector('a-plane, a-image');
                if (visualEl && visualEl.tagName === 'A-PLANE') {
                    visualEl.setAttribute('color', hotspot.color || '#00ff00');
                }
                
                // Update position
                if (hotspot.position) {
                    hotspotEl.setAttribute('position', `${hotspot.position.x} ${hotspot.position.y} ${hotspot.position.z}`);
                }
                
                // Update tooltip text
                const textEl = hotspotEl.querySelector('a-text');
                if (textEl) {
                    textEl.setAttribute('value', hotspot.title || 'Hotspot');
                }
            }
        }
    }
}
