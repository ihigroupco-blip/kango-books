const router = require('express').Router();
const { body } = require('express-validator');
const auth = require('../middleware/auth');
const validate = require('../middleware/validate');
const controller = require('../controllers/logbookController');

router.use(auth);

router.get('/', controller.list);
router.post('/start', [body('vehicleId').notEmpty()], validate, controller.start);
router.post('/:id/close', controller.close);
router.get('/:id/summary', controller.summary);

module.exports = router;
