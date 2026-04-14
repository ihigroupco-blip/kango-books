const router = require('express').Router();
const { body } = require('express-validator');
const auth = require('../middleware/auth');
const validate = require('../middleware/validate');
const controller = require('../controllers/vehicleController');

router.use(auth);

router.get('/', controller.list);

router.post(
  '/',
  [
    body('rego').trim().notEmpty(),
    body('make').trim().notEmpty(),
    body('model').trim().notEmpty(),
    body('year').isInt({ min: 1990, max: 2030 }),
    body('currentOdometer').isInt({ min: 0 }),
  ],
  validate,
  controller.create
);

router.put(
  '/:id',
  [
    body('rego').optional().trim().notEmpty(),
    body('make').optional().trim().notEmpty(),
    body('model').optional().trim().notEmpty(),
    body('year').optional().isInt({ min: 1990, max: 2030 }),
    body('currentOdometer').optional().isInt({ min: 0 }),
  ],
  validate,
  controller.update
);

router.delete('/:id', controller.remove);

router.get('/:id/odometer', controller.getOdometer);
router.post(
  '/:id/odometer',
  [
    body('fbtYear').isInt({ min: 2020, max: 2035 }),
    body('startReading').isInt({ min: 0 }),
    body('endReading').optional().isInt({ min: 0 }),
  ],
  validate,
  controller.upsertOdometer
);

module.exports = router;
