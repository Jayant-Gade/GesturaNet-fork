/**
 * A zero-dependency Terminal Color Utility.
 * Secure, native alternative to 'chalk'.
 */
const colors = {
  reset: '\x1b[0m',
  cyan: '\x1b[36m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  blue: '\x1b[34m',
  gray: '\x1b[90m',
  whiteBright: '\x1b[97m',
  
  colorize: (color, text) => `${colors[color] || ''}${text}${colors.reset}`
};

// Shorthand exports
module.exports = {
  cyan: (t) => colors.colorize('cyan', t),
  green: (t) => colors.colorize('green', t),
  yellow: (t) => colors.colorize('yellow', t),
  red: (t) => colors.colorize('red', t),
  blue: (t) => colors.colorize('blue', t),
  gray: (t) => colors.colorize('gray', t),
  whiteBright: (t) => colors.colorize('whiteBright', t)
};
