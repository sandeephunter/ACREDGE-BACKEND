const express = require('express');
const router = express.Router();

const seriesController = require('../controllers/SeriesController');

const { isAuthenticated } = require('../controllers/LoginController');

const { upload, uploadFields } = require('../middleware/UploadMiddleware');

// Route to create a new series
// This route is protected and requires the user to be authenticated
// It also supports file uploads through the upload middleware, allowing related files to be included
router.post('/', isAuthenticated, upload.fields(uploadFields), seriesController.createSeries);

// Route to retrieve all series
// This route is also protected and requires the user to be authenticated to access the series list
router.get('/', isAuthenticated, seriesController.getAllSeries);

// Route to retrieve a specific series by its ID
// This route ensures that only authenticated users can access the details of a particular series
router.get('/:id', isAuthenticated, seriesController.getSeriesById);

// Route to update an existing series by its ID
// This route is protected and requires user authentication
// It supports file uploads, allowing users to update any associated files for the series
router.put('/:id', isAuthenticated, upload.fields(uploadFields), seriesController.updateSeries);

// Route to delete a series by its ID
// This route requires authentication to prevent unauthorized users from deleting a series
// router.delete('/:id', isAuthenticated, seriesController.deleteSeries);

module.exports = router;


// const { verifyUserForAdminRoutes } = require('../shared/crossSiteAuth');
// router.get('/public',verifyUserForAdminRoutes, seriesController.getAllSeries);
