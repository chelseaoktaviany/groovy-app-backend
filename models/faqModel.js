const mongoose = require('mongoose');

const faqSchema = new mongoose.Schema(
  {
    faqTitle: {
      type: String,
      required: [true, 'Mohon isi judul FAQ'],
    },
    faqContent: {
      type: String,
      required: [true, 'Mohon isi deskripsi untuk FAQ'],
    },
    isDisabled: {
      type: Boolean,
      default: false,
    },
  },
  { versionKey: false }
);

// exclude isdisabled: true
// faqSchema.pre(/^find/, function (next) {
//   // this points to the current query
//   this.find({ isDisabled: { $ne: true } });
//   next();
// });

const Faq = mongoose.model('Faq', faqSchema);

module.exports = Faq;
