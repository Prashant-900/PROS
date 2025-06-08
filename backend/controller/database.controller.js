// createFolder.js
import { Client } from 'minio';

const minioClient = new Client({
  endPoint: process.env.BUCKET_HOST,
  port: process.env.BUCKET_PORT,
  useSSL: false,
  accessKey: process.env.BUCKET_USER,
  secretKey: process.env.BUCKET_PASS,
});

const BUCKET_NAME = process.env.BUCKET_NAME;

export async function createFolder(userId, sessionId) {
  try {
    // Ensure the bucket exists
    const bucketExists = await minioClient.bucketExists(BUCKET_NAME);
    if (!bucketExists) {
      await minioClient.makeBucket(BUCKET_NAME);
    }

    // Define the "folder" path (prefix)
    const folderPath = `${userId}/${sessionId}/`;

    // Upload an empty object to represent the folder
    await minioClient.putObject(BUCKET_NAME, folderPath, '');

    return folderPath;
  } catch (error) {
    console.error('❌ Failed to create folder:', error);
    throw error;
  }
}

export async function deleteFolder(userId, sessionId) {
  try {
    const prefix = `${userId}/${sessionId}/`;

    const objectsToDelete = [];

    const objectsStream = minioClient.listObjects(BUCKET_NAME, prefix, true);

    for await (const obj of objectsStream) {
      objectsToDelete.push(obj.name);
    }

    if (objectsToDelete.length === 0) {
      return;
    }

    await minioClient.removeObjects(BUCKET_NAME, objectsToDelete);
 
  } catch (error) {
    console.error('❌ Failed to delete folder:', error);
    throw error;
  }
}

export async function saveFile(userid, sessionid) {
  if (!userid || !sessionid) {
    const errorMsg = "❌ Error: userid and sessionid must be provided.";
    console.error(errorMsg);
    return { message: errorMsg };
  }

  try {
    const response = await fetch(`http://service-${sessionid}:8080/save`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ userid, sessionid }),
    });

    const responseText = await response.text();

    if (!response.ok) {
      const errorMsg = `❌ Server responded with error (${response.status}): ${responseText}`;
      console.error(errorMsg);
      return { message: errorMsg };
    }

    const successMsg = `File saved successfully`;
    return { message: successMsg };
  } catch (error) {
    const errorMsg = `❌ Network or fetch error while saving file: ${error.message}`;
    console.error(errorMsg);
    return { message: errorMsg };
  }
}

