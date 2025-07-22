const express = require('express');
const router = express.Router();
const Razorpay = require('razorpay');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Order = require('../models/Order');

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

const verifyToken = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'No token provided' });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.userId = decoded.id;
    req.userEmail = decoded.email;
    console.log("✅ Token verified:", decoded);
    next();
  } catch (err) {
    console.error('Token verification error:', err.message);
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
};

router.post('/create-order', async (req, res) => {
  const { amount } = req.body;
  if (!amount || isNaN(amount) || amount <= 0) {
    return res.status(400).json({ error: 'Valid amount is required' });
  }

  const options = {
    amount: Math.round(amount * 100),
    currency: 'INR',
    receipt: `receipt_order_${Date.now()}`,
  };

  try {
    const order = await razorpay.orders.create(options);
    console.log(`Created Razorpay order: ${order.id}`);
    res.json({ id: order.id, amount: order.amount / 100 });
  } catch (err) {
    console.error('Error creating Razorpay order:', err.message);
    res.status(500).json({ error: 'Error creating order', details: err.message });
  }
});

const simulateDelivery = (orderId) => {
  setTimeout(async () => {
    const order = await Order.findOne({ order_id: orderId });
    if (order?.status === 'Delivered') return; // 🔒 Stop if already marked as Delivered
    await Order.findOneAndUpdate({ order_id: orderId }, { status: 'Preparing' });
  }, 30 * 1000);

  setTimeout(async () => {
    const order = await Order.findOne({ order_id: orderId });
    if (order?.status === 'Delivered') return; // 🔒 Stop if already Delivered
    await Order.findOneAndUpdate({ order_id: orderId }, { status: 'Out for Delivery', deliveryProgress: 0 });

    let progress = 0;
    const interval = setInterval(async () => {
      progress += 10;
      const order = await Order.findOne({ order_id: orderId });
      if (order?.status === 'Delivered') {
        clearInterval(interval); // 🔒 Stop progress loop too
        return;
      }
      if (progress <= 100) {
        await Order.findOneAndUpdate({ order_id: orderId }, { deliveryProgress: progress });
      }
      if (progress >= 100) {
        clearInterval(interval);
        await Order.findOneAndUpdate({ order_id: orderId }, { status: 'Delivered' });
      }
    }, 5 * 60 * 1000);
  }, 2 * 60 * 1000);
};


router.post('/confirm-payment', verifyToken, async (req, res) => {
  const { order_id, payment_id, userEmail, pizza_details, address, totalPrice, useSavedAddress } = req.body;

  if (!order_id || !payment_id || !pizza_details || totalPrice === undefined) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  let finalAddress = address;

  if (useSavedAddress && userEmail !== 'guest@example.com') {
    try {
      const user = await User.findOne({ email: userEmail });
      if (user?.address?.name) {
        finalAddress = user.address;
      } else {
        return res.status(400).json({ error: 'No saved address found' });
      }
    } catch (error) {
      return res.status(500).json({ error: 'Error fetching saved address', details: error.message });
    }
  } else if (!address || !address.name || !address.phone || !address.street || !address.city || !address.pincode) {
    return res.status(400).json({ error: 'Invalid address' });
  }

  try {
    const newOrder = new Order({
      order_id,
      payment_id,
      userEmail: userEmail || 'guest@example.com',
      pizza_details,
      address: finalAddress,
      totalPrice,
      status: 'Order Placed',
    });

    await newOrder.save();
    console.log(`Order saved: ${order_id} for ${userEmail}`);

    simulateDelivery(order_id);

    if (!useSavedAddress && userEmail !== 'guest@example.com') {
      try {
        await User.findOneAndUpdate({ email: userEmail }, { address: finalAddress }, { new: true });
        console.log(`Address saved for ${userEmail}`);
      } catch (err) {
        console.warn('Error saving address:', err.message);
      }
    }

    res.status(200).json({ message: 'Order confirmed', order: newOrder });
  } catch (error) {
    console.error('Error saving order:', error.message);
    res.status(500).json({ error: 'Error saving order', details: error.message });
  }
});

router.get('/:email', verifyToken, async (req, res) => {
  try {
    const email = decodeURIComponent(req.params.email);
    if (email !== req.userEmail) {
      return res.status(403).json({ error: 'Unauthorized to access these orders' });
    }

    const orders = await Order.find({ userEmail: email }).sort({ createdAt: -1 });
    res.json(orders);
  } catch (error) {
    console.error('Error fetching orders:', error.message);
    res.status(500).json({ error: 'Failed to fetch user orders', details: error.message });
  }
});

router.get('/status/:orderId', verifyToken, async (req, res) => {
  try {
    const order = await Order.findOne({ order_id: req.params.orderId });
    if (!order) return res.status(404).json({ error: 'Order not found' });
    if (order.userEmail !== req.userEmail) return res.status(403).json({ error: 'Unauthorized' });
    res.json(order);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch order status' });
  }
});

router.get('/admin/orders', async (req, res) => {
  try {
    const orders = await Order.find().sort({ createdAt: -1 });
    res.json(orders);
  } catch (err) {
    console.error('Error fetching all orders:', err.message);
    res.status(500).json({ error: 'Failed to fetch all orders', details: err.message });
  }
});

router.put('/admin/orders/:orderId/status', async (req, res) => {
  const { orderId } = req.params;
  const { status } = req.body;
  if (!status) return res.status(400).json({ error: 'Status is required' });

  try {
    const updatedOrder = await Order.findOneAndUpdate(
      { order_id: orderId },
      { status },
      { new: true }
    );
    if (!updatedOrder) return res.status(404).json({ error: 'Order not found' });
    res.json(updatedOrder);
  } catch (err) {
    console.error('Error updating order status:', err.message);
    res.status(500).json({ error: 'Failed to update order status', details: err.message });
  }
});

router.put('/admin/orders/:orderId/progress', async (req, res) => {
  const { orderId } = req.params;
  const { deliveryProgress } = req.body;

  if (deliveryProgress === undefined || isNaN(deliveryProgress)) {
    return res.status(400).json({ error: 'Valid deliveryProgress is required' });
  }

  try {
    const updatedOrder = await Order.findOneAndUpdate(
      { order_id: orderId },
      { deliveryProgress },
      { new: true }
    );
    if (!updatedOrder) return res.status(404).json({ error: 'Order not found' });
    res.json({ message: 'Delivery progress updated', progress: deliveryProgress });
  } catch (err) {
    console.error('Error updating delivery progress:', err.message);
    res.status(500).json({ error: 'Failed to update delivery progress', details: err.message });
  }
});

router.put('/user/:orderId/status', async (req, res) => {
  const { orderId } = req.params;
  const { status } = req.body;
  if (!status) return res.status(400).json({ error: 'Status is required' });

  try {
    const updatedOrder = await Order.findOneAndUpdate(
      { order_id: orderId },
      { status },
      { new: true }
    );
    if (!updatedOrder) return res.status(404).json({ error: 'Order not found' });
    res.json(updatedOrder);
  } catch (err) {
    console.error('Error updating user order status:', err.message);
    res.status(500).json({ error: 'Failed to update user order status', details: err.message });
  }
});

router.get('/admin/summary', async (req, res) => {
  try {
    const totalOrders = await Order.countDocuments();
    const totalRevenueData = await Order.aggregate([
      { $group: { _id: null, total: { $sum: '$totalPrice' } } },
    ]);
    const totalRevenue = totalRevenueData[0]?.total || 0;
    res.json({ totalOrders, totalRevenue });
  } catch (err) {
    console.error('Error fetching summary:', err.message);
    res.status(500).json({ error: 'Failed to fetch summary', details: err.message });
  }
});

// ✅ Feedback route
router.post('/feedback/:order_id', async (req, res) => {
  const { rating } = req.body;

  if (!rating || isNaN(rating) || rating < 1 || rating > 5) {
    return res.status(400).json({ error: 'Invalid rating. Must be 1-5 stars.' });
  }

  try {
    const order = await Order.findOne({ order_id: req.params.order_id });

    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    order.feedback = rating;
    await order.save();

    res.status(200).json({ message: 'Feedback saved successfully', feedback: rating });
  } catch (error) {
    console.error('Error saving feedback:', error.message);
    res.status(500).json({ error: 'Failed to save feedback', details: error.message });
  }
});

module.exports = router;
