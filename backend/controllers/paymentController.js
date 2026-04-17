const BankAccount = require('../models/BankAccount');
const Transaction = require('../models/Transaction');
const SparePool = require('../models/SparePool');
const RoundUpSetting = require('../models/RoundUpSetting');
const InvestmentAllocation = require('../models/InvestmentAllocation');
const { getSpare } = require('../utils/roundup');
const { parsePaymentQR } = require('../utils/qrcode');

/**
 * Kubera Payment Controller
 * Core payment flow with round-up engine integration
 *
 * Flow:
 * 1. Validate sender account + PIN
 * 2. Fetch round-up settings
 * 3. Calculate spare change
 * 4. Total debit = amount + spare
 * 5. Deduct from sender
 * 6. Credit receiver
 * 7. Save transaction records (debit + credit)
 * 8. Add spare → SparePool
 * 9. Check threshold → trigger auto-invest
 */

// POST /api/payment/pay
async function pay(req, res) {
  try {
    const { toAccount, amount, pin, category, note, qrData, customRoundUp } = req.body;
    const { accountNumber: fromAccount } = req.user;

    // Resolve receiver from QR data if provided
    let receiverAccountNumber = toAccount;
    if (qrData && !toAccount) {
      const parsed = parsePaymentQR(qrData);
      receiverAccountNumber = parsed.accountNumber;
    }

    if (!receiverAccountNumber || !amount || !pin) {
      return res.status(400).json({
        success: false,
        message: 'Recipient, amount, and PIN are required'
      });
    }

    if (amount <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Amount must be greater than 0'
      });
    }

    if (fromAccount === receiverAccountNumber) {
      return res.status(400).json({
        success: false,
        message: 'Cannot pay yourself'
      });
    }

    // Step 1: Validate sender
    const sender = await BankAccount.findOne({ accountNumber: fromAccount });
    if (!sender) {
      return res.status(404).json({ success: false, message: 'Sender account not found' });
    }
    if (sender.pin !== pin) {
      return res.status(401).json({ success: false, message: 'Invalid PIN' });
    }

    // Validate receiver
    const receiver = await BankAccount.findOne({ accountNumber: receiverAccountNumber });
    if (!receiver) {
      return res.status(404).json({ success: false, message: 'Recipient account not found' });
    }

    // Step 2: Fetch round-up settings
    const settings = await RoundUpSetting.findOne({ accountId: fromAccount });

    // Step 3: Calculate spare change
    let spare = 0;
    if (customRoundUp !== undefined && customRoundUp !== null) {
      spare = Number(customRoundUp);
    } else {
      spare = getSpare(amount, settings);
    }

    // Step 4: Total debit
    const totalDebit = amount + spare;

    // Check sufficient balance
    if (sender.balance < totalDebit) {
      // Try without spare if balance is insufficient
      if (sender.balance < amount) {
        return res.status(400).json({
          success: false,
          message: `Insufficient balance. You have ₹${sender.balance}, need ₹${amount}`
        });
      }
      // Pay without round-up if can't afford spare
      const adjustedSpare = 0;
      const adjustedTotal = amount;

      sender.balance -= adjustedTotal;
      receiver.balance += amount;

      await sender.save();
      await receiver.save();

      // Save transaction (debit side)
      const txn = await Transaction.create({
        fromAccount,
        toAccount: receiverAccountNumber,
        amount,
        roundUpAmount: 0,
        totalDebited: adjustedTotal,
        type: 'debit',
        status: 'success',
        merchantName: receiver.name,
        category: category || 'other',
        note: note || ''
      });

      return res.json({
        success: true,
        message: `₹${amount} paid to ${receiver.name}. Round-up skipped (low balance).`,
        transaction: txn,
        roundUp: 0,
        newBalance: sender.balance
      });
    }

    // Step 5: Deduct from sender
    sender.balance -= totalDebit;
    await sender.save();

    // Step 6: Credit receiver (only the actual amount, not the spare)
    receiver.balance += amount;
    await receiver.save();

    // Step 7: Save transaction
    const txn = await Transaction.create({
      fromAccount,
      toAccount: receiverAccountNumber,
      amount,
      roundUpAmount: spare,
      totalDebited: totalDebit,
      type: 'debit',
      status: 'success',
      merchantName: receiver.name,
      category: category || 'other',
      note: note || ''
    });

    // Step 8: Add spare to SparePool
    let investmentTriggered = false;
    let investmentAmount = 0;

    if (spare > 0) {
      let pool = await SparePool.findOne({ accountId: fromAccount });
      if (!pool) {
        pool = await SparePool.create({ accountId: fromAccount });
      }

      pool.totalSpare += spare;
      pool.pendingInvestment += spare;
      pool.history.push({
        amount: spare,
        fromTransaction: txn._id.toString(),
        date: new Date()
      });
      pool.lastUpdated = new Date();

      // Step 9: Check threshold → trigger auto-invest
      if (settings && pool.pendingInvestment >= settings.threshold) {
        investmentTriggered = true;
        investmentAmount = pool.pendingInvestment;

        // Move pending to invested
        pool.investedTotal += pool.pendingInvestment;
        const investedAmt = pool.pendingInvestment;
        pool.pendingInvestment = 0;

        // Record in investment allocation
        let allocation = await InvestmentAllocation.findOne({ accountId: fromAccount });
        if (!allocation) {
          allocation = await InvestmentAllocation.create({ accountId: fromAccount });
        }

        // Distribute according to allocation percentages
        const goldAmt = (allocation.gold / 100) * investedAmt;
        const etfAmt = (allocation.etf / 100) * investedAmt;
        const indexAmt = (allocation.indexFund / 100) * investedAmt;
        const debtAmt = (allocation.debtFund / 100) * investedAmt;

        allocation.totalInvested += investedAmt;
        allocation.lastInvestmentDate = new Date();
        allocation.history.push({
          amount: investedAmt,
          gold: goldAmt,
          etf: etfAmt,
          indexFund: indexAmt,
          debtFund: debtAmt,
          date: new Date()
        });

        await allocation.save();
      }

      await pool.save();
    }

    return res.json({
      success: true,
      message: `₹${amount} paid to ${receiver.name}`,
      transaction: {
        id: txn._id,
        amount,
        roundUpAmount: spare,
        totalDebited: totalDebit,
        to: receiver.name,
        status: 'success',
        timestamp: txn.timestamp
      },
      roundUp: spare,
      roundedTo: spare > 0 ? amount + spare : amount,
      newBalance: sender.balance,
      investmentTriggered,
      investmentAmount: investmentTriggered ? investmentAmount : 0
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Payment failed', error: err.message });
  }
}

// GET /api/payment/history
async function getHistory(req, res) {
  try {
    const { accountNumber } = req.user;
    const { limit = 20, page = 1, type } = req.query;

    const query = {
      $or: [{ fromAccount: accountNumber }, { toAccount: accountNumber }]
    };

    if (type === 'debit') {
      query.$or = undefined;
      query.fromAccount = accountNumber;
      query.type = 'debit';
    } else if (type === 'credit') {
      query.$or = undefined;
      query.toAccount = accountNumber;
    }

    const skip = (Number(page) - 1) * Number(limit);

    const transactions = await Transaction.find(query)
      .sort({ timestamp: -1 })
      .skip(skip)
      .limit(Number(limit));

    const total = await Transaction.countDocuments(query);

    // Fetch names for peer accounts
    const accountNumbersInTxns = [...new Set(transactions.flatMap(t => [t.fromAccount, t.toAccount]))];
    const relatedAccounts = await BankAccount.find({ accountNumber: { $in: accountNumbersInTxns } }).lean();
    const accountNameMap = relatedAccounts.reduce((map, acc) => {
      map[acc.accountNumber] = acc.name;
      return map;
    }, {});

    // Enrich with direction info
    const enriched = transactions.map(txn => {
      const isDebit = txn.fromAccount === accountNumber;
      const peerId = isDebit ? txn.toAccount : txn.fromAccount;
      let peerName = accountNameMap[peerId] || peerId;
      
      if (isDebit && txn.merchantName) peerName = txn.merchantName;

      return {
        ...txn.toObject(),
        direction: isDebit ? 'sent' : 'received',
        displayAmount: isDebit ? `-₹${txn.amount}` : `+₹${txn.amount}`,
        peerName: peerName
      };
    });

    return res.json({
      success: true,
      transactions: enriched,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        totalPages: Math.ceil(total / Number(limit))
      }
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Server error', error: err.message });
  }
}

// POST /api/payment/preview — Preview round-up before confirming
async function previewPayment(req, res) {
  try {
    const { amount, toAccount } = req.body;
    const { accountNumber } = req.user;

    if (!amount || amount <= 0) {
      return res.status(400).json({ success: false, message: 'Valid amount required' });
    }

    const settings = await RoundUpSetting.findOne({ accountId: accountNumber });
    const spare = getSpare(amount, settings);
    const totalDebit = amount + spare;

    // Get receiver info if provided
    let receiverInfo = null;
    if (toAccount) {
      const receiver = await BankAccount.findOne({ accountNumber: toAccount });
      if (receiver) {
        receiverInfo = {
          name: receiver.name,
          accountNumber: receiver.accountNumber
        };
      }
    }

    const sender = await BankAccount.findOne({ accountNumber });

    return res.json({
      success: true,
      preview: {
        amount,
        roundUpAmount: spare,
        roundedTo: amount + spare,
        totalDebit,
        roundLevel: settings ? settings.roundLevel : 10,
        roundUpEnabled: settings ? settings.enabled : false,
        currentBalance: sender ? sender.balance : 0,
        sufficientBalance: sender ? sender.balance >= totalDebit : false,
        receiver: receiverInfo
      }
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Server error', error: err.message });
  }
}

module.exports = { pay, getHistory, previewPayment };
