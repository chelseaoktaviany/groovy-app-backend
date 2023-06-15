const factory = require('./handleFactory');

const Faq = require('../models/faqModel');

const AppError = require('../utils/appError');
const catchAsync = require('../utils/catchAsync');

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

exports.disableFaq = catchAsync(async (req, res, next) => {
  const id = req.params.id;

  const updatedFaq = await Faq.findByIdAndUpdate(
    id,
    {
      isDisabled: true,
    },
    { new: true, runValidators: true }
  );

  // if (updatedFaq) {
  //   return next(new AppError('No faq found', 404));
  // }

  res.status(200).json({
    status: 0,
    msg: 'Disabled faq successfully',
    data: updatedFaq,
  });
});
