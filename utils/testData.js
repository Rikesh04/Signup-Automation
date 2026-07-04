/**
 * Test-data factory. Generates realistic, unique fake data so the signup
 * script can run repeatedly without collisions.
 *
 * Email strategy: Gmail plus-addressing. `base+tag@gmail.com` is unique per run
 * but is delivered to the single `base@gmail.com` inbox, which the OTP reader polls.
 */
const { faker } = require('@faker-js/faker');
require('dotenv').config();

/** Build a unique plus-addressed email from a base Gmail address. */
function uniqueEmail(baseAddress) {
  const base = baseAddress || process.env.SIGNUP_EMAIL_BASE || process.env.GMAIL_USER;
  if (!base || !base.includes('@')) {
    throw new Error(
      'No base email configured. Set GMAIL_USER (or SIGNUP_EMAIL_BASE) in .env'
    );
  }
  const [local, domain] = base.split('@');
  // strip any existing +tag on the base so we always append a fresh one
  const cleanLocal = local.split('+')[0];
  const tag = `ap${Date.now()}${faker.number.int({ min: 100, max: 999 })}`;
  return `${cleanLocal}+${tag}@${domain}`;
}

/** A password that satisfies common strength rules (upper, lower, digit, symbol, len>=8). */
function strongPassword() {
  return `Qa${faker.internet.password({ length: 10, memorable: false })}1!`;
}

/**
 * Produce a full data set for one signup run.
 * Field names map to the real pages discovered via Playwright codegen.
 */
/** Nepal-style mobile: starts 9, then 8 or 7, then 8 random digits -> 10 total. */
function phoneNumber() {
  const second = faker.helpers.arrayElement(['8', '7']);
  const rest = faker.string.numeric({ length: 8 });
  return `9${second}${rest}`;
}

function generateSignupData(overrides = {}) {
  const firstName = faker.person.firstName();
  const lastName = faker.person.lastName();
  const password = strongPassword();

  const data = {
    // --- Personal Info page ---
    firstName,
    lastName,
    email: uniqueEmail(),
    phone: phoneNumber(),                          // 98######## / 97######## (10 digits)
    password,
    confirmPassword: password,

    // --- Company page ---
    companyName: faker.company.name(),
    roleInAgency: faker.person.jobTitle(),
    companyEmail: uniqueEmail(),
    website: `www.${faker.internet.domainName()}`,   // plain domain; the field prepends https://,
    address: `${faker.location.streetAddress()}, ${faker.location.city()}`,
    country: 'Australia',                            // option present in the country combobox

    // --- Experience page ---
    yearsOfExperience: '6 years',                    // visible option label in the dropdown
    studentsRecruited: faker.number.int({ min: 10, max: 9999 }),
    focusArea: 'Undergraduate',
    successMetrics: faker.number.int({ min: 50, max: 100 }),
    services: ['Career Counseling', 'Admission Applications', 'Visa Processing', 'Test Prepration'],

    // --- Business / Documents page ---
    businessRegistrationNumber: faker.string.numeric({ length: 12 }),
    preferredCountries: ['Canada', 'India'],         // multi-select
    partnerInstitutions: ['Universities', 'Colleges'], // checkboxes
    // Resolved to an absolute path at runtime by helpers.resolveUploadFile()
    uploadFileName: 'sample-upload.pdf',
  };

  return { ...data, ...overrides };
}

module.exports = { generateSignupData, uniqueEmail, strongPassword };
