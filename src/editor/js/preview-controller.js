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
    async loadScene(scene, preserveCameraRotation = true) {
        if (!this.isInitialized || !scene) {
            console.warn('Cannot load scene:', { initialized: this.isInitialized, scene: !!scene });
            return;
        }

        console.log('Loading scene into preview:', scene.name);

        // Save camera rotation before destroying scene
        let savedRotation = null;
        if (preserveCameraRotation) {
            savedRotation = this.getCameraRotation();
            console.log('Saving camera rotation before reload:', savedRotation);
        }

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

        // Build scenes object with ALL scenes (for navigation to work)
        const allScenes = {};
        const editorScenes = this.editor.sceneManager.scenes || [];
        editorScenes.forEach(s => {
            const sceneHotspots = (s.hotspots || []).map(h => ({
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

            allScenes[s.id] = {
                id: s.id,
                name: s.name,
                panorama: s.imageUrl,
                hotspots: sceneHotspots
            };
        });

        const tourConfig = {
            title: scene.name,
            initialScene: scene.id,
            scenes: allScenes,
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
                
                // Find the hotspot index by ID and select it
                const hotspotId = e.detail?.hotspotId;
                if (hotspotId) {
                    const scene = this.editor.sceneManager.getCurrentScene();
                    if (scene) {
                        const hotspotIndex = scene.hotspots.findIndex(h => h.id === hotspotId);
                        if (hotspotIndex >= 0) {
                            this.editor.selectHotspot(hotspotIndex);
                        }
                    }
                }
            });

            // Start the tour
            await this.tour.start();
            console.log('Preview tour started successfully');
            
            // Restore camera rotation if preserved
            if (savedRotation && preserveCameraRotation) {
                console.log('Restoring camera rotation:', savedRotation);
                this.setCameraRotation(savedRotation);
            }
            
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
     * Get current camera rotation
     */
    getCameraRotation() {
        const aframeScene = this.previewContainer?.querySelector('a-scene');
        if (!aframeScene) {
            console.log('No scene found for getting camera rotation');
            return null;
        }
        
        const camera = aframeScene.querySelector('[camera]');
        if (!camera) {
            console.log('No camera found for getting rotation');
            return null;
        }
        
        // Get rotation from object3D which is more reliable
        const rotation = camera.object3D.rotation;
        const savedRotation = {
            x: rotation.x,
            y: rotation.y,
            z: rotation.z
        };
        
        console.log('Saved camera rotation:', savedRotation);
        return savedRotation;
    }

    /**
     * Set camera rotation
     */
    setCameraRotation(rotation) {
        if (!rotation) {
            console.log('No rotation to restore');
            return;
        }
        
        const aframeScene = this.previewContainer?.querySelector('a-scene');
        if (!aframeScene) {
            console.log('No scene found for setting camera rotation');
            return;
        }
        
        const camera = aframeScene.querySelector('[camera]');
        if (!camera) {
            console.log('No camera found for setting rotation');
            return;
        }
        
        // Set rotation on object3D directly
        const setRotation = () => {
            if (camera.object3D) {
                camera.object3D.rotation.set(rotation.x, rotation.y, rotation.z);
                console.log('Camera rotation restored:', rotation);
            }
        };
        
        // Try immediately and also after a delay to ensure it sticks
        setRotation();
        setTimeout(setRotation, 100);
        setTimeout(setRotation, 300);
    }

    /**
     * Refresh preview (reload current scene while preserving camera rotation)
     */
    async refresh() {
        const scene = this.editor.sceneManager.getCurrentScene();
        if (scene) {
            // Save current camera rotation
            const savedRotation = this.getCameraRotation();
            console.log('Saving camera rotation:', savedRotation);
            
            // Reload scene
            await this.loadScene(scene);
            
            // Restore camera rotation
            if (savedRotation) {
                this.setCameraRotation(savedRotation);
            }
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
     * Point camera to hotspot position
     */
    pointCameraToHotspot(hotspotPosition) {
        if (!hotspotPosition) {
            console.warn('No hotspot position provided');
            return;
        }

        const aframeScene = this.previewContainer?.querySelector('a-scene');
        if (!aframeScene) {
            console.warn('No A-Frame scene found');
            return;
        }

        const camera = aframeScene.querySelector('[camera]');
        if (!camera || !camera.object3D) {
            console.warn('Camera not found');
            return;
        }

        // Get camera position (usually at origin 0,0,0)
        const cameraPos = camera.object3D.position;
        
        // Calculate direction vector from camera to hotspot
        const direction = new THREE.Vector3(
            hotspotPosition.x - cameraPos.x,
            hotspotPosition.y - cameraPos.y,
            hotspotPosition.z - cameraPos.z
        );

        // Calculate spherical coordinates (yaw and pitch)
        const distance = direction.length();
        
        // Pitch (up/down rotation around X-axis) - in degrees
        const pitch = Math.asin(direction.y / distance) * (180 / Math.PI);
        
        // Yaw (left/right rotation around Y-axis) - in degrees
        // Using atan2 to get correct quadrant
        const yaw = Math.atan2(direction.x, direction.z) * (180 / Math.PI);

        // Apply smooth rotation with animation
        this.animateCameraRotation(camera, { x: pitch, y: yaw, z: 0 });
        
        console.log('Camera pointing to hotspot:', { position: hotspotPosition, rotation: { pitch, yaw } });
    }

    /**
     * Animate camera rotation smoothly
     */
    animateCameraRotation(camera, targetRotation, duration = 800) {
        if (!camera || !camera.object3D) return;

        const startRotation = {
            x: camera.object3D.rotation.x * (180 / Math.PI),
            y: camera.object3D.rotation.y * (180 / Math.PI),
            z: camera.object3D.rotation.z * (180 / Math.PI)
        };

        // Handle angle wrapping for smooth rotation
        let deltaY = targetRotation.y - startRotation.y;
        
        // Normalize to -180 to 180 range
        while (deltaY > 180) deltaY -= 360;
        while (deltaY < -180) deltaY += 360;
        
        const endRotationY = startRotation.y + deltaY;

        const startTime = Date.now();

        const animate = () => {
            const elapsed = Date.now() - startTime;
            const progress = Math.min(elapsed / duration, 1);
            
            // Ease-in-out function for smooth animation
            const eased = progress < 0.5
                ? 2 * progress * progress
                : 1 - Math.pow(-2 * progress + 2, 2) / 2;

            // Interpolate rotation
            const currentRotation = {
                x: startRotation.x + (targetRotation.x - startRotation.x) * eased,
                y: startRotation.y + (endRotationY - startRotation.y) * eased,
                z: startRotation.z + (targetRotation.z - startRotation.z) * eased
            };

            // Apply rotation (convert degrees to radians)
            camera.object3D.rotation.set(
                currentRotation.x * (Math.PI / 180),
                currentRotation.y * (Math.PI / 180),
                currentRotation.z * (Math.PI / 180)
            );

            if (progress < 1) {
                requestAnimationFrame(animate);
            }
        };

        animate();
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
     * Update hotspot marker (refresh scene while preserving camera rotation)
     */
    async updateHotspotMarker(index) {
        const scene = this.editor.sceneManager.getCurrentScene();
        if (!scene || !this.tour) return;
        
        const hotspot = scene.hotspots[index];
        if (!hotspot) return;
        
        // Refresh the preview to reflect changes, camera rotation will be preserved
        await this.refresh();
    }
}
