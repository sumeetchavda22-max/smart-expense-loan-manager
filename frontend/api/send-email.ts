import nodemailer from 'nodemailer';

/**
 * Optional, stateless email relay for the on-device app.
 *
 * The app's data lives only in each user's browser (IndexedDB) — this function holds
 * no database and remembers nothing between requests. It exists only because a browser
 * cannot open an authenticated SMTP connection itself; the client computes exactly what
 * the email should say (from its own local data) and this function just forwards it.
 *
 * Deploy: add this Vercel project's environment variables — SMTP_HOST, SMTP_PORT,
 * SMTP_USER, SMTP_PASS, and optionally SMTP_FROM. For Gmail: turn on 2-Step
 * Verification, then create an App Password at https://myaccount.google.com/apppasswords
 *
 * If you never set these, the app still works fully — Settings → Email alerts →
 * "Compose in Mail" opens the iPhone Mail app directly with no server involved at all.
 */

function smtpConfigured() {
  return !!(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS);
}

function getTransport() {
  const port = Number(process.env.SMTP_PORT) || 465;
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port,
    secure: port === 465,
    auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
  });
}

function fromAddress() {
  return process.env.SMTP_FROM || `SmartFinance <${process.env.SMTP_USER}>`;
}

const isValidEmail = (s: unknown): s is string => typeof s === 'string' && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s);

export default async function handler(req: any, res: any) {
  // Health check: does the client's "Auto-send" UI have anything to talk to?
  if (req.method === 'GET') {
    res.status(200).json({ configured: smtpConfigured() });
    return;
  }

  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  if (!smtpConfigured()) {
    res.status(503).json({ error: 'Email relay is not configured. Set SMTP_HOST, SMTP_USER and SMTP_PASS in the Vercel project settings.' });
    return;
  }

  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body || {};
    const { to, subject, text, html, icsFilename, icsContent } = body;

    if (!isValidEmail(to)) {
      res.status(400).json({ error: 'A valid "to" address is required.' });
      return;
    }
    if (!subject || (!text && !html)) {
      res.status(400).json({ error: 'subject and text/html are required.' });
      return;
    }

    const transport = getTransport();
    await transport.sendMail({
      from: fromAddress(),
      to,
      subject: String(subject).slice(0, 200),
      text: text ? String(text) : undefined,
      html: html ? String(html) : undefined,
      attachments: icsFilename && icsContent ? [{ filename: String(icsFilename), content: String(icsContent), contentType: 'text/calendar; charset=utf-8' }] : undefined,
    });

    res.status(200).json({ ok: true, to });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to send email' });
  }
}
