const prisma = require('../lib/prisma');

async function list(userId) {
  return prisma.client.findMany({
    where: { userId },
    orderBy: { name: 'asc' },
    include: { _count: { select: { invoices: true } } },
  });
}

async function create(userId, data) {
  return prisma.client.create({ data: { ...data, userId } });
}

async function update(userId, id, data) {
  const client = await prisma.client.findFirst({ where: { id, userId } });
  if (!client) throw { status: 404, message: 'Client not found' };
  return prisma.client.update({ where: { id }, data });
}

async function remove(userId, id) {
  const client = await prisma.client.findFirst({ where: { id, userId } });
  if (!client) throw { status: 404, message: 'Client not found' };
  return prisma.client.delete({ where: { id } });
}

module.exports = { list, create, update, remove };
