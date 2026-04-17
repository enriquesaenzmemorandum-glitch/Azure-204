// sync.js
// Servicio para gestionar la comunicación con el servidor PHP

const API_URL = 'api/progress.php'; 
/** 
 * ⚠️ IMPORTANTE: 
 * Si tu web está en NETLIFY, la URL relativa 'api/progress.php' NO FUNCIONARÁ.
 * Debes cambiarla por la URL absoluta de tu servidor PHP.
 * Ejemplo: const API_URL = 'https://tu-hosting.com/subcarpeta/api/progress.php';
 */

export const SyncManager = {
    async fetchProgress(userId) {
        try {
            const response = await fetch(`${API_URL}?user_id=${encodeURIComponent(userId)}`);
            if (!response.ok) throw new Error(`HTTP Error: ${response.status}`);
            const result = await response.json();
            return result.success ? result.data : null;
        } catch (error) {
            console.error('Fetch Error:', error);
            return null;
        }
    },

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
            
            if (!response.ok) {
                console.error('Server returned error status:', response.status);
                return false;
            }

            const result = await response.json();
            return result.success;
        } catch (error) {
            console.error('Upload failed (check URL or CORS):', error);
            return false;
        }
    }
};
