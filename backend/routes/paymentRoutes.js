const express = require('express');
const router = express.Router();
const { pay, getHistory, previewPayment } = require('../controllers/paymentController');
const auth = require('../middleware/auth');

// All payment routes are protected
router.post('/pay', auth, pay);
router.get('/history', auth, getHistory);
router.post('/preview', auth, previewPayment);

module.exports = router;
