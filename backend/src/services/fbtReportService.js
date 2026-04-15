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

async function exportPDF(userId, vehicleId, fbtYear) {
  const PDFDocument = require('pdfkit');
  const year = parseInt(fbtYear) || new Date().getFullYear();
  const { start, end } = getFbtDateRange(year);

  const where = { userId, date: { gte: start, lte: end } };
  const expWhere = { userId, date: { gte: start, lte: end } };
  if (vehicleId) { where.vehicleId = vehicleId; expWhere.vehicleId = vehicleId; }

  const [trips, vehicle, expenses, summaryData] = await Promise.all([
    prisma.trip.findMany({ where, include: { vehicle: { select: { rego: true, make: true, model: true, year: true } } }, orderBy: { date: 'asc' } }),
    vehicleId ? prisma.vehicle.findFirst({ where: { id: vehicleId, userId } }) : null,
    prisma.vehicleExpense.findMany({ where: expWhere, orderBy: { date: 'asc' } }),
    summary(userId, vehicleId, fbtYear),
  ]);

  const doc = new PDFDocument({ size: 'A4', margin: 40, bufferPages: true });
  const chunks = [];
  doc.on('data', (chunk) => chunks.push(chunk));

  const navy = '#1a2b6b';
  const gray = '#666666';
  const lightGray = '#f0f0f0';

  // ── Header ──
  doc.fontSize(20).fillColor(navy).text('FBT Vehicle Logbook Report', { align: 'center' });
  doc.moveDown(0.3);
  doc.fontSize(11).fillColor(gray).text(`FBT Year: ${year - 1}-${year} (1 April ${year - 1} to 31 March ${year})`, { align: 'center' });
  doc.moveDown(0.3);
  doc.fontSize(9).fillColor('#999').text('Kango Facility Services | Generated: ' + new Date().toLocaleDateString('en-AU'), { align: 'center' });
  doc.moveDown(1);

  // ── Vehicle Details ──
  if (vehicle) {
    doc.fontSize(12).fillColor(navy).text('Vehicle Details');
    doc.moveDown(0.3);
    doc.fontSize(10).fillColor('#333');
    doc.text(`Registration: ${vehicle.rego}    Make: ${vehicle.make}    Model: ${vehicle.model}    Year: ${vehicle.year}`);
    doc.text(`Current Odometer: ${vehicle.currentOdometer?.toLocaleString() || 'N/A'} km`);
    doc.moveDown(0.8);
  }

  // ── Summary Box ──
  doc.fontSize(12).fillColor(navy).text('FBT Summary');
  doc.moveDown(0.3);
  const summaryY = doc.y;
  doc.rect(40, summaryY, 515, 70).fill(lightGray);
  doc.fillColor('#333').fontSize(10);
  doc.text(`Total Trips: ${summaryData.tripCount}`, 55, summaryY + 10);
  doc.text(`Total KM: ${summaryData.totalKm.toLocaleString()}`, 55, summaryY + 25);
  doc.text(`Business KM: ${summaryData.businessKm.toLocaleString()}`, 55, summaryY + 40);
  doc.text(`Private KM: ${summaryData.privateKm.toLocaleString()}`, 55, summaryY + 55);
  doc.text(`Business Use: ${summaryData.appliedBusinessPct}%`, 280, summaryY + 10);
  doc.text(`Total Expenses: $${summaryData.totalExpenses.toFixed(2)}`, 280, summaryY + 25);
  doc.text(`Deductible Amount: $${summaryData.deductibleExpenses.toFixed(2)}`, 280, summaryY + 40);
  if (summaryData.validLogbookPeriod) {
    doc.text(`Logbook Valid Until: ${new Date(summaryData.validLogbookPeriod.validUntil).toLocaleDateString('en-AU')}`, 280, summaryY + 55);
  }
  doc.y = summaryY + 85;

  // ── Trip Log Table ──
  doc.fontSize(12).fillColor(navy).text('Trip Log');
  doc.moveDown(0.3);

  // Table header
  const cols = [40, 95, 145, 195, 235, 295, 355, 465];
  const headers = ['Date', 'Start KM', 'End KM', 'Dist', 'From', 'To', 'Purpose', 'Type'];
  const tableTop = doc.y;
  doc.rect(40, tableTop, 515, 16).fill(navy);
  doc.fillColor('white').fontSize(7);
  headers.forEach((h, i) => doc.text(h, cols[i] + 2, tableTop + 4, { width: (cols[i + 1] || 555) - cols[i] - 4 }));

  let y = tableTop + 18;
  doc.fillColor('#333').fontSize(7);

  for (const t of trips) {
    if (y > 780) { doc.addPage(); y = 40; }
    const isAlt = trips.indexOf(t) % 2 === 0;
    if (isAlt) doc.rect(40, y - 2, 515, 14).fill('#f8f8f8');
    doc.fillColor('#333');
    const dateStr = new Date(t.date).toLocaleDateString('en-AU');
    const row = [dateStr, String(t.startOdometer), String(t.endOdometer), `${t.distance}`, t.startLocation, t.endLocation, t.purpose, t.classification];
    row.forEach((val, i) => {
      const w = (cols[i + 1] || 555) - cols[i] - 4;
      const truncated = val.length > (w / 3.5) ? val.slice(0, Math.floor(w / 3.5)) + '..' : val;
      doc.text(truncated, cols[i] + 2, y, { width: w, lineBreak: false });
    });
    y += 14;
  }

  // ── Expense Summary ──
  if (expenses.length > 0) {
    if (y > 700) { doc.addPage(); y = 40; }
    doc.y = y + 15;
    doc.fontSize(12).fillColor(navy).text('Vehicle Expenses');
    doc.moveDown(0.3);

    const expTop = doc.y;
    doc.rect(40, expTop, 515, 16).fill(navy);
    doc.fillColor('white').fontSize(8);
    doc.text('Date', 42, expTop + 4); doc.text('Type', 110, expTop + 4); doc.text('Description', 190, expTop + 4); doc.text('Amount', 460, expTop + 4, { align: 'right', width: 90 });

    let ey = expTop + 18;
    doc.fillColor('#333').fontSize(8);
    for (const e of expenses) {
      if (ey > 780) { doc.addPage(); ey = 40; }
      if (expenses.indexOf(e) % 2 === 0) doc.rect(40, ey - 2, 515, 14).fill('#f8f8f8');
      doc.fillColor('#333');
      doc.text(new Date(e.date).toLocaleDateString('en-AU'), 42, ey);
      doc.text(e.type, 110, ey);
      doc.text(e.description.slice(0, 40), 190, ey);
      doc.text(`$${Number(e.amount).toFixed(2)}`, 460, ey, { align: 'right', width: 90 });
      ey += 14;
    }
  }

  // ── Footer ──
  doc.fontSize(8).fillColor('#999');
  const pages = doc.bufferedPageRange();
  for (let i = pages.start; i < pages.start + pages.count; i++) {
    doc.switchToPage(i);
    doc.text(`Page ${i + 1} of ${pages.count} | FBT Logbook - Kango Facility Services`, 40, 810, { align: 'center', width: 515 });
  }

  doc.end();
  return new Promise((resolve) => doc.on('end', () => resolve(Buffer.concat(chunks))));
}

module.exports = { summary, expenseSummary, odometerGaps, exportCSV, exportPDF, getFbtDateRange };
