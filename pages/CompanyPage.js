/**
 * CompanyPage — covers three steps in a row: Company details, Experience,
 * and Business/Documents. They're all on the same "wizard" and share the
 * Next/Submit buttons, so it was easier to keep them in one page object
 * instead of three.
 *
 * A few of the dropdowns/checkboxes on this site aren't plain HTML
 * <select>/<input> elements, so some methods below have a fallback in case
 * the accessible role isn't there. Found this out the hard way after the
 * codegen recording didn't work reliably.
 */
const { expect } = require('@playwright/test');
const { BasePage } = require('./BasePage');
const { resolveUploadFile } = require('../utils/helpers');
const log = require('../utils/logger');

class CompanyPage extends BasePage {
  constructor(page) {
    super(page);
    // --- Company step ---
    this.name = page.getByRole('textbox', { name: /^Name$/i });
    this.role = page.getByRole('textbox', { name: /Role in Agency/i });
    this.email = page.locator('input[name="agency_email"]');
    this.website = page.getByRole('textbox', { name: /Website/i });
    this.address = page.locator('input[name="agency_address"]');
    this.countryCombobox = page.getByRole('combobox').first();
    this.nextButton = page.getByRole('button', { name: /^Next$/i }).first();
    this.submitButton = page.getByRole('button', { name: /^Submit$/i }).first();
  }

  async fillCompany(data) {
    await expect(this.name).toBeVisible();
    await this.name.fill(data.companyName);
    await this.role.fill(data.roleInAgency);
    await this.email.fill(data.companyEmail);
    await this.website.fill(data.website);
    await this.address.fill(data.address);
    await this.selectFromCombobox(this.countryCombobox, data.country);
    log.step('Company details filled');
    await this.nextButton.click();
  }

  async fillExperience(data) {
    // Wait for this step to actually render before touching fields.
    await this.page.getByText(/Years of Experience/i).first().waitFor({ state: 'visible' });

    await this.selectDropdown(/Years of Experience/i, data.yearsOfExperience);

    await this.fillSpinOrTextByLabel(/Number of Students Recruited/i, data.studentsRecruited);
    await this.fillSpinOrTextByLabel(/Focus Area/i, data.focusArea);
    await this.fillSpinOrTextByLabel(/Success Metrics/i, data.successMetrics);

    for (const service of data.services) {
      await this.checkByName(service);
    }
    log.step('Experience details filled');
    await this.nextButton.click();
  }

  // Open a dropdown by its visible label, then click the matching option.
  // Tries the real combobox role first; if that's not there, falls back to
  // clicking whatever control sits right after the label text.
  async selectDropdown(labelRe, optionText) {
    let control = this.page.getByRole('combobox', { name: labelRe });
    if (!(await control.count())) {
      const label = this.page.getByText(labelRe).first();
      control = label.locator('xpath=following::*[self::button or @role="combobox" or contains(@class,"select")][1]');
    }
    await control.first().click();
    const opt = this.page.getByRole('option', { name: new RegExp(optionText, 'i') });
    if (await opt.count()) {
      await opt.first().click();
    } else {
      await this.page.getByText(new RegExp(`^${optionText}$`, 'i')).first().click();
    }
  }

  // Fill a field found by its accessible label — could render as a
  // spinbutton (number input) or a plain textbox depending on the field.
  async fillSpinOrTextByLabel(labelRe, value) {
    let field = this.page.getByRole('spinbutton', { name: labelRe });
    if (!(await field.count())) field = this.page.getByRole('textbox', { name: labelRe });
    await field.first().fill(String(value));
  }

  async fillBusinessAndSubmit(data) {
    await this.page.getByRole('textbox', { name: /Business Registration Number/i })
      .fill(String(data.businessRegistrationNumber));

    // Preferred countries is a multiselect — open it once, tick each option.
    await this.openPreferredCountries();
    for (const country of data.preferredCountries) {
      await this.pickCountryOption(country);
    }
    await this.page.keyboard.press('Escape'); // close it so it doesn't cover the fields below

    for (const inst of data.partnerInstitutions) {
      await this.checkByName(inst);
    }

    // The page has more than one file input on it, so grab the first one.
    const fileInput = this.page.locator('input[type="file"]').first();
    await fileInput.setInputFiles(resolveUploadFile(data.uploadFileName));

    log.step('Business/documents filled, submitting');
    await this.submitButton.click();
  }

  // --- small helpers used above ---

  async selectFromCombobox(combobox, value) {
    await combobox.click();
    const option = this.page.getByRole('option', { name: new RegExp(`^${value}$`, 'i') });
    if (await option.count()) {
      await option.first().click();
    } else {
      // Not a real <select> — match the visible option text instead.
      await this.page.locator('div').filter({ hasText: new RegExp(`^${value}$`) }).first().click();
    }
  }

  // Open the "Select Your Preferred Countries" multiselect.
  async openPreferredCountries() {
    const box = this.page.getByText(/Select Your Preferred Countries/i).first();
    await box.click();
    await this.page.waitForTimeout(500); // give the option list a moment to render
  }

  // Click one country option inside the open multiselect.
  async pickCountryOption(value) {
    const opt = this.page.getByRole('option', { name: new RegExp(`^${value}$`, 'i') });
    if (await opt.count()) {
      await opt.first().click();
      return;
    }
    await this.page.getByText(new RegExp(`^${value}$`, 'i')).first().click();
  }

  async checkByName(name) {
    const cb = this.page.getByRole('checkbox', { name: new RegExp(name, 'i') });
    if (await cb.count()) {
      await cb.first().check().catch(async () => { await cb.first().click(); });
    } else {
      await this.page.getByText(name, { exact: false }).first().click();
    }
  }
}

module.exports = { CompanyPage };
