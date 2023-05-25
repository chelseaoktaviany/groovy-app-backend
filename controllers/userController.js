const multer = require('multer');
const sharp = require('sharp');

const path = require('path');

// models
const User = require('../models/userModel');

// util
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');

// controllers
const factory = require('./handleFactory');

// multer
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/users/');
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `user-${Date.now()}${ext}`);
  },
});

// multer filter
const fileFilter = (req, file, cb) => {
  if (
    file.mimetype === 'image/png' ||
    file.mimetype === 'image/jpg' ||
    file.mimetype === 'image/jpeg'
  ) {
    cb(null, true);
  } else {
    cb(new AppError('Mohon upload gambar profile Anda', 400), false);
  }
};

// using multer middleware multi-part form data (upload pics)
const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: { fileSize: 1024 * 1024 * 2 },
});

// upload user photo
exports.uploadUserImage = upload.single('profileImage');

const filterObj = (obj, ...allowedFields) => {
  const newObj = {};
  Object.keys(obj).forEach((el) => {
    if (allowedFields.includes(el)) newObj[el] = obj[el];
  });
  return newObj;
};

// memperolehkan semua user
exports.getAllUsers = factory.getAll(User, 'Berhasil mengakses data pengguna');

// memperolehkan sebuah user
exports.getMe = catchAsync(async (req, res, next) => {
  req.params.id = req.user.id;

  next();
});

exports.getUser = factory.getOne(User, { path: '_id' }, 'Success');

// mengubah user (JANGAN mengubah password dengan ini)
exports.updateUserProfile = catchAsync(async (req, res, next) => {
  const id = req.params.id;

  const filteredBody = filterObj(
    req.body,
    'firstName',
    'lastName',
    'nomorHP',
    'emailAddress'
  );

  const profileImage = req.file.path.replace(/\\/g, '/');
  const outputPath = path
    .join('uploads', 'users', `resized-${req.file.filename}`)
    .replace(/\\/g, '/');

  sharp(profileImage).resize({ width: 500, height: 500 }).toFile(outputPath);

  const user = await User.findByIdAndUpdate(
    id,
    {
      firstName: filteredBody.firstName,
      lastName: filteredBody.lastName,
      nomorHP: filteredBody.nomorHP,
      emailAddress: filteredBody.emailAddress,
      profileImage: outputPath,
    },
    { new: true, runValidators: true }
  );

  await user.save({ validateBeforeSave: false });

  res.status(201).json({
    status: 0,
    msg: 'Berhasil mengubah data pengguna',
    data: user,
  });
});

// edit an user (set user status)
exports.updateUserStatus = catchAsync(async (req, res, next) => {
  const id = req.params.id;
  const { active } = req.body;

  const user = await User.findByIdAndUpdate(
    id,
    { active },
    { new: true, runValidators: false }
  );

  res.status(200).json({
    status: 0,
    msg: 'Berhasil mengubah status pengguna',
    data: user,
  });
});

// update point for an user
exports.updateUserPoint = catchAsync(async (req, res, next) => {
  const id = req.params.id;
  const { point } = req.body;

  const user = await User.findByIdAndUpdate(
    id,
    { point },
    { new: true, runValidators: false }
  );

  if (!user) {
    return next(new AppError('No user found'));
  }

  res.status(200).json({
    status: 0,
    msg: 'Berhasil mengubah point untuk pengguna',
    data: user,
  });
});
