const jwt = require('jsonwebtoken');
const BankAccount = require('../models/BankAccount');

/**
 * Kubera Auth Controller
 * Simple phone + PIN authentication → JWT token
 */

// POST /api/auth/login
async function login(req, res) {
  try {
    const { phone, pin } = req.body;

    if (!phone || !pin) {
      return res.status(400).json({
        success: false,
        message: 'Phone and PIN are required'
      });
    }

    const account = await BankAccount.findOne({ phone });

    if (!account) {
      return res.status(404).json({
        success: false,
        message: 'Account not found. Check your phone number.'
      });
    }

    // Plain text PIN comparison (demo only)
    if (account.pin !== pin) {
      return res.status(401).json({
        success: false,
        message: 'Invalid PIN'
      });
    }

    // Generate JWT
    const token = jwt.sign(
      {
        accountNumber: account.accountNumber,
        phone: account.phone,
        name: account.name,
        role: account.role
      },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    return res.json({
      success: true,
      message: 'Login successful',
      token,
      user: {
        accountNumber: account.accountNumber,
        name: account.name,
        phone: account.phone,
        email: account.email,
        role: account.role,
        avatar: account.avatar,
        balance: account.balance
      }
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: 'Server error',
      error: err.message
    });
  }
}

// POST /api/auth/register
async function register(req, res) {
  try {
    const { name, phone, pin, email } = req.body;

    if (!name || !phone || !pin) {
      return res.status(400).json({
        success: false,
        message: 'Name, phone, and PIN are required'
      });
    }

    // Check if phone already exists
    const existing = await BankAccount.findOne({ phone });
    if (existing) {
      return res.status(409).json({
        success: false,
        message: 'Phone number already registered'
      });
    }

    // Generate a unique account number
    const count = await BankAccount.countDocuments();
    const accountNumber = String(2000 + count + 1);

    const account = new BankAccount({
      accountNumber,
      name,
      phone,
      pin,
      email: email || '',
      balance: 5000, // Demo starting balance
      role: 'user'
    });

    await account.save();

    // Also create default SparePool, RoundUpSetting, and InvestmentAllocation
    const SparePool = require('../models/SparePool');
    const RoundUpSetting = require('../models/RoundUpSetting');
    const InvestmentAllocation = require('../models/InvestmentAllocation');

    await SparePool.create({ accountId: accountNumber });
    await RoundUpSetting.create({ accountId: accountNumber });
    await InvestmentAllocation.create({ accountId: accountNumber });

    // Generate JWT
    const token = jwt.sign(
      {
        accountNumber: account.accountNumber,
        phone: account.phone,
        name: account.name,
        role: account.role
      },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    return res.status(201).json({
      success: true,
      message: 'Account created successfully',
      token,
      user: {
        accountNumber: account.accountNumber,
        name: account.name,
        phone: account.phone,
        email: account.email,
        role: account.role,
        balance: account.balance
      }
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: 'Server error',
      error: err.message
    });
  }
}

// POST /api/auth/verify-pin  (for payment confirmation)
async function verifyPin(req, res) {
  try {
    const { pin } = req.body;
    const { accountNumber } = req.user;

    const account = await BankAccount.findOne({ accountNumber });
    if (!account) {
      return res.status(404).json({ success: false, message: 'Account not found' });
    }

    if (account.pin !== pin) {
      return res.status(401).json({ success: false, message: 'Invalid PIN' });
    }

    return res.json({ success: true, message: 'PIN verified' });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: 'Server error',
      error: err.message
    });
  }
}

module.exports = { login, register, verifyPin };
