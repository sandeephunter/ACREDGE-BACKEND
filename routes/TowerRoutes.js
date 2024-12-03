const express = require('express');
const router = express.Router();

const towerController = require('../controllers/TowerController');

const { isAuthenticated } = require('../controllers/LoginController');

// Route to create a new tower
// This route is protected and requires the user to be authenticated
router.post('/', isAuthenticated, towerController.createTower);

// Route to retrieve all towers
// This route is also protected, ensuring that only authenticated users can access the list of towers
router.get('/', isAuthenticated, towerController.getAllTowers);

// Route to retrieve a specific tower by its ID
// This allows authenticated users to access detailed information about a particular tower
router.get('/:id', isAuthenticated, towerController.getTowerById);

// Route to update an existing tower by its ID
// Users must be authenticated to make updates to ensure data integrity and security
router.put('/:id', isAuthenticated, towerController.updateTower);

// Route to delete a tower by its ID
// This route is protected, preventing unauthorized users from deleting a tower
// router.delete('/:id', isAuthenticated, towerController.deleteTower);

module.exports = router;


// const { verifyUserForAdminRoutes } = require('../shared/crossSiteAuth');
// router.get('/public',verifyUserForAdminRoutes, towerController.getAllTowers);
