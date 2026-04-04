/**
 * ═══════════════════════════════════════════
 *  ✅ VALIDATION AGENT — Input Verification
 * ═══════════════════════════════════════════
 * 
 * Responsibilities:
 *  - Validate mnemonic format (25 words + algosdk decode)
 *  - Validate Algorand address format
 *  - Check account balance before sending
 *  - Block invalid execution with clear error messages
 */

const algosdk = require('algosdk');
const debug = require('./debug');
const networkAgent = require('./network');
const settings = require('../config/settings');

const AGENT = 'ValidationAgent';

/**
 * Validate a 25-word Algorand mnemonic.
 * Returns { valid: boolean, errors: string[], account?: object }
 */
function validateMnemonic(mnemonic) {
  const errors = [];

  if (!mnemonic || typeof mnemonic !== 'string') {
    errors.push('Mnemonic is empty or not a string.');
    debug.log(debug.LOG_LEVELS.ERROR, AGENT, 'Mnemonic is missing or invalid type.');
    return { valid: false, errors };
  }

  const words = mnemonic.trim().split(/\s+/);
  if (words.length !== 25) {
    errors.push(`Mnemonic must be exactly 25 words. Got ${words.length}.`);
    debug.log(debug.LOG_LEVELS.ERROR, AGENT, `Mnemonic word count: ${words.length} (expected 25)`);
    return { valid: false, errors };
  }

  try {
    const account = algosdk.mnemonicToSecretKey(mnemonic.trim());
    debug.log(debug.LOG_LEVELS.SUCCESS, AGENT, 'Mnemonic is valid.');
    return { valid: true, errors: [], account };
  } catch (err) {
    errors.push(`Mnemonic decoding failed: ${err.message}`);
    debug.logError(AGENT, err);
    return { valid: false, errors };
  }
}

/**
 * Validate an Algorand address.
 * Returns { valid: boolean, errors: string[] }
 */
function validateAddress(address) {
  const errors = [];

  if (!address) {
    errors.push('Address is empty or not provided.');
    debug.log(debug.LOG_LEVELS.ERROR, AGENT, 'Address is missing.');
    return { valid: false, errors };
  }

  // algosdk v3: addr can be an Address object — convert to string
  const addrStr = typeof address === 'string' ? address : address.toString();

  try {
    const isValid = algosdk.isValidAddress(addrStr);
    if (isValid) {
      debug.log(debug.LOG_LEVELS.SUCCESS, AGENT, `Address is valid: ${addrStr.substring(0, 8)}...`);
      return { valid: true, errors: [] };
    } else {
      errors.push('Address failed Algorand format validation.');
      debug.log(debug.LOG_LEVELS.ERROR, AGENT, 'Address is not a valid Algorand address.');
      return { valid: false, errors };
    }
  } catch (err) {
    errors.push(`Address validation error: ${err.message}`);
    debug.logError(AGENT, err);
    return { valid: false, errors };
  }
}

/**
 * Check if an account has sufficient balance to send `amount` microAlgos.
 * Returns { valid: boolean, balance: number, errors: string[] }
 */
async function validateBalance(address, amount) {
  const errors = [];

  try {
    const addrStr = typeof address === 'string' ? address : address.toString();
    const algodClient = networkAgent.getAlgodClient();
    const accountInfo = await algodClient.accountInformation(addrStr).do();
    const balance = Number(accountInfo['amount']);

    debug.log(debug.LOG_LEVELS.INFO, AGENT,
      `Account balance: ${(balance / 1e6).toFixed(4)} ALGO (${balance} microAlgos)`);

    // Check minimum balance requirement
    const requiredBalance = amount + settings.MIN_BALANCE_MICROALGOS + 1000; // +1000 for txn fee
    if (balance < requiredBalance) {
      const needed = ((requiredBalance - balance) / 1e6).toFixed(4);
      errors.push(
        `Insufficient balance. Have: ${(balance / 1e6).toFixed(4)} ALGO, ` +
        `Need: ${(requiredBalance / 1e6).toFixed(4)} ALGO (amount + min balance + fee). ` +
        `Short by: ${needed} ALGO.`
      );
      debug.log(debug.LOG_LEVELS.ERROR, AGENT, errors[0]);
      return { valid: false, balance, errors };
    }

    debug.log(debug.LOG_LEVELS.SUCCESS, AGENT, 'Sufficient balance confirmed.');
    return { valid: true, balance, errors: [] };
  } catch (err) {
    errors.push(`Balance check failed: ${err.message}`);
    debug.logError(AGENT, err);
    return { valid: false, balance: 0, errors };
  }
}

module.exports = {
  validateMnemonic,
  validateAddress,
  validateBalance,
};
