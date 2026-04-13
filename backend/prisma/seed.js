require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  const password = await bcrypt.hash('password123', 10);

  const user = await prisma.user.upsert({
    where: { email: 'demo@kango.com' },
    update: {},
    create: {
      email: 'demo@kango.com',
      password,
      name: 'Demo User',
      businessName: 'Kango Facility Services',
    },
  });

  const categories = [
    { name: 'Cleaning Services', type: 'INCOME' },
    { name: 'Maintenance', type: 'INCOME' },
    { name: 'Consulting', type: 'INCOME' },
    { name: 'Supplies', type: 'EXPENSE' },
    { name: 'Equipment', type: 'EXPENSE' },
    { name: 'Wages', type: 'EXPENSE' },
    { name: 'Utilities', type: 'EXPENSE' },
    { name: 'Insurance', type: 'EXPENSE' },
    { name: 'Transport', type: 'EXPENSE' },
  ];

  for (const cat of categories) {
    await prisma.category.upsert({
      where: { name_userId_type: { name: cat.name, userId: user.id, type: cat.type } },
      update: {},
      create: { name: cat.name, type: cat.type, userId: user.id },
    });
  }

  const client = await prisma.client.upsert({
    where: { name_userId: { name: 'ABC Property Group', userId: user.id } },
    update: {},
    create: {
      name: 'ABC Property Group',
      email: 'contact@abcproperty.com',
      phone: '0412 345 678',
      address: '123 Collins St, Melbourne VIC 3000',
      userId: user.id,
    },
  });

  console.log('Seed completed:', { userId: user.id, clientId: client.id });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
