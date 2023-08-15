const mongoose = require('mongoose');
const dotenv = require('dotenv');
const http = require('http');
const socketIo = require('socket.io');

process.on('uncaughtException', (err) => {
  console.log('Uncaught exception! Shutting down...');
  console.log(err.name, err.message);

  process.exit(1);
});

// menggunakan dotenv config
dotenv.config({ path: './config.env' });

// menggunakan app.js
const app = require('./app');

const server = http.createServer(app);
const io = socketIo(server);

// menyambungkan ke mongoose
const DB = process.env.DATABASE.replace(
  '<password>',
  process.env.DATABASE_PASSWORD
);

mongoose.set('strictQuery', false);

mongoose
  .connect(DB, {
    useNewURLParser: true,
    useUnifiedTopology: true,
  })
  .then(() => {
    console.log('DB connection established');
  })
  .catch((err) => {
    throw err;
  });

let messages = [];

io.on('connection', (socket) => {
  console.log(`${socket.id} has connected.`);

  // chat message
  socket.on('newMessage', ({ user, time, content }) => {
    messages.unshift({ user, time, content });

    io.emit('newMessage', messages);
    console.log(messages);
  });

  // an user is disconnected
  socket.on('disconnect', () => {
    console.log('user disconnected');
  });
});

// server
const port = process.env.PORT || 5000;
server.listen(port, () => {
  console.log(`The server is listening on ${port}`);
});

// handle unexpection
process.on('unhandledRejection', (err) => {
  console.log('UNHANDLED EXCEPTION! Shutting down...');
  console.log(err.name, err.message);
  server.close(() => {
    process.exit(1);
  });
});

// sigterm unexpection
process.on('SIGTERM', () => {
  console.log('SIGTERM RECEIVED. Shutting down..');
  server.close(() => {
    console.log('Process terminated. 💀');
  });
});
