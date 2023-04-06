const multer = require('multer');
const sharp = require('sharp');

// models
const Package = require('../models/packageModel');

// controllers
const factory = require('./handleFactory');

// utils
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');

const multerStorage = multer.memoryStorage();

const multerFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image')) {
    cb(null, true);
  } else {
    cb(new AppError('Mohon isi gambar paket internet', 400), false);
  }
};

const upload = multer({ storage: multerStorage, fileFilter: multerFilter });

exports.uploadPackagePhoto = upload.single('packageImage');

// resizing uploaded image
exports.resizePackagePhoto = catchAsync(async (req, res, next) => {
  if (!req.file) return next();

  // package image
  req.body.packageImage = `package-${Date.now()}.jpeg`;

  await sharp(req.file.buffer)
    .resize(1000, 500)
    .toFormat('jpeg')
    .jpeg({ quality: 90 })
    .toFile(`public/img/packages/${req.body.packageImage}`);

  next();
});

// get all packages
exports.getAllPackages = factory.getAll(
  Package,
  'Berhasil mengakses paket internet'
);

// get package
exports.getPackage = factory.getOne(
  Package,
  'Berhasil mengakses sebuah data paket internet'
);

// create package
exports.createPackage = factory.createOne(
  Package,
  'Berhasil menambahkan data paket internet'
);

// edit package
exports.updatePackage = factory.updateOne(
  Package,
  'Berhasil mengubah data paket internet'
);

// delete package
exports.deletePackage = factory.deleteOne(
  Package,
  'Berhasil menghapus data paket internet'
);
