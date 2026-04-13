const router = require('express').Router();
const { body } = require('express-validator');
const auth = require('../middleware/auth');
const validate = require('../middleware/validate');
const controller = require('../controllers/bookingController');

router.use(auth);

router.get('/', controller.list);

router.post(
  '/',
  [
    body('title').trim().notEmpty(),
    body('date').isISO8601(),
    body('type').optional().isIn(['BOOKING', 'NOTE', 'FOLLOWUP']),
  ],
  validate,
  controller.create
);

router.put(
  '/:id',
  [
    body('title').optional().trim().notEmpty(),
    body('date').optional().isISO8601(),
    body('type').optional().isIn(['BOOKING', 'NOTE', 'FOLLOWUP']),
  ],
  validate,
  controller.update
);

router.delete('/:id', controller.remove);

module.exports = router;
