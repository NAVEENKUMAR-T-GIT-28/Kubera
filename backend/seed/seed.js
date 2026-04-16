require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const mongoose = require('mongoose');

const BankAccount = require('../models/BankAccount');
const Transaction = require('../models/Transaction');
const SparePool = require('../models/SparePool');
const RoundUpSetting = require('../models/RoundUpSetting');
const InvestmentAllocation = require('../models/InvestmentAllocation');
const Card = require('../models/Card');

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/kubera';

async function seed() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('✅ Connected to MongoDB');

    // ── Clear all collections ────────────────────────────
    await Promise.all([
      BankAccount.deleteMany({}),
      Transaction.deleteMany({}),
      SparePool.deleteMany({}),
      RoundUpSetting.deleteMany({}),
      InvestmentAllocation.deleteMany({}),
      Card.deleteMany({})
    ]);
    console.log('🗑️  Cleared all collections');

    // ── Seed Bank Accounts ───────────────────────────────
    const accounts = await BankAccount.insertMany([
      {
        accountNumber: '1001',
        name: 'Kubera User',
        phone: '9876543210',
        email: 'kubera@demo.com',
        pin: '1234',
        balance: 5000,
        role: 'user',
        avatar: '👤'
      },
      {
        accountNumber: '1002',
        name: 'Reliance Fresh',
        phone: '9000000001',
        email: 'reliance@merchant.com',
        pin: '0000',
        balance: 50000,
        role: 'merchant',
        avatar: '🏪'
      },
      {
        accountNumber: '1003',
        name: 'Starbucks',
        phone: '9000000002',
        email: 'starbucks@merchant.com',
        pin: '0000',
        balance: 10000,
        role: 'merchant',
        avatar: '☕'
      },
      {
        accountNumber: '1004',
        name: 'Zomato',
        phone: '9000000003',
        email: 'zomato@merchant.com',
        pin: '0000',
        balance: 3000,
        role: 'merchant',
        avatar: '🍕'
      },
      {
        accountNumber: '1005',
        name: 'Amazon',
        phone: '9000000004',
        email: 'amazon@merchant.com',
        pin: '0000',
        balance: 100000,
        role: 'merchant',
        avatar: '📦'
      },
      {
        accountNumber: '1006',
        name: 'Uber',
        phone: '9000000005',
        email: 'uber@merchant.com',
        pin: '0000',
        balance: 25000,
        role: 'merchant',
        avatar: '🚗'
      }
    ]);
    console.log(`👥 Created ${accounts.length} accounts`);

    // ── Seed SparePool for Kubera User ───────────────────
    await SparePool.create({
      accountId: '1001',
      totalSpare: 0,
      pendingInvestment: 0,
      investedTotal: 0,
      history: []
    });
    console.log('💰 SparePool created for Kubera User');

    // ── Seed RoundUpSettings ─────────────────────────────
    await RoundUpSetting.create({
      accountId: '1001',
      enabled: true,
      roundLevel: 10,
      minAmount: 1,
      maxAmount: 50,
      threshold: 100,
      cycle: 'monthly'
    });
    console.log('⚙️  RoundUp settings created (roundLevel: 10, threshold: ₹100)');

    // ── Seed InvestmentAllocation ─────────────────────────
    await InvestmentAllocation.create({
      accountId: '1001',
      gold: 25,
      etf: 25,
      indexFund: 25,
      debtFund: 25,
      totalInvested: 0,
      history: []
    });
    console.log('📊 Investment allocation created (25% each bucket)');

    // ── Seed Virtual Card for Kubera User ────────────────
    await Card.create({
      accountId: '1001',
      cardNumber: '4532 8901 2345 6789',
      cardType: 'virtual',
      status: 'active',
      cardName: 'Kubera Platinum',
      expiry: '12/28',
      cvv: '321'
    });
    console.log('💳 Kubera Platinum virtual card created');

    // ── Seed some demo transactions ──────────────────────
    const demoTransactions = [
      {
        fromAccount: '1001',
        toAccount: '1003',
        amount: 187,
        roundUpAmount: 3,
        totalDebited: 190,
        type: 'debit',
        status: 'success',
        merchantName: 'Starbucks',
        category: 'food',
        note: 'Morning coffee',
        timestamp: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000)
      },
      {
        fromAccount: '1001',
        toAccount: '1004',
        amount: 92,
        roundUpAmount: 8,
        totalDebited: 100,
        type: 'debit',
        status: 'success',
        merchantName: 'Zomato',
        category: 'food',
        note: 'Lunch order',
        timestamp: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000)
      },
      {
        fromAccount: '1001',
        toAccount: '1002',
        amount: 456,
        roundUpAmount: 4,
        totalDebited: 460,
        type: 'debit',
        status: 'success',
        merchantName: 'Reliance Fresh',
        category: 'shopping',
        note: 'Groceries',
        timestamp: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000)
      },
      {
        fromAccount: '1001',
        toAccount: '1006',
        amount: 143,
        roundUpAmount: 7,
        totalDebited: 150,
        type: 'debit',
        status: 'success',
        merchantName: 'Uber',
        category: 'transport',
        note: 'Office commute',
        timestamp: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000)
      },
      {
        fromAccount: '1001',
        toAccount: '1005',
        amount: 1299,
        roundUpAmount: 1,
        totalDebited: 1300,
        type: 'debit',
        status: 'success',
        merchantName: 'Amazon',
        category: 'shopping',
        note: 'Headphones',
        timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000)
      },
      {
        fromAccount: '1001',
        toAccount: '1004',
        amount: 56,
        roundUpAmount: 4,
        totalDebited: 60,
        type: 'debit',
        status: 'success',
        merchantName: 'Zomato',
        category: 'food',
        note: 'Snacks',
        timestamp: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000)
      }
    ];

    const txns = await Transaction.insertMany(demoTransactions);
    console.log(`📝 Created ${txns.length} demo transactions`);

    // Update spare pool with demo round-ups
    const totalDemoSpare = demoTransactions.reduce((sum, t) => sum + t.roundUpAmount, 0);
    await SparePool.findOneAndUpdate(
      { accountId: '1001' },
      {
        totalSpare: totalDemoSpare,
        pendingInvestment: totalDemoSpare,
        history: demoTransactions.map(t => ({
          amount: t.roundUpAmount,
          fromTransaction: 'seed',
          date: t.timestamp
        }))
      }
    );
    console.log(`💰 SparePool updated: ₹${totalDemoSpare} accumulated from demo transactions`);

    // Update Kubera User balance to reflect demo transactions
    const totalDebited = demoTransactions.reduce((sum, t) => sum + t.totalDebited, 0);
    await BankAccount.findOneAndUpdate(
      { accountNumber: '1001' },
      { balance: 5000 - totalDebited }
    );
    console.log(`💰 Kubera User balance adjusted: ₹${5000 - totalDebited}`);

    // ── Summary ──────────────────────────────────────────
    console.log('\n═══════════════════════════════════════════');
    console.log('  🏰 KUBERA SEED COMPLETE');
    console.log('═══════════════════════════════════════════');
    console.log(`  Accounts:     ${accounts.length}`);
    console.log(`  Transactions: ${txns.length}`);
    console.log(`  Spare Pool:   ₹${totalDemoSpare}`);
    console.log(`  User Balance: ₹${5000 - totalDebited}`);
    console.log('');
    console.log('  Login Credentials:');
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
