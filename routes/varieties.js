const express = require('express');
const router = express.Router();

router.get('/', (req, res) => {
  const varieties = {
    bases: ['Thin Crust', 'Thick Crust', 'Pan', 'Stuffed Crust', 'Gluten-Free'],
    sauces: ['Tomato', 'Pesto', 'Alfredo', 'Barbecue', 'Garlic'],
    cheeses: ['Mozzarella', 'Cheddar', 'Parmesan', 'Feta'],
    veggies: ['Mushrooms', 'Onions', 'Bell Peppers', 'Olives', 'Spinach'],
  };
  res.json(varieties);
});

module.exports = router;