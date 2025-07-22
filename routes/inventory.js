const express = require('express');
const router = express.Router();
const Inventory = require('../models/Inventory');
const nodemailer = require('nodemailer');

// Store already alerted items in-memory (to avoid spam)
const lowStockAlerts = new Set();

// GET: Get inventory
router.get('/', async (req, res) => {
  try {
    console.log('Fetching inventory...');
    const inventory = await Inventory.findOne();

    if (!inventory) {
      console.log('No inventory found, creating default...');
      const defaultInventory = new Inventory({
        base: [],
        sauce: [],
        cheese: [],
        veggies: [],
        meat: [],
      });
      await defaultInventory.save();
      return res.status(200).json(defaultInventory); // Return the newly created inventory
    }

    console.log('Inventory fetched successfully:', inventory);
    res.status(200).json(inventory);
  } catch (err) {
    console.error('Fetch inventory error:', err.stack);
    res.status(500).json({ error: 'Server error while fetching inventory', details: err.message });
  }
});

// POST: Add item
router.post('/add', async (req, res) => {
  const { category, value } = req.body;
  try {
    console.log(`Adding item to category ${category}: ${value}`);
    const inventory = await Inventory.findOne();
    if (!inventory || !inventory[category]) {
      console.log('Invalid category or inventory not found');
      return res.status(400).json({ error: 'Invalid category' });
    }

    inventory[category].push({ name: value, quantity: 20 });
    await inventory.save();
    console.log('Item added successfully');
    res.status(200).json(inventory);
  } catch (err) {
    console.error('Add item error:', err.stack);
    res.status(500).json({ error: 'Failed to add item', details: err.message });
  }
});

// PUT: Edit item name
router.put('/edit', async (req, res) => {
  const { category, oldValue, newValue } = req.body;
  try {
    console.log(`Editing item ${oldValue} to ${newValue} in ${category}`);
    const inventory = await Inventory.findOne();
    if (!inventory || !inventory[category]) {
      console.log('Invalid category or inventory not found');
      return res.status(400).json({ error: 'Invalid category' });
    }

    const index = inventory[category].findIndex(item => item.name === oldValue);
    if (index === -1) {
      console.log('Item not found');
      return res.status(404).json({ error: 'Item not found' });
    }

    inventory[category][index].name = newValue;
    await inventory.save();
    console.log('Item edited successfully');
    res.status(200).json(inventory);
  } catch (err) {
    console.error('Edit error:', err.stack);
    res.status(500).json({ error: 'Edit failed', details: err.message });
  }
});

// PUT: Update quantity
router.put('/update-quantity', async (req, res) => {
  const { category, itemName, change } = req.body;
  try {
    console.log(`Updating quantity for ${itemName} in ${category} by ${change}`);
    const inventory = await Inventory.findOne();
    if (!inventory || !inventory[category]) {
      console.log('Invalid category or inventory not found');
      return res.status(400).json({ error: 'Invalid category' });
    }

    const index = inventory[category].findIndex(item => item.name === itemName);
    if (index === -1) {
      console.log('Item not found');
      return res.status(404).json({ error: 'Item not found' });
    }

    inventory[category][index].quantity += parseInt(change) || 0; // Ensure change is a number
    if (inventory[category][index].quantity < 0) {
      inventory[category][index].quantity = 0;
    }

    await inventory.save();

    // Trigger email alert once if stock < 10
    const key = `${category}-${itemName}`;
    if (inventory[category][index].quantity < 10 && !lowStockAlerts.has(key)) {
      console.log(`Low stock detected for ${itemName}, sending alert`);
      sendEmailAlert(`⚠️ Stock for "${itemName}" in category "${category}" is below 10. Current quantity: ${inventory[category][index].quantity}`);
      lowStockAlerts.add(key);
    }

    console.log('Quantity updated successfully');
    res.status(200).json(inventory);
  } catch (err) {
    console.error('Update quantity error:', err.stack);
    res.status(500).json({ error: 'Quantity update failed', details: err.message });
  }
});

// Email alert function
function sendEmailAlert(message) {
  try {
    console.log('Setting up email transporter...');
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.ALERT_EMAIL || 'default-email@gmail.com', // Fallback for testing
        pass: process.env.ALERT_PASSWORD || 'default-password', // Fallback for testing
      },
    });

    const mailOptions = {
      from: process.env.ALERT_EMAIL || 'default-email@gmail.com',
      to: process.env.ADMIN_EMAIL || 'admin@example.com',
      subject: '🍕 Inventory Low Stock Alert',
      text: message,
    };

    console.log('Sending email...', mailOptions);
    transporter.sendMail(mailOptions, (err, info) => {
      if (err) {
        console.error('❌ Email error:', err.stack);
      } else {
        console.log('✅ Email sent:', info.response);
      }
    });
  } catch (err) {
    console.error('Email setup error:', err.stack);
  }
}

module.exports = router;