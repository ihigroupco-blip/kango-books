const router = require('express').Router();
const auth = require('../middleware/auth');
const controller = require('../controllers/fbtReportController');

router.use(auth);

router.get('/summary', controller.summary);
router.get('/expense-summary', controller.expenseSummary);
router.get('/odometer-gaps', controller.odometerGaps);
router.get('/export', controller.exportData);

module.exports = router;
