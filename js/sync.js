// sync.js
// Servicio para gestionar la comunicación con el servidor PHP

const API_URL = 'api/progress.php'; // Cambiar por la URL absoluta si se usa desde otro dominio

export const SyncManager = {
    /**
     * Descarga el progreso del servidor para un usuario específico
     */
    async fetchProgress(userId) {
        try {
            const response = await fetch(`${API_URL}?user_id=${encodeURIComponent(userId)}`);
            if (!response.ok) throw new Error('Error en la red');
            const result = await response.json();
            return result.success ? result.data : null;
        } catch (error) {
            console.error('Err Sync Fetch:', error);
            return null;
        }
    },

    /**
     * Sube el progreso local al servidor
     */
    async uploadProgress(userId, answers, settings) {
        if (!userId) return;

        try {
            const response = await fetch(API_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    user_id: userId,
                    answers: answers,
                    settings: settings
                })
            });
            const result = await response.json();
            return result.success;
        } catch (error) {
            console.warn('Err Sync Upload (Offline?):', error);
            return false;
        }
    }
};
