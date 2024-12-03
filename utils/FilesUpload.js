const { bucket } = require('../config/firebase');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

// Define folder paths for different file types stored in Firebase
const FOLDER_PATHS = {
  logoUrl: 'DeveloperLogo', // Folder for developer logos
  images: 'ProjectImages', // Folder for project images
  videos: 'ProjectVideos', // Folder for project videos
  brochureUrl: 'ProjectBrochures', // Folder for project brochures
  reraCertificateUrl: 'ReraCertificatePdf', // Folder for reraCertificateUrl pdf
  layoutPlanUrl: 'SeriesLayouts', // Folder for series layout plans
  insideImagesUrls: 'SeriesImages', // Folder for inside series images
  insideVideosUrls: 'SeriesVideos', // Folder for inside series videos
  amenityLogo: 'AmenitiesLogo'
};

// Function to generate a unique filename for uploaded files
const generateFileName = (file, folder, entityId = '') => {
  const timestamp = new Date().getTime(); // Get the current timestamp
  const uuid = uuidv4(); // Generate a unique identifier
  const ext = path.extname(file.originalname); // Get the file extension

  // Create folder structure with optional entity ID for organization
  const folderPath = entityId 
    ? `${FOLDER_PATHS[folder]}/${entityId}` // Include entity ID if provided
    : FOLDER_PATHS[folder]; // Use the base folder path

  // Return a unique file name combining folder path, timestamp, UUID, and extension
  return `${folderPath}/${timestamp}-${uuid}${ext}`;
};

// Function to upload a single file to Firebase
const uploadToFirebase = async (file, folder, entityId = '') => {

  // console.log('===== Upload To Firebase =====');
  // console.log('Uploading file:', file?.originalname);
  // console.log('To folder:', folder);
  // console.log('Entity ID:', entityId);

  if (!file) return null;
  // console.log('No file provided to uploadToFirebase'); // Return null if no file is provided
  
  const fileName = generateFileName(file, folder, entityId);
  // console.log('Generated filename:', fileName); // Generate a unique file name
  const fileUpload = bucket.file(fileName); // Create a reference to the file in the bucket

  // Create a writable stream for uploading the file
  const blobStream = fileUpload.createWriteStream({
    metadata: {
      contentType: file.mimetype, // Set the content type of the file
      metadata: {
        entityId,
        originalName: file.originalname, // Store the original file name
        uploadTimestamp: new Date().toISOString(), // Log the upload timestamp
        folder: FOLDER_PATHS[folder] // Store the folder path for reference
      }
    },
    resumable: false // Disable resumable uploads for simplicity
  });

  return new Promise((resolve, reject) => {
    // Handle any errors that occur during upload
    blobStream.on('error', (error) => {
      console.error('Upload error:', error); // Log the error
      reject(error); // Reject the promise with the error
    });

    // Handle successful upload
    blobStream.on('finish', async () => {
      // console.log('Stream finished for file:', fileName);
      try {
        await fileUpload.makePublic(); // Make the uploaded file publicly accessible
        const publicUrl = `https://storage.googleapis.com/${bucket.name}/${fileName}`; // Construct the public URL
        // console.log('File made public, URL:', publicUrl);
        resolve(publicUrl); // Resolve the promise with the public URL
      } catch (error) {
        console.error('Make public error:', error); // Log any errors when making the file public
        reject(error); // Reject the promise with the error
      }
    });

    // End the stream with the file buffer to start the upload
    blobStream.end(file.buffer);
  });
};

// Function to upload multiple files to Firebase
const uploadMultipleFiles = async (files, folder, entityId = '') => {


  // console.log('===== Upload Multiple Files =====');
  // console.log('Number of files:', Array.isArray(files) ? files.length : 1);
  // console.log('Folder:', folder);
  // console.log('Entity ID:', entityId);


  // Check if the provided files is an array; if not, upload the single file
  if (!files || !Array.isArray(files)) {
    if (files) return uploadToFirebase(files, folder, entityId); // Upload single file if provided
    // console.log('No files provided to uploadMultipleFiles');
    return null; // Return null if no files are provided
  }
  
  try {
    // Map each file to the uploadToFirebase function and wait for all uploads to complete
    const uploadPromises = files.map(file => uploadToFirebase(file, folder, entityId));
    const results = await Promise.all(uploadPromises); // Wait for all uploads to finish
    return Array.isArray(files) ? results : results[0]; // Return results as an array or single result
  } catch (error) {
    console.error('Error uploading files:', error); // Log any errors that occur during the upload process
    throw error; // Propagate the error to the caller
  }
};

// Function to delete a file from Firebase using its URL
const deleteFromFirebase = async (fileUrl) => {
  // Validate the provided URL
  if (!fileUrl || typeof fileUrl !== 'string' || !fileUrl.trim()) {
    console.error('Invalid fileUrl provided to deleteFromFirebase:', fileUrl); // Log the error for invalid URL
    return;
  }
  
  try {
    let fileName;
    // Parse the file name from the provided URL
    if (fileUrl.startsWith('https://storage.googleapis.com/')) {
      const bucketAndPath = fileUrl.replace('https://storage.googleapis.com/', '');
      const pathParts = bucketAndPath.split('/');
      pathParts.shift(); // Remove bucket name from the path
      fileName = pathParts.join('/'); // Reconstruct the file name
    } else if (fileUrl.startsWith('gs://')) {
      const bucketAndPath = fileUrl.replace('gs://', '');
      const pathParts = bucketAndPath.split('/');
      pathParts.shift(); // Remove bucket name from the path
      fileName = pathParts.join('/'); // Reconstruct the file name
    } else {
      fileName = fileUrl; // Use the URL directly if it doesn't match known patterns
    }

    fileName = fileName.split('?')[0]; // Remove query parameters
    fileName = decodeURIComponent(fileName); // Decode any URL-encoded characters

    // console.log('Attempting to delete file:', fileName); // Log the file name being deleted

    const file = bucket.file(fileName); // Reference the file in the bucket
    
    const [exists] = await file.exists(); // Check if the file exists
    if (!exists) {
      // console.log('File does not exist:', fileName); // Log if the file does not exist
      return; // Exit if the file is not found
    }

    await file.delete(); // Delete the file from the bucket
    // console.log('Successfully deleted file:', fileName); // Log successful deletion
  } catch (error) {
    console.error('Error deleting file from Firebase:', error); // Log any errors during the deletion process
    throw error; // Propagate the error to the caller
  }
};

// Function to delete multiple files from Firebase
const deleteMultipleFiles = async (fileUrls) => {
  if (!fileUrls) return; // Exit if no file URLs are provided
  
  // Ensure fileUrls is an array
  const urls = Array.isArray(fileUrls) ? fileUrls : [fileUrls];
  try {
    // Map each URL to the deleteFromFirebase function and wait for all deletions to complete
    const deletePromises = urls.map(url => deleteFromFirebase(url));
    await Promise.all(deletePromises); // Wait for all deletions to finish
  } catch (error) {
    console.error('Error deleting files:', error); // Log any errors that occur during the deletion process
    throw error; // Propagate the error to the caller
  }
};

// Function to validate files before uploading
const validateFiles = (files, type, currentCount = 0) => {
  const { MAX_COUNTS, FILE_LIMITS } = require('../middleware/UploadMiddleware'); // Import file limits and max counts

  if (!files) return null; // Exit if no files are provided

  // Ensure files is an array for consistency
  const filesArray = Array.isArray(files) ? files : [files];
  const totalCount = filesArray.length + currentCount; // Calculate total count of files including current count

  // Check if the total count exceeds the maximum allowed for this type
  if (totalCount > MAX_COUNTS[type]) {
    throw new Error(`Maximum ${MAX_COUNTS[type]} ${type} allowed`); // Throw an error if limit is exceeded
  }

  // Validate the size of each file
  filesArray.forEach(file => {
    if (file.size > FILE_LIMITS[type]) {
      throw new Error(`${type} size must be less than ${FILE_LIMITS[type] / (1024 * 1024)}MB`); // Throw an error if file size exceeds limit
    }
  });

  return true; // Return true if all validations pass
};

// Export the functions for use in other modules
module.exports = {
  uploadToFirebase,
  deleteFromFirebase,
  uploadMultipleFiles,
  deleteMultipleFiles,
  validateFiles,
  FOLDER_PATHS
};