// 📁 backend/routes/auth.js
const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const nodemailer = require('nodemailer');
const User = require('../models/User');
require('dotenv').config();

const router = express.Router();

// ✅ Nodemailer Gmail SMTP setup
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.ALERT_EMAIL,
    pass: process.env.ALERT_PASSWORD
  }
});

// ✅ Test transporter
transporter.verify((error, success) => {
  if (error) {
    console.error('❌ Email transporter failed:', error);
  } else {
    console.log('✅ Email transporter ready');
  }
});

// ✅ REGISTER
router.post('/register', async (req, res) => {
  const { name, email, password } = req.body;
  try {
    const existingUser = await User.findOne({ email });
    if (existingUser) return res.status(400).json({ message: 'User already exists please log in' });

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await User.create({
      name,
      email,
      password: hashedPassword,
    });

    res.status(201).json({ message: 'User registered successfully' });
  } catch (error) {
    console.error('❌ Register error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// ✅ LOGIN
router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ message: 'Invalid credentials ' });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ message: 'Invalid credentials' });

    const tokenPayload = { id: user._id, email: user.email };
    const token = jwt.sign(tokenPayload, process.env.JWT_SECRET, { expiresIn: '1d' });

    res.status(200).json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        photo: user.photo
      }
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// ✅ FORGOT PASSWORD
router.post('/forgot-password', async (req, res) => {
  const { email } = req.body;
  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: 'User not found' });

    const resetToken = crypto.randomBytes(20).toString('hex');
    user.resetToken = resetToken;
    user.resetTokenExpiry = Date.now() + 3600000; // 1 hour
    await user.save();

    const resetLink = `https://pizzamania-0igb.onrender.com/reset-password/${resetToken}`;
    const mailOptions = {
      from: process.env.ALERT_EMAIL,
      to: email,
      subject: 'Reset your password',
      html: `<p>Click <a href="${resetLink}">here</a> to reset your password.</p>`
    };

    try {
      await transporter.sendMail(mailOptions);
      res.status(200).json({ message: 'Password reset email sent' });
    } catch (err) {
      console.error('❌ Email send error:', err);
      res.status(500).json({ message: 'Failed to send reset email', error: err.message });
    }
  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// ✅ RESET PASSWORD
router.post('/reset-password/:token', async (req, res) => {
  const { password } = req.body;
  try {
    const user = await User.findOne({
      resetToken: req.params.token,
      resetTokenExpiry: { $gt: Date.now() }
    });

    if (!user) return res.status(400).json({ message: 'Invalid or expired token' });

    const hashedPassword = await bcrypt.hash(password, 10);
    user.password = hashedPassword;
    user.resetToken = null;
    user.resetTokenExpiry = null;
    await user.save();

    res.status(200).json({ message: 'Password reset successful' });
  } catch (error) {
    console.error('❌ Reset password error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// ✅ GOOGLE LOGIN
router.post('/google-login', async (req, res) => {
  const { email, name, picture } = req.body;
  try {
    let user = await User.findOne({ email });
    if (!user) {
      user = await User.create({
        name,
        email,
        password: '',
        photo: picture
      });
    }

    const tokenPayload = { id: user._id, email: user.email };
    const token = jwt.sign(tokenPayload, process.env.JWT_SECRET, { expiresIn: '1d' });

    res.status(200).json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        picture: user.photo
      }
    });
  } catch (err) {
    console.error('Google login error:', err);
    res.status(500).json({ message: 'Google login failed', error: err.message });
  }
});

module.exports = router;
