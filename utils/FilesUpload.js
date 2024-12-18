const { bucket } = require('../config/firebase');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

const FOLDER_PATHS = {
  logoUrl: 'DeveloperLogo',
  images: 'ProjectImages',
  videos: 'ProjectVideos',
  brochureUrl: 'ProjectBrochures',
  reraCertificateUrl: 'ReraCertificatePdf',
  layoutPlanUrl: 'SeriesLayouts',
  insideImagesUrls: 'SeriesImages',
  insideVideosUrls: 'SeriesVideos',
  amenityLogo: 'AmenitiesLogo'
};

// Updated function to handle special characters and spaces in filenames
const sanitizeFileName = (fileName) => {
  return fileName
    .replace(/[^a-zA-Z0-9.-]/g, '_') // Replace special characters with underscore
    .replace(/\s+/g, '_') // Replace spaces with underscore
    .replace(/_+/g, '_') // Replace multiple consecutive underscores with single underscore
    .toLowerCase(); // Convert to lowercase for consistency
};

const generateFileName = (file, folder, entityId = '') => {
  const timestamp = new Date().getTime();
  const uuid = uuidv4();
  const originalExt = path.extname(file.originalname);
  const sanitizedName = sanitizeFileName(path.basename(file.originalname, originalExt));
  
  const folderPath = entityId 
    ? `${FOLDER_PATHS[folder]}/${entityId}`
    : FOLDER_PATHS[folder];

  // Include sanitized original name in the final filename
  return `${folderPath}/${sanitizedName}_${timestamp}_${uuid}${originalExt.toLowerCase()}`;
};

const uploadToFirebase = async (file, folder, entityId = '') => {
  if (!file) return null;
  
  const fileName = generateFileName(file, folder, entityId);
  const fileUpload = bucket.file(fileName);

  const blobStream = fileUpload.createWriteStream({
    metadata: {
      contentType: file.mimetype,
      metadata: {
        entityId,
        originalName: file.originalname,
        uploadTimestamp: new Date().toISOString(),
        folder: FOLDER_PATHS[folder]
      }
    },
    resumable: false
  });

  return new Promise((resolve, reject) => {
    blobStream.on('error', (error) => {
      console.error('Upload error:', error);
      reject(error);
    });

    blobStream.on('finish', async () => {
      try {
        await fileUpload.makePublic();
        const publicUrl = encodeURI(`https://storage.googleapis.com/${bucket.name}/${fileName}`);
        resolve(publicUrl);
      } catch (error) {
        console.error('Make public error:', error);
        reject(error);
      }
    });

    blobStream.end(file.buffer);
  });
};

const uploadMultipleFiles = async (files, folder, entityId = '') => {
  if (!files || !Array.isArray(files)) {
    if (files) return uploadToFirebase(files, folder, entityId);
    return null;
  }
  
  try {
    const uploadPromises = files.map(file => uploadToFirebase(file, folder, entityId));
    const results = await Promise.all(uploadPromises);
    return Array.isArray(files) ? results : results[0];
  } catch (error) {
    console.error('Error uploading files:', error);
    throw error;
  }
};

const deleteFromFirebase = async (fileUrl) => {
  if (!fileUrl || typeof fileUrl !== 'string' || !fileUrl.trim()) {
    console.error('Invalid fileUrl provided to deleteFromFirebase:', fileUrl);
    return;
  }
  
  try {
    let fileName = decodeURIComponent(fileUrl);
    
    if (fileName.startsWith('https://storage.googleapis.com/')) {
      const bucketAndPath = fileName.replace('https://storage.googleapis.com/', '');
      const pathParts = bucketAndPath.split('/');
      pathParts.shift();
      fileName = pathParts.join('/');
    } else if (fileName.startsWith('gs://')) {
      const bucketAndPath = fileName.replace('gs://', '');
      const pathParts = bucketAndPath.split('/');
      pathParts.shift();
      fileName = pathParts.join('/');
    }

    fileName = fileName.split('?')[0];

    const file = bucket.file(fileName);
    
    const [exists] = await file.exists();
    if (!exists) {
      return;
    }

    await file.delete();
  } catch (error) {
    console.error('Error deleting file from Firebase:', error);
    throw error;
  }
};

const deleteMultipleFiles = async (fileUrls) => {
  if (!fileUrls) return;
  
  const urls = Array.isArray(fileUrls) ? fileUrls : [fileUrls];
  try {
    const deletePromises = urls.map(url => deleteFromFirebase(url));
    await Promise.all(deletePromises);
  } catch (error) {
    console.error('Error deleting files:', error);
    throw error;
  }
};

const validateFiles = (files, type, currentCount = 0) => {
  const { MAX_COUNTS, FILE_LIMITS } = require('../middleware/UploadMiddleware');

  if (!files) return null;

  const filesArray = Array.isArray(files) ? files : [files];
  const totalCount = filesArray.length + currentCount;

  if (totalCount > MAX_COUNTS[type]) {
    throw new Error(`Maximum ${MAX_COUNTS[type]} ${type} allowed`);
  }

  filesArray.forEach(file => {
    if (file.size > FILE_LIMITS[type]) {
      throw new Error(`${type} size must be less than ${FILE_LIMITS[type] / (1024 * 1024)}MB`);
    }
  });

  return true;
};

module.exports = {
  uploadToFirebase,
  deleteFromFirebase,
  uploadMultipleFiles,
  deleteMultipleFiles,
  validateFiles,
  FOLDER_PATHS
};