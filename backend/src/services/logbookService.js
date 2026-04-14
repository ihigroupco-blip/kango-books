const prisma = require('../lib/prisma');

async function list(userId, vehicleId) {
  const where = { userId };
  if (vehicleId) where.vehicleId = vehicleId;
  return prisma.logbookPeriod.findMany({
    where,
    orderBy: { startDate: 'desc' },
    include: { vehicle: { select: { id: true, rego: true } } },
  });
}

async function startPeriod(userId, vehicleId) {
  const vehicle = await prisma.vehicle.findFirst({ where: { id: vehicleId, userId } });
  if (!vehicle) throw { status: 404, message: 'Vehicle not found' };

  const existing = await prisma.logbookPeriod.findFirst({
    where: { vehicleId, userId, isActive: true },
  });
  if (existing) throw { status: 400, message: 'An active logbook period already exists for this vehicle' };

  return prisma.logbookPeriod.create({
    data: { vehicleId, startDate: new Date(), userId },
  });
}

async function closePeriod(userId, id) {
  const period = await prisma.logbookPeriod.findFirst({ where: { id, userId } });
  if (!period) throw { status: 404, message: 'Logbook period not found' };
  if (!period.isActive) throw { status: 400, message: 'Period is already closed' };

  const trips = await prisma.trip.findMany({
    where: { logbookPeriodId: id, userId },
  });

  // Validate minimum 12 weeks (84 days)
  const now = new Date();
  const daysDiff = Math.floor((now - period.startDate) / (1000 * 60 * 60 * 24));
  if (daysDiff < 84) {
    throw { status: 400, message: `Logbook period must be at least 12 weeks (84 days). Currently ${daysDiff} days.` };
  }

  const totalKm = trips.reduce((s, t) => s + t.distance, 0);
  const businessKm = trips.filter((t) => t.classification === 'BUSINESS').reduce((s, t) => s + t.distance, 0);
  const privateKm = totalKm - businessKm;
  const businessPct = totalKm > 0 ? ((businessKm / totalKm) * 100).toFixed(2) : 0;

  // Set valid for 5 years from start
  const validUntil = new Date(period.startDate);
  validUntil.setFullYear(validUntil.getFullYear() + 5);

  // Close period and lock all trips
  const [updated] = await prisma.$transaction([
    prisma.logbookPeriod.update({
      where: { id },
      data: {
        endDate: now,
        isActive: false,
        isValid: true,
        validUntil,
        businessPct,
        totalKm,
        businessKm,
        privateKm,
      },
    }),
    prisma.trip.updateMany({
      where: { logbookPeriodId: id },
      data: { isLocked: true },
    }),
  ]);

  return updated;
}

async function getSummary(userId, id) {
  const period = await prisma.logbookPeriod.findFirst({
    where: { id, userId },
    include: { vehicle: { select: { rego: true, make: true, model: true } } },
  });
  if (!period) throw { status: 404, message: 'Logbook period not found' };

  const trips = await prisma.trip.findMany({
    where: { logbookPeriodId: id },
    orderBy: { date: 'asc' },
  });

  const totalKm = trips.reduce((s, t) => s + t.distance, 0);
  const businessKm = trips.filter((t) => t.classification === 'BUSINESS').reduce((s, t) => s + t.distance, 0);
  const daysDiff = Math.floor(((period.endDate || new Date()) - period.startDate) / (1000 * 60 * 60 * 24));

  return {
    ...period,
    tripCount: trips.length,
    totalKm,
    businessKm,
    privateKm: totalKm - businessKm,
    businessPct: totalKm > 0 ? ((businessKm / totalKm) * 100).toFixed(1) : 0,
    daysElapsed: daysDiff,
    daysRequired: 84,
  };
}

module.exports = { list, startPeriod, closePeriod, getSummary };
