const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
  order_id: { type: String, required: true, unique: true },
  payment_id: { type: String, required: true },
  userEmail: { type: String, default: 'guest@example.com' },
  pizza_details: {
    selectedBase: String,
    selectedSauce: String,
    selectedCheese: String,
    selectedVeggies: [String],
    size: String,
    quantity: Number,
    cartItems: Array,
  },
  address: {
    name: String,
    phone: String,
    street: String,
    city: String,
    pincode: String,
  },
  totalPrice: { type: Number, required: true },
  status: {
    type: String,
    default: 'Order Placed',
    enum: ['Order Placed', 'Preparing', 'Out for Delivery', 'Delivered', 'Cancelled']
  },
  deliveryProgress: {
    type: Number,
    default: 0
  },
  feedback: {
    type: Number,
    min: 1,
    max: 5,
    default: null
  },
  createdAt: { type: Date, default: Date.now },
});

const Order = mongoose.model('Order', orderSchema);

module.exports = Order;
