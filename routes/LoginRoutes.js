const express = require('express');
const router = express.Router();

const authController = require('../controllers/LoginController');

const { verifyToken } = require('../middleware/LoginMiddleware');

// Route to verify the user's email address
router.post('/verify-email', authController.verifyEmail);

// Route to verify the One-Time Password (OTP) sent to the user
router.post('/verify-otp', authController.verifyOTP);

// Route to log out the user requires a valid token for authentication
router.post('/logout', verifyToken, authController.logout);

// Route to check if the user is authenticated requires a valid token; it responds with user information if authenticated
router.get('/check-auth', verifyToken, (req, res) => {
  // Send a success response indicating that the user is authenticated
  res.status(200).json({ message: "Authenticated", user: req.user });
});

module.exports = router;
