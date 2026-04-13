const router = require('express').Router();
const auth = require('../middleware/auth');
const controller = require('../controllers/reportController');

router.use(auth);

router.get('/profit-loss', controller.monthlyProfitLoss);
router.get('/categories', controller.categoryBreakdown);

module.exports = router;
