const express = require('express');
const router = express.Router();
const { getSettings, updateSettings } = require('../controllers/settingsController');
const auth = require('../middleware/auth');

router.get('/', auth, getSettings);
router.post('/update', auth, updateSettings);

module.exports = router;
