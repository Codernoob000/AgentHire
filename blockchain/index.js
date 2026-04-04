#!/usr/bin/env node

/**
 * ═══════════════════════════════════════════
 *  AlgoPay — Main Entry Point
 * ═══════════════════════════════════════════
 * 
 * Runs the Orchestrator Agent which coordinates
 * all agents to execute a payment on Algorand.
 * 
 * Usage: npm start
 */

const orchestrator = require('./agents/orchestrator');
const settings = require('./config/settings');

async function main() {
  try {
    const result = await orchestrator.run({
      amount: settings.DEFAULT_AMOUNT_MICROALGOS,
    });

    if (result.success) {
      console.log('\n\x1b[32m════════════════════════════════════\x1b[0m');
      console.log('\x1b[32m  ✅ Payment sent successfully!\x1b[0m');
      console.log(`\x1b[32m  TxID: ${result.txId}\x1b[0m`);
      console.log(`\x1b[32m  Confirmed: Round ${result.confirmedRound}\x1b[0m`);
      console.log(`\x1b[32m  Attempts: ${result.attempts}\x1b[0m`);
      console.log('\x1b[32m════════════════════════════════════\x1b[0m\n');
      process.exit(0);
    } else if (result.reason === 'FUNDING_REQUIRED') {
      console.log('\n\x1b[33m════════════════════════════════════\x1b[0m');
      console.log('\x1b[33m  💧 Fund your account first!\x1b[0m');
      console.log(`\x1b[33m  Address: ${result.address}\x1b[0m`);
      console.log(`\x1b[33m  Faucet:  ${result.faucet}\x1b[0m`);
      console.log('\x1b[33m════════════════════════════════════\x1b[0m\n');
      process.exit(1);
    } else {
      console.log('\n\x1b[31m════════════════════════════════════\x1b[0m');
      console.log(`\x1b[31m  ❌ Payment failed: ${result.error}\x1b[0m`);
      console.log('\x1b[31m════════════════════════════════════\x1b[0m\n');
      process.exit(1);
    }
  } catch (err) {
    console.error('\n\x1b[31mFatal error:\x1b[0m', err.message);
    process.exit(1);
  }
}

main();
