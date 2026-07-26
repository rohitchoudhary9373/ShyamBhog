const express = require("express");
const dotenv = require("dotenv");
const cors = require("cors");
const path = require("path");
const morgan = require("morgan");
const helmet = require("helmet");
const http = require("http");
const { Server } = require("socket.io");
const connectDB = require("./config/db");

dotenv.config();
connectDB();

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

// Socket logic
const onlineUsers = new Map(); // userId -> Set of socket.id

io.on("connection", (socket) => {
  console.log("Client connected:", socket.id);
  
  socket.on("join-team", (data) => {
    const { userId } = data || {};
    if (!userId) return;
    socket.userId = userId;
    if (!onlineUsers.has(userId)) {
      onlineUsers.set(userId, new Set());
    }
    onlineUsers.get(userId).add(socket.id);
    
    // Broadcast updated list of online user IDs
    io.emit("team-status-update", Array.from(onlineUsers.keys()));
  });

  socket.on("disconnect", () => {
    console.log("Client disconnected:", socket.id);
    if (socket.userId && onlineUsers.has(socket.userId)) {
      const sockets = onlineUsers.get(socket.userId);
      sockets.delete(socket.id);
      if (sockets.size === 0) {
        onlineUsers.delete(socket.userId);
      }
    }
    io.emit("team-status-update", Array.from(onlineUsers.keys()));
  });
});

// Attach io to app and global for use in routes and services
app.set("io", io);
global.io = io;

// ──────────────────────────────────────
// ──────────────────────────────────────
// SECURITY & RATE LIMITING
// ──────────────────────────────────────
const { generalLimiter, authLimiter, paymentLimiter, nosqlSanitizer, helmetConfig } = require("./middleware/security");

app.use(helmetConfig);
app.use(cors({ origin: "*", credentials: true }));

// ──────────────────────────────────────
// BODY PARSERS
// ──────────────────────────────────────
// Raw body for Razorpay webhook MUST come before express.json()
app.use("/api/payment/webhook", express.raw({ type: "application/json" }));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));
app.use(nosqlSanitizer);

if (process.env.NODE_ENV !== "production") {
  app.use(morgan("dev"));
}

// ──────────────────────────────────────
// STATIC FILES
// ──────────────────────────────────────
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// ──────────────────────────────────────
// ROUTES
// ──────────────────────────────────────
app.get("/", (req, res) => res.json({ success: true, message: "🚀 Shyam Bhog API v2.0" }));

// ──────────────────────────────────────
// RAZORPAY STANDARD CHECKOUT ENDPOINTS
// ──────────────────────────────────────
app.post("/api/create-order", paymentLimiter, async (req, res) => {
  try {
    const { amount, currency, receipt } = req.body;

    // Validate amount >= 100 paise
    if (amount === undefined || typeof amount !== "number") {
      return res.status(400).json({ success: false, message: "Amount is required and must be a number" });
    }
    if (amount < 100) {
      return res.status(400).json({ success: false, message: "Amount must be at least 100 paise" });
    }

    const keyId = process.env.RAZORPAY_KEY_ID;
    const keySecret = process.env.RAZORPAY_KEY_SECRET;

    if (!keyId || !keySecret) {
      return res.status(401).json({ success: false, message: "Unauthorized: Razorpay API keys are missing" });
    }

    const Razorpay = require("razorpay");
    let rzp;
    try {
      rzp = new Razorpay({ key_id: keyId, key_secret: keySecret });
    } catch (e) {
      return res.status(401).json({ success: false, message: "Unauthorized: Invalid Razorpay credentials configuration" });
    }

    try {
      const order = await rzp.orders.create({
        amount: Math.round(amount), // ensure it's integer paise
        currency: currency || "INR",
        receipt: receipt || `rcpt_${Date.now()}`
      });

      return res.status(200).json({
        order_id: order.id,
        amount: order.amount,
        currency: order.currency
      });
    } catch (apiError) {
      console.error("Razorpay API Error:", apiError);
      // Handle Razorpay auth failures (often returns 401 or has auth in message)
      if (apiError.statusCode === 401 || (apiError.message && apiError.message.toLowerCase().includes("auth"))) {
        return res.status(401).json({ success: false, message: "Unauthorized: Razorpay authentication failed" });
      }
      return res.status(500).json({ success: false, message: apiError.message || "Razorpay API error" });
    }
  } catch (error) {
    console.error("Error creating order:", error);
    return res.status(500).json({ success: false, message: error.message || "Internal server error" });
  }
});

app.post("/api/verify-payment", paymentLimiter, async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

    // Missing fields: return 400
    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return res.status(400).json({ success: false, message: "Missing required verification fields" });
    }

    const keySecret = process.env.RAZORPAY_KEY_SECRET;
    if (!keySecret) {
      return res.status(500).json({ success: false, message: "Razorpay key secret not configured on server" });
    }

    const crypto = require("crypto");
    const generated_signature = crypto
      .createHmac("sha256", keySecret)
      .update(razorpay_order_id + "|" + razorpay_payment_id)
      .digest("hex");

    if (generated_signature === razorpay_signature) {
      return res.status(200).json({ success: true, message: "Payment verified successfully" });
    } else {
      // Signature mismatch: return 400, do NOT mark as paid
      return res.status(400).json({ success: false, message: "Signature mismatch. Verification failed." });
    }
  } catch (error) {
    console.error("Error verifying signature:", error);
    return res.status(500).json({ success: false, message: error.message || "Internal server error" });
  }
});

app.use("/api/auth",          authLimiter, require("./routes/auth"));
app.use("/api/users",         generalLimiter, require("./routes/users"));
app.use("/api/settings",      generalLimiter, require("./routes/settings"));
app.use("/api/services",      generalLimiter, require("./routes/services"));
app.use("/api/bookings",      generalLimiter, require("./routes/bookings"));
app.use("/api/user/bookings", generalLimiter, require("./routes/bookings"));
app.use("/api/feedback",      generalLimiter, require("./routes/feedback"));
app.use("/api/faq",           generalLimiter, require("./routes/faq"));
app.use("/api/gallery",       generalLimiter, require("./routes/gallery"));
app.use("/api/content",       generalLimiter, require("./routes/content"));
app.use("/api/payment",       require("./routes/payment")); // payment routes handle their own specific limiters
app.use("/api/wallet",        generalLimiter, require("./routes/wallet"));
app.use("/api/refunds",       generalLimiter, require("./routes/refunds"));
app.use("/api/finance",       generalLimiter, require("./routes/finance"));
app.use("/api/ritual-videos", generalLimiter, require("./routes/ritualVideos"));
app.use("/api/crowd-status",  generalLimiter, require("./routes/crowdStatus"));
app.use("/api/parking",       generalLimiter, require("./routes/parking"));
// Hotel Booking Ecosystem (Deactivated)
const inactiveHotelRouter = express.Router();
inactiveHotelRouter.all('/{*path}', (req, res) => {
  res.status(400).json({ success: false, message: "Hotel booking features are currently inactive." });
});

app.use("/api/hotel-stay",    generalLimiter, inactiveHotelRouter);
app.use("/api/hotels",        generalLimiter, inactiveHotelRouter);
app.use("/api/hotel-vendor",  generalLimiter, inactiveHotelRouter);
app.use("/api/hotel-booking", generalLimiter, inactiveHotelRouter);
app.use("/api/hotel-auth",    generalLimiter, inactiveHotelRouter);
app.use('/api/admin/hotel-vendors', generalLimiter, inactiveHotelRouter);

// ──────────────────────────────────────
// PRODUCTION STATIC SERVING
// ──────────────────────────────────────
// ──────────────────────────────────────
// PRODUCTION STATIC SERVING
// ──────────────────────────────────────
if (process.env.NODE_ENV === "production") {

  const clientPath = path.join(__dirname, "..", "client", "dist");

  app.use(express.static(clientPath));

  app.use((req, res) => {

    if (!req.path.startsWith("/api")) {

      res.sendFile(path.resolve(clientPath, "index.html"));

    } else {

      res.status(404).json({
        success: false,
        message: `API Route ${req.method} ${req.path} not found`
      });

    }

  });

} else {

  // DEV 404
  app.use((req, res) => {

    res.status(404).json({
      success: false,
      message: `Route ${req.method} ${req.path} not found`
    });

  });

}
// ──────────────────────────────────────
// GLOBAL ERROR HANDLER
// ──────────────────────────────────────
app.use((err, req, res, next) => {
  console.error("🔥 SERVER ERROR:", err.message);

  if (err.code === "LIMIT_FILE_SIZE") {
    return res.status(400).json({ success: false, message: "File too large. Maximum 2MB allowed." });
  }

  if (err.name === "MulterError") {
    return res.status(400).json({ success: false, message: err.message });
  }

  const isProd = process.env.NODE_ENV === "production";
  const statusCode = err.statusCode || err.status || 500;

  res.status(statusCode).json({
    success: false,
    message: (statusCode === 500 && isProd) ? "Internal Server Error" : (err.message || "Internal Server Error"),
  });
});

// ──────────────────────────────────────
// START
// ──────────────────────────────────────
const PORT = process.env.PORT || 5001;
server.listen(PORT, () => console.log(`🔥 Server running on http://localhost:${PORT}`));