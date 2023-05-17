const express = require('express');

const transactionController = require('../controllers/transactionController');
const authController = require('../controllers/authController');
const adminAuthController = require('../controllers/adminAuthController');

const router = express.Router();

// router.use(authController.protect);

router.post(
  '/checkout/:packageId',
  authController.protect,
  transactionController.createPurchaseTransaction
);

// router.use(authController.restrictTo('Admin'));

router
  .route('/')
  .get(
    adminAuthController.protect,
    adminAuthController.restrictTo('admin'),
    transactionController.getAllTransactions
  );
//   .post(transactionController.createTransaction);

router
  .route('/:id')
  .get(
    adminAuthController.protect,
    adminAuthController.restrictTo('admin'),
    transactionController.getTransaction
  )
  .patch(
    adminAuthController.protect,
    adminAuthController.restrictTo('admin'),
    transactionController.updateTransaction
  )
  .delete(
    adminAuthController.protect,
    adminAuthController.restrictTo('admin'),
    transactionController.deleteTransaction
  );

module.exports = router;
