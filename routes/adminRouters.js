const express = require('express');

// controller (inc)
const authController = require('../controllers/authController');

// using router
const router = express.Router();

// // authentication
router.post('/signIn', authController.signInAdmin);
router.get('/signOut', authController.signOutAdmin);

// password account creation
router.post('/createPassword', authController.createPassword);

// router protection (nanti)
router.use(authController.protect);

router.patch('/changePassword', authController.changePassword);

router.use(authController.restrictTo('admin', 'super-admin'));

// admin manipulation
router.post('/', authController.createAdmin);

module.exports = router;
