const router = require('express').Router();
const { body } = require('express-validator');
const auth = require('../middleware/auth');
const validate = require('../middleware/validate');
const controller = require('../controllers/leadController');

router.use(auth);

router.get('/', controller.list);
router.get('/stats', controller.stats);

router.post(
  '/',
  [
    body('name').trim().notEmpty(),
    body('status').optional().isIn(['COLD', 'CONTACTED', 'PROPOSAL', 'WON', 'LOST']),
  ],
  validate,
  controller.create
);

router.put(
  '/:id',
  [
    body('name').optional().trim().notEmpty(),
    body('status').optional().isIn(['COLD', 'CONTACTED', 'PROPOSAL', 'WON', 'LOST']),
  ],
  validate,
  controller.update
);

router.patch(
  '/:id/status',
  [body('status').isIn(['COLD', 'CONTACTED', 'PROPOSAL', 'WON', 'LOST'])],
  validate,
  controller.updateStatus
);

router.delete('/:id', controller.remove);

module.exports = router;
