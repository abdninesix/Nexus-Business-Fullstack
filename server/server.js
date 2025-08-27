import express from 'express';
import connectDB from './config/db.js';
import authRoutes from './routes/authRoutes.js';
import uploadRoutes from './routes/uploadRoutes.js';
import meetingRoutes from './routes/meetingRoutes.js';
import documentRoutes from './routes/documentRoutes.js';
import transactionRoutes from './routes/transactionRoutes.js';
import userRoutes from './routes/userRoutes.js'
import messageRoutes from './routes/messageRoutes.js';
import cors from 'cors';
import { createServer } from 'http';
import { Server } from 'socket.io';

connectDB();

const app = express();
app.use(cors());
app.use(express.json());

// --- SOCKET.IO INTEGRATION ---
const httpServer = createServer(app); // Wrap the Express app
const io = new Server(httpServer, {
  cors: {
    // origin: "http://localhost:5173",
    origin: "https://nexus-by-abdullah.vercel.app/",
    methods: ["GET", "POST"],
  },
});

// We need a way to track which user is connected to which socket
let onlineUsers = new Map();

const addUser = (userId, socketId) => {
  !onlineUsers.has(userId) && onlineUsers.set(userId, socketId);
};

const removeUser = (socketId) => {
  for (let [key, value] of onlineUsers.entries()) {
    if (value === socketId) {
      onlineUsers.delete(key);
      break;
    }
  }
};

const getUserSocketId = (userId) => {
  return onlineUsers.get(userId);
};

io.on("connection", (socket) => {
  console.log(`A user connected: ${socket.id}`);

  let currentRoom = null;

  // Client identifies itself by sending its userId
  socket.on("addNewUser", (userId) => {
    addUser(userId, socket.id);
    console.log("Online users:", Array.from(onlineUsers.keys()));
  });

  // --- NEW WEBRTC SIGNALING LOGIC ---

  // A user wants to join a specific meeting room
  socket.on("join-room", (roomId) => {
    socket.join(roomId);
    currentRoom = roomId;
    // Notify others in the room that a new user has joined.
    socket.to(roomId).emit("user-joined");
  });

  // Broadcast offer to everyone else in the room
  socket.on("offer", (payload) => {
    socket.to(payload.roomId).emit("offer", { sdp: payload.sdp });
  });

  // Broadcast answer to everyone else in the room
  socket.on("answer", (payload) => {
    socket.to(payload.roomId).emit("answer", { sdp: payload.sdp });
  });

  // Broadcast ICE candidate to everyone else in the room
  socket.on("ice-candidate", (payload) => {
    socket.to(payload.roomId).emit("ice-candidate", { candidate: payload.candidate });
  });

  // --- END OF WEBRTC SIGNALING ---

  socket.on("disconnect", () => {
    removeUser(socket.id);
    console.log(`A user disconnected: ${socket.id}`);
    console.log("Online users:", Array.from(onlineUsers.keys()));
  });
});
// --- END OF SOCKET.IO INTEGRATION ---

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/meetings', meetingRoutes);
app.use('/api/documents', documentRoutes);
app.use('/api/transactions', transactionRoutes);
app.use('/api/users', userRoutes);
app.use('/api/messages', messageRoutes);

app.get('/', (req, res) => {
  res.send('Nexus API is running...');
});

const PORT = process.env.PORT || 3000;
httpServer.listen(PORT, () => console.log(`Server running on port ${PORT}`));

export { io, getUserSocketId };