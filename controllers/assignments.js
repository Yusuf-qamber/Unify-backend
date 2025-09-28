const express = require("express");
const verifyToken = require("../middleware/verify-token.js");
const Assignment = require("../models/assignment.js");

const router = express.Router();

// ---------- Protected routes ----------
router.use(verifyToken);

// Get all assignments for logged-in user
router.get("/", async (req, res) => {
  try {
    const assignments = await Assignment.find({ user: req.user._id })
      .populate("user", "name email"); // optional: limit fields
    res.status(200).json(assignments);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get single assignment
router.get("/:assignmentId", async (req, res) => {
  try {
    const assignment = await Assignment.findById(req.params.assignmentId)
      .populate("user", "name email");
    if (!assignment)
      return res.status(404).json({ error: "Assignment not found" });

    // Ensure the assignment belongs to the user
    if (!assignment.user._id.equals(req.user._id))
      return res.status(403).json({ error: "Not authorized" });

    res.status(200).json(assignment);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Create new assignment
router.post("/", async (req, res) => {
  try {
    const assignment = await Assignment.create({
      ...req.body,
      user: req.user._id
    });
    res.status(201).json(assignment);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update assignment
router.put("/:assignmentId", async (req, res) => {
  try {
    const assignment = await Assignment.findById(req.params.assignmentId);
    if (!assignment)
      return res.status(404).json({ error: "Assignment not found" });

    if (!assignment.user.equals(req.user._id))
      return res.status(403).json({ error: "Not authorized" });

    const updated = await Assignment.findByIdAndUpdate(
      req.params.assignmentId,
      req.body,
      { new: true }
    );
    res.status(200).json(updated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Delete assignment
router.delete("/:assignmentId", async (req, res) => {
  try {
    const assignment = await Assignment.findById(req.params.assignmentId);
    if (!assignment)
      return res.status(404).json({ error: "Assignment not found" });

    if (!assignment.user.equals(req.user._id))
      return res.status(403).json({ error: "Not authorized" });

    await Assignment.findByIdAndDelete(req.params.assignmentId);
    res.status(200).json({ message: "Assignment deleted" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
