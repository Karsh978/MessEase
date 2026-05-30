const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const cron = require('node-cron');
const admin = require('firebase-admin');

dotenv.config();

try {
  if (process.env.FIREBASE_SERVICE_ACCOUNT) {
    const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount)
    });
    console.log("✅ Firebase Admin Initialized!");
  } else {
    console.log("⚠️ FIREBASE_SERVICE_ACCOUNT env variable missing!");
  }
} catch (error) {
  console.error("❌ Firebase Init Error:", error.message);
}

const app = express();

mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("✅ Didi's Mess Database Connected!"))
  .catch((err) => console.log("❌ DB Connection Error:", err));

app.use(cors());
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ limit: '1mb', extended: true }));

const ADMIN_PIN = process.env.ADMIN_PIN;
const authAdmin = (req, res, next) => {
  const pin = req.headers['admin-pin'];
  if (pin === ADMIN_PIN) {
    next();
  } else {
    res.status(401).json({ msg: "Unauthorized! Ghalat PIN." });
  }
};

const Student    = require('./models/Student');
const Attendance = require('./models/Attendance');
const Menu       = require('./models/Menu');
const Expense    = require('./models/Expense');

const sendMail = require('./utils/emailSender');

const studentRoutes    = require('./routes/studentRoutes');
const attendanceRoutes = require('./routes/attendanceRoutes');
const expenseRoutes    = require('./routes/expenseRoutes');
const menuRoutes       = require('./routes/menuRoutes');

app.use('/api/students',    studentRoutes);
app.use('/api/attendance',  authAdmin, attendanceRoutes);
app.use('/api/expenses',    authAdmin, expenseRoutes);
app.use('/api/menu/update', authAdmin);

// ============================================================
// --- DIRECT ROUTES ---
// ============================================================

// 1. Root Route
app.get('/', (req, res) => {
    res.send("Didi's Mess Server is Running... 🚀");
});

// 2. Health Check Route
app.get('/api/health', (req, res) => {
    res.status(200).send("I am awake!");
});

app.get('/api/admin/test-get', (req, res) => {
    res.json({ msg: "Notification system is ONLINE!" });
});

// 3. Notification Route
app.post('/api/admin/send-notification', async (req, res) => {
    try {
        const { title, body } = req.body;
        const Student = require('./models/Student');
        const students = await Student.find({ fcmToken: { $exists: true, $ne: "" } });
        
        if (students.length === 0) {
            return res.json({ msg: "Database mein koi token nahi mila. Student se Notification ALLOW karwaein." });
        }

        const tokens = students.map(s => s.fcmToken);
        const message = { notification: { title, body }, tokens: tokens };
        const response = await admin.messaging().sendEachForMulticast(message);
        res.json({ msg: `Sent to ${response.successCount} students!` });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 4. Token Save Route
app.post('/api/students/save-fcm-token', async (req, res) => {
    try {
        const { studentId, token } = req.body;
        const Student = require('./models/Student');
        await Student.findByIdAndUpdate(studentId, { fcmToken: token });
        res.json({ msg: "Token saved!" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 5. STUDENT PORTAL LOGIN
app.post('/api/students/portal-login', async (req, res) => {
  try {
    const phone    = String(req.body.phone);
    const password = String(req.body.password);
    const student  = await Student.findOne({ phone, password });

    if (!student) return res.status(401).json({ msg: "Ghalat Number ya Password!" });

    const attendance = await Attendance.find({ studentId: student._id }).sort({ date: -1 });
    res.json({ student, attendance });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ❌ toggle-meal YAHAN SE HATA DIYA — attendanceRoutes.js handle karega
// ✅ Ab /api/attendance/toggle-meal → attendanceRoutes.js jayega (sahi response dega)

// 6. ATTENDANCE STATUS CHECK
// ❌ Yeh bhi hata diya — attendanceRoutes.js handle karega
// ✅ Ab /api/attendance/status/:date → attendanceRoutes.js jayega

// 7. EMAIL REMINDER
app.post('/api/students/send-email-reminder', async (req, res) => {
  try {
    const { email, name, amount } = req.body;
    if (!email) return res.status(400).json({ msg: "Email missing!" });

    const subject = `Payment Reminder: Didi's Mess`;
    const text    = `Namaste ${name},\n\nAapka mess bill ₹${amount} due hai. Kripya samay par bhugtan karein.\n\nShukriya!\nDidi's Mess Management`;

    await sendMail(email, subject, text);
    res.json({ msg: "Email sent successfully!" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 8. PAYMENT ALERTS
app.get('/api/students/alerts', async (req, res) => {
  try {
    const allStudents = await Student.find({});
    const today = new Date();

    const alerts = allStudents.map(s => {
      const startDate = s.lastPaymentDate || s.joiningDate || today;
      const diffDays  = Math.floor((today - new Date(startDate)) / (1000 * 60 * 60 * 24));
      return { _id: s._id, name: s.name, phone: s.phone, email: s.email, totalDue: s.totalDue, daysPassed: diffDays || 0 };
    }).filter(s => s.daysPassed >= 27);

    res.json(alerts);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 9. BILL SUMMARY FOR PDF
// ── SIRF YEH ROUTE REPLACE KARO server.js MEIN ──
// Purana route dhundho: app.get('/api/students/bill-summary/:id', ...)
// Aur isko paste karo uski jagah

app.get('/api/students/bill-summary/:id', async (req, res) => {
  try {
    const student = await Student.findById(req.params.id);
    if (!student) return res.status(404).json({ msg: "Student nahi mila" });

    // ── Billing cycle calculate karo (joining day se joining day tak) ──
    const joinRaw  = student.joiningDate || student.createdAt;
    const joinDate = new Date(joinRaw);
    const joinDay  = joinDate.getDate(); // e.g. 12

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Cycle start: is mahine ki joining tarikh
    let cycleStart = new Date(today.getFullYear(), today.getMonth(), joinDay);

    // Agar aaj joining tarikh se pehle hai toh pichle mahine se start
    if (cycleStart > today) {
      cycleStart = new Date(today.getFullYear(), today.getMonth() - 1, joinDay);
    }

    // Cycle end: cycleStart ke ek din pehle (next month ki joining se pehle)
    const cycleEnd = new Date(cycleStart.getFullYear(), cycleStart.getMonth() + 1, joinDay - 1);

    // ── Is cycle ke saare din generate karo ──
    const allDays = [];
    const cursor  = new Date(cycleStart);
    while (cursor <= today) { // today tak hi check karo (future nahi)
      allDays.push(new Date(cursor).toISOString().split('T')[0]);
      cursor.setDate(cursor.getDate() + 1);
    }

    // ── Attendance records fetch karo ──
    const records = await Attendance.find({
      studentId: req.params.id,
      date: { $gte: cycleStart.toISOString().split('T')[0], $lte: today.toISOString().split('T')[0] }
    });

    // Date → record map banao
    const recordMap = {};
    records.forEach(r => { recordMap[r.date] = r; });

    // ── Har meal ke liye present aur missing days nikalo ──
    const meals = ['breakfast', 'lunch', 'dinner'];
    const summary = {};

    meals.forEach(meal => {
      const presentDates = [];
      const missingDates = [];

      allDays.forEach(day => {
        if (recordMap[day] && recordMap[day][meal] === true) {
          presentDates.push(day);
        } else {
          missingDates.push(day);
        }
      });

      summary[meal] = {
        count:        presentDates.length,
        presentDates: presentDates,
        missingDates: missingDates,
      };
    });

    res.json({
      summary,
      cycleStart: cycleStart.toISOString().split('T')[0],
      cycleEnd:   cycleEnd.toISOString().split('T')[0],
      totalDays:  allDays.length,
    });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 10. MARK ALL MEALS
app.post('/api/attendance/mark-all', async (req, res) => {
  try {
    const { date, mealType } = req.body;
    const rates    = { breakfast: 25, lunch: 50, dinner: 50 };
    const students = await Student.find();

    if (!students || students.length === 0) return res.status(404).json({ msg: "No students found" });

    for (let student of students) {
      let record = await Attendance.findOne({ studentId: student._id, date });
      if (!record) record = new Attendance({ studentId: student._id, date });

      if (record[mealType] !== true) {
        record[mealType] = true;
        student.totalDue = (student.totalDue || 0) + rates[mealType];
        await record.save();
        await student.save();
      }
    }

    res.json({ msg: "Success! Sabka attendance lag gaya." });
  } catch (err) {
    console.error("CRASH ERROR IN MARK-ALL:", err.message);
    res.status(500).json({ error: err.message });
  }
});

// 11. MENU — GET
app.get('/api/menu', async (req, res) => {
  try {
    const menuData = await Menu.find();
    res.json(menuData);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 12. MENU — UPDATE
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

// 13. UPDATE STUDENT PROFILE
app.put('/api/students/update-profile/:id', async (req, res) => {
    try {
        const { 
            name, phone, email, password, joiningDate, 
            address, emergencyContact, profilePic 
        } = req.body;

        const Student = require('./models/Student');
        
        const updatedStudent = await Student.findByIdAndUpdate(
            req.params.id, 
            { name, phone, email, password, joiningDate, address, emergencyContact, profilePic }, 
            { new: true }
        );
        
        if (!updatedStudent) return res.status(404).json({ msg: "Student nahi mila" });
        res.json(updatedStudent);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 14. DELETE STUDENT
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

// 15. FULL BACKUP
app.get('/api/admin/backup', authAdmin, async (req, res) => {
  try {
    const students   = await Student.find();
    const attendance = await Attendance.find();
    const expenses   = await Expense.find();

    res.json({
      exportDate:    new Date().toLocaleString(),
      totalStudents: students.length,
      data:          { students, attendance, expenses }
    });
  } catch (err) {
    res.status(500).json({ error: "Backup fail ho gaya!", details: err.message });
  }
});

// ============================================================
// AUTO EMAIL CRON (Roz subah 10 baje)
// ============================================================
cron.schedule('0 10 * * *', async () => {
  try {
    const students = await Student.find({});
    const today    = new Date();

    for (let student of students) {
      const startDate = new Date(student.lastPaymentDate || student.joiningDate);
      const diffDays  = Math.floor((today - startDate) / (1000 * 60 * 60 * 24));

      if ((diffDays === 28 || diffDays === 30) && student.email) {
        const subject     = `Mess Renewal Alert: ${student.name}`;
        const htmlContent = `<h2>Namaste ${student.name}</h2><p>Aapka mess mahina pura hone wala hai (${diffDays} din ho gaye). Bill: ₹${student.totalDue}</p>`;
        await sendMail(student.email, subject, htmlContent);
      }
    }
  } catch (err) {
    console.log("Cron error:", err);
  }
});

// ============================================================
// TEST ROUTE
// ============================================================
app.get('/test', (req, res) => res.send("✅ Server is Working Perfectly!"));

// ============================================================
// SERVER START
// ============================================================
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server started on port ${PORT}`));