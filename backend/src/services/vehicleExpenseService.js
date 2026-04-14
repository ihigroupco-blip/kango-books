const prisma = require('../lib/prisma');

async function list(userId, { vehicleId, type, from, to, page = 1, limit = 30 }) {
  const where = { userId };
  if (vehicleId) where.vehicleId = vehicleId;
  if (type) where.type = type;
  if (from || to) {
    where.date = {};
    if (from) where.date.gte = new Date(from);
    if (to) where.date.lte = new Date(to);
  }

  const [expenses, total] = await Promise.all([
    prisma.vehicleExpense.findMany({
      where,
      include: { vehicle: { select: { id: true, rego: true } } },
      orderBy: { date: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.vehicleExpense.count({ where }),
  ]);

  return { expenses, total, page, totalPages: Math.ceil(total / limit) };
}

async function create(userId, data) {
  const vehicle = await prisma.vehicle.findFirst({ where: { id: data.vehicleId, userId } });
  if (!vehicle) throw { status: 404, message: 'Vehicle not found' };

  return prisma.vehicleExpense.create({
    data: {
      vehicleId: data.vehicleId,
      type: data.type,
      description: data.description,
      amount: parseFloat(data.amount),
      date: new Date(data.date),
      receiptUrl: data.receiptUrl || null,
      userId,
    },
    include: { vehicle: { select: { id: true, rego: true } } },
  });
}

async function update(userId, id, data) {
  const expense = await prisma.vehicleExpense.findFirst({ where: { id, userId } });
  if (!expense) throw { status: 404, message: 'Expense not found' };

  const updateData = {};
  if (data.type) updateData.type = data.type;
  if (data.description) updateData.description = data.description;
  if (data.amount) updateData.amount = parseFloat(data.amount);
  if (data.date) updateData.date = new Date(data.date);
  if (data.receiptUrl !== undefined) updateData.receiptUrl = data.receiptUrl || null;

  return prisma.vehicleExpense.update({
    where: { id },
    data: updateData,
    include: { vehicle: { select: { id: true, rego: true } } },
  });
}

async function remove(userId, id) {
  const expense = await prisma.vehicleExpense.findFirst({ where: { id, userId } });
  if (!expense) throw { status: 404, message: 'Expense not found' };
  return prisma.vehicleExpense.delete({ where: { id } });
}

async function getSummary(userId, vehicleId) {
  const where = { userId };
  if (vehicleId) where.vehicleId = vehicleId;

  const result = await prisma.vehicleExpense.groupBy({
    by: ['type'],
    where,
    _sum: { amount: true },
    _count: true,
    orderBy: { _sum: { amount: 'desc' } },
  });

  const total = result.reduce((s, r) => s + Number(r._sum.amount || 0), 0);
  return {
    byType: result.map((r) => ({ type: r.type, total: Number(r._sum.amount), count: r._count })),
    total,
  };
}

module.exports = { list, create, update, remove, getSummary };
