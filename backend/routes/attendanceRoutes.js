const express = require('express');
const router = express.Router();
const Attendance = require('../models/Attendance');
const Student = require('../models/Student');


// 1. Get Attendance Status for a specific date
router.get('/status/:date', async (req, res) => {
    try {
        const records = await Attendance.find({ date: req.params.date });
        res.json(records);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 2. Toggle Meal (Breakfast, Lunch, Dinner) - FIXED LOGIC
router.post('/toggle-meal', async (req, res) => {
    const { studentId, date, mealType } = req.body; 
    const rates = { breakfast: 25, lunch: 50, dinner: 50 };

    try {
        let record = await Attendance.findOne({ studentId, date });
        if (!record) record = new Attendance({ studentId, date });

        const student = await Student.findById(studentId);
        if (!student) return res.status(404).json({ msg: "Student not found" });

        if (record[mealType]) {
            // Attendance hatayi ja rahi hai (Uncheck)
            record[mealType] = false;
            
            // FIX: Math.max(0, ...) ensures bill never goes below zero
            student.totalDue = Math.max(0, student.totalDue - rates[mealType]);
        } else {
            // Attendance lagayi ja rahi hai (Check)
            record[mealType] = true;
            student.totalDue += rates[mealType];
        }

        await record.save();
        await student.save();
        res.json({ msg: "Updated", record, totalDue: student.totalDue });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 3. Mark Full Attendance (Purana feature)
router.post('/mark', async (req, res) => {
    const { studentId, date, status } = req.body;
    try {
        const existing = await Attendance.findOne({ studentId, date });
        if (existing) return res.status(400).json({ msg: "Already marked!" });

        const newAttendance = new Attendance({ studentId, date, status });
        await newAttendance.save();

        if (status === 'Present') {
            const student = await Student.findById(studentId);
            // Safety check yahan bhi add kar sakte hain dailyRate ke liye
            student.totalDue += student.dailyRate;
            await student.save();
        }
        res.json({ msg: "Attendance updated!" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;