const multer = require('multer');
const sharp = require('sharp');

const path = require('path');

const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');

const factory = require('./handleFactory');

const Voucher = require('../models/voucherModel');

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
    cb(new AppError('Mohon upload gambar voucher', 400), false);
  }
};

// using multer middleware multi-part form data (upload pics)
const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: { fileSize: 1024 * 1024 * 2 },
});

// upload user photo
exports.uploadVoucherImage = upload.single('voucherImage');

const filterObj = (obj, ...allowedFields) => {
  const newObj = {};
  Object.keys(obj).forEach((el) => {
    if (allowedFields.includes(el)) newObj[el] = obj[el];
  });
  return newObj;
};

exports.getAllVouchers = factory.getAll(
  Voucher,
  'Berhasil memperoleh semua data voucher'
);

exports.getVoucher = factory.getOne(
  Voucher,
  { path: '_id' },
  'Berhasil memperoleh sebuah data voucher'
);

exports.createVoucher = catchAsync(async (req, res, next) => {
  const filteredBody = filterObj(
    req.body,
    'voucherTitle',
    'voucherType',
    'voucherDescription',
    'voucherPrice'
  );

  const voucherImage = req.file.path.replace(/\\/g, '/');

  const outputPath = path
    .join('uploads', 'vouchers', `resized-${req.file.filename}`)
    .replace(/\\/g, '/');

  sharp(voucherImage).resize({ width: 500, height: 500 }).toFile(outputPath);

  const newVoucher = await Voucher.create({
    voucherTitle: filteredBody.voucherTitle,
    voucherType: filteredBody.voucherType,
    voucherDescription: filteredBody.voucherDescription,
    voucherPrice: filteredBody.voucherPrice,
    voucherImage: outputPath,
  });

  res.status(201).json({
    status: 0,
    msg: 'Berhasil menambahkan data voucher',
    data: newVoucher,
  });
});

exports.updateVoucher = catchAsync(async (req, res, next) => {
  const id = req.params.id;

  const filteredBody = filterObj(
    req.body,
    'voucherTitle',
    'voucherType',
    'voucherDescription',
    'voucherPrice'
  );

  const voucherImage = req.file.path.replace(/\\/g, '/');
  const outputPath = path
    .join('uploads', 'vouchers', `resized-${req.file.filename}`)
    .replace(/\\/g, '/');

  sharp(voucherImage).resize({ width: 500, height: 500 }).toFile(outputPath);

  const voucher = await Voucher.findByIdAndUpdate(
    id,
    {
      voucherTitle: filteredBody.voucherTitle,
      voucherType: filteredBody.voucherType,
      voucherDescription: filteredBody.voucherDescription,
      voucherPrice: filteredBody.voucherPrice,
      voucherImage: outputPath,
    },
    { new: true, runValidators: true }
  );

  await voucher.save({ validateBeforeSave: false });

  res.status(201).json({
    status: 0,
    msg: 'Berhasil mengubah data voucher',
    data: voucher,
  });
});

exports.deleteVoucher = factory.deleteOne(
  Voucher,
  'Berhasil menghapus sebuah data voucher'
);
