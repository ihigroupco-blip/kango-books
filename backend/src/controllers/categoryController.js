const categoryService = require('../services/categoryService');

async function list(req, res, next) {
  try {
    const categories = await categoryService.list(req.userId, req.query.type);
    res.json(categories);
  } catch (err) {
    next(err);
  }
}

async function create(req, res, next) {
  try {
    const category = await categoryService.create(req.userId, req.body);
    res.status(201).json(category);
  } catch (err) {
    next(err);
  }
}

async function remove(req, res, next) {
  try {
    await categoryService.remove(req.userId, req.params.id);
    res.json({ message: 'Deleted' });
  } catch (err) {
    if (err.status) return res.status(err.status).json({ error: err.message });
    next(err);
  }
}

module.exports = { list, create, remove };
