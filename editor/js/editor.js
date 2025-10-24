// Main Editor Controller

class TourEditor {
    constructor() {
        this.config = {
            title: 'My Virtual Tour',
            description: '',
            initialSceneId: '',
            autoRotate: false,
            showCompass: false
        };
        
        this.storageManager = new StorageManager();
        this.sceneManager = new SceneManagerEditor(this);
        this.hotspotEditor = new HotspotEditor(this);
        this.previewController = new PreviewController(this);
        this.uiController = new UIController(this);
        this.exportManager = new ExportManager(this);
        
        this.hasUnsavedChanges = false;
        this.lastRenderedSceneIndex = -1; // Track which scene is currently loaded in preview
    }

    /**
     * Initialize editor
     */
    async init() {
        console.log('Initializing SenangWebs Tour Editor...');
        
        // Initialize preview
        const previewInit = await this.previewController.init();
        if (!previewInit) {
            console.error('Failed to initialize preview controller');
            showToast('Failed to initialize preview', 'error');
            return;
        }
        
        // Setup event listeners
        this.setupEventListeners();
        
        // Load saved project if exists
        if (this.storageManager.hasProject()) {
            if (confirm('Load previously saved project?')) {
                this.loadProject();
            }
        }
        
        // Start auto-save
        // this.storageManager.startAutoSave(() => {
        //     this.saveProject();
        // });
        
        // Initial render
        this.render();
        
        console.log('Editor initialized successfully');
        showToast('Editor ready', 'success');
    }

    /**
     * Setup event listeners
     */
    setupEventListeners() {
        // Toolbar buttons
        document.getElementById('newBtn')?.addEventListener('click', () => this.newProject());
        document.getElementById('saveBtn')?.addEventListener('click', () => this.saveProject());
        document.getElementById('exportBtn')?.addEventListener('click', () => this.exportManager.showExportPreview());
        document.getElementById('importBtn')?.addEventListener('click', () => this.importProject());
        document.getElementById('helpBtn')?.addEventListener('click', () => showModal('helpModal'));

        // Scene management
        document.getElementById('addSceneBtn')?.addEventListener('click', () => {
            document.getElementById('sceneUpload').click();
        });
        
        document.getElementById('sceneUpload')?.addEventListener('change', (e) => {
            this.handleSceneUpload(e.target.files);
            e.target.value = ''; // Reset input
        });

        // Hotspot management
        document.getElementById('addHotspotBtn')?.addEventListener('click', () => {
            this.hotspotEditor.enablePlacementMode();
        });
        
        document.getElementById('clearHotspotsBtn')?.addEventListener('click', () => {
            if (this.hotspotEditor.clearAllHotspots()) {
                this.render();
            }
        });

        // Properties tabs
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                this.uiController.switchTab(btn.dataset.tab);
            });
        });

        // Hotspot properties
        document.getElementById('hotspotTitle')?.addEventListener('input', debounce((e) => {
            this.updateCurrentHotspot('title', e.target.value);
        }, 300));
        
        document.getElementById('hotspotDescription')?.addEventListener('input', debounce((e) => {
            this.updateCurrentHotspot('description', e.target.value);
        }, 300));
        
        document.getElementById('hotspotTarget')?.addEventListener('change', (e) => {
            this.updateCurrentHotspot('targetSceneId', e.target.value);
        });
        
        document.getElementById('hotspotColor')?.addEventListener('input', (e) => {
            this.updateCurrentHotspot('color', e.target.value);
        });

        // Hotspot position inputs
        document.getElementById('hotspotPosX')?.addEventListener('input', debounce((e) => {
            this.updateCurrentHotspotPosition('x', parseFloat(e.target.value) || 0);
        }, 300));
        
        document.getElementById('hotspotPosY')?.addEventListener('input', debounce((e) => {
            this.updateCurrentHotspotPosition('y', parseFloat(e.target.value) || 0);
        }, 300));
        
        document.getElementById('hotspotPosZ')?.addEventListener('input', debounce((e) => {
            this.updateCurrentHotspotPosition('z', parseFloat(e.target.value) || 0);
        }, 300));

        // Scene properties
        document.getElementById('sceneId')?.addEventListener('input', debounce((e) => {
            this.updateCurrentScene('id', sanitizeId(e.target.value));
        }, 300));
        
        document.getElementById('sceneName')?.addEventListener('input', debounce((e) => {
            this.updateCurrentScene('name', e.target.value);
        }, 300));
        
        document.getElementById('sceneImageUrl')?.addEventListener('input', debounce((e) => {
            this.updateCurrentSceneImage(e.target.value);
        }, 300));

        // Tour properties
        document.getElementById('tourTitle')?.addEventListener('input', debounce((e) => {
            this.config.title = e.target.value;
            this.markUnsavedChanges();
        }, 300));
        
        document.getElementById('tourDescription')?.addEventListener('input', debounce((e) => {
            this.config.description = e.target.value;
            this.markUnsavedChanges();
        }, 300));
        
        document.getElementById('tourInitialScene')?.addEventListener('change', (e) => {
            this.config.initialSceneId = e.target.value;
            this.markUnsavedChanges();
        });
        
        document.getElementById('tourAutoRotate')?.addEventListener('change', (e) => {
            this.config.autoRotate = e.target.checked;
            this.markUnsavedChanges();
        });
        
        document.getElementById('tourShowCompass')?.addEventListener('change', (e) => {
            this.config.showCompass = e.target.checked;
            this.markUnsavedChanges();
        });

        // Export modal buttons
        document.getElementById('exportJsonBtn')?.addEventListener('click', () => {
            this.exportManager.exportJSON();
        });
        
        document.getElementById('copyJsonBtn')?.addEventListener('click', () => {
            this.exportManager.copyJSON();
        });
        
        document.getElementById('exportViewerBtn')?.addEventListener('click', () => {
            this.exportManager.exportViewerHTML();
        });

        // Modal close buttons
        document.querySelectorAll('.modal-close').forEach(btn => {
            btn.addEventListener('click', () => {
                const modal = btn.closest('.modal');
                if (modal) {
                    hideModal(modal.id);
                }
            });
        });

        // Import file input
        document.getElementById('importUpload')?.addEventListener('change', (e) => {
            if (e.target.files.length > 0) {
                this.handleImportFile(e.target.files[0]);
                e.target.value = '';
            }
        });

        // Warn before leaving with unsaved changes
        window.addEventListener('beforeunload', (e) => {
            if (this.hasUnsavedChanges) {
                e.preventDefault();
                e.returnValue = '';
            }
        });
    }

    /**
     * Handle scene upload
     */
    async handleSceneUpload(files) {
        if (!files || files.length === 0) return;

        this.uiController.setLoading(true);

        for (const file of files) {
            if (!file.type.startsWith('image/')) {
                showToast(`${file.name} is not an image`, 'error');
                continue;
            }

            await this.sceneManager.addScene(file);
        }

        this.uiController.setLoading(false);
        this.render();
        this.markUnsavedChanges();
    }

    /**
     * Add hotspot at position
     */
    addHotspotAtPosition(position) {
        // Clamp position to within 10-unit radius
        const distance = Math.sqrt(position.x * position.x + position.y * position.y + position.z * position.z);
        if (distance > 5) {
            const scale = 5 / distance;
            position.x *= scale;
            position.y *= scale;
            position.z *= scale;
            position.x = parseFloat(position.x.toFixed(2));
            position.y = parseFloat(position.y.toFixed(2));
            position.z = parseFloat(position.z.toFixed(2));
            console.log('Position clamped to 10-unit radius:', position);
        }
        
        console.log('Adding hotspot at position:', position);
        const hotspot = this.hotspotEditor.addHotspot(position);
        if (hotspot) {
            console.log('Hotspot added successfully:', hotspot);
            // Force scene reload to show new hotspot
            this.lastRenderedSceneIndex = -1;
            this.render();
            this.markUnsavedChanges();
        } else {
            console.error('Failed to add hotspot');
        }
    }

    /**
     * Select scene by index
     */
    selectScene(index) {
        console.log('Selecting scene:', index);
        if (this.sceneManager.setCurrentScene(index)) {
            console.log('Scene selected successfully, rendering...');
            // Scene changed, so we need to reload it with fresh camera
            this.lastRenderedSceneIndex = -1;
            
            // Get the new scene and load with camera reset
            const scene = this.sceneManager.getCurrentScene();
            if (scene) {
                this.previewController.loadScene(scene, false); // Don't preserve camera when switching scenes
                this.lastRenderedSceneIndex = index;
            }
            
            // Update UI
            this.uiController.renderSceneList();
            this.uiController.updateSceneProperties(scene);
            this.uiController.updateInitialSceneOptions();
            this.uiController.updateTargetSceneOptions();
        } else {
            console.warn('Failed to select scene:', index);
        }
    }

    /**
     * Select hotspot by index
     */
    selectHotspot(index) {
        if (this.hotspotEditor.setCurrentHotspot(index)) {
            // Get the selected hotspot
            const hotspot = this.hotspotEditor.getHotspot(index);
            
            // Update UI without reloading the scene
            this.uiController.renderHotspotList();
            this.uiController.updateHotspotProperties(hotspot);
            this.uiController.updateTargetSceneOptions();
            this.uiController.switchTab('hotspot');
            
            // Point camera to the hotspot for better UX
            if (hotspot && hotspot.position) {
                this.previewController.pointCameraToHotspot(hotspot.position);
            }
        }
    }

    /**
     * Remove scene
     */
    removeScene(index) {
        if (this.sceneManager.removeScene(index)) {
            this.render();
            this.markUnsavedChanges();
        }
    }

    /**
     * Remove hotspot
     */
    removeHotspot(index) {
        if (this.hotspotEditor.removeHotspot(index)) {
            // Force scene reload to remove hotspot
            this.lastRenderedSceneIndex = -1;
            this.render();
            this.markUnsavedChanges();
        }
    }

    /**
     * Duplicate hotspot
     */
    duplicateHotspot(index) {
        const hotspot = this.hotspotEditor.duplicateHotspot(index);
        if (hotspot) {
            // Force scene reload to show duplicated hotspot
            this.lastRenderedSceneIndex = -1;
            this.render();
            this.markUnsavedChanges();
        }
    }

    /**
     * Reorder scenes
     */
    reorderScenes(fromIndex, toIndex) {
        if (this.sceneManager.reorderScenes(fromIndex, toIndex)) {
            this.render();
            this.markUnsavedChanges();
        }
    }

    /**
     * Update current hotspot property
     */
    async updateCurrentHotspot(property, value) {
        const index = this.hotspotEditor.currentHotspotIndex;
        if (this.hotspotEditor.updateHotspot(index, property, value)) {
            await this.previewController.updateHotspotMarker(index);
            this.uiController.renderHotspotList();
            this.markUnsavedChanges();
        }
    }

    /**
     * Update current hotspot position (X, Y, or Z)
     */
    async updateCurrentHotspotPosition(axis, value) {
        const index = this.hotspotEditor.currentHotspotIndex;
        const hotspot = this.hotspotEditor.getHotspot(index);
        
        if (hotspot) {
            if (!hotspot.position) {
                hotspot.position = { x: 0, y: 0, z: 0 };
            }
            
            // Clamp value to within 10-unit radius
            hotspot.position[axis] = value;
            
            // Calculate distance from origin and clamp to radius 10
            const pos = hotspot.position;
            const distance = Math.sqrt(pos.x * pos.x + pos.y * pos.y + pos.z * pos.z);
            if (distance > 10) {
                const scale = 10 / distance;
                pos.x *= scale;
                pos.y *= scale;
                pos.z *= scale;
                
                // Update the input field with clamped value
                document.getElementById(`hotspotPos${axis.toUpperCase()}`).value = pos[axis].toFixed(2);
                showToast('Position clamped to 10-unit radius', 'info');
            }
            
            await this.previewController.updateHotspotMarker(index);
            this.uiController.renderHotspotList();
            this.markUnsavedChanges();
        }
    }

    /**
     * Update current scene property
     */
    updateCurrentScene(property, value) {
        const index = this.sceneManager.currentSceneIndex;
        if (this.sceneManager.updateScene(index, property, value)) {
            this.uiController.renderSceneList();
            this.markUnsavedChanges();
        }
    }

    /**
     * Update current scene image URL
     */
    async updateCurrentSceneImage(imageUrl) {
        const index = this.sceneManager.currentSceneIndex;
        if (index < 0) return;
        
        // Update the scene's image URL
        if (this.sceneManager.updateScene(index, 'imageUrl', imageUrl)) {
            // Force scene reload by resetting tracker
            this.lastRenderedSceneIndex = -1;
            
            // Reload the preview with the new image
            const scene = this.sceneManager.getCurrentScene();
            if (scene) {
                await this.previewController.loadScene(scene);
                this.lastRenderedSceneIndex = index;
                showToast('Scene image updated', 'success');
            }
            this.markUnsavedChanges();
        }
    }

    /**
     * Render all UI
     */
    render() {
        // Render scene list
        this.uiController.renderSceneList();
        
        // Render hotspot list
        this.uiController.renderHotspotList();
        
        // Update properties panels
        const currentScene = this.sceneManager.getCurrentScene();
        const currentHotspot = this.hotspotEditor.getCurrentHotspot();
        
        this.uiController.updateSceneProperties(currentScene);
        this.uiController.updateHotspotProperties(currentHotspot);
        this.uiController.updateTourProperties(this.config);
        this.uiController.updateInitialSceneOptions();
        this.uiController.updateTargetSceneOptions(); // Always update target scene dropdown
        
        // Update preview
        if (currentScene) {
            console.log('Rendering preview for scene:', currentScene.name);
            // Hide empty state
            const emptyState = document.querySelector('.preview-empty');
            if (emptyState) {
                emptyState.style.display = 'none';
            }
            
            // Only reload scene if it changed
            const currentSceneIndex = this.sceneManager.currentSceneIndex;
            if (currentSceneIndex !== this.lastRenderedSceneIndex) {
                console.log('Scene changed, reloading preview with camera preservation');
                // Load scene with camera rotation preservation enabled (default)
                this.previewController.loadScene(currentScene);
                this.lastRenderedSceneIndex = currentSceneIndex;
            } else {
                console.log('Same scene, skipping reload');
            }
            
            if (currentHotspot) {
                this.previewController.highlightHotspot(this.hotspotEditor.currentHotspotIndex);
            }
        } else {
            console.log('No current scene to render');
            // Show empty state
            const emptyState = document.querySelector('.preview-empty');
            if (emptyState) {
                emptyState.style.display = 'flex';
            }
            this.lastRenderedSceneIndex = -1;
        }
    }

    /**
     * Save project
     */
    saveProject() {
        const projectData = {
            config: this.config,
            scenes: this.sceneManager.getAllScenes()
        };

        if (this.storageManager.saveProject(projectData)) {
            this.hasUnsavedChanges = false;
            showToast('Project saved', 'success');
            return true;
        }
        return false;
    }

    /**
     * Load project
     */
    loadProject() {
        const projectData = this.storageManager.loadProject();
        if (projectData) {
            this.config = projectData.config || this.config;
            this.sceneManager.loadScenes(projectData.scenes || []);
            this.hasUnsavedChanges = false;
            this.render();
            showToast('Project loaded', 'success');
            return true;
        }
        return false;
    }

    /**
     * New project
     */
    newProject() {
        if (this.hasUnsavedChanges) {
            if (!confirm('You have unsaved changes. Create new project?')) {
                return false;
            }
        }

        this.config = {
            title: 'My Virtual Tour',
            description: '',
            initialSceneId: '',
            autoRotate: false,
            showCompass: false
        };
        
        this.sceneManager.clearScenes();
        this.hasUnsavedChanges = false;
        this.render();
        
        showToast('New project created', 'success');
        return true;
    }

    /**
     * Import project
     */
    importProject() {
        document.getElementById('importUpload').click();
    }

    /**
     * Handle import file
     */
    async handleImportFile(file) {
        try {
            this.uiController.setLoading(true);
            
            const projectData = await this.storageManager.importFromFile(file);
            
            this.config = projectData.config || projectData;
            this.sceneManager.loadScenes(projectData.scenes || []);
            this.hasUnsavedChanges = true;
            
            this.render();
            this.uiController.setLoading(false);
            
            showToast('Project imported successfully', 'success');
        } catch (error) {
            this.uiController.setLoading(false);
            console.error('Import failed:', error);
        }
    }

    /**
     * Mark unsaved changes
     */
    markUnsavedChanges() {
        this.hasUnsavedChanges = true;
    }
}

// Initialize editor when DOM is ready
document.addEventListener('DOMContentLoaded', async () => {
    window.editor = new TourEditor();
    await window.editor.init();
});
