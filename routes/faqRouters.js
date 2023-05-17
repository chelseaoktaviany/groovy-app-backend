const express = require('express');

// controllers
const adminAuthController = require('../controllers/adminAuthController');
const faqController = require('../controllers/faqController');

const router = express.Router();

// package route
router
  .route('/')
  .get(faqController.getAllFaqs)
  .post(
    adminAuthController.protect,
    adminAuthController.restrictTo('admin'),
    faqController.createFaq
  );

router
  .route('/:id')
  .get(faqController.getFaq)
  .patch(
    adminAuthController.protect,
    adminAuthController.restrictTo('admin'),
    faqController.updateFaq
  )
  .delete(
    adminAuthController.protect,
    adminAuthController.restrictTo('admin'),
    faqController.deleteFaq
  );

module.exports = router;
