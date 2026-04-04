#!/usr/bin/env node

/**
 * ═══════════════════════════════════════════
 *  GENERATE ACCOUNT — Standalone Script
 * ═══════════════════════════════════════════
 * 
 * Creates a new Algorand account and prints
 * the address + mnemonic for the user.
 * 
 * Usage: npm run generate-account
 */

const algosdk = require('algosdk');

console.log('\n\x1b[36m═══════════════════════════════════════════\x1b[0m');
console.log('\x1b[36m  🔑 Algorand Account Generator\x1b[0m');
console.log('\x1b[36m═══════════════════════════════════════════\x1b[0m\n');

const account = algosdk.generateAccount();
const mnemonic = algosdk.secretKeyToMnemonic(account.sk);

console.log('\x1b[32m✅ New account generated!\x1b[0m\n');
console.log('\x1b[33m📋 Address:\x1b[0m');
console.log(`   ${account.addr}\n`);
console.log('\x1b[33m🔐 Mnemonic (25 words):\x1b[0m');
console.log(`   ${mnemonic}\n`);

console.log('\x1b[36m═══════════════════════════════════════════\x1b[0m');
console.log('\x1b[33m  ⚠️  IMPORTANT — Save these securely!\x1b[0m');
console.log('\x1b[36m═══════════════════════════════════════════\x1b[0m\n');
console.log('  1. Copy the mnemonic above');
console.log('  2. Open your \x1b[33m.env\x1b[0m file');
console.log('  3. Set: \x1b[32mMNEMONIC=<paste mnemonic here>\x1b[0m');
console.log('  4. Fund the address via TestNet faucet:');
console.log('     \x1b[34mhttps://bank.testnet.algorand.network/\x1b[0m\n');
console.log('\x1b[36m═══════════════════════════════════════════\x1b[0m\n');
