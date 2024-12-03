const { db } = require('../config/firebase');
const Developer = require('../models/DeveloperModel');
const Project = require('../models/ProjectModel');
const Series = require('../models/SeriesModel');
const Tower = require('../models/TowerModel');

// Controller function to get statistics for Developers
exports.getDeveloperStats = async (req, res) => {
  try {
    // Fetch all documents in the Developer collection
    const snapshot = await db.collection(Developer.collectionName).get();
    const developers = snapshot.docs.map(doc => doc.data());  // Map documents to data array
    
    // Calculate stats for developers: total, active, and disabled
    const stats = {
      total: developers.length,
      active: developers.filter(dev => dev.status === 'Active').length,
      disabled: developers.filter(dev => dev.status === 'Disable').length
    };
    
    // Send stats as a JSON response
    res.status(200).json(stats);
  } catch (error) {
    // Log error and return a 500 status code with error message
    console.error('Error in Get Developer Stats:', error);
    res.status(500).json({ error: error.message });
  }
};

// Controller function to get statistics for Projects
exports.getProjectStats = async (req, res) => {
  try {
    const snapshot = await db.collection(Project.collectionName).get();
    const projects = snapshot.docs.map(doc => doc.data());
    
    const stats = {
      total: projects.length,
      active: projects.filter(proj => proj.status === 'Active').length,
      disabled: projects.filter(proj => proj.status === 'Disable').length
    };
    
    res.status(200).json(stats);
  } catch (error) {
    console.error('Error in Get Project Stats:', error);
    res.status(500).json({ error: error.message });
  }
};

// Controller function to get statistics for Series
exports.getSeriesStats = async (req, res) => {
  try {
    const snapshot = await db.collection(Series.collectionName).get();
    const series = snapshot.docs.map(doc => doc.data());
    
    const stats = {
      total: series.length,
      active: series.filter(s => s.status === 'Active').length,
      disabled: series.filter(s => s.status === 'Disable').length
    };
    
    res.status(200).json(stats);
  } catch (error) {
    console.error('Error in Get Series Stats:', error);
    res.status(500).json({ error: error.message });
  }
};

// Controller function to get statistics for Towers
exports.getTowerStats = async (req, res) => {
  try {
    const snapshot = await db.collection(Tower.collectionName).get();
    const towers = snapshot.docs.map(doc => doc.data());
    
    const stats = {
      total: towers.length,
      active: towers.filter(tower => tower.status === 'Active').length,
      disabled: towers.filter(tower => tower.status === 'Disable').length
    };
    
    res.status(200).json(stats);
  } catch (error) {
    console.error('Error in Get Tower Stats:', error);
    res.status(500).json({ error: error.message });
  }
};

// Controller function to get statistics for all collections in a single response
exports.getAllStats = async (req, res) => {
  try {
    // Fetch all collections in parallel using Promise.all for improved efficiency
    const [
      developersSnapshot,
      projectsSnapshot,
      seriesSnapshot,
      towersSnapshot
    ] = await Promise.all([
      db.collection(Developer.collectionName).get(),
      db.collection(Project.collectionName).get(),
      db.collection(Series.collectionName).get(),
      db.collection(Tower.collectionName).get()
    ]);

    // Extract data from snapshots for each collection
    const developers = developersSnapshot.docs.map(doc => doc.data());
    const projects = projectsSnapshot.docs.map(doc => doc.data());
    const series = seriesSnapshot.docs.map(doc => doc.data());
    const towers = towersSnapshot.docs.map(doc => doc.data());

    // Compile all stats into a single response object for easier aggregation
    const stats = {
      developers: {
        total: developers.length,
        active: developers.filter(dev => dev.status === 'Active').length,
        disabled: developers.filter(dev => dev.status === 'Disable').length
      },
      projects: {
        total: projects.length,
        active: projects.filter(proj => proj.status === 'Active').length,
        disabled: projects.filter(proj => proj.status === 'Disable').length
      },
      series: {
        total: series.length,
        active: series.filter(s => s.status === 'Active').length,
        disabled: series.filter(s => s.status === 'Disable').length
      },
      towers: {
        total: towers.length,
        active: towers.filter(tower => tower.status === 'Active').length,
        disabled: towers.filter(tower => tower.status === 'Disable').length
      }
    };

    // Respond with the compiled stats object
    res.status(200).json(stats);
  } catch (error) {
    // Catch any errors during data retrieval and respond with a 500 status
    console.error('Error in Get All Stats:', error);
    res.status(500).json({ error: error.message });
  }
};
