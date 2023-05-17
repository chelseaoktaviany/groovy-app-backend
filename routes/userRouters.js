const express = require('express');

// controller (inc)
const authController = require('../controllers/authController');
const adminAuthController = require('../controllers/adminAuthController');
const userController = require('../controllers/userController');

// middlewares
const {
  resendOTPRateLimiter,
  verifyOTPRateLimiter,
} = require('../middleware/rateLimiter');

// using router
const router = express.Router();

// authentication
router.post('/signUp', authController.signUp);
router.post('/signIn', authController.signIn);
router.get('/signOut', authController.signOut);

// OTP
router.get('/resendOTP', resendOTPRateLimiter, authController.resendOTP);
router.post('/verified', verifyOTPRateLimiter, authController.verifyOTP);

// router protection (nanti)
// router.use(authController.protect);

// get user
router.get(
  '/me',
  authController.protect,
  userController.getMe,
  userController.getUser
);

// update user
router.patch(
  '/updateProfile',
  authController.protect,
  userController.getMe,
  userController.uploadUserImage,
  userController.updateUserProfile
);

// restriction middleware
router.use(
  adminAuthController.protect,
  adminAuthController.restrictTo('admin', 'super-admin')
);

// user management
router.route('/').get(userController.getAllUsers);
router
  .route('/:id')
  .get(userController.getUser)
  .patch(userController.updateUserStatus);

module.exports = router;
