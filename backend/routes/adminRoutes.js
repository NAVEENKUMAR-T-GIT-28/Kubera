const express = require('express');
const router = express.Router();
const { getOverview, getDeepAnalytics } = require('../controllers/adminController');

// For hackathon simplicity, we are not adding an admin token middleware gate.
// If needed, we could import auth middleware and role checking here.
router.get('/overview', getOverview);
router.get('/deep-analytics', getDeepAnalytics);

module.exports = router;
