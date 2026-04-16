const BankAccount = require('../models/BankAccount');
const Card = require('../models/Card');
const { generatePaymentQR } = require('../utils/qrcode');

/**
 * Kubera Bank Controller
 * Balance checks, account info, QR generation, card management
 */

// GET /api/bank/balance
async function getBalance(req, res) {
  try {
    const { accountNumber } = req.user;

    const account = await BankAccount.findOne({ accountNumber });
    if (!account) {
      return res.status(404).json({ success: false, message: 'Account not found' });
    }

    return res.json({
      success: true,
      balance: account.balance,
      name: account.name,
      accountNumber: account.accountNumber
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Server error', error: err.message });
  }
}

// GET /api/bank/account
async function getAccountInfo(req, res) {
  try {
    const { accountNumber } = req.user;

    const account = await BankAccount.findOne({ accountNumber });
    if (!account) {
      return res.status(404).json({ success: false, message: 'Account not found' });
    }

    return res.json({
      success: true,
      account: {
        accountNumber: account.accountNumber,
        name: account.name,
        phone: account.phone,
        email: account.email,
        balance: account.balance,
        role: account.role,
        avatar: account.avatar,
        createdAt: account.createdAt
      }
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Server error', error: err.message });
  }
}

// GET /api/bank/qr — Generate QR code for receiving payments
async function getMyQR(req, res) {
  try {
    const { accountNumber, name } = req.user;
    const qrDataUrl = await generatePaymentQR(accountNumber, name);

    return res.json({
      success: true,
      qr: qrDataUrl,
      accountNumber,
      name
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Server error', error: err.message });
  }
}

// GET /api/bank/qr/:accountNumber — Generate QR for a specific account (merchant display)
async function getQRForAccount(req, res) {
  try {
    const { accountNumber } = req.params;
    const { amount } = req.query;

    const account = await BankAccount.findOne({ accountNumber });
    if (!account) {
      return res.status(404).json({ success: false, message: 'Account not found' });
    }

    const qrDataUrl = await generatePaymentQR(
      accountNumber,
      account.name,
      amount ? Number(amount) : null
    );

    return res.json({
      success: true,
      qr: qrDataUrl,
      accountNumber,
      name: account.name,
      amount: amount ? Number(amount) : null
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Server error', error: err.message });
  }
}

// GET /api/bank/cards — Get user's cards
async function getCards(req, res) {
  try {
    const { accountNumber } = req.user;
    const cards = await Card.find({ accountId: accountNumber });

    return res.json({ success: true, cards });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Server error', error: err.message });
  }
}

// POST /api/bank/cards/toggle — Toggle card active/blocked
async function toggleCard(req, res) {
  try {
    const { cardNumber } = req.body;
    const { accountNumber } = req.user;

    const card = await Card.findOne({ cardNumber, accountId: accountNumber });
    if (!card) {
      return res.status(404).json({ success: false, message: 'Card not found' });
    }

    card.status = card.status === 'active' ? 'blocked' : 'active';
    await card.save();

    return res.json({
      success: true,
      message: `Card ${card.status === 'active' ? 'activated' : 'blocked'}`,
      card
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Server error', error: err.message });
  }
}

// GET /api/bank/contacts — Get list of recent payees / all merchants
async function getContacts(req, res) {
  try {
    const merchants = await BankAccount.find({ role: 'merchant' }).select(
      'accountNumber name phone avatar'
    );

    return res.json({ success: true, contacts: merchants });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Server error', error: err.message });
  }
}

// GET /api/bank/lookup/:identifier — Lookup account by phone or account number
async function lookupAccount(req, res) {
  try {
    const { identifier } = req.params;

    const account = await BankAccount.findOne({
      $or: [{ accountNumber: identifier }, { phone: identifier }]
    }).select('accountNumber name phone avatar role');

    if (!account) {
      return res.status(404).json({ success: false, message: 'Account not found' });
    }

    return res.json({ success: true, account });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Server error', error: err.message });
  }
}

module.exports = {
  getBalance,
  getAccountInfo,
  getMyQR,
  getQRForAccount,
  getCards,
  toggleCard,
  getContacts,
  lookupAccount
};
