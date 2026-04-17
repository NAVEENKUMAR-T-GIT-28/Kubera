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
    
    // Explicitly add to holdings
    if (!allocation.holdings) {
       allocation.holdings = { gold: 0, etf: 0, indexFund: 0, debtFund: 0 };
    }
    allocation.holdings.gold = (allocation.holdings.gold || 0) + goldAmt;
    allocation.holdings.etf = (allocation.holdings.etf || 0) + etfAmt;
    allocation.holdings.indexFund = (allocation.holdings.indexFund || 0) + indexAmt;
    allocation.holdings.debtFund = (allocation.holdings.debtFund || 0) + debtAmt;

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

// GET /api/investment/portfolio — Get detailed market portfolio
async function getPortfolio(req, res) {
  try {
    const { accountNumber } = req.user;
    let allocation = await InvestmentAllocation.findOne({ accountId: accountNumber });
    if (!allocation) {
      allocation = await InvestmentAllocation.create({ accountId: accountNumber, holdings: { gold:0, etf:0, indexFund:0, debtFund:0 } });
    }

    // Fallback seed for older test accounts
    if ((!allocation.holdings || (allocation.holdings.gold === 0 && allocation.totalInvested > 0))) {
      allocation.holdings = {
        gold: (allocation.gold / 100) * allocation.totalInvested,
        etf: (allocation.etf / 100) * allocation.totalInvested,
        indexFund: (allocation.indexFund / 100) * allocation.totalInvested,
        debtFund: (allocation.debtFund / 100) * allocation.totalInvested
      };
      await allocation.save();
    }

    // Deterministic Market Multipliers (Live Mock)
    const timeFluct = Math.sin(Date.now() / 50000) * 1.5; 
    const rates = {
      gold: 14.2 + timeFluct,
      etf: 28.5 + (timeFluct * 1.5),
      indexFund: 18.1 + timeFluct,
      debtFund: 7.5 + (timeFluct * 0.5)
    };

    const h = allocation.holdings;
    const portfolio = [
      { id: 'gold', name: 'Sovereign Gold', invested: h.gold, currentVal: h.gold * (1 + rates.gold/100), pl: rates.gold },
      { id: 'etf', name: 'Nifty 50 ETF', invested: h.etf, currentVal: h.etf * (1 + rates.etf/100), pl: rates.etf },
      { id: 'indexFund', name: 'Global Index', invested: h.indexFund, currentVal: h.indexFund * (1 + rates.indexFund/100), pl: rates.indexFund },
      { id: 'debtFund', name: 'Govt Debt Fund', invested: h.debtFund, currentVal: h.debtFund * (1 + rates.debtFund/100), pl: rates.debtFund }
    ];

    const totalCurrentVal = portfolio.reduce((s, p) => s + p.currentVal, 0);

    return res.json({
      success: true,
      portfolio,
      totalInvested: allocation.totalInvested,
      totalCurrentVal
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Server error', error: err.message });
  }
}

// POST /api/investment/sell — Liquidate an asset
const BankAccount = require('../models/BankAccount'); // Dynamic import for bank account
async function sellAsset(req, res) {
  try {
    const { accountNumber } = req.user;
    const { asset, requestedPayout } = req.body; // e.g. "gold", 1500.24

    let allocation = await InvestmentAllocation.findOne({ accountId: accountNumber });
    if (!allocation || !allocation.holdings || allocation.holdings[asset] <= 0) {
      return res.status(400).json({ success: false, message: 'No holdings found for this asset to sell.' });
    }

    const investedAmt = allocation.holdings[asset];
    
    // For Hackathon Live Demo: Trust the frontend's live tick value or fallback
    let liquidatedAmt = investedAmt;
    if (requestedPayout && requestedPayout >= investedAmt * 0.5) {
       liquidatedAmt = Number(requestedPayout);
    } else {
       const timeFluct = Math.sin(Date.now() / 50000) * 1.5; 
       const rates = { gold: 14.2, etf: 28.5, indexFund: 18.1, debtFund: 7.5 };
       liquidatedAmt = investedAmt * (1 + (rates[asset] + timeFluct)/100);
    }

    // Credit Bank Account
    const account = await BankAccount.findOne({ accountNumber });
    if (account) {
       account.balance += liquidatedAmt;
       await account.save();
    }

    // Deduct Holdings
    allocation.holdings[asset] = 0;
    allocation.totalInvested -= investedAmt;
    if (allocation.totalInvested < 0) allocation.totalInvested = 0;
    await allocation.save();

    return res.json({
      success: true,
      message: `Successfully sold ${asset.toUpperCase()} for ₹${liquidatedAmt.toFixed(2)}`,
      liquidatedAmt,
      newBalance: account ? account.balance : 0
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Server error', error: err.message });
  }
}

// GET /api/investment/analytics — Deep Analytics for dashboard
async function getAnalytics(req, res) {
  try {
    const { accountNumber } = req.user;
    
    // Get Investment Allocation
    let allocation = await InvestmentAllocation.findOne({ accountId: accountNumber });
    if (!allocation) {
       return res.json({ success: true, history: [], distribution: [], stats: { totalInvested: 0, currentVal: 0 }});
    }

    // Get Spare Pool
    const pool = await SparePool.findOne({ accountId: accountNumber });

    // Mock live multipliers (reused from portfolio logic)
    const timeFluct = Math.sin(Date.now() / 50000) * 1.5; 
    const rates = { gold: 14.2 + timeFluct, etf: 28.5 + (timeFluct * 1.5), indexFund: 18.1 + timeFluct, debtFund: 7.5 + (timeFluct * 0.5) };

    const h = allocation.holdings || { gold:0, etf:0, indexFund:0, debtFund:0 };
    const curGold = h.gold * (1 + rates.gold/100);
    const curEtf = h.etf * (1 + rates.etf/100);
    const curIndex = h.indexFund * (1 + rates.indexFund/100);
    const curDebt = h.debtFund * (1 + rates.debtFund/100);
    const totalCurrentVal = curGold + curEtf + curIndex + curDebt;

    // Distribution for Donut Chart
    const distribution = [
      { name: 'Sovereign Gold', value: curGold, color: '#FFD700' },
      { name: 'Nifty 50 ETF', value: curEtf, color: '#00e676' },
      { name: 'Global Index', value: curIndex, color: '#00BFFF' },
      { name: 'Govt Debt Fund', value: curDebt, color: '#A9A9A9' }
    ].filter(d => d.value > 0);

    // Build Growth History (Area Chart)
    // Map the actual investment history to cumulative line
    let runningInvested = 0;
    const historyData = allocation.history.map(entry => {
       runningInvested += entry.amount;
       // Mock a slight exponential return on historical data
       return {
         date: new Date(entry.date).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' }),
         invested: runningInvested,
         value: runningInvested * (1 + (Math.random() * 0.15)) // Mock past growth
       };
    });

    // If no history, provide blank padding
    if (historyData.length === 0) {
       for(let i=0; i<7; i++) {
         let d = new Date();
         d.setDate(d.getDate() - (7-i));
         historyData.push({ date: d.toLocaleDateString(), invested: 0, value: 0 });
       }
    } else {
       // Add exact live current value to the very end
       historyData.push({ 
         date: 'Now', 
         invested: allocation.totalInvested, 
         value: totalCurrentVal 
       });
    }

    return res.json({
      success: true,
      stats: {
        totalInvested: allocation.totalInvested,
        totalCurrentVal,
        totalSpareCollected: pool ? pool.totalSpare : 0,
        pendingSpare: pool ? pool.pendingInvestment : 0
      },
      distribution,
      historyCurve: historyData
    });

  } catch (err) {
    return res.status(500).json({ success: false, message: 'Server error', error: err.message });
  }
}

module.exports = { getAllocation, updateAllocation, investNow, getPortfolio, sellAsset, getAnalytics };
