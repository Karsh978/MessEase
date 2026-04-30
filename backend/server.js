const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const cron = require('node-cron');

// 1. Config aur App shuru
dotenv.config();
const app = express();

mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log("Didi's Mess Database Connected! ✅"))
    .catch((err) => console.log("DB Connection Error: ", err));

const ADMIN_PIN = process.env.ADMIN_PIN;

// 2. Middleware 
app.use(cors());
app.use(express.json({ limit: '1mb' })); 
app.use(express.urlencoded({ limit: '1mb', extended: true }));

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

// 5. Auth Middleware
const authAdmin = (req, res, next) => {
    const pin = req.headers['admin-pin'];
    if (pin === ADMIN_PIN) { 
        next(); 
    } else {
        res.status(401).json({ msg: "Unauthorized! Ghalat PIN." });
    }
};

// 6. Routes Link karein
app.use('/api/students', studentRoutes);
app.use('/api/attendance', authAdmin, attendanceRoutes); 
app.use('/api/expenses', authAdmin, expenseRoutes);    

// ============================================================
// --- SPECIAL PORTAL ROUTES ---
// ============================================================

// [NEW] MAGIC LINK: ID se direct login
app.get('/api/students/portal-direct/:id', async (req, res) => {
    try {
        const student = await Student.findById(req.params.id);
        if (!student) return res.status(404).json({ msg: "Student not found" });
        const attendance = await Attendance.find({ studentId: student._id }).sort({ date: -1 });
        res.json({ student, attendance });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// STUDENT LOGIN (Original)
app.post('/api/students/portal-login', async (req, res) => {
    try {
        const phone = String(req.body.phone);
        const password = String(req.body.password);
        const student = await Student.findOne({ phone, password });
        if (!student) return res.status(401).json({ msg: "Ghalat Number ya Password!" });
        const attendance = await Attendance.find({ studentId: student._id }).sort({ date: -1 });
        res.json({ student, attendance });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// TOGGLE MEAL (Fixed: No Negative Bill)
app.post('/api/attendance/toggle-meal', async (req, res) => {
    try {
        const { studentId, date, mealType } = req.body;
        const rates = { breakfast: 25, lunch: 50, dinner: 50 };

        let record = await Attendance.findOne({ studentId, date });
        if (!record) record = new Attendance({ studentId, date });

        const student = await Student.findById(studentId);
        if (!student) return res.status(404).json({ msg: "Student not found" });

        if (record[mealType]) {
            record[mealType] = false;
            // FIX: Math.max ensures bill doesn't go below 0
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

// BILL SUMMARY FOR PDF
app.get('/api/students/bill-summary/:id', async (req, res) => {
    try {
        const records = await Attendance.find({ studentId: req.params.id });
        const summary = {
            breakfast: records.filter(r => r.breakfast).length,
            lunch: records.filter(r => r.lunch).length,
            dinner: records.filter(r => r.dinner).length
        };
        res.json(summary);
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// MARK ALL MEALS
app.post('/api/attendance/mark-all', async (req, res) => {
    try {
        const { date, mealType } = req.body; 
        const rates = { breakfast: 25, lunch: 50, dinner: 50 };
        const students = await Student.find();
        for (let student of students) {
            let record = await Attendance.findOne({ studentId: student._id, date: date });
            if (!record) record = new Attendance({ studentId: student._id, date: date });
            if (!record[mealType]) {
                record[mealType] = true;
                student.totalDue = (student.totalDue || 0) + rates[mealType];
                await record.save(); await student.save();
            }
        }
        res.json({ msg: "Success! Sabka attendance lag gaya." });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// ALERTS & CRON
app.get('/api/students/alerts', async (req, res) => {
    try {
        const allStudents = await Student.find({});
        const today = new Date();
        const alerts = allStudents.map(s => {
            const startDate = s.lastPaymentDate || s.joiningDate || today;
            const diffDays = Math.floor((today - new Date(startDate)) / (1000*60*60*24)); 
            return { _id: s._id, name: s.name, phone: s.phone, email: s.email, totalDue: s.totalDue, daysPassed: diffDays };
        }).filter(s => s.daysPassed >= 27);
        res.json(alerts);
    } catch (err) { res.status(500).json({ error: err.message }); }
});

cron.schedule('0 10 * * *', async () => {
    try {
        const students = await Student.find({});
        for (let student of students) {
            const diffDays = Math.floor((new Date() - new Date(student.joiningDate)) / (1000*60*60*24));
            if ((diffDays === 28 || diffDays === 30) && student.email) {
                await sendMail(student.email, "Mess Renewal", `Namaste ${student.name}, bill: ₹${student.totalDue}`);
            }
        }
    } catch (err) { console.log(err); }
});

// MENU
app.get('/api/menu', async (req, res) => {
    try { const menuData = await Menu.find(); res.json(menuData); }
    catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/menu/update', authAdmin, async (req, res) => {
    try {
        const { day, dish, ingredients } = req.body;
        const updated = await Menu.findOneAndUpdate({ day }, { dish, ingredients }, { upsert: true, new: true });
        res.json(updated);
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// PROFILE & DELETE
app.put('/api/students/update-profile/:id', async (req, res) => {
    try {
        const { address, emergencyContact, profilePic, email } = req.body;
        const updated = await Student.findByIdAndUpdate(req.params.id, { address, emergencyContact, profilePic, email }, { new: true });
        res.json(updated);
    } catch (err) { res.status(500).json({ error: err.message }); }
});

app.delete('/api/students/:id', async (req, res) => {
    try {
        await Student.findByIdAndDelete(req.params.id);
        await Attendance.deleteMany({ studentId: req.params.id });
        res.json({ msg: "Deleted!" });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server started on port ${PORT}`));