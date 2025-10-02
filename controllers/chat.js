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

module.exports = router;
