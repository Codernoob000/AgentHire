/**
 * ═══════════════════════════════════════════
 *  NETWORK CONFIGURATION — AlgoNode Endpoints
 * ═══════════════════════════════════════════
 * 
 * Provides Algod and Indexer endpoints for
 * TestNet and MainNet via AlgoNode (free, no key).
 * Falls back to PureStake if API key is provided.
 */

require('dotenv').config();

const NETWORKS = {
  testnet: {
    algod: {
      server: 'https://testnet-api.algonode.cloud',
      port: '',
      token: '',
    },
    indexer: {
      server: 'https://testnet-idx.algonode.cloud',
      port: '',
      token: '',
    },
    label: 'Algorand TestNet',
    explorer: 'https://testnet.explorer.perawallet.app',
    faucet: 'https://bank.testnet.algorand.network/',
  },
  mainnet: {
    algod: {
      server: 'https://mainnet-api.algonode.cloud',
      port: '',
      token: '',
    },
    indexer: {
      server: 'https://mainnet-idx.algonode.cloud',
      port: '',
      token: '',
    },
    label: 'Algorand MainNet',
    explorer: 'https://explorer.perawallet.app',
    faucet: null,
  },
};

// PureStake override (if API key is provided)
const PURESTAKE_ENDPOINTS = {
  testnet: {
    algod: {
      server: 'https://testnet-algorand.api.purestake.io/ps2',
      port: '',
      token: { 'X-API-Key': process.env.PURESTAKE_API_KEY },
    },
    indexer: {
      server: 'https://testnet-algorand.api.purestake.io/idx2',
      port: '',
      token: { 'X-API-Key': process.env.PURESTAKE_API_KEY },
    },
  },
  mainnet: {
    algod: {
      server: 'https://mainnet-algorand.api.purestake.io/ps2',
      port: '',
      token: { 'X-API-Key': process.env.PURESTAKE_API_KEY },
    },
    indexer: {
      server: 'https://mainnet-algorand.api.purestake.io/idx2',
      port: '',
      token: { 'X-API-Key': process.env.PURESTAKE_API_KEY },
    },
  },
};

/**
 * Returns the active network configuration.
 * Uses PureStake if API key is present, otherwise AlgoNode.
 */
function getNetworkConfig() {
  const network = (process.env.NETWORK || 'testnet').toLowerCase();

  if (!NETWORKS[network]) {
    throw new Error(`Unknown network: "${network}". Use "testnet" or "mainnet".`);
  }

  const usePureStake = !!process.env.PURESTAKE_API_KEY;

  if (usePureStake && PURESTAKE_ENDPOINTS[network]) {
    return {
      ...NETWORKS[network],
      ...PURESTAKE_ENDPOINTS[network],
      provider: 'PureStake',
      network,
    };
  }

  return {
    ...NETWORKS[network],
    provider: 'AlgoNode',
    network,
  };
}

module.exports = { getNetworkConfig, NETWORKS };
