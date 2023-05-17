const express = require('express');

// controller (inc)
const adminAuthController = require('../controllers/adminAuthController');

// using router
const router = express.Router();

// // authentication
// router.post('/signIn', authController.signInAdmin);
router.get('/signOut', adminAuthController.signOutAdmin);

// password account creation
// router.patch('/createPassword', authController.createPassword);

// router protection (nanti)
// router.use(adminController.protect);

// admin manipulation
router.post('/', adminAuthController.createAdmin);

router.patch('/changePassword', adminAuthController.changePassword);

module.exports = router;
