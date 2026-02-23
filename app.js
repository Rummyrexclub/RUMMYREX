const express = require('express');
const mongoose = require('mongoose');
const path = require('path');
const cors = require('cors');
const app = express();

app.use(express.json());
app.use(cors());
app.use(express.static('public'));

// Database Connection
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("MongoDB Connected!"))
  .catch(err => console.log(err));

// User Model
const User = mongoose.model('User', new mongoose.Schema({
    name: String,
    phone: String,
    password: String,
    coins: { type: Number, default: 100 }
}));

// Signup Route
app.post('/api/signup', async (req, res) => {
    try {
        const user = new User(req.body);
        await user.save();
        res.json({ success: true });
    } catch (e) { res.json({ success: false }); }
});

// Login Route
app.post('/api/login', async (req, res) => {
    const { phone, password } = req.body;
    const user = await User.findOne({ phone, password });
    if (user) {
        res.json({ success: true, name: user.name, coins: user.coins });
    } else {
        res.json({ success: false });
    }
});

app.listen(process.env.PORT || 3000);
