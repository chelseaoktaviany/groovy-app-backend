const nodemailer = require('nodemailer');
const pug = require('pug');
const htmlToText = require('html-to-text');

module.exports = class Email {
  constructor(user, url) {
    this.to = user.emailAddress;
    this.firstName = user.firstName;
    this.otp = user.otp;
    this.voucherCode = user.voucherCode;
    this.url = url;
    this.from = `admin <${process.env.EMAIL_FROM}>`;
  }

  newTransport() {
    // prod
    if (process.env.NODE_ENV === 'production') {
      return nodemailer.createTransport({
        // sendinblue
        service: 'SendinBlue',
        auth: {
          user: process.env.SENDINBLUE_USERNAME,
          pass: process.env.SENDINBLUE_PASSWORD,
        },
      });
    }

    // dev
    return nodemailer.createTransport({
      host: process.env.EMAIL_HOST,
      port: process.env.EMAIL_PORT,
      secure: false,
      logger: true,
      auth: {
        user: process.env.EMAIL_USERNAME,
        pass: process.env.EMAIL_PASSWORD,
      },
    });
  }

  async send(template, subject) {
    // mengirim e-mail yang asli
    // 1) render HTML berdasarkan sebuah pug template
    const html = pug.renderFile(`${__dirname}/../views/email/${template}.pug`, {
      firstName: this.firstName,
      url: this.url,
      otp: this.otp,
      voucherCode: this.voucherCode,
      subject,
    });

    // 2) mendefinisikan opsi email
    const mailOptions = {
      from: this.from,
      to: this.to,
      subject,
      html,
      text: htmlToText.fromString(html),
    };

    // 3) membuat transport dan mengirim e-mail
    await this.newTransport().sendMail(mailOptions);
  }

  // untuk admin
  async sendWelcome() {
    await this.send('welcome', 'Welcome to the admin dashboard in Groovy App!');
  }

  // untuk otp
  async sendOTPEmail() {
    await this.send(
      'sendOTP',
      'Verifikasi OTP Anda (Hanya berlaku selama 5 menit)'
    );
  }

  // untuk kode voucher
  async sendVoucherCode() {
    await this.send('sendVoucherCode', 'Kode Voucher Anda');
  }
};
