const prisma = require('../lib/prisma');

// FBT year = April 1 (year-1) to March 31 (year)
function getFbtDateRange(fbtYear) {
  return {
    start: new Date(fbtYear - 1, 3, 1),  // April 1
    end: new Date(fbtYear, 2, 31, 23, 59, 59),  // March 31
  };
}

async function summary(userId, vehicleId, fbtYear) {
  const year = parseInt(fbtYear) || new Date().getFullYear();
  const { start, end } = getFbtDateRange(year);

  const tripWhere = { userId, date: { gte: start, lte: end } };
  if (vehicleId) tripWhere.vehicleId = vehicleId;

  const expenseWhere = { userId, date: { gte: start, lte: end } };
  if (vehicleId) expenseWhere.vehicleId = vehicleId;

  const [totalDist, businessDist, tripCount, businessCount, totalExpenses, logbookPeriods] = await Promise.all([
    prisma.trip.aggregate({ where: tripWhere, _sum: { distance: true } }),
    prisma.trip.aggregate({ where: { ...tripWhere, classification: 'BUSINESS' }, _sum: { distance: true } }),
    prisma.trip.count({ where: tripWhere }),
    prisma.trip.count({ where: { ...tripWhere, classification: 'BUSINESS' } }),
    prisma.vehicleExpense.aggregate({ where: expenseWhere, _sum: { amount: true } }),
    prisma.logbookPeriod.findMany({
      where: { userId, ...(vehicleId ? { vehicleId } : {}), isValid: true, validUntil: { gte: new Date() } },
      orderBy: { endDate: 'desc' },
      take: 1,
    }),
  ]);

  const totalKm = totalDist._sum.distance || 0;
  const businessKm = businessDist._sum.distance || 0;
  const privateKm = totalKm - businessKm;
  const businessPct = totalKm > 0 ? ((businessKm / totalKm) * 100) : 0;
  const totalExp = Number(totalExpenses._sum.amount || 0);
  const validPeriod = logbookPeriods[0] || null;
  const appliedPct = validPeriod ? Number(validPeriod.businessPct) : businessPct;
  const deductibleExpenses = totalExp * (appliedPct / 100);

  return {
    fbtYear: year,
    fbtPeriod: `${year - 1}-${year}`,
    totalKm, businessKm, privateKm,
    businessPct: Number(businessPct.toFixed(1)),
    appliedBusinessPct: Number(appliedPct.toFixed(1)),
    tripCount, businessTripCount: businessCount,
    totalExpenses: totalExp,
    deductibleExpenses: Number(deductibleExpenses.toFixed(2)),
    validLogbookPeriod: validPeriod ? {
      id: validPeriod.id,
      businessPct: Number(validPeriod.businessPct),
      validUntil: validPeriod.validUntil,
    } : null,
  };
}

async function expenseSummary(userId, vehicleId, fbtYear) {
  const year = parseInt(fbtYear) || new Date().getFullYear();
  const { start, end } = getFbtDateRange(year);

  const where = { userId, date: { gte: start, lte: end } };
  if (vehicleId) where.vehicleId = vehicleId;

  const result = await prisma.vehicleExpense.groupBy({
    by: ['type'],
    where,
    _sum: { amount: true },
    _count: true,
    orderBy: { _sum: { amount: 'desc' } },
  });

  return result.map((r) => ({ type: r.type, total: Number(r._sum.amount), count: r._count }));
}

async function odometerGaps(userId, vehicleId) {
  const trips = await prisma.trip.findMany({
    where: { userId, vehicleId },
    orderBy: [{ date: 'asc' }, { startOdometer: 'asc' }],
    select: { id: true, date: true, startOdometer: true, endOdometer: true, purpose: true },
  });

  const gaps = [];
  for (let i = 1; i < trips.length; i++) {
    const prev = trips[i - 1];
    const curr = trips[i];
    const gap = curr.startOdometer - prev.endOdometer;
    if (gap !== 0) {
      gaps.push({
        gapKm: gap,
        type: gap > 0 ? 'missing' : 'overlap',
        afterTrip: { id: prev.id, date: prev.date, endOdometer: prev.endOdometer },
        beforeTrip: { id: curr.id, date: curr.date, startOdometer: curr.startOdometer },
      });
    }
  }
  return gaps;
}

async function exportCSV(userId, vehicleId, fbtYear) {
  const year = parseInt(fbtYear) || new Date().getFullYear();
  const { start, end } = getFbtDateRange(year);

  const where = { userId, date: { gte: start, lte: end } };
  if (vehicleId) where.vehicleId = vehicleId;

  const trips = await prisma.trip.findMany({
    where,
    include: { vehicle: { select: { rego: true } } },
    orderBy: { date: 'asc' },
  });

  const header = 'Date,Vehicle,Start Odometer,End Odometer,Distance (km),Start Location,End Location,Start Time,End Time,Purpose,Classification\n';
  const rows = trips.map((t) =>
    `${new Date(t.date).toLocaleDateString('en-AU')},${t.vehicle?.rego || ''},${t.startOdometer},${t.endOdometer},${t.distance},"${t.startLocation}","${t.endLocation}",${t.startTime || ''},${t.endTime || ''},"${t.purpose}",${t.classification}`
  ).join('\n');

  return header + rows;
}

module.exports = { summary, expenseSummary, odometerGaps, exportCSV, getFbtDateRange };
