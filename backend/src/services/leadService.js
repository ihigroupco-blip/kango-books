const prisma = require('../lib/prisma');

async function list(userId, { status, page = 1, limit = 50 }) {
  const where = { userId };
  if (status) where.status = status;

  const [leads, total] = await Promise.all([
    prisma.lead.findMany({
      where,
      orderBy: { updatedAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.lead.count({ where }),
  ]);

  return { leads, total };
}

async function getStats(userId) {
  const counts = await prisma.lead.groupBy({
    by: ['status'],
    where: { userId },
    _count: true,
    _sum: { value: true },
  });

  const stats = {};
  for (const c of counts) {
    stats[c.status] = { count: c._count, value: Number(c._sum.value || 0) };
  }
  return stats;
}

async function create(userId, data) {
  return prisma.lead.create({
    data: { ...data, userId },
  });
}

async function update(userId, id, data) {
  const lead = await prisma.lead.findFirst({ where: { id, userId } });
  if (!lead) throw { status: 404, message: 'Lead not found' };
  return prisma.lead.update({ where: { id }, data });
}

async function updateStatus(userId, id, status) {
  const lead = await prisma.lead.findFirst({ where: { id, userId } });
  if (!lead) throw { status: 404, message: 'Lead not found' };

  const updated = await prisma.lead.update({ where: { id }, data: { status } });

  if (status === 'WON' && lead.status !== 'WON') {
    const existingClient = await prisma.client.findFirst({
      where: { name: lead.company || lead.name, userId },
    });

    if (!existingClient) {
      const client = await prisma.client.create({
        data: {
          name: lead.company || lead.name,
          email: lead.email,
          phone: lead.phone,
          userId,
        },
      });
      return { ...updated, convertedClient: client };
    }
  }

  return updated;
}

async function remove(userId, id) {
  const lead = await prisma.lead.findFirst({ where: { id, userId } });
  if (!lead) throw { status: 404, message: 'Lead not found' };
  return prisma.lead.delete({ where: { id } });
}

module.exports = { list, getStats, create, update, updateStatus, remove };
