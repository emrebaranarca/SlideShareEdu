// server.js - Main server file
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const path = require('path');
const fs = require('fs');
const rateLimit = require('express-rate-limit');
require('dotenv').config();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');


// Import custom modules
const config = require('./config');
const logger = require('./logger');
const { User, Presentation, UsageStat, Session } = require('./models');
const { auth, admin, deviceCheck, loginLimiter, recordFailedLogin, resetLoginAttempts } = require('./middleware');
const utils = require('./utils');

// Import student routes
const studentRoutes = require('./studentRoutes');

const app = express();
const PORT = config.PORT;

// Security middleware
app.use(helmet()); // Secure HTTP headers

// CORS setup
app.use(cors({
  origin:'*', // Allow all origins in development
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'x-auth-token']
}));

// Request logging
app.use(morgan('combined', { stream: logger.stream }));

// Body parsers
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Rate limiting for APIs
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again after 15 minutes'
});

// Apply rate limiter to API endpoints
app.use('/api/', apiLimiter);

// A more strict rate limiter for authentication endpoints
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // limit each IP to 5 login attempts per windowMs
  message: 'Too many login attempts from this IP, please try again after 15 minutes'
});

// Configure multer for file uploads
const multer = require('multer');
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = path.join(__dirname, 'uploads');
    utils.ensureDirectoryExists(uploadPath);
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    // Create a safe filename
    const safeFilename = utils.getSafeFilename(file.originalname);
    cb(null, Date.now() + '-' + safeFilename);
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: config.MAX_FILE_SIZE // Default 50MB from config
  },
  fileFilter: (req, file, cb) => {
    if (config.ALLOWED_FILE_TYPES.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Only PowerPoint files are allowed!'), false);
    }
  }
});

// Connect to MongoDB
mongoose.connect(config.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(() => {
  logger.info('MongoDB connected successfully');
})
.catch(err => {
  logger.error('MongoDB connection error:', err);
  process.exit(1);
});

// Routes

// Use student routes
app.use('/api/students', studentRoutes);

// Login route with stricter rate limiting
app.post('/api/auth/login', [authLimiter, loginLimiter], async (req, res) => {
  const { email, password } = req.body;

  try {
    // Check if user exists
    const user = await User.findOne({ email });
    if (!user) {
      if (req.userForLogin) {
        // Record failed login attempt if user exists in DB
        await recordFailedLogin(req, res, () => {});
      }
      return res.status(400).json({ msg: 'Invalid credentials' });
    }

    // Check if user is admin
    if (!user.isAdmin) {
      await recordFailedLogin(req, res, () => {});
      return res.status(403).json({ msg: 'Not an admin account' });
    }

    // Check if account is locked
    if (user.lockUntil && user.lockUntil > Date.now()) {
      return res.status(423).json({ 
        msg: 'Account is temporarily locked. Please try again later.',
        lockUntil: user.lockUntil
      });
    }

    // Validate password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      await recordFailedLogin(req, res, () => {});
      return res.status(400).json({ msg: 'Invalid credentials' });
    }

    // Reset login attempts on successful login
    await resetLoginAttempts(user.id);

    // Update last login
    user.lastLogin = Date.now();
    await user.save();

    // Get device info
    const deviceInfo = utils.parseDeviceInfo(req.headers['user-agent']);

    // Return JWT
    const payload = {
      user: {
        id: user.id,
        isAdmin: user.isAdmin
      }
    };

    jwt.sign(
      payload,
      config.JWT_SECRET,
      { expiresIn: config.JWT_ADMIN_EXPIRY },
      (err, token) => {
        if (err) throw err;
        
        // Create session record for security tracking
        if (config.SESSION_TRACKING) {
          const session = new Session({
            userId: user.id,
            token,
            deviceInfo: JSON.stringify(deviceInfo),
            ipAddress: req.ip,
            expires: new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours
          });
          
          session.save().catch(err => logger.error('Session save error:', err));
        }

        res.json({ token });
      }
    );
  } catch (err) {
    logger.error('Login error:', err);
    res.status(500).send('Server error');
  }
});

// Presentation routes
// Upload a new presentation
app.post('/api/presentations', [auth, admin, upload.single('presentation')], async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ msg: 'No file uploaded' });
    }

    // Get slide count (placeholder implementation)
    const slideCount = await utils.getSlideCount(
      path.join(__dirname, 'uploads', req.file.filename)
    );

    const newPresentation = new Presentation({
      title: req.body.title || req.file.originalname.replace(/\.[^/.]+$/, ""), // Remove file extension
      fileName: req.file.filename,
      description: req.body.description || '',
      slideCount,
      isPublished: req.body.isPublished !== undefined ? req.body.isPublished : true
    });

    const presentation = await newPresentation.save();
    logger.info(`New presentation uploaded: ${presentation.title} by user ${req.user.id}`);
    res.status(201).json(presentation);
  } catch (err) {
    logger.error('Presentation upload error:', err);
    res.status(500).send('Server error');
  }
});

// Get all presentations
app.get('/api/presentations', [auth, admin], async (req, res) => {
  try {
    const presentations = await Presentation.find().sort({ uploadDate: -1 });
    res.json(presentations);
  } catch (err) {
    logger.error('Get presentations error:', err);
    res.status(500).send('Server error');
  }
});

// Get a specific presentation
app.get('/api/presentations/:id', [auth, admin], async (req, res) => {
  try {
    const presentation = await Presentation.findById(req.params.id);
    
    if (!presentation) {
      return res.status(404).json({ msg: 'Presentation not found' });
    }

    res.json(presentation);
  } catch (err) {
    logger.error(`Get presentation error for ID ${req.params.id}:`, err);
    res.status(500).send('Server error');
  }
});

// Delete a presentation
app.delete('/api/presentations/:id', [auth, admin], async (req, res) => {
  try {
    const presentation = await Presentation.findById(req.params.id);
    
    if (!presentation) {
      return res.status(404).json({ msg: 'Presentation not found' });
    }

    // Delete the file
    const filePath = path.join(__dirname, 'uploads', presentation.fileName);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    // Delete from database
    await Presentation.findByIdAndDelete(req.params.id);
    
    logger.info(`Presentation deleted: ${presentation.title} by user ${req.user.id}`);
    res.json({ msg: 'Presentation removed' });
  } catch (err) {
    logger.error(`Delete presentation error for ID ${req.params.id}:`, err);
    res.status(500).send('Server error');
  }
});

// Update presentation info
app.put('/api/presentations/:id', [auth, admin], async (req, res) => {
  const { title, description, isPublished } = req.body;
  
  // Build update object
  const presentationFields = {};
  if (title) presentationFields.title = title;
  if (description !== undefined) presentationFields.description = description;
  if (isPublished !== undefined) presentationFields.isPublished = isPublished;
  
  try {
    let presentation = await Presentation.findById(req.params.id);
    
    if (!presentation) {
      return res.status(404).json({ msg: 'Presentation not found' });
    }
    
    presentation = await Presentation.findByIdAndUpdate(
      req.params.id,
      { $set: presentationFields },
      { new: true }
    );
    
    logger.info(`Presentation updated: ${presentation.title} by user ${req.user.id}`);
    res.json(presentation);
  } catch (err) {
    logger.error(`Update presentation error for ID ${req.params.id}:`, err);
    res.status(500).send('Server error');
  }
});

// Download a presentation file
app.get('/api/download/:filename', auth, (req, res) => {
  const filePath = path.join(__dirname, 'uploads', req.params.filename);
  
  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ msg: 'File not found' });
  }
  
  // Log download
  logger.info(`File downloaded: ${req.params.filename} by user ${req.user.id}`);
  
  res.download(filePath);
});

// Student management routes
// Get all student users
app.get('/api/admin/students', [auth, admin], async (req, res) => {
  try {
    const students = await User.find({ isAdmin: false }).select('-password').sort({ createdAt: -1 });
    res.json(students);
  } catch (err) {
    logger.error('Get students error:', err);
    res.status(500).send('Server error');
  }
});

// Register a new student
app.post('/api/admin/students', [auth, admin], async (req, res) => {
  const { email, password, name } = req.body;
  
  try {
    // Check if student already exists
    let student = await User.findOne({ email });
    if (student) {
      return res.status(400).json({ msg: 'Student already exists' });
    }
    
    // Create new student
    student = new User({
      email,
      password,
      name,
      isAdmin: false
    });
    
    // Hash password
    const salt = await bcrypt.genSalt(10);
    student.password = await bcrypt.hash(password, salt);
    
    await student.save();
    logger.info(`New student registered: ${email} by admin ${req.user.id}`);
    res.status(201).json({ msg: 'Student registered successfully' });
  } catch (err) {
    logger.error('Student registration error:', err);
    res.status(500).send('Server error');
  }
});

// Get usage statistics
app.get('/api/admin/stats', [auth, admin], async (req, res) => {
  try {
    // Get total students count
    const totalStudents = await User.countDocuments({ isAdmin: false });
    
    // Get total presentations count
    const totalPresentations = await Presentation.countDocuments();
    
    // Get active students (students who used the app in the last 30 days)
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const activeStudents = await UsageStat.distinct('userId', { startTime: { $gte: thirtyDaysAgo } });
    
    // Get most viewed presentations
    const mostViewedPresentations = await UsageStat.aggregate([
      { $group: { _id: '$presentationId', viewCount: { $sum: 1 } } },
      { $sort: { viewCount: -1 } },
      { $limit: 5 },
      { $lookup: { from: 'presentations', localField: '_id', foreignField: '_id', as: 'presentation' } },
      { $unwind: '$presentation' },
      { $project: { _id: 0, title: '$presentation.title', viewCount: 1 } }
    ]);
    
    res.json({
      totalStudents,
      totalPresentations,
      activeStudentsCount: activeStudents.length,
      mostViewedPresentations
    });
  } catch (err) {
    logger.error('Get stats error:', err);
    res.status(500).send('Server error');
  }
});

// Get usage statistics for a specific student
app.get('/api/admin/student-stats/:id', [auth, admin], async (req, res) => {
  try {
    const student = await User.findById(req.params.id).select('-password');
    
    if (!student) {
      return res.status(404).json({ msg: 'Student not found' });
    }
    
    // Get student usage statistics
    const stats = await UsageStat.find({ userId: req.params.id })
      .populate('presentationId', 'title')
      .sort({ startTime: -1 });
    
    res.json({
      student,
      stats
    });
  } catch (err) {
    logger.error(`Get student stats error for ID ${req.params.id}:`, err);
    res.status(500).send('Server error');
  }
});





// Error handling middleware
app.use((err, req, res, next) => {
  logger.error(err.stack);
  res.status(500).send('Something went wrong!');
});

// 404 handling
app.use((req, res) => {
  res.status(404).send('Not found');
});

// Start the server
app.listen(PORT, () => {
  logger.info(`Server running on port ${PORT}`);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  logger.error('Unhandled Rejection:', err);
  // Don't crash the server in production
  if (process.env.NODE_ENV !== 'production') {
    process.exit(1);
  }
});