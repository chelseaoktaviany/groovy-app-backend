const mongoose = require('mongoose');
const validator = require('validator');

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
    active: {
      type: Boolean,
      default: false,
    },
    activeExpiredByDate: Date,
    otp: {
      type: Number,
      expires: '5m',
      index: true,
    },
    otpExpiration: Date,
    profileImage: {
      type: String,
      default: '/uploads/users/default.jpeg',
    },
    role: {
      type: String,
      enum: ['user'],
      default: 'user',
    },
    balance: {
      type: Number,
      default: 0,
    },
    point: {
      type: Number,
      default: 0,
    },
    paymentStatus: {
      type: String,
      enum: ['done', 'process'],
      default: undefined,
    },
  },
  { timestamps: true, versionKey: false }
);

const User = mongoose.model('User', userSchema);

module.exports = User;
