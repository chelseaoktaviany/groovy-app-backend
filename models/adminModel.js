const mongoose = require('mongoose');
const validator = require('validator');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');

// membuat sebuah skema
const adminSchema = new mongoose.Schema(
  {
    firstName: {
      type: String,
      required: [true, 'Mohon isi nama awal Anda'],
    },
    lastName: {
      type: String,
      required: [true, 'Mohon isi nama akhir Anda'],
    },
    username: {
      type: String,
      required: [true, 'Mohon isi nama pengguna Anda'],
    },
    emailAddress: {
      type: String,
      lowercase: true,
      unique: true,
      validate: [validator.isEmail, 'Mohon isi alamat e-mail Anda'],
    },
    password: {
      type: String,
      required: [true, 'Mohon isi password Anda'],
      minLength: 8,
      select: false,
    },
    passwordConfirm: {
      type: String,
      required: [true, 'Mohon isi password konfirmasi Anda'],
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
    profileImage: {
      type: String,
      default: 'default.jpeg',
    },
    role: {
      type: String,
      enum: ['super-admin', 'admin'],
      default: 'admin',
    },
  },
  { timestamps: true, versionKey: false }
);

// pre middleware
adminSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();

  // hash password
  this.password = crypto
    .createHash('sha256')
    .update(this.password)
    .digest('hex');

  // menghapus kolom password confirm
  this.passwordConfirm = undefined;
});

// method koreksi password
adminSchema.methods.correctPassword = async function (
  candidatePassword,
  userPassword
) {
  return await bcrypt.compare(candidatePassword, userPassword);
};

// ganti password
adminSchema.methods.changedPasswordAfter = function (JWTTimestamp) {
  if (this.passwordChangedAt) {
    const changedTimestamp = parseInt(
      this.passwordChangedAt.getTime() / 1000,
      10
    );

    console.log(changedTimestamp, JWTTimestamp);

    return JWTTimestamp < changedTimestamp;
  }

  // false dimaksud dengan tidak berubah
  return false;
};

// membuat token reset password
adminSchema.methods.createPasswordResetToken = function () {
  const resetToken = crypto.randomBytes(32).toString('hex');

  this.passwordResetToken = crypto
    .createHash('sha256')
    .update(resetToken)
    .digest('hex');

  console.log({ resetToken }, this.passwordResetToken);

  this.passwordResetExpires = Date.now() + 10 * 60 * 1000;

  return resetToken;
};

const Admin = mongoose.model('Admin', adminSchema);

module.exports = Admin;
