const vehicleService = require('../services/vehicleService');

async function list(req, res, next) {
  try { res.json(await vehicleService.list(req.userId)); } catch (err) { next(err); }
}

async function create(req, res, next) {
  try { res.status(201).json(await vehicleService.create(req.userId, req.body)); }
  catch (err) { if (err.status) return res.status(err.status).json({ error: err.message }); next(err); }
}

async function update(req, res, next) {
  try { res.json(await vehicleService.update(req.userId, req.params.id, req.body)); }
  catch (err) { if (err.status) return res.status(err.status).json({ error: err.message }); next(err); }
}

async function remove(req, res, next) {
  try { await vehicleService.remove(req.userId, req.params.id); res.json({ message: 'Deleted' }); }
  catch (err) { if (err.status) return res.status(err.status).json({ error: err.message }); next(err); }
}

async function getOdometer(req, res, next) {
  try { res.json(await vehicleService.getOdometerReadings(req.userId, req.params.id)); }
  catch (err) { next(err); }
}

async function upsertOdometer(req, res, next) {
  try { res.json(await vehicleService.upsertOdometerReading(req.userId, req.params.id, req.body)); }
  catch (err) { if (err.status) return res.status(err.status).json({ error: err.message }); next(err); }
}

module.exports = { list, create, update, remove, getOdometer, upsertOdometer };
