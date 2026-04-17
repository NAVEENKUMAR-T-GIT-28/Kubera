const Transaction = require('../models/Transaction');
const SparePool = require('../models/SparePool');
const InvestmentAllocation = require('../models/InvestmentAllocation');
const RoundUpSetting = require('../models/RoundUpSetting');
const BankAccount = require('../models/BankAccount');

// GET /api/admin/overview
async function getOverview(req, res) {
  try {
    const [
      transactionsGlobal,
      txnTimeSeries,
      flaggedTxns,
      sparePoolTotal,
      investmentBuckets,
      roundUpSettings,
      accountStats,
      userList
    ] = await Promise.all([
      // 1. Transaction Globals
      Transaction.aggregate([
        {
          $group: {
            _id: null,
            totalTransactions: { $sum: 1 },
            totalSpareGenerated: { $sum: '$roundUpAmount' },
            avgRoundUp: { $avg: '$roundUpAmount' }
          }
        }
      ]),
      
      // 2. Daily Spare Change (Time Series)
      Transaction.aggregate([
        {
          $group: {
             _id: { $dateToString: { format: '%Y-%m-%d', date: '$timestamp' } },
             dailySpare: { $sum: '$roundUpAmount' },
             count: { $sum: 1 }
          }
        },
        { $sort: { _id: 1 } }
      ]),
      
      // 3. Flagged Transactions (> 40)
      Transaction.find({ roundUpAmount: { $gt: 40 } }).sort({ timestamp: -1 }).limit(50),
      
      // 4. SparePool Totals
      SparePool.aggregate([
        {
          $group: {
            _id: null,
            totalInvested: { $sum: '$investedTotal' },
            totalPending: { $sum: '$pendingInvestment' }
          }
        }
      ]),
      
      // 5. Investment Allocation Averages
      InvestmentAllocation.aggregate([
        {
           $group: {
             _id: null,
             avgGold: { $avg: '$gold' },
             avgEtf: { $avg: '$etf' },
             avgIndex: { $avg: '$indexFund' },
             avgDebt: { $avg: '$debtFund' }
           }
        }
      ]),
      
      // 6. Round-up Tiers Distribution
      RoundUpSetting.aggregate([
        {
           $group: {
             _id: {
                level: '$roundLevel',
                enabled: '$enabled'
             },
             count: { $sum: 1 }
           }
        }
      ]),
      
      // 7. Users vs Merchants
      BankAccount.aggregate([
        {
           $group: {
             _id: '$role',
             count: { $sum: 1 }
           }
        }
      ]),

      // 8. User Details List (Money Flow, Invested, Top Option)
      BankAccount.aggregate([
        { $match: { role: 'user' } },
        {
          $lookup: {
            from: "transactions",
            localField: "accountNumber",
            foreignField: "fromAccount",
            as: "txns"
          }
        },
        {
          $lookup: {
            from: "sparepools",
            localField: "accountNumber",
            foreignField: "accountId",
            as: "spare"
          }
        },
        {
          $lookup: {
            from: "investmentallocations",
            localField: "accountNumber",
            foreignField: "accountId",
            as: "alloc"
          }
        },
        {
          $project: {
            name: 1,
            accountNumber: 1,
            totalMoneyFlow: { $sum: "$txns.totalDebited" },
            overallInvested: { $ifNull: [{ $arrayElemAt: ["$spare.investedTotal", 0] }, 0] },
            allocations: { $arrayElemAt: ["$alloc", 0] }
          }
        }
      ])
    ]);

    // Process user list to find Top Option and Mock Earnings
    const processedUserList = (userList || []).map(u => {
      let topOption = 'None';
      let highestVal = 0;
      if (u.allocations) {
        const { gold, etf, indexFund, debtFund } = u.allocations;
        const buckets = { Gold: gold, ETF: etf, 'Index Fund': indexFund, 'Debt Fund': debtFund };
        for (const [key, val] of Object.entries(buckets)) {
           if (val > highestVal) { highestVal = val; topOption = key; }
        }
      }
      
      const earned = Number((u.overallInvested * 0.125).toFixed(2)); // mock 12.5% return
      
      return {
        _id: u._id,
        name: u.name,
        accountNumber: u.accountNumber,
        totalMoneyFlow: u.totalMoneyFlow,
        overallInvested: u.overallInvested,
        amountEarned: earned,
        topOption: `${topOption} (${highestVal}%)`
      };
    });

    const globalMoneyFlow = processedUserList.reduce((acc, curr) => acc + curr.totalMoneyFlow, 0);

    // Format response payload safely
    return res.json({
       success: true,
       data: {
          transactionStats: { 
             ...transactionsGlobal[0], 
             globalMoneyFlow 
          } || { totalTransactions: 0, totalSpareGenerated: 0, avgRoundUp: 0, globalMoneyFlow: 0 },
          timeSeries: txnTimeSeries,
          flaggedTransactions: flaggedTxns,
          sparePoolStats: sparePoolTotal[0] || { totalInvested: 0, totalPending: 0 },
          investmentBuckets: investmentBuckets[0] || { avgGold: 0, avgEtf: 0, avgIndex: 0, avgDebt: 0 },
          roundUpDistribution: roundUpSettings,
          accountStats,
          userList: processedUserList
       }
    });

  } catch (err) {
     return res.status(500).json({ success: false, message: 'Server error', error: err.message });
  }
}

// GET /api/admin/deep-analytics
async function getDeepAnalytics(req, res) {
  try {
    const [
      allTransactions,
      allAllocations,
      allPools,
      allAccounts,
      dailyVolume,
      categoryBreakdown
    ] = await Promise.all([
      // Full transaction ledger (last 200)
      Transaction.find({}).sort({ timestamp: -1 }).limit(200).lean(),
      
      // All investment allocations with holdings
      InvestmentAllocation.find({}).lean(),
      
      // All spare pools
      SparePool.find({}).lean(),
      
      // All bank accounts (without sensitive data)
      BankAccount.find({}, { pin: 0 }).lean(),
      
      // Daily transaction volume over last 30 days (grouped by date AND user)
      Transaction.aggregate([
        {
          $group: {
            _id: { 
              date: { $dateToString: { format: '%Y-%m-%d', date: '$timestamp' } },
              accountNumber: '$fromAccount'
            },
            volume: { $sum: '$totalDebited' },
            spareCollected: { $sum: '$roundUpAmount' },
            txCount: { $sum: 1 }
          }
        },
        { $sort: { '_id.date': 1 } }
      ]),
      
      // Category-wise spending
      Transaction.aggregate([
        { $match: { type: 'debit' } },
        {
          $group: {
            _id: '$category',
            total: { $sum: '$amount' },
            count: { $sum: 1 }
          }
        },
        { $sort: { total: -1 } }
      ])
    ]);

    // Compute global stats
    const totalSystemBalance = allAccounts.reduce((s, a) => s + (a.balance || 0), 0);
    const totalSpareEverCollected = allPools.reduce((s, p) => s + (p.totalSpare || 0), 0);
    const totalInvested = allPools.reduce((s, p) => s + (p.investedTotal || 0), 0);
    const totalPending = allPools.reduce((s, p) => s + (p.pendingInvestment || 0), 0);
    
    // Compute per-user enrichment
    const userAnalytics = allAccounts
      .filter(a => a.role === 'user')
      .map(account => {
        const pool = allPools.find(p => p.accountId === account.accountNumber);
        const alloc = allAllocations.find(a => a.accountId === account.accountNumber);
        const userTxns = allTransactions.filter(t => t.fromAccount === account.accountNumber);

        const invested = pool ? pool.investedTotal : 0;
        const pending = pool ? pool.pendingInvestment : 0;
        const spareCollected = pool ? pool.totalSpare : 0;
        const totalDebited = userTxns.reduce((s, t) => s + (t.totalDebited || 0), 0);
        const totalRoundUp = userTxns.reduce((s, t) => s + (t.roundUpAmount || 0), 0);

        // Holdings breakdown
        const holdings = alloc?.holdings || { gold: 0, etf: 0, indexFund: 0, debtFund: 0 };
        const totalHoldings = holdings.gold + holdings.etf + holdings.indexFund + holdings.debtFund;
        const mockReturn = totalHoldings * 0.142; // 14.2% simulated return

        return {
          _id: account._id,
          name: account.name,
          accountNumber: account.accountNumber,
          balance: account.balance,
          txCount: userTxns.length,
          totalDebited,
          totalRoundUp,
          spareCollected,
          invested,
          pending,
          holdings,
          totalHoldingsValue: totalHoldings,
          mockReturn: Number(mockReturn.toFixed(2)),
          currentPortfolioValue: Number((totalHoldings + mockReturn).toFixed(2))
        };
      });

    // Investment distribution (system-wide actual fiat)
    const systemHoldings = { gold: 0, etf: 0, indexFund: 0, debtFund: 0 };
    allAllocations.forEach(a => {
      const h = a.holdings || {};
      systemHoldings.gold += h.gold || 0;
      systemHoldings.etf += h.etf || 0;
      systemHoldings.indexFund += h.indexFund || 0;
      systemHoldings.debtFund += h.debtFund || 0;
    });

    // Format daily volume for chart (now includes account info)
    const chartDailyVolume = dailyVolume.map(d => ({
      date: d._id.date,
      accountNumber: d._id.accountNumber,
      volume: Number(d.volume.toFixed(2)),
      spare: Number(d.spareCollected.toFixed(2)),
      count: d.txCount
    }));

    // Format category data  
    const categoryData = categoryBreakdown.map(c => ({
      category: c._id || 'other',
      total: Number(c.total.toFixed(2)),
      count: c.count
    }));

    // Create an account name map for recent transactions lookup
    const accountNameMap = allAccounts.reduce((map, acc) => {
      map[acc.accountNumber] = acc.name;
      return map;
    }, {});

    return res.json({
      success: true,
      data: {
        globalStats: {
          totalSystemBalance: Number(totalSystemBalance.toFixed(2)),
          totalSpareEverCollected: Number(totalSpareEverCollected.toFixed(2)),
          totalInvested: Number(totalInvested.toFixed(2)),
          totalPending: Number(totalPending.toFixed(2)),
          userCount: allAccounts.filter(a => a.role === 'user').length,
          merchantCount: allAccounts.filter(a => a.role === 'merchant').length,
          totalTransactions: allTransactions.length
        },
        systemHoldings,
        chartDailyVolume,
        categoryData,
        userAnalytics,
        recentTransactions: allTransactions.slice(0, 50).map(t => ({
          _id: t._id,
          from: accountNameMap[t.fromAccount] || t.fromAccount,
          to: t.merchantName || accountNameMap[t.toAccount] || t.toAccount,
          amount: t.amount,
          roundUp: t.roundUpAmount,
          totalDebited: t.totalDebited,
          merchant: t.merchantName,
          category: t.category,
          status: t.status,
          date: t.timestamp
        }))
      }
    });

  } catch (err) {
    return res.status(500).json({ success: false, message: 'Server error', error: err.message });
  }
}

module.exports = { getOverview, getDeepAnalytics };
