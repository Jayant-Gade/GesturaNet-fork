const chalk = require('./colors');

const Progress = {
  transfers: new Map(),

  update: (id, bytes, total, type = 'Sending') => {
    Progress.transfers.set(id, { bytesTransferred: bytes, totalSize: total });

    // If total is unknown (relay sends fileSize:0), show bytes only — no division by zero
    if (!total || total <= 0) {
      const mb = (bytes / (1024 * 1024)).toFixed(2);
      process.stdout.clearLine(0);
      process.stdout.cursorTo(0);
      process.stdout.write(chalk.green(`${type}: ${mb}MB received (size unknown)`));
      return;
    }

    const percent = Math.floor((bytes / total) * 100);
    const mb = (bytes / (1024 * 1024)).toFixed(2);
    const totalMb = (total / (1024 * 1024)).toFixed(2);

    process.stdout.clearLine(0);
    process.stdout.cursorTo(0);
    process.stdout.write(chalk.green(`${type}: ${percent}% (${mb}MB / ${totalMb}MB)`));

    if (bytes >= total) {
      process.stdout.write('\n');
      console.log(chalk.blue(`[Progress] ${type} complete!`));
    }
  },

  getStatus: (id) => {
    const t = Progress.transfers.get(id);
    if (!t) return null;
    const percent = t.totalSize > 0
      ? Math.floor((t.bytesTransferred / t.totalSize) * 100)
      : -1; // -1 signals "unknown total"
    return {
      transferred: t.bytesTransferred,
      total: t.totalSize,
      percent
    };
  }
};

module.exports = Progress;