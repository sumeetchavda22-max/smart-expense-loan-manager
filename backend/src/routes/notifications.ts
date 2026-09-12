import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { fullCalendarIcs, reminderToIcs } from '../services/ics';
import { collectDueItems, runDigestCheck, sendTestEmail, smtpConfigured } from '../services/notifier';

const prisma = new PrismaClient();
const router = Router();

// ==========================================
// iPhone Calendar (.ics) feeds
// ==========================================

// Whole calendar: subscribe from iOS via webcal://<host>/api/calendar.ics
router.get('/calendar.ics', async (req, res) => {
  try {
    const ics = await fullCalendarIcs();
    res.setHeader('Content-Type', 'text/calendar; charset=utf-8');
    res.setHeader('Content-Disposition', 'inline; filename="smartfinance.ics"');
    res.setHeader('Cache-Control', 'no-cache');
    res.send(ics);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// One reminder -> "Add to Calendar" sheet on iPhone
router.get('/reminders/:id.ics', async (req, res) => {
  try {
    const file = await reminderToIcs(req.params.id);
    if (!file) return res.status(404).json({ error: 'Reminder not found' });
    res.setHeader('Content-Type', 'text/calendar; charset=utf-8');
    res.setHeader('Content-Disposition', `inline; filename="${file.filename}"`);
    res.setHeader('Cache-Control', 'no-cache');
    res.send(file.ics);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ==========================================
// Email alerts
// ==========================================

router.get('/notifications/status', async (req, res) => {
  try {
    const settings = await prisma.settings.findUnique({ where: { id: 'default-settings' } });
    const due = await collectDueItems(settings?.emailDaysBefore ?? 1);
    res.json({
      smtpConfigured: smtpConfigured(),
      smtpUser: smtpConfigured() ? process.env.SMTP_USER : null,
      notifyEmail: settings?.notifyEmail || null,
      enabled: !!settings?.emailRemindersEnabled,
      daysBefore: settings?.emailDaysBefore ?? 1,
      sendHour: settings?.emailSendHour ?? 8,
      lastDigestDate: settings?.lastEmailDigestDate || null,
      dueNow: due.length,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/notifications/test', async (req, res) => {
  try {
    const settings = await prisma.settings.findUnique({ where: { id: 'default-settings' } });
    const to = (req.body?.to as string) || settings?.notifyEmail;
    if (!to) return res.status(400).json({ error: 'Set a notification email first' });
    await sendTestEmail(to);
    res.json({ ok: true, to });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Send today's digest right now regardless of schedule / dedupe
router.post('/notifications/send-now', async (req, res) => {
  try {
    const result = await runDigestCheck(true);
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
