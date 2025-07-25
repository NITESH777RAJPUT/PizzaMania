const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },

  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true
  },

  password: {
    type: String,
    default: '', // For Google users
  },

  photo: {
    type: String,
    default: '/images/default-user.png',
  },

  address: {
    name: String,
    phone: String,
    street: String,
    city: String,
    pincode: String,
  },

  // ✅ Email Verification
  isVerified: {
    type: Boolean,
    default: false,
  },
  verificationToken: String,

  // ✅ Forgot Password
  resetToken: String,
  resetTokenExpiry: Date,

  // ✅ Google Login
  isGoogleUser: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true // Automatically adds createdAt & updatedAt
});

module.exports = mongoose.model('User', userSchema);
