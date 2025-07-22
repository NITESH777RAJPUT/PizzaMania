const express = require('express');
const router = express.Router();
const Cart = require('../models/Cart');
const jwt = require('jsonwebtoken');

// --- Middleware to verify token ---
const verifyToken = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'No token provided' });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log('Decoded token:', decoded); // ✅ Debug log

    if (!decoded.id) return res.status(400).json({ error: 'Invalid token payload' });

    req.userId = decoded.id;
    next();
  } catch (err) {
    console.error('Token verification error:', err.message);
    res.status(401).json({ error: 'Invalid or expired token' });
  }
};

// --- GET: Fetch Cart ---
router.get('/', verifyToken, async (req, res) => {
  try {
    const cart = await Cart.findOne({ userId: req.userId });
    res.json(cart || { items: [] });
  } catch (err) {
    console.error('Error fetching cart:', err.message);
    res.status(500).json({ error: 'Failed to fetch cart', details: err.message });
  }
});

// --- POST: Add Item to Cart ---
router.post('/add', verifyToken, async (req, res) => {
  const { pizzaName, price, quantity, size, image } = req.body;

  const parsedPrice = Number(price);
  if (!pizzaName || isNaN(parsedPrice) || !Number.isInteger(quantity) || quantity < 1 || !size) {
    return res.status(400).json({ error: 'Missing or invalid required fields' });
  }

  try {
    let cart = await Cart.findOne({ userId: req.userId });
    if (!cart) {
      cart = new Cart({ userId: req.userId, items: [] });
    }

    // ✅ Push the new item into the cart
    cart.items.push({ pizzaName, price: parsedPrice, quantity, size, image });
    cart.updatedAt = Date.now();

    console.log('Saving cart:', cart); // ✅ Debug log
    await cart.save();
    res.json(cart);
  } catch (err) {
    console.error('Error adding to cart:', err.message);
    res.status(500).json({ error: 'Failed to add to cart', details: err.message });
  }
});

// --- PUT: Update Cart Item Quantity ---
router.put('/update', verifyToken, async (req, res) => {
  const { pizzaName, size, quantity } = req.body;

  if (!pizzaName || !size || !Number.isInteger(quantity) || quantity < 1) {
    return res.status(400).json({ error: 'Missing or invalid required fields' });
  }

  try {
    const cart = await Cart.findOne({ userId: req.userId });
    if (!cart) return res.status(404).json({ error: 'Cart not found' });

    const itemIndex = cart.items.findIndex(item => item.pizzaName === pizzaName && item.size === size);
    if (itemIndex === -1) return res.status(404).json({ error: 'Item not found' });

    cart.items[itemIndex].quantity = quantity;
    cart.updatedAt = Date.now();

    await cart.save();
    res.json(cart);
  } catch (err) {
    console.error('Error updating cart:', err.message);
    res.status(500).json({ error: 'Failed to update cart', details: err.message });
  }
});

// --- DELETE: Remove Item from Cart ---
router.delete('/remove', verifyToken, async (req, res) => {
  const { pizzaName, size } = req.body;

  if (!pizzaName || !size) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  try {
    const cart = await Cart.findOne({ userId: req.userId });
    if (!cart) return res.status(404).json({ error: 'Cart not found' });

    cart.items = cart.items.filter(item => !(item.pizzaName === pizzaName && item.size === size));
    cart.updatedAt = Date.now();

    await cart.save();
    res.json(cart);
  } catch (err) {
    console.error('Error removing from cart:', err.message);
    res.status(500).json({ error: 'Failed to remove from cart', details: err.message });
  }
});

// --- DELETE: Clear Cart ---
router.delete('/clear', verifyToken, async (req, res) => {
  try {
    const cart = await Cart.findOne({ userId: req.userId });
    if (!cart) return res.status(404).json({ error: 'Cart not found' });

    cart.items = [];
    cart.updatedAt = Date.now();

    await cart.save();
    res.json(cart);
  } catch (err) {
    console.error('Error clearing cart:', err.message);
    res.status(500).json({ error: 'Failed to clear cart', details: err.message });
  }
});

module.exports = router;
