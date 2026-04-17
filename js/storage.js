export const StorageManager = {
    keys: {
        ANSWERS: 'az204_userAnswers',
        SETTINGS: 'az204_settings',
        STATS: 'az204_cumulativeStats',
        USER_ID: 'az204_userId'
    },
    isSyncing: false,

    saveAnswers(answers, suppressSync = false) {
        localStorage.setItem(this.keys.ANSWERS, JSON.stringify(answers));
        if (!suppressSync) this.triggerSync();
    },

    getAnswers() {
        return JSON.parse(localStorage.getItem(this.keys.ANSWERS)) || {};
    },

    saveSettings(settings, suppressSync = false) {
        localStorage.setItem(this.keys.SETTINGS, JSON.stringify(settings));
        if (!suppressSync) this.triggerSync();
    },

    getSettings() {
        return JSON.parse(localStorage.getItem(this.keys.SETTINGS)) || {
            currentTopic: 'all',
            currentFilter: 'all',
            examConfig: {
                count: 50,
                time: 120,
                topics: ['all']
            }
        };
    },

    saveUserId(id) {
        localStorage.setItem(this.keys.USER_ID, id);
    },

    getUserId() {
        return localStorage.getItem(this.keys.USER_ID);
    },

    async triggerSync() {
        if (this.isSyncing) return;
        const userId = this.getUserId();
        if (!userId) return;
        
        this.isSyncing = true;
        try {
            const { SyncManager } = await import('./sync.js');
            const success = await SyncManager.uploadProgress(
                userId, 
                this.getAnswers(), 
                this.getSettings()
            );
            window.dispatchEvent(new CustomEvent('syncStatus', { detail: { success } }));
        } finally {
            this.isSyncing = false;
        }
    },

    exportData() {
        const data = {
            answers: this.getAnswers(),
            settings: this.getSettings(),
            exportDate: new Date().toISOString()
        };
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `az204_backup_${new Date().toISOString().split('T')[0]}.json`;
        a.click();
        URL.revokeObjectURL(url);
    },

    async importData(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => {
                try {
                    const data = JSON.parse(e.target.result);
                    if (data.answers) this.saveAnswers(data.answers);
                    if (data.settings) this.saveSettings(data.settings);
                    resolve(true);
                } catch (err) {
                    reject(err);
                }
            };
            reader.readAsText(file);
        });
    },

    resetAll() {
        localStorage.removeItem(this.keys.ANSWERS);
        localStorage.removeItem(this.keys.SETTINGS);
        localStorage.removeItem(this.keys.USER_ID);
        window.location.reload();
    },

    /**
     * Limpia solo los datos de progreso para permitir cambio de usuario limpio
     */
    logoutUser() {
        localStorage.removeItem(this.keys.ANSWERS);
        localStorage.removeItem(this.keys.SETTINGS);
        localStorage.removeItem(this.keys.USER_ID);
    }
};
