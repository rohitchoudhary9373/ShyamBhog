const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('./models/User');
const ServiceItem = require('./models/ServiceItem');
const Feedback = require('./models/Feedback');

dotenv.config();

const seed = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI || "mongodb://localhost:27017/shyam_bhog");
    console.log("Connected to DB...");

    const superAdmin = await User.findOne({ role: 'admin' });
    const rohitAdmin = await User.findOne({ name: 'Rohit', role: 'admin' });

    if (!superAdmin) {
      console.log("Super Admin not found. Please run setup first.");
      process.exit(1);
    }

    const targetAdminId = rohitAdmin ? rohitAdmin._id : superAdmin._id;

    // 🔹 Clear existing (optional - commented out for safety)
    // await ServiceItem.deleteMany({});
    // await Feedback.deleteMany({});

    // 🔹 Seed Services
    const services = [
      {
        title: "Arjee (Personal Prayer)",
        description: "Submit your personal arjee to Baba Khatu Shyam Ji. We perform it with full rituals.",
        price: 501,
        category: "Arjee",
        serviceType: "Arjee",
        adminId: targetAdminId,
        isActive: true,
        features: ["Ritual Performance", "E-Receipt", "Direct Submission"]
      },
      {
        title: "Chappan Bhog",
        description: "Special 56 types of offerings to Baba Khatu Shyam Ji for blessings and abundance.",
        price: 2100,
        category: "Bhog",
        serviceType: "Bhog",
        adminId: targetAdminId,
        isActive: true,
        features: ["Complete Bhog", "Photo Proof", "Prasad Courier available"]
      },
      {
        title: "Kesar Swamani",
        description: "Pure Saffron Swamani offering performed on Ekadashi or special days.",
        price: 11000,
        category: "Swamani",
        serviceType: "Swamani",
        adminId: targetAdminId,
        isActive: true,
        features: ["Premium Saffron", "Group or Individual", "Full Rituals"]
      },
      {
        title: "Simple Bhog",
        description: "Daily simple bhog offering for peace and prosperity.",
        price: 251,
        category: "Bhog",
        serviceType: "Bhog",
        adminId: targetAdminId,
        isActive: true
      }
    ];

    await ServiceItem.insertMany(services);
    console.log("Services seeded successfully.");

    // 🔹 Seed Feedback
    const feedbacks = [
      {
        name: "Rahul Sharma",
        message: "Baba ki kripa se sab kaam ho gaye. Very professional service.",
        adminId: targetAdminId,
        isApproved: true
      },
      {
        name: "Priya Gupta",
        message: "The Bhog was offered on time and I got the video proof. Jai Shree Shyam!",
        adminId: targetAdminId,
        isApproved: true
      }
    ];

    await Feedback.insertMany(feedbacks);
    console.log("Feedback seeded successfully.");

    console.log("Seeding complete!");
    process.exit(0);
  } catch (error) {
    console.error("Seeding error:", error);
    process.exit(1);
  }
};

seed();
