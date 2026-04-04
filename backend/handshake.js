const crypto = require('node:crypto');
const readline = require('readline');
const chalk = require('./colors');
const { fetch } = require('undici');

// Store active/pending transfers in memory
const transfers = new Map();

// ── Queued readline ───────────────────────────────────────────────────────────
// readline is single-threaded: if two requests arrive at once, the second
// rl.question() call would silently queue behind the first and appear frozen.
// We fix this with an explicit promise queue so each prompt runs one at a time.

const rl = readline.createInterface({ input: process.stdin, output: process.stdout });

let promptQueue = Promise.resolve();

function askUser(question) {
  const result = promptQueue.then(
    () => new Promise(resolve => rl.question(question, ans => resolve(ans.toLowerCase())))
  );
  promptQueue = result.catch(() => {});
  return result;
}

// ─────────────────────────────────────────────────────────────────────────────

const Handshake = {
  handleReceiveRequest: async (req, res) => {
    const { fileName, fileSize, mimeType, senderIp, senderPort, hash } = req.body;

    if (!fileName || !senderIp || !senderPort) {
      return res.status(400).json({ status: 'rejected', reason: 'Missing required fields' });
    }

    const sizeMB = fileSize > 0
      ? `${(fileSize / (1024 * 1024)).toFixed(2)} MB`
      : 'Unknown size';

    console.log('\n' + chalk.cyan('----------------------------------------'));
    console.log(chalk.yellow(`Incoming file : ${fileName}`));
    console.log(chalk.gray(`Size          : ${sizeMB}`));
    console.log(chalk.gray(`From          : ${senderIp}:${senderPort}`));
    console.log(chalk.cyan('----------------------------------------'));

    const answer = await askUser(chalk.whiteBright('Accept this file? (y/n): '));

    if (answer === 'y' || answer === 'yes') {
      const transferId = crypto.randomUUID();
      transfers.set(transferId, {
        id: transferId,
        fileName,
        fileSize,
        mimeType,
        senderIp,
        senderPort,
        hash,
        status: 'accepted',
        bytesReceived: 0,
        startTime: Date.now()
      });

      console.log(chalk.green(`[Handshake] Accepted — ID: ${transferId}`));
      return res.json({ status: 'accepted', uploadUrl: `/upload/${transferId}`, transferId });
    } else {
      console.log(chalk.red('[Handshake] Rejected by user.'));
      return res.json({ status: 'rejected' });
    }
  },

  sendHandshake: async (receiverPeer, fileMetadata) => {
    try {
      const url = `http://${receiverPeer.ip}:${receiverPeer.port}/receive-request`;
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(fileMetadata)
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      return await response.json();
    } catch (e) {
      console.error(chalk.red('[Handshake] Error:'), e.message);
      return { status: 'error', message: e.message };
    }
  },

  getTransfers: () => transfers,
  getTransfer: (id) => transfers.get(id)
};

module.exports = Handshake;