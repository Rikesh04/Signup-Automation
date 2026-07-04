/**
 * WelcomePage — landing page + Terms acceptance.
 * Real flow: click "Join Us Now" -> tick "I agree to the Terms" -> "Continue".
 */
const { expect } = require('@playwright/test');
const { BasePage } = require('./BasePage');
const log = require('../utils/logger');

class WelcomePage extends BasePage {
  constructor(page) {
    super(page);
    this.joinButton = page.getByRole('button', { name: /Join Us Now/i }).first();
    this.termsCheckbox = page.getByRole('checkbox', { name: /I agree to the Terms/i });
    this.continueButton = page.getByRole('button', { name: /^Continue$/i }).first();
  }

  async open() {
    await this.goto('/');
    await expect(this.joinButton).toBeVisible();
    log.step('Welcome page loaded');
  }

  async start() {
    await this.joinButton.click();
    await this.termsCheckbox.waitFor({ state: 'visible' });
    await this.termsCheckbox.check();
    await expect(this.termsCheckbox).toBeChecked();
    await this.continueButton.click();
    log.step('Accepted terms and continued');
  }
}

module.exports = { WelcomePage };
