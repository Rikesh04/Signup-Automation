/**
 * Email OTP reader.
 *
 * Connects to Gmail over IMAP, polls for the most recent message addressed to the
 * (plus-addressed) signup email, and extracts the 6-digit verification code.
 *
 * Requires a Gmail App Password (2-Step Verification must be enabled):
 *   https://myaccount.google.com/apppasswords
 */
const { ImapFlow } = require('imapflow');
const { simpleParser } = require('mailparser');
require('dotenv').config();

const log = require('./logger');

const OTP_REGEX = /\b(\d{6})\b/;

function imapConfig() {
  const { GMAIL_USER, GMAIL_APP_PASSWORD, GMAIL_IMAP_HOST, GMAIL_IMAP_PORT } = process.env;
  if (!GMAIL_USER || !GMAIL_APP_PASSWORD) {
    throw new Error(
      'Gmail IMAP not configured. Set GMAIL_USER and GMAIL_APP_PASSWORD in .env ' +
      '(use a Gmail App Password, not your normal password).'
    );
  }
  return {
    host: GMAIL_IMAP_HOST || 'imap.gmail.com',
    port: Number(GMAIL_IMAP_PORT || 993),
    secure: true,
    auth: { user: GMAIL_USER, pass: GMAIL_APP_PASSWORD },
    logger: false,
  };
}

function extractCode(text) {
  if (!text) return null;
  const m = text.match(OTP_REGEX);
  return m ? m[1] : null;
}

/**
 * Poll Gmail for the verification code sent to `toAddress`.
 * Keeps checking the inbox every `pollMs` until it finds the code or
 * `timeoutMs` runs out.
 */
async function getOtp(toAddress, opts = {}) {
  const timeoutMs = opts.timeoutMs ?? 90_000;
  const pollMs = opts.pollMs ?? 5_000;
  const notBefore = opts.sinceMs ?? Date.now() - 120_000;
  const deadline = Date.now() + timeoutMs;

  log.step(`Waiting for OTP email -> ${toAddress}`);

  while (Date.now() < deadline) {
    const client = new ImapFlow(imapConfig());
    try {
      await client.connect();
      const lock = await client.getMailboxLock('INBOX');
      try {
        // Gmail delivers plus-addressed mail straight to the base inbox, so we
        // still have to filter by `to` ourselves.
        const uids = await client.search({ to: toAddress, since: new Date(notBefore) });
        const recent = (uids || []).slice(-5).reverse(); // newest first

        for (const uid of recent) {
          const msg = await client.fetchOne(uid, { source: true, envelope: true });
          if (!msg || !msg.source) continue;
          const parsed = await simpleParser(msg.source);

          const recipients = (parsed.to?.value || []).map((v) => (v.address || '').toLowerCase());
          if (!recipients.includes(toAddress.toLowerCase())) continue;

          const code =
            extractCode(parsed.subject) ||
            extractCode(parsed.text) ||
            extractCode((parsed.html || '').replace(/<[^>]+>/g, ' '));

          if (code) {
            log.info(`OTP received: ${code}`);
            return code;
          }
        }
      } finally {
        lock.release();
      }
    } catch (err) {
      log.warn(`IMAP poll error (will retry): ${err.message}`);
    } finally {
      try { await client.logout(); } catch { /* ignore */ }
    }

    await new Promise((r) => setTimeout(r, pollMs));
  }

  throw new Error(`Timed out after ${timeoutMs}ms waiting for OTP email to ${toAddress}`);
}

module.exports = { getOtp, extractCode };
