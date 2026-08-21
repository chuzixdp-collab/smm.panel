import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  const hashedPassword = await bcrypt.hash('admin123', 12);
  const admin = await prisma.user.upsert({
    where: { email: 'admin@adnansmm.com' },
    update: {},
    create: {
      email: 'admin@adnansmm.com',
      passwordHash: hashedPassword,
      name: 'Admin',
      role: 'SUPER_ADMIN',
      balance: 1000,
      isActive: true,
    },
  });
  console.log('Admin user created:', admin.email);

  await prisma.paymentSettings.upsert({
    where: { method: 'JAZZCASH' },
    update: {},
    create: {
      method: 'JAZZCASH',
      enabled: true,
      accountNumber: '03001234567',
      accountName: 'ADNAN SMM PANEL',
      minDeposit: 1,
      maxDeposit: 50000,
      instructions: 'Send payment to this JazzCash number. Enter the transaction ID after payment.',
    },
  });

  await prisma.paymentSettings.upsert({
    where: { method: 'EASYPAISA' },
    update: {},
    create: {
      method: 'EASYPAISA',
      enabled: true,
      accountNumber: '03009876543',
      accountName: 'ADNAN SMM PANEL',
      minDeposit: 1,
      maxDeposit: 50000,
      instructions: 'Send payment to this Easypaisa number. Enter the transaction ID after payment.',
    },
  });
  console.log('Payment settings initialized');

  const settings = [
    { key: 'site_name', value: 'ADNAN SMM Panel' },
    { key: 'currency', value: 'USD' },
    { key: 'affiliate_enabled', value: 'true' },
    { key: 'affiliate_percentage', value: '5' },
    { key: 'min_deposit', value: '1' },
    { key: 'maintenance_mode', value: 'false' },
    { key: 'announcement', value: '' },
    { key: 'whatsapp_number', value: '' },
    { key: 'whatsapp_message', value: '' },
    { key: 'whatsapp_enabled', value: 'false' },
    { key: 'support_email', value: 'support@adnansmm.com' },
    { key: 'support_info', value: 'We are available 24/7 to help you.' },
  ];

  for (const s of settings) {
    await prisma.siteSettings.upsert({
      where: { key: s.key },
      update: { value: s.value },
      create: s,
    });
  }
  console.log('Site settings initialized');

  console.log('Seeding complete!');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
