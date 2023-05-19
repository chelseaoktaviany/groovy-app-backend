const jwt = require('jsonwebtoken');
// const crypto = require('crypto');
const { promisify } = require('util');

// utilities
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');

// const Email = require('../utils/email');

const Admin = require('../models/adminModel');

const signToken = (id, role) => {
  return jwt.sign({ id, role }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN,
  });
};

const createSendToken = (user, statusCode, msg, req, res) => {
  const token = signToken(user._id, user.role);

  res.cookie('jwt', token, {
    expires: new Date(
      Date.now() + process.env.JWT_COOKIE_EXPIRES_IN * 24 * 60 * 60 * 1000
    ),
    httpOnly: true,
    secure: req.secure || req.get('x-forwarded-proto') === 'https',
  });

  // mengirim hasil output (response)
  res.status(statusCode).json({
    status: 0,
    msg,
    data: {
      id: user._id,
      role: user.role,
    },
    token,
  });
};

exports.createAdmin = catchAsync(async (req, res, next) => {
  const { name, emailAddress } = req.body;

  // membuat link token aktivasi
  // const adminToken = crypto.randomBytes(20).toString('hex');
  // const adminTokenExpires = Date.now() + 24 * 60 * 60 * 1000; // token valid selama 24 jam

  const admin = await Admin.create({
    name,
    emailAddress,
    // adminToken,
    // adminTokenExpires,
    role: 'admin',
  });

  admin.active = true;
  admin.save({ validateBeforeSave: false });

  createSendToken(
    admin,
    201,
    'Success! Berhasil pembuatan akun admin',
    req,
    res
  );

  // res.status(201).json({
  //   status: 0,
  //   msg: 'Success! Berhasil pembuatan akun admin',
  //   data: {
  //     name: admin.name,
  //     emailAddress: admin.emailAddress,
  //     role: admin.role,
  //   },
  // });

  // try {
  //   admin.active = true;
  //   admin.save({ validateBeforeSave: false });

  //   send confirmation email
  //   const url = `http://127.0.0.1:${process.env.PORT}/v1/ga/users/createPassword?token=${adminToken}`;

  //   await new Email(admin, url).sendWelcome();

  //   res.status(201).json({
  //     status: 0,
  //     msg: 'Success! Berhasil pembuatan akun admin',
  //     data: {
  //       name: admin.name,
  //       emailAddress: admin.emailAddress,
  //       role: admin.role,
  //     },
  //   });
  // } catch (err) {
  //   admin.active = false;
  //   await admin.save({ validateBeforeSave: false });
  //   return next(
  //     new AppError(
  //       'Ada kesalahan yang terjadi saat mengirim e-mail, mohon dicoba lagi',
  //       500
  //     )
  //   );
  // }
});

// exports.createPassword = catchAsync(async (req, res, next) => {
//   const { password, passwordConfirm } = req.body;

//   const admin = await Admin.findOne({ adminToken: req.query.token });

//   if (!admin) {
//     return next(new AppError('Token tidak valid', 401));
//   }

//   if (admin.adminTokenExpires < Date.now()) {
//     return next(new AppError('Token sudah kedaluarsa', 401));
//   }

//   admin.password = password;
//   admin.passwordConfirm = passwordConfirm;

//   await admin.save({ validateBeforeSave: false });

//   createSendToken(admin, 201, 'Berhasil membuat password admin');
// });

// exports.signInAdmin = catchAsync(async (req, res, next) => {
//   const { , password } = req.body;

//   const admin = await Admin.findOne({ username }).select('+password');

//   // memeriksa jika username terisi?
//   if (!username || !password) {
//     return next(new AppError('Mohon isi username dan password Anda', 400));
//   }

//   // memeriksa jika user sudah ada && password salah
//   const matchedPassword = await admin.correctPassword(password, admin.password);

//   if (!admin || !matchedPassword) {
//     return next(new AppError('Password atau username salah', 401));
//   }

//   createSendToken(
//     admin,
//     201,
//     'Success! Berhasil melakukan sign in admin',
//     req,
//     res
//   );
// });

exports.signInAdmin = catchAsync(async (req, res, next) => {
  const { name, password } = req.body;

  const admin = await Admin.findOne({ name }).select('+password');

  // memeriksa jika username terisi?
  if (!name || !password) {
    return next(new AppError('Mohon isi username dan password Anda', 400));
  }

  // memeriksa jika user sudah ada && password salah
  const matchedPassword = await admin.correctPassword(password, admin.password);

  if (!admin || !matchedPassword) {
    return next(new AppError('Password atau username salah', 401));
  }

  createSendToken(
    admin,
    201,
    'Success! Berhasil melakukan sign in admin',
    req,
    res
  );
});

exports.signOutAdmin = catchAsync(async (req, res, next) => {
  res.cookie('jwt', 'loggedout', {
    expires: new Date(Date.now() + 10 * 1000),
    httpOnly: true,
  });

  res.status(200).json({ status: 0, msg: 'Success' });
});

exports.protect = catchAsync(async (req, res, next) => {
  // getting token
  let token;
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    token = req.headers.authorization.split(' ')[1];
  } else if (req.cookies.jwt) {
    token = req.cookies.jwt;
  }

  if (!token) {
    return next(
      new AppError(
        'Anda belum log in, mohon lakukan login untuk mendapatkan akses token',
        401
      )
    );
  }

  // verifikasi token
  const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET);

  // memeriksa jika admin sudah ada
  const currentAdmin = await Admin.findById(decoded.id);
  if (!currentAdmin) {
    return next(new AppError('Token itu yang dia miliki sudah tidak ada'));
  }

  // memeriksa jika admin sudah mengganti password setelah token
  if (currentAdmin.changedPasswordAfter(decoded.iat)) {
    return next(
      new AppError('Pengguna telah mengganti password, mohon login lagi', 401)
    );
  }

  req.admin = currentAdmin;
  res.locals.admin = currentAdmin;
  next();
});

exports.isLoggedIn = async (req, res, next) => {
  try {
    if (req.cookies.jwt) {
      // verifikasi token
      const decoded = await promisify(jwt.verify)(
        req.cookies.jwt,
        process.env.JWT_SECRET
      );

      // memeriksa jika pengguna sudah ada
      const currentAdmin = await Admin.findById(decoded.id);
      if (!currentAdmin) {
        return next();
      }

      // memeriksa jika pengguna sudah mengganti password
      if (currentAdmin.changedPasswordAfter(decoded.iat)) {
        return next();
      }

      // ada pengguna yang sudah login
      res.locals.admin = currentAdmin;
      return next();
    }
  } catch (err) {
    return next();
  }
};

// restrict to specified roles
exports.restrictTo = (...roles) => {
  return (req, res, next) => {
    // roles['admin', 'super-admin'], role='user'
    if (!roles.includes(req.admin.role)) {
      return next(
        new AppError('Anda tidak punya izin untuk melakukan tindakan ini', 403)
      );
    }
    next();
  };
};

// mengubah password untuk admin atau super-admin
exports.changePassword = catchAsync(async (req, res, next) => {
  const admin = await Admin.findById(req.admin.id).select('+password');

  console.log(admin);

  // check if the password is correct?
  if (
    !(await admin.correctPassword(req.body.currentPassword, admin.password))
  ) {
    return next(new AppError('Password lama Anda salah.', 401));
  }
  // 3) if so, update password
  admin.password = req.body.password;
  admin.passwordConfirm = req.body.passwordConfirm;
  admin.passwordChangedAt = Date.now();
  await admin.save();

  // User.findByIdAndUpdate will NOT work as intended
  // 4) log user in, send JWT
  createSendToken(admin, 200, 'Berhasil mengubah password', req, res);
});
