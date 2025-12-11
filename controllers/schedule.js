const express = require("express");
const Schedule = require("../models/schedule");
const router = express.Router();


function hasConflict(existing, newOne) {
  for (let day of newOne.days) {
    if (!existing.days.includes(day)) continue;
    const overlap = !(newOne.endTime <= existing.startTime || newOne.startTime >= existing.endTime);
    if (overlap) return true;
  }
  return false;
}


function getOwnerId(req) {
  return req.user?._id || null;
}

// Create a course
router.post("/", async (req, res) => {
  try {
    const owner = getOwnerId(req);
    if (!owner) return res.status(401).json({ error: "Not authenticated" });

    let schedule = await Schedule.findOne({ owner });
    if (!schedule) {
      schedule = new Schedule({ owner, courses: [] });
    }

  const newCourse = { ...req.body };

    for (let course of schedule.courses) {
      if (hasConflict(course, newCourse)) {
        return res.status(400).json({ error: "Time conflict" });
      }
    }

    schedule.courses.push(newCourse);
    await schedule.save();
    res.status(201).json(schedule);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// Get schedule 
router.get("/", async (req, res) => {
  try {
    const owner = getOwnerId(req);
    const schedule = await Schedule.findOne({ owner });
    res.json(schedule || { courses: [] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// update course
router.put("/:courseId", async (req, res) => {
  try {
    const owner = getOwnerId(req);
    const schedule = await Schedule.findOne({ owner });
    if (!schedule) return res.status(404).json({ error: "Schedule not found" });

    const course = schedule.courses.id(req.params.courseId);
    if (!course) return res.status(404).json({ error: "Course not found" });

 Object.assign(course, req.body);

    await schedule.save();
    res.json(schedule);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// delete a course
router.delete("/:courseId", async (req, res) => {
  try {
    const owner = getOwnerId(req);
    const schedule = await Schedule.findOne({ owner });
    if (!schedule) return res.status(404).json({ error: "Schedule not found" });

    schedule.courses = schedule.courses.filter(
      (c) => c._id.toString() !== req.params.courseId
    );

    await schedule.save();
    res.json(schedule);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
