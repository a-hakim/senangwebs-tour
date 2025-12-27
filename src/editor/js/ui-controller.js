// UI Controller - Handles DOM manipulation and rendering

// Import icons list from SenangStart icons package (baked into bundle at build time)
import iconsData from "@bookklik/senangstart-icons/src/icons.json";

class UIController {
  constructor(editor) {
    this.editor = editor;
    this.sceneList = document.getElementById("sceneList");
    this.hotspotList = document.getElementById("hotspotList");
    this.draggedElement = null;
  }

  /**
   * Render scene list
   */
  renderSceneList() {
    if (!this.sceneList) return;

    this.sceneList.innerHTML = "";
    const scenes = this.editor.sceneManager.getAllScenes();
    const currentIndex = this.editor.sceneManager.currentSceneIndex;

    if (scenes.length === 0) {
      const empty = document.createElement("div");
      empty.className = "empty-state";
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
    const card = document.createElement("div");
    card.className = "scene-card" + (isActive ? " active" : "");
    card.draggable = true;
    card.dataset.index = index;

    // Drag handle
    const dragHandle = document.createElement("div");
    dragHandle.className = "drag-handle";
    dragHandle.innerHTML =
      '<ss-icon icon="arrow-up-down-left-right" thickness="2.2"></ss-icon>';

    // Thumbnail - use thumbnail, panorama, or imageUrl (backward compatibility)
    const thumbnail = document.createElement("img");
    thumbnail.crossOrigin = "anonymous";
    thumbnail.src = scene.thumbnail || scene.panorama || scene.imageUrl;
    thumbnail.alt = scene.name;

    // Info
    const info = document.createElement("div");
    info.className = "scene-info";

    const name = document.createElement("div");
    name.className = "scene-name";
    name.textContent = scene.name;

    const meta = document.createElement("div");
    meta.className = "scene-meta";
    meta.textContent = `${scene.hotspots.length} hotspot${
      scene.hotspots.length !== 1 ? "s" : ""
    }`;

    info.appendChild(name);
    info.appendChild(meta);

    // Actions
    const actions = document.createElement("div");
    actions.className = "scene-actions";

    const deleteBtn = document.createElement("button");
    deleteBtn.className = "btn-icon";
    deleteBtn.innerHTML = '<ss-icon icon="trash" thickness="2.2"></ss-icon>';
    deleteBtn.title = "Delete scene";
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
    card.addEventListener("dragstart", (e) => {
      this.draggedElement = card;
      card.classList.add("dragging");
      e.dataTransfer.effectAllowed = "move";
    });

    card.addEventListener("dragend", () => {
      card.classList.remove("dragging");
      this.draggedElement = null;
    });

    card.addEventListener("dragover", (e) => {
      e.preventDefault();
      e.dataTransfer.dropEffect = "move";

      if (this.draggedElement && this.draggedElement !== card) {
        const bounding = card.getBoundingClientRect();
        const offset = bounding.y + bounding.height / 2;

        if (e.clientY - offset > 0) {
          card.style.borderBottom = "2px solid var(--accent-color)";
          card.style.borderTop = "";
        } else {
          card.style.borderTop = "2px solid var(--accent-color)";
          card.style.borderBottom = "";
        }
      }
    });

    card.addEventListener("dragleave", () => {
      card.style.borderTop = "";
      card.style.borderBottom = "";
    });

    card.addEventListener("drop", (e) => {
      e.preventDefault();
      card.style.borderTop = "";
      card.style.borderBottom = "";

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

    this.hotspotList.innerHTML = "";
    const hotspots = this.editor.hotspotEditor.getAllHotspots();
    const currentIndex = this.editor.hotspotEditor.currentHotspotIndex;

    if (hotspots.length === 0) {
      const empty = document.createElement("div");
      empty.className = "empty-state";
      empty.textContent = 'No hotspots. Click "Add Hotspot" to create one.';
      this.hotspotList.appendChild(empty);
      return;
    }

    hotspots.forEach((hotspot, index) => {
      const item = this.createHotspotItem(
        hotspot,
        index,
        index === currentIndex
      );
      this.hotspotList.appendChild(item);
    });
  }

  /**
   * Create hotspot list item
   * Uses unified format with nested appearance, action, and tooltip
   */
  createHotspotItem(hotspot, index, isActive) {
    const item = document.createElement("div");
    item.className = "hotspot-item" + (isActive ? " active" : "");

    // Get values from nested structure
    const color = hotspot.appearance?.color || "#00ff00";
    const icon = hotspot.appearance?.icon || "";
    const title = hotspot.tooltip?.text || "Untitled Hotspot";
    const targetSceneId = hotspot.action?.target || "";

    const colorIndicator = document.createElement("div");
    colorIndicator.className = "hotspot-color";
    colorIndicator.style.backgroundColor = color;
    
    // If hotspot has an icon, show it with the color applied
    if (icon) {
      colorIndicator.innerHTML = `<ss-icon icon="${icon}" thickness="2.2" style="color: ${color}; width: 20px; height: 20px;"></ss-icon>`;
      colorIndicator.style.backgroundColor = "transparent";
      colorIndicator.style.display = "flex";
      colorIndicator.style.alignItems = "center";
      colorIndicator.style.justifyContent = "center";
    }

    const info = document.createElement("div");
    info.className = "hotspot-info";

    const titleEl = document.createElement("div");
    titleEl.className = "hotspot-title";
    titleEl.textContent = title;

    const target = document.createElement("div");
    target.className = "hotspot-target";
    if (targetSceneId) {
      const targetScene = this.editor.sceneManager.getSceneById(
        targetSceneId
      );
      target.textContent = targetScene
        ? `→ ${targetScene.name}`
        : `→ ${targetSceneId}`;
    } else {
      target.textContent = "No target";
    }

    info.appendChild(titleEl);
    info.appendChild(target);

    const actions = document.createElement("div");
    actions.className = "hotspot-actions";

    const deleteBtn = document.createElement("button");
    deleteBtn.className = "btn-delete";
    deleteBtn.innerHTML = '<ss-icon icon="trash" thickness="2.2"></ss-icon>';
    deleteBtn.title = "Delete";
    deleteBtn.onclick = (e) => {
      e.stopPropagation();
      this.editor.removeHotspot(index);
    };

    actions.appendChild(deleteBtn);

    item.appendChild(colorIndicator);
    item.appendChild(info);
    item.appendChild(actions);

    item.onclick = () => {
      this.editor.selectHotspot(index);
    };

    return item;
  }

  /**
   * Set active state on icon grid button
   */
  setActiveIconButton(iconName) {
    const grid = document.getElementById("hotspotIconGrid");
    if (!grid) return;
    
    // Remove active from all buttons
    grid.querySelectorAll(".icon-btn").forEach(btn => {
      btn.classList.remove("active");
    });
    
    // Find and activate the matching button
    const activeBtn = grid.querySelector(`.icon-btn[data-icon="${iconName}"]`);
    if (activeBtn) {
      activeBtn.classList.add("active");
    }
  }

  /**
   * Populate icon grid from SenangStart icons (baked in at build time)
   * Waits for ss-icon custom element to be defined to avoid race conditions
   */
  async populateIconGrid() {
    const grid = document.getElementById("hotspotIconGrid");
    if (!grid) return;

    // Wait for ss-icon custom element to be defined before populating
    // This prevents race conditions where icons don't render if the
    // custom element isn't registered yet when this method runs
    try {
      if (customElements.get('ss-icon') === undefined) {
        // Give a reasonable timeout to avoid infinite waiting
        await Promise.race([
          customElements.whenDefined('ss-icon'),
          new Promise((_, reject) => setTimeout(() => reject(new Error('ss-icon timeout')), 5000))
        ]);
      }
    } catch (err) {
      console.warn('ss-icon custom element not available, icon grid may not render properly:', err.message);
    }

    // Clear existing content
    grid.innerHTML = "";

    // Add "No icon" button first
    const noIconBtn = document.createElement("button");
    noIconBtn.type = "button";
    noIconBtn.className = "icon-btn active";
    noIconBtn.dataset.icon = "";
    noIconBtn.title = "No icon";
    noIconBtn.innerHTML = '<ss-icon icon="x-mark" thickness="1.5" style="opacity: 0.5;"></ss-icon>';
    grid.appendChild(noIconBtn);

    // Add buttons for each icon from imported JSON
    iconsData.forEach(icon => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "icon-btn";
      btn.dataset.icon = icon.slug;
      btn.title = icon.name;
      btn.innerHTML = `<ss-icon icon="${icon.slug}" thickness="2.2"></ss-icon>`;
      grid.appendChild(btn);
    });

    // console.log(`Loaded ${iconsData.length} icons`);
  }

  /**
   * Update properties panel for hotspot
   * Uses unified format with nested appearance, action, and tooltip
   */
  updateHotspotProperties(hotspot) {
    const hotspotAll = document.getElementById("hotspotAll");
    const hotspotProperties = document.getElementById("hotspotProperties");

    if (!hotspot) {
      // No hotspot selected - show list, hide properties
      if (hotspotAll) hotspotAll.style.display = "block";
      if (hotspotProperties) hotspotProperties.style.display = "none";

      // Clear form
      document.getElementById("hotspotTitle").value = "";
      document.getElementById("hotspotDescription").value = "";
      document.getElementById("hotspotTarget").value = "";
      document.getElementById("hotspotColor").value = "#00ff00";
      const colorText = document.getElementById("hotspotColorText");
      if (colorText) colorText.value = "#00ff00";
      // Reset icon grid to "no icon" button
      this.setActiveIconButton("");
      document.getElementById("hotspotPosX").value = "";
      document.getElementById("hotspotPosY").value = "";
      document.getElementById("hotspotPosZ").value = "";
      return;
    }

    // Hotspot selected - show both list and properties
    if (hotspotAll) hotspotAll.style.display = "block";
    if (hotspotProperties) hotspotProperties.style.display = "block";

    // Get values from nested structure
    const title = hotspot.tooltip?.text || "";
    const description = hotspot.tooltip?.description || "";
    const targetSceneId = hotspot.action?.target || "";
    const color = hotspot.appearance?.color || "#00ff00";
    const icon = hotspot.appearance?.icon || "";

    document.getElementById("hotspotTitle").value = title;
    document.getElementById("hotspotDescription").value = description;
    document.getElementById("hotspotTarget").value = targetSceneId;
    document.getElementById("hotspotColor").value = color;

    // Update color text input if it exists
    const colorText = document.getElementById("hotspotColorText");
    if (colorText) {
      colorText.value = color;
    }

    // Update icon grid active button
    this.setActiveIconButton(icon);

    // Update position inputs
    const pos = hotspot.position || { x: 0, y: 0, z: 0 };
    document.getElementById("hotspotPosX").value = pos.x;
    document.getElementById("hotspotPosY").value = pos.y;
    document.getElementById("hotspotPosZ").value = pos.z;

    // Update target dropdown
    this.updateTargetSceneOptions();
  }

  /**
   * Update properties panel for scene
   */
  updateSceneProperties(scene) {
    const startingPosDisplay = document.getElementById("startingPositionDisplay");
    
    if (!scene) {
      document.getElementById("sceneId").value = "";
      document.getElementById("sceneName").value = "";
      document.getElementById("sceneImageUrl").value = "";
      if (startingPosDisplay) {
        startingPosDisplay.textContent = "Not set (camera keeps current position)";
      }
      return;
    }

    document.getElementById("sceneId").value = scene.id || "";
    document.getElementById("sceneName").value = scene.name || "";
    // Support both panorama (unified) and imageUrl (legacy)
    document.getElementById("sceneImageUrl").value = scene.panorama || scene.imageUrl || "";
    
    // Update starting position display
    if (startingPosDisplay) {
      if (scene.startingPosition) {
        const pitchDeg = (scene.startingPosition.pitch * 180 / Math.PI).toFixed(1);
        const yawDeg = (scene.startingPosition.yaw * 180 / Math.PI).toFixed(1);
        startingPosDisplay.textContent = `Pitch: ${pitchDeg}° | Yaw: ${yawDeg}°`;
        startingPosDisplay.style.color = "var(--accent-primary)";
      } else {
        startingPosDisplay.textContent = "Not set (camera keeps current position)";
        startingPosDisplay.style.color = "var(--text-muted)";
      }
    }
  }

  /**
   * Update properties panel for tour
   */
  updateTourProperties(config) {
    document.getElementById("tourTitle").value = config.title || "";
    document.getElementById("tourDescription").value = config.description || "";
    document.getElementById("tourInitialScene").value =
      config.initialSceneId || "";

    // Also update project name in header if it exists
    const projectName = document.getElementById("project-name");
    if (projectName) {
      projectName.value = config.title || "";
    }
  }

  /**
   * Update target scene options in hotspot properties
   */
  updateTargetSceneOptions() {
    const select = document.getElementById("hotspotTarget");
    if (!select) return;

    const scenes = this.editor.sceneManager.getAllScenes();
    const currentValue = select.value;

    select.innerHTML = '<option value="">Select target scene...</option>';

    scenes.forEach((scene) => {
      const option = document.createElement("option");
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
    const select = document.getElementById("tourInitialScene");
    if (!select) return;

    const scenes = this.editor.sceneManager.getAllScenes();
    const currentValue = select.value;

    select.innerHTML = '<option value="">Select initial scene...</option>';

    scenes.forEach((scene) => {
      const option = document.createElement("option");
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
    const indicator = document.querySelector(".loading-indicator");
    if (indicator) {
      indicator.style.display = isLoading ? "block" : "none";
    }
  }

  /**
   * Switch properties tab
   */
  switchTab(tabName) {
    // Update tab buttons
    document.querySelectorAll(".tab-btn").forEach((btn) => {
      btn.classList.toggle("active", btn.dataset.tab === tabName);
    });

    // Update tab content
    document.querySelectorAll(".tab-content").forEach((content) => {
      content.classList.toggle("active", content.id === tabName + "Tab");
    });
  }
}

export default UIController;
