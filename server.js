require("dotenv").config();

const express = require("express"); // Framework for building web applications
const cors = require("cors"); // Middleware for enabling CORS (Cross-Origin Resource Sharing)
const bodyParser = require("body-parser"); // Middleware for parsing request bodies
const cookieParser = require("cookie-parser"); // Middleware for parsing cookies

// Import route handlers for different API endpoints
const LoginRoutes = require("./routes/LoginRoutes"); // Handles user authentication
const DeveloperRoutes = require("./routes/DeveloperRoutes"); // Handles developer-related operations
const ProjectRoutes = require("./routes/ProjectRoutes"); // Manages project-related functionalities
const TowerRoutes = require("./routes/TowerRoutes"); // Manages tower-related operations
const SeriesRoutes = require("./routes/SeriesRoutes"); // Manages series-related functionalities
const DashboardRoutes = require("./routes/DashboardRoutes"); // Handles dashboard functionalities
const { handleUploadError } = require('./middleware/UploadMiddleware'); // Middleware for handling upload errors
const amenityRoutes = require('./routes/AmenityRoutes');

// Create an instance of an Express application
const app = express();

// Use cookieParser middleware to parse cookies attached to the client requests
app.use(cookieParser());

// Use bodyParser middleware to parse incoming request bodies as JSON
app.use(bodyParser.json());

// Configure CORS settings
//For Production
app.use(
  cors({
    origin: true,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  })
);

// Set up API routes for different functionalities
app.use("/api/auth", LoginRoutes); // Authentication routes
app.use("/api/developers", DeveloperRoutes); // Developer-related routes
app.use("/api/projects", ProjectRoutes); // Project-related routes
app.use("/api/towers", TowerRoutes); // Tower-related routes
app.use("/api/series", SeriesRoutes); // Series-related routes
app.use('/api/dashboard', DashboardRoutes); // Dashboard-related routes
app.use('/api/amenities', amenityRoutes);

// This will catch any upload errors occurring in the preceding routes
app.use(handleUploadError);

//Default route
app.get('/', (req, res) => {
  res.send('Acredge User Backend');
});

// Define the port to run the server, defaulting to 3000 if not specified in environment variables
const PORT = process.env.PORT || 3000;

// Start the Express server and listen on the specified port
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`); // Log the port number for reference
});