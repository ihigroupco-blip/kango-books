const prisma = require('../lib/prisma');

async function monthlyProfitLoss(userId, year) {
  const months = [];

  for (let month = 0; month < 12; month++) {
    const start = new Date(year, month, 1);
    const end = new Date(year, month + 1, 0, 23, 59, 59);

    const [income, expenses] = await Promise.all([
      prisma.transaction.aggregate({
        where: { userId, type: 'INCOME', date: { gte: start, lte: end } },
        _sum: { amount: true },
      }),
      prisma.transaction.aggregate({
        where: { userId, type: 'EXPENSE', date: { gte: start, lte: end } },
        _sum: { amount: true },
      }),
    ]);

    const inc = Number(income._sum.amount || 0);
    const exp = Number(expenses._sum.amount || 0);

    months.push({
      month: start.toLocaleString('default', { month: 'short' }),
      income: inc,
      expenses: exp,
      profit: inc - exp,
    });
  }

  return months;
}

async function categoryBreakdown(userId, { type, from, to }) {
  const where = { userId };
  if (type) where.type = type;
  if (from || to) {
    where.date = {};
    if (from) where.date.gte = new Date(from);
    if (to) where.date.lte = new Date(to);
  }

  const result = await prisma.transaction.groupBy({
    by: ['categoryId'],
    where,
    _sum: { amount: true },
    orderBy: { _sum: { amount: 'desc' } },
  });

  const categories = await prisma.category.findMany({
    where: { id: { in: result.map((r) => r.categoryId).filter(Boolean) } },
    select: { id: true, name: true },
  });

  const catMap = Object.fromEntries(categories.map((c) => [c.id, c.name]));

  return result.map((r) => ({
    categoryId: r.categoryId,
    categoryName: catMap[r.categoryId] || 'Uncategorized',
    total: Number(r._sum.amount),
  }));
}

module.exports = { monthlyProfitLoss, categoryBreakdown };
