const express = require('express');

const authController = require('../controllers/authController');
const voucherController = require('../controllers/voucherController');

const router = express.Router();

router.use(authController.protect);

router.get('/', voucherController.getAllVouchers);
router.get('/:id', voucherController.getVoucher);

router.use(authController.restrictTo('admin'));

router.route('/').post(voucherController.createVoucher);

router
  .route('/:id')
  .patch(voucherController.updateVoucher)
  .delete(voucherController.deleteVoucher);

module.exports = router;
