const express = require('express');
const http = require('http');
const cors = require('cors');
const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');
require('dotenv').config();

const authRoutes = require('./routes/auth');
const messageRoutes = require('./routes/messages');
const pool = require('./db');

const app = express();
const server = http.createServer(app);

app.use(cors());
app.use(express.json());
app.use('/api/auth', authRoutes);
app.use('/api/messages', messageRoutes);

// --- Socket.IO with JWT authentication ---
const io = new Server(server, {
  cors: {
    origin: "*", // For local dev. Use your frontend URL in production!
    methods: ["GET", "POST"]
  }
});

// JWT Auth for Socket.IO connections
io.use((socket, next) => {
  const token = socket.handshake.auth.token;
  if (!token) {
    return next(new Error("Authentication error: Token required"));
  }
  try {
    const user = jwt.verify(token, process.env.JWT_SECRET);
    socket.user = user; // Attach user info
    next();
  } catch (err) {
    next(new Error("Authentication error: Invalid token"));
  }
});

io.on('connection', (socket) => {
  const username = socket.user.username;
  console.log(`User connected: ${username} (${socket.id})`);
  socket.join(username);

  socket.on('join', (name) => {
    socket.join(name); // Optional, for completeness
    console.log(`${name} joined their room`);
  });

  // Real-time message handler
  socket.on('send_message', async (data) => {
    const { recipient, content } = data;
    if (!recipient || !content) return;
    try {
      await pool.query(
        'INSERT INTO messages (sender, recipient, content) VALUES ($1, $2, $3)',
        [username, recipient, content]
      );
      // Send to recipient (if online) and to sender
      const messageObj = {
        sender: username,
        recipient,
        content,
        created_at: new Date()
      };
      io.to(recipient).emit('receive_message', messageObj);
      io.to(username).emit('receive_message', messageObj);
    } catch (err) {
      console.error("Error inserting message:", err.message);
    }
  });

  socket.on('disconnect', () => {
    console.log(`User disconnected: ${username} (${socket.id})`);
  });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
