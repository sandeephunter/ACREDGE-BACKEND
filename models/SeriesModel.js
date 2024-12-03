const admin = require('firebase-admin');

// Defining a Series class to represent a series of units within a project
class Series {
  constructor(data) {
    // Assigning the properties of the series from the provided data
    this.developerId = data.developerId; // ID of the developer
    this.projectId = data.projectId; // ID of the project this series belongs to
    this.towerId = data.towerId; // ID of the tower within the project
    this.seriesName = data.seriesName; // Name of the series
    this.typology = data.typology || []; // Typology of the units in this series
    this.addOns = data.addOns;
    this.parkingTypes = data.parkingTypes;
    this.parkingFloorCount = parseInt(data.parkingFloorCount, 10);
    this.carpetArea = parseInt(data.carpetArea, 10); // Carpet area in square feet
    this.superArea = parseInt(data.superArea, 10); // Super area in square feet
    this.startingPrice = parseInt(data.startingPrice, 10); // Starting price of the units in this series
    this.layoutPlanUrl = data.layoutPlanUrl; // URL for the layout plan (should be a PDF)
    
    // Initializing arrays for inside images and videos, ensuring they're defined
    this.insideImagesUrls = data.insideImagesUrls || [];
    this.insideVideosUrls = data.insideVideosUrls || [];

    this.livingRoom = data.livingRoom;
    this.drawingRoom = data.drawingRoom;
    this.diningRoom = data.diningRoom;
    this.kitchen = data.kitchen;
    
    // Directions for exit and master bedroom
    this.exitUnitDirection = data.exitUnitDirection; 
    this.masterBedroomDirection = data.masterBedroomDirection; 
    
    // Dimensions and counts for rooms
    this.masterBedroomDimensions = parseInt(data.masterBedroomDimensions, 10); // Dimensions of the master bedroom
    this.totalBedrooms = parseInt(data.totalBedrooms, 10); // Total number of bedrooms
    this.totalKitchens = parseInt(data.totalKitchens, 10); // Total number of kitchens
    this.totalWashrooms = parseInt(data.totalWashrooms, 10); // Total number of washrooms
    
    // Status of the series (Active/Disable)
    this.status = data.status; 
    
    // Tracking who created and updated this series, with timestamps for record-keeping
    this.createdBy = data.createdBy || null;
    this.createdOn = data.createdOn || admin.firestore.FieldValue.serverTimestamp(); // Automatically set on creation
    this.updatedBy = data.updatedBy || null;
    this.updatedOn = data.updatedOn || admin.firestore.FieldValue.serverTimestamp(); // Automatically set on update
  }

  // Defining the name of the collection in Firestore for this class
  static collectionName = 'series';

  // Validating the incoming data for the series to ensure all required fields are correct
  static validate(data) {
    const errors = []; // Array to hold any validation errors

    // Check for required fields and their validity
    if (!data.developerId) errors.push('Developer ID is required');
    if (!data.projectId) errors.push('Project ID is required');
    if (!data.towerId) errors.push('Tower ID is required');
    if (!data.seriesName) errors.push('Series name is required');

      if (!data.typology) errors.push('Typology is required');
      
      if (!Array.isArray(data.addOns)) {
        errors.push('addOns must be an array');
      } else {
        const addOns = ['Servant Room', 'Utility', 'Store', 'Study', 'Basement', 
                                'Powder Room', 'Puja Room', 'Terrace', 'FrontYard', 'Backyard'];
        if (!data.addOns.every(type => addOns.includes(type))) {
          errors.push('Invalid addOns selection');
        }
      }

    const validParkingTypes = ['Open', 'Covered'];
    if (!validParkingTypes.includes(data.parkingTypes)) {
      errors.push('Invalid parking type selection');
    }

      // Validate parkingFloorCount (dropdown 0-4) only if 'Covered' parking is selected
    if (data.parkingTypes && data.parkingTypes.includes('Covered')) {
      const parkingFloorCount = parseInt(data.parkingFloorCount, 10);
      if (![0, 1, 2, 3, 4].includes(parkingFloorCount)) {
        errors.push('parkingFloorCount must be either 0, 1, 2, 3, 4');
      }
    }

    // Parse and validate numeric fields
    const carpetArea = parseInt(data.carpetArea, 10);
    const superArea = parseInt(data.superArea, 10);
    const startingPrice = parseInt(data.startingPrice, 10);
    const masterBedroomDimensions = parseInt(data.masterBedroomDimensions, 10);
    const totalBedrooms = parseInt(data.totalBedrooms, 10);
    const totalKitchens = parseInt(data.totalKitchens, 10);
    const totalWashrooms = parseInt(data.totalWashrooms, 10);
    
    if (isNaN(carpetArea)) errors.push('Carpet area must be an integer');
    if (isNaN(superArea)) errors.push('Super area must be an integer');
    if (isNaN(startingPrice)) errors.push('Starting price must be an integer');
    
    // Validate the layout plan URL to ensure it's a PDF format
    if (!this.isValidPdfFormat(data.layoutPlanUrl)) 
      errors.push('Layout plan must be a PDF file');
      
    // Ensure inside images and videos are arrays
    if (!Array.isArray(data.insideImagesUrls)) errors.push('Inside images must be an array');
    if (!Array.isArray(data.insideVideosUrls)) errors.push('Inside videos must be an array');
    
    // Check for required directions
    if (!data.exitUnitDirection) errors.push('Exit unit direction is required');
    if (!data.masterBedroomDirection) errors.push('Master bedroom direction is required');
    
    // Validate bedroom dimensions and counts
    if (isNaN(masterBedroomDimensions)) errors.push('Master bedroom dimensions must be an integer');
    if (isNaN(totalBedrooms)) errors.push('Total bedrooms must be an integer');
    if (isNaN(totalKitchens)) errors.push('Total kitchens must be an integer');
    if (isNaN(totalWashrooms)) errors.push('Total washrooms must be an integer');
    
    // Validate status of the series
    if (!['Active', 'Disable'].includes(data.status)) errors.push('Status must be either Active or Disable');

    return errors; // Return the list of validation errors (if any)
  }

  // Helper method to validate that a filename ends with '.pdf'
  static isValidPdfFormat(filename) {
    return /\.pdf$/i.test(filename); // Regex to check for PDF format
  }

  // Method to convert the series instance into a format suitable for Firestore storage
  toFirestore() {
    return {
      developerId: this.developerId,
      projectId: this.projectId,
      towerId: this.towerId,
      seriesName: this.seriesName,
      typology: this.typology,
      addOns:this.addOns,
      parkingTypes: this.parkingTypes,
      parkingFloorCount: this.parkingFloorCount,
      carpetArea: this.carpetArea,
      superArea: this.superArea,
      startingPrice: this.startingPrice,
      layoutPlanUrl: this.layoutPlanUrl,
      insideImagesUrls: this.insideImagesUrls,
      insideVideosUrls: this.insideVideosUrls,
      livingRoom: this.livingRoom,
      drawingRoom: this.drawingRoom,
      diningRoom: this.diningRoom,
      kitchen: this.kitchen,
      exitUnitDirection: this.exitUnitDirection,
      masterBedroomDirection: this.masterBedroomDirection,
      masterBedroomDimensions: this.masterBedroomDimensions,
      totalBedrooms: this.totalBedrooms,
      totalKitchens: this.totalKitchens,
      totalWashrooms: this.totalWashrooms,
      status: this.status,
      createdBy: this.createdBy,
      createdOn: this.createdOn,
      updatedBy: this.updatedBy,
      updatedOn: this.updatedOn
    };
  }
}

// Exporting the Series class for use in other parts of the application
module.exports = Series;
