class CustomerServiceUser {
  constructor(socket, onlineStatus = true) {
    this.socket = socket;
    this.username = 'Customer Service';
    this.onlineStatus = onlineStatus;
    this.isCustomerService = true;

    this.socket.on('newMessage', (data) => {
      // Respond to user messages
      this.respondToMessage(data.content);
    });
  }

  setOnlineStatus(status) {
    this.onlineStatus = status;
  }

  respondToMessage(message) {
    const hour =
      new Date().getHours() < 10
        ? `0${new Date().getHours()}`
        : `${new Date().getHours()}`;
    const mins =
      new Date().getMinutes() < 10
        ? `0${new Date().getMinutes()}`
        : `${new Date().getMinutes()}`;

    // Implement your bot's logic to generate responses here
    let response = '';

    if (message === 'Selamat pagi' || message === 'selamat pagi') {
      response = 'Selamat datang di Customer Service Groovy';
    } else if (
      message === 'Saya minta bantuan' ||
      message === 'Saya minta bantuan'
    ) {
      response = 'Apakah saya bisa membantu, kak?';
    } else if (message === 'Internetku mengalami masalah') {
      response = `Baiklah, mohon isi formulir untuk melakukan proses pemeriksaan internetmu:
      Nama lengkap:
      Nomor telepon:
      Alamat e-mail:
      Alamat:
      Paket yang dibeli:`;
    } else {
      response = 'Maaf, saya tidak mengerti apa yang kamu minta bantuan, kak.';
    }

    // Send the response back to the user
    this.socket.emit('newMessage', {
      time: `${hour}:${mins}`,
      content: response,
      isCustomerService: true,
    });
  }
}

module.exports = CustomerServiceUser;
