const mongoose = require('mongoose');

const studentSchema = new mongoose.Schema({
    name: { type: String, required: true },
    phone: { type: String, required: true, unique: true },
      password: { type: String, default: "1234" },
        address: { type: String }, // Naya: Room/Hostel
    emergencyContact: { type: String }, // Naya: Parent's number
       email: { type: String }, 
    dailyRate: { type: Number, default: 100 },
    totalDue: { type: Number, default: 0 },
      joiningDate: { type: Date, default: Date.now }, 
    joiningDate: { type: Date, default: Date.now },
    lastPaymentDate: { type: Date, default: Date.now } 
});

module.exports = mongoose.model('Student', studentSchema);