/**
 * Online Polling System - Main Server File
 * Demonstrates: HTTP module, Express, Socket.IO, Middleware
 */

require('dotenv').config();
const http = require('http');
const express = require('express');
const socketIo = require('socket.io');
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const session = require('express-session');
const cors = require('cors');
const path = require('path');

// Local modules
const connectDB = require('./config/database');
const pollRoutes = require('./routes/polls');
const pollManager = require('./utils/pollManager');
const eventEmitter = require('./utils/eventEmitter');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: "http://localhost:3000",
    methods: ["GET", "POST"]
  }
});

const PORT = process.env.PORT || 5000;

// Connect to MongoDB
connectDB();

// Middleware setup
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cookieParser());

// Session middleware
app.use(session({
  secret: 'polling-system-secret-key',
  resave: false,
  saveUninitialized: false,
  cookie: { 
    secure: false,
    maxAge: 24 * 60 * 60 * 1000 // 24 hours
  }
}));

// Custom middleware - app.use() demonstration
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  next();
});

// app.all() demonstration - catch all routes for logging
app.all('*', (req, res, next) => {
  req.timestamp = new Date().toISOString();
  next();
});

// Routes
app.use('/api/polls', pollRoutes);
// Pass Socket.IO instance to routes for real-time updates
pollRoutes.setSocketIO(io);

// Serve static files from React app
app.use(express.static(path.join(__dirname, '../client/build')));

// Socket.IO connection handling
io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);

  // Join poll room for real-time updates
  socket.on('join-poll', (pollId) => {
    socket.join(`poll-${pollId}`);
    console.log(`Socket ${socket.id} joined poll ${pollId}`);
  });

  // Note: Vote submission is now handled via HTTP route for reliability
  // Socket.IO is only used for real-time updates broadcasting

  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });
});

// EventEmitter demonstration - listen for poll events
eventEmitter.on('poll-created', (poll) => {
  console.log(`Poll created: ${poll.id} - ${poll.title}`);
  io.emit('new-poll', poll);
});

eventEmitter.on('poll-deleted', (pollId) => {
  console.log(`Poll deleted: ${pollId}`);
  io.emit('poll-deleted', pollId);
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'OK', message: 'Server is running' });
});

// Catch all handler for React app
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../client/build/index.html'));
});

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
});

module.exports = { app, server, io };

