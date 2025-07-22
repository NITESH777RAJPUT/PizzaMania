// routes/pizzas.js
const express = require('express');
const router = express.Router();
const Pizza = require('../models/Pizza');

// GET all pizzas
router.get('/', async (req, res) => {
  try {
    const pizzas = await Pizza.find();
    res.json(pizzas);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch pizzas' });
  }
});

// ADD pizza
router.post('/add', async (req, res) => {
  try {
    const pizza = new Pizza(req.body);
    await pizza.save();
    const pizzas = await Pizza.find();
    res.json(pizzas);
  } catch (err) {
    res.status(500).json({ error: 'Failed to add pizza' });
  }
});

// EDIT pizza
router.put('/edit', async (req, res) => {
  const { originalName, updatedPizza } = req.body;
  try {
    await Pizza.findOneAndUpdate({ name: originalName }, updatedPizza);
    const pizzas = await Pizza.find();
    res.json(pizzas);
  } catch (err) {
    res.status(500).json({ error: 'Failed to update pizza' });
  }
});

// DELETE pizza
router.delete('/delete', async (req, res) => {
  const { name } = req.body;
  try {
    await Pizza.findOneAndDelete({ name });
    const pizzas = await Pizza.find();
    res.json(pizzas);
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete pizza' });
  }
});

module.exports = router;
