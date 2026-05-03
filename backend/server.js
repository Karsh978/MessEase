const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const cron = require('node-cron');
const admin = require('firebase-admin');

// 1. Config & Firebase
dotenv.config();
try {
  if (process.env.FIREBASE_SERVICE_ACCOUNT) {
    const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
    if (!admin.apps.length) {
      admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
    }
    console.log("✅ Firebase Admin Initialized!");
  }
} catch (error) { console.error("❌ Firebase Init Error:", error.message); }

const app = express();

// 2. Middleware
app.use(cors());
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ limit: '1mb', extended: true }));

// 3. Admin Auth Middleware
const ADMIN_PIN = process.env.ADMIN_PIN;
const authAdmin = (req, res, next) => {
  const pin = req.headers['admin-pin'];
  if (pin === ADMIN_PIN) { next(); } 
  else { res.status(401).json({ msg: "Unauthorized!" }); }
};

// 4. Models
const Student = require('./models/Student');
const Attendance = require('./models/Attendance');
const Expense = require('./models/Expense');
const Menu = require('./models/Menu');
const sendMail = require('./utils/emailSender');

// ============================================================
// --- 🚀 CRITICAL ROUTES (SABSE UPAR RAKHEIN) ---
// ============================================================

// A. Notification Route (Fixing 404)
app.post('/api/admin/send-notification', authAdmin, async (req, res) => {
    try {
        const { title, body } = req.body;
        const students = await Student.find({ fcmToken: { $exists: true, $ne: "" } });
        const tokens = students.map(s => s.fcmToken);
        if (tokens.length === 0) return res.status(404).json({ msg: "No tokens found" });

        const message = { notification: { title, body }, tokens: tokens };
        const response = await admin.messaging().sendEachForMulticast(message);
        res.json({ msg: `Sent to ${response.successCount} students!` });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// B. Alerts Route (Fixing 404 for /api/students/alerts)
app.get('/api/students/alerts', async (req, res) => {
    try {
        const allStudents = await Student.find({});
        const today = new Date();
        const alerts = allStudents.map(s => {
            const startDate = s.lastPaymentDate || s.joiningDate || today;
            const diffDays = Math.floor((today - new Date(startDate)) / (1000 * 60 * 60 * 24));
            return { _id: s._id, name: s.name, phone: s.phone, totalDue: s.totalDue, daysPassed: diffDays };
        }).filter(s => s.daysPassed >= 27);
        res.json(alerts);
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// C. Token Save Route
app.post('/api/students/save-fcm-token', async (req, res) => {
    try {
        const { studentId, token } = req.body;
        await Student.findByIdAndUpdate(studentId, { fcmToken: token });
        res.json({ msg: "Token saved!" });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// ============================================================
// --- MOUNT ROUTE FILES ---
// ============================================================
const studentRoutes = require('./routes/studentRoutes');
const attendanceRoutes = require('./routes/attendanceRoutes');
const expenseRoutes = require('./routes/expenseRoutes');
const menuRoutes = require('./routes/menuRoutes');

app.use('/api/students', studentRoutes);
app.use('/api/attendance', authAdmin, attendanceRoutes);
app.use('/api/expenses', authAdmin, expenseRoutes);
app.use('/api/menu', menuRoutes);

// ============================================================
// --- OTHER DIRECT ROUTES ---
// ============================================================

app.post('/api/students/portal-login', async (req, res) => {
    try {
        const { phone, password } = req.body;
        const student = await Student.findOne({ phone, password });
        if (!student) return res.status(401).json({ msg: "Ghalat PIN!" });
        const attendance = await Attendance.find({ studentId: student._id }).sort({ date: -1 });
        res.json({ student, attendance });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

app.get('/api/admin/backup', authAdmin, async (req, res) => {
    try {
        const students = await Student.find();
        const attendance = await Attendance.find();
        const expenses = await Expense.find();
        res.json({ data: { students, attendance, expenses } });
    } catch (err) { res.status(500).json({ error: "Backup fail!" }); }
});

// MongoDB & Server Start
mongoose.connect(process.env.MONGO_URI)
    .then(() => {
        console.log("✅ MongoDB Connected");
        const PORT = process.env.PORT || 5000;
        app.listen(PORT, () => console.log(`🚀 Server on port ${PORT}`));
    })
    .catch(err => console.log("❌ DB Error:", err));