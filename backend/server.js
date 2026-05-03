const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const cron = require('node-cron');
const admin = require('firebase-admin');

// 1. Config
dotenv.config();

// 2. Firebase Admin Initialize
try {
  if (process.env.FIREBASE_SERVICE_ACCOUNT) {
    const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
    if (!admin.apps.length) { // Check if already initialized
        admin.initializeApp({
          credential: admin.credential.cert(serviceAccount)
        });
    }
    console.log("✅ Firebase Admin Initialized!");
  } else {
    console.log("⚠️ FIREBASE_SERVICE_ACCOUNT env variable missing!");
  }
} catch (error) {
  console.error("❌ Firebase Init Error:", error.message);
}

const app = express();

// 3. Middleware
app.use(cors());
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ limit: '1mb', extended: true }));

// 4. Admin PIN Auth Middleware
const ADMIN_PIN = process.env.ADMIN_PIN;
const authAdmin = (req, res, next) => {
  const pin = req.headers['admin-pin'];
  if (pin === ADMIN_PIN) {
    next();
  } else {
    res.status(401).json({ msg: "Unauthorized! Ghalat PIN." });
  }
};

// 5. Models
const Student    = require('./models/Student');
const Attendance = require('./models/Attendance');
const Menu       = require('./models/Menu');
const Expense    = require('./models/Expense');

// 6. Utils
const sendMail = require('./utils/emailSender');

// ============================================================
// --- 🚀 NEW & DIRECT ROUTES (SABSE UPAR RAKHEIN) ---
// ============================================================

// A. Notification Send Route (Fixing 404)
app.post('/api/admin/send-notification', async (req, res) => {
    try {
        const { title, body } = req.body;
        const students = await Student.find({ fcmToken: { $exists: true, $ne: "" } });
        const tokens = students.map(s => s.fcmToken);

        if (tokens.length === 0) {
            return res.status(404).json({ msg: "Database mein koi token nahi mila." });
        }

        const message = {
            notification: { title, body },
            tokens: tokens,
        };

        const response = await admin.messaging().sendEachForMulticast(message);
        res.json({ msg: `Sent to ${response.successCount} students!` });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// B. Token Save Route
app.post('/api/students/save-fcm-token', async (req, res) => {
    try {
        const { studentId, token } = req.body;
        await Student.findByIdAndUpdate(studentId, { fcmToken: token });
        res.json({ msg: "Token saved!" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// C. Test Route (Check if API is alive)
app.get('/api/test-alive', (req, res) => res.json({ msg: "API is working!" }));

// ============================================================
// --- OTHER ROUTES ---
// ============================================================

const studentRoutes    = require('./routes/studentRoutes');
const attendanceRoutes = require('./routes/attendanceRoutes');
const expenseRoutes    = require('./routes/expenseRoutes');
const menuRoutes       = require('./routes/menuRoutes');

app.use('/api/students',    studentRoutes);
app.use('/api/attendance',  authAdmin, attendanceRoutes);
app.use('/api/expenses',    authAdmin, expenseRoutes);

// 1. STUDENT PORTAL LOGIN
app.post('/api/students/portal-login', async (req, res) => {
  try {
    const phone    = String(req.body.phone);
    const password = String(req.body.password);
    const student  = await Student.findOne({ phone, password });
    if (!student) return res.status(401).json({ msg: "Ghalat Number ya Password!" });
    const attendance = await Attendance.find({ studentId: student._id }).sort({ date: -1 });
    res.json({ student, attendance });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// 2. TOGGLE MEAL
app.post('/api/attendance/toggle-meal', async (req, res) => {
  try {
    const { studentId, date, mealType } = req.body;
    const rates = { breakfast: 25, lunch: 50, dinner: 50 };
    let record = await Attendance.findOne({ studentId, date });
    if (!record) record = new Attendance({ studentId, date });
    const student = await Student.findById(studentId);
    if (record[mealType]) {
      record[mealType] = false;
      student.totalDue = Math.max(0, (student.totalDue || 0) - rates[mealType]);
    } else {
      record[mealType] = true;
      student.totalDue = (student.totalDue || 0) + rates[mealType];
    }
    await record.save(); await student.save();
    res.json({ msg: "Success", record, totalDue: student.totalDue });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// 3. BACKUP
app.get('/api/admin/backup', authAdmin, async (req, res) => {
  try {
    const students = await Student.find();
    const attendance = await Attendance.find();
    const expenses = await Expense.find();
    res.json({ exportDate: new Date().toLocaleString(), data: { students, attendance, expenses } });
  } catch (err) { res.status(500).json({ error: "Backup fail!" }); }
});

// 4. MENU ROUTES
app.get('/api/menu', async (req, res) => {
    try { const data = await Menu.find(); res.json(data); } catch(err) { res.status(500).json(err); }
});
app.post('/api/menu/update', authAdmin, async (req, res) => {
    try {
        const { day, dish, ingredients } = req.body;
        const updated = await Menu.findOneAndUpdate({ day }, { dish, ingredients }, { upsert: true, new: true });
        res.json(updated);
    } catch (err) { res.status(500).json(err); }
});

// 5. BILL SUMMARY
app.get('/api/students/bill-summary/:id', async (req, res) => {
    try {
        const records = await Attendance.find({ studentId: req.params.id });
        res.json({
            breakfast: records.filter(r => r.breakfast).length,
            lunch: records.filter(r => r.lunch).length,
            dinner: records.filter(r => r.dinner).length,
        });
    } catch (err) { res.status(500).json(err); }
});

// MongoDB Connection
mongoose.connect(process.env.MONGO_URI)
  .then(() => {
      console.log("✅ MongoDB Connected");
      const PORT = process.env.PORT || 5000;
      app.listen(PORT, () => console.log(`🚀 Server on port ${PORT}`));
  })
  .catch((err) => console.log("❌ DB Error:", err));