const express = require('express');
const router = express.Router();
const { login, register, verifyPin } = require('../controllers/authController');
const auth = require('../middleware/auth');

// Public routes
router.post('/login', login);
router.post('/register', register);

// Protected route (needs JWT)
router.post('/verify-pin', auth, verifyPin);

module.exports = router;
