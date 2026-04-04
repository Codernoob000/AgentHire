#!/usr/bin/env node

/**
 * ═══════════════════════════════════════════════════════
 *  🌐 ALGOPAY REST API SERVER
 * ═══════════════════════════════════════════════════════
 * 
 * Exposes the AlgoPay multi-agent system as a REST API.
 * Connect any frontend, mobile app, or external service.
 * 
 * Endpoints:
 *   GET  /api/health            — System + network health
 *   GET  /api/account           — Get account address + balance
 *   POST /api/account/generate  — Generate new Algorand account
 *   POST /api/payment/send      — Send a payment
 *   GET  /api/payment/status/:txId — Check transaction status
 *   GET  /api/pentest           — Run penetration tests
 * 
 * Usage: npm run server
 */

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const debug = require('./agents/debug');
const security = require('./agents/security');
const networkAgent = require('./agents/network');
const validation = require('./agents/validation');
const accountService = require('./services/accountService');
const paymentService = require('./services/paymentService');
const hardening = require('./services/hardeningService');
const settings = require('./config/settings');

const app = express();
const PORT = process.env.PORT || 3000;
const AGENT = 'APIServer';

// ─── Middleware ─────────────────────────────────────────
app.use(cors());
app.use(express.json());

// BigInt-safe JSON serialization (algosdk v3 returns BigInts)
app.set('json replacer', (key, value) =>
  typeof value === 'bigint' ? Number(value) : value
);

// Request logging middleware
app.use((req, res, next) => {
  debug.log(debug.LOG_LEVELS.INFO, AGENT, `${req.method} ${req.path}`, {
    ip: req.ip,
    body: req.method === 'POST' ? '(redacted)' : undefined,
  });
  next();
});

// ─── Initialize network on startup ─────────────────────
let initialized = false;
async function ensureInit() {
  if (!initialized) {
    try {
      networkAgent.connect();
      await networkAgent.healthCheck();
      initialized = true;
    } catch (err) {
      debug.logError(AGENT, err);
      throw err;
    }
  }
}

// ═══════════════════════════════════════════════════════
//  ROUTES
// ═══════════════════════════════════════════════════════

/**
 * GET /api/health
 * Check system health + network connectivity.
 */
app.get('/api/health', async (req, res) => {
  try {
    await ensureInit();
    const health = await networkAgent.healthCheck();
    const audit = security.auditEnv();

    res.json({
      status: 'healthy',
      system: settings.SYSTEM_NAME,
      version: settings.VERSION,
      network: {
        name: health.network,
        provider: health.provider,
        lastRound: health.lastRound,
        healthy: health.healthy,
      },
      security: {
        envValid: audit.valid,
        passed: audit.passed.length,
        warnings: audit.warnings.length,
      },
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    res.status(503).json({
      status: 'unhealthy',
      error: err.message,
      timestamp: new Date().toISOString(),
    });
  }
});

/**
 * GET /api/account
 * Get the loaded account's address and balance.
 */
app.get('/api/account', async (req, res) => {
  try {
    await ensureInit();

    if (!process.env.MNEMONIC) {
      return res.status(400).json({
        error: 'MNEMONIC not set in .env. Run: npm run generate-account',
      });
    }

    const account = accountService.loadAccountFromEnv();
    const addrStr = account.addr.toString();
    const balance = await accountService.getBalance(addrStr);
    const config = networkAgent.getConfig();

    res.json({
      address: addrStr,
      balance: balance,
      balanceAlgo: (balance / 1e6).toFixed(4),
      network: config.network,
      explorer: `${config.explorer}/address/${addrStr}`,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * POST /api/account/generate
 * Generate a new Algorand account (returns address + mnemonic).
 * ⚠️ The mnemonic is returned ONCE — save it immediately!
 */
app.post('/api/account/generate', (req, res) => {
  try {
    const { address, mnemonic } = accountService.generateAccount();

    res.json({
      address,
      mnemonic,
      warning: 'Save the mnemonic securely! It will NOT be shown again.',
      instructions: [
        '1. Copy the mnemonic above',
        '2. Set MNEMONIC=<mnemonic> in your .env file',
        '3. Fund the address via TestNet faucet',
      ],
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * POST /api/payment/send
 * Send an ALGO payment.
 * 
 * Body: {
 *   receiver: "ALGORAND_ADDRESS"   (required)
 *   amount: 200000                 (optional, defaults to settings)
 * }
 */
app.post('/api/payment/send', async (req, res) => {
  try {
    await ensureInit();

    const { receiver, amount } = req.body;
    const sendAmount = amount || settings.DEFAULT_AMOUNT_MICROALGOS;

    // Validate inputs
    if (!receiver) {
      return res.status(400).json({ error: 'receiver address is required' });
    }

    const addrCheck = validation.validateAddress(receiver);
    if (!addrCheck.valid) {
      return res.status(400).json({ error: `Invalid receiver: ${addrCheck.errors.join(', ')}` });
    }

    const amountCheck = hardening.validateAmount(sendAmount);
    if (!amountCheck.valid) {
      return res.status(400).json({ error: `Invalid amount: ${amountCheck.errors.join(', ')}` });
    }

    if (!process.env.MNEMONIC) {
      return res.status(400).json({ error: 'MNEMONIC not set in .env' });
    }

    // Load sender account
    const sender = accountService.loadAccountFromEnv();

    // Send payment
    const result = await paymentService.sendPayment(
      sender,
      receiver,
      amountCheck.sanitizedAmount
    );

    const config = networkAgent.getConfig();

    res.json({
      success: true,
      txId: result.txId,
      confirmedRound: result.confirmedRound,
      amount: amountCheck.sanitizedAmount,
      amountAlgo: (amountCheck.sanitizedAmount / 1e6).toFixed(4),
      explorer: `${config.explorer}/tx/${result.txId}`,
    });
  } catch (err) {
    debug.logError(AGENT, err);
    const analysis = debug.analyzeError(err);
    res.status(400).json({
      success: false,
      error: err.message,
      errorType: analysis.type,
      suggestion: analysis.suggestion,
    });
  }
});

/**
 * GET /api/payment/status/:txId
 * Check the status of a transaction by its ID.
 */
app.get('/api/payment/status/:txId', async (req, res) => {
  try {
    await ensureInit();

    const { txId } = req.params;
    const algodClient = networkAgent.getAlgodClient();

    const txInfo = await algodClient.pendingTransactionInformation(txId).do();
    const config = networkAgent.getConfig();

    const confirmedRound = txInfo['confirmed-round'] || txInfo['confirmedRound'];

    res.json({
      txId,
      status: confirmedRound ? 'confirmed' : 'pending',
      confirmedRound: confirmedRound || null,
      explorer: `${config.explorer}/tx/${txId}`,
    });
  } catch (err) {
    res.status(404).json({
      txId: req.params.txId,
      status: 'not_found',
      error: err.message,
    });
  }
});

/**
 * GET /api/pentest
 * Run the penetration test suite and return results.
 */
app.get('/api/pentest', async (req, res) => {
  try {
    const pentest = require('./agents/pentest');
    const results = await pentest.runAllTests();

    res.json({
      score: Math.round((results.passed / results.total) * 100) + '%',
      total: results.total,
      passed: results.passed,
      failed: results.failed,
      warnings: results.warnings,
      tests: results.tests,
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── 404 handler ────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({
    error: 'Endpoint not found',
    availableEndpoints: [
      'GET  /api/health',
      'GET  /api/account',
      'POST /api/account/generate',
      'POST /api/payment/send',
      'GET  /api/payment/status/:txId',
      'GET  /api/pentest',
    ],
  });
});

// ─── Error handler ──────────────────────────────────────
app.use((err, req, res, next) => {
  debug.logError(AGENT, err);
  res.status(500).json({ error: 'Internal server error' });
});

// ─── Start server ───────────────────────────────────────
app.listen(PORT, () => {
  console.log(`
\x1b[36m╔══════════════════════════════════════════════════╗
║                                                  ║
║   🌐 AlgoPay REST API Server                     ║
║                                                  ║
║   URL:      http://localhost:${PORT}                ║
║   Network:  ${(process.env.NETWORK || 'testnet').padEnd(36)}║
║   Version:  ${settings.VERSION.padEnd(36)}║
║                                                  ║
║   Endpoints:                                     ║
║     GET  /api/health                             ║
║     GET  /api/account                            ║
║     POST /api/account/generate                   ║
║     POST /api/payment/send                       ║
║     GET  /api/payment/status/:txId               ║
║     GET  /api/pentest                            ║
║                                                  ║
╚══════════════════════════════════════════════════╝\x1b[0m
  `);
});

module.exports = app;
