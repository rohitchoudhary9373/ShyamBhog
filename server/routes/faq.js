const express = require('express');
const router = express.Router();
const FAQ = require('../models/FAQ');
const { protect, admin, superAdmin } = require('../middleware/authMiddleware');
const User = require('../models/User');

const officialFaqs = [
  // ── GENERAL / MAIN PAGE FAQs ──
  { question: "What is Shyam Bhog, and how does it work?", answer: "Shyam Bhog is a dedicated digital devotional platform connecting devotees with Shri Khatu Shyam Ji Temple services. You can book Arjee, Bhog, and Swamani offerings online, track live crowd status, and access pilgrimage assistance.", category: "General", order: 1 },
  { question: "How does the Shyam Bhog process work if I cannot visit Khatu in person?", answer: "If you cannot visit Khatu in person, our team acts on your behalf. We print your Arjee in sacred red ink and offer pure Bhog Prasad at Baba Shyam's Darbar with full devotional rituals, providing digital confirmation.", category: "General", order: 2 },
  { question: "Is it safe to book and pay online on your website?", answer: "Yes, 100%. All transactions are secured through 256-bit encrypted payment gateways (Razorpay). You receive instant digital receipts and order tracking in your profile.", category: "General", order: 3 },
  { question: "How do I get confirmation after making a booking?", answer: "Immediately after payment, you get an instant digital confirmation receipt. You can also view your active bookings and lifecycle updates under your Profile section.", category: "General", order: 4 },
  { question: "Can I book for my entire family or a Kirtan group?", answer: "Yes! You can add multiple devotee names and specific prayers under a single booking for your family members or group.", category: "General", order: 5 },

  // ── ARJEE FAQs ──
  { question: "Why should I offer an Arjee to Baba Shyam? (Spiritual Benefits)", answer: "Baba Shyam is renowned as 'Haare Ka Sahara'. Submitting an Arjee symbolizes surrendering your worries at his divine feet, bringing inner peace, obstacle removal, and divine grace.", category: "Arjee", order: 1 },
  { question: "What is an Arjee, and what is its significance in Khatu Shyam Ji's Darbar?", answer: "An Arjee is a written prayer or wish offered to Khatu Shyam Ji. In Khatu Dham, submitting an Arjee is a sacred tradition where devotees communicate their deepest heart wishes to Baba.", category: "Arjee", order: 2 },
  { question: "What is the 'Vyaktigat Arjee' service, and how does it work?", answer: "Vyaktigat Arjee is an individual personal prayer service. Your specific name, location, and prayer are printed and offered exclusively at Baba Shyam's temple.", category: "Arjee", order: 3 },
  { question: "What is the 'Swayam Arjee' service, and how does it benefit me?", answer: "Swayam Arjee is designed for devotees visiting Khatu. We prepare a complete sacred Arjee basket (rose, coconut, ittar, red ink Arjee) ready for you to personally offer upon arrival.", category: "Arjee", order: 4 },
  { question: "Why is the Arjee specifically printed in sacred red ink?", answer: "Red (Roli/Kumkum) is the sacred color of Shringar and devotion in Khatu Dham, symbolizing purity, auspiciousness, and sacred energy.", category: "Arjee", order: 5 },
  { question: "Can I write my Arjee in my own language?", answer: "Yes, Baba Shyam understands true devotion in every language. You can type your prayer in Hindi, English, Marwari, or any language.", category: "Arjee", order: 6 },
  { question: "What is the Monthly Ekadashi Arjee Subscription?", answer: "It is an automated monthly Auto-Pay service where your Arjee is offered at Baba Shyam's Darbar on every Ekadashi automatically.", category: "Arjee", order: 7 },

  // ── BHOG FAQs ──
  { question: "Is the Prasad inside the Bhog basket completely pure and hygienic?", answer: "Yes, 100%. All Prasad items are prepared using pure Desi Ghee and pristine ingredients following strict temple cleanliness guidelines.", category: "Bhog", order: 1 },
  { question: "Will I get digital proof of my Bhog being offered and distributed?", answer: "Yes! Digital status updates and photo/video confirmations are shared after your Bhog is offered at Baba's Darbar.", category: "Bhog", order: 2 },
  { question: "What items are prepared for Baba's Bhog, and how is hygiene maintained?", answer: "Baba's Bhog includes pure Mawa Peda, Churma, Dry Fruits, fresh Rose garland, and divine Ittar, prepared under immaculate hygienic conditions.", category: "Bhog", order: 3 },
  { question: "Why is distributing Bhog to the needy considered so powerful in Khatu Dham?", answer: "Annadanam (food distribution) at Khatu Dham is considered one of the highest spiritual virtues, multiplying blessings and bringing immense satisfaction.", category: "Bhog", order: 4 },

  // ── SWAMANI FAQs ──
  { question: "What is Swamani Prasad, and how is it offered?", answer: "Swamani is a grand 1.25 Maund (approx 50kg) prasad offering of Churma or Peda offered to Shri Khatu Shyam Ji on special devotional occasions.", category: "Swamani", order: 1 },
  { question: "Can I schedule a large-scale Bhog distribution for Ekadashi or family occasions?", answer: "Yes! During checkout you can pick any specific date such as Ekadashi, birthdays, or anniversaries for your Swamani offering.", category: "Swamani", order: 2 },

  // ── PARKING FAQs ──
  { question: "Where and how can I park my vehicle when visiting Khatu Shyam Temple?", answer: "Our Parking Guide provides verified parking locations, vehicle capacity (cars, buses, two-wheelers), and direct navigation maps near Khatu Dham.", category: "Parking", order: 1 },

  // ── CROWD STATUS FAQs ──
  { question: "How can I check live crowd intensity and darshan wait times?", answer: "Our Live Crowd Status telemetry updates real-time darshan wait times, line movement, and crowd levels so you can plan your visit comfortably.", category: "CrowdStatus", order: 1 }
];

// Helper to auto seed
const ensureFaqsSeeded = async (adminId) => {
  try {
    // Delete old legacy un-curated questions
    await FAQ.deleteMany({
      $or: [
        { question: { $regex: /lost in Khatu|standard Shyam Bhog basket|arrival in Khatu is delayed|change the date or time|bulk booking for my entire family/i } },
        { answer: { $regex: /lost in Khatu|receive my Bhog basket when I arrive/i } }
      ]
    });

    const count = await FAQ.countDocuments();
    if (count === 0) {
      const targetAdmin = adminId || (await User.findOne({ role: 'admin' }))?._id;
      if (targetAdmin) {
        const faqsToInsert = officialFaqs.map(f => ({ ...f, adminId: targetAdmin, isActive: true }));
        await FAQ.insertMany(faqsToInsert);
        console.log(`Auto-seeded ${faqsToInsert.length} official FAQs`);
      }
    }
  } catch (err) {
    console.error("Auto seed FAQs error:", err);
  }
};

// Get all FAQs
router.get('/', async (req, res) => {
  try {
    const { tenantId, category } = req.query;
    await ensureFaqsSeeded(tenantId);

    const filter = {};
    if (category) filter.category = category;
    if (tenantId) filter.adminId = tenantId;

    let faqs = await FAQ.find(filter).sort({ order: 1, createdAt: -1 });

    // Fallback if tenant has no specific FAQs yet
    if (faqs.length === 0 && tenantId) {
      faqs = await FAQ.find(category ? { category } : {}).sort({ order: 1, createdAt: -1 });
    }

    res.json({ success: true, data: faqs });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Admin manual re-seed endpoint
router.post('/seed', protect, admin, async (req, res) => {
  try {
    const adminId = req.effectiveId || req.user._id;
    await FAQ.deleteMany({ adminId });
    const faqsToInsert = officialFaqs.map(f => ({ ...f, adminId, isActive: true }));
    await FAQ.insertMany(faqsToInsert);
    res.json({ success: true, message: `Successfully seeded ${faqsToInsert.length} official FAQs.` });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// @desc    Get FAQs by category (Legacy Support)
router.get('/cat/:category', async (req, res) => {
  try {
    const faqs = await FAQ.find({ category: req.params.category }).sort({ order: 1 });
    res.json({ success: true, data: faqs });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Create a new FAQ (Admin only)
router.post('/', protect, admin, async (req, res) => {
  try {
    const data = req.body;
    
    // If admin provides adminId in query, use it. Otherwise use effectiveId.
    if (req.user.role === 'admin' && req.query.adminId) {
       data.adminId = req.query.adminId;
    } else {
       data.adminId = req.effectiveId;
    }

    const faq = await FAQ.create(data);
    res.status(201).json(faq);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Update an FAQ (Admin only)
router.put('/:id', protect, admin, async (req, res) => {
  try {
    const faq = await FAQ.findById(req.params.id);
    if (!faq) return res.status(404).json({ message: 'FAQ not found' });

    if (req.user.role !== 'admin' && faq.adminId.toString() !== req.effectiveId.toString()) {
      return res.status(403).json({ message: "Not authorized" });
    }

    Object.assign(faq, req.body);
    await faq.save();
    res.json(faq);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Delete an FAQ (Admin only)
router.delete('/:id', protect, admin, async (req, res) => {
  try {
    const faq = await FAQ.findById(req.params.id);
    if (!faq) return res.status(404).json({ message: 'FAQ not found' });

    if (req.user.role !== 'admin' && faq.adminId.toString() !== req.effectiveId.toString()) {
      return res.status(403).json({ message: "Not authorized" });
    }

    await faq.deleteOne();
    res.json({ message: 'FAQ removed' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
