/**
 * ═══════════════════════════════════════════
 *  🌐 NETWORK AGENT — Connection Management
 * ═══════════════════════════════════════════
 * 
 * Responsibilities:
 *  - Initialize Algod and Indexer clients
 *  - Health check with retry logic
 *  - Auto-fallback between providers
 */

const algosdk = require('algosdk');
const { getNetworkConfig } = require('../config/network');
const settings = require('../config/settings');
const debug = require('./debug');

const AGENT = 'NetworkAgent';

let algodClient = null;
let indexerClient = null;
let currentConfig = null;

/**
 * Initialize and return the Algod client.
 */
function connect() {
  currentConfig = getNetworkConfig();

  debug.log(debug.LOG_LEVELS.INFO, AGENT,
    `Connecting to ${currentConfig.label} via ${currentConfig.provider}...`);

  algodClient = new algosdk.Algodv2(
    currentConfig.algod.token,
    currentConfig.algod.server,
    currentConfig.algod.port
  );

  indexerClient = new algosdk.Indexer(
    currentConfig.indexer.token,
    currentConfig.indexer.server,
    currentConfig.indexer.port
  );

  debug.log(debug.LOG_LEVELS.SUCCESS, AGENT,
    `Clients initialized — Algod: ${currentConfig.algod.server}`);

  return { algodClient, indexerClient };
}

/**
 * Health check with retry logic.
 */
async function healthCheck(retries = settings.MAX_RETRIES) {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      debug.log(debug.LOG_LEVELS.INFO, AGENT,
        `Health check attempt ${attempt}/${retries}...`);

      const status = await algodClient.status().do();
      const lastRound = status['last-round'] || status['lastRound'] || 'unknown';

      debug.log(debug.LOG_LEVELS.SUCCESS, AGENT,
        `Node is healthy — Last round: ${lastRound}`);

      return {
        healthy: true,
        lastRound,
        network: currentConfig.network,
        provider: currentConfig.provider,
      };
    } catch (error) {
      debug.logError(AGENT, error);

      if (attempt < retries) {
        const delay = settings.RETRY_DELAY_MS * Math.pow(settings.RETRY_BACKOFF_MULTIPLIER, attempt - 1);
        debug.log(debug.LOG_LEVELS.WARN, AGENT,
          `Retrying in ${delay}ms...`);
        await sleep(delay);
      }
    }
  }

  throw new Error(`Health check failed after ${retries} attempts. Cannot reach ${currentConfig.provider} node.`);
}

/**
 * Get the active Algod client (ensures connection).
 */
function getAlgodClient() {
  if (!algodClient) {
    connect();
  }
  return algodClient;
}

/**
 * Get the active Indexer client (ensures connection).
 */
function getIndexerClient() {
  if (!indexerClient) {
    connect();
  }
  return indexerClient;
}

/**
 * Get current network config.
 */
function getConfig() {
  if (!currentConfig) {
    connect();
  }
  return currentConfig;
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

module.exports = {
  connect,
  healthCheck,
  getAlgodClient,
  getIndexerClient,
  getConfig,
};
