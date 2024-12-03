const admin = require('firebase-admin');

class Project {
  // Constructor initializes the project data, setting default values where applicable.
  constructor(data) {
    this.developerId = data.developerId; // The ID of the developer associated with this project.
    this.name = data.name; // The name of the project.
    this.whyThisProject = data.whyThisProject; // Justification for this project's importance.
    this.description = data.description; // A detailed description of the project.
    this.launchDate = data.launchDate; // The planned launch date of the project.
    this.images = data.images || []; // Array of image URLs associated with the project.
    this.videos = data.videos || []; // Array of video URLs associated with the project.
    this.reraStatus = data.reraStatus; // RERA (Real Estate Regulatory Authority) status of the project.
    this.reraNumber = data.reraNumber; // RERA registration number, required if the project is approved.
    this.reraCompletionDate = data.reraCompletionDate; // Date when the RERA approval process was completed.
    this.projectStatus = data.projectStatus; // Current status of the project (e.g., Delivered or Under Construction).
    this.status = data.status; // Current status of the project (e.g., Active or Disabled).
    this.projectAddress = data.projectAddress; // The postal code of the project's location.
    this.category = data.category; // Category of the project (Residential or Commercial).
    this.amenities = data.amenities;
    this.localityHighlights = data.localityHighlights || []; // Highlights of the local area surrounding the project.
    this.brochureUrl = data.brochureUrl; // URL to the project's brochure for additional information.
    this.reraCertificateUrl = data.reraCertificateUrl; // URL to the project's RERA certificate PDF
    this.priceStart = parseInt(data.priceStart, 10); // Starting price for the units in the project.
    this.priceEnd = parseInt(data.priceEnd, 10); // Ending price for the units in the project.
    this.paymentPlan = data.paymentPlan; // Payment plan options for potential buyers.
    this.unitSizes = data.unitSizes || []; // Array of sizes for different units in the project.
    this.totalAcres = parseInt(data.totalAcres, 10); // Total area of the project in acres.
    this.totalUnits = parseInt(data.totalUnits, 10); // Total number of units in the project.
    this.density = data.density; // Density of the project (Low, Mid, High).
    this.clubCount = parseInt(data.clubCount, 10); // Number of clubs/amenities in the project.
    this.totalClubArea = parseInt(data.totalClubArea, 10); // Total area of the clubs/amenities.
    this.openArea = parseInt(data.openArea, 10); // Total open area in the project.
    this.projectType = data.projectType; // Type of the project (Floor, Villa, Penthouse, Duplex, Independent House).
    this.createdBy = data.createdBy || null; // The user who created this project entry.
    this.createdOn = data.createdOn || admin.firestore.FieldValue.serverTimestamp(); // Timestamp when the project was created.
    this.updatedBy = data.updatedBy || null; // The user who last updated this project entry.
    this.updatedOn = data.updatedOn || admin.firestore.FieldValue.serverTimestamp(); // Timestamp when the project was last updated.
  }

  // Static property to hold the name of the Firestore collection.
  static collectionName = 'projects';

  // Method to validate the project data before saving to the database.
  static validate(data) {
    const errors = []; // Array to hold validation error messages.

    // Validating required fields and their formats.
    if (!data.developerId) errors.push('Developer ID is required');
    if (!data.name) errors.push('Project name is required');

    // Validate address presence
    // if (!data.address) errors.push('Address is required');

    if (!data.whyThisProject || data.whyThisProject.length < 50) errors.push('Why this project must be at least 50 characters');
    if (!data.description || data.description.length < 50) errors.push('Project description must be at least 50 characters');
    if (!data.launchDate || isNaN(new Date(data.launchDate).getTime())) errors.push('Valid launch date is required');

    // images and videos.
    // Ensure data.images is treated as an array
    if (data.images === undefined) {
      data.images = [];
    } else if (!Array.isArray(data.images)) {
      errors.push('images must be an array');
    }

    // Ensure data.videos is treated as an array
    if (data.videos === undefined) {
      data.videos = [];
    } else if (!Array.isArray(data.videos)) {
      errors.push('videos must be an array');
    }

    // Validate each image URL if images array exists and is an array
    if (Array.isArray(data.images)) {
      data.images.forEach((url, index) => {
        if (url && !this.isValidUrl(url)) {
          errors.push(`Invalid URL format for image at index ${index}`);
        }
      });
    }

    // Validate each video URL if videos array exists and is an array
    if (Array.isArray(data.videos)) {
      data.videos.forEach((url, index) => {
        if (url && !this.isValidUrl(url)) {
          errors.push(`Invalid URL format for video at index ${index}`);
        }
      });
    }

    // Validating RERA status and required fields based on status.
    if (!['Rera Applied', 'Rera Approved'].includes(data.reraStatus)) errors.push('RERA status must be either Rera Applied or Rera Approved');
    if (data.reraStatus === 'Rera Approved' && !data.reraNumber) errors.push('RERA number is required for approved projects');
    if (!data.reraCompletionDate || isNaN(new Date(data.reraCompletionDate).getTime())) errors.push('Valid RERA completion date is required');
    if (!['Delivered', 'Under Construction'].includes(data.projectStatus)) errors.push('Project status must be either Delivered or Under Construction');
    
    // Validating numeric fields and their formats.
    const priceStart = parseInt(data.priceStart, 10);
    const priceEnd = parseInt(data.priceEnd, 10);

    if (!['Residential', 'Commercial'].includes(data.category)) errors.push('Category must be either Residential or Commercial');

    // Validating brochure URL if provided.
    if (data.brochureUrl && !this.isValidUrl(data.brochureUrl)) {
      errors.push('Invalid brochure URL format');
    }

    // Validating reraCertificateUrl URL if provided.
    if (data.reraCertificateUrl && !this.isValidUrl(data.reraCertificateUrl)) {
      errors.push('Invalid reraCertificateUrl URL format');
    }
    
    // Validating price fields.
    if (isNaN(priceStart)) errors.push('Price start must be an integer');
    if (isNaN(priceEnd)) errors.push('Price end must be an integer');

    return errors; // Return any validation errors found.
  }

  // Helper method to validate if a string is a valid URL.
  static isValidUrl(string) {
    if (!string || typeof string !== 'string') return false;
    try {
      new URL(string);
      return true;
    } catch (_) {
      return false;
    }
  }

  // Method to convert project data to a Firestore-compatible format.
  toFirestore() {
    return {
      developerId: this.developerId,
      name: this.name,
      whyThisProject: this.whyThisProject,
      description: this.description,
      launchDate: this.launchDate,
      images: this.images,
      videos: this.videos,
      reraStatus: this.reraStatus,
      reraNumber: this.reraNumber,
      reraCompletionDate: this.reraCompletionDate,
      projectStatus: this.projectStatus,
      status: this.status,
      projectAddress: this.projectAddress,
      category: this.category,
      amenities: this.amenities,
      localityHighlights: this.localityHighlights,
      brochureUrl: this.brochureUrl,
      reraCertificateUrl: this.reraCertificateUrl,
      priceStart: this.priceStart,
      priceEnd: this.priceEnd,
      paymentPlan: this.paymentPlan,
      unitSizes: this.unitSizes,
      totalAcres: this.totalAcres,
      totalUnits: this.totalUnits,
      density: this.density,
      clubCount: this.clubCount,
      totalClubArea: this.totalClubArea,
      openArea: this.openArea,
      projectType: this.projectType,
      createdBy: this.createdBy,
      createdOn: this.createdOn,
      updatedBy: this.updatedBy,
      updatedOn: this.updatedOn
    };
  }
}

module.exports = Project; // Export the Project class for use in other modules.