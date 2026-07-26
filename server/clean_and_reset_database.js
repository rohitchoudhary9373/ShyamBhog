const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '.env') });

const User = require('./models/User');
const ArjeeOrder = require('./models/ArjeeOrder');
const Transaction = require('./models/Transaction');
const Refund = require('./models/Refund');
const Feedback = require('./models/Feedback');
const FAQ = require('./models/FAQ');

const cleanFaqs = [
  // ── GENERAL / MAIN PAGE FAQs ──
  {
    question: "What is Shyam Bhog, and how does it work?",
    answer: "Shyam Bhog is an authentic digital devotional portal for Shri Khatu Shyam Ji Temple services. Devotees can submit online Arjee, book pure Bhog Prasad offerings, check live crowd telemetry, and access pilgrimage support.",
    category: "General",
    order: 1
  },
  {
    question: "How does the Shyam Bhog process work if I cannot visit Khatu in person?",
    answer: "If you cannot visit Khatu in person, our verified team acts on your behalf. We print your Arjee in sacred red ink and offer pure Bhog Prasad at Baba Shyam's Darbar with complete rituals, sending digital confirmation to you.",
    category: "General",
    order: 2
  },
  {
    question: "Is it safe to book and pay online on your website?",
    answer: "Yes, 100%. All transactions are processed through 256-bit encrypted payment gateways (Razorpay). You receive instant digital receipts and complete order tracking in your Profile.",
    category: "General",
    order: 3
  },
  {
    question: "How do I get confirmation after making a booking?",
    answer: "Immediately after payment, an instant digital receipt is generated. You can view all your active bookings and live ritual updates under your Profile section.",
    category: "General",
    order: 4
  },
  {
    question: "Can I book for my entire family or a Kirtan group?",
    answer: "Yes! You can add multiple devotee names and individual prayers in a single booking for your family members or devotional group.",
    category: "General",
    order: 5
  },

  // ── ARJEE FAQs ──
  {
    question: "Why should I offer an Arjee to Baba Shyam? (Spiritual Benefits)",
    answer: "Baba Shyam is renowned as 'Haare Ka Sahara'. Submitting an Arjee symbolizes surrendering your troubles at his lotus feet, bringing peace, obstacle removal, and divine grace.",
    category: "Arjee",
    order: 1
  },
  {
    question: "What is an Arjee, and what is its significance in Khatu Shyam Ji's Darbar?",
    answer: "An Arjee is a written prayer or heartfelt request submitted at Baba Shyam's Darbar. It is a long-standing sacred tradition where devotees communicate their prayers to Baba.",
    category: "Arjee",
    order: 2
  },
  {
    question: "What is the 'Vyaktigat Arjee' service, and how does it work?",
    answer: "Vyaktigat Arjee is an individual personal prayer service where your name, address, and prayer are printed and offered exclusively at Baba Shyam's sanctum.",
    category: "Arjee",
    order: 3
  },
  {
    question: "What is the 'Swayam Arjee' service, and how does it benefit me?",
    answer: "Swayam Arjee is for devotees visiting Khatu. We prepare a ready sacred offering basket (rose, coconut, ittar, red ink Arjee) for you to personally offer upon arrival.",
    category: "Arjee",
    order: 4
  },
  {
    question: "Why is the Arjee specifically printed in sacred red ink?",
    answer: "Red (Roli/Kumkum) is the sacred color of Shringar and devotion in Khatu Dham, symbolizing auspiciousness and pure faith.",
    category: "Arjee",
    order: 5
  },
  {
    question: "Can I write my Arjee in my own language?",
    answer: "Yes, Baba Shyam understands true devotion in every language. You can type your prayer in Hindi, English, Marwari, or any language.",
    category: "Arjee",
    order: 6
  },
  {
    question: "What is the Monthly Ekadashi Arjee Subscription?",
    answer: "It is an automated monthly Auto-Pay service where your Arjee is offered at Baba Shyam's Darbar on every Ekadashi automatically.",
    category: "Arjee",
    order: 7
  },

  // ── BHOG FAQs ──
  {
    question: "Is the Prasad inside the Bhog basket completely pure and hygienic?",
    answer: "Yes, 100%. All Prasad items are prepared using pure Desi Ghee and pristine ingredients following strict temple cleanliness guidelines.",
    category: "Bhog",
    order: 1
  },
  {
    question: "Will I get digital proof of my Bhog being offered and distributed?",
    answer: "Yes! Digital status updates and photo/video confirmations are shared after your Bhog is offered at Baba's Darbar.",
    category: "Bhog",
    order: 2
  },
  {
    question: "What items are prepared for Baba's Bhog, and how is hygiene maintained?",
    answer: "Baba's Bhog includes pure Mawa Peda, Churma, Dry Fruits, fresh Rose garland, and divine Ittar, prepared under immaculate hygienic conditions.",
    category: "Bhog",
    order: 3
  },
  {
    question: "Why is distributing Bhog to the needy considered so powerful in Khatu Dham?",
    answer: "Annadanam (food distribution) at Khatu Dham is considered one of the highest spiritual virtues, multiplying blessings and bringing immense satisfaction.",
    category: "Bhog",
    order: 4
  },

  // ── SWAMANI FAQs ──
  {
    question: "What is Swamani Prasad, and how is it offered?",
    answer: "Swamani is a grand 1.25 Maund (approx 50kg) prasad offering of Churma or Peda offered to Shri Khatu Shyam Ji on special devotional occasions.",
    category: "Swamani",
    order: 1
  },
  {
    question: "Can I schedule a large-scale Bhog distribution for Ekadashi or family occasions?",
    answer: "Yes! During checkout you can pick any specific date such as Ekadashi, birthdays, or anniversaries for your Swamani offering.",
    category: "Swamani",
    order: 2
  },

  // ── PARKING FAQs ──
  {
    question: "Where and how can I park my vehicle when visiting Khatu Shyam Temple?",
    answer: "Our Parking Guide provides verified parking locations, vehicle capacity (cars, buses, two-wheelers), and direct navigation maps near Khatu Dham.",
    category: "Parking",
    order: 1
  },

  // ── CROWD STATUS FAQs ──
  {
    question: "How can I check live crowd intensity and darshan wait times?",
    answer: "Our Live Crowd Status telemetry updates real-time darshan wait times, line movement, and crowd levels so you can plan your visit comfortably.",
    category: "CrowdStatus",
    order: 1
  }
];

const resetDatabase = async () => {
  try {
    let mongoUri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/shyam';
    try {
      await mongoose.connect(mongoUri);
      console.log('Connected to Primary DB:', mongoUri);
    } catch (primaryErr) {
      console.log('Primary DB connect failed, attempting local fallback...');
      mongoUri = 'mongodb://127.0.0.1:27017/shyam';
      await mongoose.connect(mongoUri);
      console.log('Connected to Local DB:', mongoUri);
    }

    const adminEmail = 'rohitchoudhary9373@gmail.com';

    // 1. Ensure Admin User exists & has full permissions
    let admin = await User.findOne({ email: adminEmail });
    if (!admin) {
      admin = await User.create({
        name: 'Rohit Choudhary (Admin)',
        mobile: '6367793601',
        email: adminEmail,
        password: 'FounderRohit@2006',
        role: 'admin',
        permissions: ['manage_services', 'manage_content', 'manage_bookings', 'manage_feedback', 'manage_finance', 'manage_agents', 'manage_settings', 'manage_gallery'],
        status: 'active'
      });
      console.log('Created Primary Admin:', adminEmail);
    } else {
      admin.role = 'admin';
      admin.permissions = ['manage_services', 'manage_content', 'manage_bookings', 'manage_feedback', 'manage_finance', 'manage_agents', 'manage_settings', 'manage_gallery'];
      admin.status = 'active';
      admin.walletBalance = 0;
      await admin.save();
      console.log('Updated Primary Admin permissions:', adminEmail);
    }

    // 2. Remove all non-admin test users
    const delUsers = await User.deleteMany({ email: { $ne: adminEmail } });
    console.log(`Cleared ${delUsers.deletedCount} test users. Only Primary Admin retained.`);

    // 3. Clear all test orders
    const delOrders = await ArjeeOrder.deleteMany({});
    console.log(`Cleared ${delOrders.deletedCount} test orders (Revenue reset to ₹0).`);

    // 4. Clear all test transactions & refunds
    const delTx = await Transaction.deleteMany({});
    console.log(`Cleared ${delTx.deletedCount} test transactions.`);

    const delRef = await Refund.deleteMany({});
    console.log(`Cleared ${delRef.deletedCount} test refunds.`);

    // 5. Clear old test feedback
    const delFeed = await Feedback.deleteMany({});
    console.log(`Cleared ${delFeed.deletedCount} test feedbacks.`);

    // 6. Reset FAQs to clean official set
    await FAQ.deleteMany({});
    console.log('Cleared old FAQs from database.');

    const faqsToInsert = cleanFaqs.map(f => ({
      ...f,
      adminId: admin._id,
      isActive: true
    }));
    await FAQ.insertMany(faqsToInsert);
    console.log(`Inserted ${faqsToInsert.length} clean official FAQs.`);

    console.log('==============================================');
    console.log('DATABASE RESET COMPLETE!');
    console.log('Revenue: ₹0');
    console.log('Orders:  0');
    console.log('Users:   1 (Admin: rohitchoudhary9373@gmail.com)');
    console.log('FAQs:    Clean Dynamic Admin-Controlled Set');
    console.log('==============================================');

    process.exit(0);
  } catch (err) {
    console.error('Error resetting database:', err);
    process.exit(1);
  }
};

resetDatabase();
