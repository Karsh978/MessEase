const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const admin = require('firebase-admin');

dotenv.config();
const app = express();

// Middleware
app.use(cors());
app.use(express.json({ limit: '1mb' }));

// Firebase Init
try {
  if (process.env.FIREBASE_SERVICE_ACCOUNT) {
    const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
    if (!admin.apps.length) {
      admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
    }
    console.log("✅ Firebase Admin Success");
  }
} catch (e) { console.log("❌ Firebase Error", e.message); }

// ── TEST ROUTE (Ise browser mein check karne ke liye) ──
app.get('/api/test-now', (req, res) => {
    res.json({ msg: "Backend is LIVE and Notification route is ready!" });
});

// ── NOTIFICATION ROUTE (Direct Path) ──
app.post('/api/admin/send-notification', async (req, res) => {
    try {
        const { title, body } = req.body;
        const Student = mongoose.model('Student');
        const students = await Student.find({ fcmToken: { $exists: true, $ne: "" } });
        const tokens = students.map(s => s.fcmToken);

        if (tokens.length === 0) return res.status(404).json({ msg: "No tokens found" });

        const message = { notification: { title, body }, tokens: tokens };
        const response = await admin.messaging().sendEachForMulticast(message);
        res.json({ msg: `Sent to ${response.successCount} students!` });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ── TOKEN SAVE ROUTE ──
app.post('/api/students/save-fcm-token', async (req, res) => {
    try {
        const { studentId, token } = req.body;
        const Student = mongoose.model('Student');
        await Student.findByIdAndUpdate(studentId, { fcmToken: token });
        res.json({ msg: "Token saved!" });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// Models & Other Routes
const Student = require('./models/Student');
const Attendance = require('./models/Attendance');
const studentRoutes = require('./routes/studentRoutes');
app.use('/api/students', studentRoutes);

// MongoDB Connection
mongoose.connect(process.env.MONGO_URI).then(() => {
    const PORT = process.env.PORT || 5000;
    app.listen(PORT, () => console.log(`🚀 Server on ${PORT}`));
});