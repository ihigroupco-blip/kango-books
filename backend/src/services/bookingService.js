const prisma = require('../lib/prisma');

async function listByMonth(userId, year, month) {
  const start = new Date(year, month - 1, 1);
  const end = new Date(year, month, 0, 23, 59, 59);

  return prisma.booking.findMany({
    where: { userId, date: { gte: start, lte: end } },
    include: { client: { select: { id: true, name: true } } },
    orderBy: [{ date: 'asc' }, { startTime: 'asc' }],
  });
}

async function create(userId, data) {
  return prisma.booking.create({
    data: { ...data, date: new Date(data.date), userId },
    include: { client: { select: { id: true, name: true } } },
  });
}

async function update(userId, id, data) {
  const booking = await prisma.booking.findFirst({ where: { id, userId } });
  if (!booking) throw { status: 404, message: 'Booking not found' };

  if (data.date) data.date = new Date(data.date);
  return prisma.booking.update({
    where: { id },
    data,
    include: { client: { select: { id: true, name: true } } },
  });
}

async function remove(userId, id) {
  const booking = await prisma.booking.findFirst({ where: { id, userId } });
  if (!booking) throw { status: 404, message: 'Booking not found' };
  return prisma.booking.delete({ where: { id } });
}

module.exports = { listByMonth, create, update, remove };
