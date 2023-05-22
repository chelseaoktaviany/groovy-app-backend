const mongoose = require('mongoose');

const pointSchema = mongoose.Schema({
  user: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    required: [true, 'Point harus ada di user'],
  },
  currency: {
    from: {
      type: String,
      default: 'GP',
    },
    to: { type: String, default: 'IDR' },
  },
  amount: {
    type: Number,
  },
});

pointSchema.pre(/^find/, function (next) {
  this.populate({
    path: 'user',
    select: 'firstName lastName emailAddress nomorHP point',
  });
  next();
});

const Point = mongoose.model('Point', pointSchema);

module.exports = Point;
