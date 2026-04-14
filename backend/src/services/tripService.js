const prisma = require('../lib/prisma');

async function list(userId, { vehicleId, classification, from, to, page = 1, limit = 30 }) {
  const where = { userId };
  if (vehicleId) where.vehicleId = vehicleId;
  if (classification) where.classification = classification;
  if (from || to) {
    where.date = {};
    if (from) where.date.gte = new Date(from);
    if (to) where.date.lte = new Date(to);
  }

  const [trips, total] = await Promise.all([
    prisma.trip.findMany({
      where,
      include: { vehicle: { select: { id: true, rego: true, make: true, model: true } } },
      orderBy: { date: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.trip.count({ where }),
  ]);

  return { trips, total, page, totalPages: Math.ceil(total / limit) };
}

async function getRecent(userId, vehicleId) {
  const lastTrip = await prisma.trip.findFirst({
    where: { userId, vehicleId },
    orderBy: { date: 'desc' },
    select: { endOdometer: true, endLocation: true, date: true },
  });
  return lastTrip;
}

async function create(userId, data) {
  const startOdo = parseInt(data.startOdometer);
  const endOdo = parseInt(data.endOdometer);

  if (endOdo <= startOdo) {
    throw { status: 400, message: 'End odometer must be greater than start odometer' };
  }

  const vehicle = await prisma.vehicle.findFirst({ where: { id: data.vehicleId, userId } });
  if (!vehicle) throw { status: 404, message: 'Vehicle not found' };

  const distance = endOdo - startOdo;

  // Find active logbook period for this vehicle
  const activePeriod = await prisma.logbookPeriod.findFirst({
    where: { vehicleId: data.vehicleId, userId, isActive: true },
  });

  const trip = await prisma.trip.create({
    data: {
      vehicleId: data.vehicleId,
      logbookPeriodId: activePeriod?.id || null,
      date: new Date(data.date),
      startOdometer: startOdo,
      endOdometer: endOdo,
      distance,
      startTime: data.startTime || null,
      endTime: data.endTime || null,
      startLocation: data.startLocation,
      endLocation: data.endLocation,
      purpose: data.purpose,
      classification: data.classification,
      userId,
    },
    include: { vehicle: { select: { id: true, rego: true, make: true, model: true } } },
  });

  // Update vehicle current odometer
  await prisma.vehicle.update({
    where: { id: data.vehicleId },
    data: { currentOdometer: endOdo },
  });

  return trip;
}

async function update(userId, id, data) {
  const trip = await prisma.trip.findFirst({ where: { id, userId } });
  if (!trip) throw { status: 404, message: 'Trip not found' };
  if (trip.isLocked) throw { status: 403, message: 'Trip is locked (logbook period validated)' };

  const updateData = {};
  if (data.date) updateData.date = new Date(data.date);
  if (data.startOdometer) updateData.startOdometer = parseInt(data.startOdometer);
  if (data.endOdometer) updateData.endOdometer = parseInt(data.endOdometer);
  if (data.startOdometer && data.endOdometer) {
    updateData.distance = parseInt(data.endOdometer) - parseInt(data.startOdometer);
  }
  if (data.startTime !== undefined) updateData.startTime = data.startTime || null;
  if (data.endTime !== undefined) updateData.endTime = data.endTime || null;
  if (data.startLocation) updateData.startLocation = data.startLocation;
  if (data.endLocation) updateData.endLocation = data.endLocation;
  if (data.purpose) updateData.purpose = data.purpose;
  if (data.classification) updateData.classification = data.classification;

  return prisma.trip.update({
    where: { id },
    data: updateData,
    include: { vehicle: { select: { id: true, rego: true, make: true, model: true } } },
  });
}

async function remove(userId, id) {
  const trip = await prisma.trip.findFirst({ where: { id, userId } });
  if (!trip) throw { status: 404, message: 'Trip not found' };
  if (trip.isLocked) throw { status: 403, message: 'Trip is locked (logbook period validated)' };
  return prisma.trip.delete({ where: { id } });
}

async function getSummary(userId, vehicleId) {
  const where = { userId };
  if (vehicleId) where.vehicleId = vehicleId;

  const [totalTrips, businessTrips, totalDistance, businessDistance] = await Promise.all([
    prisma.trip.count({ where }),
    prisma.trip.count({ where: { ...where, classification: 'BUSINESS' } }),
    prisma.trip.aggregate({ where, _sum: { distance: true } }),
    prisma.trip.aggregate({ where: { ...where, classification: 'BUSINESS' }, _sum: { distance: true } }),
  ]);

  const totalKm = totalDistance._sum.distance || 0;
  const businessKm = businessDistance._sum.distance || 0;
  const privateKm = totalKm - businessKm;
  const businessPct = totalKm > 0 ? ((businessKm / totalKm) * 100).toFixed(1) : 0;

  return { totalTrips, businessTrips, privateTrips: totalTrips - businessTrips, totalKm, businessKm, privateKm, businessPct: Number(businessPct) };
}

module.exports = { list, getRecent, create, update, remove, getSummary };
