/**
 * Kubera Round-Up Engine
 * Core logic for spare change calculation
 */

/**
 * Basic round-up calculation
 * e.g., getRoundUp(187, 10) → 3  (rounds to 190)
 *        getRoundUp(187, 50) → 13 (rounds to 200)
 */
function getRoundUp(amount, roundLevel) {
  if (amount % roundLevel === 0) return 0;
  return Math.ceil(amount / roundLevel) * roundLevel - amount;
}

/**
 * Round-up with constraints from user settings
 * Returns 0 if disabled or below minimum
 * Caps at maxAmount
 */
function getSpare(amount, settings) {
  if (!settings || !settings.enabled) return 0;

  const spare = getRoundUp(amount, settings.roundLevel);

  if (spare === 0) return 0;
  if (spare < settings.minAmount) return 0;
  if (spare > settings.maxAmount) return settings.maxAmount;

  return spare;
}

module.exports = { getRoundUp, getSpare };
