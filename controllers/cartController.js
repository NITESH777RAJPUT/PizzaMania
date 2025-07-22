const Cart = require('../models/Cart');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

const verifyToken = async (req, res) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) {
    return { error: res.status(401).json({ message: 'No token provided' }) };
  }
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id);
    if (!user) {
      return { error: res.status(401).json({ message: 'User not found' }) };
    }
    return { user: { id: decoded.id, email: user.email } };
  } catch (error) {
    return { error: res.status(401).json({ message: 'Invalid token' }) };
  }
};

exports.getCart = async (req, res) => {
  const auth = await verifyToken(req, res);
  if (auth.error) return auth.error;
  try {
    const cart = await Cart.findOne({ userId: auth.user.id });
    if (!cart) return res.status(200).json({ items: [] });
    res.status(200).json(cart);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching cart', error });
  }
};

exports.addToCart = async (req, res) => {
  const auth = await verifyToken(req, res);
  if (auth.error) return auth.error;

  const { pizzaName, price, quantity, size, image } = req.body;

  // Validate required fields
  if (!pizzaName || price === undefined || price === null) {
    return res.status(400).json({ message: 'Missing required pizza details' });
  }

  try {
    let cart = await Cart.findOne({ userId: auth.user.id });

    // If no cart exists, create a new one
    if (!cart) {
      cart = new Cart({ userId: auth.user.id, items: [] });
    }

    const itemIndex = cart.items.findIndex(
      (item) => item.pizzaName === pizzaName && item.size === size
    );

    const qtyToAdd = Number(quantity) > 0 ? Number(quantity) : 1;

    if (itemIndex > -1) {
      // If item already exists, update quantity
      cart.items[itemIndex].quantity += qtyToAdd;
    } else {
      // Add new item
      cart.items.push({
        pizzaName,
        price,
        quantity: qtyToAdd,
        size: size || 'medium',
        image: image || '',
      });
    }

    cart.updatedAt = Date.now();
    await cart.save();

    res.status(200).json({ message: 'Item added to cart', cart });
  } catch (error) {
    console.error('🔥 Error adding to cart:', error.message);
    res.status(500).json({ message: 'Error adding to cart', error: error.message });
  }
};


exports.removeFromCart = async (req, res) => {
  const auth = await verifyToken(req, res);
  if (auth.error) return auth.error;
  const { pizzaName, size } = req.body;
  try {
    const cart = await Cart.findOne({ userId: auth.user.id });
    if (!cart) return res.status(404).json({ message: 'Cart not found' });
    cart.items = cart.items.filter((item) => !(item.pizzaName === pizzaName && item.size === size));
    cart.updatedAt = Date.now();
    await cart.save();
    res.status(200).json(cart);
  } catch (error) {
    res.status(500).json({ message: 'Error removing from cart', error });
  }
};

exports.clearCart = async (req, res) => {
  const auth = await verifyToken(req, res);
  if (auth.error) return auth.error;
  try {
    const cart = await Cart.findOne({ userId: auth.user.id });
    if (!cart) return res.status(404).json({ message: 'Cart not found' });
    cart.items = [];
    cart.updatedAt = Date.now();
    await cart.save();
    res.status(200).json({ message: 'Cart cleared', items: [] });
  } catch (error) {
    res.status(500).json({ message: 'Error clearing cart', error });
  }
};