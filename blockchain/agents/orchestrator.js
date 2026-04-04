/**
 * ═══════════════════════════════════════════════
 *  🧩 ORCHESTRATOR AGENT — System Coordinator
 * ═══════════════════════════════════════════════
 * 
 * Responsibilities:
 *  - Controls flow between all agents
 *  - Breaks tasks into sequential steps
 *  - Tracks progress with status reporting
 *  - Autonomous retry loop on failure
 *  - Prompts user when human action needed
 */

require('dotenv').config();
const debug = require('./debug');
const security = require('./security');
const networkAgent = require('./network');
const validation = require('./validation');
const accountService = require('../services/accountService');
const paymentService = require('../services/paymentService');
const settings = require('../config/settings');

const AGENT = 'Orchestrator';
const TOTAL_STEPS = 6;

/**
 * Sleep utility.
 */
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Print a system banner.
 */
function printBanner() {
  const banner = `
\x1b[36m╔══════════════════════════════════════════════════════════╗
║                                                          ║
║   █████╗ ██╗      ██████╗  ██████╗ ██████╗  █████╗ ██╗   ║
║  ██╔══██╗██║     ██╔════╝ ██╔═══██╗██╔══██╗██╔══██╗╚██╗  ║
║  ███████║██║     ██║  ███╗██║   ██║██████╔╝███████║ ██║   ║
║  ██╔══██║██║     ██║   ██║██║   ██║██╔═══╝ ██╔══██║ ██║   ║
║  ██║  ██║███████╗╚██████╔╝╚██████╔╝██║     ██║  ██║██╔╝  ║
║  ╚═╝  ╚═╝╚══════╝ ╚═════╝  ╚═════╝ ╚═╝     ╚═╝  ╚═╝╚═╝   ║
║                                                          ║
║  Multi-Agent Blockchain Payment System  v${settings.VERSION}         ║
║                                                          ║
╚══════════════════════════════════════════════════════════╝\x1b[0m
`;
  console.log(banner);
}

/**
 * Main orchestration loop.
 * Runs all agents in sequence with retry logic.
 */
async function run(options = {}) {
  const {
    amount = settings.DEFAULT_AMOUNT_MICROALGOS,
    receiverAddress = process.env.RECEIVER_ADDRESS || null,
  } = options;

  printBanner();
  debug.logSection('🚀 SYSTEM STARTUP');
  debug.log(debug.LOG_LEVELS.INFO, AGENT, `${settings.SYSTEM_NAME} v${settings.VERSION}`);
  debug.log(debug.LOG_LEVELS.INFO, AGENT, `Network: ${process.env.NETWORK || 'testnet'}`);

  let attempt = 0;
  let lastError = null;

  while (attempt < settings.MAX_RETRIES) {
    attempt++;
    if (attempt > 1) {
      debug.logSection(`🔄 RETRY ATTEMPT ${attempt}/${settings.MAX_RETRIES}`);
      const delay = settings.RETRY_DELAY_MS * Math.pow(settings.RETRY_BACKOFF_MULTIPLIER, attempt - 1);
      debug.log(debug.LOG_LEVELS.INFO, AGENT, `Waiting ${delay}ms before retry...`);
      await sleep(delay);
    }

    try {
      // ═══ STEP 1: Security Audit ═══
      debug.logStep(1, TOTAL_STEPS, 'Security Audit');
      const auditResult = security.auditEnv();
      if (!auditResult.valid) {
        debug.log(debug.LOG_LEVELS.WARN, AGENT,
          'Non-critical security warnings detected. Proceeding with caution.');
      }

      // ═══ STEP 2: Network Connection ═══
      debug.logStep(2, TOTAL_STEPS, 'Network Connection & Health Check');
      networkAgent.connect();
      const health = await networkAgent.healthCheck();
      debug.log(debug.LOG_LEVELS.SUCCESS, AGENT,
        `Connected to ${health.provider} (${health.network}) — Round ${health.lastRound}`);

      // ═══ STEP 3: Load & Validate Account ═══
      debug.logStep(3, TOTAL_STEPS, 'Load & Validate Sender Account');
      const senderAccount = accountService.loadAccountFromEnv();

      const mnemonicResult = validation.validateMnemonic(process.env.MNEMONIC);
      if (!mnemonicResult.valid) {
        throw new Error(`Mnemonic validation failed: ${mnemonicResult.errors.join(', ')}`);
      }

      const senderAddrStr = senderAccount.addr.toString();
      debug.log(debug.LOG_LEVELS.SUCCESS, AGENT,
        `Sender: ${security.maskAddress(senderAddrStr)}`);

      // ═══ STEP 4: Resolve Receiver ═══
      debug.logStep(4, TOTAL_STEPS, 'Resolve Receiver Address');
      let receiver = receiverAddress;

      if (!receiver) {
        // Generate a second account as receiver for testing
        debug.log(debug.LOG_LEVELS.INFO, AGENT,
          'No receiver address set — generating test receiver account...');
        const testReceiver = accountService.generateAccount();
        receiver = testReceiver.address;
        debug.log(debug.LOG_LEVELS.INFO, AGENT,
          `Test receiver generated: ${security.maskAddress(receiver)}`);
      }

      const addrResult = validation.validateAddress(receiver);
      if (!addrResult.valid) {
        throw new Error(`Receiver address invalid: ${addrResult.errors.join(', ')}`);
      }

      // ═══ STEP 5: Check Balance ═══
      debug.logStep(5, TOTAL_STEPS, 'Balance Verification');
      const balance = await accountService.getBalance(senderAddrStr);

      if (balance === 0) {
        const config = networkAgent.getConfig();
        debug.logSection('💧 FUNDING REQUIRED');
        debug.log(debug.LOG_LEVELS.WARN, AGENT,
          '⚠️  Your account has 0 ALGO! You need to fund it before sending.');
        debug.log(debug.LOG_LEVELS.INFO, AGENT,
          `📋 Your address: ${senderAddrStr}`);
        debug.log(debug.LOG_LEVELS.INFO, AGENT,
          `🔗 Faucet URL: ${config.faucet || 'https://bank.testnet.algorand.network/'}`);
        debug.log(debug.LOG_LEVELS.INFO, AGENT,
          '👉 Copy your address above, go to the faucet, paste it, and request funds.');
        debug.log(debug.LOG_LEVELS.INFO, AGENT,
          '   Then re-run this script: npm start');

        return {
          success: false,
          reason: 'FUNDING_REQUIRED',
          address: senderAddrStr,
          faucet: config.faucet,
        };
      }

      const balanceCheck = await validation.validateBalance(senderAddrStr, amount);
      if (!balanceCheck.valid) {
        throw new Error(`Insufficient balance: ${balanceCheck.errors.join(', ')}`);
      }

      // ═══ STEP 6: Send Payment ═══
      debug.logStep(6, TOTAL_STEPS, 'Execute Payment');
      const result = await paymentService.sendPayment(senderAccount, receiver, amount);

      // ═══ SUCCESS ═══
      debug.logSection('🏆 MISSION COMPLETE');
      const config = networkAgent.getConfig();
      debug.log(debug.LOG_LEVELS.SUCCESS, AGENT, 'All agents completed successfully!', {
        txId: result.txId,
        confirmedRound: result.confirmedRound,
        amount: `${(amount / 1e6).toFixed(4)} ALGO`,
        explorer: `${config.explorer}/tx/${result.txId}`,
      });

      return {
        success: true,
        txId: result.txId,
        confirmedRound: result.confirmedRound,
        amount,
        attempts: attempt,
      };

    } catch (error) {
      lastError = error;
      const analysis = debug.logError(AGENT, error);

      if (!analysis.recoverable && attempt < settings.MAX_RETRIES) {
        debug.log(debug.LOG_LEVELS.WARN, AGENT,
          'Error is not recoverable via retry. Stopping.');
        break;
      }

      if (attempt >= settings.MAX_RETRIES) {
        debug.log(debug.LOG_LEVELS.ERROR, AGENT,
          `All ${settings.MAX_RETRIES} attempts exhausted.`);
      }
    }
  }

  // ═══ FAILURE ═══
  debug.logSection('❌ SYSTEM FAILED');
  debug.log(debug.LOG_LEVELS.ERROR, AGENT,
    `Failed after ${attempt} attempt(s): ${lastError?.message}`);

  return {
    success: false,
    error: lastError?.message,
    attempts: attempt,
  };
}

module.exports = { run, printBanner };
