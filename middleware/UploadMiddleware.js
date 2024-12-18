const multer = require('multer');
const path = require('path');

const storage = multer.memoryStorage();

const FILE_LIMITS = {
  logoUrl: 10 * 1024 * 1024,         // 10MB for logos
  images: 50 * 1024 * 1024,           // 50MB for images
  videos: 500 * 1024 * 1024,          // 500MB for videos
  brochureUrl: 50 * 1024 * 1024,      // 50MB for brochure
  reraCertificateUrl: 50 * 1024 * 1024, // 50MB for RERA certificate
  layoutPlanUrl: 50 * 1024 * 1024,    // 50MB for layout plan
  insideImagesUrls: 50 * 1024 * 1024, // 50MB for inside images
  insideVideosUrls: 500 * 1024 * 1024,// 500MB for inside videos
  amenityLogo: 10 * 1024 * 1024       // 10MB for amenity logos
};

const MAX_COUNTS = {  
  images: 50,
  videos: 10,
  documents: 20
};

const fileFilter = (req, file, cb) => {
  // Expanded allowed file types
  const allowedImageTypes = /jpeg|jpg|png|gif|webp|bmp|tiff|svg/i;
  const allowedVideoTypes = /mp4|mov|avi|mkv|wmv|flv|webm|m4v|mpeg|mpg/i;
  const allowedDocTypes = /pdf|doc|docx|jpg|jpeg|png|gif|webp|csv|xls|xlsx|txt/i;

  const ext = path.extname(file.originalname).toLowerCase().substring(1);

  try {
    switch (file.fieldname) {
      case 'logoUrl':
      case 'amenityLogo':
        if (!allowedImageTypes.test(ext)) {
          throw new Error('Logo must be an image (JPEG, PNG, GIF, WebP, etc.)');
        }
        if (file.size > FILE_LIMITS.logoUrl) {
          throw new Error('Logo size exceeds 10MB limit');
        }
        break;

      case 'images':
      case 'brochureUrl':
      case 'reraCertificateUrl':
      case 'layoutPlanUrl':
      case 'insideImagesUrls':
        if (!allowedImageTypes.test(ext)) {
          throw new Error('Images must be in supported image formats (JPEG, PNG, GIF, etc.)');
        }
        if (file.size > FILE_LIMITS.images) {
          throw new Error('Image size exceeds 50MB limit');
        }
        break;

      case 'videos':
      case 'insideVideosUrls':
        if (!allowedVideoTypes.test(ext)) {
          throw new Error('Videos must be in supported video formats (MP4, MOV, AVI, etc.)');
        }
        if (file.size > FILE_LIMITS.videos) {
          throw new Error('Video size exceeds 500MB limit');
        }
        break;

      case 'documents':
        if (!allowedDocTypes.test(ext)) {
          throw new Error('Documents must be in supported formats (PDF, DOC, DOCX, etc.)');
        }
        if (file.size > FILE_LIMITS.brochureUrl) {
          throw new Error('Document size exceeds 50MB limit');
        }
        break;

      default:
        throw new Error('Invalid field name');
    }

    // Check file count limits
    const existingFiles = req.files ? req.files[file.fieldname] : [];
    if (file.fieldname !== 'logoUrl' && file.fieldname !== 'amenityLogo' && 
        existingFiles && 
        existingFiles.length >= MAX_COUNTS[file.fieldname]) {
      throw new Error(`Maximum number of ${file.fieldname} reached`);
    }

    cb(null, true);
  } catch (error) {
    cb(error, false);
  }
};

// Multiple files upload for property media with expanded support
const uploadPropertyMedia = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: Math.max(...Object.values(FILE_LIMITS))
  }
}).fields([
  { name: 'logoUrl', maxCount: 1 },
  { name: 'images', maxCount: MAX_COUNTS.images },
  { name: 'videos', maxCount: MAX_COUNTS.videos },
  { name: 'documents', maxCount: MAX_COUNTS.documents },
  { name: 'brochureUrl', maxCount: 1 },
  { name: 'reraCertificateUrl', maxCount: 1 },
  { name: 'layoutPlanUrl', maxCount: 1 },
  { name: 'insideImagesUrls', maxCount: MAX_COUNTS.images },
  { name: 'insideVideosUrls', maxCount: MAX_COUNTS.videos },
  { name: 'amenityLogo', maxCount: 1 }
]);

const handleUploadError = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_UNEXPECTED_FILE') {
      return res.status(400).json({
        error: `Unexpected field: ${err.field}`
      });
    }
    return res.status(400).json({ error: err.message });
  }
  next(err);
};

module.exports = {
  uploadPropertyMedia,
  handleUploadError,
  FILE_LIMITS,
  MAX_COUNTS
};