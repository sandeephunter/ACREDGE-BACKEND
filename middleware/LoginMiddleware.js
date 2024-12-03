const jwt = require('jsonwebtoken');
const { isAuthenticated } = require('../controllers/LoginController');

// Middleware to verify the JWT token provided in the request headers
exports.verifyToken = (req, res, next) => {
  // Retrieve the token from the authorization header
  const token = req.headers['authorization'];

  // Check if the token is not provided
  if (!token) {
    return res.status(403).json({ message: "No token provided." }); // Respond with a forbidden status if no token is present
  }

  // Verify the token using the secret key defined in environment variables
  jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
    // If an error occurs during verification, respond with an unauthorized status
    if (err) {
      return res.status(401).json({ message: "Unauthorized!" }); // Respond with an error message if token is invalid
    }
    
    // If verification is successful, decode the token and attach the user info to the request object
    req.user = decoded; // Store the decoded user information for use in subsequent middleware or route handlers

    // Call the next middleware in the stack
    next();
  });
};

// Export the verifyToken function for use in other parts of the application
module.exports = {
  verifyToken: isAuthenticated // Export the isAuthenticated function for handling authentication
};