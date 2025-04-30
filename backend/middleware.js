// middleware.js - Authentication and security middleware
const jwt = require('jsonwebtoken');
const { Session, User } = require('./models');
const config = require('./config');

// Authentication middleware
exports.auth = async (req, res, next) => {
  // Get token from header
  const token = req.header('x-auth-token');

  // Check if no token
  if (!token) {
    return res.status(401).json({ msg: 'No token, authorization denied' });
  }

  try {
    // Verify token
    const decoded = jwt.verify(token, config.JWT_SECRET);
    
    // Add user from payload to request
    req.user = decoded.user;

    // Check if session tracking is enabled
    if (config.SESSION_TRACKING) {
      // Find valid session for this token
      const session = await Session.findOne({ 
        token, 
        userId: req.user.id,
        isValid: true,
        expires: { $gt: new Date() }
      });

      if (!session) {
        return res.status(401).json({ msg: 'Session expired or invalid' });
      }

      // Update last active time
      session.lastActive = Date.now();
      await session.save();
    }

    next();
  } catch (err) {
    console.error('Auth middleware error:', err.message);
    res.status(401).json({ msg: 'Token is not valid' });
  }
};

// Admin check middleware
exports.admin = (req, res, next) => {
  if (!req.user.isAdmin) {
    return res.status(403).json({ msg: 'Access denied. Admin privileges required.' });
  }
  next();
};

// Device verification middleware
exports.deviceCheck = async (req, res, next) => {
  // Skip if feature is disabled
  if (!config.SESSION_TRACKING) {
    return next();
  }

  try {
    const userId = req.user.id;
    const currentDevice = req.headers['user-agent'] || 'Unknown';
    
    // Get user's stored device info
    const user = await User.findById(userId);
    
    if (!user) {
      return res.status(400).json({ msg: 'User not found' });
    }
    
    // If this is first login, save device info
    if (!user.deviceInfo) {
      user.deviceInfo = currentDevice;
      await user.save();
    } 
    // Or if device differs significantly from stored device, log warning
    // This is a simple implementation - a production app would use a more sophisticated device fingerprinting
    else if (user.deviceInfo !== currentDevice) {
      console.warn(`User ${userId} logged in from new device: ${currentDevice}`);
      
      // For additional security, you could implement:
      // - Email notifications of new device login
      // - Require additional verification
      // - Track list of known devices
    }
    
    next();
  } catch (err) {
    console.error('Device verification error:', err.message);
    // Continue anyway since this is a secondary security feature
    next();
  }
};

// Rate limiting middleware for login attempts
exports.loginLimiter = async (req, res, next) => {
  try {
    const email = req.body.email;
    
    // Skip if no email provided or feature disabled
    if (!email || !config.MAX_LOGIN_ATTEMPTS) {
      return next();
    }
    
    // Find user by email
    const user = await User.findOne({ email });
    
    // If user not found, continue to regular auth process
    if (!user) {
      return next();
    }
    
    // If user has attempted too many logins
    if (user.loginAttempts >= config.MAX_LOGIN_ATTEMPTS && 
        user.lockUntil && user.lockUntil > Date.now()) {
      return res.status(429).json({
        msg: 'Too many login attempts. Please try again later.',
        lockUntil: user.lockUntil
      });
    }
    
    // Reset lock if it's expired
    if (user.lockUntil && user.lockUntil < Date.now()) {
      user.loginAttempts = 0;
      user.lockUntil = undefined;
      await user.save();
    }
    
    // Attach user to request for later use
    req.userForLogin = user;
    next();
  } catch (err) {
    console.error('Login limiter error:', err.message);
    // Continue anyway since this is a secondary security feature
    next();
  }
};

// Record failed login attempt
exports.recordFailedLogin = async (req, res, next) => {
  try {
    const user = req.userForLogin;
    
    if (!user) {
      return next();
    }
    
    // Increment login attempts
    user.loginAttempts = (user.loginAttempts || 0) + 1;
    
    // Lock account if max attempts reached
    if (user.loginAttempts >= config.MAX_LOGIN_ATTEMPTS) {
      user.lockUntil = Date.now() + config.LOCKOUT_TIME;
    }
    
    await user.save();
    next();
  } catch (err) {
    console.error('Failed login recording error:', err.message);
    next();
  }
};

// Reset login attempts on successful login
exports.resetLoginAttempts = async (userId) => {
  try {
    await User.findByIdAndUpdate(userId, {
      $set: { loginAttempts: 0, lockUntil: undefined }
    });
  } catch (err) {
    console.error('Reset login attempts error:', err.message);
  }
};