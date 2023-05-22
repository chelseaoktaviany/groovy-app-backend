const express = require('express');

const authController = require('../controllers/authController');
const pointController = require('../controllers/pointController');

const router = express.Router();

router.use(authController.protect);

router.use(authController.restrictTo('admin'));

router.route('/convert').get(pointController.convertPoint);

router.route('/').get(pointController.getAllPointHistory);

router.route('/:id').get(pointController.getPoint);

module.exports = router;
