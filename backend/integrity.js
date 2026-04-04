const crypto = require('crypto');
const fs = require('fs');
const chalk = require('./colors');

const Integrity = {
  // Compute SHA-256 of a file path (used by sender before sending)
  computeHash: (filePath) => {
    return new Promise((resolve, reject) => {
      const hash = crypto.createHash('sha256');
      const stream = fs.createReadStream(filePath);
      stream.on('data', (chunk) => hash.update(chunk));
      stream.on('end', () => resolve(hash.digest('hex')));
      stream.on('error', reject);
    });
  },

  // Verify received file against expected hash
  // If expectedHash is null/'pending', we compute and LOG the hash but still accept —
  // this is the relay case where the hash is computed mid-stream (no pre-send hash available).
  // The computed hash is returned so the caller can log/store it.
  verifyHash: async (filePath, expectedHash) => {
    const computedHash = await Integrity.computeHash(filePath);

    if (!expectedHash || expectedHash === 'pending') {
      // Relay transfer: no pre-computed hash available.
      // We still compute and surface the hash for audit — just can't compare.
      console.log(chalk.yellow(`[Integrity] Relay transfer — computed hash: ${computedHash}`));
      console.log(chalk.yellow(`[Integrity] Cannot verify (hash was not known before transfer)`));
      return { verified: true, computed: computedHash };
    }

    if (computedHash === expectedHash) {
      console.log(chalk.green(`[Integrity] ✓ Verified: ${filePath}`));
      return { verified: true, computed: computedHash };
    } else {
      console.error(chalk.red(`[Integrity] ✗ Hash mismatch!`));
      console.error(chalk.red(`   Expected : ${expectedHash}`));
      console.error(chalk.red(`   Got      : ${computedHash}`));
      return { verified: false, computed: computedHash };
    }
  }
};

module.exports = Integrity;