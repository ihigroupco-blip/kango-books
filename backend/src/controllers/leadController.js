const leadService = require('../services/leadService');

async function list(req, res, next) {
  try {
    const result = await leadService.list(req.userId, req.query);
    res.json(result);
  } catch (err) {
    next(err);
  }
}

async function stats(req, res, next) {
  try {
    const data = await leadService.getStats(req.userId);
    res.json(data);
  } catch (err) {
    next(err);
  }
}

async function create(req, res, next) {
  try {
    const lead = await leadService.create(req.userId, req.body);
    res.status(201).json(lead);
  } catch (err) {
    next(err);
  }
}

async function update(req, res, next) {
  try {
    const lead = await leadService.update(req.userId, req.params.id, req.body);
    res.json(lead);
  } catch (err) {
    if (err.status) return res.status(err.status).json({ error: err.message });
    next(err);
  }
}

async function updateStatus(req, res, next) {
  try {
    const result = await leadService.updateStatus(req.userId, req.params.id, req.body.status);
    res.json(result);
  } catch (err) {
    if (err.status) return res.status(err.status).json({ error: err.message });
    next(err);
  }
}

async function remove(req, res, next) {
  try {
    await leadService.remove(req.userId, req.params.id);
    res.json({ message: 'Deleted' });
  } catch (err) {
    if (err.status) return res.status(err.status).json({ error: err.message });
    next(err);
  }
}

module.exports = { list, stats, create, update, updateStatus, remove };
