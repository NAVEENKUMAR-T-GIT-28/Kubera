const InvestmentAllocation = require('../models/InvestmentAllocation');
const SparePool = require('../models/SparePool');

/**
 * Kubera Investment Controller
 * Manages investment allocation and manual invest triggers
 */

// GET /api/investment
async function getAllocation(req, res) {
  try {
    const { accountNumber } = req.user;

    let allocation = await InvestmentAllocation.findOne({ accountId: accountNumber });
    if (!allocation) {
      allocation = await InvestmentAllocation.create({ accountId: accountNumber });
    }

    const pool = await SparePool.findOne({ accountId: accountNumber });

    return res.json({
      success: true,
      investment: {
        allocation: {
          gold: allocation.gold,
          etf: allocation.etf,
          indexFund: allocation.indexFund,
          debtFund: allocation.debtFund
        },
        totalInvested: allocation.totalInvested,
        lastInvestmentDate: allocation.lastInvestmentDate,
        pendingInvestment: pool ? pool.pendingInvestment : 0,
        history: allocation.history.slice(-10).reverse()
      }
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Server error', error: err.message });
  }
}

// POST /api/investment/allocate — Update allocation percentages
async function updateAllocation(req, res) {
  try {
    const { accountNumber } = req.user;
    const { gold, etf, indexFund, debtFund } = req.body;

    // Validate percentages sum to 100
    const total = (gold || 0) + (etf || 0) + (indexFund || 0) + (debtFund || 0);
    if (total !== 100) {
      return res.status(400).json({
        success: false,
        message: `Allocation must sum to 100%. Currently: ${total}%`
      });
    }

    let allocation = await InvestmentAllocation.findOne({ accountId: accountNumber });
    if (!allocation) {
      allocation = await InvestmentAllocation.create({ accountId: accountNumber });
    }

    allocation.gold = gold;
    allocation.etf = etf;
    allocation.indexFund = indexFund;
    allocation.debtFund = debtFund;

    await allocation.save();

    return res.json({
      success: true,
      message: 'Investment allocation updated',
      allocation: {
        gold: allocation.gold,
        etf: allocation.etf,
        indexFund: allocation.indexFund,
        debtFund: allocation.debtFund
      }
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Server error', error: err.message });
  }
}

// POST /api/investment/invest-now — Manually trigger investment of pending spare
async function investNow(req, res) {
  try {
    const { accountNumber } = req.user;

    const pool = await SparePool.findOne({ accountId: accountNumber });
    if (!pool || pool.pendingInvestment <= 0) {
      return res.status(400).json({
        success: false,
        message: 'No pending spare to invest'
      });
    }

    let allocation = await InvestmentAllocation.findOne({ accountId: accountNumber });
    if (!allocation) {
      allocation = await InvestmentAllocation.create({ accountId: accountNumber });
    }

    const investedAmt = pool.pendingInvestment;

    // Distribute
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

    pool.investedTotal += investedAmt;
    pool.pendingInvestment = 0;
    pool.lastUpdated = new Date();
    await pool.save();

    return res.json({
      success: true,
      message: `₹${investedAmt} invested successfully!`,
      invested: {
        total: investedAmt,
        gold: Math.round(goldAmt * 100) / 100,
        etf: Math.round(etfAmt * 100) / 100,
        indexFund: Math.round(indexAmt * 100) / 100,
        debtFund: Math.round(debtAmt * 100) / 100
      },
      totalInvested: allocation.totalInvested
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Server error', error: err.message });
  }
}

module.exports = { getAllocation, updateAllocation, investNow };
