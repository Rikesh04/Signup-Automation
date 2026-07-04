/**
 * PersonalInfoPage — first/last name, email, phone, password, confirm password.
 */
const { expect } = require('@playwright/test');
const { BasePage } = require('./BasePage');
const log = require('../utils/logger');

class PersonalInfoPage extends BasePage {
  constructor(page) {
    super(page);
    this.firstName = page.getByRole('textbox', { name: /First Name/i });
    this.lastName = page.getByRole('textbox', { name: /Last Name/i });
    this.email = page.getByRole('textbox', { name: /Email Address/i });
    this.phone = page.getByRole('textbox', { name: /Phone Number/i });
    // password fields expose no reliable accessible name -> use the name attribute.
    this.password = page.locator('input[name="password"]');
    this.confirmPassword = page.locator('input[name="confirmPassword"]');
    this.nextButton = page.getByRole('button', { name: /^Next$/i });
  }

  async waitLoaded() {
    await expect(this.firstName).toBeVisible();
    log.step('Personal Info page loaded');
  }

  // data comes from utils/testData.js -> generateSignupData()
  async fill(data) {
    await this.firstName.fill(data.firstName);
    await this.lastName.fill(data.lastName);
    await this.email.fill(data.email);
    await this.phone.fill(data.phone);
    await this.password.fill(data.password);
    await this.confirmPassword.fill(data.confirmPassword);
    log.info(`Personal info filled (email: ${data.email})`);
  }

  async submit() {
    await this.nextButton.click();
    log.step('Submitted personal info');
  }
}

module.exports = { PersonalInfoPage };
