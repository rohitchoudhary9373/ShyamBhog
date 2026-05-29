const express = require('express');
const { protect, admin, superAdmin } = require('../middleware/authMiddleware');
const ArjeeOrder = require('../models/ArjeeOrder');
const Refund = require('../models/Refund');
const User = require('../models/User');
const Setting = require('../models/Setting');
const { generateInvoice } = require('../utils/invoiceGenerator');
const archiver = require('archiver');
const { parse } = require('json2csv');

const router = express.Router();

// Helper to get settings for a tenant
const getTenantSettings = async (tenantId) => {
  let settings = await Setting.findOne({ adminId: tenantId });
  if (!settings) {
    const superAdminUser = await User.findOne({ role: 'admin' });
    if (superAdminUser) {
      settings = await Setting.findOne({ adminId: superAdminUser._id });
    }
  }
  return settings || { brandName: 'Shyam Bhog', footerText: 'Made with श्रद्धा' };
};


// ==========================================
// 💰 GET REVENUE DASHBOARD
// ==========================================
router.get('/revenue', protect, admin, async (req, res) => {
  try {
    const revenueData = await ArjeeOrder.aggregate([
      { $match: { status: { $in: ['Completed', 'Active'] } } },
      { 
        $group: {
          _id: null,
          totalRevenue: { $sum: "$totalPrice" },
          totalBookings: { $sum: 1 },
          completedBookings: { 
            $sum: { $cond: [ { $eq: ["$status", "Completed"] }, 1, 0 ] } 
          }
        }
      }
    ]);

    const stats = revenueData[0] || { totalRevenue: 0, totalBookings: 0, completedBookings: 0 };

    res.json({
      success: true,
      globalTotal: stats.totalRevenue,
      data: [stats]
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.get('/reseller-stats', protect, admin, async (req, res) => {
  try {
    const totalBookings = await ArjeeOrder.countDocuments({ status: { $in: ['Completed', 'Active'] } });
    const pendingRefunds = await Refund.countDocuments({ status: 'pending' });
    const agentsCount = await User.countDocuments({ role: 'agent' });
    
    const revenueAgg = await ArjeeOrder.aggregate([
      { $match: { status: { $in: ['Completed', 'Active'] } } },
      { $group: { _id: null, totalRevenue: { $sum: "$totalPrice" } } }
    ]);
    const totalRevenue = revenueAgg[0]?.totalRevenue || 0;

    const walletAgg = await User.aggregate([
      { $match: { role: 'user' } },
      { $group: { _id: null, totalWalletBalance: { $sum: "$walletBalance" } } }
    ]);
    const totalWalletFloat = walletAgg[0]?.totalWalletBalance || 0;

    const recentBookings = await ArjeeOrder.find().sort({ createdAt: -1 }).limit(5);

    const adminUser = await User.findById(req.user._id);
    const adminBalance = adminUser?.walletBalance || 0;

    // Calculate 7 days revenue aggregation
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);
    sevenDaysAgo.setHours(0, 0, 0, 0);

    const dailyRevenueAgg = await ArjeeOrder.aggregate([
      { 
        $match: { 
          status: { $in: ['Completed', 'Active'] },
          createdAt: { $gte: sevenDaysAgo }
        } 
      },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
          revenue: { $sum: "$totalPrice" }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    const dailyMap = {};
    dailyRevenueAgg.forEach(item => {
      dailyMap[item._id] = item.revenue;
    });

    const dailyRevenue = [];
    const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      const dayName = daysOfWeek[d.getDay()];
      dailyRevenue.push({
        name: dayName,
        date: dateStr,
        revenue: dailyMap[dateStr] || 0
      });
    }

    res.json({
      success: true,
      data: {
        totalBookings,
        pendingRefunds,
        agentsCount,
        totalRevenue,
        totalWalletFloat,
        adminBalance,
        recentBookings,
        dailyRevenue
      }
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.get('/platform-stats', protect, superAdmin, async (req, res) => {
  try {
    const totalResellers = await User.countDocuments({ role: 'admin' });
    const totalEndUsers = await User.countDocuments({ role: 'user' });
    const activeSubscriptions = await User.countDocuments({ subscriptionStatus: 'active' });
    
    // Wallet stats
    const walletAgg = await User.aggregate([
      { $group: { _id: null, totalWalletBalance: { $sum: "$walletBalance" } } }
    ]);
    const totalWalletFunds = walletAgg[0]?.totalWalletBalance || 0;
    
    // Aggregation for total revenue and bookings
    const globalAgg = await ArjeeOrder.aggregate([
      { $match: { status: { $in: ['Completed', 'Active'] } } },
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: "$totalPrice" },
          totalBookings: { $sum: 1 }
        }
      }
    ]);

    const stats = globalAgg[0] || { totalRevenue: 0, totalBookings: 0 };

    // Get Recent Activity
    const recentBookings = await ArjeeOrder.find()
      .sort({ createdAt: -1 })
      .limit(5)
      .populate('adminId', 'name');

    // Top Resellers by Revenue
    const topResellersAgg = await ArjeeOrder.aggregate([
      { $match: { status: { $in: ['Completed', 'Active'] } } },
      { 
        $group: { 
          _id: "$adminId", 
          totalRevenue: { $sum: "$totalPrice" }, 
          totalBookings: { $sum: 1 } 
        } 
      },
      { $sort: { totalRevenue: -1 } },
      { $limit: 5 },
      {
        $lookup: {
          from: "users",
          localField: "_id",
          foreignField: "_id",
          as: "user"
        }
      },
      { $unwind: { path: "$user", preserveNullAndEmptyArrays: true } },
      {
        $project: {
          _id: 1,
          totalRevenue: 1,
          totalBookings: 1,
          name: { $ifNull: ["$user.name", "Super Admin"] }
        }
      }
    ]);

    res.json({
      success: true,
      data: {
        totalResellers,
        totalEndUsers,
        totalRevenue: stats.totalRevenue,
        totalBookings: stats.totalBookings,
        activeSubscriptions,
        totalWalletFunds,
        recentBookings,
        topResellers: topResellersAgg
      }
    });

  } catch (err) {
    console.error("Platform Stats Error:", err);
    res.status(500).json({ message: err.message });
  }
});


// ==========================================
// 📄 DOWNLOAD SINGLE PDF INVOICE
// ==========================================
router.get('/invoice/:id', protect, admin, async (req, res) => {
  try {
    const order = await ArjeeOrder.findById(req.params.id);
    if (!order) return res.status(404).json({ message: "Order not found" });

    // SaaS Security
    if (req.user.role !== 'admin' && order.adminId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Not authorized" });
    }

    const settings = await getTenantSettings(order.adminId);
    
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=Invoice-${order._id}.pdf`);

    const doc = generateInvoice(order, settings.brandName, settings.footerText);
    doc.pipe(res);
    doc.end();

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});


// ==========================================
// 📦 BULK EXPORT ZIP (ALL PDFs)
// ==========================================
router.get('/export/zip', protect, superAdmin, async (req, res) => {
  try {
    const { tenantId } = req.query;
    const filter = {};
    if (tenantId) filter.adminId = tenantId;

    const orders = await ArjeeOrder.find(filter);
    if (orders.length === 0) return res.status(404).json({ message: "No orders found to export" });

    res.setHeader('Content-Type', 'application/zip');
    res.setHeader('Content-Disposition', `attachment; filename=All_Invoices_${Date.now()}.zip`);

    const archive = archiver('zip', { zlib: { level: 9 } });
    archive.pipe(res);

    for (const order of orders) {
      const settings = await getTenantSettings(order.adminId);
      const doc = generateInvoice(order, settings.brandName, settings.footerText);
      archive.append(doc, { name: `Invoice_${order._id}.pdf` });
      doc.end();
    }

    archive.finalize();

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});


// ==========================================
// 📊 BULK EXPORT CSV (For CA)
// ==========================================
router.get('/export/csv', protect, superAdmin, async (req, res) => {
  try {
    const { tenantId } = req.query;
    const filter = {};
    if (tenantId) filter.adminId = tenantId;

    const orders = await ArjeeOrder.find(filter).populate('adminId', 'name mobile');
    
    if (orders.length === 0) return res.status(404).json({ message: "No orders found to export" });

    const csvData = orders.map(order => ({
      'Invoice ID': order._id.toString(),
      'Date': new Date(order.createdAt).toLocaleDateString(),
      'Customer Name': order.name,
      'Customer Mobile': order.whatsapp,
      'Service': order.serviceType,
      'Amount (INR)': order.price,
      'Status': order.status,
      'Reseller Name': order.adminId ? order.adminId.name : 'Unknown'
    }));

    const csv = parse(csvData);
    
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename=Finance_Report_${Date.now()}.csv`);
    res.send(csv);

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});


module.exports = router;
