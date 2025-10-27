// UI Initialization - Handles color picker sync, keyboard shortcuts, tab switching, and declarative init
// Note: Editor can be initialized via DOMContentLoaded (declarative) or manually (programmatic)

/**
 * Initialize editor from declarative HTML attributes
 */
function initDeclarativeEditor() {
    const editorElement = document.querySelector('[data-swt-editor]');
    
    if (!editorElement) {
        return null; // No declarative editor found
    }
    
    // Check if auto-init is enabled
    const autoInit = editorElement.getAttribute('data-swt-auto-init');
    if (autoInit !== 'true') {
        return null; // Auto-init disabled
    }
    
    // Find required elements by data attributes
    const sceneListElement = editorElement.querySelector('[data-swt-scene-list]');
    const previewElement = editorElement.querySelector('[data-swt-preview-area]');
    const propertiesElement = editorElement.querySelector('[data-swt-properties-panel]');
    
    // Get optional configuration from attributes
    const projectName = editorElement.getAttribute('data-swt-project-name') || 'My Virtual Tour';
    const autoSave = editorElement.getAttribute('data-swt-auto-save') === 'true';
    const autoSaveInterval = parseInt(editorElement.getAttribute('data-swt-auto-save-interval')) || 30000;
    
    // Create and initialize editor
    const editor = new TourEditor({
        projectName,
        autoSave,
        autoSaveInterval
    });
    
    // Store element references for controllers
    if (sceneListElement) editor.options.sceneListElement = sceneListElement;
    if (previewElement) editor.options.previewElement = previewElement;
    if (propertiesElement) editor.options.propertiesElement = propertiesElement;
    
    // Initialize the editor
    editor.init().then(() => {
        console.log('✅ Declarative editor initialized');
    }).catch(err => {
        console.error('❌ Failed to initialize declarative editor:', err);
    });
    
    return editor;
}

window.addEventListener('DOMContentLoaded', () => {
    // Try declarative initialization first
    const declarativeEditor = initDeclarativeEditor();
    
    if (declarativeEditor) {
        // Store editor instance globally for declarative mode
        window.editor = declarativeEditor;
        console.log('📦 Declarative editor mode activated');
    }
    
    // Setup color picker sync
    const colorPicker = document.getElementById('hotspotColor');
    const colorText = document.getElementById('hotspotColorText');
    
    if (colorPicker && colorText) {
        colorPicker.addEventListener('input', (e) => {
            colorText.value = e.target.value;
        });
        
        colorText.addEventListener('input', (e) => {
            if (/^#[0-9A-F]{6}$/i.test(e.target.value)) {
                colorPicker.value = e.target.value;
            }
        });
    }

    // Keyboard shortcuts
    document.addEventListener('keydown', (e) => {
        // Ctrl/Cmd + S to save
        if ((e.ctrlKey || e.metaKey) && e.key === 's') {
            e.preventDefault();
            if (window.editor) window.editor.saveProject();
        }
        
        // Ctrl/Cmd + E to export
        if ((e.ctrlKey || e.metaKey) && e.key === 'e') {
            e.preventDefault();
            if (window.editor) window.editor.exportManager.showExportPreview();
        }
        
        // ESC to close modals
        if (e.key === 'Escape') {
            document.querySelectorAll('.modal.show').forEach(modal => {
                modal.classList.remove('show');
            });
        }
    });
    
    // Preview button - just focuses on the preview area
    const previewBtn = document.getElementById('previewBtn');
    if (previewBtn) {
        previewBtn.addEventListener('click', () => {
            const preview = document.getElementById('preview');
            const canvas = document.getElementById('canvasArea');
            if (preview && canvas) {
                canvas.classList.toggle('preview-active');
                // refresh preview
                if (window.editor && window.editor.previewController) {
                    window.editor.previewController.refresh();
                }
            }
        });
    }
    
    // Modal background click to close
    document.querySelectorAll('.modal').forEach(modal => {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.classList.remove('show');
            }
        });
    });
    
    // Tab switching functionality
    const tabs = document.querySelectorAll('.tab');
    const tabContents = document.querySelectorAll('.tab-content');
    
    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            const targetTab = tab.dataset.tab;
            
            // Update tab buttons
            tabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            
            // Update tab content
            tabContents.forEach(content => {
                content.style.display = 'none';
            });
            
            const targetContent = document.getElementById(targetTab + 'Tab');
            if (targetContent) {
                targetContent.style.display = 'block';
            }
            
            // Update panel title (if exists)
            const panelTitle = document.getElementById('panelTitle');
            if (panelTitle) {
                switch(targetTab) {
                    case 'scene':
                        panelTitle.textContent = 'Scene Properties';
                        break;
                    case 'hotspot':
                        panelTitle.textContent = 'Hotspot Properties';
                        break;
                    case 'tour':
                        panelTitle.textContent = 'Tour Settings';
                        break;
                }
            }
        });
    });
});
