// server/models/Inventory.js
const mongoose = require('mongoose');

const itemSchema = new mongoose.Schema({
  name: { type: String, required: true },
  quantity: { type: Number, required: true, default: 20 },
});

const inventorySchema = new mongoose.Schema({
  base: [itemSchema],
  sauce: [itemSchema],
  cheese: [itemSchema],
  veggies: [itemSchema],
  meat: [itemSchema],
});

const Inventory = mongoose.model('Inventory', inventorySchema);

module.exports = Inventory;