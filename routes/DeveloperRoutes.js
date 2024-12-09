const express = require('express');
const router = express.Router();

const developerController = require('../controllers/DeveloperController');

const { isAuthenticated } = require('../controllers/LoginController');

const { upload, uploadFields } = require('../middleware/UploadMiddleware');

// Route to create a new developer and handles file uploads
router.post('/', isAuthenticated, upload.fields(uploadFields), developerController.createDeveloper);

// Route to retrieve all developers
router.get('/', developerController.getAllDevelopers);

// Route to retrieve a specific developer by their ID
router.get('/:id', isAuthenticated, developerController.getDeveloperById);

// Route to update an existing developer by their ID and handles file uploads
router.put('/:id', isAuthenticated, upload.fields(uploadFields), developerController.updateDeveloper);

// Route to delete a developer by their ID
// router.delete('/:id', isAuthenticated, developerController.deleteDeveloper);

module.exports = router;



// const { verifyUserForAdminRoutes } = require('../shared/crossSiteAuth');

// router.get('/public', 
//     (req, res, next) => {
//         console.log('Cookies:', req.cookies);
//         console.log('Authorization Header:', req.headers.authorization);
//         next();
//     }, 
//     verifyUserForAdminRoutes, 
//     developerController.getAllDevelopers
// );