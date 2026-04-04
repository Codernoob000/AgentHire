/**
 * ═══════════════════════════════════════════
 *  ACCOUNT SERVICE — Key Management
 * ═══════════════════════════════════════════
 * 
 * Provides:
 *  - Account generation (keypair + mnemonic)
 *  - Load account from .env mnemonic
 *  - Balance queries
 */

const algosdk = require('algosdk');
require('dotenv').config();
const debug = require('../agents/debug');
const networkAgent = require('../agents/network');
const security = require('../agents/security');

const AGENT = 'AccountService';

/**
 * Generate a brand-new Algorand account.
 * Returns { address, mnemonic, secretKey }
 */
function generateAccount() {
  debug.log(debug.LOG_LEVELS.INFO, AGENT, 'Generating new Algorand account...');

  const account = algosdk.generateAccount();
  const mnemonic = algosdk.secretKeyToMnemonic(account.sk);
  const addrStr = account.addr.toString();

  debug.log(debug.LOG_LEVELS.SUCCESS, AGENT,
    `Account generated: ${security.maskAddress(addrStr)}`);

  return {
    address: addrStr,
    mnemonic,
    secretKey: account.sk,
  };
}

/**
 * Load account from MNEMONIC in .env.
 * Returns the algosdk account object { addr, sk }.
 */
function loadAccountFromEnv() {
  debug.log(debug.LOG_LEVELS.INFO, AGENT, 'Loading account from .env mnemonic...');

  const mnemonic = process.env.MNEMONIC;
  if (!mnemonic) {
    throw new Error('MNEMONIC not found in .env. Run: npm run generate-account');
  }

  const account = algosdk.mnemonicToSecretKey(mnemonic.trim());

  debug.log(debug.LOG_LEVELS.SUCCESS, AGENT,
    `Account loaded: ${security.maskAddress(account.addr.toString())}`);

  return account;
}

/**
 * Get the balance of an Algorand address (in microAlgos).
 */
async function getBalance(address) {
  const addrStr = typeof address === 'string' ? address : address.toString();
  const algodClient = networkAgent.getAlgodClient();
  const accountInfo = await algodClient.accountInformation(addrStr).do();
  const balance = Number(accountInfo['amount']);

  debug.log(debug.LOG_LEVELS.INFO, AGENT,
    `Balance for ${security.maskAddress(addrStr)}: ${(balance / 1e6).toFixed(4)} ALGO`);

  return balance;
}

module.exports = {
  generateAccount,
  loadAccountFromEnv,
  getBalance,
};
