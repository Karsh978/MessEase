const express = require('express');
const router = express.Router();
const Student = require('../models/Student');

// 1. Add Student
router.post('/add', async (req, res) => {
    try {
        const { name, phone, password,email, dailyRate } = req.body;
        const newStudent = new Student({ name, phone, password,email, dailyRate });
        
        console.log("Saving Student with Email:", email);
        await newStudent.save();
        res.status(201).json(newStudent);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 2. Get All Students
router.get('/all', async (req, res) => {
    try {
        const students = await Student.find();
        res.json(students);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 3. Pay Fees & Reset Cycle
router.post('/pay/:id', async (req, res) => {
    try {
        const student = await Student.findById(req.params.id);
        student.totalDue = 0; 
        student.lastPaymentDate = new Date(); 
        await student.save();
        res.json({ msg: "Payment recorded, cycle reset!" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;