const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

// Load env
dotenv.config({ path: path.join(__dirname, '.env') });

const User = require('./models/User');
const ServiceItem = require('./models/ServiceItem');
const Transaction = require('./models/Transaction');

const SUPER_ADMIN_ID = "69f894c0adbfe9c7a0aa0f13";

const services = [
  {
    category: 'Arjee',
    title: 'Divine Sankalp Arjee',
    subtitle: 'Seek blessings for your family and health',
    description: 'A special Arjee offered at the lotus feet of Baba Shyam for overall prosperity, health, and spiritual growth of your entire family.',
    price: 501,
    imageUrl: 'https://images.unsplash.com/photo-1544197150-b99a580bb7a8?auto=format&fit=crop&q=80',
    isActive: true,
    badge: 'Popular',
    features: ['Name recitation in temple', 'Live darshan link', 'Digital prasad certificate'],
    adminId: SUPER_ADMIN_ID
  },
  {
    category: 'Bhog',
    title: 'Chhappan Bhog Seva',
    subtitle: 'A royal offering of 56 divine delicacies',
    description: 'The ultimate culinary offering to Khatu Shyam Ji, featuring 56 varieties of sweets, fruits, and traditional dishes prepared with pure desi ghee.',
    price: 11000,
    imageUrl: 'https://images.unsplash.com/photo-1567103472667-6898f3a83cd2?auto=format&fit=crop&q=80',
    isActive: true,
    badge: 'Premium',
    features: ['Exclusive Bhog preparation', 'Personalized Sankalp', 'Prasad delivered to home'],
    adminId: SUPER_ADMIN_ID
  },
  {
    category: 'Swamani',
    title: 'Desi Ghee Swamani',
    subtitle: 'Pure offering of 1.25 Man (50kg) prasad',
    description: 'A traditional offering of 50kg Churma or Ladoo made with premium quality dry fruits and pure Rajasthani desi ghee.',
    price: 21000,
    imageUrl: 'https://images.unsplash.com/photo-1599307734170-9856f638977a?auto=format&fit=crop&q=80',
    isActive: true,
    badge: 'Tradition',
    features: ['Premium ingredients', 'Distribution to devotees', 'Brahmin Bhojan included'],
    adminId: SUPER_ADMIN_ID
  }
];

const devotees = [
  {
    name: "Amit Sharma",
    mobile: "9876543210",
    email: "amit@example.com",
    walletBalance: 2500,
    role: "user",
    password: "password123"
  },
  {
    name: "Priya Verma",
    mobile: "8888888888",
    email: "priya@example.com",
    walletBalance: 500,
    role: "user",
    password: "password123"
  }
];

async function seed() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("Connected to DB...");

    // Clear existing (optional - user said "sab gya", so we add fresh)
    await ServiceItem.deleteMany({ adminId: SUPER_ADMIN_ID });
    
    // Insert Services
    await ServiceItem.insertMany(services);
    console.log("✅ Professional Services Seeded");

    // Insert Devotees (if not exists)
    for (const d of devotees) {
      const exists = await User.findOne({ mobile: d.mobile });
      if (!exists) {
        await User.create(d);
        console.log(`✅ Devotee ${d.name} created`);
      }
    }

    console.log("🚀 All Data Restored Professionally!");
    process.exit();
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

seed();
