const express = require("express");
const cors = require("cors");
const connectDB = require("./db");
const authRoutes = require("./routes/Auth");
const orderRoutes = require("./routes/Order");
const userRoutes = require("./routes/User");
const inventoryRoutes = require("./routes/Inventory");
const paymentRoutes = require("./routes/Payment");

require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 5000;

// ✅ Allow only specific origins for CORS
const allowedOrigins = [
  "http://localhost:3000", // Local development
  "https://pizzato-mania.vercel.app" // Vercel deployed frontend
];

app.use(cors({
  origin: function (origin, callback) {
    if (!origin) return callback(null, true); // Allow mobile apps or curl
    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    } else {
      return callback(new Error("Not allowed by CORS"));
    }
  },
  credentials: true
}));

// Built-in middlewares
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Database connection
connectDB();

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/users", userRoutes);
app.use("/api/inventory", inventoryRoutes);
app.use("/api/payment", paymentRoutes);

// Root route
app.get("/", (req, res) => {
  res.send("Pizza API is running 🍕");
});

// Start the server
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
