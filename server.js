const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const fs = require('fs');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

const users = {};
const messages = [];
let messageId = 1;

app.use(express.static('public'));

io.on('connection', (socket) => {
  console.log('A user connected');

  // Listen for new messages with attachments
  socket.on('chat message', (data) => {
    const { username, message, image } = data;
    const userMessage = {
      id: messageId++,
      username,
      message,
      image,
    };
    messages.push(userMessage);
    io.emit('chat message', userMessage);
  });

  // Listen for new user
  socket.on('new user', (username) => {
    users[socket.id] = username;
    io.emit('user joined', username);
  });

  // Listen for file uploads
  socket.on('file upload', (data) => {
    const { file, fileName, username } = data;
    const filePath = `uploads/${fileName}`;

 


    // Save the file to the server
    fs.writeFileSync(filePath, Buffer.from(file, 'base64'));

    // Notify clients about the uploaded file
    io.emit('file uploaded', { username, filePath });
  });

  // Listen for disconnection
  socket.on('disconnect', () => {
    const username = users[socket.id];
    io.emit('user left', username);
    delete users[socket.id];
    console.log('A user disconnected');
  });
});

const PORT = process.env.PORT || 3000;

server.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});
