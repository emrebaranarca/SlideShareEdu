// utils.js - Utility functions
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

/**
 * Generate a secure random token
 * @param {number} length - Length of the token
 * @returns {string} - Random token
 */
exports.generateToken = (length = 32) => {
  return crypto.randomBytes(length).toString('hex');
};

/**
 * Calculate the hash of a file
 * @param {string} filePath - Path to the file
 * @returns {Promise<string>} - File hash
 */
exports.calculateFileHash = (filePath) => {
  return new Promise((resolve, reject) => {
    const hash = crypto.createHash('sha256');
    const stream = fs.createReadStream(filePath);
    
    stream.on('error', err => reject(err));
    stream.on('data', chunk => hash.update(chunk));
    stream.on('end', () => resolve(hash.digest('hex')));
  });
};

/**
 * Ensure a directory exists
 * @param {string} dirPath - Directory path
 */
exports.ensureDirectoryExists = (dirPath) => {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
};

/**
 * Get count of slides in a PowerPoint file
 * Note: This is a simplified implementation. For accurate slide count,
 * you would need a library that can read PowerPoint files.
 * 
 * @param {string} filePath - Path to the PowerPoint file
 * @returns {Promise<number>} - Slide count (estimated)
 */
exports.getSlideCount = async (filePath) => {
  // This is a placeholder. In a real implementation, you would use
  // a library like officegen or similar to read PowerPoint files.
  // For now, we'll return a default value
  return Promise.resolve(10);
};

/**
 * Format date for display
 * @param {Date} date - Date to format
 * @returns {string} - Formatted date
 */
exports.formatDate = (date) => {
  return new Date(date).toLocaleString();
};

/**
 * Calculate time difference in a human-readable format
 * @param {Date} startDate - Start date
 * @param {Date} endDate - End date
 * @returns {string} - Human-readable time difference
 */
exports.calculateDuration = (startDate, endDate) => {
  const diffMs = new Date(endDate) - new Date(startDate);
  const seconds = Math.floor(diffMs / 1000);
  
  if (seconds < 60) {
    return `${seconds} seconds`;
  }
  
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) {
    return `${minutes} minutes`;
  }
  
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  return `${hours} hours, ${remainingMinutes} minutes`;
};

/**
 * Sanitize a string (remove special characters)
 * @param {string} str - String to sanitize
 * @returns {string} - Sanitized string
 */
exports.sanitizeString = (str) => {
  return str.replace(/[^a-zA-Z0-9_\-\. ]/g, '');
};

/**
 * Get a safe filename (no special characters)
 * @param {string} filename - Original filename
 * @returns {string} - Safe filename
 */
exports.getSafeFilename = (filename) => {
  const ext = path.extname(filename);
  const name = path.basename(filename, ext);
  const safeStr = exports.sanitizeString(name);
  return `${safeStr}${ext}`;
};

/**
 * Parse device info from user agent
 * @param {string} userAgent - User agent string
 * @returns {object} - Parsed device info
 */
exports.parseDeviceInfo = (userAgent) => {
  if (!userAgent) return { type: 'unknown', os: 'unknown', browser: 'unknown' };
  
  // Simple parsing - in production, use a proper user-agent parser library
  const isMobile = /mobile|android|iphone|ipod|tablet|ipad/i.test(userAgent);
  
  const os = (() => {
    if (/windows/i.test(userAgent)) return 'Windows';
    if (/mac/i.test(userAgent)) return 'MacOS';
    if (/android/i.test(userAgent)) return 'Android';
    if (/iphone|ipad|ipod/i.test(userAgent)) return 'iOS';
    if (/linux/i.test(userAgent)) return 'Linux';
    return 'Unknown';
  })();
  
  const browser = (() => {
    if (/chrome/i.test(userAgent)) return 'Chrome';
    if (/firefox/i.test(userAgent)) return 'Firefox';
    if (/safari/i.test(userAgent)) return 'Safari';
    if (/edge/i.test(userAgent)) return 'Edge';
    if (/opera/i.test(userAgent)) return 'Opera';
    if (/msie|trident/i.test(userAgent)) return 'Internet Explorer';
    return 'Unknown';
  })();
  
  return {
    type: isMobile ? 'mobile' : 'desktop',
    os,
    browser
  };
};