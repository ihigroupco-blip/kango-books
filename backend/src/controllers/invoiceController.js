const invoiceService = require('../services/invoiceService');

async function list(req, res, next) {
  try {
    const result = await invoiceService.list(req.userId, req.query);
    res.json(result);
  } catch (err) {
    next(err);
  }
}

async function getById(req, res, next) {
  try {
    const invoice = await invoiceService.getById(req.userId, req.params.id);
    res.json(invoice);
  } catch (err) {
    if (err.status) return res.status(err.status).json({ error: err.message });
    next(err);
  }
}

async function create(req, res, next) {
  try {
    const invoice = await invoiceService.create(req.userId, req.body);
    res.status(201).json(invoice);
  } catch (err) {
    next(err);
  }
}

async function updateStatus(req, res, next) {
  try {
    const invoice = await invoiceService.updateStatus(req.userId, req.params.id, req.body.status);
    res.json(invoice);
  } catch (err) {
    if (err.status) return res.status(err.status).json({ error: err.message });
    next(err);
  }
}

async function remove(req, res, next) {
  try {
    await invoiceService.remove(req.userId, req.params.id);
    res.json({ message: 'Deleted' });
  } catch (err) {
    if (err.status) return res.status(err.status).json({ error: err.message });
    next(err);
  }
}

module.exports = { list, getById, create, updateStatus, remove };
