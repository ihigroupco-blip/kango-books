const fbtReportService = require('../services/fbtReportService');

async function summary(req, res, next) {
  try { res.json(await fbtReportService.summary(req.userId, req.query.vehicleId, req.query.fbtYear)); }
  catch (err) { next(err); }
}

async function expenseSummary(req, res, next) {
  try { res.json(await fbtReportService.expenseSummary(req.userId, req.query.vehicleId, req.query.fbtYear)); }
  catch (err) { next(err); }
}

async function odometerGaps(req, res, next) {
  try { res.json(await fbtReportService.odometerGaps(req.userId, req.query.vehicleId)); }
  catch (err) { next(err); }
}

async function exportData(req, res, next) {
  try {
    const csv = await fbtReportService.exportCSV(req.userId, req.query.vehicleId, req.query.fbtYear);
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="fbt-logbook-${req.query.fbtYear || 'all'}.csv"`);
    res.send(csv);
  } catch (err) { next(err); }
}

module.exports = { summary, expenseSummary, odometerGaps, exportData };
