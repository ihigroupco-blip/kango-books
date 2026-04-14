const tripService = require('../services/tripService');

async function list(req, res, next) {
  try { res.json(await tripService.list(req.userId, req.query)); } catch (err) { next(err); }
}

async function recent(req, res, next) {
  try { res.json(await tripService.getRecent(req.userId, req.query.vehicleId)); } catch (err) { next(err); }
}

async function create(req, res, next) {
  try { res.status(201).json(await tripService.create(req.userId, req.body)); }
  catch (err) { if (err.status) return res.status(err.status).json({ error: err.message }); next(err); }
}

async function update(req, res, next) {
  try { res.json(await tripService.update(req.userId, req.params.id, req.body)); }
  catch (err) { if (err.status) return res.status(err.status).json({ error: err.message }); next(err); }
}

async function remove(req, res, next) {
  try { await tripService.remove(req.userId, req.params.id); res.json({ message: 'Deleted' }); }
  catch (err) { if (err.status) return res.status(err.status).json({ error: err.message }); next(err); }
}

async function summary(req, res, next) {
  try { res.json(await tripService.getSummary(req.userId, req.query.vehicleId)); } catch (err) { next(err); }
}

module.exports = { list, recent, create, update, remove, summary };
