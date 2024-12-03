const admin = require('firebase-admin');

// Developer class representing a developer entity
class Developer {
  constructor(data) {
    // Initialize developer properties from the input data
    this.name = data.name; // Store name in uppercase for consistency
    this.address = data.address; // Address of the developer
    this.incorporationDate = data.incorporationDate; // Date of incorporation
    this.totalProjectsDelivered = parseInt(data.totalProjectsDelivered, 10); // Total projects delivered, converted to integer
    this.totalSqFtDelivered = parseInt(data.totalSqFtDelivered, 10); // Total square footage delivered, converted to integer
    this.countryCode = parseInt(data.countryCode, 10);
    this.stateCode = data.stateCode;
    this.landlineNumber = parseInt(data.landlineNumber, 10);
    this.description = data.description; // Description of the developer
    this.websiteLink = data.websiteLink; // Website link for the developer
    this.logoUrl = data.logoUrl; // Logo URL
    this.age = this.calculateAge(data.incorporationDate); // Calculate the age based on the incorporation date
    this.status = data.status; // Status of the developer (Active or Disable)
    this.createdBy = data.createdBy || null; // User who created the record (if available)
    this.createdOn = data.createdOn || admin.firestore.FieldValue.serverTimestamp(); // Timestamp when the record was created
    this.updatedBy = data.updatedBy || null; // User who last updated the record (if available)
    this.updatedOn = data.updatedOn || admin.firestore.FieldValue.serverTimestamp(); // Timestamp when the record was last updated
  }

  // Static property for the Firestore collection name
  static collectionName = 'developers';

  // Static method for validating developer data
  static validate(data) {
    const errors = []; // Array to store error messages
    // // Validate name: it must be present and in capital letters
    // if (!data.name || !/^[A-Z0-9\s]+$/.test(data.name)) 
    //   errors.push('Developer name is required and must be in capital letters');
    
    // Validate address presence
    if (!data.address) errors.push('Address is required');
    
    // Validate incorporation date: must be a valid date
    if (!data.incorporationDate || isNaN(new Date(data.incorporationDate).getTime())) 
      errors.push('Valid incorporation date is required');
    
    // Parse and validate total projects and square footage delivered
    const totalProjects = parseInt(data.totalProjectsDelivered, 10);
    const totalSqFt = parseInt(data.totalSqFtDelivered, 10);

    if (isNaN(totalProjects)) errors.push('Total projects delivered must be an integer');  
    if (isNaN(totalSqFt)) errors.push('Total sq ft delivered must be an integer');
    
    // Validate description length
    if (!data.description || data.description.length < 50) 
      errors.push('Description must be at least 50 characters long');
    
    // Validate website link format
    if (!data.websiteLink || !this.isValidUrl(data.websiteLink)) 
      errors.push('Valid website link is required');
    
    // Validate logo URL format and file type
    if (!data.logoUrl || !this.isValidImageFormat(data.logoUrl)) 
      errors.push('Logo must be a PNG or JPG file');
    
    // Validate status: must be either Active or Disable
    if (!['Active', 'Disable'].includes(data.status)) 
      errors.push('Status must be either Active or Disable');

    return errors; // Return the list of validation errors (if any)
  }

  // Helper method to check if a string is a valid URL
  static isValidUrl(string) {
    try {
      new URL(string); // Attempt to create a URL object
      return true; // Return true if successful
    } catch (_) {
      return false; // Return false if an error occurs (invalid URL)
    }
  }

  // Helper method to check if the file name has a valid image format
  static isValidImageFormat(filename) {
    return /\.(jpg|jpeg|png)$/i.test(filename); // Test for JPG or PNG file extensions
  }

  // Method to calculate the age of the developer based on the incorporation date
  calculateAge(incorporationDate) {
    const ageDifMs = Date.now() - new Date(incorporationDate).getTime(); // Difference in milliseconds
    const ageDate = new Date(ageDifMs); // Convert to a Date object
    return Math.abs(ageDate.getUTCFullYear() - 1970); // Calculate age in years
  }

  // Method to prepare the developer data for Firestore
  toFirestore() {
    return {
      name: this.name,
      address: this.address,
      incorporationDate: this.incorporationDate,
      totalProjectsDelivered: this.totalProjectsDelivered,
      totalSqFtDelivered: this.totalSqFtDelivered,
      countryCode: this.countryCode,
      stateCode: this.stateCode,
      landlineNumber: this.landlineNumber,
      description: this.description,
      websiteLink: this.websiteLink,
      logoUrl: this.logoUrl,
      age: this.age,
      status: this.status,
      createdBy: this.createdBy,
      createdOn: this.createdOn,
      updatedBy: this.updatedBy,
      updatedOn: this.updatedOn
    }; // Return an object formatted for Firestore
  }
}

// Export the Developer class for use in other modules
module.exports = Developer;