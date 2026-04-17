const mongoose = require('mongoose');

const investmentAllocationSchema = new mongoose.Schema({
  accountId: {
    type: String,
    required: true,
    unique: true
  },
  gold: {
    type: Number,
    default: 25
  },
  etf: {
    type: Number,
    default: 25
  },
  indexFund: {
    type: Number,
    default: 25
  },
  debtFund: {
    type: Number,
    default: 25
  },
  totalInvested: {
    type: Number,
    default: 0
  },
  holdings: {
    gold: { type: Number, default: 0 },
    etf: { type: Number, default: 0 },
    indexFund: { type: Number, default: 0 },
    debtFund: { type: Number, default: 0 }
  },
  lastInvestmentDate: {
    type: Date,
    default: null
  },
  history: [{
    amount: Number,
    gold: Number,
    etf: Number,
    indexFund: Number,
    debtFund: Number,
    date: { type: Date, default: Date.now }
  }]
});

module.exports = mongoose.model('InvestmentAllocation', investmentAllocationSchema);
