const express = require('express');

// controllers
const authController = require('../controllers/authController');
const packageController = require('../controllers/packageController');

const router = express.Router();

// package route
router
  .route('/')
  .get(packageController.getAllPackages)
  .post(
    authController.protect,
    authController.restrictTo('admin', 'super-admin'),
    packageController.uploadPackagePhoto,
    packageController.createPackage
  );

router
  .route('/:id')
  .get(packageController.getPackage)
  .patch(
    authController.protect,
    authController.restrictTo('admin', 'super-admin'),
    packageController.uploadPackagePhoto,
    packageController.updatePackage
  )
  .delete(packageController.deletePackage);

module.exports = router;
