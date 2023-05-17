const express = require('express');

// controllers
const adminAuthController = require('../controllers/adminAuthController');
const packageController = require('../controllers/packageController');

const router = express.Router();

// package route
router
  .route('/')
  .get(packageController.getAllPackages)
  .post(
    adminAuthController.protect,
    adminAuthController.restrictTo('admin'),
    packageController.uploadPackagePhoto,
    packageController.createPackage
  );

router
  .route('/:id')
  .get(packageController.getPackage)
  .patch(
    adminAuthController.protect,
    adminAuthController.restrictTo('admin'),
    packageController.uploadPackagePhoto,
    packageController.updatePackage
  )
  .delete(
    adminAuthController.protect,
    adminAuthController.restrictTo('admin'),
    packageController.deletePackage
  );

module.exports = router;
