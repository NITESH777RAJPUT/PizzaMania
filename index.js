const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();
const connectDB = require('./config/db');

// Import route files
const varietiesRouter = require('./routes/varieties');
const orderRouter = require('./routes/order');
const authRoutes = require('./routes/auth');
const adminRoutes = require('./routes/adminRoutes');
const profileRoutes = require('./routes/profile');
const uploadRoutes = require('./routes/upload');
const cartRoutes = require('./routes/cart');
const inventoryRoutes = require('./routes/inventory');
const pizzaRoutes = require('./routes/pizzas');

const app = express();

// Connect to MongoDB
connectDB().then(() => {
  console.log('✅ MongoDB connected successfully');
}).catch((err) => {
  console.error('❌ MongoDB connection failed:', err.message);
  process.exit(1); // Exit process if MongoDB connection fails
});

// Middlewares
app.use(express.json());
const allowedOrigins = [
  'http://localhost:3000',
  'https://pizzato-mania.vercel.app'
];

app.use(cors({
  origin: function (origin, callback) {
    // allow requests with no origin (like mobile apps or curl)
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    } else {
      return callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
}));

app.use('/uploads', express.static(path.join(__dirname, 'Uploads'))); // Serve uploaded images

// API Routes
app.use('/api/auth', authRoutes);               // Login/Register
app.use('/api/admin', adminRoutes);             // Admin dashboard & summary
app.use('/api/varieties', varietiesRouter);     // Pizza bases, sauces, etc.
app.use('/api/orders', orderRouter);            // All order-related endpoints
app.use('/api/profile', profileRoutes);         // User profile and address
app.use('/api/upload', uploadRoutes);           // Image upload route
app.use('/api/cart', cartRoutes);               // Cart operations
app.use('/api/inventory', inventoryRoutes);     // Inventory for admin
app.use('/api/pizzas', pizzaRoutes);            // Pizza data

// Health Check
app.get('/', (req, res) => {
  res.send('🍕 Pizza Delivery API is running!');
});

// Global Error Handling Middleware
app.use((err, req, res, next) => {
  console.error('❌ Server Error:', err.stack);
  res.status(500).json({
    error: 'Something went wrong on the server',
    details: process.env.NODE_ENV === 'development' ? err.message : 'Internal Server Error'
  });
});

// Start Server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`✅ Server running on http://localhost:${PORT}`);
});

// Ensure .env contains:
// MONGO_URI=mongodb://localhost:27017/pizza-mania
// JWT_SECRET=your-secret-key
// RAZORPAY_KEY_ID=your-razorpay-key-id
// RAZORPAY_KEY_SECRET=your-razorpay-key-secret
// ALERT_EMAIL=your-email@gmail.com
// ALERT_PASSWORD=your-email-password
// ADMIN_EMAIL=admin-email@example.com