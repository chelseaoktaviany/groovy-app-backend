const express = require('express');

// controller (inc)
const adminController = require('../controllers/adminController');

const router = express.Router();

// authentication
router.post('/signUp', adminController.signUp);
router.post('/signIn', adminController.signIn);
router.get('/signOut', adminController.signOut);

// account activation
router.get('/activate', adminController.accountActivation);

// password manipulation
router.patch('/changePassword', adminController.changePassword);

// using protection router
// router.use(adminController.protect);

// manipulate admin (NANTI)

module.exports = router;
