import express from 'express';
import { saveFile, loadFile, listFiles, deleteFile } from '../services/minio.js';

const router = express.Router();

// Save file
router.post('/save', async (req, res) => {
  const { sessionId, filePath, content } = req.body;
  
  if (!sessionId || !filePath || content === undefined) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  const result = await saveFile(sessionId, filePath, content);
  res.json(result);
});

// Load file
router.get('/load/:sessionId/*', async (req, res) => {
  const { sessionId } = req.params;
  const filePath = req.params[0];
  
  const result = await loadFile(sessionId, filePath);
  res.json(result);
});

// List files
router.get('/list/:sessionId', async (req, res) => {
  const { sessionId } = req.params;
  
  const result = await listFiles(sessionId);
  res.json(result);
});

// Delete file
router.delete('/delete', async (req, res) => {
  const { sessionId, filePath } = req.body;
  
  if (!sessionId || !filePath) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  const result = await deleteFile(sessionId, filePath);
  res.json(result);
});

export default router;