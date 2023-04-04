const express = require('express');

// controller (inc)
const authController = require('../controllers/authController');
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

// account activation
router.get('/activate', authController.accountActivation);

// OTP
router.get('/resendOTP', resendOTPRateLimiter, authController.resendOTP);
router.post('/verified', verifyOTPRateLimiter, authController.verifyOTP);

// router protection (nanti)
router.use(authController.protect);

// restriction middleware
router.use(authController.restrictTo('admin'));

// user management
router.route('/').get(userController.getAllUsers);

// password manipulation
// router.patch('/changePassword', authController.changePassword);

module.exports = router;
