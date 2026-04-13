const bookingService = require('../services/bookingService');

async function list(req, res, next) {
  try {
    const year = parseInt(req.query.year) || new Date().getFullYear();
    const month = parseInt(req.query.month) || new Date().getMonth() + 1;
    const bookings = await bookingService.listByMonth(req.userId, year, month);
    res.json(bookings);
  } catch (err) {
    next(err);
  }
}

async function create(req, res, next) {
  try {
    const booking = await bookingService.create(req.userId, req.body);
    res.status(201).json(booking);
  } catch (err) {
    next(err);
  }
}

async function update(req, res, next) {
  try {
    const booking = await bookingService.update(req.userId, req.params.id, req.body);
    res.json(booking);
  } catch (err) {
    if (err.status) return res.status(err.status).json({ error: err.message });
    next(err);
  }
}

async function remove(req, res, next) {
  try {
    await bookingService.remove(req.userId, req.params.id);
    res.json({ message: 'Deleted' });
  } catch (err) {
    if (err.status) return res.status(err.status).json({ error: err.message });
    next(err);
  }
}

module.exports = { list, create, update, remove };
