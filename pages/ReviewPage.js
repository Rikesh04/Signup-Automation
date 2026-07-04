/**
 * ReviewPage — final success state.
 * When signup works, the app logs the user in and redirects to /admin/profile
 * (the "My Profile" dashboard). That redirect is how we know it succeeded.
 */
const { expect } = require('@playwright/test');
const { BasePage } = require('./BasePage');
const log = require('../utils/logger');

class ReviewPage extends BasePage {
  constructor(page) {
    super(page);
    this.profileHeading = page.getByRole('heading', { name: /My Profile/i });
  }

  async expectSuccess() {
    // Success = redirect into the admin dashboard after submit.
    await this.page.waitForURL(/\/admin/, { timeout: 30_000 }).catch(() => {});

    const url = this.page.url();
    if (!/\/admin/.test(url)) {
      log.error(`No redirect to dashboard. Current URL: ${url}`);
      throw new Error(`Expected redirect to /admin after signup, got: ${url}`);
    }

    await expect(this.profileHeading).toBeVisible({ timeout: 15_000 });
    log.step(`Signup success confirmed — dashboard loaded at ${url}`);
  }
}

module.exports = { ReviewPage };