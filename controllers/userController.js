const User = require('../models/userModel');

// util
const catchAsync = require('../utils/catchAsync');

// controllers
const factory = require('./handleFactory');

// memperolehkan semua user
exports.getAllUsers = factory.getAll(User, 'Berhasil mengakses data pengguna');

// memperolehkan sebuah user
exports.getMe = catchAsync(async (req, res, next) => {
  req.params.id = req.user.id;

  next();
});

exports.getUser = factory.getOne(User, 'Success');

// mengubah user (JANGAN mengubah password dengan ini) NANTI
