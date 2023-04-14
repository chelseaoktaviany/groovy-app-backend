const multer = require('multer');
const sharp = require('sharp');

// models
const User = require('../models/userModel');

// util
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');

// controllers
const factory = require('./handleFactory');

// multer
const multerStorage = multer.memoryStorage();

const multerFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image')) {
    cb(null, true);
  } else {
    cb(new AppError('Mohon upload gambar profile Anda', 400), false);
  }
};

const upload = multer({ storage: multerStorage, fileFilter: multerFilter });

// upload user photo
exports.uploadUserImage = upload.single('profileImage');

// resizing user photo
exports.resizeUserImage = catchAsync(async (req, res, next) => {
  if (!req.file) return next();

  req.body.profileImage = `user-${req.user.id}-${Date.now()}.jpeg`;

  sharp(req.file.buffer)
    .resize(500, 500)
    .toFormat('jpeg')
    .jpeg({ quality: 90 })
    .toFile(`public/img/users/${req.body.profileImage}`);

  next();
});

// memperolehkan semua user
exports.getAllUsers = factory.getAll(User, 'Berhasil mengakses data pengguna');

// memperolehkan sebuah user
exports.getMe = catchAsync(async (req, res, next) => {
  req.params.id = req.user.id;

  next();
});

exports.getUser = factory.getOne(User, { path: '_id' }, 'Success');

// mengubah user (JANGAN mengubah password dengan ini) NANTI
// exports.updateUserProfile = catchAsync(async (req, res, next) => {
//   const id = req.params.id;
//   const { firstName, lastName, nomorHP, emailAddress, profileImage } = req.body;

//   const user = await User.findByIdAndUpdate(
//     id,
//     { firstName, lastName, nomorHP, emailAddress, profileImage },
//     { new: true, runValidators: true }
//   );

//   await user.save({ validateBeforeSave: false });

//   res.status(201).json({
//     status: 0,
//     msg: 'Berhasil mengubah data pengguna',
//     data: user,
//   });
// });

// edit an user (set user status)
// exports.updateUser = factory.updateOne(User, 'Berhasil mengubah status user');
