import { getDb, uid } from './client';
import { downloadJson } from './download';

const BACKUP_VERSION = '2.0-ondevice';

const blobToBase64 = (blob: Blob): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve((reader.result as string).split(',')[1] || '');
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });

const base64ToBlob = (base64: string, type: string): Blob => {
  const bin = atob(base64);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return new Blob([bytes], { type });
};

/** Every store, as plain JSON — this is the file that gets saved to the iPhone's Files app. */
export async function exportBackup(): Promise<void> {
  const db = await getDb();
  const [settings, accounts, salaries, expenses, loans, loanPayments, creditCards, creditPayments, transfers, reminders, categories, budgets, receipts] =
    await Promise.all([
      db.get('settings', 'default-settings'),
      db.getAll('accounts'),
      db.getAll('salaries'),
      db.getAll('expenses'),
      db.getAll('loans'),
      db.getAll('loanPayments'),
      db.getAll('creditCards'),
      db.getAll('creditPayments'),
      db.getAll('transfers'),
      db.getAll('reminders'),
      db.getAll('categories'),
      db.getAll('budgets'),
      db.getAll('receipts'),
    ]);

  const receiptsEncoded = await Promise.all(
    receipts.map(async (r) => ({ id: r.id, name: r.name, type: r.type, base64: await blobToBase64(r.blob) }))
  );

  const backup = {
    app: 'SmartFinance',
    version: BACKUP_VERSION,
    exportedAt: new Date().toISOString(),
    data: {
      settings,
      accounts,
      salaries,
      expenses,
      loans,
      loanPayments,
      creditCards,
      creditPayments,
      transfers,
      reminders,
      categories,
      budgets,
      receipts: receiptsEncoded,
    },
  };

  const stamp = new Date().toISOString().slice(0, 10);
  downloadJson(backup, `SmartFinance_Backup_${stamp}.json`);
}

/** Replaces everything currently stored with the contents of a previously exported backup file. */
export async function importBackup(file: File): Promise<{ restored: number }> {
  const text = await file.text();
  const parsed = JSON.parse(text);
  const data = parsed?.data ?? parsed; // tolerate a raw {settings, accounts, ...} object too

  const db = await getDb();
  const stores = [
    'settings',
    'accounts',
    'salaries',
    'expenses',
    'loans',
    'loanPayments',
    'creditCards',
    'creditPayments',
    'transfers',
    'reminders',
    'categories',
    'budgets',
    'receipts',
  ] as const;

  let restored = 0;
  for (const store of stores) {
    const rows = data[store];
    if (!Array.isArray(rows) && store !== 'settings') continue;
    await db.clear(store);

    if (store === 'settings' && data.settings && !Array.isArray(data.settings)) {
      await db.put('settings', { ...data.settings, id: 'default-settings' });
      restored++;
      continue;
    }
    if (store === 'receipts' && Array.isArray(rows)) {
      for (const r of rows) {
        if (!r.base64) continue;
        await db.put('receipts', { id: r.id || uid(), name: r.name || 'receipt', type: r.type || 'image/jpeg', blob: base64ToBlob(r.base64, r.type) });
        restored++;
      }
      continue;
    }
    if (Array.isArray(rows)) {
      const tx = db.transaction(store as any, 'readwrite');
      for (const row of rows) {
        await (tx.store as any).put(row);
        restored++;
      }
      await tx.done;
    }
  }

  return { restored };
}
