export const StorageManager = {
    keys: {
        ANSWERS: 'az204_userAnswers',
        SETTINGS: 'az204_settings',
        STATS: 'az204_cumulativeStats'
    },

    saveAnswers(answers) {
        localStorage.setItem(this.keys.ANSWERS, JSON.stringify(answers));
    },

    getAnswers() {
        return JSON.parse(localStorage.getItem(this.keys.ANSWERS)) || {};
    },

    saveSettings(settings) {
        localStorage.setItem(this.keys.SETTINGS, JSON.stringify(settings));
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
        window.location.reload();
    }
};
