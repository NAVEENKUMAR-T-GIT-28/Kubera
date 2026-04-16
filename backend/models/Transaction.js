const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema({
  fromAccount: {
    type: String,
    required: true
  },
  toAccount: {
    type: String,
    required: true
  },
  amount: {
    type: Number,
    required: true
  },
  roundUpAmount: {
    type: Number,
    default: 0
  },
  totalDebited: {
    type: Number,
    required: true
  },
  type: {
    type: String,
    enum: ['debit', 'credit'],
    required: true
  },
  status: {
    type: String,
    enum: ['success', 'failed', 'pending'],
    default: 'pending'
  },
  merchantName: {
    type: String,
    default: ''
  },
  category: {
    type: String,
    enum: ['food', 'shopping', 'transport', 'bills', 'entertainment', 'other'],
    default: 'other'
  },
  note: {
    type: String,
    default: ''
  },
  timestamp: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Transaction', transactionSchema);
