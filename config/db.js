require('dotenv').config(); // Top pe honi chahiye
const mongoose = require('mongoose');
console.log('MONGO_URI:', process.env.MONGO_URI); // Debug ke liye add karo

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('MongoDB connected successfully');
  } catch (error) {
    console.error('MongoDB connection error:', error.message);
    process.exit(1);
  }
};

module.exports = connectDB;