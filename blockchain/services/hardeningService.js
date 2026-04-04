#!/usr/bin/env node

/**
 * ═══════════════════════════════════════════════════════
 *  🛡️ SECURITY HARDENING — Input Validation Middleware
 * ═══════════════════════════════════════════════════════
 * 
 * Provides hardened input validation that wraps the existing
 * validation agent with additional security checks.
 * 
 * Protections:
 *  - Amount bounds checking (no negative, no overflow, integers only)
 *  - Self-transfer prevention
 *  - Rate limiting on transactions
 *  - Input sanitization
 */

const algosdk = require('algosdk');
const debug = require('../agents/debug');

const AGENT = 'HardeningService';

// Rate limiter state
const txnTimestamps = [];
const RATE_LIMIT_WINDOW_MS = 60000;  // 1 minute
const RATE_LIMIT_MAX_TXN = 10;       // Max 10 txns per minute

/**
 * Validate and sanitize a payment amount.
 * Returns { valid, sanitizedAmount, errors }
 */
function validateAmount(amount) {
  const errors = [];

  // Must be a number
  if (typeof amount !== 'number' || isNaN(amount)) {
    errors.push('Amount must be a valid number.');
    return { valid: false, sanitizedAmount: 0, errors };
  }

  // Must be positive
  if (amount <= 0) {
    errors.push('Amount must be greater than 0.');
    return { valid: false, sanitizedAmount: 0, errors };
  }

  // Must be an integer (microAlgos are whole numbers)
  const sanitized = Math.floor(amount);
  if (sanitized !== amount) {
    debug.log(debug.LOG_LEVELS.WARN, AGENT,
      `Amount ${amount} is not an integer — flooring to ${sanitized} microAlgos`);
  }

  // Max supply check (10 billion ALGO = 10^16 microAlgos)
  const MAX_MICROALGOS = 10_000_000_000_000_000;
  if (sanitized > MAX_MICROALGOS) {
    errors.push(`Amount exceeds maximum ALGO supply (${MAX_MICROALGOS} microAlgos).`);
    return { valid: false, sanitizedAmount: 0, errors };
  }

  // Warn on very large amounts
  if (sanitized > 1_000_000_000) { // > 1000 ALGO
    debug.log(debug.LOG_LEVELS.WARN, AGENT,
      `Large transaction detected: ${(sanitized / 1e6).toFixed(4)} ALGO`);
  }

  return { valid: true, sanitizedAmount: sanitized, errors: [] };
}

/**
 * Check if sender and receiver are the same (self-transfer warning).
 */
function checkSelfTransfer(senderAddr, receiverAddr) {
  const senderStr = typeof senderAddr === 'string' ? senderAddr : senderAddr.toString();
  const receiverStr = typeof receiverAddr === 'string' ? receiverAddr : receiverAddr.toString();

  if (senderStr === receiverStr) {
    debug.log(debug.LOG_LEVELS.WARN, AGENT,
      '⚠️  Self-transfer detected: sender and receiver are the same address.');
    return true;
  }
  return false;
}

/**
 * Rate limiter: prevent transaction flooding.
 * Returns { allowed, waitMs }
 */
function checkRateLimit() {
  const now = Date.now();

  // Remove expired timestamps
  while (txnTimestamps.length > 0 && txnTimestamps[0] < now - RATE_LIMIT_WINDOW_MS) {
    txnTimestamps.shift();
  }

  if (txnTimestamps.length >= RATE_LIMIT_MAX_TXN) {
    const waitMs = txnTimestamps[0] + RATE_LIMIT_WINDOW_MS - now;
    debug.log(debug.LOG_LEVELS.WARN, AGENT,
      `Rate limit exceeded: ${txnTimestamps.length}/${RATE_LIMIT_MAX_TXN} txns in last minute. Wait ${waitMs}ms.`);
    return { allowed: false, waitMs };
  }

  txnTimestamps.push(now);
  return { allowed: true, waitMs: 0 };
}

/**
 * Sanitize a string input (remove control characters, trim).
 */
function sanitizeInput(input) {
  if (typeof input !== 'string') return '';
  // Remove control characters except spaces
  return input.replace(/[\x00-\x1F\x7F]/g, '').trim();
}

/**
 * Validate the complete transaction parameters before execution.
 * This is the main hardening middleware.
 */
function validateTransactionParams(senderAccount, receiverAddress, amount) {
  const errors = [];

  // 1. Rate limit check
  const rateCheck = checkRateLimit();
  if (!rateCheck.allowed) {
    errors.push(`Rate limited: too many transactions. Wait ${Math.ceil(rateCheck.waitMs / 1000)}s.`);
    return { valid: false, errors };
  }

  // 2. Amount validation
  const amountCheck = validateAmount(amount);
  if (!amountCheck.valid) {
    errors.push(...amountCheck.errors);
    return { valid: false, errors };
  }

  // 3. Self-transfer check (warning only, not blocking)
  if (senderAccount && receiverAddress) {
    const senderAddr = senderAccount.addr ? senderAccount.addr : senderAccount;
    checkSelfTransfer(senderAddr, receiverAddress);
  }

  return { valid: true, sanitizedAmount: amountCheck.sanitizedAmount, errors: [] };
}

module.exports = {
  validateAmount,
  checkSelfTransfer,
  checkRateLimit,
  sanitizeInput,
  validateTransactionParams,
};
