# README — Execution Steps

Playwright automation of the full signup flow on
**https://authorized-partner.vercel.app/**, built with the Page Object Model.
The script runs end to end with **no manual intervention** — including reading the
email OTP automatically from Gmail.

---

## 1. Prerequisites

| Tool | Version | Notes |
|------|---------|-------|
| Node.js | 18+ (tested on 20 / 22) | https://nodejs.org (LTS) |
| npm | 9+ | ships with Node |
| Git | any recent | only needed to clone |
| Gmail account | — | with 2-Step Verification + an App Password (to auto-read the OTP) |

Check your versions:

```bash
node -v
npm -v
```

---

## 2. Environment / Setup

- **Language:** JavaScript (Node.js, CommonJS) — not TypeScript
- **Test framework:** Playwright Test (`@playwright/test` ^1.48)
- **Browser / driver:** Chromium (installed via `npx playwright install`)
- **Design pattern:** Page Object Model (`pages/`)
- **Key libraries:**
  - `@faker-js/faker` — realistic random test data
  - `imapflow` + `mailparser` — read the OTP email over Gmail IMAP
  - `dotenv` — load credentials from `.env`

---

## 3. Installation

```bash
# 1. clone the repo
git clone https://github.com/<YOUR-USERNAME>/signup-automation.git
cd signup-automation

# 2. install dependencies
npm install

# 3. install the browser
npx playwright install
```

---

## 4. Configuration (required — the OTP reader needs this)

Copy the example env file and fill in your Gmail details:

```bash
cp .env.example .env      # Windows: copy .env.example .env
```

Edit `.env`:

```dotenv
GMAIL_USER=youraddress@gmail.com
GMAIL_APP_PASSWORD=your16charapppassword
BASE_URL=https://authorized-partner.vercel.app/
```

- `GMAIL_APP_PASSWORD` is a **Gmail App Password** (needs 2-Step Verification on the
  account): https://myaccount.google.com/apppasswords
- The script generates a unique **plus-addressed** email each run
  (`youraddress+ap<timestamp>@gmail.com`), all delivered to your one inbox, so it can
  run repeatedly. The OTP reader polls that inbox and extracts the 6-digit code.

> `.env` is git-ignored — never commit it.

---

## 5. How to run the script

```bash
# headless (default)
npx playwright test

# headed — watch the browser drive itself
npx playwright test --headed


### View the report

```bash
npx playwright show-report reports/html
```

### View a trace (kept on failure)

```bash
npx playwright show-trace reports/artifacts/<...>/trace.zip
```

---

## 6. Test data / accounts used

- **No pre-existing account is required** — every run creates a fresh signup.
- All personal/company data is randomly generated per run (`utils/testData.js`):
  first/last name, agency name, role, address, website, phone
  (Nepal-style `98…`/`97…`, 10 digits), business registration number, etc.
- The **only real credential** is the Gmail App Password in `.env`, used solely to
  read the verification OTP. It is not committed to the repo.

---

## 7. Flow automated (7 steps)

1. Welcome + accept Terms
2. Personal Info (name, email, phone, password)
3. Email OTP verification — code read automatically from Gmail
4. Agency / Company details + Region of Operation
5. Professional Experience (years, students, focus area, services)
6. Verification & Preferences — business reg. no., preferred countries,
   institution types, document upload → Submit
7. Success — redirect to the `/admin/profile` dashboard (asserted)

---

## 8. Notes

- Retries: 1 locally / 2 on CI (`playwright.config.js`).
- On failure the run keeps a **screenshot, video, and trace** for debugging.
- Test tags: `@signup`, `@smoke` — run a subset with `npx playwright test --grep @smoke`.
