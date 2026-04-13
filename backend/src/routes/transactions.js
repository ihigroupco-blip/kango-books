const router = require('express').Router();
const { body } = require('express-validator');
const auth = require('../middleware/auth');
const validate = require('../middleware/validate');
const controller = require('../controllers/transactionController');

router.use(auth);

router.get('/', controller.list);
router.get('/summary', controller.summary);

router.post(
  '/',
  [
    body('description').trim().notEmpty(),
    body('amount').isFloat({ gt: 0 }),
    body('type').isIn(['INCOME', 'EXPENSE']),
    body('date').isISO8601(),
  ],
  validate,
  controller.create
);

router.put(
  '/:id',
  [
    body('description').optional().trim().notEmpty(),
    body('amount').optional().isFloat({ gt: 0 }),
    body('type').optional().isIn(['INCOME', 'EXPENSE']),
    body('date').optional().isISO8601(),
  ],
  validate,
  controller.update
);

router.delete('/:id', controller.remove);

module.exports = router;
