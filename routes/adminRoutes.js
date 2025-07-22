const express = require('express');
const router = express.Router();
const { adminLogin, adminRegister } = require('../controllers/adminController');

router.post('/login', adminLogin);
router.post('/register', adminRegister);

module.exports = router;
