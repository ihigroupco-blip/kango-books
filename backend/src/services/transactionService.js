const prisma = require('../lib/prisma');

async function list(userId, { type, categoryId, from, to, page = 1, limit = 20 }) {
  const where = { userId };
  if (type) where.type = type;
  if (categoryId) where.categoryId = categoryId;
  if (from || to) {
    where.date = {};
    if (from) where.date.gte = new Date(from);
    if (to) where.date.lte = new Date(to);
  }

  const [transactions, total] = await Promise.all([
    prisma.transaction.findMany({
      where,
      include: { category: { select: { id: true, name: true } } },
      orderBy: { date: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.transaction.count({ where }),
  ]);

  return { transactions, total, page, totalPages: Math.ceil(total / limit) };
}

async function create(userId, data) {
  return prisma.transaction.create({
    data: { ...data, date: new Date(data.date), userId },
    include: { category: { select: { id: true, name: true } } },
  });
}

async function update(userId, id, data) {
  const tx = await prisma.transaction.findFirst({ where: { id, userId } });
  if (!tx) throw { status: 404, message: 'Transaction not found' };

  if (data.date) data.date = new Date(data.date);
  return prisma.transaction.update({
    where: { id },
    data,
    include: { category: { select: { id: true, name: true } } },
  });
}

async function remove(userId, id) {
  const tx = await prisma.transaction.findFirst({ where: { id, userId } });
  if (!tx) throw { status: 404, message: 'Transaction not found' };
  return prisma.transaction.delete({ where: { id } });
}

async function getSummary(userId) {
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

  const [income, expenses, allIncome, allExpenses, recentTransactions] = await Promise.all([
    prisma.transaction.aggregate({
      where: { userId, type: 'INCOME', date: { gte: startOfMonth, lte: endOfMonth } },
      _sum: { amount: true },
    }),
    prisma.transaction.aggregate({
      where: { userId, type: 'EXPENSE', date: { gte: startOfMonth, lte: endOfMonth } },
      _sum: { amount: true },
    }),
    prisma.transaction.aggregate({
      where: { userId, type: 'INCOME' },
      _sum: { amount: true },
    }),
    prisma.transaction.aggregate({
      where: { userId, type: 'EXPENSE' },
      _sum: { amount: true },
    }),
    prisma.transaction.findMany({
      where: { userId },
      include: { category: { select: { id: true, name: true } } },
      orderBy: { date: 'desc' },
      take: 5,
    }),
  ]);

  const monthlyIncome = Number(income._sum.amount || 0);
  const monthlyExpenses = Number(expenses._sum.amount || 0);
  const totalIncome = Number(allIncome._sum.amount || 0);
  const totalExpenses = Number(allExpenses._sum.amount || 0);

  return {
    monthlyIncome,
    monthlyExpenses,
    monthlyProfit: monthlyIncome - monthlyExpenses,
    totalIncome,
    totalExpenses,
    totalProfit: totalIncome - totalExpenses,
    recentTransactions,
  };
}

module.exports = { list, create, update, remove, getSummary };
