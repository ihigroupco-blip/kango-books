const vehicleExpenseService = require('../services/vehicleExpenseService');

async function list(req, res, next) {
  try { res.json(await vehicleExpenseService.list(req.userId, req.query)); } catch (err) { next(err); }
}

async function create(req, res, next) {
  try { res.status(201).json(await vehicleExpenseService.create(req.userId, req.body)); }
  catch (err) { if (err.status) return res.status(err.status).json({ error: err.message }); next(err); }
}

async function update(req, res, next) {
  try { res.json(await vehicleExpenseService.update(req.userId, req.params.id, req.body)); }
  catch (err) { if (err.status) return res.status(err.status).json({ error: err.message }); next(err); }
}

async function remove(req, res, next) {
  try { await vehicleExpenseService.remove(req.userId, req.params.id); res.json({ message: 'Deleted' }); }
  catch (err) { if (err.status) return res.status(err.status).json({ error: err.message }); next(err); }
}

async function summary(req, res, next) {
  try { res.json(await vehicleExpenseService.getSummary(req.userId, req.query.vehicleId)); }
  catch (err) { next(err); }
}

module.exports = { list, create, update, remove, summary };
