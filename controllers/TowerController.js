const Tower = require('../models/TowerModel');
const { db } = require('../config/firebase');

// Controller for creating a new tower
exports.createTower = async (req, res) => {
  try {
    // Extract tower data from the request body
    const towerData = req.body;

    // Validate the incoming data and check for any errors
    const errors = Tower.validate(towerData);
    if (errors.length > 0) {
      return res.status(400).json({ errors }); // Return validation errors if any
    }

    // Ensure the user is authenticated before proceeding
    if (!req.user || !req.user.email) {
      return res.status(401).json({ message: "Authentication required" });
    }

    // Assign metadata to the tower data for tracking
    towerData.createdBy = req.user.email; // Set the creator's email
    towerData.createdOn = new Date(); // Set the creation date
    towerData.updatedBy = null; // Initialize updatedBy as null
    towerData.updatedOn = null; // Initialize updatedOn as null

    // Create a new Tower instance and save it to Firestore
    const tower = new Tower(towerData);
    const docRef = await db.collection(Tower.collectionName).add(tower.toFirestore());
    
    // Respond with the newly created tower's ID and data
    res.status(201).json({ id: docRef.id, ...tower });
  } catch (error) {
    console.error('Error in Create Tower:', error); // Log the error for debugging
    res.status(500).json({ error: error.message }); // Respond with the error message
  }
};

// Controller for retrieving all towers
exports.getAllTowers = async (req, res) => {
  try {
    // Fetch all tower documents from Firestore
    const snapshot = await db.collection(Tower.collectionName).get();
    // Map the documents to an array of tower objects with IDs
    const towers = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    // Respond with the array of towers
    res.status(200).json(towers);
  } catch (error) {
    console.error('Error in Get All Towers:', error); // Log any error that occurs
    res.status(500).json({ error: error.message }); // Return the error message
  }
};

// Controller for retrieving a single tower by ID
exports.getTowerById = async (req, res) => {
  try {
    // Get the specific tower document using the provided ID
    const docRef = await db.collection(Tower.collectionName).doc(req.params.id).get();
    if (!docRef.exists) {
      return res.status(404).json({ message: 'Tower not found' }); // Handle case where tower doesn't exist
    }
    // Respond with the tower's data
    res.status(200).json({ id: docRef.id, ...docRef.data() });
  } catch (error) {
    console.error('Error in Get Tower By ID:', error); // Log errors for debugging
    res.status(500).json({ error: error.message }); // Return the error message
  }
};

// Controller for updating an existing tower
exports.updateTower = async (req, res) => {
  try {
    const { id } = req.params; // Get tower ID from the request parameters
    const updatedData = req.body; // Extract updated data from the request body
    
    // Validate the updated data and check for errors
    const errors = Tower.validate(updatedData);
    if (errors.length > 0) {
      return res.status(400).json({ errors }); // Return validation errors if any
    }

    // Ensure the user is authenticated before allowing updates
    if (!req.user || !req.user.email) {
      return res.status(401).json({ message: "Authentication required" });
    }

    // Fetch the existing tower document to maintain createdBy and createdOn fields
    const towerDoc = await db.collection(Tower.collectionName).doc(id).get();
    if (!towerDoc.exists) {
      return res.status(404).json({ message: 'Tower not found' }); // Handle case where tower doesn't exist
    }

    // Preserve original created fields while updating others
    const existingData = towerDoc.data();
    updatedData.createdBy = existingData.createdBy; // Keep the original creator
    updatedData.createdOn = existingData.createdOn; // Keep the original creation date
    updatedData.updatedBy = req.user.email; // Set the updater's email
    updatedData.updatedOn = new Date(); // Update the timestamp of the last update

    // Create a new Tower instance with updated data and save it to Firestore
    const tower = new Tower(updatedData);
    await db.collection(Tower.collectionName).doc(id).update(tower.toFirestore());
    
    // Respond with a success message after the update
    res.status(200).json({ message: 'Tower updated successfully' });
  } catch (error) {
    console.error('Error in Update Tower:', error); // Log any error that occurs
    res.status(500).json({ error: error.message }); // Return the error message
  }
};

// Controller for deleting a tower
// exports.deleteTower = async (req, res) => {
//   try {
//     // Delete the tower document from Firestore using the provided ID
//     await db.collection(Tower.collectionName).doc(req.params.id).delete();
//     // Respond with a success message after deletion
//     res.status(200).json({ message: 'Tower deleted successfully' });
//   } catch (error) {
//     console.error('Error in Delete Tower:', error); // Log any error that occurs
//     res.status(500).json({ error: error.message }); // Return the error message
//   }
// };
