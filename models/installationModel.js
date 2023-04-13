const mongoose = require('mongoose');

const installationSchema = new mongoose.Schema(
  {
    location: {
      address: String,
      kelurahan: String,
      kecamatan: String,
      provinsi: String,
      kodePos: String,
    },
    firstName: {
      type: String,
      required: [true, 'Mohon isi nama awal pelanggan'],
    },
    lastName: {
      type: String,
      required: [true, 'Mohon isi nama akhir pengguna'],
    },
    emailAddress: {
      type: String,
      required: [true, 'Mohon isi alamat e-mail pelanggan'],
    },
    nomorHP: {
      type: String,
      required: [true, 'Mohon isi nomor HP pelanggan'],
    },
    detailedAddress: {
      type: String,
      required: [true, 'Mohon isi alamat secara detail'],
    },
  },
  { versionKey: false }
);

const Installation = mongoose.model('Installation', installationSchema);

module.exports = Installation;
