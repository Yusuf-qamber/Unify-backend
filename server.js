require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const logger = require("morgan");
const app = express();
const { OAuth2Client } = require('google-auth-library');
const cookieParser = require('cookie-parser');
const client = new OAuth2Client();
const path = require("path");

// controllers
const testJwtRouter = require("./controllers/test-jwt");
const authRouter = require("./controllers/auth");
const userRouter = require("./controllers/users");
const notesRouter = require('./controllers/notes.js');
const eventsRouter = require('./controllers/events.js');
const scheduleRouter = require("./controllers/schedule");
const assignmentsRouter = require("./controllers/assignments.js");
const gpaRouter = require("./controllers/gpa.js");
const profileRouter = require("./controllers/profile");
const verifyToken = require("./middleware/verify-token");
const chatRouter = require("./controllers/chat"); // REST API for messages

// connect DB
mongoose.connect(process.env.MONGODB_URI);
mongoose.connection.on("connected", () => {
  console.log(`Connected to MongoDB ${mongoose.connection.name}.`);
});

// middleware
app.use(cors());
app.use(cookieParser());
app.use(express.json());
app.use(logger("dev"));
app.use("/assets", express.static(path.join(__dirname, "assets")));

// public routes
app.use("/auth", authRouter);
app.use("/test-jwt", testJwtRouter);
app.use('/:college/notes', notesRouter);
app.use('/:college/events', eventsRouter);

// protected routes
app.use(verifyToken);
app.use("/users", userRouter);
app.use("/schedule", scheduleRouter);
app.use("/assignments", assignmentsRouter);
app.use("/gpa", gpaRouter);
app.use("/profile", profileRouter);
app.use("/chat", chatRouter);

// ================= SOCKET.IO =================
const http = require("http");
const { Server } = require("socket.io");

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: process.env.CLIENT_ORIGINS || "*",
    methods: ["GET", "POST"],
    credentials: true,
  },
});

// college rooms + messages
io.on("connection", (socket) => {
  console.log("🔌 Socket connected:", socket.id);

  // join college room
  socket.on("joinCollege", (college) => {
    socket.join(college);
    console.log(`✅ User joined college room: ${college}`);
  });

  // send message in college room
  socket.on("sendCollegeMessage", async ({ sender, college, content }) => {
  try {
    const Message = require("./models/message");
    
    // save message
    const msg = await Message.create({ sender, college, content });

    // 🔹 populate sender info before emitting
    const populatedMsg = await msg.populate("sender", "username picture");

    io.to(college).emit("receiveCollegeMessage", populatedMsg);
  } catch (err) {
    console.error(err);
  }
});

  // disconnect
  socket.on("disconnect", () => {
    console.log("❌ Socket disconnected:", socket.id);
  });
});
// ============================================

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`API & Socket.IO running on :${PORT}`));
