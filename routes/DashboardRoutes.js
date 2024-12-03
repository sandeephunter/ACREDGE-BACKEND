const express = require('express');
const router = express.Router();

const dashboardController = require('../controllers/DashboardController');

const { isAuthenticated } = require('../controllers/LoginController');

// Route to get statistics for developers
router.get('/developers/stats', isAuthenticated, dashboardController.getDeveloperStats);

// Route to get statistics for projects
router.get('/projects/stats', isAuthenticated, dashboardController.getProjectStats);

// Route to get statistics for series
router.get('/series/stats', isAuthenticated, dashboardController.getSeriesStats);

// Route to get statistics for towers
router.get('/towers/stats', isAuthenticated, dashboardController.getTowerStats);

// Combined stats route to retrieve all statistics in one request
router.get('/stats', isAuthenticated, dashboardController.getAllStats);

module.exports = router;