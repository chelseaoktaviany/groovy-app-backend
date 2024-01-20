exports.generateVoucherCode = (codeLength) => {
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let voucherCode = '';

  for (let i = 0; i < codeLength; i++) {
    const randomIndex = Math.floor(Math.random() * characters.length);
    voucherCode += characters[randomIndex];
  }

  return voucherCode;
};
