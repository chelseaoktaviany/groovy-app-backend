const mongoose = require('mongoose');

const packageSchema = new mongoose.Schema(
  {
    packageName: {
      type: String,
      required: [true, 'Mohon isi nama paket internet'],
    },
    packageDescription: {
      type: String,
      required: [true, 'Mohon isi deskripsi paket internet'],
    },
    packagePrice: {
      type: Number,
      required: [true, 'Mohon isi harga paket internet'],
    },
    packageImage: String,
    packageType: {
      type: String,
      enum: ['Yearly', 'Monthly'],
      required: [true, 'Mohon isi tipe paket internet'],
    },
  },
  { versionKey: false }
);

const Package = mongoose.model('Package', packageSchema);

module.exports = Package;
