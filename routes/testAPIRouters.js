const express = require('express');
const catchAsync = require('../utils/catchAsync');

const router = express.Router();

router.get(
  '/',
  catchAsync(async (req, res, next) => {
    res.send('Andalworks API is working properly');
  })
);

module.exports = router;
