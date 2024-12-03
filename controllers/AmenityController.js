const Amenity = require('../models/AmenityModel');
const { db } = require('../config/firebase');
const { uploadMultipleFiles, deleteFromFirebase } = require('../utils/FilesUpload');

exports.createAmenity = async (req, res) => {
  try {
    const amenityData = req.body;
    const files = req.files;

    // Check for duplicate amenity
    const isDuplicate = await Amenity.isDuplicate(amenityData.name, db);
    if (isDuplicate) {
      return res.status(400).json({ error: 'Amenity with this name already exists' });
    }

    const docRef = await db.collection(Amenity.collectionName).add({
    });

    if (files && files.logoUrl) {
      const [logoUrl] = await uploadMultipleFiles(files.logoUrl, 'amenityLogo', docRef.id);
      amenityData.logoUrl = logoUrl;
    }

    const errors = Amenity.validate(amenityData);
    if (errors.length > 0) {
      if (amenityData.logoUrl) {
        await deleteFromFirebase(amenityData.logoUrl);
      }
      await docRef.delete();
      return res.status(400).json({ errors });
    }
    
    const amenity = new Amenity(amenityData);
    await docRef.update(amenity.toFirestore());
    
    res.status(201).json({
      id: docRef.id,
      ...amenity.toFirestore()
    });
  } catch (error) {
    console.error('Error in Create Amenity:', error);
    res.status(500).json({ error: error.message });
  }
};

exports.getAllAmenities = async (req, res) => {
  try {
    const snapshot = await db.collection(Amenity.collectionName).get();
    const amenities = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    res.status(200).json(amenities);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};