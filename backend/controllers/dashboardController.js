const BankAccount = require('../models/BankAccount');
const Transaction = require('../models/Transaction');
const SparePool = require('../models/SparePool');
const RoundUpSetting = require('../models/RoundUpSetting');
const InvestmentAllocation = require('../models/InvestmentAllocation');

/**
 * Kubera Dashboard Controller
 * Aggregated data for the main dashboard view
 */

// GET /api/dashboard
async function getDashboard(req, res) {
  try {
    const { accountNumber } = req.user;

    // Fetch all data in parallel
    const [account, pool, settings, allocation, recentTxns, merchants] = await Promise.all([
      BankAccount.findOne({ accountNumber }),
      SparePool.findOne({ accountId: accountNumber }),
      RoundUpSetting.findOne({ accountId: accountNumber }),
      InvestmentAllocation.findOne({ accountId: accountNumber }),
      Transaction.find({
        $or: [{ fromAccount: accountNumber }, { toAccount: accountNumber }]
      })
        .sort({ timestamp: -1 })
        .limit(10),
      BankAccount.find({ role: 'merchant' }).limit(6).lean()
    ]);

    if (!account) {
      return res.status(404).json({ success: false, message: 'Account not found' });
    }

    // Calculate spending insights
    const allDebitTxns = await Transaction.find({
      fromAccount: accountNumber,
      type: 'debit',
      status: 'success'
    });

    // Category breakdown
    const categoryBreakdown = {};
    let totalSpent = 0;
    let totalRoundUps = 0;

    allDebitTxns.forEach(txn => {
      const cat = txn.category || 'other';
      if (!categoryBreakdown[cat]) {
        categoryBreakdown[cat] = { count: 0, total: 0 };
      }
      categoryBreakdown[cat].count += 1;
      categoryBreakdown[cat].total += txn.amount;
      totalSpent += txn.amount;
      totalRoundUps += txn.roundUpAmount || 0;
    });

    // Monthly spare accumulation (last 6 months)
    const monthlySpare = [];
    if (pool && pool.history.length > 0) {
      const sixMonthsAgo = new Date();
      sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

      const monthMap = {};
      pool.history.forEach(entry => {
        if (entry.date >= sixMonthsAgo) {
          const key = `${entry.date.getFullYear()}-${String(entry.date.getMonth() + 1).padStart(2, '0')}`;
          if (!monthMap[key]) monthMap[key] = 0;
          monthMap[key] += entry.amount;
        }
      });

      Object.entries(monthMap)
        .sort(([a], [b]) => a.localeCompare(b))
        .forEach(([month, amount]) => {
          monthlySpare.push({ month, amount: Math.round(amount * 100) / 100 });
        });
    }

    // Get all unique account numbers involved in recent transactions
    const accountNumbersInTxns = [...new Set(recentTxns.flatMap(t => [t.fromAccount, t.toAccount]))];
    const relatedAccounts = await BankAccount.find({ accountNumber: { $in: accountNumbersInTxns } }).lean();
    const accountNameMap = relatedAccounts.reduce((map, acc) => {
      map[acc.accountNumber] = acc.name;
      return map;
    }, {});

    // Enrich recent transactions
    const enrichedTxns = recentTxns.map(txn => {
      const isDebit = txn.fromAccount === accountNumber;
      // If debit, use merchant name if available, else look up the destination account name
      // If credit, look up the source account name
      const peerId = isDebit ? txn.toAccount : txn.fromAccount;
      let peerName = accountNameMap[peerId] || peerId;
      
      // Override with merchantName if it's explicitly set on the transaction (mostly for debits)
      if (isDebit && txn.merchantName) peerName = txn.merchantName;

      return {
        id: txn._id,
        direction: isDebit ? 'sent' : 'received',
        amount: txn.amount,
        roundUpAmount: txn.roundUpAmount,
        displayAmount: isDebit ? `-₹${txn.amount}` : `+₹${txn.amount}`,
        peerName: peerName,
        category: txn.category,
        timestamp: txn.timestamp,
        status: txn.status
      };
    });

    return res.json({
      success: true,
      dashboard: {
        account: {
          name: account.name,
          accountNumber: account.accountNumber,
          balance: account.balance,
          phone: account.phone
        },
        sparePool: {
          totalSpare: pool ? pool.totalSpare : 0,
          pendingInvestment: pool ? pool.pendingInvestment : 0,
          investedTotal: pool ? pool.investedTotal : 0,
          threshold: settings ? settings.threshold : 100
        },
        roundUpSettings: {
          enabled: settings ? settings.enabled : false,
          roundLevel: settings ? settings.roundLevel : 10,
          cycle: settings ? settings.cycle : 'monthly'
        },
        investment: {
          totalInvested: allocation ? allocation.totalInvested : 0,
          allocation: allocation
            ? {
                gold: allocation.gold,
                etf: allocation.etf,
                indexFund: allocation.indexFund,
                debtFund: allocation.debtFund
              }
            : { gold: 25, etf: 25, indexFund: 25, debtFund: 25 },
          lastInvestmentDate: allocation ? allocation.lastInvestmentDate : null
        },
        insights: {
          totalSpent,
          totalRoundUps,
          totalTransactions: allDebitTxns.length,
          categoryBreakdown,
          monthlySpare
        },
        recentTransactions: enrichedTxns,
        contacts: merchants.map(m => ({
          accountNumber: m.accountNumber,
          name: m.name,
          phone: m.phone,
          avatar: m.avatar,
          role: m.role
        }))
      }
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Server error', error: err.message });
  }
}

module.exports = { getDashboard };
