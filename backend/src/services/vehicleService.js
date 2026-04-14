const prisma = require('../lib/prisma');

async function list(userId) {
  return prisma.vehicle.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
    include: {
      _count: { select: { trips: true, expenses: true } },
      logbookPeriods: {
        where: { isActive: true },
        take: 1,
        select: { id: true, startDate: true, isActive: true },
      },
    },
  });
}

async function getById(userId, id) {
  const vehicle = await prisma.vehicle.findFirst({ where: { id, userId } });
  if (!vehicle) throw { status: 404, message: 'Vehicle not found' };
  return vehicle;
}

async function create(userId, data) {
  return prisma.vehicle.create({
    data: {
      rego: data.rego.toUpperCase().trim(),
      make: data.make,
      model: data.model,
      year: parseInt(data.year),
      currentOdometer: parseInt(data.currentOdometer),
      userId,
    },
  });
}

async function update(userId, id, data) {
  const vehicle = await prisma.vehicle.findFirst({ where: { id, userId } });
  if (!vehicle) throw { status: 404, message: 'Vehicle not found' };

  const updateData = {};
  if (data.rego) updateData.rego = data.rego.toUpperCase().trim();
  if (data.make) updateData.make = data.make;
  if (data.model) updateData.model = data.model;
  if (data.year) updateData.year = parseInt(data.year);
  if (data.currentOdometer) updateData.currentOdometer = parseInt(data.currentOdometer);

  return prisma.vehicle.update({ where: { id }, data: updateData });
}

async function remove(userId, id) {
  const vehicle = await prisma.vehicle.findFirst({ where: { id, userId } });
  if (!vehicle) throw { status: 404, message: 'Vehicle not found' };
  return prisma.vehicle.delete({ where: { id } });
}

async function getOdometerReadings(userId, vehicleId) {
  return prisma.odometerReading.findMany({
    where: { vehicleId, userId },
    orderBy: { fbtYear: 'desc' },
  });
}

async function upsertOdometerReading(userId, vehicleId, data) {
  const vehicle = await prisma.vehicle.findFirst({ where: { id: vehicleId, userId } });
  if (!vehicle) throw { status: 404, message: 'Vehicle not found' };

  return prisma.odometerReading.upsert({
    where: { vehicleId_fbtYear: { vehicleId, fbtYear: parseInt(data.fbtYear) } },
    update: {
      startReading: parseInt(data.startReading),
      endReading: data.endReading ? parseInt(data.endReading) : null,
    },
    create: {
      vehicleId,
      fbtYear: parseInt(data.fbtYear),
      startReading: parseInt(data.startReading),
      endReading: data.endReading ? parseInt(data.endReading) : null,
      userId,
    },
  });
}

module.exports = { list, getById, create, update, remove, getOdometerReadings, upsertOdometerReading };
