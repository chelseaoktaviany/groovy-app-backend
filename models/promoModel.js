const mongoose = require('mongoose');

const promoSchema = mongoose.Schema({
  promoTitle: {
    type: String,
    require: [true, 'Mohon isi judul promo'],
  },
  promoDescription: {
    type: String,
    require: [true, 'Mohon isi deskripsi promo'],
  },
  promoImage: {
    type: String,
    require: [true, 'Mohon isi gambar promo'],
  },
});

const Promo = mongoose.model('Promo', promoSchema);

module.exports = Promo;
