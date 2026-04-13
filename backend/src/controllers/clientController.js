const clientService = require('../services/clientService');

async function list(req, res, next) {
  try {
    const clients = await clientService.list(req.userId);
    res.json(clients);
  } catch (err) {
    next(err);
  }
}

async function create(req, res, next) {
  try {
    const client = await clientService.create(req.userId, req.body);
    res.status(201).json(client);
  } catch (err) {
    next(err);
  }
}

async function update(req, res, next) {
  try {
    const client = await clientService.update(req.userId, req.params.id, req.body);
    res.json(client);
  } catch (err) {
    if (err.status) return res.status(err.status).json({ error: err.message });
    next(err);
  }
}

async function remove(req, res, next) {
  try {
    await clientService.remove(req.userId, req.params.id);
    res.json({ message: 'Deleted' });
  } catch (err) {
    if (err.status) return res.status(err.status).json({ error: err.message });
    next(err);
  }
}

module.exports = { list, create, update, remove };
