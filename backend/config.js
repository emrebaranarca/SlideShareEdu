// config.js - Configuration settings
require('dotenv').config();

module.exports = {
  PORT: process.env.PORT || 3000,
  MONGODB_URI: process.env.MONGODB_URI || 'mongodb://localhost:27017/powerpoint_app',
  JWT_SECRET: process.env.JWT_SECRET || 'your_jwt_secret_key_here',
  NODE_ENV: process.env.NODE_ENV || 'development',
  // Token expiration times
  JWT_ADMIN_EXPIRY: '24h',      // Admin tokens expire after 24 hours
  JWT_STUDENT_EXPIRY: '7d',     // Student tokens expire after 7 days
  // File upload settings
  MAX_FILE_SIZE: 900 * 1024 * 1024, // 50MB max file size
  ALLOWED_FILE_TYPES: [
    'application/vnd.openxmlformats-officedocument.presentationml.presentation', // .pptx
    'application/vnd.ms-powerpoint' // .ppt
  ],
  // Security settings
  SESSION_TRACKING: true,        // Track user sessions for security
  MAX_LOGIN_ATTEMPTS: 5,         // Maximum failed login attempts before temporary lockout
  LOCKOUT_TIME: 15 * 60 * 1000,  // 15 minutes lockout after max failed attempts
  // Feature flags
  ENABLE_OFFLINE_MODE: true,     // Allow students to download presentations for offline use
  ENABLE_USAGE_TRACKING: true    // Track student usage statistics
};