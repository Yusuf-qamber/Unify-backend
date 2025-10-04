const express = require("express");
const router = express.Router();
const Message = require("../models/message");
const verifyToken = require("../middleware/verify-token");

// get college chat history (protected)
router.get("/college/:college", verifyToken, async (req, res) => {
  try {
    const messages = await Message.find({ college: req.params.college })
      .populate("sender", "username picture") // include username and picture
      .sort({ createdAt: 1 });
    res.json(messages);
  } catch (err) {
    res.status(500).json({ err: err.message });
  }
});


// GET /chat/conversations
router.get("/conversations", verifyToken, async (req, res) => {
  try {
    const userId = req.user._id;

    // Find all distinct users this person has chatted with
    const messages = await Message.find({
      $or: [{ sender: userId }, { receiver: userId }],
    })
      .populate("sender", "username picture")
      .populate("receiver", "username picture")
      .sort({ createdAt: -1 });

    
    const conversations = {};
    messages.forEach((msg) => {
      const otherUser =
        msg.sender._id.toString() === userId.toString()
          ? msg.receiver
          : msg.sender;

      if (!otherUser) return; // skip if it's a college message

      if (!conversations[otherUser._id]) {
        conversations[otherUser._id] = {
          user: otherUser,
          lastMessage: msg.content,
          lastMessageAt: msg.createdAt,
        };
      }
    });

    res.json(Object.values(conversations));
  } catch (err) {
    res.status(500).json({ err: err.message });
  }
});

// GET /chat/private/:userId
router.get("/private/:userId", verifyToken, async (req, res) => {
  try {
    const userId = req.user._id;
    const otherUserId = req.params.userId;

    const messages = await Message.find({
      $or: [
        { sender: userId, receiver: otherUserId },
        { sender: otherUserId, receiver: userId },
      ],
    })
      .populate("sender", "username picture")
      .populate("receiver", "username picture")
      .sort({ createdAt: 1 });

    res.json(messages);
  } catch (err) {
    res.status(500).json({ err: err.message });
  }
});

// POST /chat/private/:userId
router.post("/private/:userId", verifyToken, async (req, res) => {
  try {
    const sender = req.user._id;
    const receiver = req.params.userId;
    const { content } = req.body;

    const msg = await Message.create({ sender, receiver, content });
    const populatedMsg = await msg.populate("sender", "username picture");

    res.json(populatedMsg);
  } catch (err) {
    res.status(500).json({ err: err.message });
  }
});

// // search users by username
router.get("/search/:query", verifyToken, async (req, res) => {
  try {
    const regex = new RegExp(req.params.query, "i"); 
    const User = require("../models/user");
    const users = await User.find({ username: regex }).select("username picture");
    res.json(users);
  } catch (err) {
    res.status(500).json({ err: err.message });
  }
});

// DELETE /chat/conversation/:userId
router.delete("/conversation/:userId", verifyToken, async (req, res) => {
  try {
    const userId = req.user._id;
    const otherUserId = req.params.userId;

    await Message.deleteMany({
      $or: [
        { sender: userId, receiver: otherUserId },
        { sender: otherUserId, receiver: userId },
      ],
    });

    res.json({ success: true, message: "Conversation deleted" });
  } catch (err) {
    res.status(500).json({ err: err.message });
  }
});

module.exports = router;
