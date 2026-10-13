const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: '*' } });

const PORT = process.env.PORT || 3000;

app.use(express.static(path.join(__dirname, 'public')));

const messages = [];
const onlineUsers = new Map();

io.on('connection', (socket) => {
  console.log(`[KAYLA] User connected: ${socket.id}`);

  socket.on('login', (username) => {
    const user = username.toLowerCase().trim();
    if (user === 'kayla' || user === 'yobby') {
      onlineUsers.set(socket.id, user);
      socket.join('chat-room');
      socket.emit('messages', messages);
      socket.to('chat-room').emit('partner-online', user);
      console.log(`[KAYLA] ${user} logged in`);
    } else {
      socket.emit('auth-error', 'Invalid username. Use Kayla or Yobby.');
    }
  });

  socket.on('send-message', (data) => {
    const msg = {
      id: Date.now().toString(),
      text: data.text,
      sender: data.sender,
      time: data.time || new Date().toISOString(),
    };
    messages.push(msg);
    if (messages.length > 500) messages.shift();
    io.to('chat-room').emit('new-message', msg);
    console.log(`[KAYLA] ${data.sender}: ${data.text.slice(0, 50)}`);
  });

  socket.on('typing', (data) => {
    socket.to('chat-room').emit('partner-typing', data);
  });

  socket.on('disconnect', () => {
    const user = onlineUsers.get(socket.id);
    if (user) {
      onlineUsers.delete(socket.id);
      socket.to('chat-room').emit('partner-offline', user);
      console.log(`[KAYLA] ${user} disconnected`);
    }
  });
});

server.listen(PORT, () => {
  console.log(`[KAYLA] Server running on port ${PORT}`);
});
