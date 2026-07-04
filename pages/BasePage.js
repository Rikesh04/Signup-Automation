/**
 * BasePage — a few things every page object needs (navigation, clicking a
 * button by name, filling a field by label, etc). Keeps the individual page
 * files from repeating the same Playwright calls over and over.
 */
const { expect } = require('@playwright/test');
const log = require('../utils/logger');
const { screenshot } = require('../utils/helpers');

class BasePage {
  constructor(page) {
    this.page = page;
  }

  // Navigate to a path relative to baseURL (defaults to home).
  async goto(path = '/') {
    log.step(`Navigating to ${path}`);
    await this.page.goto(path, { waitUntil: 'domcontentloaded' });
  }

  // Click a button by its accessible name.
  async clickButton(name) {
    log.step(`Click button: "${name}"`);
    await this.page.getByRole('button', { name, exact: false }).click();
  }

  // Fill a textbox found by its accessible label/name.
  async fillByLabel(name, value, opts = {}) {
    const field = this.page.getByRole('textbox', { name, exact: opts.exact ?? false });
    await field.waitFor({ state: 'visible' });
    await field.fill(String(value));
  }

  // Assert a heading with the given text is visible.
  async expectHeading(text) {
    await expect(
      this.page.getByRole('heading', { name: new RegExp(text, 'i') })
    ).toBeVisible();
  }

  // Take a screenshot (used on failures / milestones).
  async snap(name) {
    return screenshot(this.page, name);
  }
}

module.exports = { BasePage };
