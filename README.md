# Smart Expense & Loan Manager — Mobile-First PWA

A full-stack personal finance management Progressive Web App (PWA) built with **React, TypeScript, Tailwind CSS, Node.js, Express, Prisma ORM, and SQLite**.

---

## Key Features

- **Dashboard**: Live net balance, total salary, month expenses, active loans balance, monthly EMIs, savings calculation, upcoming dues, and category pie charts.
- **Salary Module**: Manage base salary, bonuses, overtime, PF deductions, TDS, and auto-compute net in-hand income deposited to bank accounts.
- **Expense Module**: 15+ predefined categories, UPI/Cash/Card/Bank payment methods, receipt uploads, tags, recurring frequencies, and category budget caps.
- **Loan & EMI Module**: Track 9 loan types (Personal, Home, Vehicle, Education, etc.), interest rates, remaining EMIs, outstanding principal, payment schedules, and progress bars.
- **Credit Card Hub**: Monitor statement dates, payment due dates, minimum & total dues, credit limit utilization safety meter, and rewards.
- **Bank Accounts & Transfers**: Manage Cash, Savings, Current, Wallet, and UPI accounts with inter-account transfer execution.
- **Due Date Reminders & Notifications**: Color-coded urgency cards (Red for today, Orange for tomorrow, Blue for future, Green for completed) with Browser Notification API triggers.
- **Financial Calendar**: FullCalendar integration displaying salary dates, EMI dues, reminders, and daily expense logs.
- **Financial Calculators**: EMI Calculator, Loan Amortization Schedule, Interest Calculator, and Credit Utilization Safety Monitor.
- **Reports & Exports**: 1-click downloads for PDF reports, Excel spreadsheets (.xlsx), and CSV ledgers.
- **Global Instant Search**: Search across expenses, loans, salary, reminders, accounts, and credit cards.
- **Security & Privacy**: Optional 4-digit PIN lock screen, Dark/Light mode toggle, and SQLite JSON Database backup/restore.

---

## Tech Stack

- **Frontend**: React 18, TypeScript, Vite, Tailwind CSS, Lucide React, Chart.js, FullCalendar, Vite PWA Plugin.
- **Backend**: Node.js, Express, TypeScript, Multer, PDFKit, ExcelJS.
- **Database**: SQLite via Prisma ORM.

---

## Installation & Setup Guide

### 1. Prerequisites
- Node.js (v18 or higher recommended)
- npm or yarn

### 2. Backend Setup
```bash
cd backend
npm install
npx prisma db push
npm run db:seed
npm run dev
```
The backend server will run on `http://localhost:5000`.

### 3. Frontend Setup
```bash
cd frontend
npm install
npm run dev
```
The PWA application will open on `http://localhost:3000`.

---

---

## Run on your iPhone (iPhone 15 / iOS 17+)

The frontend is a mobile-first PWA tuned for the iPhone 15 (Dynamic Island & home-indicator safe areas, 44pt touch targets, no input auto-zoom, bottom-sheet modals, pull-to-refresh).

1. **Start both servers** — double-click `start.bat` in the project root (or run the two `npm run dev` commands). Note: on this PC ports 5000/5001 are taken, so the API runs on **5002** and Vite proxies to it via `BACKEND_PORT=5002`.
2. **Allow port 3000 through Windows Firewall** (once, in an *Administrator* PowerShell):
   ```powershell
   New-NetFirewallRule -DisplayName "SmartFinance Vite dev (TCP 3000)" -Direction Inbound -Protocol TCP -LocalPort 3000 -Action Allow -Profile Private
   ```
3. **Find the PC's Wi-Fi IP** — `ipconfig` → IPv4 address of your Wi-Fi/Ethernet adapter (Vite also prints it as `Network: http://<ip>:3000`).
4. On the iPhone (same Wi-Fi), open Safari → `http://<ip>:3000`.
5. Tap **Share → Add to Home Screen**. It launches full-screen like a native app with the SmartFinance icon.

> Over plain `http://` on a LAN IP, iOS does not register the service worker, so offline caching is unavailable — everything else works. For offline/PWA install with caching, serve the built `frontend/dist` over HTTPS.

---

## Email alerts & iPhone Calendar reminders

**Email digest** — once a day (default 8:00 AM) the backend emails a list of everything due today / within N days: reminders, loan EMIs and credit-card bills. New reminders are also emailed with a `.ics` attached.

1. Gmail: enable 2-Step Verification, then create an **App Password** at https://myaccount.google.com/apppasswords
2. In `backend/.env` set `SMTP_USER=you@gmail.com` and `SMTP_PASS=<16-char app password>` (host/port are pre-filled for Gmail), restart the backend.
3. In the app → **Settings → Email alerts**: enter the address, turn the switch on, **Save**, then **Send test**.

Endpoints: `GET /api/notifications/status`, `POST /api/notifications/test`, `POST /api/notifications/send-now`.

**iPhone Calendar (native iOS alerts, no server needed)**
- Reminders page → 📅 button on any reminder opens Apple's *Add to Calendar* sheet (alerts 1 day before + at the due time).
- **Settings → iPhone Calendar → Subscribe** adds a live `webcal://` calendar with all reminders, EMIs, card due/statement days and salary days; it refreshes hourly while the PC is on. *Add once (.ics)* imports a one-time snapshot.
- Feeds: `GET /api/calendar.ics`, `GET /api/reminders/:id.ics`.

## Production Build & Deployment

### Build Backend
```bash
cd backend
npm run build
npm run start
```

### Build Frontend
```bash
cd frontend
npm run build
```
Deploy the generated `frontend/dist` folder to Vercel, Netlify, or serve statically via Express/Nginx.

---

## License
MIT License
