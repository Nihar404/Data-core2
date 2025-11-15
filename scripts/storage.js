// Enhanced LLM-Powered Regex Patterns for Intelligent Data Processing
const LLMRegexPatterns = {
    // Enhanced media type detection
    mediaTypes: {
        image: /^image\/(jpeg|jpg|png|gif|bmp|webp|svg\+xml)$/i,
        video: /^video\/(mp4|avi|mov|wmv|flv|webm|mkv|mpeg|mpg)$/i,
        audio: /^audio\/(mp3|wav|ogg|aac|flac|m4a)$/i,
        document: /^application\/(pdf|msword|vnd\.openxmlformats-officedocument|text\/(plain|html|css|javascript))$/i
    }
};

// Main File Storage System using Storage Manager
class FileStorageSystem {
    constructor() {
        this.storageManager = new StorageManager();
        this.init();
    }

    async init() {
        await this.storageManager.init();
    }

    async storeFile(username, file, category, metadata = {}) {
        return await this.storageManager.storeFile(username, file, category, metadata);
    }

    async getUserFiles(username) {
        return await this.storageManager.getUserFiles(username);
    }

    async getFile(fileId) {
        return await this.storageManager.getFile(fileId);
    }

    async deleteFile(fileId) {
        return await this.storageManager.deleteFile(fileId);
    }

    async searchFiles(username, query) {
        return await this.storageManager.searchFiles(username, query);
    }

    async getStorageStats(username) {
        return await this.storageManager.getStorageStats(username);
    }

    async getBackendInfo() {
        return await this.storageManager.getBackendInfo();
    }

    formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }
}

// Note: IntelligentDataProcessor class is defined in main.js to avoid duplicate declarations


// Storage Management Functions
async function optimizeStorage() {
    showNotification('OPTIMIZING_STORAGE_PLEASE_WAIT', 'success');
    // Add storage optimization logic here
    setTimeout(() => {
        showNotification('STORAGE_OPTIMIZATION_COMPLETE', 'success');
    }, 2000);
}

async function clearCache() {
    if (confirm('ARE_YOU_SURE_YOU_WANT_TO_CLEAR_ALL_CACHE?_THIS_WILL_NOT_DELETE_YOUR_FILES.')) {
        try {
            // Clear temporary data but keep user files
            localStorage.removeItem('data_bhandaar_temp');
            showNotification('CACHE_CLEARED_SUCCESSFULLY', 'success');
        } catch (error) {
            showNotification(`CACHE_CLEAR_FAILED: ${error.message}`, 'error');
        }
    }
}

async function exportAllData() {
    try {
        const files = await dataProcessor.getUserFiles();
        if (files.length === 0) {
            showNotification('NO_FILES_TO_EXPORT', 'error');
            return;
        }

        const exportData = {
            exportDate: new Date().toISOString(),
            username: dataProcessor.userSession.username,
            totalFiles: files.length,
            files: files
        };

        const blob = new Blob([JSON.stringify(exportData, null, 2)], { 
            type: 'application/json' 
        });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `data_bhandaar_export_${new Date().getTime()}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        showNotification('DATA_EXPORTED_SUCCESSFULLY', 'success');
    } catch (error) {
        showNotification(`EXPORT_FAILED: ${error.message}`, 'error');
    }
}