const express = require("express");
const router = express.Router();
const Message = require("../models/message");
const verifyToken = require("../middleware/verify-token");

// get college chat history
router.get("/college/:college", verifyToken, async (req, res) => {
  try {
    const messages = await Message.find({ college: req.params.college })
      .populate("sender", "username picture") 
      .sort({ createdAt: 1 });
    res.json(messages);
  } catch (err) {
    
    res.status(500).json({ err: err.message });
  }
});

// ---------------------------------------Private chat---------------------------------------------

// get the lists of chats
router.get("/conversations", verifyToken, async (req, res) => {
  try {
    const userId = req.user._id;

    
    const messages = await Message.find({
      $or: [{ sender: userId }, { receiver: userId }],
      receiver: { $ne: null }, 
    })
      .populate("sender", "username picture")
      .populate("receiver", "username picture")
      .sort({ createdAt: -1 });

    const conversations = {};

    messages.forEach((msg) => {
      
      if (!msg.sender || !msg.receiver) return;

      
      const otherUser =
        msg.sender._id.toString() === userId.toString()
          ? msg.receiver
          : msg.sender;

      
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


//  get chat history between two users
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

// sned a new message to another user
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

// search users by username
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

// delete conversation between two users
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
