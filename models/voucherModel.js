const mongoose = require('mongoose');

const voucherSchema = mongoose.Schema(
  {
    voucherTitle: {
      type: String,
      require: [true, 'Mohon isi nama voucher'],
    },
    voucherType: {
      type: String,
      enum: ['Food', 'Token', 'Pulsa'],
      require: [true, 'Mohon isi tipe voucher'],
    },
    voucherDescription: {
      type: String,
      require: [true, 'Mohon isi deskripsi voucher'],
    },
    voucherPoint: {
      type: Number,
      require: [true, 'Mohon isi poin voucher'],
    },
    voucherImage: {
      type: String,
      require: [true, 'Mohon isi gambar voucher'],
    },
    validUntilDate: Date,
    redeemedByUser: {
      type: mongoose.Schema.ObjectId,
      ref: 'User',
    },
  },
  { toJSON: { virtuals: true }, toObject: { virtuals: true } }
);

voucherSchema.pre(/^find/, function (next) {
  this.populate('redeemedByUser').populate({
    path: 'redeemedByUser',
    select: 'firstName lastName emailAddress nomorHP profileImage',
  });

  next();
});

const Voucher = mongoose.model('Voucher', voucherSchema);

module.exports = Voucher;
