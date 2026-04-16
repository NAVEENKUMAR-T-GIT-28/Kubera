const mongoose = require('mongoose');

const cardSchema = new mongoose.Schema({
  accountId: {
    type: String,
    required: true
  },
  cardNumber: {
    type: String,
    required: true,
    unique: true
  },
  cardType: {
    type: String,
    enum: ['virtual', 'physical'],
    default: 'virtual'
  },
  status: {
    type: String,
    enum: ['active', 'blocked', 'expired'],
    default: 'active'
  },
  cardName: {
    type: String,
    default: 'Kubera Card'
  },
  expiry: {
    type: String,
    required: true
  },
  cvv: {
    type: String,
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Card', cardSchema);
