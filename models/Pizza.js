// models/Pizza.js
const mongoose = require('mongoose');

const pizzaSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true },
  price: { type: Number, required: true },
  image: { type: String, required: true },
  rating: { type: Number, default: 0 },
  reviews: { type: Number, default: 0 },
  isVeg: { type: Boolean, default: true },
}, { timestamps: true });

module.exports = mongoose.model('Pizza', pizzaSchema);
