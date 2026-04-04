/**
 * ═══════════════════════════════════════════
 *  🔐 SECURITY AGENT — Secret Protection
 * ═══════════════════════════════════════════
 * 
 * Responsibilities:
 *  - Audit .env for required variables
 *  - Mask sensitive data in logs
 *  - Scan files for hardcoded secrets
 *  - Enforce security best practices
 */

const fs = require('fs');
const path = require('path');
const debug = require('./debug');

const AGENT = 'SecurityAgent';

/**
 * Audit the .env file for required and sensitive variables.
 */
function auditEnv() {
  debug.log(debug.LOG_LEVELS.INFO, AGENT, 'Running environment security audit...');

  const envPath = path.resolve(__dirname, '..', '.env');
  const results = { passed: [], warnings: [], errors: [] };

  // Check .env exists
  if (!fs.existsSync(envPath)) {
    results.errors.push('.env file not found. Create one from the template.');
    debug.log(debug.LOG_LEVELS.ERROR, AGENT, '.env file is missing!');
    return { valid: false, ...results };
  }
  results.passed.push('.env file exists');

  // Check that .gitignore includes .env
  const gitignorePath = path.resolve(__dirname, '..', '.gitignore');
  if (fs.existsSync(gitignorePath)) {
    const gitignore = fs.readFileSync(gitignorePath, 'utf-8');
    if (gitignore.includes('.env')) {
      results.passed.push('.env is listed in .gitignore');
    } else {
      results.warnings.push('.env is NOT in .gitignore — secrets may be committed!');
      debug.log(debug.LOG_LEVELS.WARN, AGENT, '.env not found in .gitignore!');
    }
  }

  // Check required env vars
  const requiredVars = ['NETWORK'];
  const optionalVars = ['MNEMONIC', 'RECEIVER_ADDRESS', 'PURESTAKE_API_KEY'];

  for (const v of requiredVars) {
    if (process.env[v]) {
      results.passed.push(`${v} is set`);
    } else {
      results.errors.push(`${v} is required but not set in .env`);
    }
  }

  for (const v of optionalVars) {
    if (process.env[v]) {
      results.passed.push(`${v} is set`);
    } else {
      results.warnings.push(`${v} is not set (may be needed later)`);
    }
  }

  const valid = results.errors.length === 0;

  if (valid) {
    debug.log(debug.LOG_LEVELS.SUCCESS, AGENT,
      `Audit passed: ${results.passed.length} checks OK, ${results.warnings.length} warnings`);
  } else {
    debug.log(debug.LOG_LEVELS.ERROR, AGENT,
      `Audit failed: ${results.errors.length} errors, ${results.warnings.length} warnings`);
  }

  return { valid, ...results };
}

/**
 * Mask a sensitive string for safe logging.
 * Shows first 4 and last 4 characters.
 */
function maskSecret(value) {
  if (!value || typeof value !== 'string') return '***';
  if (value.length <= 10) return '***';
  return value.substring(0, 4) + '****' + value.substring(value.length - 4);
}

/**
 * Mask an Algorand address for logging (show first 6 and last 4).
 */
function maskAddress(address) {
  if (!address) return '***';
  const addrStr = typeof address === 'string' ? address : address.toString();
  if (addrStr.length <= 12) return '***';
  return addrStr.substring(0, 6) + '...' + addrStr.substring(addrStr.length - 4);
}

/**
 * Scan a file for potential hardcoded secrets.
 */
function validateNoHardcodedSecrets(filePath) {
  debug.log(debug.LOG_LEVELS.INFO, AGENT, `Scanning ${path.basename(filePath)} for hardcoded secrets...`);

  try {
    const content = fs.readFileSync(filePath, 'utf-8');
    const issues = [];

    // Check for potential mnemonics (25+ lowercase words in a string)
    const mnemonicPattern = /["'`](\b[a-z]+\b\s){24,}\b[a-z]+\b["'`]/g;
    if (mnemonicPattern.test(content)) {
      issues.push('Potential hardcoded mnemonic detected!');
    }

    // Check for raw Algorand addresses (58 chars, uppercase)
    const addrPattern = /["'`][A-Z2-7]{58}["'`]/g;
    const matches = content.match(addrPattern);
    if (matches && matches.length > 0) {
      issues.push(`Found ${matches.length} potential hardcoded Algorand address(es).`);
    }

    if (issues.length === 0) {
      debug.log(debug.LOG_LEVELS.SUCCESS, AGENT, `No hardcoded secrets found in ${path.basename(filePath)}`);
    } else {
      for (const issue of issues) {
        debug.log(debug.LOG_LEVELS.WARN, AGENT, `⚠️  ${issue}`);
      }
    }

    return { clean: issues.length === 0, issues };
  } catch (err) {
    debug.logError(AGENT, err);
    return { clean: false, issues: [`File scan failed: ${err.message}`] };
  }
}

module.exports = {
  auditEnv,
  maskSecret,
  maskAddress,
  validateNoHardcodedSecrets,
};
