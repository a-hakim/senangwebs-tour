// Storage Manager - Handles LocalStorage operations

class ProjectStorageManager {
    constructor() {
        this.storageKey = 'swt_project';
        this.autoSaveInterval = null;
        this.autoSaveDelay = 30000; // 30 seconds
    }

    /**
     * Save project to localStorage
     */
    saveProject(projectData) {
        try {
            const json = JSON.stringify(projectData);
            localStorage.setItem(this.storageKey, json);
            localStorage.setItem(this.storageKey + '_lastSaved', new Date().toISOString());
            return true;
        } catch (error) {
            console.error('Failed to save project:', error);
            if (error.name === 'QuotaExceededError') {
                showToast('Storage quota exceeded. Project too large!', 'error');
            }
            return false;
        }
    }

    /**
     * Load project from localStorage
     */
    loadProject() {
        try {
            const json = localStorage.getItem(this.storageKey);
            if (json) {
                return JSON.parse(json);
            }
            return null;
        } catch (error) {
            console.error('Failed to load project:', error);
            showToast('Failed to load project', 'error');
            return null;
        }
    }

    /**
     * Clear project from localStorage
     */
    clearProject() {
        try {
            localStorage.removeItem(this.storageKey);
            localStorage.removeItem(this.storageKey + '_lastSaved');
            return true;
        } catch (error) {
            console.error('Failed to clear project:', error);
            return false;
        }
    }

    /**
     * Check if project exists in localStorage
     */
    hasProject() {
        return localStorage.getItem(this.storageKey) !== null;
    }

    /**
     * Get last saved date
     */
    getLastSavedDate() {
        const dateStr = localStorage.getItem(this.storageKey + '_lastSaved');
        return dateStr ? new Date(dateStr) : null;
    }

    /**
     * Start auto-save
     */
    startAutoSave(callback) {
        this.stopAutoSave();
        this.autoSaveInterval = setInterval(() => {
            callback();
        }, this.autoSaveDelay);
    }

    /**
     * Stop auto-save
     */
    stopAutoSave() {
        if (this.autoSaveInterval) {
            clearInterval(this.autoSaveInterval);
            this.autoSaveInterval = null;
        }
    }

    /**
     * Export project to file
     */
    exportToFile(projectData, filename = 'tour.json') {
        try {
            const json = JSON.stringify(projectData, null, 2);
            downloadTextAsFile(json, filename);
            return true;
        } catch (error) {
            console.error('Failed to export project:', error);
            showToast('Failed to export project', 'error');
            return false;
        }
    }

    /**
     * Import project from file
     */
    async importFromFile(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            
            reader.onload = (e) => {
                try {
                    const projectData = JSON.parse(e.target.result);
                    resolve(projectData);
                } catch (error) {
                    console.error('Failed to parse project file:', error);
                    showToast('Invalid project file', 'error');
                    reject(error);
                }
            };
            
            reader.onerror = () => {
                console.error('Failed to read file:', reader.error);
                showToast('Failed to read file', 'error');
                reject(reader.error);
            };
            
            reader.readAsText(file);
        });
    }
}

export default ProjectStorageManager;
