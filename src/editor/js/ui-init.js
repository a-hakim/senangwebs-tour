// UI Initialization - Handles color picker sync, keyboard shortcuts, and tab switching
// Note: Editor is initialized in editor.js via DOMContentLoaded

window.addEventListener('DOMContentLoaded', () => {
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
            if (preview) {
                preview.scrollIntoView({ behavior: 'smooth', block: 'center' });
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
