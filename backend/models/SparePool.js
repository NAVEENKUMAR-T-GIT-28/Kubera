const mongoose = require('mongoose');

const sparePoolSchema = new mongoose.Schema({
  accountId: {
    type: String,
    required: true,
    unique: true
  },
  totalSpare: {
    type: Number,
    default: 0
  },
  pendingInvestment: {
    type: Number,
    default: 0
  },
  investedTotal: {
    type: Number,
    default: 0
  },
  history: [{
    amount: Number,
    fromTransaction: String,
    date: { type: Date, default: Date.now }
  }],
  lastUpdated: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('SparePool', sparePoolSchema);
