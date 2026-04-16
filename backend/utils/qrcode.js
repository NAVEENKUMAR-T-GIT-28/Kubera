const QRCode = require('qrcode');

/**
 * Kubera QR Code Generator
 * Generates QR codes for scan-and-pay flow
 * QR data contains account number + optional metadata
 */

/**
 * Generate a QR code as a data URL (base64 PNG)
 * @param {string} accountNumber - The merchant/recipient account number
 * @param {string} name - Display name of the recipient
 * @param {number} amount - Optional pre-filled amount
 * @returns {Promise<string>} Base64 data URL of the QR code
 */
async function generatePaymentQR(accountNumber, name, amount = null) {
  const qrData = JSON.stringify({
    app: 'kubera',
    accountNumber,
    name,
    amount,
    timestamp: Date.now()
  });

  try {
    const dataUrl = await QRCode.toDataURL(qrData, {
      width: 300,
      margin: 2,
      color: {
        dark: '#5b2ef2',   // Kubera primary purple
        light: '#ffffff'
      },
      errorCorrectionLevel: 'M'
    });
    return dataUrl;
  } catch (err) {
    throw new Error('Failed to generate QR code: ' + err.message);
  }
}

/**
 * Parse scanned QR data back into payment info
 * @param {string} qrString - The raw QR string data
 * @returns {object} Parsed payment info
 */
function parsePaymentQR(qrString) {
  try {
    const data = JSON.parse(qrString);
    if (data.app !== 'kubera') {
      throw new Error('Invalid Kubera QR code');
    }
    return {
      accountNumber: data.accountNumber,
      name: data.name,
      amount: data.amount,
      valid: true
    };
  } catch (err) {
    return {
      // Fallback: treat raw string as account number (fake QR)
      accountNumber: qrString,
      name: null,
      amount: null,
      valid: true
    };
  }
}

module.exports = { generatePaymentQR, parsePaymentQR };
