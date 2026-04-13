const prisma = require('../lib/prisma');

async function list(userId, { status, clientId, page = 1, limit = 20 }) {
  const where = { userId };
  if (status) where.status = status;
  if (clientId) where.clientId = clientId;

  const [invoices, total] = await Promise.all([
    prisma.invoice.findMany({
      where,
      include: {
        client: { select: { id: true, name: true } },
        items: true,
      },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.invoice.count({ where }),
  ]);

  return { invoices, total, page, totalPages: Math.ceil(total / limit) };
}

async function getById(userId, id) {
  const invoice = await prisma.invoice.findFirst({
    where: { id, userId },
    include: {
      client: true,
      items: true,
      user: { select: { name: true, businessName: true, email: true } },
    },
  });
  if (!invoice) throw { status: 404, message: 'Invoice not found' };
  return invoice;
}

async function create(userId, data) {
  const { items, clientId, issueDate, dueDate, notes, tax = 0 } = data;

  const subtotal = items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);
  const total = subtotal + Number(tax);

  const count = await prisma.invoice.count({ where: { userId } });
  const invoiceNumber = `INV-${String(count + 1).padStart(4, '0')}`;

  return prisma.invoice.create({
    data: {
      invoiceNumber,
      clientId,
      userId,
      issueDate: new Date(issueDate),
      dueDate: new Date(dueDate),
      subtotal,
      tax,
      total,
      notes,
      items: {
        create: items.map((item) => ({
          description: item.description,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          amount: item.quantity * item.unitPrice,
        })),
      },
    },
    include: { client: { select: { id: true, name: true } }, items: true },
  });
}

async function updateStatus(userId, id, status) {
  const invoice = await prisma.invoice.findFirst({ where: { id, userId } });
  if (!invoice) throw { status: 404, message: 'Invoice not found' };

  const updated = await prisma.invoice.update({
    where: { id },
    data: { status },
    include: { client: { select: { id: true, name: true } }, items: true },
  });

  if (status === 'PAID') {
    await prisma.transaction.create({
      data: {
        description: `Payment for ${invoice.invoiceNumber}`,
        amount: invoice.total,
        type: 'INCOME',
        date: new Date(),
        userId,
        invoiceId: id,
      },
    });
  }

  return updated;
}

async function remove(userId, id) {
  const invoice = await prisma.invoice.findFirst({ where: { id, userId } });
  if (!invoice) throw { status: 404, message: 'Invoice not found' };
  return prisma.invoice.delete({ where: { id } });
}

module.exports = { list, getById, create, updateStatus, remove };
