const router = require('express').Router();
const { body } = require('express-validator');
const auth = require('../middleware/auth');
const validate = require('../middleware/validate');
const controller = require('../controllers/vehicleExpenseController');

router.use(auth);

router.get('/', controller.list);
router.get('/summary', controller.summary);

router.post(
  '/',
  [
    body('vehicleId').notEmpty(),
    body('type').isIn(['FUEL', 'TOLLS', 'PARKING', 'MAINTENANCE', 'INSURANCE', 'REGISTRATION', 'OTHER']),
    body('description').trim().notEmpty(),
    body('amount').isFloat({ gt: 0 }),
    body('date').isISO8601(),
  ],
  validate,
  controller.create
);

router.put(
  '/:id',
  [
    body('type').optional().isIn(['FUEL', 'TOLLS', 'PARKING', 'MAINTENANCE', 'INSURANCE', 'REGISTRATION', 'OTHER']),
    body('description').optional().trim().notEmpty(),
    body('amount').optional().isFloat({ gt: 0 }),
    body('date').optional().isISO8601(),
  ],
  validate,
  controller.update
);

router.delete('/:id', controller.remove);

module.exports = router;
