const catchAsync = require('../utils/catchAsync');
const factory = require('./handleFactory');

const Faq = require('../models/faqModel');

exports.getAllFaqs = factory.getAll(Faq, 'Berhasil mengakses semua data FAQ');

exports.getFaq = factory.getOne(
  Faq,
  { path: '_id' },
  'Berhasil mengakses sebuah data FAQ'
);

exports.createFaq = factory.createOne(Faq, 'Berhasil membuat sebuah data FAQ');

exports.updateFaq = catchAsync(async (req, res, next) => {});

exports.deleteFaq = factory.deleteOne(
  Faq,
  'Berhasil menghapus sebuah data FAQ'
);
