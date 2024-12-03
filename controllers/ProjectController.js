const Project = require('../models/ProjectModel');
const { db } = require('../config/firebase');
const { uploadMultipleFiles, deleteMultipleFiles, deleteFromFirebase } = require('../utils/FilesUpload');

// Function to create a new project with associated files
exports.createProject = async (req, res) => {
  try {
    const projectData = req.body;  // Get project data from the request body
    const files = req.files;       // Get uploaded files

    // console.log("Starting to create project...");
    // console.log("Received project data:", projectData);
    // console.log("Files received:", files);

    // Create a Firestore document to store the project and get its unique ID
    const docRef = await db.collection(Project.collectionName).add({
      createdBy: req.user.email,
      createdOn: new Date(),
    });
    // console.log("Firestore document created with ID:", docRef.id);

    if (files.images && Array.isArray(files.images)) {
      try {
        // console.log("Uploading images...");
        projectData.images = await uploadMultipleFiles(files.images, 'images', docRef.id);
        // console.log("Uploaded images URLs:", projectData.images);
      } catch (error) {
        console.error('Error uploading images:', error);
        await docRef.delete();
        return res.status(400).json({ error: 'Error uploading images. ' + error.message });
      }
    }

    if (files.videos && Array.isArray(files.videos)) {
      try {
        // console.log("Uploading videos...");
        projectData.videos = await uploadMultipleFiles(files.videos, 'videos', docRef.id);
        // console.log("Uploaded videos URLs:", projectData.videos);
      } catch (error) {
        console.error('Error uploading videos:', error);
        if (projectData.images) await deleteMultipleFiles(projectData.images);
        await docRef.delete();
        return res.status(400).json({ error: 'Error uploading videos. ' + error.message });
      }
    }

    if (files.brochureUrl) {
      try {
        // console.log("Uploading brochure...");
        const [brochureUrl] = await uploadMultipleFiles(files.brochureUrl, 'brochureUrl', docRef.id);
        projectData.brochureUrl = brochureUrl;
        // console.log("Brochure URL:", brochureUrl);
      } catch (error) {
        console.error('Error uploading brochure:', error);
        if (projectData.images) await deleteMultipleFiles(projectData.images);
        if (projectData.videos) await deleteMultipleFiles(projectData.videos);
        await docRef.delete();
        return res.status(400).json({ error: 'Error uploading brochure. ' + error.message });
      }
    }

    if (files.reraCertificateUrl) {
      try {
        // console.log("Uploading brochure...");
        const [reraCertificateUrl] = await uploadMultipleFiles(files.reraCertificateUrl, 'reraCertificateUrl', docRef.id);
        projectData.reraCertificateUrl = reraCertificateUrl;
        // console.log("Brochure URL:", brochureUrl);
      } catch (error) {
        console.error('Error uploading reraCertificate:', error);
        if (projectData.images) await deleteMultipleFiles(projectData.images);
        if (projectData.videos) await deleteMultipleFiles(projectData.videos);
        await docRef.delete();
        return res.status(400).json({ error: 'Error uploading reraCertificate. ' + error.message });
      }
    }

    const errors = Project.validate(projectData);
    if (errors.length > 0) {
      // console.log("Validation errors:", errors);
      await deleteMultipleFiles(projectData.images);
      await deleteMultipleFiles(projectData.videos);
      if (projectData.brochureUrl) await deleteFromFirebase(projectData.brochureUrl);
      await docRef.delete();
      return res.status(400).json({ errors });
    }

    projectData.createdBy = req.user.email;
    projectData.createdOn = new Date();

    const project = new Project(projectData);
    await docRef.update(project.toFirestore());
    // console.log("Project created successfully with ID:", docRef.id);

    res.status(201).json({ id: docRef.id, ...project.toFirestore() });
  } catch (error) {
    console.error('Error in Create Project:', error);
    res.status(500).json({ error: error.message });
  }
};

// Function to retrieve all projects from Firestore
exports.getAllProjects = async (req, res) => {
  try {
    const snapshot = await db.collection(Project.collectionName).get();
    const projects = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    res.status(200).json(projects);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Function to retrieve a specific project by its ID
exports.getProjectById = async (req, res) => {
  try {
    const docRef = await db.collection(Project.collectionName).doc(req.params.id).get();
    if (!docRef.exists) {
      return res.status(404).json({ message: 'Project not found' });
    }
    res.status(200).json({ id: docRef.id, ...docRef.data() });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Function to update an existing project with new data and/or files
exports.updateProject = async (req, res) => {
  try {
    const { id } = req.params;
    const updatedData = { ...req.body };
    const files = req.files || {};

    // Get existing project
    const projectDoc = await db.collection(Project.collectionName).doc(id).get();
    if (!projectDoc.exists) {
      return res.status(404).json({ message: 'Project not found' });
    }
    const existingData = projectDoc.data();

    // Initialize arrays if they don't exist
    updatedData.images = Array.isArray(updatedData.images) ? updatedData.images : [];
    updatedData.videos = Array.isArray(updatedData.videos) ? updatedData.videos : [];

    // Track files to be deleted
    let filesToDelete = {
      images: [],
      videos: [],
      brochure: existingData.brochureUrl || null,
      reraCertificateUrl : existingData.reraCertificateUrl || null,
    };

    // Handle file updates
    try {
      // Handle images
      if (files.images) {
        // Handle image deletions first
        if (updatedData.deleteImages) {
          const deleteImages = Array.isArray(updatedData.deleteImages)
            ? updatedData.deleteImages
            : JSON.parse(updatedData.deleteImages);
          filesToDelete.images = [...filesToDelete.images, ...deleteImages];
          updatedData.images = (existingData.images || []).filter(
            url => !deleteImages.includes(url)
          );
        } else {
          // If no deletions, maintain existing images
          updatedData.images = Array.isArray(existingData.images) ? existingData.images : [];
        }

        // Upload new images
        const newImages = await uploadMultipleFiles(
          Array.isArray(files.images) ? files.images : [files.images],
          'images',
          id
        );
        updatedData.images = [...updatedData.images, ...newImages];
      } else {
        // If no new images, maintain existing ones
        updatedData.images = Array.isArray(existingData.images) ? existingData.images : [];
      }

      // Similar handling for videos
      if (files.videos) {
        // Handle video deletions first
        if (updatedData.deleteVideos) {
          const deleteVideos = Array.isArray(updatedData.deleteVideos)
            ? updatedData.deleteVideos
            : JSON.parse(updatedData.deleteVideos);
          filesToDelete.videos = [...filesToDelete.videos, ...deleteVideos];
          updatedData.videos = (existingData.videos || []).filter(
            url => !deleteVideos.includes(url)
          );
        } else {
          // If no deletions, maintain existing videos
          updatedData.videos = Array.isArray(existingData.videos) ? existingData.videos : [];
        }

        // Upload new videos
        const newVideos = await uploadMultipleFiles(
          Array.isArray(files.videos) ? files.videos : [files.videos],
          'videos',
          id
        );
        updatedData.videos = [...updatedData.videos, ...newVideos];
      } else {
        // If no new videos, maintain existing ones
        updatedData.videos = Array.isArray(existingData.videos) ? existingData.videos : [];
      }

      // Handle brochure
      if (files.brochureUrl) {
        if (existingData.brochureUrl) {
          filesToDelete.brochure = existingData.brochureUrl;
        }
        const [brochureUrl] = await uploadMultipleFiles(
          Array.isArray(files.brochureUrl) ? files.brochureUrl : [files.brochureUrl],
          'brochureUrl',
          id
        );
        updatedData.brochureUrl = brochureUrl;
      } else {
        // If no new brochure, maintain existing one
        updatedData.brochureUrl = existingData.brochureUrl || null;
      }

      // Handle brochure
    if (files.reraCertificateUrl) {
      if (existingData.reraCertificateUrl) {
        filesToDelete.reraCertificateUrl = existingData.reraCertificateUrl;
      }
      const [reraCertificateUrl] = await uploadMultipleFiles(
        Array.isArray(files.reraCertificateUrl) ? files.reraCertificateUrl : [files.reraCertificateUrl],
        'reraCertificateUrl',
        id
      );
      updatedData.reraCertificateUrl = reraCertificateUrl;
    } else {
      // If no new brochure, maintain existing one
      updatedData.reraCertificateUrl = existingData.reraCertificateUrl || null;
    }
    
    } catch (error) {
      console.error('Error handling files:', error);
      return res.status(400).json({ error: 'Error handling files. ' + error.message });
    }

    // Ensure arrays are properly initialized before validation
    const mergedData = {
      ...existingData,
      ...updatedData,
      images: Array.isArray(updatedData.images) ? updatedData.images : (Array.isArray(existingData.images) ? existingData.images : []),
      videos: Array.isArray(updatedData.videos) ? updatedData.videos : (Array.isArray(existingData.videos) ? existingData.videos : [])
    };

    const errors = Project.validate(mergedData);
    if (errors.length > 0) {
      // If validation fails, clean up any newly uploaded files
      await cleanupFiles(filesToDelete);
      return res.status(400).json({ errors });
    }

    // Add metadata
    if (!req.user?.email) {
      return res.status(401).json({ message: "Authentication required" });
    }

    const finalData = {
      ...mergedData,
      createdBy: existingData.createdBy,
      createdOn: existingData.createdOn,
      updatedBy: req.user.email,
      updatedOn: new Date(),
    };

    // Create Project instance and update in Firestore
    const project = new Project(finalData);
    await db.collection(Project.collectionName).doc(id).update(project.toFirestore());

    // Clean up files marked for deletion
    await cleanupFiles(filesToDelete);

    res.status(200).json({
      message: 'Project updated successfully',
      data: project.toFirestore()
    });
  } catch (error) {
    console.error('Error in Update Project:', error);
    res.status(500).json({ 
      error: 'Failed to update project',
      details: error.message 
    });
  }
};

async function cleanupFiles(filesToDelete) {
  try {
    // Delete images
    if (Array.isArray(filesToDelete.images) && filesToDelete.images.length > 0) {
      await deleteMultipleFiles(filesToDelete.images);
    }

    // Delete videos
    if (Array.isArray(filesToDelete.videos) && filesToDelete.videos.length > 0) {
      await deleteMultipleFiles(filesToDelete.videos);
    }

    // Delete brochure
    if (filesToDelete.brochure) {
      await deleteFromFirebase(filesToDelete.brochure);
    }

    // Delete reraCertificateUrl
    if (filesToDelete.reraCertificateUrl) {
      await deleteFromFirebase(filesToDelete.reraCertificateUrl);
    }
  } catch (error) {
    console.error('Error cleaning up files:', error);
  }
}

// // Function to delete a project and its associated files from Firestore
// exports.deleteProject = async (req, res) => {
//   try {
//     const { id } = req.params;

//     // Retrieve the project document
//     const docRef = await db.collection(Project.collectionName).doc(id).get();
//     if (!docRef.exists) {
//       return res.status(404).json({ message: 'Project not found' });
//     }
//     const projectData = docRef.data();

//     // Delete files associated with the project if they exist
//     if (projectData.images) {
//       await deleteMultipleFiles(projectData.images);
//     }
//     if (projectData.videos) {
//       await deleteMultipleFiles(projectData.videos);
//     }
//     if (projectData.brochureUrl) {
//       await deleteFromFirebase(projectData.brochureUrl);
//     }
//     if (projectData.reraCertificateUrl) {
//       await deleteFromFirebase(projectData.reraCertificateUrl);
//     }

//     // Finally, delete the project document
//     await db.collection(Project.collectionName).doc(id).delete();

//     res.status(200).json({ message: 'Project deleted successfully' });
//   } catch (error) {
//     console.error('Error deleting project:', error);
//     res.status(500).json({ error: error.message });
//   }
// };
