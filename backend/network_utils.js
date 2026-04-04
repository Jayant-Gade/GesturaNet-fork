const os = require('os');

/**
 * Finds the first non-internal IPv4 address of the host machine.
 * This is the secure, native replacement for the 'ip' package.
 */
function getLocalIP() {
  const interfaces = os.networkInterfaces();
  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name]) {
      // family: 4 for IPv4, 6 for IPv6
      // internal: false means it's a real network interface, not localhost
      if ((iface.family === 'IPv4' || iface.family === 4) && !iface.internal) {
        return iface.address;
      }
    }
  }
  return '127.0.0.1';
}

module.exports = { getLocalIP };
