# SMT-C — Mobile-First, On-Device PWA

A personal finance Progressive Web App built with **React, TypeScript, Tailwind CSS, and Vite**. Every record — expenses, salary, loans, credit cards, reminders — is stored **only in the browser that opened it** (IndexedDB). There is no database on a server anywhere; nothing you enter is ever sent off the device. Optimised for the iPhone 15 as a Home Screen app.

> **Legacy note:** the `backend/` folder (Express + Prisma + SQLite) was the original server-backed version. It's kept in the repo for reference / local server-mode use, but the deployed app described below **does not use it** — all data logic now lives in `frontend/src/db/`.

---

## Key Features

- **Dashboard**: Live net balance, salary, month expenses, active loans, monthly EMIs, savings, upcoming dues, and category charts — all computed on-device.
- **Salary Module**: Base salary, bonuses, overtime, PF/TDS deductions, auto net in-hand income credited to an account.
- **Expense Module**: 15+ categories, UPI/Cash/Card/Bank methods, receipt photos (stored as local blobs), tags, recurring frequencies.
- **Loan & EMI Module**: 9 loan types, interest, remaining EMIs, outstanding principal, EMI payment history.
- **Credit Card Hub**: Statement/due dates, minimum & total dues, utilization safety meter.
- **Bank Accounts & Transfers**: Cash, Savings, Current, Wallet, UPI accounts with inter-account transfers.
- **Due Date Reminders**: Colour-coded urgency, one-tap add to the iPhone's own Calendar app.
- **Financial Calendar**: FullCalendar view of salary dates, EMI dues, and reminders.
- **Reports & Exports**: PDF, Excel (.xlsx) and CSV — generated in the browser, no server round-trip.
- **Global Search**, **PIN lock**, **Dark / Slate Dark / AMOLED** themes.
- **Backup & Restore**: export everything to a JSON file (saved via the iPhone's own Files/share sheet) and restore it on any device — this is how your data moves between phones or survives a reinstall.

---

## Architecture

```
frontend/
  src/db/          ← the entire "backend": IndexedDB schema, CRUD, dashboard math,
                       backup/restore, PDF/Excel/CSV export, .ics calendar generation
  src/services/api.ts  ← same function names the UI already called; now backed by src/db/*
  api/send-email.ts     ← ONE optional, stateless Vercel serverless function (see below)
backend/            ← legacy Express+Prisma+SQLite server, not used by the deployed app
```

Nothing but `api/send-email.ts` runs on a server. That function holds no database — it only relays an email the phone already composed, because browsers can't send SMTP mail themselves.

---

## Run it locally

```bash
cd frontend
npm install
npm run dev
```
Open `http://localhost:3000`. No backend, no `.env`, no database setup — the app seeds its own default categories/accounts into IndexedDB on first load.

### Run on your iPhone 15 over your home Wi-Fi
1. `npm run dev` as above (Vite prints a `Network: http://<ip>:3000` line — that's your PC's LAN IP).
2. Allow the port through Windows Firewall once, as Administrator:
   ```powershell
   New-NetFirewallRule -DisplayName "SMT-C Vite dev (TCP 3000)" -Direction Inbound -Protocol TCP -LocalPort 3000 -Action Allow -Profile Private
   ```
3. On the iPhone (same Wi-Fi), open Safari → `http://<ip>:3000` → **Share → Add to Home Screen**.

> Over plain `http://` on a LAN IP, iOS won't register the offline service worker (HTTPS is required for that) — everything else, including all data storage, works fully. Once deployed to Vercel (HTTPS), offline caching works too.

---

## Deploy to Vercel

1. Push this repo to GitHub (see below), then **Import Project** in Vercel from that repo.
2. Set **Root Directory** to `frontend`. Vercel auto-detects Vite — no build command overrides needed.
3. Deploy. That's it — the whole app is static except the one optional function below.
4. On your iPhone, open the `https://your-app.vercel.app` URL → **Share → Add to Home Screen**.

Because everything is client-side, every visitor gets their **own private, empty** database on first load — there's nothing to provision, migrate, or pay for.

### Optional: automatic email alerts
By default, Settings → Email alerts → **"Compose in Mail"** always works with zero setup (opens the iPhone Mail app with the digest pre-filled). To make sending fully automatic instead:
1. Gmail: enable 2-Step Verification, then create an **App Password** at https://myaccount.google.com/apppasswords
2. In the Vercel project → Settings → Environment Variables, add:
   - `SMTP_HOST=smtp.gmail.com`, `SMTP_PORT=465`, `SMTP_USER=you@gmail.com`, `SMTP_PASS=<16-char app password>`
   - optional: `SMTP_FROM="SMT-C <you@gmail.com>"`
3. Redeploy. In the app → Settings → Email alerts, **Send test** and **Send now** will now work.

This relay (`frontend/api/send-email.ts`) is stateless — it stores nothing between requests; the client always tells it exactly what to send.

### iPhone Calendar
Reminders page (or Settings) → **Add to Calendar** downloads a `.ics` file and opens Apple's "Add to Calendar" sheet — native iOS alerts 1 day before and at the due time, no server involved. Since your data lives only on the device, there's no auto-refreshing subscription; tap it again after making changes.

---

## Backup, Restore & moving to a new phone

Settings → Data Management:
- **Backup** → downloads `SMT-C_Backup_<date>.json` (save it to Files, iCloud Drive, etc.)
- **Restore** → pick that file back from Files to reload everything, on this device or a new one

This is the app's actual "file manager" integration — the File System Access API used on desktop Chrome isn't available in iOS Safari, so a save/pick flow through the Files app is the correct on-iPhone equivalent.

---

## Push to GitHub

```bash
git remote add origin <your-repo-url>
git push -u origin main
```
(`.gitignore` already excludes `node_modules`, build output, `.env`, and the legacy SQLite file.)

---

## Legacy: running the old server-backed version

The original Express + Prisma + SQLite backend still works standalone if you'd rather run a real server:
```bash
cd backend
npm install
npx prisma db push
npm run db:seed
npm run dev          # http://localhost:5000 (or set PORT=5002, see start.bat)
```
It is **not** wired to the current frontend (`frontend/src/services/api.ts` now talks to `src/db/*`, not `fetch()`). Re-pointing the frontend at it would mean reverting `services/api.ts` to the old fetch-based version.

---

## Tech Stack

- **Frontend**: React 18, TypeScript, Vite, Tailwind CSS, Lucide React, Chart.js, FullCalendar, Vite PWA Plugin, `idb` (IndexedDB), `jsPDF`, `xlsx` (SheetJS).
- **Storage**: IndexedDB, entirely client-side.
- **Optional serverless**: one Vercel function (`nodemailer`) for outbound email only.
- **Legacy backend**: Node.js, Express, TypeScript, Prisma, SQLite (see above).

## License
MIT License
