const mongoose = require('mongoose');
const User = require('./models/User');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '.env') });

const setupAdmin = async () => {
  try {
    const mongoUri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/shyam';
    await mongoose.connect(mongoUri);
    console.log('Connected to DB:', mongoUri);

    const mobile = '6367793601';
    const password = 'FounderRohit@2006'; 
    const name = 'Admin';

    // Delete any existing user with this mobile to avoid duplicate key error
    await User.deleteMany({ mobile });
    // Delete existing admins to keep it "Single Admin" as requested
    await User.deleteMany({ role: { $in: ['admin', 'admin'] } });
    console.log('Cleared existing admin accounts and target mobile.');

    const permissions = [
      'manage_services', 
      'manage_content', 
      'manage_bookings', 
      'manage_feedback', 
      'manage_finance', 
      'manage_agents',
      'manage_settings',
      'manage_gallery'
    ];

    await User.create({
      name,
      mobile,
      password,
      role: 'admin',
      permissions,
      status: 'active'
    });

    console.log('-----------------------------------');
    console.log('Single Admin Account Created:');
    console.log('Mobile:   ', mobile);
    console.log('Password:  [SECURELY HASHED]');
    console.log('Role:      admin');
    console.log('-----------------------------------');

    process.exit(0);
  } catch (err) {
    console.error('Error creating admin:', err);
    process.exit(1);
  }
};

setupAdmin();
