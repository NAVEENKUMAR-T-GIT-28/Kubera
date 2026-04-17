const express = require('express');
const router = express.Router();
const { getAllocation, updateAllocation, investNow, getPortfolio, sellAsset, getAnalytics } = require('../controllers/investmentController');
const auth = require('../middleware/auth');

router.get('/', auth, getAllocation);
router.post('/allocate', auth, updateAllocation);
router.post('/invest-now', auth, investNow);
router.get('/portfolio', auth, getPortfolio);
router.post('/sell', auth, sellAsset);
router.get('/analytics', auth, getAnalytics);

module.exports = router;
