
const express = require('express');
const router = express.Router();
const User = require('../models/User');

// Get profile by email
router.get('/:email', async (req, res) => {
  try {
    const user = await User.findOne({ email: req.params.email });
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json(user);
  } catch (err) {
    console.error('Error fetching profile:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Update profile
router.put('/:email', async (req, res) => {
  const { name, photo } = req.body;
  try {
    let user = await User.findOneAndUpdate(
      { email: req.params.email },
      { $set: { name, photo } },
      { new: true, upsert: true }
    );
    res.json(user);
  } catch (err) {
    console.error('Error updating profile:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Save or update user address
router.post('/:email/address', async (req, res) => {
  try {
    const { email } = req.params;
    const { address } = req.body;
    if (!address || !address.name || !address.phone || !address.street || !address.city || !address.pincode) {
      return res.status(400).json({ error: 'All address fields are required' });
    }
    const user = await User.findOneAndUpdate(
      { email },
      { $set: { address } },
      { new: true }
    );
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json({ message: 'Address saved successfully', user });
  } catch (err) {
    console.error('Error saving address:', err);
    res.status(500).json({ error: 'Failed to save address' });
  }
});

module.exports = router;
