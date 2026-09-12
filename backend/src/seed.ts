import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const DEFAULT_CATEGORIES = [
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

export async function resetDatabase() {
  console.log('Resetting database to 0 clean state...');

  // Wipe operational data
  await prisma.expense.deleteMany();
  await prisma.salary.deleteMany();
  await prisma.loanPayment.deleteMany();
  await prisma.loan.deleteMany();
  await prisma.creditPayment.deleteMany();
  await prisma.creditCard.deleteMany();
  await prisma.reminder.deleteMany();
  await prisma.transfer.deleteMany();
  await prisma.budget.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.attachment.deleteMany();
  await prisma.account.deleteMany();

  // Re-seed system default categories
  for (const cat of DEFAULT_CATEGORIES) {
    await prisma.category.upsert({
      where: { name: cat.name },
      update: { icon: cat.icon, color: cat.color },
      create: {
        name: cat.name,
        icon: cat.icon,
        color: cat.color,
        isSystem: true,
      },
    });
  }

  // Create clean initial zero-balance accounts
  await prisma.account.create({
    data: { name: 'Cash in Hand', type: 'CASH', balance: 0, isDefault: true },
  });
  await prisma.account.create({
    data: { name: 'Primary Savings Account', type: 'SAVINGS', bankName: 'Bank', balance: 0 },
  });
  await prisma.account.create({
    data: { name: 'UPI / Wallet', type: 'UPI', balance: 0 },
  });

  // Ensure default settings
  await prisma.settings.upsert({
    where: { id: 'default-settings' },
    update: {},
    create: {
      id: 'default-settings',
      currency: '₹',
      language: 'en',
      theme: 'light',
      enableNotifications: true,
      pinLockEnabled: false,
      autoBackup: true,
      overspendingAlert: true,
      lowBalanceThreshold: 2000,
    },
  });

  console.log('Database reset to 0 clean state completed successfully!');
}

async function main() {
  await resetDatabase();
}

if (require.main === module) {
  main()
    .catch((e) => {
      console.error(e);
      process.exit(1);
    })
    .finally(async () => {
      await prisma.$disconnect();
    });
}
