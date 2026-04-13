const transactionService = require('../services/transactionService');

async function list(req, res, next) {
  try {
    const result = await transactionService.list(req.userId, req.query);
    res.json(result);
  } catch (err) {
    next(err);
  }
}

async function create(req, res, next) {
  try {
    const tx = await transactionService.create(req.userId, req.body);
    res.status(201).json(tx);
  } catch (err) {
    next(err);
  }
}

async function update(req, res, next) {
  try {
    const tx = await transactionService.update(req.userId, req.params.id, req.body);
    res.json(tx);
  } catch (err) {
    if (err.status) return res.status(err.status).json({ error: err.message });
    next(err);
  }
}

async function remove(req, res, next) {
  try {
    await transactionService.remove(req.userId, req.params.id);
    res.json({ message: 'Deleted' });
  } catch (err) {
    if (err.status) return res.status(err.status).json({ error: err.message });
    next(err);
  }
}

async function summary(req, res, next) {
  try {
    const data = await transactionService.getSummary(req.userId);
    res.json(data);
  } catch (err) {
    next(err);
  }
}

module.exports = { list, create, update, remove, summary };
