const express = require('express');
const app = express();
const http = require('http');
const server = http.createServer(app);
const { Server } = require('socket.io');
const io = new Server(server);

const port = 5002;

let messages = [];

io.on('connection', (socket) => {
  console.log(`An user ${socket.id} is connected :D`);

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

server.listen(port, () => console.log(`Server is running on port: ${port}`));
