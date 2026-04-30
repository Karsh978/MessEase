const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const cron = require('node-cron');

// 1. Sabse pehle Config aur App shuru karein
dotenv.config();
const app = express();

mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log("Didi's Mess Database Connected! ✅"))
    .catch((err) => console.log("DB Connection Error: ", err));

// 3. Environment Variables
const ADMIN_PIN = process.env.ADMIN_PIN;

// 2. Middleware 
app.use(cors());
app.use(express.json({ limit: '1mb' })); 
app.use(express.urlencoded({ limit: '1mb', extended: true }));

// 5. Authentication Middleware
const authAdmin = (req, res, next) => {
    const pin = req.headers['admin-pin'];
    if (pin === ADMIN_PIN) { 
        next(); 
    } else {
        res.status(401).json({ msg: "Unauthorized! Ghalat PIN." });
    }
};

// 3. Models Import
const Student = require('./models/Student');
const Attendance = require('./models/Attendance');
const Menu = require('./models/Menu');

// 4. Routes Import
const studentRoutes = require('./routes/studentRoutes');
const attendanceRoutes = require('./routes/attendanceRoutes');
const expenseRoutes = require('./routes/expenseRoutes');
const menuRoutes = require('./routes/menuRoutes');
const sendMail = require('./utils/emailSender');

// 5. Routes Link karein
app.use('/api/students', studentRoutes);
app.use('/api/attendance', authAdmin, attendanceRoutes); 
app.use('/api/expenses', authAdmin, expenseRoutes);    
app.use('/api/menu/update', authAdmin);                

// ============================================================
// --- DIRECT ROUTES (Special Logic) ---
// ============================================================

// [NAYA FEATURE] - DIRECT PORTAL ACCESS BINA PASSWORD KE
// server.js mein ye add karein:
app.get('/api/students/portal-direct/:id', async (req, res) => {
    try {
        const student = await Student.findById(req.params.id);
        if (!student) {
            return res.status(404).json({ msg: "Student nahi mila!" });
        }
        // Attendance fetch karein
        const attendance = await Attendance.find({ studentId: student._id }).sort({ date: -1 });
        res.json({ student, attendance });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 1. STUDENT PORTAL LOGIN (Purana Password wala logic)
app.post('/api/students/portal-login', async (req, res) => {
    try {
        const phone = String(req.body.phone);
        const password = String(req.body.password);
        
        const student = await Student.findOne({ phone, password });
        if (!student) {
            return res.status(401).json({ msg: "Ghalat Number ya Password!" });
        }

        const attendance = await Attendance.find({ studentId: student._id }).sort({ date: -1 });
        res.json({ student, attendance });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 2. 3-MEAL ATTENDANCE TOGGLE
app.post('/api/attendance/toggle-meal', async (req, res) => {
    try {
        const { studentId, date, mealType } = req.body;
        const rates = { breakfast: 25, lunch: 50, dinner: 50 };

        if (!studentId || !date || !mealType) {
            return res.status(400).json({ msg: "Missing data" });
        }

        let record = await Attendance.findOne({ studentId, date });
        if (!record) record = new Attendance({ studentId, date });

        const student = await Student.findById(studentId);
        if (!student) return res.status(404).json({ msg: "Student not found" });

        if (record[mealType]) {
            record[mealType] = false;
            student.totalDue = Math.max(0, (student.totalDue || 0) - rates[mealType]);
        } else {
            record[mealType] = true;
            student.totalDue = (student.totalDue || 0) + rates[mealType];
        }

        await record.save();
        await student.save();
        res.json({ msg: "Success", record, totalDue: student.totalDue });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 3. ATTENDANCE STATUS CHECK
app.get('/api/attendance/status/:date', async (req, res) => {
    try {
        const records = await Attendance.find({ date: req.params.date });
        res.json(records);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Email sender
app.post('/api/students/send-email-reminder', async (req, res) => {
    try {
        const { email, name, amount } = req.body;
        if (!email) return res.status(400).json({ msg: "Email missing!" });

        const subject = `Payment Reminder: Didi's Mess`;
        const text = `Namaste ${name},\n\nAapka mess bill ₹${amount} due hai. Kripya samay par bhugtan karein.\n\nShukriya!\nDidi's Mess Management`;

        await sendMail(email, subject, text);
        res.json({ msg: "Email sent successfully!" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 4. PAYMENT ALERTS LOGIC (27 Din wala logic same hai)
app.get('/api/students/alerts', async (req, res) => {
    try {
        const allStudents = await Student.find({});
        const today = new Date();

        const alerts = allStudents.map(s => {
            const startDate = s.lastPaymentDate || s.joiningDate || today;
            const diffTime = today - new Date(startDate);
            const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24)); 
            
            return {
                _id: s._id,
                name: s.name,
                phone: s.phone,
                email: s.email,
                totalDue: s.totalDue,
                daysPassed: diffDays || 0
            };
        }).filter(s => s.daysPassed >= 27); 

        res.json(alerts);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// BILL SUMMARY FOR PDF
app.get('/api/students/bill-summary/:id', async (req, res) => {
    try {
        const records = await Attendance.find({ studentId: req.params.id });
        const summary = {
            breakfast: records.filter(r => r.breakfast === true).length,
            lunch: records.filter(r => r.lunch === true).length,
            dinner: records.filter(r => r.dinner === true).length
        };
        res.json(summary);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// MARK ALL MEALS
app.post('/api/attendance/mark-all', async (req, res) => {
    try {
        const { date, mealType } = req.body; 
        const rates = { breakfast: 25, lunch: 50, dinner: 50 };

        const students = await Student.find();
        if (!students || students.length === 0) {
            return res.status(404).json({ msg: "No students found to mark" });
        }

        for (let student of students) {
            let record = await Attendance.findOne({ studentId: student._id, date: date });
            if (!record) record = new Attendance({ studentId: student._id, date: date });

            if (record[mealType] !== true) {
                record[mealType] = true;
                student.totalDue = (student.totalDue || 0) + rates[mealType];
                await record.save();
                await student.save();
            }
        }
        res.json({ msg: "Success! Sabka attendance lag gaya." });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// AUTO-EMAIL CRON
cron.schedule('0 10 * * *', async () => {
    try {
        const students = await Student.find({});
        const today = new Date();
        for (let student of students) {
            const startDate = new Date(student.lastPaymentDate || student.joiningDate);
            const diffDays = Math.floor((today - startDate) / (1000 * 60 * 60 * 24));
            if ((diffDays === 28 || diffDays === 30) && student.email) {
                const subject = `Mess Renewal Alert: ${student.name}`;
                const htmlContent = `<h2>Namaste ${student.name}</h2><p>Aapka mess mahina pura hone wala hai (${diffDays} din ho gaye). Bill: ₹${student.totalDue}</p>`;
                await sendMail(student.email, subject, htmlContent);
            }
        }
    } catch (err) { console.log(err); }
});

// SMART MENU ROUTES
app.get('/api/menu', async (req, res) => {
    try {
        const menuData = await Menu.find();
        res.json(menuData);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/menu/update', async (req, res) => {
    try {
        const { day, dish, ingredients } = req.body;
        const updated = await Menu.findOneAndUpdate(
            { day }, { dish, ingredients }, { upsert: true, new: true }
        );
        res.json(updated);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// UPDATE PROFILE
app.put('/api/students/update-profile/:id', async (req, res) => {
    try {
        const { address, emergencyContact, profilePic, email } = req.body;
        const updatedStudent = await Student.findByIdAndUpdate(
            req.params.id, 
            { address, emergencyContact, profilePic, email }, 
            { new: true }
        );
        res.json(updatedStudent);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// DELETE STUDENT
app.delete('/api/students/:id', async (req, res) => {
    try {
        const deletedStudent = await Student.findByIdAndDelete(req.params.id);
        if (!deletedStudent) return res.status(404).json({ msg: "Student nahi mila" });
        await Attendance.deleteMany({ studentId: req.params.id });
        res.json({ msg: "Student aur uska data delete ho gaya!" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.get('/test', (req, res) => res.send("Server is Working Perfectly!"));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server started on port ${PORT}`));