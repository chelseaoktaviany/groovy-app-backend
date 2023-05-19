const factory = require('./handleFactory');

const Faq = require('../models/faqModel');

exports.getAllFaqs = factory.getAll(Faq, 'Berhasil mengakses semua data FAQ');

exports.getFaq = factory.getOne(
  Faq,
  { path: '_id' },
  'Berhasil mengakses sebuah data FAQ'
);

exports.createFaq = factory.createOne(Faq, 'Berhasil membuat sebuah data FAQ');

exports.updateFaq = factory.updateOne(Faq, 'Berhasil mengubah status data FAQ');

exports.deleteFaq = factory.deleteOne(
  Faq,
  'Berhasil menghapus sebuah data FAQ'
);
