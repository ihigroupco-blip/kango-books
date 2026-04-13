const prisma = require('../lib/prisma');

async function list(userId, type) {
  const where = { userId };
  if (type) where.type = type;
  return prisma.category.findMany({ where, orderBy: { name: 'asc' } });
}

async function create(userId, { name, type }) {
  return prisma.category.create({ data: { name, type, userId } });
}

async function remove(userId, id) {
  const cat = await prisma.category.findFirst({ where: { id, userId } });
  if (!cat) throw { status: 404, message: 'Category not found' };
  return prisma.category.delete({ where: { id } });
}

module.exports = { list, create, remove };
