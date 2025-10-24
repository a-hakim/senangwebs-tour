// UI Controller - Handles DOM manipulation and rendering

class UIController {
    constructor(editor) {
        this.editor = editor;
        this.sceneList = document.getElementById('sceneList');
        this.hotspotList = document.getElementById('hotspotList');
        this.draggedElement = null;
    }

    /**
     * Render scene list
     */
    renderSceneList() {
        if (!this.sceneList) return;

        this.sceneList.innerHTML = '';
        const scenes = this.editor.sceneManager.getAllScenes();
        const currentIndex = this.editor.sceneManager.currentSceneIndex;

        if (scenes.length === 0) {
            const empty = document.createElement('div');
            empty.className = 'empty-state';
            empty.innerHTML = `
                <p>No scenes yet</p>
                <p class="hint">Click "Add Scene" to upload a 360° panorama</p>
            `;
            this.sceneList.appendChild(empty);
            return;
        }

        scenes.forEach((scene, index) => {
            const card = this.createSceneCard(scene, index, index === currentIndex);
            this.sceneList.appendChild(card);
        });
    }

    /**
     * Create scene card element
     */
    createSceneCard(scene, index, isActive) {
        const card = document.createElement('div');
        card.className = 'scene-card' + (isActive ? ' active' : '');
        card.draggable = true;
        card.dataset.index = index;

        // Drag handle
        const dragHandle = document.createElement('div');
        dragHandle.className = 'drag-handle';
        dragHandle.innerHTML = '☰';

        // Thumbnail
        const thumbnail = document.createElement('img');
        thumbnail.src = scene.thumbnail || scene.imageUrl;
        thumbnail.alt = scene.name;

        // Info
        const info = document.createElement('div');
        info.className = 'scene-info';

        const name = document.createElement('div');
        name.className = 'scene-name';
        name.textContent = scene.name;

        const meta = document.createElement('div');
        meta.className = 'scene-meta';
        meta.textContent = `${scene.hotspots.length} hotspot${scene.hotspots.length !== 1 ? 's' : ''}`;

        info.appendChild(name);
        info.appendChild(meta);

        // Actions
        const actions = document.createElement('div');
        actions.className = 'scene-actions';

        const deleteBtn = document.createElement('button');
        deleteBtn.className = 'btn-icon';
        deleteBtn.innerHTML = '🗑️';
        deleteBtn.title = 'Delete scene';
        deleteBtn.onclick = (e) => {
            e.stopPropagation();
            this.editor.removeScene(index);
        };

        actions.appendChild(deleteBtn);

        card.appendChild(dragHandle);
        card.appendChild(thumbnail);
        card.appendChild(info);
        card.appendChild(actions);

        // Click handler
        card.onclick = () => {
            this.editor.selectScene(index);
        };

        // Drag and drop handlers
        this.setupDragAndDrop(card);

        return card;
    }

    /**
     * Setup drag and drop for scene reordering
     */
    setupDragAndDrop(card) {
        card.addEventListener('dragstart', (e) => {
            this.draggedElement = card;
            card.classList.add('dragging');
            e.dataTransfer.effectAllowed = 'move';
        });

        card.addEventListener('dragend', () => {
            card.classList.remove('dragging');
            this.draggedElement = null;
        });

        card.addEventListener('dragover', (e) => {
            e.preventDefault();
            e.dataTransfer.dropEffect = 'move';

            if (this.draggedElement && this.draggedElement !== card) {
                const bounding = card.getBoundingClientRect();
                const offset = bounding.y + bounding.height / 2;

                if (e.clientY - offset > 0) {
                    card.style.borderBottom = '2px solid var(--accent-color)';
                    card.style.borderTop = '';
                } else {
                    card.style.borderTop = '2px solid var(--accent-color)';
                    card.style.borderBottom = '';
                }
            }
        });

        card.addEventListener('dragleave', () => {
            card.style.borderTop = '';
            card.style.borderBottom = '';
        });

        card.addEventListener('drop', (e) => {
            e.preventDefault();
            card.style.borderTop = '';
            card.style.borderBottom = '';

            if (this.draggedElement && this.draggedElement !== card) {
                const fromIndex = parseInt(this.draggedElement.dataset.index);
                const toIndex = parseInt(card.dataset.index);
                this.editor.reorderScenes(fromIndex, toIndex);
            }
        });
    }

    /**
     * Render hotspot list
     */
    renderHotspotList() {
        if (!this.hotspotList) return;

        this.hotspotList.innerHTML = '';
        const hotspots = this.editor.hotspotEditor.getAllHotspots();
        const currentIndex = this.editor.hotspotEditor.currentHotspotIndex;

        if (hotspots.length === 0) {
            const empty = document.createElement('div');
            empty.className = 'empty-state';
            empty.textContent = 'No hotspots. Click "Add Hotspot" to create one.';
            this.hotspotList.appendChild(empty);
            return;
        }

        hotspots.forEach((hotspot, index) => {
            const item = this.createHotspotItem(hotspot, index, index === currentIndex);
            this.hotspotList.appendChild(item);
        });
    }

    /**
     * Create hotspot list item
     */
    createHotspotItem(hotspot, index, isActive) {
        const item = document.createElement('div');
        item.className = 'hotspot-item' + (isActive ? ' active' : '');

        const color = document.createElement('div');
        color.className = 'hotspot-color';
        color.style.backgroundColor = hotspot.color;

        const info = document.createElement('div');
        info.className = 'hotspot-info';
        
        const title = document.createElement('div');
        title.className = 'hotspot-title';
        title.textContent = hotspot.title || 'Untitled Hotspot';
        
        const target = document.createElement('div');
        target.className = 'hotspot-target';
        if (hotspot.targetSceneId) {
            const targetScene = this.editor.sceneManager.getSceneById(hotspot.targetSceneId);
            target.textContent = targetScene ? `→ ${targetScene.name}` : `→ ${hotspot.targetSceneId}`;
        } else {
            target.textContent = 'No target';
        }
        
        info.appendChild(title);
        info.appendChild(target);

        const actions = document.createElement('div');
        actions.className = 'hotspot-actions';

        const deleteBtn = document.createElement('button');
        deleteBtn.className = 'btn-delete';
        deleteBtn.innerHTML = '🗑️';
        deleteBtn.title = 'Delete';
        deleteBtn.onclick = (e) => {
            e.stopPropagation();
            this.editor.removeHotspot(index);
        };

        actions.appendChild(deleteBtn);

        item.appendChild(color);
        item.appendChild(info);
        item.appendChild(actions);

        item.onclick = () => {
            this.editor.selectHotspot(index);
        };

        return item;
    }

    /**
     * Update properties panel for hotspot
     */
    updateHotspotProperties(hotspot) {
        const hotspotAll = document.getElementById('hotspotAll');
        const hotspotProperties = document.getElementById('hotspotProperties');
        
        if (!hotspot) {
            // No hotspot selected - show list, hide properties
            if (hotspotAll) hotspotAll.style.display = 'block';
            if (hotspotProperties) hotspotProperties.style.display = 'none';
            
            // Clear form
            document.getElementById('hotspotTitle').value = '';
            document.getElementById('hotspotDescription').value = '';
            document.getElementById('hotspotTarget').value = '';
            document.getElementById('hotspotColor').value = '#00ff00';
            const colorText = document.getElementById('hotspotColorText');
            if (colorText) colorText.value = '#00ff00';
            document.getElementById('hotspotPosX').value = '';
            document.getElementById('hotspotPosY').value = '';
            document.getElementById('hotspotPosZ').value = '';
            return;
        }

        // Hotspot selected - show both list and properties
        if (hotspotAll) hotspotAll.style.display = 'block';
        if (hotspotProperties) hotspotProperties.style.display = 'block';

        document.getElementById('hotspotTitle').value = hotspot.title || '';
        document.getElementById('hotspotDescription').value = hotspot.description || '';
        document.getElementById('hotspotTarget').value = hotspot.targetSceneId || '';
        document.getElementById('hotspotColor').value = hotspot.color || '#00ff00';
        
        // Update color text input if it exists
        const colorText = document.getElementById('hotspotColorText');
        if (colorText) {
            colorText.value = hotspot.color || '#00ff00';
        }
        
        // Update position inputs
        const pos = hotspot.position || { x: 0, y: 0, z: 0 };
        document.getElementById('hotspotPosX').value = pos.x;
        document.getElementById('hotspotPosY').value = pos.y;
        document.getElementById('hotspotPosZ').value = pos.z;

        // Update target dropdown
        this.updateTargetSceneOptions();
    }

    /**
     * Update properties panel for scene
     */
    updateSceneProperties(scene) {
        if (!scene) {
            document.getElementById('sceneId').value = '';
            document.getElementById('sceneName').value = '';
            document.getElementById('sceneImageUrl').value = '';
            return;
        }

        document.getElementById('sceneId').value = scene.id || '';
        document.getElementById('sceneName').value = scene.name || '';
        document.getElementById('sceneImageUrl').value = scene.imageUrl || '';
    }

    /**
     * Update properties panel for tour
     */
    updateTourProperties(config) {
        document.getElementById('tourTitle').value = config.title || '';
        document.getElementById('tourDescription').value = config.description || '';
        document.getElementById('tourInitialScene').value = config.initialSceneId || '';
        document.getElementById('tourAutoRotate').checked = config.autoRotate || false;
        document.getElementById('tourShowCompass').checked = config.showCompass || false;
        
        // Also update project name in header if it exists
        const projectName = document.getElementById('project-name');
        if (projectName) {
            projectName.value = config.title || '';
        }
    }

    /**
     * Update target scene options in hotspot properties
     */
    updateTargetSceneOptions() {
        const select = document.getElementById('hotspotTarget');
        if (!select) return;

        const scenes = this.editor.sceneManager.getAllScenes();
        const currentValue = select.value;

        select.innerHTML = '<option value="">Select target scene...</option>';

        scenes.forEach(scene => {
            const option = document.createElement('option');
            option.value = scene.id;
            option.textContent = scene.name;
            select.appendChild(option);
        });

        select.value = currentValue;
    }

    /**
     * Update initial scene options in tour properties
     */
    updateInitialSceneOptions() {
        const select = document.getElementById('tourInitialScene');
        if (!select) return;

        const scenes = this.editor.sceneManager.getAllScenes();
        const currentValue = select.value;

        select.innerHTML = '<option value="">Select initial scene...</option>';

        scenes.forEach(scene => {
            const option = document.createElement('option');
            option.value = scene.id;
            option.textContent = scene.name;
            select.appendChild(option);
        });

        select.value = currentValue;
    }

    /**
     * Show/hide loading indicator
     */
    setLoading(isLoading) {
        const indicator = document.querySelector('.loading-indicator');
        if (indicator) {
            indicator.style.display = isLoading ? 'block' : 'none';
        }
    }

    /**
     * Switch properties tab
     */
    switchTab(tabName) {
        // Update tab buttons
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.tab === tabName);
        });

        // Update tab content
        document.querySelectorAll('.tab-content').forEach(content => {
            content.classList.toggle('active', content.id === tabName + 'Tab');
        });
    }
}


export default UIController;
