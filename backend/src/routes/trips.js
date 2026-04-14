const router = require('express').Router();
const { body } = require('express-validator');
const auth = require('../middleware/auth');
const validate = require('../middleware/validate');
const controller = require('../controllers/tripController');

router.use(auth);

router.get('/', controller.list);
router.get('/recent', controller.recent);
router.get('/summary', controller.summary);

router.post(
  '/',
  [
    body('vehicleId').notEmpty(),
    body('date').isISO8601(),
    body('startOdometer').isInt({ min: 0 }),
    body('endOdometer').isInt({ min: 0 }),
    body('startLocation').trim().notEmpty(),
    body('endLocation').trim().notEmpty(),
    body('purpose').trim().notEmpty().isLength({ min: 3 }),
    body('classification').isIn(['BUSINESS', 'PRIVATE']),
  ],
  validate,
  controller.create
);

router.put(
  '/:id',
  [
    body('date').optional().isISO8601(),
    body('startOdometer').optional().isInt({ min: 0 }),
    body('endOdometer').optional().isInt({ min: 0 }),
    body('startLocation').optional().trim().notEmpty(),
    body('endLocation').optional().trim().notEmpty(),
    body('purpose').optional().trim().notEmpty().isLength({ min: 3 }),
    body('classification').optional().isIn(['BUSINESS', 'PRIVATE']),
  ],
  validate,
  controller.update
);

router.delete('/:id', controller.remove);

module.exports = router;
