/**
 * ═══════════════════════════════════════════
 *  🐞 DEBUG AGENT — Logging & Error Analysis
 * ═══════════════════════════════════════════
 * 
 * Responsibilities:
 *  - Structured logging to console + logs/system.log
 *  - Pattern-match common Algorand errors
 *  - Suggest actionable fixes
 *  - Enable the autonomous retry loop
 */

const fs = require('fs');
const path = require('path');
const settings = require('../config/settings');

const LOG_FILE = path.resolve(__dirname, '..', settings.LOG_FILE);
const { LOG_LEVELS } = settings;

// Ensure logs directory exists
const logDir = path.dirname(LOG_FILE);
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir, { recursive: true });
}

// ─── ANSI Colors for console output ────────────────────
const COLORS = {
  RESET: '\x1b[0m',
  RED: '\x1b[31m',
  GREEN: '\x1b[32m',
  YELLOW: '\x1b[33m',
  BLUE: '\x1b[34m',
  MAGENTA: '\x1b[35m',
  CYAN: '\x1b[36m',
  DIM: '\x1b[2m',
  BOLD: '\x1b[1m',
};

const LEVEL_COLORS = {
  DEBUG: COLORS.DIM,
  INFO: COLORS.CYAN,
  WARN: COLORS.YELLOW,
  ERROR: COLORS.RED,
  SUCCESS: COLORS.GREEN,
};

const LEVEL_ICONS = {
  DEBUG: '🔍',
  INFO: 'ℹ️ ',
  WARN: '⚠️ ',
  ERROR: '❌',
  SUCCESS: '✅',
};

// ─── Known error patterns ──────────────────────────────
const ERROR_PATTERNS = [
  {
    pattern: /overspend|underflow|below min/i,
    type: 'INSUFFICIENT_FUNDS',
    suggestion: 'Account does not have enough ALGO. Fund your account using the TestNet faucet.',
    recoverable: false,
  },
  {
    pattern: /invalid.*mnemonic|bad mnemonic|failed to decode/i,
    type: 'INVALID_MNEMONIC',
    suggestion: 'The mnemonic phrase is invalid. It must be exactly 25 words. Regenerate with: npm run generate-account',
    recoverable: false,
  },
  {
    pattern: /malformed.*address|invalid.*address|bad address/i,
    type: 'INVALID_ADDRESS',
    suggestion: 'The Algorand address format is invalid. Check the receiver address in your .env file.',
    recoverable: false,
  },
  {
    pattern: /timeout|ETIMEDOUT|ECONNREFUSED|ENOTFOUND/i,
    type: 'NETWORK_ERROR',
    suggestion: 'Network connection failed. Check your internet connection. The node may be temporarily down — retrying...',
    recoverable: true,
  },
  {
    pattern: /transaction already in ledger/i,
    type: 'DUPLICATE_TRANSACTION',
    suggestion: 'This transaction was already submitted. It may have succeeded on a previous attempt.',
    recoverable: false,
  },
  {
    pattern: /below min balance|min balance not met/i,
    type: 'MIN_BALANCE',
    suggestion: 'Account balance would fall below the minimum required balance (0.1 ALGO). Reduce the send amount or add more funds.',
    recoverable: false,
  },
  {
    pattern: /TransactionPool\.Remember/i,
    type: 'POOL_ERROR',
    suggestion: 'Transaction was rejected by the node pool. This is often a temporary issue — retrying...',
    recoverable: true,
  },
];

/**
 * BigInt-safe JSON serializer.
 */
function safeStringify(obj) {
  return JSON.stringify(obj, (key, value) =>
    typeof value === 'bigint' ? value.toString() : value
  , 2);
}

/**
 * Log a structured message to console and file.
 */
function log(level, agent, message, data = null) {
  const timestamp = new Date().toISOString();
  const icon = LEVEL_ICONS[level] || '';
  const color = LEVEL_COLORS[level] || COLORS.RESET;

  // Console output (colored)
  const consoleMsg = `${COLORS.DIM}[${timestamp}]${COLORS.RESET} ${icon} ${color}${COLORS.BOLD}[${agent}]${COLORS.RESET} ${color}${message}${COLORS.RESET}`;
  console.log(consoleMsg);
  if (data) {
    console.log(`${COLORS.DIM}   └─ ${safeStringify(data)}${COLORS.RESET}`);
  }

  // File output (plain text)
  const fileMsg = `[${timestamp}] [${level}] [${agent}] ${message}${data ? ' | ' + safeStringify(data) : ''}\n`;
  try {
    fs.appendFileSync(LOG_FILE, fileMsg);
  } catch (err) {
    // Silent fallback if file write fails
  }
}

/**
 * Analyze an error and return structured diagnosis.
 */
function analyzeError(error) {
  const errorMessage = error.message || String(error);

  for (const ep of ERROR_PATTERNS) {
    if (ep.pattern.test(errorMessage)) {
      return {
        type: ep.type,
        message: errorMessage,
        suggestion: ep.suggestion,
        recoverable: ep.recoverable,
      };
    }
  }

  // Unknown error
  return {
    type: 'UNKNOWN',
    message: errorMessage,
    suggestion: 'An unexpected error occurred. Check the full error log for details.',
    recoverable: false,
  };
}

/**
 * Log an error with analysis and suggested fix.
 */
function logError(agent, error) {
  const analysis = analyzeError(error);

  log(LOG_LEVELS.ERROR, agent, `${analysis.type}: ${analysis.message}`);
  log(LOG_LEVELS.WARN, 'DebugAgent', `💡 Suggestion: ${analysis.suggestion}`);

  if (analysis.recoverable) {
    log(LOG_LEVELS.INFO, 'DebugAgent', '🔄 This error is recoverable — retry will be attempted.');
  }

  return analysis;
}

/**
 * Log a separator / section header.
 */
function logSection(title) {
  const line = '═'.repeat(50);
  const msg = `\n${COLORS.MAGENTA}${line}\n  ${title}\n${line}${COLORS.RESET}`;
  console.log(msg);

  const fileMsg = `\n${'═'.repeat(50)}\n  ${title}\n${'═'.repeat(50)}\n`;
  try {
    fs.appendFileSync(LOG_FILE, fileMsg);
  } catch (err) { /* silent */ }
}

/**
 * Log agent step progress.
 */
function logStep(stepNumber, totalSteps, description) {
  log(LOG_LEVELS.INFO, 'Orchestrator', `Step ${stepNumber}/${totalSteps}: ${description}`);
}

module.exports = {
  log,
  analyzeError,
  logError,
  logSection,
  logStep,
  LOG_LEVELS,
};
