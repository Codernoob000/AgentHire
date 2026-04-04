/**
 * ═══════════════════════════════════════════
 *  PAYMENT SERVICE — High-Level Payment API
 * ═══════════════════════════════════════════
 * 
 * Provides the main sendPayment() function
 * that orchestrates validation → transaction.
 */

const debug = require('../agents/debug');
const validation = require('../agents/validation');
const transaction = require('../agents/transaction');
const security = require('../agents/security');
const hardening = require('./hardeningService');
const settings = require('../config/settings');

const AGENT = 'PaymentService';

/**
 * Send a payment from sender to receiver.
 * 
 * @param {Object} senderAccount - { addr, sk } from algosdk
 * @param {string} receiverAddress - Algorand receiver address
 * @param {number} amount - Amount in microAlgos (1 ALGO = 1,000,000)
 * @returns {Object} { txId, confirmedRound }
 */
async function sendPayment(senderAccount, receiverAddress, amount) {
  debug.logSection('📋 PAYMENT SERVICE — Initiating Transfer');

  // ── Step 0: Security hardening checks ─────────────
  debug.log(debug.LOG_LEVELS.INFO, AGENT, 'Running security hardening checks...');
  const hardenResult = hardening.validateTransactionParams(senderAccount, receiverAddress, amount);
  if (!hardenResult.valid) {
    throw new Error(`Security check failed: ${hardenResult.errors.join(', ')}`);
  }
  // Use sanitized amount (floored to integer)
  const safeAmount = hardenResult.sanitizedAmount || amount;

  // ── Step 1: Validate receiver address ──────────────
  debug.log(debug.LOG_LEVELS.INFO, AGENT, 'Validating receiver address...');
  const addrResult = validation.validateAddress(receiverAddress);
  if (!addrResult.valid) {
    throw new Error(`Invalid receiver address: ${addrResult.errors.join(', ')}`);
  }

  // ── Step 2: Validate sender address ────────────────
  debug.log(debug.LOG_LEVELS.INFO, AGENT, 'Validating sender address...');
  const senderAddrResult = validation.validateAddress(senderAccount.addr);
  if (!senderAddrResult.valid) {
    throw new Error(`Invalid sender address: ${senderAddrResult.errors.join(', ')}`);
  }

  // ── Step 3: Validate balance ───────────────────────
  debug.log(debug.LOG_LEVELS.INFO, AGENT, 'Checking sender balance...');
  const balanceResult = await validation.validateBalance(senderAccount.addr, safeAmount);
  if (!balanceResult.valid) {
    throw new Error(`Balance check failed: ${balanceResult.errors.join(', ')}`);
  }

  // ── Step 4: Execute payment ────────────────────────
  debug.log(debug.LOG_LEVELS.INFO, AGENT,
    `Sending ${(safeAmount / 1e6).toFixed(4)} ALGO from ${security.maskAddress(senderAccount.addr)} → ${security.maskAddress(receiverAddress)}`);

  const result = await transaction.executePayment(
    senderAccount,
    receiverAddress,
    safeAmount,
    `AlgoPay Transfer | ${new Date().toISOString()}`
  );

  debug.log(debug.LOG_LEVELS.SUCCESS, AGENT, '🎉 Payment completed successfully!', {
    txId: result.txId,
    confirmedRound: result.confirmedRound,
  });

  return result;
}

module.exports = { sendPayment };
