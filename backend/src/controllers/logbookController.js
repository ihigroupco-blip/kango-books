const logbookService = require('../services/logbookService');

async function list(req, res, next) {
  try { res.json(await logbookService.list(req.userId, req.query.vehicleId)); } catch (err) { next(err); }
}

async function start(req, res, next) {
  try { res.status(201).json(await logbookService.startPeriod(req.userId, req.body.vehicleId)); }
  catch (err) { if (err.status) return res.status(err.status).json({ error: err.message }); next(err); }
}

async function close(req, res, next) {
  try { res.json(await logbookService.closePeriod(req.userId, req.params.id)); }
  catch (err) { if (err.status) return res.status(err.status).json({ error: err.message }); next(err); }
}

async function summary(req, res, next) {
  try { res.json(await logbookService.getSummary(req.userId, req.params.id)); }
  catch (err) { if (err.status) return res.status(err.status).json({ error: err.message }); next(err); }
}

module.exports = { list, start, close, summary };
