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
        this.storageManager.startAutoSave(() => {
            this.saveProject();
        });
        
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

        // Scene properties
        document.getElementById('sceneId')?.addEventListener('input', debounce((e) => {
            this.updateCurrentScene('id', sanitizeId(e.target.value));
        }, 300));
        
        document.getElementById('sceneName')?.addEventListener('input', debounce((e) => {
            this.updateCurrentScene('name', e.target.value);
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
        console.log('Adding hotspot at position:', position);
        const hotspot = this.hotspotEditor.addHotspot(position);
        if (hotspot) {
            console.log('Hotspot added successfully:', hotspot);
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
            this.render();
        } else {
            console.warn('Failed to select scene:', index);
        }
    }

    /**
     * Select hotspot by index
     */
    selectHotspot(index) {
        if (this.hotspotEditor.setCurrentHotspot(index)) {
            this.render();
            this.uiController.switchTab('hotspot');
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
    updateCurrentHotspot(property, value) {
        const index = this.hotspotEditor.currentHotspotIndex;
        if (this.hotspotEditor.updateHotspot(index, property, value)) {
            this.previewController.updateHotspotMarker(index);
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
            this.previewController.loadScene(currentScene);
            if (currentHotspot) {
                this.previewController.highlightHotspot(this.hotspotEditor.currentHotspotIndex);
            }
        } else {
            console.log('No current scene to render');
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
