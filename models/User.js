const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: String,
  email: { type: String, unique: true },
  password: String,
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
  // ✅ Email Verification Fields
  isVerified: {
    type: Boolean,
    default: false,
  },
  verificationToken: String,

  // ✅ Forgot Password Fields
  resetToken: String,
  resetTokenExpiry: Date,
});

module.exports = mongoose.model('User', userSchema);
