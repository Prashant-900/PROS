const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';

export const fileService = {
  async saveFile(sessionId, filePath, content) {
    try {
      const response = await fetch(`${API_BASE}/files/save`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId, filePath, content })
      });
      return await response.json();
    } catch (error) {
      return { success: false, error: error.message };
    }
  },

  async loadFile(sessionId, filePath) {
    try {
      const response = await fetch(`${API_BASE}/files/load/${sessionId}/${filePath}`);
      return await response.json();
    } catch (error) {
      return { success: false, error: error.message };
    }
  },

  async listFiles(sessionId) {
    try {
      const response = await fetch(`${API_BASE}/files/list/${sessionId}`);
      return await response.json();
    } catch (error) {
      return { success: false, error: error.message };
    }
  },

  async deleteFile(sessionId, filePath) {
    try {
      const response = await fetch(`${API_BASE}/files/delete`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId, filePath })
      });
      return await response.json();
    } catch (error) {
      return { success: false, error: error.message };
    }
  }
};