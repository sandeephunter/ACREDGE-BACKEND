const admin = require('firebase-admin');
require('dotenv').config();

// Set up Firebase service account credentials using environment variables
const serviceAccount = {
  type: process.env.FIREBASE_TYPE,
  project_id: process.env.FIREBASE_PROJECT_ID,
  private_key_id: process.env.FIREBASE_PRIVATE_KEY_ID,
  private_key: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
  client_email: process.env.FIREBASE_CLIENT_EMAIL,
  client_id: process.env.FIREBASE_CLIENT_ID,
  auth_uri: process.env.FIREBASE_AUTH_URI,
  token_uri: process.env.FIREBASE_TOKEN_URI,
  auth_provider_x509_cert_url: process.env.FIREBASE_AUTH_PROVIDER_X509_CERT_URL,
  client_x509_cert_url: process.env.FIREBASE_CLIENT_X509_CERT_URL,
};

// Initialize Firebase Admin SDK
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount), // Authenticate using service account
  storageBucket: process.env.FIREBASE_STORAGE_BUCKET // Set Firebase Storage Bucket
});

// Firestore and Storage references for global access
const db = admin.firestore();
const bucket = admin.storage().bucket();

// Export Firebase services for use in other parts of the application
module.exports = { admin, db, bucket };
