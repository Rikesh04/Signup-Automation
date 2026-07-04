/**
 * Small shared helpers: filename timestamps, the upload fixture path,
 * and a screenshot helper used on failure.
 */
const fs = require('fs');
const path = require('path');
const log = require('./logger');

/** Timestamp that's safe to use in a filename, e.g. 2026-07-02T16-40-00-000Z */
function fileStamp() {
  return new Date().toISOString().replace(/[:.]/g, '-');
}

/**
 * Return the absolute path to the file we upload during the
 * Business/Documents step. The actual file lives in /fixtures.
 */
function resolveUploadFile(fileName = 'sample-upload.pdf') {
  const filePath = path.resolve(__dirname, '..', 'fixtures', fileName);
  if (!fs.existsSync(filePath)) {
    throw new Error(`Upload fixture not found: ${filePath}. Did you delete it from /fixtures?`);
  }
  return filePath;
}

/** Save a screenshot into /screenshots and return its path. */
async function screenshot(page, name) {
  const dir = path.resolve(__dirname, '..', 'screenshots');
  fs.mkdirSync(dir, { recursive: true });
  const filePath = path.join(dir, `${name}-${fileStamp()}.png`);
  await page.screenshot({ path: filePath, fullPage: true });
  log.info(`Screenshot saved: ${filePath}`);
  return filePath;
}

module.exports = { fileStamp, resolveUploadFile, screenshot };
