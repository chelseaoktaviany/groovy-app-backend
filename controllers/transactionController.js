const { v4: uuidv4 } = require('uuid');
const midtransClient = require('midtrans-client');

const dotenv = require('dotenv');

// menggunakan dotenv config
dotenv.config({ path: './config.env' });

const Package = require('../models/packageModel');
const User = require('../models/userModel');
const Transaction = require('../models/transactionModel');

const catchAsync = require('../utils/catchAsync');
const factory = require('./handleFactory');
const AppError = require('../utils/appError');

const core = new midtransClient.CoreApi({
  isProduction: false,
  serverKey: process.env.SB_MIDTRANS_SERVER_KEY,
  clientKey: process.env.SB_MIDTRANS_CLIENT_KEY,
});

exports.getCreditCard = catchAsync(async (req, res, next) => {
  try {
    const parameter = {
      card_number: req.body.card_number,
      card_exp_month: req.body.card_exp_month,
      card_exp_year: req.body.card_exp_year,
      card_ccv: req.body.card_ccv,
      client_key: core.apiConfig.clientKey,
    };

    //code here
    core
      .cardToken(parameter)
      .then((cardResponse) => {
        console.log('Card response:', JSON.stringify(cardResponse));

        const dataCard = {
          response: JSON.stringify(cardResponse),
        };

        res.status(200).json({
          status: 0,
          msg: 'Retrieved card response successfully',
          dataCard,
        });
      })
      .catch((err) => {
        console.log(err.message);
      });
  } catch (err) {
    console.log(err.message);
  }
});

exports.checkoutProduct = catchAsync(async (req, res, next) => {
  try {
    const { packageId } = req.params;

    // get user
    const user = await User.findById(req.user.id);

    if (!user) {
      return next(new AppError('User not found', 404));
    }

    // get package
    const existedPackage = await Package.findById(packageId);

    if (!existedPackage) {
      return next(new AppError('Package not found', 404));
    }

    const transactionId = uuidv4();

    const parameter = {
      transaction_detail: {
        order_id: transactionId,
        gross_amount: existedPackage.packagePrice,
      },
      customer_details: {
        first_name: user.firstName,
        last_name: user.lastName,
        email: user.emailAddress,
        phone: user.nomorHP,
      },
      name: existedPackage.packageName,
      amount: existedPackage.packagePrice,
      currency: 'IDR',
      payment_type: 'credit_card',
      credit_card: {
        secure: true,
        save_card: true,
      },
      token: '521111gmWqMegyejqCQmmopnCFRs1117', // ambil dari get credit card
      schedule: {
        interval: 1,
        interval_unit: 'month',
        max_interval: 12,
        // start_time: existedPackage.packageNextPayment, // solution?
        start_time: '2023-08-31 15:07:00 +0700',
      },
    };

    core
      .createSubscription(parameter)
      .then((transaction) => {
        // transaction token
        const transactionToken = transaction.token;

        console.log('transactionToken:', transactionToken);

        const dataSubscription = JSON.stringify(transaction);

        const newTransaction = new Transaction({
          transactionId,
          package: existedPackage._id,
          user: user._id,
          payerEmail: user.emailAddress,
          amount: existedPackage.packagePrice,
          createdAt: new Date(),
          updatedAt: new Date(),
          responseMidtrans: dataSubscription,
        });

        newTransaction.save({ validateBeforeSave: false });

        res.status(200).json({
          status: 0,
          msg: `Invoice created with ID: ${transactionId}`,
          data: newTransaction,
          transactionToken,
        });
      })
      .catch((err) => {
        console.log(err.message);
      });
  } catch (err) {
    console.log(err.message);
  }
});

exports.verifyPaymentTransaction = catchAsync(async (req, res, next) => {
  // code here
});

exports.cancelProduct = catchAsync(async (req, res, next) => {
  try {
    const { id } = req.params;

    core.disableSubscription(id).then((response) => {
      console.log('Response:', JSON.stringify(response));

      const dataSubscription = {
        response: JSON.stringify(response),
      };

      res.status(200).json({
        status: 0,
        msg: 'Berhasil membatalkan subscription',
        dataSubscription,
      });
    });
  } catch (err) {
    console.log(err.message);
  }
});

exports.getAllTransactions = factory.getAll(
  Transaction,
  'Berhasil mengakses data transaksi'
);

exports.getTransaction = factory.getOne(
  Transaction,
  { path: '_id' },
  'Berhasil mengakses data transaksi'
);

exports.updateTransaction = factory.updateOne(
  Transaction,
  'Berhasil mengubah data transaksi'
);

exports.deleteTransaction = factory.deleteOne(
  Transaction,
  'Berhasil menghapus data transaksi'
);
