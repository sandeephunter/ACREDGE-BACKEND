const Developer = require('../models/DeveloperModel');
const { db } = require('../config/firebase');
const { uploadMultipleFiles, deleteFromFirebase } = require('../utils/FilesUpload');


// Function to create a new developer in the database
exports.createDeveloper = async (req, res) => {
  try {
    // console.log('Received request to create developer with data:', req.body);
    const developerData = req.body;
    const files = req.files;
    // console.log('Files received:', files);

    const docRef = await db.collection(Developer.collectionName).add({
      createdBy: req.user.email,
      createdOn: new Date(),
    });
    // console.log('Created document with ID:', docRef.id);

    if (files && files.logoUrl) {
      const [logoUrl] = await uploadMultipleFiles(files.logoUrl, 'logoUrl', docRef.id);
      developerData.logoUrl = logoUrl;
      // console.log('Uploaded logo URL:', logoUrl);
    }

    const errors = Developer.validate(developerData);
    if (errors.length > 0) {
      // console.log('Validation errors:', errors);
      if (developerData.logoUrl) {
        await deleteFromFirebase(developerData.logoUrl);
      }
      await docRef.delete();
      return res.status(400).json({ errors });
    }

    if (!req.user || !req.user.email) {
      // console.log('User not authenticated');
      await docRef.delete();
      return res.status(401).json({ message: "Authentication required" });
    }

    developerData.createdBy = req.user.email;
    developerData.createdOn = new Date();
    developerData.updatedBy = null;
    developerData.updatedOn = null;

    const developer = new Developer(developerData);
    await docRef.update(developer.toFirestore());
    // console.log('Developer created successfully with data:', developer.toFirestore());

    res.status(201).json({
      id: docRef.id,
      ...developer.toFirestore()
    });
  } catch (error) {
    console.error('Error in Create Developer:', error);
    res.status(500).json({ error: error.message });
  }
};

// Function to get all developers in the database
exports.getAllDevelopers = async (req, res) => {
  try {
    const snapshot = await db.collection(Developer.collectionName).get();
    const developers = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    res.status(200).json(developers); // Return the list of all developers
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Function to get a specific developer by ID
exports.getDeveloperById = async (req, res) => {
  try {
    const docRef = await db.collection(Developer.collectionName).doc(req.params.id).get();
    if (!docRef.exists) {
      return res.status(404).json({ message: 'Developer not found' });
    }
    res.status(200).json({ id: docRef.id, ...docRef.data() }); // Return the developer data
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Function to update developer data by ID
exports.updateDeveloper = async (req, res) => {
  try {
    const { id } = req.params;
    // console.log('Updating developer with ID:', id);
    const updatedData = req.body;
    const files = req.files;
    // console.log('Update data received:', updatedData);
    // console.log('Files received for update:', files);

    const developerDoc = await db.collection(Developer.collectionName).doc(id).get();
    if (!developerDoc.exists) {
      // console.log('Developer not found for ID:', id);
      return res.status(404).json({ message: 'Developer not found' });
    }

    const existingData = developerDoc.data();
    // console.log('Existing developer data:', existingData);

    if (files && files.logoUrl) {
      try {
        const [logoUrl] = await uploadMultipleFiles(files.logoUrl, 'logoUrl', id);
        updatedData.logoUrl = logoUrl;
        // console.log('Uploaded new logo URL:', logoUrl);

        if (existingData.logoUrl && typeof existingData.logoUrl === 'string' && existingData.logoUrl.trim() !== '') {
          try {
            await deleteFromFirebase(existingData.logoUrl);
            // console.log('Successfully deleted old logo:', existingData.logoUrl);
          } catch (deleteError) {
            console.error("Error deleting old logo:", deleteError);
          }
        }
      } catch (uploadError) {
        console.error("Error uploading new logo:", uploadError);
        return res.status(500).json({ error: "Error uploading new logo." });
      }
    }

    const errors = Developer.validate({ ...existingData, ...updatedData });
    if (errors.length > 0) {
      // console.log('Validation errors for update:', errors);
      if (updatedData.logoUrl) {
        try {
          await deleteFromFirebase(updatedData.logoUrl);
        } catch (error) {
          console.error("Error deleting invalid logo:", error);
        }
      }
      return res.status(400).json({ errors });
    }

    if (!req.user || !req.user.email) {
      // console.log('User not authenticated');
      return res.status(401).json({ message: "Authentication required" });
    }

    updatedData.createdBy = existingData.createdBy;
    updatedData.createdOn = existingData.createdOn;
    updatedData.updatedBy = req.user.email;
    updatedData.updatedOn = new Date();

    const developer = new Developer({ ...existingData, ...updatedData });
    await db.collection(Developer.collectionName).doc(id).update(developer.toFirestore());
    // console.log('Developer updated successfully with data:', developer.toFirestore());

    res.status(200).json({
      message: 'Developer updated successfully',
      data: developer.toFirestore()
    });
  } catch (error) {
    console.error('Error in Update Developer:', error);
    res.status(500).json({ error: error.message });
  }
};

// // Function to delete a developer by ID
// exports.deleteDeveloper = async (req, res) => {
//   try {
//     await db.collection(Developer.collectionName).doc(req.params.id).delete();
//     res.status(200).json({ message: 'Developer deleted successfully' });
//   } catch (error) {
//     res.status(500).json({ error: error.message });
//   }
// };
