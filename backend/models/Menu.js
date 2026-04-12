const mongoose = require('mongoose');

const menuSchema = new mongoose.Schema({
    day: String,
    dish: String,
    ingredients: String
});

module.exports = mongoose.model('Menu', menuSchema);