#!/usr/bin/env node

/**
 * ═══════════════════════════════════════════
 *  TEST — End-to-End Payment Test
 * ═══════════════════════════════════════════
 * 
 * Loads mnemonic from .env, sends a test payment,
 * and logs the txId + confirmation round.
 * 
 * Usage: npm test
 */

require('dotenv').config();
const debug = require('./agents/debug');
const networkAgent = require('./agents/network');
const validation = require('./agents/validation');
const accountService = require('./services/accountService');
const paymentService = require('./services/paymentService');
const settings = require('./config/settings');
const security = require('./agents/security');

const AGENT = 'TestRunner';

async function runTest() {
  debug.logSection('🧪 RUNNING END-TO-END TEST');
  debug.log(debug.LOG_LEVELS.INFO, AGENT, `AlgoPay v${settings.VERSION} — Test Suite`);

  let passed = 0;
  let failed = 0;

  // ── Test 1: Environment ────────────────────────
  debug.log(debug.LOG_LEVELS.INFO, AGENT, '── Test 1: Environment Audit ──');
  try {
    const audit = security.auditEnv();
    if (audit.valid) {
      debug.log(debug.LOG_LEVELS.SUCCESS, AGENT, 'PASS: Environment audit');
      passed++;
    } else {
      debug.log(debug.LOG_LEVELS.ERROR, AGENT, `FAIL: ${audit.errors.join(', ')}`);
      failed++;
    }
  } catch (err) {
    debug.logError(AGENT, err);
    failed++;
  }

  // ── Test 2: Network Connection ─────────────────
  debug.log(debug.LOG_LEVELS.INFO, AGENT, '── Test 2: Network Connection ──');
  try {
    networkAgent.connect();
    const health = await networkAgent.healthCheck();
    debug.log(debug.LOG_LEVELS.SUCCESS, AGENT,
      `PASS: Connected to ${health.provider} — Round ${health.lastRound}`);
    passed++;
  } catch (err) {
    debug.logError(AGENT, err);
    failed++;
    // Can't continue without network
    printResults(passed, failed);
    return;
  }

  // ── Test 3: Mnemonic Validation ────────────────
  debug.log(debug.LOG_LEVELS.INFO, AGENT, '── Test 3: Mnemonic Validation ──');
  const mnemonic = process.env.MNEMONIC;
  if (!mnemonic) {
    debug.log(debug.LOG_LEVELS.ERROR, AGENT,
      'FAIL: MNEMONIC not set in .env. Run: npm run generate-account');
    failed++;
    printResults(passed, failed);
    return;
  }

  const mnemonicResult = validation.validateMnemonic(mnemonic);
  if (mnemonicResult.valid) {
    debug.log(debug.LOG_LEVELS.SUCCESS, AGENT, 'PASS: Mnemonic is valid (25 words)');
    passed++;
  } else {
    debug.log(debug.LOG_LEVELS.ERROR, AGENT, `FAIL: ${mnemonicResult.errors.join(', ')}`);
    failed++;
    printResults(passed, failed);
    return;
  }

  // ── Test 4: Load Account ──────────────────────
  debug.log(debug.LOG_LEVELS.INFO, AGENT, '── Test 4: Load Account ──');
  let senderAccount;
  try {
    senderAccount = accountService.loadAccountFromEnv();
    debug.log(debug.LOG_LEVELS.SUCCESS, AGENT,
      `PASS: Account loaded — ${security.maskAddress(senderAccount.addr)}`);
    passed++;
  } catch (err) {
    debug.logError(AGENT, err);
    failed++;
    printResults(passed, failed);
    return;
  }

  // ── Test 5: Balance Check ──────────────────────
  debug.log(debug.LOG_LEVELS.INFO, AGENT, '── Test 5: Balance Check ──');
  try {
    const balance = await accountService.getBalance(senderAccount.addr);
    if (balance === 0) {
      const config = networkAgent.getConfig();
      debug.log(debug.LOG_LEVELS.WARN, AGENT,
        'SKIP: Account has 0 balance — fund via faucet first.');
      debug.log(debug.LOG_LEVELS.INFO, AGENT,
        `📋 Address: ${senderAccount.addr}`);
      debug.log(debug.LOG_LEVELS.INFO, AGENT,
        `🔗 Faucet: ${config.faucet}`);
      printResults(passed, failed, true);
      return;
    }
    debug.log(debug.LOG_LEVELS.SUCCESS, AGENT,
      `PASS: Balance = ${(balance / 1e6).toFixed(4)} ALGO`);
    passed++;
  } catch (err) {
    debug.logError(AGENT, err);
    failed++;
    printResults(passed, failed);
    return;
  }

  // ── Test 6: Send Payment ──────────────────────
  debug.log(debug.LOG_LEVELS.INFO, AGENT, '── Test 6: Send Test Payment ──');
  try {
    // Generate a test receiver
    const testReceiver = accountService.generateAccount();
    debug.log(debug.LOG_LEVELS.INFO, AGENT,
      `Test receiver: ${security.maskAddress(testReceiver.address)}`);

    const result = await paymentService.sendPayment(
      senderAccount,
      testReceiver.address,
      settings.DEFAULT_AMOUNT_MICROALGOS
    );

    debug.log(debug.LOG_LEVELS.SUCCESS, AGENT, 'PASS: Payment sent successfully!', {
      txId: result.txId,
      confirmedRound: result.confirmedRound,
    });
    passed++;

    // Print explorer link
    const config = networkAgent.getConfig();
    debug.log(debug.LOG_LEVELS.INFO, AGENT,
      `🔗 Explorer: ${config.explorer}/tx/${result.txId}`);

  } catch (err) {
    debug.logError(AGENT, err);
    failed++;
  }

  printResults(passed, failed);
}

function printResults(passed, failed, needsFunding = false) {
  debug.logSection('📊 TEST RESULTS');
  const total = passed + failed;
  const color = failed === 0 ? '\x1b[32m' : '\x1b[31m';

  console.log(`\n${color}═══════════════════════════════════`);
  console.log(`  Tests: ${passed}/${total} passed`);
  if (failed > 0) {
    console.log(`  ❌ ${failed} test(s) failed`);
  } else if (needsFunding) {
    console.log(`  ⚠️  Account needs funding to complete payment test`);
  } else {
    console.log(`  ✅ All tests passed!`);
  }
  console.log(`═══════════════════════════════════\x1b[0m\n`);

  process.exit(failed > 0 ? 1 : 0);
}

runTest().catch(err => {
  console.error('\n\x1b[31mTest runner crashed:\x1b[0m', err);
  process.exit(1);
});
