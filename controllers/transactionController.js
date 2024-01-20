const { v4: uuidv4 } = require('uuid');
// const midtransClient = require('midtrans-client');

const axios = require('axios');

const Package = require('../models/packageModel');
const User = require('../models/userModel');
const Transaction = require('../models/transactionModel');

const catchAsync = require('../utils/catchAsync');
const factory = require('./handleFactory');
const AppError = require('../utils/appError');

const getNextPaymentDate = (packageType) => {
  const convertDateFormat = (inputDateStr) => {
    // Parse the input date string
    const inputDate = new Date(inputDateStr);

    // Get the date and time components
    const year = inputDate.getUTCFullYear();
    const month = String(inputDate.getUTCMonth() + 1).padStart(2, '0'); // Add 1 to month since it's 0-based
    const day = String(inputDate.getUTCDate()).padStart(2, '0');
    const hours = String(inputDate.getUTCHours()).padStart(2, '0');
    const minutes = String(inputDate.getUTCMinutes()).padStart(2, '0');
    const seconds = String(inputDate.getUTCSeconds()).padStart(2, '0');

    // Construct the output date string in the desired format
    const outputDateStr = `${year}-${month}-${day} ${hours}:${minutes}:${seconds} +0700`;

    return outputDateStr;
  };

  const daysToAdd = packageType === 'Monthly' ? 30 : 365;
  return convertDateFormat(
    new Date(Date.now() + daysToAdd * 24 * 60 * 60 * 1000)
  );
};

const generatePayload = (packageType, existedPackage) => {
  const nextPayment = getNextPaymentDate(packageType);

  const timestamp = new Date(Date.now()).valueOf();

  return {
    id: uuidv4(),
    reference_id: `ref-${timestamp}`,
    customer_id: `cust-${uuidv4()}`,
    recurring_action: 'PAYMENT',
    recurring_cycle_count: 0,
    currency: 'IDR',
    amount: 13579,
    status: 'PENDING',
    created: new Date(),
    updated: new Date(),
    payment_methods: [
      {
        payment_method_id: `pm-${uuidv4()}`,
        rank: 1,
        type: 'EWALLET',
      },
    ],
    schedule_id: `resc-${timestamp}`,
    schedule: {
      reference_id: 'test_reference_id',
      interval: 'MONTH',
      interval_count: 1,
      created: new Date(),
      updated: new Date(),
      total_recurrence: 12,
      anchor_date: nextPayment,
      retry_interval: 'DAY',
      retry_interval_count: 5,
      total_retry: 5,
      failed_attempt_notifications: [2, 4],
    },
    immediate_action_type: 'FULL_AMOUNT',
    notification_config: {
      recurring_created: ['EMAIL'],
      recurring_succeeded: ['EMAIL'],
      recurring_failed: ['EMAIL'],
      locale: 'id',
    },
    failed_cycle_action: 'STOP',
    metadata: {
      meta_metadata: 'meta_meta_metadata',
    },
    description: 'Internet package subscription',
    items: [
      {
        type: 'PHYSICAL_PRODUCT',
        name: existedPackage.packageName,
        net_unit_amount: existedPackage.packagePrice,
        quantity: 1,
      },
    ],
    actions: [
      {
        action: 'AUTH',
        url: 'https://linking-dev.xendit.co/pali_e53e1ca6-3c09-4026-be2e-95ed3d4bb25b',
        url_type: 'WEB',
        method: 'GET',
      },
    ],
    success_return_url: 'https://www.xendit.co/successisthesumoffailures',
    failure_return_url: 'https://www.xendit.co/failureisthemotherofsuccess',
  };
};

const XENDIT_URL = process.env.XENDIT_BASE_URL;
const XENDIT_KEY_API = `${process.env.XENDIT_SECRET_API_KEY}:`;
const XENDIT_BASE64 = Buffer.from(XENDIT_KEY_API).toString('base64');

// const core = new midtransClient.CoreApi({
//   isProduction: false,
//   serverKey: process.env.MIDTRANS_SERVER_KEY,
//   clientKey: process.env.MIDTRANS_CLIENT_KEY,
// });

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

// xendit
exports.checkoutSubscription = catchAsync(async (req, res, next) => {
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

    const packageType = existedPackage.packageType;
    const payLoad = generatePayload(packageType, existedPackage);

    console.log(payLoad);

    const resp = await axios.post(`${XENDIT_URL}/recurring/plans`, payLoad, {
      headers: {
        'Content-Type': 'Application/JSON',
        Authorization: `Basic ${XENDIT_BASE64}`,
      },
    });

    console.log(resp);

    const newTransaction = new Transaction({
      transactionId: uuidv4(),
      package: existedPackage._id,
      user: user._id,
      payerEmail: user.emailAddress,
      amount: existedPackage.packagePrice,
      createdAt: new Date(),
      updatedAt: new Date(),
      response: resp,
      nextPaymentDate: getNextPaymentDate(packageType),
    });

    res.status(200).json({
      status: 0,
      msg: `Invoice created with ID: ${newTransaction.transactionId}`,
      data: newTransaction,
      response: resp,
    });
  } catch (err) {
    console.log(err, err.message);
  }
});

exports.cancelSubscription = catchAsync(async (req, res, next) => {
  const { id } = req.params;

  const resp = await axios.post(
    `${XENDIT_URL}/recurring/plans/${id}/deactivate`,
    {
      headers: {
        'Content-Type': 'Application/JSON',
        Authorization: `Basic ${XENDIT_BASE64}`,
      },
    }
  );

  console.log(resp);

  res.status(200).json({
    status: 0,
    msg: 'Berhasil membatalkan subscription internet',
    response: resp,
  });
});

// midtrans
// exports.checkoutSubscriptionMidtrans = catchAsync(async (req, res, next) => {
//   try {
//     const { packageId } = req.params;

//     // get user
//     const user = await User.findById(req.user.id);

//     if (!user) {
//       return next(new AppError('User not found', 404));
//     }

//     // get package
//     const existedPackage = await Package.findById(packageId);

//     if (!existedPackage) {
//       return next(new AppError('Package not found', 404));
//     }

//     if (existedPackage.packageType === 'Monthly') {
//       const nextPayment = convertDateFormat(
//         new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
//       );

//       const parameter = {
//         transaction_detail: {
//           order_id: uuidv4(),
//           gross_amount: existedPackage.packagePrice,
//         },
//         customer_details: {
//           first_name: user.firstName,
//           last_name: user.lastName,
//           email: user.emailAddress,
//           phone: user.nomorHP,
//         },
//         name: existedPackage.packageName,
//         amount: existedPackage.packagePrice,
//         currency: 'IDR',
//         payment_type: 'credit_card',
//         credit_card: {
//           secure: true,
//           save_card: true,
//         },
//         token: '521111gmWqMegyejqCQmmopnCFRs1117', // ambil dari get credit card
//         schedule: {
//           interval: 1,
//           interval_unit: 'month',
//           max_interval: 12,
//           start_time: nextPayment, // solution?
//         },
//       };

//       console.log(parameter);

//       core
//         .createSubscription(parameter)
//         .then((transaction) => {
//           // transaction token
//           const transactionToken = transaction.token;

//           console.log('transactionToken:', transactionToken);

//           const dataSubscription = JSON.stringify(transaction);

//           const newTransaction = new Transaction({
//             transactionId: uuidv4(),
//             package: existedPackage._id,
//             user: user._id,
//             payerEmail: user.emailAddress,
//             amount: existedPackage.packagePrice,
//             createdAt: new Date(),
//             updatedAt: new Date(),
//             paymentMethod: 'Midtrans',
//             responseMidtrans: dataSubscription,
//             nextPaymentDate: nextPayment,
//           });

//           newTransaction.save({ validateBeforeSave: false });

//           res.status(200).json({
//             status: 0,
//             msg: `Invoice created with ID: ${newTransaction.transactionId}`,
//             data: newTransaction,
//             transactionToken,
//           });
//         })
//         .catch((err) => {
//           console.log(err.message);
//         });
//     } else if (existedPackage.packageType === 'Yearly') {
//       const nextPayment = convertDateFormat(
//         new Date(Date.now() + 365 * 24 * 60 * 60 * 1000)
//       );

//       const parameter = {
//         transaction_detail: {
//           order_id: uuidv4(),
//           gross_amount: existedPackage.packagePrice,
//         },
//         customer_details: {
//           first_name: user.firstName,
//           last_name: user.lastName,
//           email: user.emailAddress,
//           phone: user.nomorHP,
//         },
//         name: existedPackage.packageName,
//         amount: existedPackage.packagePrice,
//         currency: 'IDR',
//         payment_type: 'credit_card',
//         credit_card: {
//           secure: true,
//           save_card: true,
//         },
//         token: '521111gmWqMegyejqCQmmopnCFRs1117', // ambil dari get credit card
//         schedule: {
//           interval: 1,
//           interval_unit: 'month',
//           max_interval: 12,
//           start_time: nextPayment, // solution?
//         },
//       };

//       console.log(parameter);

//       core
//         .createSubscription(parameter)
//         .then((transaction) => {
//           // transaction token
//           const transactionToken = transaction.token;

//           console.log('transactionToken:', transactionToken);

//           const dataSubscription = JSON.stringify(transaction);

//           const newTransaction = new Transaction({
//             transactionId: uuidv4(),
//             package: existedPackage._id,
//             user: user._id,
//             payerEmail: user.emailAddress,
//             amount: existedPackage.packagePrice,
//             createdAt: new Date(),
//             updatedAt: new Date(),
//             paymentMethod: 'Midtrans',
//             responseMidtrans: dataSubscription,
//             nextPaymentDate: nextPayment,
//           });

//           newTransaction.save({ validateBeforeSave: false });

//           res.status(200).json({
//             status: 0,
//             msg: `Invoice created with ID: ${newTransaction.transactionId}`,
//             data: newTransaction,
//             transactionToken,
//           });
//         })
//         .catch((err) => {
//           console.log(err.message);
//         });
//     }
//   } catch (err) {
//     console.log(err.message);
//   }
// });

// exports.cancelSubscriptionMidtrans = catchAsync(async (req, res, next) => {
//   try {
//     const { id } = req.params;

//     core.disableSubscription(id).then((response) => {
//       console.log('Response:', JSON.stringify(response));

//       const dataSubscription = {
//         response: JSON.stringify(response),
//       };

//       res.status(200).json({
//         status: 0,
//         msg: 'Berhasil membatalkan subscription',
//         dataSubscription,
//       });
//     });
//   } catch (err) {
//     console.log(err.message);
//   }
// });
