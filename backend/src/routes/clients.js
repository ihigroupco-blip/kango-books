const router = require('express').Router();
const { body } = require('express-validator');
const auth = require('../middleware/auth');
const validate = require('../middleware/validate');
const controller = require('../controllers/clientController');

router.use(auth);

router.get('/', controller.list);

router.post(
  '/',
  [body('name').trim().notEmpty()],
  validate,
  controller.create
);

router.put(
  '/:id',
  [body('name').optional().trim().notEmpty()],
  validate,
  controller.update
);

router.delete('/:id', controller.remove);

module.exports = router;
