const express = require('express');
const router = express.Router();
const {
  getBalance,
  getAccountInfo,
  getMyQR,
  getQRForAccount,
  getCards,
  toggleCard,
  getContacts,
  lookupAccount
} = require('../controllers/bankController');
const auth = require('../middleware/auth');

// All bank routes are protected
router.get('/balance', auth, getBalance);
router.get('/account', auth, getAccountInfo);
router.get('/qr', auth, getMyQR);
router.get('/qr/:accountNumber', auth, getQRForAccount);
router.get('/cards', auth, getCards);
router.post('/cards/toggle', auth, toggleCard);
router.get('/contacts', auth, getContacts);
router.get('/lookup/:identifier', auth, lookupAccount);

module.exports = router;
