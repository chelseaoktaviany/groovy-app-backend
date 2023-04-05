const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { promisify } = require('util');
// utilities
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');
const { generateOTP } = require('../utils/otp');

const Email = require('../utils/email');

// menggunakan model
const User = require('../models/userModel');

// global variable
let emailAddress;

// generate OTP
const generateAndSaveOtp = async (user) => {
  // melakukan mengirim OTP
  const otp = generateOTP(6);
  user.otp = otp;
  user.otpExpiration = new Date(Date.now() + 5 * 60 * 1000); // berlaku selama 5 menit

  await user.save();
  return otp;
};

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

// signup mendaftar akun pengguna menggunakan nomor HP (DONE)
/**
 * Pendaftaran user, setelah data valid, e-mail berisi otp akan dikirim
 * @async
 * @method
 * @field - {firstName - nama awal, lastName - nama akhir, emailAddress - alamat e-mail, nomorHP - nomor HP}
 * @returns status, msg, data:{user}
 * @throws - 401 (User exists) & 500 (Internal Server Error)
 */
exports.signUp = catchAsync(async (req, res, next) => {
  emailAddress = req.body.emailAddress;

  const {
    firstName,
    lastName,
    username,
    nomorHP,
    password,
    passwordConfirm,
    role,
  } = req.body;

  const user = await User.findOne({ emailAddress });

  if (user) {
    return next(new AppError('User sudah pernah ada', 409));
  }

  if (role === 'admin' || role === 'super-admin') {
    // membuat link token aktivasi
    const activeToken = crypto.randomBytes(20).toString('hex');
    const activeTokenExpires = Date.now() + 24 * 60 * 60 * 1000; // token valid selama 24 jam

    const newAdmin = await User.create({
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

    newAdmin.nomorHP = undefined;

    await newAdmin.save({ validateBeforeSave: false });

    try {
      // send confirmation email
      const url = `http://127.0.0.1:${process.env.PORT}/v1/users/activate?token=${activeToken}`;

      await new Email(newAdmin, url).sendWelcome();

      res.status(201).json({
        status: 0,
        msg: "We've already sent an e-mail to your email address",
        data: {
          firstName: newAdmin.firstName,
          lastName: newAdmin.lastName,
          username: newAdmin.username,
          emailAddress: newAdmin.emailAddress,
          role: newAdmin.role,
        },
      });
    } catch (err) {
      newAdmin.active = false;
      await newAdmin.save({ validateBeforeSave: false });
      return next(
        new AppError(
          'Ada kesalahan yang terjadi saat mengirim e-mail, mohon dicoba lagi',
          500
        )
      );
    }
  } else if (role === 'user') {
    const newUser = await User.create({
      firstName,
      lastName,
      emailAddress,
      nomorHP,
    });

    // email untuk OTP
    try {
      // melakukan aktif dan mengirim OTP
      newUser.otp = await generateAndSaveOtp(newUser);

      newUser.active = true;
      await newUser.save({ validateBeforeSave: false });
      await new Email(newUser).sendOTPEmail();

      // mengirim response
      res.status(201).json({
        status: 0,
        msg: "We've already sent OTP in your e-mail",
        data: {
          id: newUser._id,
          firstName: newUser.firstName,
          lastName: newUser.lastName,
          emailAddress: newUser.emailAddress,
          nomorHP: newUser.nomorHP,
          role: newUser.role,
        },
      });
    } catch (err) {
      newUser.active = false;
      newUser.otp = undefined;
      await newUser.save({ validateBeforeSave: false });

      return next(
        new AppError(
          'Ada kesalahan yang terjadi saat mengirim e-mail, mohon dicoba lagi',
          500
        )
      );
    }
  }
});

// signin akun pengguna menggunakan nomor HP
/**
 * Sign in user, setelah data valid, e-mail berisi otp akan dikirim
 * @async
 * @method
 * @field - {nomorHP - nomor HP}
 * @returns status, msg, data:{user}
 * @throws - 400 (Mohon isi nomor HP Anda), 401 (Nomor HP user yang telah terdaftar tidak ditemukan), 500 (Failed to send an e-mail containing OTP) & 500 (Internal Server Error)
 */
exports.signIn = catchAsync(async (req, res, next) => {
  const { nomorHP, username, password } = req.body;

  if (nomorHP) {
    const user = await User.findOne({
      nomorHP,
    });

    if (!user) {
      return next(
        new AppError('Nomor HP pengguna yang terdaftar tidak ditemukan', 401)
      );
    }

    // finding an existed e-mail address in database
    emailAddress = user.emailAddress;

    try {
      user.otp = await generateAndSaveOtp(user);

      await user.save({ validateBeforeSave: false });

      await new Email(user).sendOTPEmail();

      res.status(200).json({
        status: 0,
        msg: "We've already sent OTP in your e-mail",
        data: {
          id: user._id,
          firstName: user.firstName,
          lastName: user.lastName,
        },
      });
    } catch (err) {
      return next(
        new AppError(
          'Ada kesalahan yang terjadi saat mengirim e-mail, mohon dicoba lagi'
        )
      );
    }
  } else if (username && password) {
    const user = await User.findOne({ username }).select('+password');

    // memeriksa jika username terisi?
    if (!username || !password) {
      return next(new AppError('Mohon isi username dan password Anda', 400));
    }

    // memeriksa jika user sudah ada && password salah
    const matchedPassword = await user.correctPassword(password, user.password);

    if (!user || !matchedPassword) {
      return next(new AppError('Password atau username salah', 401));
    }

    createSendToken(
      user,
      201,
      'Success! Berhasil melakukan sign in admin',
      req,
      res
    );
  }
});

/**
 * Pengiriman ulang OTP, mengirim OTP kepada e-mail pengguna
 * @async
 * @method
 * @returns status, msg
 * @throws - 404 (User not found), 429 (Too many requests) & 500 (Internal Server Error)
 */
exports.resendOTP = catchAsync(async (req, res, next) => {
  try {
    const user = await User.findOne({ emailAddress });

    if (!user) {
      return next(new AppError('Akun pengguna tidak ditemukan'));
    }

    // send OTP melalui E-mail (namun kalau mengirim OTP sebanyak 3 kali aka limit=3)
    user.otp = await generateAndSaveOtp(user);
    await user.save({ validateBeforeSave: false });

    // email untuk OTP
    await new Email(user).sendOTPEmail();

    // kirim response
    res.status(201).json({
      status: 0,
      msg: "We've already sent OTP in your e-mail",
    });
  } catch (err) {
    const user = await User.findOne({ emailAddress });
    user.otp = undefined;
    user.otpExpiration = undefined;
    await user.save({ validateBeforeSave: false });

    return next(
      new AppError(
        'Ada kesalahan yang terjadi saat mengirim ulang OTP, mohon dicoba lagi',
        500
      )
    );
  }
});

/**
 * Verifikasi OTP, melakukan verifikasi OTP dari e-mail
 * @async
 * @method
 * @field - {id - user._id, otp: OTP}
 * @returns status, msg
 * @throws - 404 (User not found), 400 (OTP invalid or wrong) & 500 (Internal Server Error)
 */
exports.verifyOTP = catchAsync(async (req, res, next) => {
  const otp = req.body.otp;
  const user = await User.findOne({ emailAddress });

  // memeriksa jika user tidak ditemukan
  if (!user) {
    return next(new AppError('Akun pengguna tidak ditemukan', 404));
  }

  // memeriksa jika OTP benar
  if (otp !== user.otp) {
    return next(new AppError('OTP salah', 401));
  }

  if (user.otpExpiration < new Date()) {
    user.otp = undefined;
    user.otpExpiration = undefined;
    await user.save({ validateBeforeSave: false });

    return next(new AppError('OTP sudah kedaluarsa', 401));
  }

  // otp is valid
  user.otp = undefined;
  user.otpExpiration = undefined;
  await user.save({ validateBeforeSave: false });

  // create token
  createSendToken(user, 200, 'Berhasil verifikasi OTP', req, res);
});

exports.signOut = catchAsync(async (req, res, next) => {});

exports.accountActivation = catchAsync(async (req, res, next) => {
  const activeToken = req.query.token;

  const user = await User.findOne({ activeToken });

  if (!user) {
    return next(new AppError('Aktivasi token tidak valid', 401));
  }

  if (user.activeTokenExpires < Date.now()) {
    return next(new AppError('Aktivasi token sudah kedaluarsa', 401));
  }

  user.active = true;
  user.activeToken = undefined;
  user.activeTokenExpires = undefined;
  await user.save({ validateBeforeSave: false });

  res.status(200).json({
    status: 0,
    msg: 'Success! Berhasil aktivasi akun admin melalui alamat e-mail admin',
  });
});

exports.changePassword = catchAsync(async (req, res, next) => {});

/**
 * protect, perlindungan router
 * @async
 * @method
 * @field - {id - user._id, otp: OTP}
 * @returns status, msg
 * @throws - 404 (User not found), 400 (OTP invalid or wrong) & 500 (Internal Server Error)
 */
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

  // memeriksa jika pengguna sudah ada
  const currentUser = await User.findById(decoded.id);
  if (!currentUser) {
    return next(new AppError('Token itu yang dia miliki sudah tidak ada'));
  }

  // memeriksa jika pengguna sudah mengganti password setelah token
  if (currentUser.changedPasswordAfter(decoded.iat)) {
    return next(
      new AppError('Pengguna telah mengganti password, mohon login lagi', 401)
    );
  }

  // grant access to protected route
  req.user = currentUser;
  res.locals.user = currentUser;
  next();
});

// logged in
exports.isLoggedIn = async (req, res, next) => {
  try {
    if (req.cookies.jwt) {
      // verifikasi token
      const decoded = await promisify(jwt.verify)(
        req.cookies.jwt,
        process.env.JWT_SECRET
      );

      // memeriksa jika pengguna sudah ada
      const currentUser = await User.findById(decoded.id);
      if (!currentUser) {
        return next();
      }

      // memeriksa jika pengguna sudah mengganti password
      if (currentUser.changedPasswordAfter(decoded.iat)) {
        return next();
      }

      // ada pengguna yang sudah login
      res.locals.user = currentUser;
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
    if (!roles.includes(req.user.role)) {
      return next(
        new AppError('Anda tidak punya izin untuk melakukan tindakan ini', 403)
      );
    }

    next();
  };
};
