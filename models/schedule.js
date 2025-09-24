const mongoose = require('mongoose')

const courseSchema = new mongoose.Schema({
  courseCode: { type: String, required: true },
  section: { type: String, required: true },
  days: [{ 
    type: String, 
    enum: ["U", "M", "T", "W", "H"], // Sunday–Thursday
    required: true 
  }],
  startTime: { type: String, required: true },
  endTime: { type: String, required: true },
  place: { type: String, required: true },
  examDate: { type: String, required: true },
  examTime: { type: String, required: true },
})

const scheduleSchema = new mongoose.Schema({
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  courses: [courseSchema],
}, { timestamps: true })

const Schedule = mongoose.model("Schedule", scheduleSchema)
module.exports = Schedule
