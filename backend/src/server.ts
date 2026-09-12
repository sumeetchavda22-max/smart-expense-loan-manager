import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import financeRoutes from './routes/finance';
import exportRoutes from './routes/export';
import notificationRoutes from './routes/notifications';
import { startNotificationScheduler } from './services/notifier';

dotenv.config();

const app = express();
const PORT = Number(process.env.PORT) || 5000;

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, '..', 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Static uploads serving
app.use('/uploads', express.static(uploadsDir));

// Routes
app.use('/api', notificationRoutes); // before financeRoutes so /reminders/:id.ics is matched first
app.use('/api', financeRoutes);
app.use('/api/export', exportRoutes);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Smart Expense & Loan Manager backend running on http://0.0.0.0:${PORT}`);
  startNotificationScheduler();
});
