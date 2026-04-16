const mongoose = require('mongoose');

const roundUpSettingSchema = new mongoose.Schema({
  accountId: {
    type: String,
    required: true,
    unique: true
  },
  enabled: {
    type: Boolean,
    default: true
  },
  roundLevel: {
    type: Number,
    enum: [5, 10, 20, 50, 100],
    default: 10
  },
  minAmount: {
    type: Number,
    default: 1
  },
  maxAmount: {
    type: Number,
    default: 50
  },
  threshold: {
    type: Number,
    default: 100
  },
  cycle: {
    type: String,
    enum: ['weekly', 'monthly'],
    default: 'monthly'
  }
});

module.exports = mongoose.model('RoundUpSetting', roundUpSettingSchema);
