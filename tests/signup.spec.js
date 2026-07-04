/**
 * End-to-end signup automation for https://authorized-partner.vercel.app/
 *
 * Flow (worked out by clicking through the live app):
 *   Welcome/Terms -> Personal Info -> Email OTP -> Company -> Experience
 *   -> Business/Documents -> Success ("We're thrilled to have you ...")
 *
 * The OTP is read automatically from Gmail (see utils/emailOtp.js) so the
 * whole run is hands-off, per the assignment.
 */
const { test } = require('@playwright/test');

const { WelcomePage } = require('../pages/WelcomePage');
const { PersonalInfoPage } = require('../pages/PersonalInfoPage');
const { VerificationPage } = require('../pages/VerificationPage');
const { CompanyPage } = require('../pages/CompanyPage');
const { ReviewPage } = require('../pages/ReviewPage');

const { generateSignupData } = require('../utils/testData');
const log = require('../utils/logger');

test.describe('Authorized Partner — signup', () => {
  test('completes the full signup flow end to end @signup @smoke', async ({ page }, testInfo) => {
    const data = generateSignupData();
    log.info(`Run started for ${data.firstName} ${data.lastName} <${data.email}>`);

    const welcome = new WelcomePage(page);
    const personal = new PersonalInfoPage(page);
    const verify = new VerificationPage(page);
    const company = new CompanyPage(page);
    const review = new ReviewPage(page);

    await test.step('Welcome & accept terms', async () => {
      await welcome.open();
      await welcome.start();
    });

    await test.step('Fill personal info', async () => {
      await personal.waitLoaded();
      await personal.fill(data);
      await personal.submit();
    });

    await test.step('Verify email OTP', async () => {
      await verify.verifyAll(data.email);
    });

    await test.step('Fill company details', async () => {
      await company.fillCompany(data);
    });

    await test.step('Fill experience details', async () => {
      await company.fillExperience(data);
    });

    await test.step('Fill business/documents & submit', async () => {
      await company.fillBusinessAndSubmit(data);
    });

    await test.step('Assert signup success', async () => {
      await review.expectSuccess();
    });

    // Attach the generated data to the report so it's easy to see what
    // this particular run used (password left out on purpose).
    await testInfo.attach('signup-data', {
      body: JSON.stringify({ ...data, password: '***', confirmPassword: '***' }, null, 2),
      contentType: 'application/json',
    });
    log.info('Signup completed successfully');
  });
});
