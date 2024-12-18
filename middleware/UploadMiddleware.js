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
  
  // Define allowed file types for images, videos, and PDFs
  const allowedImageTypes = /jpeg|jpg|png|gif|webp|bmp|tiff|svg/i;
  const allowedVideoTypes = /mp4|mov|avi|mkv|wmv|flv|webm|m4v|mpeg|mpg/i;
  const allowedPdfTypes = /pdf|doc|docx|jpg|jpeg|png|gif|webp|csv|xls|xlsx|txt/i;
  
  const ext = path.extname(file.originalname).toLowerCase().substring(1); // Get the file extension

  // console.log("Filtering file:", file.originalname, "Type:", ext, "Size:", file.size); // Log file details for debugging

  // Check if the field name in the request matches the defined limits
  if (!Object.keys(FILE_LIMITS).includes(file.fieldname)) {
    // console.error(`Invalid field name: ${file.fieldname}`); // Log error for invalid field names
    return cb(new Error(`Invalid field name: ${file.fieldname}`), false); // Return error callback
  }

  try {
    // Validate the file based on its field name
    switch (file.fieldname) {
      case 'logoUrl':
        if (!allowedImageTypes.test(ext)) { // Check if logo is in allowed formats
          throw new Error('Logo must be JPG or PNG format'); // Throw an error if format is invalid
        }
        break;

      case 'images':
      case 'insideImagesUrls':
        if (!allowedImageTypes.test(ext)) { // Validate image formats
          throw new Error('Images must be JPG or PNG format');
        }
        break;

      case 'videos':
      case 'insideVideosUrls':
        if (!allowedVideoTypes.test(ext)) { // Validate video formats
          throw new Error('Videos must be MP4 or MOV format');
        }
        break;

      case 'brochureUrl':
      case 'layoutPlanUrl':
        case 'reraCertificateUrl':
        if (!allowedPdfTypes.test(ext)) { // Validate PDF formats
          throw new Error('File must be PDF format');
        }
        break;

      default:
        throw new Error('Invalid field name'); // Handle unexpected field names
    }

    // Check file size limits for the current field
    if (file.size > FILE_LIMITS[file.fieldname]) {
      console.error(`File size exceeds limit for ${file.fieldname}`); // Log size error
      throw new Error(`File size exceeds limit for ${file.fieldname}`);
    }

    // Check for maximum file count for fields that allow multiple uploads
    if (file.fieldname !== 'logoUrl' && 
        file.fieldname !== 'brochureUrl' &&
        file.fieldname !== 'layoutPlanUrl' &&  
        file.fieldname !== 'reraCertificateUrl') {
      const existingFiles = req.files ? req.files[file.fieldname] : []; // Retrieve existing files if any
      if (existingFiles && existingFiles.length >= MAX_COUNTS[file.fieldname]) {
        throw new Error(`Maximum number of files reached for ${file.fieldname}`); // Error if max count is reached
      }
    }

    cb(null, true); // Call callback with success
  } catch (error) {
    cb(error, false); // Call callback with error
  }
};

// Define the fields to upload with multer
const uploadFields = [
  { name: 'logoUrl', maxCount: MAX_COUNTS.logoUrl }, // Define logo field
  { name: 'images', maxCount: MAX_COUNTS.images }, // Define images field
  { name: 'videos', maxCount: MAX_COUNTS.videos }, // Define videos field
  { name: 'brochureUrl', maxCount: MAX_COUNTS.brochureUrl }, // Define brochure field
  { name: 'reraCertificateUrl', maxCount: MAX_COUNTS.reraCertificateUrl },
  { name: 'layoutPlanUrl', maxCount: MAX_COUNTS.layoutPlanUrl }, // Define layout plan field
  { name: 'insideImagesUrls', maxCount: MAX_COUNTS.insideImagesUrls }, // Define inside images field
  { name: 'insideVideosUrls', maxCount: MAX_COUNTS.insideVideosUrls } // Define inside videos field
];

// Configure multer with storage options, file filter, and limits
const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: Math.max(...Object.values(FILE_LIMITS)) // Set max file size limit from defined limits
  }
});

// Error handling middleware for upload errors
const handleUploadError = (err, req, res, next) => {
  // Check if the error is from multer
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_UNEXPECTED_FILE') {
      // Handle unexpected field errors
      return res.status(400).json({
        error: `Unexpected field: ${err.field}. Allowed fields are: ${uploadFields.map(f => f.name).join(', ')}`
      });
    }
    return res.status(400).json({ error: err.message }); // Handle other multer errors
  }
  next(err); // Pass any other errors to the next middleware
};

// Export necessary components for use in other modules
module.exports = {
  upload, // Export the configured upload function
  uploadFields, // Export the upload fields configuration
  FILE_LIMITS, // Export the defined file limits
  MAX_COUNTS, // Export the defined max counts for file uploads
  handleUploadError // Export the error handling middleware
};