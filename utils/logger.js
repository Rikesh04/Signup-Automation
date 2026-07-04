/**
 * Tiny logger so console output is a bit easier to read/scan than plain
 * console.log everywhere. Each function just tags the line with a level.
 */
function stamp() {
  return new Date().toISOString();
}

function log(tag, ...args) {
  // eslint-disable-next-line no-console
  console.log(`${stamp()} [${tag}]`, ...args);
}

module.exports = {
  debug: (...a) => log('DEBUG', ...a),
  info: (...a) => log('INFO', ...a),
  step: (...a) => log('STEP', ...a),   // used for the bigger test steps
  warn: (...a) => log('WARN', ...a),
  error: (...a) => log('ERROR', ...a),
};
