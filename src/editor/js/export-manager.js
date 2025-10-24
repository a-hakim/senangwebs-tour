// Export Manager - Handles JSON generation for SWT library
import { downloadTextAsFile, showModal } from './utils.js';

class ExportManager {
    constructor(editor) {
        this.editor = editor;
    }

    /**
     * Generate JSON compatible with SWT library
     */
    generateJSON() {
        const scenes = this.editor.sceneManager.getAllScenes();
        const config = this.editor.config;
        // Build scenes array
        const scenesData = scenes.map(scene => ({
            id: scene.id,
            name: scene.name,
            imageUrl: scene.imageUrl,
            hotspots: scene.hotspots.map(hotspot => ({
                id: hotspot.id,
                type: hotspot.type || 'navigation',
                position: hotspot.position,
                targetSceneId: hotspot.targetSceneId || '',
                title: hotspot.title || '',
                description: hotspot.description || '',
                color: hotspot.color || '#00ff00',
                icon: hotspot.icon || ''
            }))
        }));
// Determine initial scene
        let initialSceneId = config.initialSceneId;
        if (!initialSceneId && scenes.length > 0) {
            initialSceneId = scenes[0].id;
        }

        // Build final JSON
        const jsonData = {
            title: config.title || 'Virtual Tour',
            description: config.description || '',
            initialSceneId: initialSceneId,
            scenes: scenesData,
            settings: {
                autoRotate: config.autoRotate || false,
                showCompass: config.showCompass || false
            }
        };

        return jsonData;
    }

    /**
     * Export as JSON file
     */
    exportJSON() {
        try {
            const jsonData = this.generateJSON();
            const json = JSON.stringify(jsonData, null, 2);
            
            const filename = sanitizeId(jsonData.title || 'tour') + '.json';
            downloadTextAsFile(json, filename);
            
            showToast('Tour exported successfully', 'success');
            return true;
        } catch (error) {
            console.error('Export failed:', error);
            showToast('Export failed', 'error');
            return false;
        }
    }

    /**
     * Copy JSON to clipboard
     */
    async copyJSON() {
        try {
            const jsonData = this.generateJSON();
            const json = JSON.stringify(jsonData, null, 2);
            
            const success = await copyToClipboard(json);
            if (success) {
                showToast('JSON copied to clipboard', 'success');
            } else {
                showToast('Failed to copy to clipboard', 'error');
            }
            return success;
        } catch (error) {
            console.error('Copy failed:', error);
            showToast('Copy failed', 'error');
            return false;
        }
    }

    /**
     * Generate HTML viewer code
     */
    generateViewerHTML() {
        const jsonData = this.generateJSON();
        
        return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${jsonData.title}</title>
    <script src="https://aframe.io/releases/1.7.0/aframe.min.js"></script>
    <script src="dist/swt.min.js"></script>
    <style>
        body {
            margin: 0;
            overflow: hidden;
            font-family: Arial, sans-serif;
        }
        
        #loading {
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: #000;
            display: flex;
            align-items: center;
            justify-content: center;
            color: #fff;
            z-index: 1000;
        }
        
        #loading.hidden {
            display: none;
        }
        
        .spinner {
            border: 4px solid rgba(255,255,255,0.3);
            border-top: 4px solid #fff;
            border-radius: 50%;
            width: 40px;
            height: 40px;
            animation: spin 1s linear infinite;
            margin-right: 15px;
        }
        
        @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
        }
        
        #ui {
            position: fixed;
            bottom: 20px;
            left: 50%;
            transform: translateX(-50%);
            z-index: 100;
            display: flex;
            gap: 10px;
        }
        
        .btn {
            background: rgba(0,0,0,0.7);
            color: #fff;
            border: none;
            padding: 10px 20px;
            border-radius: 5px;
            cursor: pointer;
            font-size: 14px;
        }
        
        .btn:hover {
            background: rgba(0,0,0,0.9);
        }
    </style>
</head>
<body>
    <div id="loading">
        <div class="spinner"></div>
        <span>Loading Tour...</span>
    </div>
    
    <div id="tour-container"></div>
    
    <div id="ui" style="display: none;">
        <button class="btn" id="resetBtn">Reset View</button>
        <span class="btn" id="sceneInfo"></span>
    </div>

    <script>
        // Tour configuration
        const tourConfig = ${JSON.stringify(jsonData, null, 8)};
        
        // Initialize tour
        let tour;
        
        document.addEventListener('DOMContentLoaded', async () => {
            try {
                // Create tour instance
                tour = new SenangWebsTour('tour-container', tourConfig);
                
                // Listen to events
                tour.on('sceneChanged', (sceneId) => {
updateSceneInfo();
                });
                
                tour.on('ready', () => {
document.getElementById('loading').classList.add('hidden');
                    document.getElementById('ui').style.display = 'flex';
                    updateSceneInfo();
                });
                
                tour.on('error', (error) => {
                    console.error('Tour error:', error);
                    alert('Failed to load tour: ' + error.message);
                });
                
                // Start tour
                await tour.start();
                
                // Setup UI
                document.getElementById('resetBtn').addEventListener('click', () => {
                    const camera = document.querySelector('[camera]');
                    if (camera) {
                        camera.setAttribute('rotation', '0 0 0');
                    }
                });
                
            } catch (error) {
                console.error('Failed to initialize tour:', error);
                alert('Failed to initialize tour: ' + error.message);
            }
        });
        
        function updateSceneInfo() {
            const sceneId = tour.getCurrentSceneId();
            const scene = tourConfig.scenes.find(s => s.id === sceneId);
            if (scene) {
                document.getElementById('sceneInfo').textContent = scene.name;
            }
        }
    </script>
</body>
</html>`;
    }

    /**
     * Export as standalone HTML viewer
     */
    exportViewerHTML() {
        try {
            const html = this.generateViewerHTML();
            const jsonData = this.generateJSON();
            const filename = sanitizeId(jsonData.title || 'tour') + '-viewer.html';
            
            downloadTextAsFile(html, filename);
            
            showToast('Viewer HTML exported successfully', 'success');
            return true;
        } catch (error) {
            console.error('Export viewer failed:', error);
            showToast('Export viewer failed', 'error');
            return false;
        }
    }

    /**
     * Show export preview in modal
     */
    showExportPreview() {
        try {
            const jsonData = this.generateJSON();
            const json = JSON.stringify(jsonData, null, 2);
            
            const preview = document.getElementById('exportPreview');
            if (preview) {
                preview.textContent = json;
            }
            
            showModal('exportModal');
            return true;
        } catch (error) {
            console.error('Failed to show export preview:', error);
            showToast('Failed to generate preview', 'error');
            return false;
        }
    }
}

export default ExportManager;
