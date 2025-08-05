import { Client } from 'minio';
import dotenv from 'dotenv';

dotenv.config();

const minioClient = new Client({
  endPoint: process.env.MINIO_ENDPOINT || 'localhost',
  port: parseInt(process.env.MINIO_PORT) || 9000,
  useSSL: false,
  accessKey: process.env.MINIO_ACCESS_KEY || 'minioadmin',
  secretKey: process.env.MINIO_SECRET_KEY || 'minioadmin123'
});

const BUCKET_NAME = 'pros-sessions';

// Initialize bucket
const initBucket = async () => {
  try {
    const exists = await minioClient.bucketExists(BUCKET_NAME);
    if (!exists) {
      await minioClient.makeBucket(BUCKET_NAME);
      console.log(`✅ MinIO bucket '${BUCKET_NAME}' created`);
    }
  } catch (error) {
    console.error('❌ MinIO bucket initialization failed:', error);
  }
};

export const saveFile = async (sessionId, filePath, content) => {
  try {
    const objectName = `${sessionId}/${filePath}`;
    await minioClient.putObject(BUCKET_NAME, objectName, content);
    return { success: true, path: objectName };
  } catch (error) {
    console.error('❌ File save failed:', error);
    return { success: false, error: error.message };
  }
};

export const loadFile = async (sessionId, filePath) => {
  try {
    const objectName = `${sessionId}/${filePath}`;
    const stream = await minioClient.getObject(BUCKET_NAME, objectName);
    
    let content = '';
    return new Promise((resolve, reject) => {
      stream.on('data', chunk => content += chunk);
      stream.on('end', () => resolve({ success: true, content }));
      stream.on('error', error => reject({ success: false, error: error.message }));
    });
  } catch (error) {
    return { success: false, error: error.message };
  }
};

export const listFiles = async (sessionId) => {
  try {
    const prefix = `${sessionId}/`;
    const stream = minioClient.listObjects(BUCKET_NAME, prefix, true);
    
    const files = [];
    return new Promise((resolve, reject) => {
      stream.on('data', obj => files.push(obj.name.replace(prefix, '')));
      stream.on('end', () => resolve({ success: true, files }));
      stream.on('error', error => reject({ success: false, error: error.message }));
    });
  } catch (error) {
    return { success: false, error: error.message };
  }
};

export const deleteFile = async (sessionId, filePath) => {
  try {
    const objectName = `${sessionId}/${filePath}`;
    await minioClient.removeObject(BUCKET_NAME, objectName);
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

// Initialize on import
initBucket();