const express = require("express");
const router = express.Router();
const Minio = require("minio");
const fs = require("fs");
const path = require("path");

const minioClient = new Minio.Client({
  endPoint: "minio-service",
  port: 9000,
  useSSL: false,
  accessKey: "minioadmin",
  secretKey: "minioadmin",
});

// Define the base directory for all file operations as 'templates'
const BASE_TEMPLATES_DIR = process.cwd();

// Ensure the templates directory exists
if (!fs.existsSync(BASE_TEMPLATES_DIR)) {
  fs.mkdirSync(BASE_TEMPLATES_DIR, { recursive: true });
  console.log(`Created templates directory: ${BASE_TEMPLATES_DIR}`);
}

/**
 * Recursively gets all file paths within a directory.
 * @param {string} dirPath - The directory to start searching from.
 * @param {string[]} arrayOfFiles - Accumulator for file paths.
 * @returns {string[]} An array of all file paths.
 */
function getAllFiles(dirPath, arrayOfFiles = []) {
  const files = fs.readdirSync(dirPath);
  files.forEach((file) => {
    const fullPath = path.join(dirPath, file);
    if (fs.statSync(fullPath).isDirectory()) {
      arrayOfFiles = getAllFiles(fullPath, arrayOfFiles);
    } else {
      arrayOfFiles.push(fullPath);
    }
  });
  return arrayOfFiles;
}

router.post("/delete", async (req, res) => {
  console.log("removing pod");
  process.exit(1);
});

// Endpoint to save current project files to MinIO
router.post("/save", async (req, res) => {
  // Save from the BASE_TEMPLATES_DIR
  const dir = BASE_TEMPLATES_DIR;
  const bucket = "my-bucket";
  const { userid, sessionid } = req.body;

  if (!userid || !sessionid) {
    return res.status(400).send("❌ userid and sessionid are required");
  }

  try {
    const bucketExists = await minioClient.bucketExists(bucket);
    if (!bucketExists) {
      await minioClient.makeBucket(bucket, "us-east-1");
    }

    // List and remove existing objects for this user/session under the 'templates' prefix
    const prefix = `${userid}/${sessionid}/`; // Adjusted prefix for templates
    const objectsList = await new Promise((resolve, reject) => {
      const items = [];
      const stream = minioClient.listObjects(bucket, prefix, true);
      stream.on("data", (obj) => items.push(obj.name));
      stream.on("error", reject);
      stream.on("end", () => resolve(items));
    });

    if (objectsList.length > 0) {
      await minioClient.removeObjects(bucket, objectsList);
    }

    // Upload all files from the current templates directory
    const files = getAllFiles(dir);
    let uploadedCount = 0;

    for (const filePath of files) {
      if (filePath.includes("node_modules")) continue; // Skip node_modules
      // The relative path needs to be from BASE_TEMPLATES_DIR, and then prepended with 'templates/'
      const relativePathInTemplates = path.relative(BASE_TEMPLATES_DIR, filePath);
      const objectPath = `${userid}/${sessionid}/${relativePathInTemplates}`;
      const stream = fs.createReadStream(filePath);
      await minioClient.putObject(bucket, objectPath, stream);
      uploadedCount++;
    }

    res.status(200).send(`✅ ${uploadedCount} files uploaded from templates directory.`);
  } catch (err) {
    console.error("Error saving files to MinIO:", err);
    res.status(500).send("Error saving files to MinIO");
  }
});

module.exports = {router};