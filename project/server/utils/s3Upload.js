const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');
const { s3 } = require('../config/aws');

const useS3 = Boolean(
  process.env.AWS_ACCESS_KEY_ID &&
  process.env.AWS_SECRET_ACCESS_KEY &&
  process.env.AWS_S3_BUCKET_NAME
);

// Ensure uploads directory exists
const UPLOADS_DIR = path.join(__dirname, '..', 'uploads');
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

// File filter function — supports images, CAD files and documents
const fileFilter = (req, file, cb) => {
  const fileExt = path.extname(file.originalname).toLowerCase();

  const allowedImageExts = ['.jpeg', '.jpg', '.png', '.gif', '.webp', '.bmp', '.tiff', '.tif', '.svg'];
  const allowedCADExts   = ['.stl', '.step', '.stp', '.iges', '.igs', '.obj', '.3mf', '.dxf', '.dwg', '.pdf']; // added pdf for easy testing 
  const allowedDocExts   = ['.pdf', '.doc', '.docx', '.xls', '.xlsx', '.csv', '.txt'];

  const isImage = allowedImageExts.includes(fileExt);
  const isCAD   = allowedCADExts.includes(fileExt);
  const isDoc   = allowedDocExts.includes(fileExt);

  if (isImage || isCAD || isDoc) {
    return cb(null, true);
  } else {
    cb(new Error(`File type "${fileExt}" not allowed! Supported: images, CAD files, documents.`), false);
  }
};

// Configure multer with dynamic file size limits using diskStorage to avoid loading huge files in memory
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, UPLOADS_DIR);
  },
  filename: function (req, file, cb) {
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `${uuidv4()}-${Date.now()}${ext}`);
  }
});

const createUpload = (maxSize = 5 * 1024 * 1024) => multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: maxSize
  }
});

const upload = createUpload(5 * 1024 * 1024);
const uploadLarge = createUpload(150 * 1024 * 1024);
const uploadMedium = createUpload(50 * 1024 * 1024);
const uploadDocument = createUpload(10 * 1024 * 1024);

const getObjectKey = (folder, filename) => {
  const prefix = (process.env.S3_FOLDER_PREFIX || 'enigma').replace(/^\/+|\/+$/g, '');
  const safeFolder = (folder || 'uploads').replace(/^\/+|\/+$/g, '');
  return `${prefix}/${safeFolder}/${filename}`;
};

const uploadToS3 = async (file, folder) => {
  const filePath = path.join(UPLOADS_DIR, file.filename);
  const key = getObjectKey(folder, file.filename);

  if (useS3) {
    const fileContent = await fs.promises.readFile(filePath);
    await s3.upload({
      Bucket: process.env.AWS_S3_BUCKET_NAME,
      Key: key,
      Body: fileContent,
      ContentType: file.mimetype
    }).promise();

    await fs.promises.unlink(filePath).catch(() => {});
    return key;
  }

  return file.filename;
};

// Function to fake delete
const deleteFromS3 = async (fileKey) => {
  try {
    const filePath = path.join(UPLOADS_DIR, fileKey);
    if (fs.existsSync(filePath)) {
      await fs.promises.unlink(filePath);
    }
    return true;
  } catch (error) {
    console.error('Error deleting local file:', error);
    return false;
  }
};

const getPublicBaseUrl = () => {
  const publicBase = process.env.AWS_CLOUDFRONT_DOMAIN || process.env.S3_PUBLIC_URL;
  if (publicBase) return publicBase.replace(/\/$/, '');
  return (process.env.API_URL || `http://localhost:${process.env.PORT || 5005}`).replace(/\/$/, '');
};

const getCloudFrontUrl = (s3Key) => {
  if (!s3Key) return s3Key;
  if (useS3 || s3Key.includes('/')) {
    return `${getPublicBaseUrl()}/${s3Key}`;
  }
  return `${getPublicBaseUrl()}/uploads/${s3Key}`;
};

const extractS3KeyFromUrl = (url) => {
  if (!url) return null;
  const publicBase = getPublicBaseUrl();
  const uploadsPrefix = `${(process.env.API_URL || `http://localhost:${process.env.PORT || 5005}`).replace(/\/$/, '')}/uploads/`;

  if (url.startsWith(`${publicBase}/`)) {
    return url.replace(`${publicBase}/`, '');
  }
  if (url.startsWith(uploadsPrefix)) {
    return url.replace(uploadsPrefix, '');
  }
  return url.split('/').pop();
};

module.exports = {
  upload,
  uploadLarge,
  uploadMedium,
  uploadDocument,
  uploadToS3,
  deleteFromS3,
  getCloudFrontUrl,
  extractS3KeyFromUrl,
  s3: {} 
};