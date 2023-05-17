const mongoose = require('mongoose');

const faqSchema = new mongoose.Schema(
  {
    faqTitle: {
      type: String,
      required: [true, 'Mohon isi judul QnA'],
    },
    faqQuestion: {
      type: String,
      required: [true, 'Mohon isi pertanyaan'],
    },
    faqAnswer: {
      type: String,
      required: [true, 'Mohon isi jawaban'],
    },
    isDisabled: {
      type: Boolean,
      default: false,
    },
  },
  { versionKey: false }
);

const Faq = mongoose.model('Faq', faqSchema);

module.exports = Faq;
