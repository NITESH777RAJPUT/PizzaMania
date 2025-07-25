const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();
const connectDB = require('./config/db');

// Route files
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

// Connect MongoDB
connectDB()
  .then(() => console.log('✅ MongoDB connected successfully'))
  .catch((err) => {
    console.error('❌ MongoDB connection failed:', err.message);
    process.exit(1);
  });

// Middlewares
app.use(express.json());

const allowedOrigins = [
  'http://localhost:3000',
  'https://pizzato-mania.vercel.app'
];

app.use(cors({
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
}));

// Static files to serve uploaded images
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/varieties', varietiesRouter);
app.use('/api/orders', orderRouter);
app.use('/api/profile', profileRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/inventory', inventoryRoutes);
app.use('/api/pizzas', pizzaRoutes);

// Health check route
app.get('/', (req, res) => {
  res.send('🍕 PizzaMania backend is running!');
});

// Error handling
app.use((err, req, res, next) => {
  console.error('❌ Server Error:', err.stack);
  res.status(500).json({
    error: 'Something went wrong on the server',
    details: process.env.NODE_ENV === 'development' ? err.message : 'Internal Server Error'
  });
});

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`✅ Server is running on http://localhost:${PORT}`);
});
