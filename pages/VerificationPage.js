/**
 * VerificationPage — email OTP entry.
 *
 * The app emails a 6-digit code, which gets read automatically from Gmail
 * (see utils/emailOtp.js) instead of a person typing it in. The flow can
 * show more than one of these screens back to back, so verifyAll() just
 * keeps going until they stop appearing.
 */
const { expect } = require('@playwright/test');
const { BasePage } = require('./BasePage');
const { getOtp } = require('../utils/emailOtp');
const log = require('../utils/logger');

class VerificationPage extends BasePage {
  constructor(page) {
    super(page);
    this.codeInput = page.getByRole('textbox').first();
    this.verifyButton = page.getByRole('button', { name: /Verify Code/i }).first();
  }

  // Wait for the OTP screen to show up after submitting personal info.
  // It takes a moment to render, so we wait instead of checking right away.
  async waitUntilPresent(timeoutMs = 20_000) {
    try {
      await this.verifyButton.waitFor({ state: 'visible', timeout: timeoutMs });
      log.step('OTP verification screen appeared');
      return true;
    } catch {
      log.warn('No OTP screen appeared within timeout');
      return false;
    }
  }

  // Quick check: is an OTP screen showing right now? (no waiting)
  async isPresent() {
    return this.verifyButton.isVisible().catch(() => false);
  }

  // Read the OTP from email and submit it once.
  async verifyOnce(email, sinceMs) {
    await expect(this.verifyButton).toBeVisible();
    const code = await getOtp(email, { sinceMs });
    await this.codeInput.fill(code);
    await this.verifyButton.click();
    log.step(`Submitted OTP ${code}`);
  }

  // Handle however many verification screens show up in a row.
  async verifyAll(email, maxScreens = 3) {
    if (!(await this.waitUntilPresent())) {
      log.step('No verification step in this flow — continuing');
      return;
    }

    for (let i = 0; i < maxScreens; i += 1) {
      if (!(await this.isPresent())) break;
      const since = Date.now() - 30_000; // only accept codes newer than ~30s ago
      await this.verifyOnce(email, since);
      await this.page.waitForTimeout(2500); // let this screen clear / next one load
    }
    log.step('All verification screens cleared');
  }
}

module.exports = { VerificationPage };
