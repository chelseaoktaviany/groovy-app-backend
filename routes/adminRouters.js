const express = require('express');

// controller (inc)
const adminAuthController = require('../controllers/adminAuthController');

// using router
const router = express.Router();

// // authentication
router.post('/signIn', adminAuthController.signInAdmin);
router.get('/signOut', adminAuthController.signOutAdmin);

// password account creation
router.post('/createPassword', adminAuthController.createPassword);

// router protection (nanti)
router.use(adminAuthController.protect);

// admin manipulation
router.post('/', adminAuthController.createAdmin);

router.patch('/changePassword', adminAuthController.changePassword);

module.exports = router;
