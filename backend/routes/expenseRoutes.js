const express = require('express');
const router = express.Router();
const Expense = require('../models/Expense');

// Check karein yahan '/all' hi likha hai na?
router.get('/all', async (req, res) => {
    try {
        const expenses = await Expense.find();
        res.json(expenses);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Check karein yahan '/add' hi likha hai na?
router.post('/add', async (req, res) => {
    try {
        const { item, amount } = req.body;
        const newExpense = new Expense({ item, amount });
        await newExpense.save();
        res.json(newExpense);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;