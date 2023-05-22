const mongoose = require('mongoose');

const voucherSchema = mongoose.Schema({
  voucherTitle: {
    type: String,
    require: [true, 'Mohon isi nama voucher'],
  },
  voucherType: {
    type: String,
    require: [true, 'Mohon isi tipe voucher'],
  },
  voucherDescription: {
    type: String,
    require: [true, 'Mohon isi deskripsi voucher'],
  },
  voucherPrice: {
    type: String,
    require: [true, 'Mohon isi harga voucher'],
  },
  voucherImage: {
    type: String,
    require: [true, 'Mohon isi gambar voucher'],
  },
  redeemDate: {
    type: Date,
    default: Date.now(),
    require: [true, 'Mohon isi tanggal redeem voucher'],
  },
});

const Voucher = mongoose.model('Voucher', voucherSchema);

module.exports = Voucher;
