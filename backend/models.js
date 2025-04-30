// models.js - Database models
const mongoose = require('mongoose');

// Define User Schema
const UserSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true
  },
  password: {
    type: String,
    required: true
  },
  name: {
    type: String
  },
  isAdmin: {
    type: Boolean,
    default: false
  },
  lastLogin: {
    type: Date
  },
  active: {
    type: Boolean,
    default: true
  },
  deviceInfo: {
    type: String
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Define Presentation Schema
const PresentationSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true
  },
  fileName: {
    type: String,
    required: true
  },
  description: {
    type: String
  },
  uploadDate: {
    type: Date,
    default: Date.now
  },
  slideCount: {
    type: Number,
    default: 0
  },
  isPublished: {
    type: Boolean,
    default: true
  }
});

// Define Usage Statistics Schema
const UsageStatSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  presentationId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Presentation',
    required: true
  },
  startTime: {
    type: Date,
    default: Date.now
  },
  endTime: {
    type: Date
  },
  duration: {
    type: Number,
    default: 0 // in seconds
  },
  slidesViewed: {
    type: Number,
    default: 0
  },
  completionPercentage: {
    type: Number,
    default: 0
  },
  deviceInfo: {
    type: String
  },
  ipAddress: {
    type: String
  }
});

// Define session tracking for security
const SessionSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  token: {
    type: String,
    required: true
  },
  deviceInfo: {
    type: String
  },
  ipAddress: {
    type: String
  },
  lastActive: {
    type: Date,
    default: Date.now
  },
  expires: {
    type: Date,
    required: true
  },
  isValid: {
    type: Boolean,
    default: true
  }
});

const User = mongoose.model('User', UserSchema);
const Presentation = mongoose.model('Presentation', PresentationSchema);
const UsageStat = mongoose.model('UsageStat', UsageStatSchema);
const Session = mongoose.model('Session', SessionSchema);

module.exports = {
  User,
  Presentation,
  UsageStat,
  Session
};