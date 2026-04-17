require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const mongoose = require('mongoose');

const BankAccount = require('../models/BankAccount');
const Transaction = require('../models/Transaction');
const SparePool = require('../models/SparePool');
const RoundUpSetting = require('../models/RoundUpSetting');
const InvestmentAllocation = require('../models/InvestmentAllocation');
const Card = require('../models/Card');

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/kubera';

function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

async function seed() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('✅ Connected to MongoDB');

    // ── Clear all collections
    await Promise.all([
      BankAccount.deleteMany({}),
      Transaction.deleteMany({}),
      SparePool.deleteMany({}),
      RoundUpSetting.deleteMany({}),
      InvestmentAllocation.deleteMany({}),
      Card.deleteMany({})
    ]);
    console.log('🗑️  Cleared all collections');

    // ── Seed Bank Accounts: Merchants
    const merchants = [
      { accountNumber: '2001', name: 'Reliance Fresh', phone: '9000000001', email: 'reliance@merchant.com', pin: '0000', balance: 50000, role: 'merchant', avatar: '🏪' },
      { accountNumber: '2002', name: 'Starbucks', phone: '9000000002', email: 'starbucks@merchant.com', pin: '0000', balance: 10000, role: 'merchant', avatar: '☕' },
      { accountNumber: '2003', name: 'Zomato', phone: '9000000003', email: 'zomato@merchant.com', pin: '0000', balance: 3000, role: 'merchant', avatar: '🍕' },
      { accountNumber: '2004', name: 'Amazon', phone: '9000000004', email: 'amazon@merchant.com', pin: '0000', balance: 100000, role: 'merchant', avatar: '📦' },
      { accountNumber: '2005', name: 'Uber', phone: '9000000005', email: 'uber@merchant.com', pin: '0000', balance: 25000, role: 'merchant', avatar: '🚗' }
    ];

    // categories mapping for merchants
    const mCategoryMap = { '2001': 'shopping', '2002': 'food', '2003': 'food', '2004': 'shopping', '2005': 'transport' };

    // ── Seed Bank Accounts: Users
    const users = [
      { accountNumber: '1001', name: 'Kubera User', phone: '9876543210', email: 'kubera@demo.com', pin: '1234', balance: 150000, role: 'user', avatar: '👤' },
      { accountNumber: '1002', name: 'Alex Cooper', phone: '9876543211', email: 'alex@demo.com', pin: '1234', balance: 85000, role: 'user', avatar: '🧑' },
      { accountNumber: '1003', name: 'Sam Smith', phone: '9876543212', email: 'sam@demo.com', pin: '1234', balance: 110000, role: 'user', avatar: '👱' },
      { accountNumber: '1004', name: 'Pat Taylor', phone: '9876543213', email: 'pat@demo.com', pin: '1234', balance: 45000, role: 'user', avatar: '👩‍🦰' }
    ];

    const allAccounts = await BankAccount.insertMany([...merchants, ...users]);
    console.log(`👥 Created ${merchants.length} merchants and ${users.length} users`);

    // ── Setup Core Entities for all users
    for (const u of users) {
      await SparePool.create({ accountId: u.accountNumber, totalSpare: 0, pendingInvestment: 0, investedTotal: 0, history: [] });
      await RoundUpSetting.create({ accountId: u.accountNumber, enabled: true, roundLevel: 10, minAmount: 1, maxAmount: 50, threshold: 100, cycle: 'monthly' });
      await InvestmentAllocation.create({ accountId: u.accountNumber, gold: 25, etf: 25, indexFund: 25, debtFund: 25, totalInvested: 0, history: [] });
      
      await Card.create({
        accountId: u.accountNumber,
        cardNumber: `4532 8901 ${randomInt(1000, 9999)} ${randomInt(1000, 9999)}`,
        cardType: 'virtual', status: 'active',
        cardName: `${u.name.split(' ')[0]} Platinum`,
        expiry: '12/28', cvv: randomInt(100, 999).toString()
      });
    }
    console.log('⚙️  Initialized SparePools, RoundUp limits, Investments, and Cards for all users');

    // ── Generate Algorithmically Rich Demo Transactions Over Time
    const demoTransactions = [];
    const NUM_DAYS = 30; // generate data for the last 30 days
    const now = new Date();

    for (let dayOffset = NUM_DAYS; dayOffset >= 0; dayOffset--) {
      const currentDay = new Date(now.getTime() - dayOffset * 24 * 60 * 60 * 1000);
      
      // For each user, generate variable amount of transactions
      for (const u of users) {
        let dailyTxns = 0;
        
        if (u.accountNumber === '1001') {
          // The main user gets 2 to 5 transactions per day (Highest amount)
          dailyTxns = randomInt(2, 5);
        } else {
          // Other users get 0 to 2 transactions per day
          dailyTxns = randomInt(0, 2);
        }

        for (let i = 0; i < dailyTxns; i++) {
          const randMerchant = merchants[randomInt(0, merchants.length - 1)];
          const amount = randomInt(20, 1500); // Random amount between 20 and 1500
          
          // Calculate roundUp to next nearest 10
          let val = amount;
          while(val % 10 !== 0) val++;
          const roundUpAmount = val - amount;
          
          // vary time during the day (9 AM to 9 PM)
          const txnTime = new Date(currentDay);
          txnTime.setHours(randomInt(9, 21));
          txnTime.setMinutes(randomInt(0, 59));

          demoTransactions.push({
            fromAccount: u.accountNumber,
            toAccount: randMerchant.accountNumber,
            amount: amount,
            roundUpAmount: roundUpAmount,
            totalDebited: amount + roundUpAmount,
            type: 'debit',
            status: 'success',
            merchantName: randMerchant.name,
            category: mCategoryMap[randMerchant.accountNumber] || 'other',
            note: 'Demo Seed Purchase',
            timestamp: txnTime
          });
        }
      }
    }

    const txns = await Transaction.insertMany(demoTransactions);
    console.log(`📝 Generated and inserted ${txns.length} demo transactions across ${NUM_DAYS} discrete days.`);

    // ── Update balances and SparePools aggregations
    let mainUserBalance = users.find(u => u.accountNumber === '1001').balance;
    let mainUserTotalSpare = 0;

    for (const u of users) {
      const userTxns = demoTransactions.filter(t => t.fromAccount === u.accountNumber);
      const userTotalDebited = userTxns.reduce((sum, t) => sum + t.totalDebited, 0);
      const userTotalSpare = userTxns.reduce((sum, t) => sum + t.roundUpAmount, 0);

      if (u.accountNumber === '1001') {
        mainUserBalance -= userTotalDebited;
        mainUserTotalSpare = userTotalSpare;
      }

      await BankAccount.findOneAndUpdate(
        { accountNumber: u.accountNumber },
        { $inc: { balance: -userTotalDebited } }
      );

      await SparePool.findOneAndUpdate(
        { accountId: u.accountNumber },
        {
          totalSpare: userTotalSpare,
          pendingInvestment: userTotalSpare,
          history: userTxns.filter(t => t.roundUpAmount > 0).map(t => ({
            amount: t.roundUpAmount,
            fromTransaction: 'seed',
            date: t.timestamp
          }))
        }
      );
    }
    console.log(`💰 Updated Bank balances and SparePool aggregated totals for all users.`);

    // ── Summary
    console.log('\n═══════════════════════════════════════════');
    console.log('  🏰 KUBERA ADVANCED SEED COMPLETE');
    console.log('═══════════════════════════════════════════');
    console.log(`  Merchants:    ${merchants.length}`);
    console.log(`  Users:        ${users.length}`);
    console.log(`  Transactions: ${txns.length}`);
    console.log(`  Main User Spare:   ₹${mainUserTotalSpare}`);
    console.log(`  Main User Balance: ₹${mainUserBalance}`);
    console.log('');
    console.log('  Login Credentials (Main User):');
    console.log('  Phone: 9876543210  |  PIN: 1234');
    console.log('═══════════════════════════════════════════\n');

    await mongoose.disconnect();
    console.log('✅ Disconnected from MongoDB');
    process.exit(0);
  } catch (err) {
    console.error('❌ Seed failed:', err.message);
    process.exit(1);
  }
}

seed();
