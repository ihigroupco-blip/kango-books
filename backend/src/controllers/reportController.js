const reportService = require('../services/reportService');

async function monthlyProfitLoss(req, res, next) {
  try {
    const year = parseInt(req.query.year) || new Date().getFullYear();
    const data = await reportService.monthlyProfitLoss(req.userId, year);
    res.json(data);
  } catch (err) {
    next(err);
  }
}

async function categoryBreakdown(req, res, next) {
  try {
    const data = await reportService.categoryBreakdown(req.userId, req.query);
    res.json(data);
  } catch (err) {
    next(err);
  }
}

module.exports = { monthlyProfitLoss, categoryBreakdown };
