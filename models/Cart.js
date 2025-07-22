const mongoose = require('mongoose');

const cartSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  items: [
    {
      pizzaName: { type: String, required: true },
      price: { type: Number, required: true },
      quantity: { type: Number, default: 1 },
      size: { type: String, default: 'medium' },
      image: { type: String },
    },
  ],
  updatedAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('Cart', cartSchema);