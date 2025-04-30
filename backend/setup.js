// setup.js - Initial setup script
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const readline = require('readline');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const { ensureDirectoryExists } = require('./utils');

// Models
const { User } = require('./models');
const config = require('./config');

// Create readline interface
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Ask a question and get user input
const question = (query) => new Promise((resolve) => rl.question(query, resolve));

// Connect to MongoDB
async function connectDB() {
  try {
    await mongoose.connect(config.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    console.log('MongoDB connected successfully');
    return true;
  } catch (err) {
    console.error('MongoDB connection error:', err.message);
    console.log('Please make sure MongoDB is running on your server');
    return false;
  }
}

// Create directories
function createDirectories() {
  console.log('Creating necessary directories...');
  
  // Create uploads directory
  const uploadsDir = path.join(__dirname, 'uploads');
  ensureDirectoryExists(uploadsDir);
  console.log(`Created uploads directory at ${uploadsDir}`);
  
  // Create logs directory
  const logsDir = path.join(__dirname, 'logs');
  ensureDirectoryExists(logsDir);
  console.log(`Created logs directory at ${logsDir}`);
}

// Create .env file if it doesn't exist
async function createEnvFile() {
  const envPath = path.join(__dirname, '.env');
  
  if (fs.existsSync(envPath)) {
    console.log('.env file already exists. Skipping...');
    return;
  }
  
  console.log('Creating .env file...');
  const port = await question('Enter the port number for the server (default: 3000): ') || '3000';
  const mongodbUri = await question('Enter MongoDB URI (default: mongodb://localhost:27017/powerpoint_app): ') || 'mongodb://localhost:27017/powerpoint_app';
  
  // Generate random JWT secret
  const jwtSecret = crypto.randomBytes(32).toString('hex');
  
  const envContent = `PORT=${port}
MONGODB_URI=${mongodbUri}
JWT_SECRET=${jwtSecret}
NODE_ENV=development`;
  
  fs.writeFileSync(envPath, envContent);
  console.log('.env file created successfully');
}

// Create admin user
async function createAdminUser() {
  console.log('\nChecking for existing admin user...');
  
  const existingAdmin = await User.findOne({ isAdmin: true });
  
  if (existingAdmin) {
    console.log('Admin user already exists:');
    console.log(`Email: ${existingAdmin.email}`);
    const createAnother = await question('Do you want to create another admin user? (y/n): ');
    
    if (createAnother.toLowerCase() !== 'y') {
      return;
    }
  }
  
  console.log('\nCreating admin user...');
  const email = await question('Enter admin email: ');
  const password = await question('Enter admin password: ');
  const name = await question('Enter admin name: ');
  
  try {
    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    
    // Create admin user
    const admin = new User({
      email,
      password: hashedPassword,
      name,
      isAdmin: true
    });
    
    await admin.save();
    console.log('Admin user created successfully!');
  } catch (err) {
    console.error('Error creating admin user:', err.message);
  }
}

// Main setup function
async function setup() {
  console.log('=== PowerPoint Teaching App Setup ===\n');
  
  // Connect to database
  const dbConnected = await connectDB();
  if (!dbConnected) {
    rl.close();
    process.exit(1);
  }
  
  // Create directories
  createDirectories();
  
  // Create .env file
  await createEnvFile();
  
  // Create admin user
  await createAdminUser();
  
  console.log('\nSetup completed successfully!');
  console.log('You can now start the server by running: npm start');
  
  rl.close();
  mongoose.disconnect();
}

// Run setup
setup();