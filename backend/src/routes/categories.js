const router = require('express').Router();
const { body } = require('express-validator');
const auth = require('../middleware/auth');
const validate = require('../middleware/validate');
const controller = require('../controllers/categoryController');

router.use(auth);

router.get('/', controller.list);

router.post(
  '/',
  [body('name').trim().notEmpty(), body('type').isIn(['INCOME', 'EXPENSE'])],
  validate,
  controller.create
);

router.delete('/:id', controller.remove);

module.exports = router;
