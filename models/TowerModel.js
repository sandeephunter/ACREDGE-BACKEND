const admin = require('firebase-admin');

// Define the Tower class to represent a building structure within a project
class Tower {
  // Constructor to initialize the Tower instance with provided data
  constructor(data) {
    this.developerId = data.developerId; // ID of the developer responsible for the tower
    this.projectId = data.projectId; // ID of the project this tower belongs to
    this.name = data.name; // Name of the tower
    this.towerLobbyHeight = parseInt(data.towerLobbyHeight, 10); // Tower lobby height (1-4)
    this.totalLobbyUnits = parseInt(data.totalLobbyUnits, 10); // Total lobby units (1-16)
    this.totalFloors = parseInt(data.totalFloors, 10); // Total number of floors in the tower
    this.coreCount = parseInt(data.coreCount, 10); // Number of cores (elevator shafts) in the tower
    this.totalUnits = parseInt(data.totalUnits, 10); // Total number of residential/commercial units in the tower
    this.LobbyFloorCount = parseInt(data.LobbyFloorCount, 10); // Total number of floors in the tower
    this.createdBy = data.createdBy || null; // User who created this entry
    this.createdOn = data.createdOn || admin.firestore.FieldValue.serverTimestamp(); // Timestamp for when the entry was created
    this.updatedBy = data.updatedBy || null; // User who last updated this entry
    this.updatedOn = data.updatedOn || admin.firestore.FieldValue.serverTimestamp(); // Timestamp for when the entry was last updated
  }

  // Static property to define the name of the Firestore collection for towers
  static collectionName = 'towers';

  // Static method to validate incoming data for a Tower instance
  static validate(data) {
    const errors = []; // Initialize an array to store validation errors

    // Validate required fields
    if (!data.developerId) errors.push('Developer ID is required');
    if (!data.projectId) errors.push('Project ID is required');
    if (!data.name) errors.push('Tower name is required');

    // Validate towerLobbyHeight (dropdown 1-4)
    const towerLobbyHeight = parseInt(data.towerLobbyHeight, 10);
    if (!towerLobbyHeight || towerLobbyHeight < 1 || towerLobbyHeight > 4) {
      errors.push('Tower lobby height must be between 1 and 4');
    }

    // Validate totalLobbyUnits (dropdown 1-16)
    const totalLobbyUnits = parseInt(data.totalLobbyUnits, 10);
    if (!totalLobbyUnits || totalLobbyUnits < 1 || totalLobbyUnits > 16) {
      errors.push('Total lobby units must be between 1 and 16');
    }

    // Validate LobbyFloorCount (integer)
    const LobbyFloorCount = parseInt(data.LobbyFloorCount, 10);
    if (isNaN(LobbyFloorCount) || !Number.isInteger(LobbyFloorCount)) {
      errors.push('LobbyFloorCount must be an integer');
    }
    
    // Parse and validate integer fields; using parseInt ensures we convert them correctly
    const totalFloors = parseInt(data.totalFloors, 10);
    const coreCount = parseInt(data.coreCount, 10);
    const totalUnits = parseInt(data.totalUnits, 10);
    
    // Check for integer validity
    if (isNaN(totalFloors)) errors.push('Total floors must be an integer');
    if (isNaN(coreCount)) errors.push('Core count must be an integer');
    if (isNaN(totalUnits)) errors.push('Total units must be an integer');

    // Return any validation errors found
    return errors;
  }

  // Method to convert the Tower instance into a Firestore-compatible object
  toFirestore() {
    return {
      developerId: this.developerId, // Developer ID
      projectId: this.projectId, // Project ID
      name: this.name, // Tower name
      towerLobbyHeight: this.towerLobbyHeight,
      totalLobbyUnits: this.totalLobbyUnits,
      totalFloors: this.totalFloors, // Total floors
      coreCount: this.coreCount, // Core count
      totalUnits: this.totalUnits, // Total units
      LobbyFloorCount: this.LobbyFloorCount, // Total units
      createdBy: this.createdBy, // User who created the entry
      createdOn: this.createdOn, // Timestamp of creation
      updatedBy: this.updatedBy, // User who last updated the entry
      updatedOn: this.updatedOn // Timestamp of last update
    };
  }
}

// Export the Tower class for use in other modules
module.exports = Tower;