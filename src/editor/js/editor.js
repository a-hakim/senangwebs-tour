// Main Editor Controller
import { debounce, showModal, showToast } from './utils.js';
import EventEmitter, { EditorEvents } from './event-emitter.js';

class TourEditor {
    constructor(options = {}) {
        this.config = {
            title: options.projectName || 'My Virtual Tour',
            description: '',
            initialSceneId: ''
        };
        
        // Store initialization options
        this.options = {
            sceneListElement: options.sceneListElement || null,
            previewElement: options.previewElement || null,
            propertiesElement: options.propertiesElement || null,
            autoSave: options.autoSave !== undefined ? options.autoSave : false,
            autoSaveInterval: options.autoSaveInterval || 30000,
            ...options
        };
        
        this.storageManager = new ProjectStorageManager();
        this.sceneManager = new SceneManagerEditor(this);
        this.hotspotEditor = new HotspotEditor(this);
        this.previewController = new PreviewController(this);
        this.uiController = new UIController(this);
        this.exportManager = new ExportManager(this);
        
        this.hasUnsavedChanges = false;
        this.lastRenderedSceneIndex = -1;
        this.listenersSetup = false;
        
        // Initialize event emitter
        this.events = new EventEmitter();
    }

    /**
     * Subscribe to editor events
     * @param {string} event - Event name (use EditorEvents constants)
     * @param {Function} callback - Callback function
     * @returns {Function} Unsubscribe function
     */
    on(event, callback) {
        return this.events.on(event, callback);
    }

    /**
     * Subscribe to an event once
     * @param {string} event - Event name
     * @param {Function} callback - Callback function
     * @returns {Function} Unsubscribe function
     */
    once(event, callback) {
        return this.events.once(event, callback);
    }

    /**
     * Unsubscribe from an event
     * @param {string} event - Event name
     * @param {Function} callback - Callback to remove
     */
    off(event, callback) {
        this.events.off(event, callback);
    }

    /**
     * Emit an event
     * @param {string} event - Event name
     * @param {Object} data - Event data
     */
    emit(event, data = {}) {
        this.events.emit(event, data);
    }

    /**
     * Initialize editor
     * @param {Object} config - Optional configuration object for programmatic init
     */
    async init(config = {}) {
        // Merge config with existing options
        if (config && Object.keys(config).length > 0) {
            Object.assign(this.options, config);
            if (config.projectName) {
                this.config.title = config.projectName;
            }
        }
        
        // Initialize preview
        const previewInit = await this.previewController.init();
        if (!previewInit) {
            console.error('Failed to initialize preview controller');
            showToast('Failed to initialize preview', 'error');
            return false;
        }
        
        // Setup event listeners
        this.setupEventListeners();
        
        // Populate icon grid (async to wait for custom element registration)
        await this.uiController.populateIconGrid();
        
        // Load saved project if exists (but only if it has valid data)
        if (this.storageManager.hasProject()) {
            try {
                const projectData = this.storageManager.loadProject();
                if (projectData && projectData.scenes && projectData.scenes.length > 0) {
                    this.loadProject();
                } else {
                    // Invalid or empty project, clear it
                    console.error('Invalid or empty project data, clearing storage');
                    this.storageManager.clearProject();
                }
            } catch (error) {
                console.error('Error loading saved project:', error);
                this.storageManager.clearProject();
            }
        }
        
        // Start auto-save if enabled
        if (this.options.autoSave) {
            this.storageManager.startAutoSave(() => {
                this.saveProject();
            }, this.options.autoSaveInterval);
        }
        
        // Initial render (only if no project was loaded)
        if (this.sceneManager.getScenes().length === 0) {
            this.render();
        }
        
        showToast('Editor ready', 'success');
        
        // Emit ready event
        this.emit(EditorEvents.READY, { config: this.options });
        
        return true;
    }

    /**
     * Setup event listeners
     */
    setupEventListeners() {
        if (this.listenersSetup) {
            return;
        }

        const addSceneBtns = document.querySelectorAll('#addSceneBtn');
        const sceneUploads = document.querySelectorAll('#sceneUpload');
        const importBtns = document.querySelectorAll('#importBtn');
        const importUploads = document.querySelectorAll('#importUpload');
        if (addSceneBtns.length > 1 || sceneUploads.length > 1 || importBtns.length > 1 || importUploads.length > 1) {
            console.error('Duplicate IDs found in DOM. This will cause double-trigger issues.');
        }
        
        // Toolbar buttons
        document.getElementById('newBtn')?.addEventListener('click', () => this.newProject());
        document.getElementById('saveBtn')?.addEventListener('click', () => this.saveProject());
        document.getElementById('exportBtn')?.addEventListener('click', () => this.exportManager.showExportPreview());
        document.getElementById('importBtn')?.addEventListener('click', () => this.importProject());
        document.getElementById('helpBtn')?.addEventListener('click', () => showModal('helpModal'));

        document.getElementById('addSceneBtn')?.addEventListener('click', () => {
            const sceneUpload = document.getElementById('sceneUpload');
            if (sceneUpload) {
                sceneUpload.click();
            }
        });
        
        document.getElementById('sceneUpload')?.addEventListener('change', (e) => {
            if (e.target.files && e.target.files.length > 0) {
                this.handleSceneUpload(e.target.files);
                setTimeout(() => {
                    e.target.value = '';
                }, 100);
            }
        });

        document.getElementById('addHotspotBtn')?.addEventListener('click', () => {
            this.addHotspotAtCursor();
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

        document.getElementById('hotspotTitle')?.addEventListener('input', debounce((e) => {
            this.updateCurrentHotspot('tooltip.text', e.target.value);
        }, 300));
        
        document.getElementById('hotspotDescription')?.addEventListener('input', debounce((e) => {
            this.updateCurrentHotspot('tooltip.description', e.target.value);
        }, 300));
        
        document.getElementById('hotspotTarget')?.addEventListener('change', (e) => {
            this.updateCurrentHotspot('action.target', e.target.value);
        });
        
        document.getElementById('hotspotColor')?.addEventListener('input', (e) => {
            this.updateCurrentHotspot('appearance.color', e.target.value);
        });

        // Icon grid button clicks
        document.getElementById('hotspotIconGrid')?.addEventListener('click', (e) => {
            const btn = e.target.closest('.icon-btn');
            if (btn) {
                const iconValue = btn.dataset.icon;
                // Update active state
                document.querySelectorAll('#hotspotIconGrid .icon-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                // Update hotspot
                this.updateCurrentHotspot('appearance.icon', iconValue);
            }
        });

        document.getElementById('hotspotPosX')?.addEventListener('input', debounce((e) => {
            this.updateCurrentHotspotPosition('x', parseFloat(e.target.value) || 0);
        }, 300));
        
        document.getElementById('hotspotPosY')?.addEventListener('input', debounce((e) => {
            this.updateCurrentHotspotPosition('y', parseFloat(e.target.value) || 0);
        }, 300));
        
        document.getElementById('hotspotPosZ')?.addEventListener('input', debounce((e) => {
            this.updateCurrentHotspotPosition('z', parseFloat(e.target.value) || 0);
        }, 300));

        document.getElementById('sceneId')?.addEventListener('input', debounce((e) => {
            this.updateCurrentScene('id', sanitizeId(e.target.value));
        }, 300));
        
        document.getElementById('sceneName')?.addEventListener('input', debounce((e) => {
            this.updateCurrentScene('name', e.target.value);
        }, 300));
        
        document.getElementById('sceneImageUrl')?.addEventListener('input', debounce((e) => {
            this.updateCurrentSceneImage(e.target.value);
        }, 300));

        document.getElementById('setStartingPosBtn')?.addEventListener('click', () => {
            this.setSceneStartingPosition();
        });
        
        document.getElementById('clearStartingPosBtn')?.addEventListener('click', () => {
            this.clearSceneStartingPosition();
        });

        document.getElementById('tourTitle')?.addEventListener('input', debounce((e) => {
            this.config.title = e.target.value;
            this.markUnsavedChanges();
            this.emit(EditorEvents.TOUR_TITLE_CHANGE, { title: e.target.value });
            const projectName = document.getElementById('project-name');
            if (projectName && projectName.value !== e.target.value) {
                projectName.value = e.target.value;
            }
        }, 300));
        
        document.getElementById('project-name')?.addEventListener('input', debounce((e) => {
            this.config.title = e.target.value;
            this.markUnsavedChanges();
            this.emit(EditorEvents.TOUR_TITLE_CHANGE, { title: e.target.value });
            const tourTitle = document.getElementById('tourTitle');
            if (tourTitle && tourTitle.value !== e.target.value) {
                tourTitle.value = e.target.value;
            }
        }, 300));
        
        document.getElementById('tourDescription')?.addEventListener('input', debounce((e) => {
            this.config.description = e.target.value;
            this.markUnsavedChanges();
            this.emit(EditorEvents.TOUR_DESCRIPTION_CHANGE, { description: e.target.value });
        }, 300));
        
        document.getElementById('tourInitialScene')?.addEventListener('change', (e) => {
            this.config.initialSceneId = e.target.value;
            this.markUnsavedChanges();
            this.emit(EditorEvents.INITIAL_SCENE_CHANGE, { initialSceneId: e.target.value });
        });

        document.getElementById('exportJsonBtn')?.addEventListener('click', () => {
            this.exportManager.exportJSON();
        });
        
        document.getElementById('copyJsonBtn')?.addEventListener('click', () => {
            this.exportManager.copyJSON();
        });
        
        document.getElementById('exportViewerBtn')?.addEventListener('click', async () => {
            await this.exportManager.exportViewerHTML();
        });

        document.querySelectorAll('.modal-close').forEach(btn => {
            btn.addEventListener('click', () => {
                const modal = btn.closest('.modal');
                if (modal) {
                    hideModal(modal.id);
                }
            });
        });

        document.getElementById('importUpload')?.addEventListener('change', (e) => {
            if (e.target.files && e.target.files.length > 0) {
                this.handleImportFile(e.target.files[0]);
                setTimeout(() => {
                    e.target.value = '';
                }, 100);
            }
        });

        window.addEventListener('beforeunload', (e) => {
            if (this.hasUnsavedChanges) {
                e.preventDefault();
                e.returnValue = '';
            }
        });
        
        this.listenersSetup = true;
    }

    /**
     * Handle scene upload
     */
    async handleSceneUpload(files) {
        if (!files || files.length === 0) {
            return;
        }

        this.uiController.setLoading(true);

        for (const file of files) {
            if (!file.type.startsWith('image/')) {
                showToast(`${file.name} is not an image`, 'error');
                continue;
            }

            const scene = await this.sceneManager.addScene(file);
            if (scene) {
                this.emit(EditorEvents.SCENE_ADD, { scene, file });
            }
        }
        this.uiController.setLoading(false);
        this.render();
        this.markUnsavedChanges();
    }

    /**
     * Add hotspot at position
     */
    addHotspotAtPosition(position) {
        const distance = Math.sqrt(position.x * position.x + position.y * position.y + position.z * position.z);
        if (distance > 5) {
            const scale = 5 / distance;
            position.x *= scale;
            position.y *= scale;
            position.z *= scale;
            position.x = parseFloat(position.x.toFixed(2));
            position.y = parseFloat(position.y.toFixed(2));
            position.z = parseFloat(position.z.toFixed(2));
        }
        
        // Capture current camera orientation for reliable pointing later
        const cameraRotation = this.previewController.getCameraRotation();
        const cameraOrientation = cameraRotation ? {
            pitch: cameraRotation.x,
            yaw: cameraRotation.y
        } : null;
        
        const hotspot = this.hotspotEditor.addHotspot(position, '', cameraOrientation);
        if (hotspot) {
            this.lastRenderedSceneIndex = -1;
            this.render();
            this.markUnsavedChanges();
            this.emit(EditorEvents.HOTSPOT_ADD, { 
                hotspot, 
                position, 
                sceneId: this.sceneManager.getCurrentScene()?.id 
            });
        } else {
            console.error('Failed to add hotspot');
        }
    }

    /**
     * Add hotspot at current cursor position (center of view)
     * This uses the A-Cursor's raycaster intersection with the sky sphere
     */
    addHotspotAtCursor() {
        const scene = this.sceneManager.getCurrentScene();
        if (!scene) {
            showToast('Please select a scene first', 'error');
            return;
        }

        const position = this.previewController.getCursorIntersection();
        if (!position) {
            showToast('Could not get cursor position. Please ensure the preview is loaded.', 'error');
            return;
        }

        this.addHotspotAtPosition(position);
    }

    /**
     * Select scene by index
     */
    selectScene(index) {
        if (this.sceneManager.setCurrentScene(index)) {
            this.lastRenderedSceneIndex = -1;
            this.hotspotEditor.currentHotspotIndex = -1;
            
            const scene = this.sceneManager.getCurrentScene();
            if (scene) {
                this.previewController.loadScene(scene, false);
                this.lastRenderedSceneIndex = index;
            }
            
            this.uiController.renderSceneList();
            this.uiController.updateSceneProperties(scene);
            this.uiController.renderHotspotList();
            this.uiController.updateHotspotProperties(null);
            this.uiController.updateInitialSceneOptions();
            this.uiController.updateTargetSceneOptions();
            
            this.emit(EditorEvents.SCENE_SELECT, { scene, index });
        }
    }

    /**
     * Select hotspot by index
     */
    selectHotspot(index) {
        if (this.hotspotEditor.setCurrentHotspot(index)) {
            const hotspot = this.hotspotEditor.getHotspot(index);
            
            this.uiController.renderHotspotList();
            this.uiController.updateHotspotProperties(hotspot);
            this.uiController.updateTargetSceneOptions();
            this.uiController.switchTab('hotspot');
            
            if (hotspot) {
                this.previewController.pointCameraToHotspot(hotspot);
            }
            
            this.emit(EditorEvents.HOTSPOT_SELECT, { hotspot, index });
        }
    }

    /**
     * Remove scene
     */
    removeScene(index) {
        const scene = this.sceneManager.getScene(index);
        if (this.sceneManager.removeScene(index)) {
            this.render();
            this.markUnsavedChanges();
            this.emit(EditorEvents.SCENE_REMOVE, { scene, index });
        }
    }

    /**
     * Remove hotspot
     */
    removeHotspot(index) {
        const hotspot = this.hotspotEditor.getHotspot(index);
        if (this.hotspotEditor.removeHotspot(index)) {
            this.lastRenderedSceneIndex = -1;
            this.render();
            this.markUnsavedChanges();
            this.emit(EditorEvents.HOTSPOT_REMOVE, { hotspot, index });
        }
    }

    /**
     * Duplicate hotspot
     */
    duplicateHotspot(index) {
        const hotspot = this.hotspotEditor.duplicateHotspot(index);
        if (hotspot) {
            this.lastRenderedSceneIndex = -1;
            this.render();
            this.markUnsavedChanges();
            this.emit(EditorEvents.HOTSPOT_DUPLICATE, { hotspot, originalIndex: index });
        }
    }

    /**
     * Reorder scenes
     */
    reorderScenes(fromIndex, toIndex) {
        if (this.sceneManager.reorderScenes(fromIndex, toIndex)) {
            this.render();
            this.markUnsavedChanges();
            this.emit(EditorEvents.SCENE_REORDER, { fromIndex, toIndex });
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
            this.emit(EditorEvents.HOTSPOT_UPDATE, { 
                hotspot: this.hotspotEditor.getHotspot(index), 
                index, 
                property, 
                value 
            });
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
            
            hotspot.position[axis] = value;
            
            // Clear camera orientation since position changed manually
            // Will fallback to position-based calculation when pointing camera
            hotspot.cameraOrientation = null;
            
            const pos = hotspot.position;
            const distance = Math.sqrt(pos.x * pos.x + pos.y * pos.y + pos.z * pos.z);
            if (distance > 10) {
                const scale = 10 / distance;
                pos.x *= scale;
                pos.y *= scale;
                pos.z *= scale;
                
                document.getElementById(`hotspotPos${axis.toUpperCase()}`).value = pos[axis].toFixed(2);
                showToast('Position clamped to 10-unit radius', 'info');
            }
            
            await this.previewController.updateHotspotMarker(index);
            this.uiController.renderHotspotList();
            this.markUnsavedChanges();
            this.emit(EditorEvents.HOTSPOT_POSITION_CHANGE, { 
                hotspot, 
                index, 
                axis, 
                value, 
                position: hotspot.position 
            });
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
            this.emit(EditorEvents.SCENE_UPDATE, { 
                scene: this.sceneManager.getScene(index), 
                index, 
                property, 
                value 
            });
        }
    }

    /**
     * Update current scene image URL
     */
    async updateCurrentSceneImage(imageUrl) {
        const index = this.sceneManager.currentSceneIndex;
        if (index < 0) return;
        
        // Use panorama for unified format
        if (this.sceneManager.updateScene(index, 'panorama', imageUrl)) {
            const scene = this.sceneManager.getCurrentScene();
            if (scene) {
                scene.thumbnail = imageUrl;
            }
            
            this.uiController.renderSceneList();
            this.lastRenderedSceneIndex = -1;
            
            if (scene) {
                await this.previewController.loadScene(scene);
                this.lastRenderedSceneIndex = index;
                showToast('Scene image updated', 'success');
            }
            this.markUnsavedChanges();
            this.emit(EditorEvents.SCENE_IMAGE_CHANGE, { scene, index, imageUrl });
        }
    }

    /**
     * Set scene starting position to current camera rotation
     */
    setSceneStartingPosition() {
        const scene = this.sceneManager.getCurrentScene();
        if (!scene) {
            showToast('No scene selected', 'error');
            return;
        }
        
        const rotation = this.previewController.getCameraRotation();
        if (!rotation) {
            showToast('Could not get camera rotation', 'error');
            return;
        }
        
        scene.startingPosition = {
            pitch: rotation.x,
            yaw: rotation.y
        };
        
        this.uiController.updateSceneProperties(scene);
        this.markUnsavedChanges();
        showToast('Starting position set', 'success');
        this.emit(EditorEvents.SCENE_STARTING_POSITION_SET, { scene, startingPosition: scene.startingPosition });
    }

    /**
     * Clear scene starting position
     */
    clearSceneStartingPosition() {
        const scene = this.sceneManager.getCurrentScene();
        if (!scene) {
            showToast('No scene selected', 'error');
            return;
        }
        
        scene.startingPosition = null;
        
        this.uiController.updateSceneProperties(scene);
        this.markUnsavedChanges();
        showToast('Starting position cleared', 'success');
        this.emit(EditorEvents.SCENE_STARTING_POSITION_CLEAR, { scene });
    }

    /**
     * Render all UI
     */
    render() {
        this.uiController.renderSceneList();
        this.uiController.renderHotspotList();
        this.uiController.populateIconGrid(); // Re-render icon grid to ensure icons display
        
        const currentScene = this.sceneManager.getCurrentScene();
        const currentHotspot = this.hotspotEditor.getCurrentHotspot();
        
        this.uiController.updateSceneProperties(currentScene);
        this.uiController.updateHotspotProperties(currentHotspot);
        this.uiController.updateTourProperties(this.config);
        this.uiController.updateInitialSceneOptions();
        this.uiController.updateTargetSceneOptions();
        
        if (currentScene) {
            const emptyState = document.querySelector('.preview-empty');
            if (emptyState) {
                emptyState.style.display = 'none';
            }
            
            const currentSceneIndex = this.sceneManager.currentSceneIndex;
            if (currentSceneIndex !== this.lastRenderedSceneIndex) {
                this.previewController.loadScene(currentScene);
                this.lastRenderedSceneIndex = currentSceneIndex;
            }
            
            if (currentHotspot) {
                this.previewController.highlightHotspot(this.hotspotEditor.currentHotspotIndex);
            }
        } else {
            const emptyState = document.querySelector('.preview-empty');
            if (emptyState) {
                emptyState.style.display = 'flex';
            }
            this.lastRenderedSceneIndex = -1;
        }
        
        this.emit(EditorEvents.UI_RENDER);
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
            this.emit(EditorEvents.PROJECT_SAVE, { projectData });
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
            this.emit(EditorEvents.PROJECT_LOAD, { projectData });
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
            initialSceneId: ''
        };
        
        this.sceneManager.clearScenes();
        this.hasUnsavedChanges = false;
        this.render();
        
        showToast('New project created', 'success');
        this.emit(EditorEvents.PROJECT_NEW, { config: this.config });
        return true;
    }

    /**
     * Import project
     */
    importProject() {
const importUpload = document.getElementById('importUpload');
        if (importUpload) {
            importUpload.click();
        }
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
            this.emit(EditorEvents.PROJECT_IMPORT, { projectData, file });
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
    if (document.querySelector('[data-swt-editor]')) {
        // Declarative initialization will handle it
        return;
    }
    window.editor = new TourEditor();
    await window.editor.init();
});

export default TourEditor;
export { EditorEvents } from './event-emitter.js';
