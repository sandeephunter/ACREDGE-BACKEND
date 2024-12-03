const Series = require('../models/SeriesModel');
const { db } = require('../config/firebase');
const { uploadMultipleFiles, deleteMultipleFiles, deleteFromFirebase } = require('../utils/FilesUpload');

// Controller for creating a new series
exports.createSeries = async (req, res) => {
  try {
    const seriesData = req.body; // Data sent from client about the series
    const files = req.files; // Files uploaded with the request

    // Log series data and files received
    // console.log("Received series data:", seriesData);
    // console.log("Files received:", files);

    // Create a new document in the Series collection to get an auto-generated ID
    const docRef = await db.collection(Series.collectionName).add({
      createdBy: req.user.email,
      createdOn: new Date(),
    });

    // Upload inside images
    if (files.insideImagesUrls && Array.isArray(files.insideImagesUrls)) {
      try {
        // console.log("Uploading inside images...");
        seriesData.insideImagesUrls = await uploadMultipleFiles(files.insideImagesUrls, 'insideImagesUrls', docRef.id);
        // console.log("Uploaded inside images URLs:", seriesData.insideImagesUrls);
      } catch (error) {
        console.error('Error uploading inside images:', error);
        await docRef.delete();
        return res.status(400).json({ error: 'Error uploading inside images. ' + error.message });
      }
    }

    // Upload inside videos
    if (files.insideVideosUrls && Array.isArray(files.insideVideosUrls)) {
      try {
        // console.log("Uploading inside videos...");
        seriesData.insideVideosUrls = await uploadMultipleFiles(files.insideVideosUrls, 'insideVideosUrls', docRef.id);
        // console.log("Uploaded inside videos URLs:", seriesData.insideVideosUrls);
      } catch (error) {
        console.error('Error uploading inside videos:', error);
        if (seriesData.insideImagesUrls) await deleteMultipleFiles(seriesData.insideImagesUrls);
        await docRef.delete();
        return res.status(400).json({ error: 'Error uploading inside videos. ' + error.message });
      }
    }

    // Upload layout plan
    if (files.layoutPlanUrl) {
      try {
        // console.log("Uploading layout plan...");
        const [layoutPlanUrl] = await uploadMultipleFiles(files.layoutPlanUrl, 'layoutPlanUrl', docRef.id);
        seriesData.layoutPlanUrl = layoutPlanUrl;
        // console.log("Layout plan URL:", layoutPlanUrl);
      } catch (error) {
        console.error('Error uploading layout plan:', error);
        if (seriesData.insideImagesUrls) await deleteMultipleFiles(seriesData.insideImagesUrls);
        if (seriesData.insideVideosUrls) await deleteMultipleFiles(seriesData.insideVideosUrls);
        await docRef.delete();
        return res.status(400).json({ error: 'Error uploading layout plan. ' + error.message });
      }
    }

    // Validate data
    const errors = Series.validate(seriesData);
    // console.log("Validation errors:", errors);
    if (errors.length > 0) {
      if (seriesData.insideImagesUrls) await deleteMultipleFiles(seriesData.insideImagesUrls);
      if (seriesData.insideVideosUrls) await deleteMultipleFiles(seriesData.insideVideosUrls);
      if (seriesData.layoutPlanUrl) await deleteFromFirebase(seriesData.layoutPlanUrl);
      await docRef.delete();
      return res.status(400).json({ errors });
    }

    seriesData.createdBy = req.user.email;
    seriesData.createdOn = new Date();

    // Save series data to Firestore document
    const series = new Series(seriesData);
    await docRef.update(series.toFirestore());

    // console.log("Series created successfully with ID:", docRef.id);
    res.status(201).json({ id: docRef.id, ...series.toFirestore() });
  } catch (error) {
    console.error('Error in Create Series:', error);
    res.status(500).json({ error: error.message });
  }
};

// Controller for fetching all series
exports.getAllSeries = async (req, res) => {
  try {
    // Retrieve all series from the Series collection
    const snapshot = await db.collection(Series.collectionName).get();
    const seriesList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    res.status(200).json(seriesList);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Controller for fetching a specific series by its ID
exports.getSeriesById = async (req, res) => {
  try {
    // Retrieve the series document based on ID
    const docRef = await db.collection(Series.collectionName).doc(req.params.id).get();
    if (!docRef.exists) {
      return res.status(404).json({ message: 'Series not found' });
    }
    res.status(200).json({ id: docRef.id, ...docRef.data() });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Controller for updating a series
exports.updateSeries = async (req, res) => {
  try {
    const { id } = req.params;
    const updatedData = req.body;
    const files = req.files;

    // console.log("Updating series with ID:", id);
    // console.log("Received update data:", updatedData);
    // console.log("Files received:", files);

    const seriesDoc = await db.collection(Series.collectionName).doc(id).get();
    if (!seriesDoc.exists) {
      return res.status(404).json({ message: 'Series not found' });
    }
    const existingData = seriesDoc.data();

    if (files) {
      if (files.insideImagesUrls) {
        if (req.body.deleteInsideImages) {
          try {
            const deleteImages = JSON.parse(req.body.deleteInsideImages);
            // console.log("Deleting inside images:", deleteImages);
            await deleteMultipleFiles(deleteImages);
            updatedData.insideImagesUrls = (existingData.insideImagesUrls || []).filter(url => !deleteImages.includes(url));
          } catch (error) {
            console.error('Error deleting inside images:', error);
            return res.status(400).json({ error: 'Error deleting inside images. ' + error.message });
          }
        }

        try {
          const newImages = await uploadMultipleFiles(files.insideImagesUrls, 'insideImagesUrls', id);
          updatedData.insideImagesUrls = [...(updatedData.insideImagesUrls || existingData.insideImagesUrls || []), ...newImages];
          // console.log("New inside images uploaded:", newImages);
        } catch (error) {
          console.error('Error uploading new inside images:', error);
          return res.status(400).json({ error: 'Error uploading new inside images. ' + error.message });
        }
      }

      if (files.insideVideosUrls) {
        if (req.body.deleteInsideVideos) {
          try {
            const deleteVideos = JSON.parse(req.body.deleteInsideVideos);
            // console.log("Deleting inside videos:", deleteVideos);
            await deleteMultipleFiles(deleteVideos);
            updatedData.insideVideosUrls = (existingData.insideVideosUrls || []).filter(url => !deleteVideos.includes(url));
          } catch (error) {
            console.error('Error deleting inside videos:', error);
            return res.status(400).json({ error: 'Error deleting inside videos. ' + error.message });
          }
        }

        try {
          const newVideos = await uploadMultipleFiles(files.insideVideosUrls, 'insideVideosUrls', id);
          updatedData.insideVideosUrls = [...(updatedData.insideVideosUrls || existingData.insideVideosUrls || []), ...newVideos];
          // console.log("New inside videos uploaded:", newVideos);
        } catch (error) {
          console.error('Error uploading new inside videos:', error);
          return res.status(400).json({ error: 'Error uploading new inside videos. ' + error.message });
        }
      }

      if (files.layoutPlanUrl) {
        try {
          if (existingData.layoutPlanUrl) {
            // console.log("Deleting existing layout plan URL:", existingData.layoutPlanUrl);
            await deleteFromFirebase(existingData.layoutPlanUrl);
          }
          const [layoutPlanUrl] = await uploadMultipleFiles(files.layoutPlanUrl, 'layoutPlanUrl', id);
          updatedData.layoutPlanUrl = layoutPlanUrl;
          // console.log("New layout plan URL uploaded:", layoutPlanUrl);
        } catch (error) {
          console.error('Error handling layout plan:', error);
          return res.status(400).json({ error: 'Error handling layout plan. ' + error.message });
        }
      }
    }

    const errors = Series.validate({ ...existingData, ...updatedData });
    // console.log("Validation errors:", errors);
    if (errors.length > 0) {
      return res.status(400).json({ errors });
    }

    updatedData.createdBy = existingData.createdBy;
    updatedData.createdOn = existingData.createdOn;
    updatedData.updatedBy = req.user.email;
    updatedData.updatedOn = new Date();

    // console.log("Final data to update:", updatedData);
    await db.collection(Series.collectionName).doc(id).update(updatedData);

    // console.log("Series updated successfully with ID:", id);
    res.status(200).json({ id, ...updatedData });
  } catch (error) {
    console.error('Error updating series:', error);
    console.error('Stack trace:', error.stack);
    res.status(500).json({ error: error.message });
  }
};

// Controller for deleting a series by ID
// exports.deleteSeries = async (req, res) => {
//   try {
//     const { id } = req.params;

//     // Fetch the document to access any files for deletion
//     const docRef = db.collection(Series.collectionName).doc(id);
//     const doc = await docRef.get();

//     if (!doc.exists) {
//       return res.status(404).json({ message: 'Series not found' });
//     }

//     const data = doc.data();

//     // Delete any associated files (images, videos, layout plan) from storage
//     if (data.insideImagesUrls) await deleteMultipleFiles(data.insideImagesUrls);
//     if (data.insideVideosUrls) await deleteMultipleFiles(data.insideVideosUrls);
//     if (data.layoutPlanUrl) await deleteFromFirebase(data.layoutPlanUrl);

//     // Delete the Firestore document
//     await docRef.delete();

//     res.status(200).json({ message: 'Series deleted successfully' });
//   } catch (error) {
//     console.error('Error deleting series:', error);
//     res.status(500).json({ error: error.message });
//   }
// };
