const express = require('express');
const router = express.Router();
const Expense = require('../models/Expense');

// Get All Expenses
router.get('/all', async (req, res) => {
    try {
        const expenses = await Expense.find();
        res.json(expenses);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Add Expense
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

// ✅ Delete Expense
router.delete('/:id', async (req, res) => {
    try {
        const deleted = await Expense.findByIdAndDelete(req.params.id);
        if (!deleted) return res.status(404).json({ msg: "Expense nahi mila!" });
        res.json({ msg: "Deleted!" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;