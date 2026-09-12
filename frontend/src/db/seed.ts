import { getDb, nowIso, uid, SettingsRow } from './client';

export const DEFAULT_CATEGORIES = [
  { name: 'Food', icon: 'Utensils', color: '#EF4444' },
  { name: 'Fuel', icon: 'Fuel', color: '#F59E0B' },
  { name: 'Shopping', icon: 'ShoppingBag', color: '#EC4899' },
  { name: 'Medical', icon: 'Stethoscope', color: '#10B981' },
  { name: 'Travel', icon: 'Plane', color: '#3B82F6' },
  { name: 'Rent', icon: 'Home', color: '#8B5CF6' },
  { name: 'Electricity', icon: 'Zap', color: '#F59E0B' },
  { name: 'Internet', icon: 'Wifi', color: '#06B6D4' },
  { name: 'Mobile Recharge', icon: 'Smartphone', color: '#6366F1' },
  { name: 'Entertainment', icon: 'Film', color: '#D946EF' },
  { name: 'Investment', icon: 'TrendingUp', color: '#10B981' },
  { name: 'Education', icon: 'GraduationCap', color: '#3B82F6' },
  { name: 'Insurance', icon: 'ShieldCheck', color: '#64748B' },
  { name: 'Family', icon: 'Users', color: '#F43F5E' },
  { name: 'Miscellaneous', icon: 'MoreHorizontal', color: '#94A3B8' },
];

const defaultSettings = (): SettingsRow => ({
  id: 'default-settings',
  currency: '₹',
  language: 'en',
  theme: 'light',
  enableNotifications: true,
  pinLockEnabled: false,
  fingerprintEnabled: false,
  autoBackup: true,
  overspendingAlert: true,
  lowBalanceThreshold: 2000,
  emailRemindersEnabled: false,
  emailDaysBefore: 1,
  emailSendHour: 8,
  updatedAt: nowIso(),
});

let seeded: Promise<void> | null = null;

/** Populates default categories, starter accounts and settings — once, the first time the app ever opens on this device. */
export function ensureSeeded(): Promise<void> {
  if (!seeded) {
    seeded = (async () => {
      const db = await getDb();
      const existingCats = await db.count('categories');
      if (existingCats === 0) {
        const tx = db.transaction('categories', 'readwrite');
        for (const cat of DEFAULT_CATEGORIES) {
          await tx.store.add({ id: uid(), ...cat, isSystem: true });
        }
        await tx.done;
      }

      const existingAccounts = await db.count('accounts');
      if (existingAccounts === 0) {
        const now = nowIso();
        const tx = db.transaction('accounts', 'readwrite');
        await tx.store.add({ id: uid(), name: 'Cash in Hand', type: 'CASH', balance: 0, isDefault: true, createdAt: now, updatedAt: now });
        await tx.store.add({ id: uid(), name: 'Primary Savings Account', type: 'SAVINGS', bankName: 'Bank', balance: 0, createdAt: now, updatedAt: now });
        await tx.store.add({ id: uid(), name: 'UPI / Wallet', type: 'UPI', balance: 0, createdAt: now, updatedAt: now });
        await tx.done;
      }

      const existingSettings = await db.get('settings', 'default-settings');
      if (!existingSettings) {
        await db.put('settings', defaultSettings());
      }
    })();
  }
  return seeded;
}

/** Wipes all financial data and starts over from a clean, zero-balance state (used by Settings → Reset). */
export async function resetAllData(): Promise<void> {
  const db = await getDb();
  const stores = [
    'expenses',
    'salaries',
    'loanPayments',
    'loans',
    'creditPayments',
    'creditCards',
    'reminders',
    'transfers',
    'budgets',
    'accounts',
    'receipts',
  ] as const;
  for (const store of stores) {
    await db.clear(store);
  }

  const now = nowIso();
  const tx = db.transaction('accounts', 'readwrite');
  await tx.store.add({ id: uid(), name: 'Cash in Hand', type: 'CASH', balance: 0, isDefault: true, createdAt: now, updatedAt: now });
  await tx.store.add({ id: uid(), name: 'Primary Savings Account', type: 'SAVINGS', bankName: 'Bank', balance: 0, createdAt: now, updatedAt: now });
  await tx.store.add({ id: uid(), name: 'UPI / Wallet', type: 'UPI', balance: 0, createdAt: now, updatedAt: now });
  await tx.done;

  const existingSettings = await db.get('settings', 'default-settings');
  await db.put('settings', {
    ...defaultSettings(),
    // keep the user's currency & email alert preferences across a reset — only balances/transactions are wiped
    currency: existingSettings?.currency || '₹',
    notifyEmail: existingSettings?.notifyEmail,
    emailRemindersEnabled: existingSettings?.emailRemindersEnabled,
    emailDaysBefore: existingSettings?.emailDaysBefore,
    emailSendHour: existingSettings?.emailSendHour,
    theme: existingSettings?.theme || 'light',
  });
}
