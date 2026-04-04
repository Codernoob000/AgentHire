/**
 * ═══════════════════════════════════════
 *  GLOBAL SETTINGS & CONSTANTS
 * ═══════════════════════════════════════
 */

module.exports = {
  // Transaction defaults
  DEFAULT_AMOUNT_MICROALGOS: 200000,        // 0.2 ALGO — covers receiver min balance (0.1 ALGO)
  CONFIRMATION_ROUNDS: 4,                  // Rounds to wait for confirmation

  // Retry settings (autonomous loop)
  MAX_RETRIES: 3,
  RETRY_DELAY_MS: 2000,                   // Base delay between retries
  RETRY_BACKOFF_MULTIPLIER: 2,            // Exponential backoff

  // Network health check
  HEALTH_CHECK_TIMEOUT_MS: 10000,

  // Logging
  LOG_FILE: 'logs/system.log',
  LOG_LEVELS: {
    DEBUG: 'DEBUG',
    INFO: 'INFO',
    WARN: 'WARN',
    ERROR: 'ERROR',
    SUCCESS: 'SUCCESS',
  },

  // Minimum balance (0.1 ALGO in microAlgos)
  MIN_BALANCE_MICROALGOS: 100000,

  // System info
  SYSTEM_NAME: 'AlgoPay Multi-Agent System',
  VERSION: '1.0.0',
};
