const { admin } = require('../config/firebase');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');
const NodeCache = require('node-cache');

// Configure a cache for storing tokens temporarily
const tokenCache = new NodeCache({ stdTTL: 300 });  // Tokens cached for 5 minutes

// Generate a 6-digit OTP
const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// Validate if the email ends with "@acredge.in"
const validateEmail = (email) => {
  const regex = /@acredge\.in$/;
  return regex.test(email);
};

// Send OTP to the provided email using nodemailer
const sendEmail = async (to, otp) => {
  // Configure transporter for Gmail
  let transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_APP_PASSWORD
    }
  });

  // Send OTP email with both plain text and HTML formats
  let info = await transporter.sendMail({
    from: '"Admin Login" <sandeephunter2002@gmail.com>',
    to: to,
    subject: "Your OTP for Admin Login",
    text: `Your OTP is: ${otp}`,
    html: `<b>Your OTP is: ${otp}</b>`
  });

  // console.log("Message sent: %s", info.messageId);
};

// Handle email verification and OTP sending
exports.verifyEmail = async (req, res) => {
  try {
    const { email } = req.body;

    // Check if email meets validation criteria
    if (!validateEmail(email)) {
      return res.status(400).json({ message: "Email doesn't match the required format." });
    }

    // Generate OTP and set expiration (5 minutes)
    const otp = generateOTP();
    const expirationTime = Date.now() + 300000;

    // Store OTP in Firestore
    await admin.firestore().collection('otps').doc(email).set({
      otp,
      expirationTime,
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    });

    // Send OTP to the email address
    await sendEmail(email, otp);

    res.status(200).json({ message: "Verified successfully. OTP sent to email." });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Login error occurred." });
  }
};

// Verify OTP and issue JWT token
exports.verifyOTP = async (req, res) => {
  try {
    const { email, otp, rememberMe } = req.body;

    // Retrieve OTP document for the email
    const otpDoc = await admin.firestore().collection('otps').doc(email).get();
    if (!otpDoc.exists || otpDoc.data().otp !== otp) {
      return res.status(400).json({ message: "Invalid or expired OTP." });
    }

    // OTP is valid, delete it from Firestore
    await admin.firestore().collection('otps').doc(email).delete();

    // Set token expiration based on 'rememberMe' flag
    const expiresIn = rememberMe ? '7d' : '24h';
    const token = jwt.sign({ email }, process.env.JWT_SECRET, { expiresIn });

    // Set token expiration date for Firestore storage
    const expirationDate = new Date(Date.now() + (rememberMe ? 7 * 24 * 60 * 60 * 1000 : 24 * 60 * 60 * 1000));
    await admin.firestore().collection('tokens').doc(email).set({
      token,
      expiresAt: admin.firestore.Timestamp.fromDate(expirationDate)
    });

    // Send JWT as a secure cookie to the client
    res.cookie('token', token, {
      httpOnly: true,
      secure: true,
      sameSite: 'none',
      maxAge: rememberMe ? 7 * 24 * 60 * 60 * 1000 : 24 * 60 * 60 * 1000,
    });

    res.status(200).json({ message: "Logged in successfully" });
  } catch (error) {
    console.error('Error in verifyOTP:', error);
    res.status(500).json({ message: "OTP error occurred." });
  }
};

// Middleware to check authentication status via token
exports.isAuthenticated = async (req, res, next) => {
  try {
    // Extract token from cookies or authorization header
    const token = req.cookies.token || req.headers.authorization?.split(' ')[1];

    if (!token) {
      return res.status(401).json({ message: "No token provided." });
    }

    // Verify token with JWT and extract email
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (error) {
      return res.status(401).json({ message: "Invalid token." });
    }

    // Check cache for token to improve performance
    const cachedToken = tokenCache.get(decoded.email);
    if (cachedToken === token) {
      req.user = { email: decoded.email };
      return next();
    }

    // Check Firestore if not in cache
    const tokenDoc = await admin.firestore().collection('tokens').doc(decoded.email).get();
    if (!tokenDoc.exists || tokenDoc.data().token !== token || tokenDoc.data().expiresAt.toDate() < new Date()) {
      return res.status(401).json({ message: "Invalid or expired token." });
    }

    // Cache valid token for subsequent requests
    tokenCache.set(decoded.email, token);

    req.user = { email: decoded.email };
    next();
  } catch (error) {
    console.error('Error in isAuthenticated:', error);
    res.status(401).json({ message: "Authentication failed." });
  }
};

// Log out the user and clear token
exports.logout = async (req, res) => {
  try {
    const token = req.cookies.token;

    if (!token) {
      return res.status(401).json({ message: "Already Logged Out, Please login again to continue." });
    }

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      await admin.firestore().collection('tokens').doc(decoded.email).delete();
      tokenCache.del(decoded.email);
    } catch (jwtError) {
      console.error('JWT verification failed during logout:', jwtError);
    }

    // Clear the cookie from the response
    res.clearCookie('token', {
      httpOnly: true,
      secure: true,
      sameSite: 'none',
    });

    res.status(200).json({ message: "Logged out successfully" });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({ message: "Logout error occurred." });
  }
};

// Check if user is authenticated and return success response
exports.checkAuth = async (req, res) => {
  res.status(200).json({ message: "Authenticated", user: req.user });
};