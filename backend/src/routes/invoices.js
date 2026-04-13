const router = require('express').Router();
const { body } = require('express-validator');
const auth = require('../middleware/auth');
const validate = require('../middleware/validate');
const controller = require('../controllers/invoiceController');

router.use(auth);

router.get('/', controller.list);
router.get('/:id', controller.getById);

router.post(
  '/',
  [
    body('clientId').notEmpty(),
    body('issueDate').isISO8601(),
    body('dueDate').isISO8601(),
    body('items').isArray({ min: 1 }),
    body('items.*.description').trim().notEmpty(),
    body('items.*.quantity').isFloat({ gt: 0 }),
    body('items.*.unitPrice').isFloat({ min: 0 }),
  ],
  validate,
  controller.create
);

router.patch(
  '/:id/status',
  [body('status').isIn(['DRAFT', 'SENT', 'PAID', 'OVERDUE', 'CANCELLED'])],
  validate,
  controller.updateStatus
);

router.delete('/:id', controller.remove);

module.exports = router;
