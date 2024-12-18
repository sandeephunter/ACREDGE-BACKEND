const multer = require('multer');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

// Set up multer to use in-memory storage for uploaded files
const storage = multer.memoryStorage();

// Define file size limits in bytes for various file types
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

// Define maximum counts for each file type
const MAX_COUNTS = {
  logoUrl: 1, // Only 1 logo is allowed
  images: 20, // Maximum 20 images can be uploaded
  videos: 5, // Maximum 5 videos can be uploaded
  brochureUrl: 1, // Only 1 brochure is allowed
  reraCertificateUrl: 1, // Only 1 RERA certificate is allowed
  layoutPlanUrl: 1, // Only 1 layout plan is allowed
  insideImagesUrls: 20, // Maximum 20 inside images
  insideVideosUrls: 5, // Maximum 5 inside videos
  amenityLogo: 1
};

// Function to filter files based on type, size, and count
const fileFilter = (req, file, cb) => {

  // console.log('===== File Filter =====');
  // console.log('Field name:', file.fieldname);
  // console.log('Original name:', file.originalname);
  // console.log('File size:', file.size);
  // console.log('Mime type:', file.mimetype);
  
  // Allow any original filename
  const originalName = file.originalname.toLowerCase();
  const mimeType = file.mimetype.toLowerCase();

  // console.log("Filtering file:", file.originalname, "Type:", ext, "Size:", file.size); // Log file details for debugging

  // Check if the field name in the request matches the defined limits
  if (!Object.keys(FILE_LIMITS).includes(file.fieldname)) {
    // console.error(`Invalid field name: ${file.fieldname}`); // Log error for invalid field names
    return cb(new Error(`Invalid field name: ${file.fieldname}`), false); // Return error callback
  }

  try {
    // Validate based on field type
    switch (file.fieldname) {
      case 'logoUrl':
      case 'images':
      case 'insideImagesUrls':
        // Accept common image formats
        if (!mimeType.startsWith('image/')) {
          throw new Error(`${file.fieldname} must be an image file`);
        }
        break;

      case 'videos':
      case 'insideVideosUrls':
        // Accept common video formats
        if (!mimeType.startsWith('video/')) {
          throw new Error(`${file.fieldname} must be a video file`);
        }
        break;

      case 'brochureUrl':
      case 'layoutPlanUrl':
      case 'reraCertificateUrl':
        // Accept PDF and common document formats
        const validDocTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
        if (!validDocTypes.includes(mimeType)) {
          throw new Error(`${file.fieldname} must be a PDF or document file`);
        }
        break;

      default:
        throw new Error('Invalid field name');
    }

    // Check file size
    if (file.size > FILE_LIMITS[file.fieldname]) {
      throw new Error(`File size exceeds limit for ${file.fieldname}`);
    }

    // Check file count for multiple file fields
    if (file.fieldname !== 'logoUrl' && 
        file.fieldname !== 'brochureUrl' &&
        file.fieldname !== 'layoutPlanUrl' &&
        file.fieldname !== 'reraCertificateUrl') {
      const existingFiles = req.files ? req.files[file.fieldname] : [];
      if (existingFiles && existingFiles.length >= MAX_COUNTS[file.fieldname]) {
        throw new Error(`Maximum number of files reached for ${file.fieldname}`);
      }
    }

    cb(null, true);
  } catch (error) {
    cb(error, false);
  }
};

// Configure upload fields
const uploadFields = [
  { name: 'logoUrl', maxCount: MAX_COUNTS.logoUrl },
  { name: 'images', maxCount: MAX_COUNTS.images },
  { name: 'videos', maxCount: MAX_COUNTS.videos },
  { name: 'brochureUrl', maxCount: MAX_COUNTS.brochureUrl },
  { name: 'reraCertificateUrl', maxCount: MAX_COUNTS.reraCertificateUrl },
  { name: 'layoutPlanUrl', maxCount: MAX_COUNTS.layoutPlanUrl },
  { name: 'insideImagesUrls', maxCount: MAX_COUNTS.insideImagesUrls },
  { name: 'insideVideosUrls', maxCount: MAX_COUNTS.insideVideosUrls },
  { name: 'amenityLogo', maxCount: MAX_COUNTS.amenityLogo }
];

// Configure multer
const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: Math.max(...Object.values(FILE_LIMITS))
  }
});

// Error handling middleware
const handleUploadError = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_UNEXPECTED_FILE') {
      return res.status(400).json({
        error: `Unexpected field: ${err.field}. Allowed fields are: ${uploadFields.map(f => f.name).join(', ')}`
      });
    }
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