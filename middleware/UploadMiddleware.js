const multer = require('multer');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

const storage = multer.memoryStorage();

const FILE_LIMITS = {
  logoUrl: 10 * 1024 * 1024,
  images: 50 * 1024 * 1024,
  videos: 500 * 1024 * 1024,
  brochureUrl: 50 * 1024 * 1024,
  reraCertificateUrl: 50 * 1024 * 1024,
  layoutPlanUrl: 50 * 1024 * 1024,
  insideImagesUrls: 50 * 1024 * 1024,
  insideVideosUrls: 500 * 1024 * 1024,
  amenityLogo: 10 * 1024 * 1024
};

const MAX_COUNTS = {
  logoUrl: 1,
  images: 20,
  videos: 5,
  brochureUrl: 1,
  reraCertificateUrl: 1,
  layoutPlanUrl: 1,
  insideImagesUrls: 20,
  insideVideosUrls: 5,
  amenityLogo: 1
};

// Helper function to sanitize and validate file extension
const getFileExtension = (filename) => {
  // Remove special characters and spaces from the extension
  const ext = path.extname(filename)
    .toLowerCase()
    .replace(/[^a-z0-9.]/g, '')
    .substring(1);
  return ext;
};

// Helper function to check MIME type
const isValidMimeType = (mimetype, allowedTypes) => {
  return allowedTypes.some(type => mimetype.includes(type));
};

const fileFilter = (req, file, cb) => {
  // Define allowed MIME types
  const allowedImageMimes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp', 'image/bmp', 'image/tiff', 'image/svg+xml'];
  const allowedVideoMimes = ['video/mp4', 'video/quicktime', 'video/x-msvideo', 'video/x-matroska', 'video/webm', 'video/mpeg'];
  const allowedDocMimes = [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp',
    'text/csv',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'text/plain'
  ];

  try {
    if (!Object.keys(FILE_LIMITS).includes(file.fieldname)) {
      throw new Error(`Invalid field name: ${file.fieldname}`);
    }

    // Validate file based on MIME type first
    switch (file.fieldname) {
      case 'logoUrl':
      case 'images':
      case 'insideImagesUrls':
        if (!isValidMimeType(file.mimetype, allowedImageMimes)) {
          throw new Error('Invalid image format. Supported formats: JPG, PNG, GIF, WEBP, BMP, TIFF, SVG');
        }
        break;

      case 'videos':
      case 'insideVideosUrls':
        if (!isValidMimeType(file.mimetype, allowedVideoMimes)) {
          throw new Error('Invalid video format. Supported formats: MP4, MOV, AVI, MKV, WEBM, MPEG');
        }
        break;

      case 'brochureUrl':
      case 'layoutPlanUrl':
      case 'reraCertificateUrl':
        if (!isValidMimeType(file.mimetype, allowedDocMimes)) {
          throw new Error('Invalid document format. Supported formats: PDF, DOC, DOCX, Images, CSV, XLS, XLSX, TXT');
        }
        break;
    }

    // Check file size
    if (file.size > FILE_LIMITS[file.fieldname]) {
      throw new Error(`File size exceeds limit for ${file.fieldname}`);
    }

    // Check file count for multiple uploads
    if (MAX_COUNTS[file.fieldname] > 1) {
      const existingFiles = req.files?.[file.fieldname] || [];
      if (existingFiles.length >= MAX_COUNTS[file.fieldname]) {
        throw new Error(`Maximum number of files (${MAX_COUNTS[file.fieldname]}) reached for ${file.fieldname}`);
      }
    }

    cb(null, true);
  } catch (error) {
    cb(error, false);
  }
};

const uploadFields = Object.entries(MAX_COUNTS).map(([name, maxCount]) => ({
  name,
  maxCount
}));

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: Math.max(...Object.values(FILE_LIMITS))
  }
});

const handleUploadError = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_UNEXPECTED_FILE') {
      return res.status(400).json({
        error: `Unexpected field: ${err.field}. Allowed fields are: ${uploadFields.map(f => f.name).join(', ')}`
      });
    }
    return res.status(400).json({ error: err.message });
  }
  
  if (err.message) {
    return res.status(400).json({ error: err.message });
  }
  
  next(err);
};

module.exports = {
  upload,
  uploadFields,
  FILE_LIMITS,
  MAX_COUNTS,
  handleUploadError
};