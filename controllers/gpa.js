const express = require('express');
const verifyToken = require('../middleware/verify-token.js');
const Gpa = require('../models/gpa.js');

const router = express.Router();
router.use(verifyToken);

const gradePoints = {
  "A": 4.0, "A-": 3.67, "B+": 3.33, "B": 3.0, "B-": 2.67,
  "C+": 2.33, "C": 2.0, "C-": 1.67, "D+": 1.33, "D": 1.0,
  "D-": 0.67, "F": 0
};

// Get all GPA entries
router.get('/', async (req, res) => {
  try {
    const gpas = await Gpa.find({ user: req.user._id });
    res.status(200).json(gpas);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get single GPA entry
router.get('/:gpaId', async (req, res) => {
  try {
    const gpa = await Gpa.findById(req.params.gpaId);
    if (!gpa) return res.status(404).json({ error: 'GPA entry not found' });
    if (!gpa.user.equals(req.user._id)) return res.status(403).json({ error: 'Not authorized' });
    res.status(200).json(gpa);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Create GPA entry
router.post('/', async (req, res) => {
  try {
    const { semester, courses } = req.body;

    let totalPoints = 0, totalHours = 0;
    let majorPoints = 0, majorHours = 0;

    courses.forEach(c => {
      const points = gradePoints[c.grade] * c.creditHours;
      totalPoints += points;
      totalHours += c.creditHours;

      if (c.major) {
        majorPoints += points;
        majorHours += c.creditHours;
      }
    });

    const semesterGpa = totalHours > 0 ? totalPoints / totalHours : 0;
    const majorGpa = majorHours > 0 ? majorPoints / majorHours : 0;

    const gpa = await Gpa.create({
      user: req.user._id,
      semester,
      courses,
      semesterGpa,
      majorGpa
    });

    res.status(201).json(gpa);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update GPA entry
router.put('/:gpaId', async (req, res) => {
  try {
    const gpa = await Gpa.findById(req.params.gpaId);
    if (!gpa) return res.status(404).json({ error: 'GPA entry not found' });
    if (!gpa.user.equals(req.user._id)) return res.status(403).json({ error: 'Not authorized' });

    const { semester, courses } = req.body;

    let totalPoints = 0, totalHours = 0;
    let majorPoints = 0, majorHours = 0;

    courses.forEach(c => {
      const points = gradePoints[c.grade] * c.creditHours;
      totalPoints += points;
      totalHours += c.creditHours;

      if (c.major) {
        majorPoints += points;
        majorHours += c.creditHours;
      }
    });

    const semesterGpa = totalHours > 0 ? totalPoints / totalHours : 0;
    const majorGpa = majorHours > 0 ? majorPoints / majorHours : 0;

    const updated = await Gpa.findByIdAndUpdate(
      req.params.gpaId,
      { semester, courses, semesterGpa, majorGpa },
      { new: true }
    );

    res.status(200).json(updated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Delete GPA entry
router.delete('/:gpaId', async (req, res) => {
  try {
    const gpa = await Gpa.findById(req.params.gpaId);
    if (!gpa) return res.status(404).json({ error: 'GPA entry not found' });
    if (!gpa.user.equals(req.user._id)) return res.status(403).json({ error: 'Not authorized' });

    await Gpa.findByIdAndDelete(req.params.gpaId);
    res.status(200).json({ message: 'GPA entry deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
