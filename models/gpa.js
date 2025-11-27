const mongoose = require('mongoose');

const courseSchema = new mongoose.Schema({
  name: { type: String, required: true },
  creditHours: { type: Number, required: true },
  grade: {
    type: String,
    enum: ['A','A-','B+','B','B-','C+','C','C-','D+','D','D-','F'],
    required: true
  },
  major: { type: Boolean, default: false } 
});

const gpaSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  semester: { type: String, required: true }, 
  courses: [courseSchema],
  semesterGpa: { type: Number },
  majorGpa: { type: Number } 
}, { timestamps: true });

const Gpa = mongoose.model('Gpa', gpaSchema);
module.exports = Gpa;
