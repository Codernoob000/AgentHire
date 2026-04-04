/**
 * ═══════════════════════════════════════════
 *  💸 TRANSACTION AGENT — Build, Sign, Send
 * ═══════════════════════════════════════════
 * 
 * Responsibilities:
 *  - Build Algorand payment transactions
 *  - Sign with sender's secret key
 *  - Submit to network
 *  - Wait for confirmation
 *  - Full pipeline: executePayment()
 */

const algosdk = require('algosdk');
const debug = require('./debug');
const networkAgent = require('./network');
const settings = require('../config/settings');

const AGENT = 'TransactionAgent';

/**
 * Build an unsigned payment transaction.
 */
async function buildTransaction(from, to, amount, note = '') {
  debug.log(debug.LOG_LEVELS.INFO, AGENT,
    `Building payment txn: ${(amount / 1e6).toFixed(4)} ALGO`);

  const algodClient = networkAgent.getAlgodClient();
  const params = await algodClient.getTransactionParams().do();

  const noteEncoded = note
    ? new Uint8Array(Buffer.from(note))
    : undefined;

  // algosdk v3: use 'sender'/'receiver' and Address objects
  const fromAddr = typeof from === 'string' ? algosdk.decodeAddress(from) : from;
  const toAddr = typeof to === 'string' ? algosdk.decodeAddress(to) : to;

  const txn = algosdk.makePaymentTxnWithSuggestedParamsFromObject({
    sender: fromAddr,
    receiver: toAddr,
    amount: amount,
    note: noteEncoded,
    suggestedParams: params,
  });

  const fromStr = typeof from === 'string' ? from : from.toString();
  const toStr = typeof to === 'string' ? to : to.toString();
  debug.log(debug.LOG_LEVELS.SUCCESS, AGENT, 'Transaction built successfully.', {
    from: fromStr.substring(0, 8) + '...',
    to: toStr.substring(0, 8) + '...',
    amount: `${(amount / 1e6).toFixed(4)} ALGO`,
    fee: params.fee || params.minFee || 1000,
  });

  return txn;
}

/**
 * Sign a transaction with the sender's secret key.
 */
function signTransaction(txn, secretKey) {
  debug.log(debug.LOG_LEVELS.INFO, AGENT, 'Signing transaction...');

  const signedTxn = txn.signTxn(secretKey);

  debug.log(debug.LOG_LEVELS.SUCCESS, AGENT, 'Transaction signed.');
  return signedTxn;
}

/**
 * Submit a signed transaction to the network.
 */
async function submitTransaction(signedTxn) {
  debug.log(debug.LOG_LEVELS.INFO, AGENT, 'Submitting transaction to network...');

  const algodClient = networkAgent.getAlgodClient();
  const response = await algodClient.sendRawTransaction(signedTxn).do();

  // algosdk v3 returns the txId in the response
  const txId = response.txId || response.txid || response;

  debug.log(debug.LOG_LEVELS.SUCCESS, AGENT, `Transaction submitted! TxID: ${txId}`);
  return txId;
}

/**
 * Wait for transaction confirmation.
 */
async function confirmTransaction(txId) {
  debug.log(debug.LOG_LEVELS.INFO, AGENT,
    `Waiting for confirmation (${settings.CONFIRMATION_ROUNDS} rounds)...`);

  const algodClient = networkAgent.getAlgodClient();
  const confirmedTxn = await algosdk.waitForConfirmation(
    algodClient,
    txId,
    settings.CONFIRMATION_ROUNDS
  );

  const confirmedRound = confirmedTxn['confirmed-round'] || confirmedTxn['confirmedRound'];

  debug.log(debug.LOG_LEVELS.SUCCESS, AGENT,
    `🎉 Transaction confirmed in round ${confirmedRound}!`, {
      txId,
      confirmedRound,
    });

  return { txId, confirmedRound, confirmedTxn };
}

/**
 * Full payment pipeline: build → sign → submit → confirm.
 */
async function executePayment(senderAccount, receiverAddress, amount, note = 'AlgoPay Agent Payment') {
  debug.logSection('💸 EXECUTING PAYMENT');

  const fromStr = typeof senderAccount.addr === 'string' ? senderAccount.addr : senderAccount.addr.toString();
  const toStr = typeof receiverAddress === 'string' ? receiverAddress : receiverAddress.toString();
  debug.log(debug.LOG_LEVELS.INFO, AGENT, 'Payment details:', {
    from: fromStr.substring(0, 8) + '...',
    to: toStr.substring(0, 8) + '...',
    amount: `${(amount / 1e6).toFixed(4)} ALGO (${amount} microAlgos)`,
  });

  // Step 1: Build
  const txn = await buildTransaction(
    senderAccount.addr,
    receiverAddress,
    amount,
    note
  );

  // Step 2: Sign
  const signedTxn = signTransaction(txn, senderAccount.sk);

  // Step 3: Submit
  const txId = await submitTransaction(signedTxn);

  // Step 4: Confirm
  const result = await confirmTransaction(txId);

  debug.logSection('✅ PAYMENT COMPLETE');
  debug.log(debug.LOG_LEVELS.SUCCESS, AGENT, 'Payment successful!', {
    txId: result.txId,
    confirmedRound: result.confirmedRound,
    amount: `${(amount / 1e6).toFixed(4)} ALGO`,
  });

  return result;
}

module.exports = {
  buildTransaction,
  signTransaction,
  submitTransaction,
  confirmTransaction,
  executePayment,
};
