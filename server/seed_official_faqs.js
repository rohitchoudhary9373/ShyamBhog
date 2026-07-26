const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');
const FAQ = require('./models/FAQ');
const User = require('./models/User');

dotenv.config({ path: path.join(__dirname, '.env') });

const officialFaqs = [
  // ── GENERAL / MAIN PAGE FAQs ──
  {
    question: "What is Shyam Bhog, and how does it work?",
    answer: "Shyam Bhog is a dedicated digital devotional platform connecting devotees with Shri Khatu Shyam Ji Temple services. You can book Arjee, Bhog, and Swamani offerings online, track live crowd status, and access pilgrimage assistance.",
    category: "General",
    order: 1
  },
  {
    question: "How does the Shyam Bhog process work if I cannot visit Khatu in person?",
    answer: "If you cannot visit Khatu in person, our team acts on your behalf. We print your Arjee in sacred red ink and offer pure Bhog Prasad at Baba Shyam's Darbar with full devotional rituals, providing digital confirmation.",
    category: "General",
    order: 2
  },
  {
    question: "Is it safe to book and pay online on your website?",
    answer: "Yes, 100%. All transactions are secured through 256-bit encrypted payment gateways (Razorpay). You receive instant digital receipts and order tracking in your profile.",
    category: "General",
    order: 3
  },
  {
    question: "How do I get confirmation after making a booking?",
    answer: "Immediately after payment, you get an instant digital confirmation receipt. You can also view your active bookings and lifecycle updates under your Profile section.",
    category: "General",
    order: 4
  },
  {
    question: "Can I book for my entire family or a Kirtan group?",
    answer: "Yes! You can add multiple devotee names and specific prayers under a single booking for your family members or group.",
    category: "General",
    order: 5
  },

  // ── ARJEE FAQs ──
  {
    question: "Why should I offer an Arjee to Baba Shyam? (Spiritual Benefits)",
    answer: "Baba Shyam is renowned as 'Haare Ka Sahara'. Submitting an Arjee symbolizes surrendering your worries at his divine feet, bringing inner peace, obstacle removal, and divine grace.",
    category: "Arjee",
    order: 1
  },
  {
    question: "What is an Arjee, and what is its significance in Khatu Shyam Ji's Darbar?",
    answer: "An Arjee is a written prayer or wish offered to Khatu Shyam Ji. In Khatu Dham, submitting an Arjee is a sacred tradition where devotees communicate their deepest heart wishes to Baba.",
    category: "Arjee",
    order: 2
  },
  {
    question: "What is the 'Vyaktigat Arjee' service, and how does it work?",
    answer: "Vyaktigat Arjee is an individual personal prayer service. Your specific name, location, and prayer are printed and offered exclusively at Baba Shyam's temple.",
    category: "Arjee",
    order: 3
  },
  {
    question: "What is the 'Swayam Arjee' service, and how does it benefit me?",
    answer: "Swayam Arjee is designed for devotees visiting Khatu. We prepare a complete sacred Arjee basket (rose, coconut, ittar, red ink Arjee) ready for you to personally offer upon arrival.",
    category: "Arjee",
    order: 4
  },
  {
    question: "Why is the Arjee specifically printed in sacred red ink?",
    answer: "Red (Roli/Kumkum) is the sacred color of Shringar and devotion in Khatu Dham, symbolizing purity, auspiciousness, and sacred energy.",
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

const seedFaqs = async () => {
  try {
    const mongoUri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/shyam';
    await mongoose.connect(mongoUri);
    console.log('Connected to DB:', mongoUri);

    const admin = await User.findOne({ role: 'admin' });
    if (!admin) {
      console.error("Admin user not found. Please setup admin first.");
      process.exit(1);
    }

    // Clear existing FAQs to prevent duplicates
    await FAQ.deleteMany({});
    console.log("Cleared existing FAQs.");

    const faqsToInsert = officialFaqs.map(f => ({
      ...f,
      adminId: admin._id,
      isActive: true
    }));

    await FAQ.insertMany(faqsToInsert);
    console.log(`Successfully seeded ${faqsToInsert.length} official FAQs for admin: ${admin.email || admin.mobile}`);

    process.exit(0);
  } catch (err) {
    console.error("Error seeding FAQs:", err);
    process.exit(1);
  }
};

seedFaqs();
