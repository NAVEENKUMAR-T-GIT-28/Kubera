const express = require('express');
const router = express.Router();
const { getAllocation, updateAllocation, investNow } = require('../controllers/investmentController');
const auth = require('../middleware/auth');

router.get('/', auth, getAllocation);
router.post('/allocate', auth, updateAllocation);
router.post('/invest-now', auth, investNow);

module.exports = router;
