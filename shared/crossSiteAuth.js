// const jwt = require('jsonwebtoken');

// exports.verifyUserForAdminRoutes = (req, res, next) => {
//   console.log('Cookies received:', req.cookies);
//   console.log('Auth header:', req.headers.authorization);

//   // Get token from cookie or Authorization header
//   let token = req.cookies.token;
  
//   if (!token && req.headers.authorization) {
//     const authHeader = req.headers.authorization;
//     token = authHeader.startsWith('Bearer ') ? authHeader.substring(7) : authHeader;
//   }

//   if (!token) {
//     return res.status(401).json({ message: "No token provided." });
//   }

//   try {
//     const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
//     // Only allow USER tokens to access admin routes
//     if (decoded.role !== 'USER') {
//       return res.status(403).json({ message: "Access denied." });
//     }

//     req.user = decoded;
//     next();
//   } catch (error) {
//     return res.status(401).json({ message: "Invalid token." });
//   }
// };

// exports.verifyAdminForUserRoutes = (req, res, next) => {
//   console.log('Cookies received:', req.cookies);
//   console.log('Auth header:', req.headers.authorization);

//   // Get token from cookie or Authorization header
//   let token = req.cookies.token;
  
//   if (!token && req.headers.authorization) {
//     const authHeader = req.headers.authorization;
//     token = authHeader.startsWith('Bearer ') ? authHeader.substring(7) : authHeader;
//   }

//   if (!token) {
//     return res.status(401).json({ message: "No token provided." });
//   }

//   try {
//     const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
//     // Only allow ADMIN tokens to access user routes
//     if (decoded.role !== 'ADMIN') {
//       return res.status(403).json({ message: "Access denied." });
//     }

//     req.user = decoded;
//     next();
//   } catch (error) {
//     return res.status(401).json({ message: "Invalid token." });
//   }
// };