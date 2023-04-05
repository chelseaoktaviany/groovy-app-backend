const mongoose = require('mongoose');
const validator = require('validator');
const crypto = require('crypto');
const bcrypt = require('bcryptjs');

// membuat sebuah skema
const userSchema = new mongoose.Schema(
  {
    firstName: {
      type: String,
      required: [true, 'Mohon isi nama awal pengguna Anda'],
      trim: true,
    },
    lastName: {
      type: String,
      required: [true, 'Mohon isi nama akhir pengguna Anda'],
      trim: true,
    },
    username: {
      type: String,
      required: function () {
        if (this.role === 'admin' || this.role === 'super-admin') {
          return [true, 'Mohon isi nama pengguna Anda'];
        }
      },
    },
    emailAddress: {
      type: String,
      lowercase: true,
      required: [true, 'Mohon isi alamat e-mail pengguna Anda'],
      validate: [
        validator.isEmail,
        'Alamat e-mail pengguna harus sesuai dengan format e-mail',
      ],
      sparse: true,
      unique: true,
      trim: true,
    },
    nomorHP: {
      type: String,
      required: function () {
        if (this.role === 'user') {
          return [true, 'Mohon isi nomor HP Anda'];
        }
      },
      sparse: true,
      unique: true,
      trim: true,
    },
    password: {
      type: String,
      required: function () {
        if (this.role === 'admin' || this.role === 'super-admin') {
          return [true, 'Mohon isi password Anda'];
        }
      },
      minLength: 8,
      select: false,
    },
    passwordConfirm: {
      type: String,
      required: function () {
        if (this.role === 'admin' || this.role === 'super-admin') {
          return [true, 'Mohon isi password konfirmasi Anda'];
        }
      },
      validate: {
        validator: function (el) {
          return el === this.password;
        },
        message: 'Password tidak sama dengan password konfirmasi Anda',
      },
    },
    passwordChangedAt: Date,
    activeToken: String,
    activeTokenExpires: Date,
    active: {
      type: Boolean,
      default: false,
    },
    otp: {
      type: Number,
      expires: '5m',
      index: true,
    },
    otpExpiration: Date,
    profileImage: {
      type: String,
      default: 'default.jpeg',
    },
    role: {
      type: String,
      enum: ['user', 'admin', 'super-admin'],
      default: 'user',
    },
    balance: {
      type: Number,
      default: undefined,
    },
    paymentStatus: {
      type: String,
      enum: ['done', 'process'],
      default: undefined,
    },
  },
  { timestamps: true, versionKey: false }
);

// pre middleware
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();

  // hash password
  this.password = await bcrypt.hash(this.password, 12);

  // menghapus kolom password confirm
  this.passwordConfirm = undefined;

  next();
});

// method koreksi password
userSchema.methods.correctPassword = async function (
  candidatePassword,
  userPassword
) {
  return await bcrypt.compare(candidatePassword, userPassword);
};

// ganti password
userSchema.methods.changedPasswordAfter = function (JWTTimestamp) {
  if (this.passwordChangedAt) {
    const changedTimestamp = parseInt(
      this.passwordChangedAt.getTime() / 1000,
      10
    );

    // console.log(changedTimestamp, JWTTimestamp);

    return JWTTimestamp < changedTimestamp;
  }

  // false dimaksud dengan tidak berubah
  return false;
};

// membuat token reset password
userSchema.methods.createPasswordResetToken = function () {
  const resetToken = crypto.randomBytes(32).toString('hex');

  this.passwordResetToken = crypto
    .createHash('sha256')
    .update(resetToken)
    .digest('hex');

  // console.log({ resetToken }, this.passwordResetToken);

  this.passwordResetExpires = Date.now() + 10 * 60 * 1000;

  return resetToken;
};

const User = mongoose.model('User', userSchema);

module.exports = User;
