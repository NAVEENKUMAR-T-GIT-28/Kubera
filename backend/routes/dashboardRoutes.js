const express = require('express');
const router = express.Router();
const { getDashboard } = require('../controllers/dashboardController');
const auth = require('../middleware/auth');

router.get('/', auth, getDashboard);

module.exports = router;
