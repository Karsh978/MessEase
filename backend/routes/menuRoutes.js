const express = require('express');
const router = express.Router();
const Menu = require('../models/Menu');

// Get all menu items
router.get('/', async (req, res) => {
    try {
        const menu = await Menu.find();
        res.json(menu);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Update or Create menu for a day
router.post('/update', async (req, res) => {
    try {
        const { day, dish, ingredients } = req.body;
        const updatedMenu = await Menu.findOneAndUpdate(
            { day }, 
            { dish, ingredients }, 
            { upsert: true, new: true }
        );
        res.json(updatedMenu);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router; // <-- Ye line honi hi chahiye