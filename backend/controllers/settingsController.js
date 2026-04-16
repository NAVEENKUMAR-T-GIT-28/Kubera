const RoundUpSetting = require('../models/RoundUpSetting');

/**
 * Kubera Settings Controller
 * Manage round-up preferences
 */

// GET /api/settings
async function getSettings(req, res) {
  try {
    const { accountNumber } = req.user;

    let settings = await RoundUpSetting.findOne({ accountId: accountNumber });
    if (!settings) {
      settings = await RoundUpSetting.create({ accountId: accountNumber });
    }

    return res.json({ success: true, settings });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Server error', error: err.message });
  }
}

// POST /api/settings/update
async function updateSettings(req, res) {
  try {
    const { accountNumber } = req.user;
    const { enabled, roundLevel, minAmount, maxAmount, threshold, cycle } = req.body;

    let settings = await RoundUpSetting.findOne({ accountId: accountNumber });
    if (!settings) {
      settings = await RoundUpSetting.create({ accountId: accountNumber });
    }

    if (enabled !== undefined) settings.enabled = enabled;
    if (roundLevel !== undefined) {
      if (![5, 10, 20, 50, 100].includes(roundLevel)) {
        return res.status(400).json({
          success: false,
          message: 'roundLevel must be 5, 10, 20, 50, or 100'
        });
      }
      settings.roundLevel = roundLevel;
    }
    if (minAmount !== undefined) settings.minAmount = minAmount;
    if (maxAmount !== undefined) settings.maxAmount = maxAmount;
    if (threshold !== undefined) settings.threshold = threshold;
    if (cycle !== undefined) {
      if (!['weekly', 'monthly'].includes(cycle)) {
        return res.status(400).json({
          success: false,
          message: 'cycle must be "weekly" or "monthly"'
        });
      }
      settings.cycle = cycle;
    }

    await settings.save();

    return res.json({
      success: true,
      message: 'Settings updated',
      settings
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Server error', error: err.message });
  }
}

module.exports = { getSettings, updateSettings };
