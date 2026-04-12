const mongoose = require('mongoose');

const expenseSchema = new mongoose.Schema({
    item: { type: String, required: true }, // Jaise: Sabzi, Tel, Gas
    amount: { type: Number, required: true },
    category: { type: String, default: 'General' },
    date: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Expense', expenseSchema);