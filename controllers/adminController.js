// const { promisify } = require('util');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');

// utilities
const AppError = require('../utils/appError');
const catchAsync = require('../utils/catchAsync');
const Email = require('../utils/email');

// menggunakan model
const Admin = require('../models/adminModel');

// token
const signToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN,
  });
};

const createSendToken = (user, statusCode, req, res) => {
  const token = signToken(user._id);

  res.cookie('jwt', token, {
    expires: new Date(
      Date.now() + process.env.JWT_COOKIE_EXPIRES_IN * 24 * 60 * 60 * 1000
    ),
  });

  // mengirim hasil output (response)
  res.status(statusCode).json({
    status: 0,
    msg: 'Success',
    data: {
      user,
    },
    token,
  });
};

exports.signUp = catchAsync(async (req, res, next) => {
  const {
    firstName,
    lastName,
    username,
    emailAddress,
    password,
    passwordConfirm,
    role,
  } = req.body;

  const existedAdmin = await Admin.findOne({ emailAddress });

  if (existedAdmin) {
    return next(
      new AppError('E-mail sudah pernah ada, mohon gunakan e-mail lain', 409)
    );
  }

  // membuat link token aktivasi
  const activeToken = crypto.randomBytes(20).toString('hex');
  const activeTokenExpires = Date.now() + 24 * 60 * 60 * 1000; // token valid selama 24 jam

  const admin = await Admin.create({
    firstName,
    lastName,
    username,
    emailAddress,
    password,
    passwordConfirm,
    activeToken,
    activeTokenExpires,
    role,
  });

  admin.save({ validateBeforeSave: false });

  try {
    // send confirmation email
    const url = `http://127.0.0.1:${process.env.PORT}/v1/admins/activate?token=${activeToken}`;

    await new Email(admin, url).sendWelcome();

    res.status(201).json({
      status: 0,
      msg: "We've already sent an e-mail to your email address",
      data: {
        firstName: admin.firstName,
        lastName: admin.lastName,
        username: admin.username,
        emailAddress: admin.emailAddress,
      },
    });
  } catch (err) {
    admin.active = false;
    return next(
      new AppError(
        'Ada kesalahan yang terjadi saat mengirim e-mail, mohon dicoba lagi',
        500
      )
    );
  }
});

exports.signIn = catchAsync(async (req, res, next) => {
  const { username, password } = req.body;

  const admin = await Admin.findOne({ username }).select('+password');

  // memeriksa jika username terisi?
  if (!username || !password) {
    return next(new AppError('Mohon isi username dan password Anda', 400));
  }

  // memeriksa jika akun admin ditemukan?
  // if (!admin) {
  //   return next(new AppError('Password atau username salah', 401));
  // }

  // memeriksa jika user sudah ada && password salah
  if (!admin || !(await admin.correctPassword(password, admin.password))) {
    return next(new AppError('Password atau username salah', 401));
  }

  createSendToken(admin, 201, req, res);
});

exports.signOut = catchAsync(async (req, res, next) => {});

exports.accountActivation = catchAsync(async (req, res, next) => {
  const activeToken = req.query.token;

  const admin = await Admin.findOne({ activeToken });

  if (!admin) {
    return next(new AppError('Aktivasi token tidak valid', 401));
  }

  if (admin.activeTokenExpires < Date.now()) {
    return next(new AppError('Aktivasi token sudah kedaluarsa', 401));
  }

  admin.active = true;
  admin.activeToken = undefined;
  admin.activeTokenExpires = undefined;
  admin.save({ validateBeforeSave: false });

  res.status(200).json({
    status: 0,
    msg: 'Success! Berhasil aktivasi akun admin melalui alamat e-mail admin',
  });
});

// protect router
// exports.protect = catchAsync(async (req, res, next) => {
//   // memperolehkan token dan memeriksa jika ada
//   let token;
//   if (
//     req.headers.authorization &&
//     req.headers.authorization.startsWith('Bearer')
//   ) {
//     token = req.headers.authorization.split(' ')[1];
//   } else if (req.cookies.jwt) {
//     token = req.cookies.jwt;
//   }

//   if (!token) {
//     return next(
//       new AppError(
//         'Anda belum bisa login! Mohon login untuk memperolehkan akses token',
//         401
//       )
//     );
//   }

//   // verifikasi token
//   const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET);

//   // memeriksa jika user sudah ada
//   const currentAdmin = await Admin.findById(decoded.id);
//   if (!currentAdmin) {
//     return next(
//       new AppError('Token yang dimiliki oleh admin sudah tidak ada.')
//     );
//   }

//   // memeriksa jika user ganti password setelah token telah "issued"
//   if (currentAdmin.changedPasswordAfter(decoded.iat)) {
//     return next(
//       new AppError(
//         'User telah ganti password, mohon melakukan login lagi.',
//         401
//       )
//     );
//   }

//   // akses diterima
//   req.admin = currentAdmin;
//   res.locals.admin = currentAdmin;
//   next();
// });

exports.changePassword = catchAsync(async (req, res, next) => {});
