// createAdmin.js - Script to create initial admin user
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const readline = require('readline');

// Connect to MongoDB
mongoose.connect('mongodb://localhost:27017/powerpoint_app', {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(() => console.log('MongoDB connected'))
.catch(err => {
  console.error('MongoDB connection error:', err);
  process.exit(1);
});

// Define User Schema (same as in server.js)
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
  isAdmin: {
    type: Boolean,
    default: false
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

const User = mongoose.model('User', UserSchema);

// Create readline interface for user input
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Function to create admin user
async function createAdmin() {
  // Check if admin already exists
  const existingAdmin = await User.findOne({ isAdmin: true });
  if (existingAdmin) {
    console.log('An admin user already exists!');
    console.log(`Email: ${existingAdmin.email}`);
    rl.question('Do you want to create another admin? (y/n): ', async (answer) => {
      if (answer.toLowerCase() === 'y') {
        await promptForCredentials();
      } else {
        mongoose.disconnect();
        rl.close();
      }
    });
  } else {
    await promptForCredentials();
  }
}

// Function to prompt for admin credentials
async function promptForCredentials() {
  rl.question('Enter admin email: ', (email) => {
    rl.question('Enter admin password: ', async (password) => {
      try {
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const admin = new User({
          email,
          password: hashedPassword,
          isAdmin: true
        });

        await admin.save();
        console.log('Admin user created successfully!');
      } catch (err) {
        console.error('Error creating admin:', err.message);
      } finally {
        mongoose.disconnect();
        rl.close();
      }
    });
  });
}

// Start the script
createAdmin();