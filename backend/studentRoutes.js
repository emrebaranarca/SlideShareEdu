// studentRoutes.js - Routes for student users
const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { User, Presentation, UsageStat, Session } = require('./models');
const { auth, deviceCheck, loginLimiter, recordFailedLogin, resetLoginAttempts } = require('./middleware');
const config = require('./config');
const logger = require('./logger');
const utils = require('./utils');
const path = require('path'); // Eksik import eklenmiş
const fs = require('fs'); // Eksik import eklenmiş


const router = express.Router();

// Login route with rate limiting
router.post('/login', [loginLimiter], async (req, res) => {
  const { email, password } = req.body;

  try {
    // Check if user exists and is a student (not admin)
    const student = await User.findOne({ email, isAdmin: false });
    if (!student) {
      if (req.userForLogin) {
        // Record failed login attempt if user exists in DB
        await recordFailedLogin(req, res, () => {});
      }
      return res.status(400).json({ msg: 'Invalid credentials' });
    }

    // Check if account is locked
    if (student.lockUntil && student.lockUntil > Date.now()) {
      return res.status(423).json({ 
        msg: 'Account is temporarily locked. Please try again later.',
        lockUntil: student.lockUntil
      });
    }

    // Validate password
    const isMatch = await bcrypt.compare(password, student.password);
    if (!isMatch) {
      await recordFailedLogin(req, res, () => {});
      return res.status(400).json({ msg: 'Invalid credentials' });
    }

    // Reset login attempts on successful login
    await resetLoginAttempts(student.id);

    // Update last login
    student.lastLogin = Date.now();
    await student.save();

    // Get device info
    const deviceInfo = utils.parseDeviceInfo(req.headers['user-agent']);
    
    // Store device info if it's the first login
    if (!student.deviceInfo) {
      student.deviceInfo = JSON.stringify(deviceInfo);
      await student.save();
    }

    // Return JWT
    const payload = {
      user: {
        id: student.id,
        isAdmin: false
      }
    };

    jwt.sign(
      payload,
      config.JWT_SECRET,
      { expiresIn: config.JWT_STUDENT_EXPIRY },
      (err, token) => {
        if (err) throw err;
        
        // Create session record for security tracking
        if (config.SESSION_TRACKING) {
          const session = new Session({
            userId: student.id,
            token,
            deviceInfo: JSON.stringify(deviceInfo),
            ipAddress: req.ip,
            expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days
          });
          
          session.save().catch(err => logger.error('Session save error:', err));
        }

        res.json({ 
          token,
          user: {
            id: student.id,
            name: student.name,
            email: student.email
          }
        });
      }
    );
  } catch (err) {
    logger.error('Student login error:', err);
    res.status(500).send('Server error');
  }
});

// Get user profile
router.get('/profile', auth, async (req, res) => {
  try {
    const student = await User.findById(req.user.id).select('-password');
    if (!student) {
      return res.status(404).json({ msg: 'Student not found' });
    }
    res.json(student);
  } catch (err) {
    logger.error('Get profile error:', err);
    res.status(500).send('Server error');
  }
});

// Get all available presentations for the student
router.get('/presentations', auth, async (req, res) => {
  try {
    // Only return published presentations to students
    const presentations = await Presentation.find({ isPublished: true })
      .select('-__v')
      .sort({ uploadDate: -1 });
      
    res.json(presentations);
  } catch (err) {
    logger.error('Get presentations error:', err);
    res.status(500).send('Server error');
  }
});

router.get('/presentations/:id/share', auth, async (req, res) => {
  try {
    const presentation = await Presentation.findOne({ 
      _id: req.params.id,
      isPublished: true 
    });
    
    if (!presentation) {
      return res.status(404).json({ msg: 'Sunum bulunamadı' });
    }

    // Sunum dosyasının tam yolunu alın
    const filePath = path.join(__dirname, 'uploads', presentation.fileName);
    
    // Dosyanın var olup olmadığını kontrol edin
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ msg: 'Sunum dosyası bulunamadı' });
    }

    // Geçici bir URL oluşturun (gerçek uygulamada AWS S3 veya benzeri bir servis kullanılabilir)
    const url = `http://localhost:3000/api/download/${presentation.fileName}`;
    
    res.json({
      success: true,
      url: url,
      fileName: presentation.fileName,
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() // 24 saat geçerli
    });
  } catch (err) {
    logger.error(`Sunum paylaşım hatası: ${err.message}`);
    res.status(500).send('Sunucu hatası');
  }
});

// Get a specific presentation
router.get('/presentations/:id', auth, async (req, res) => {
  try {
    const presentation = await Presentation.findOne({ 
      _id: req.params.id,
      isPublished: true 
    });
    
    if (!presentation) {
      return res.status(404).json({ msg: 'Presentation not found' });
    }

    res.json(presentation);
  } catch (err) {
    logger.error(`Get presentation error for ID ${req.params.id}:`, err);
    res.status(500).send('Server error');
  }
});

// Record usage statistics
router.post('/usage', auth, async (req, res) => {
  const { presentationId, slidesViewed, completionPercentage, duration } = req.body;

  try {
    // Check if the presentation exists and is published
    const presentation = await Presentation.findOne({ 
      _id: presentationId,
      isPublished: true 
    });
    
    if (!presentation) {
      return res.status(404).json({ msg: 'Presentation not found' });
    }

    // Get device info
    const deviceInfo = utils.parseDeviceInfo(req.headers['user-agent']);

    // Create or update usage statistics
    let usageStat = await UsageStat.findOne({ 
      userId: req.user.id,
      presentationId,
      startTime: { 
        $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) // Within last 24 hours
      }
    });

    if (usageStat) {
      // Update existing stats
      usageStat.endTime = Date.now();
      usageStat.slidesViewed = Math.max(usageStat.slidesViewed, slidesViewed || 0);
      usageStat.completionPercentage = Math.max(usageStat.completionPercentage, completionPercentage || 0);
      usageStat.duration = (usageStat.duration || 0) + (duration || 0);
      usageStat.deviceInfo = JSON.stringify(deviceInfo);
      usageStat.ipAddress = req.ip;
    } else {
      // Create new usage stats
      usageStat = new UsageStat({
        userId: req.user.id,
        presentationId,
        startTime: Date.now(),
        endTime: Date.now(),
        slidesViewed: slidesViewed || 0,
        completionPercentage: completionPercentage || 0,
        duration: duration || 0,
        deviceInfo: JSON.stringify(deviceInfo),
        ipAddress: req.ip
      });
    }

    await usageStat.save();
    logger.info(`Usage recorded: User ${req.user.id} viewed presentation ${presentationId}`);
    res.json({ success: true });
  } catch (err) {
    logger.error('Record usage error:', err);
    res.status(500).send('Server error');
  }
});

// Get student's own usage statistics
router.get('/my-stats', auth, async (req, res) => {
  try {
    // Get student's usage statistics
    const stats = await UsageStat.find({ userId: req.user.id })
      .populate('presentationId', 'title')
      .sort({ startTime: -1 });
    
    // Format the data for easier consumption by the mobile app
    const formattedStats = stats.map(stat => ({
      id: stat._id,
      presentation: stat.presentationId ? {
        id: stat.presentationId._id,
        title: stat.presentationId.title
      } : null,
      startTime: stat.startTime,
      endTime: stat.endTime,
      duration: stat.duration || 0,
      slidesViewed: stat.slidesViewed || 0,
      completionPercentage: stat.completionPercentage || 0,
      formattedDate: utils.formatDate(stat.startTime),
      formattedDuration: utils.calculateDuration(stat.startTime, stat.endTime)
    }));
    
    res.json(formattedStats);
  } catch (err) {
    logger.error('Get my stats error:', err);
    res.status(500).send('Server error');
  }
});

// Update student password
router.put('/update-password', auth, async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  
  try {
    const student = await User.findById(req.user.id);
    
    if (!student) {
      return res.status(404).json({ msg: 'Student not found' });
    }
    
    // Verify current password
    const isMatch = await bcrypt.compare(currentPassword, student.password);
    if (!isMatch) {
      return res.status(400).json({ msg: 'Current password is incorrect' });
    }
    
    // Hash new password
    const salt = await bcrypt.genSalt(10);
    student.password = await bcrypt.hash(newPassword, salt);
    
    await student.save();
    logger.info(`Password updated for user ${req.user.id}`);
    res.json({ msg: 'Password updated successfully' });
  } catch (err) {
    logger.error('Update password error:', err);
    res.status(500).send('Server error');
  }
});

// Logout - invalidate current session
router.post('/logout', auth, async (req, res) => {
  if (!config.SESSION_TRACKING) {
    return res.json({ msg: 'Logged out successfully' });
  }
  
  try {
    // Get token from header
    const token = req.header('x-auth-token');
    
    // Invalidate the session
    await Session.findOneAndUpdate(
      { token, userId: req.user.id },
      { isValid: false },
      { new: true }
    );
    
    res.json({ msg: 'Logged out successfully' });
  } catch (err) {
    logger.error('Logout error:', err);
    res.status(500).send('Server error');
  }
});



module.exports = router;