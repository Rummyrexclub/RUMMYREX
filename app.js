const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const app = express();

app.use(express.json());
app.use(cors());
app.use(express.static('public'));

// Secure Connection
const dbURI = process.env.MONGO_URI;
mongoose.connect(dbURI)
  .then(() => console.log("DATABASE CONNECTED SUCCESS!"))
  .catch(err => console.log("DB ERROR"));

const User = mongoose.model('User', new mongoose.Schema({
    name: String, 
    phone: String, 
    password: String, 
    coins: { type: Number, default: 100 }
}));

// --- Existing Routes ---
app.post('/api/signup', async (req, res) => {
    try {
        const user = new User(req.body);
        await user.save();
        res.json({ success: true });
    } catch (e) { res.status(500).json({ success: false }); }
});

app.post('/api/login', async (req, res) => {
    try {
        const { phone, password } = req.body;
        const user = await User.findOne({ phone, password });
        if (user) res.json({ success: true, name: user.name, coins: user.coins });
        else res.json({ success: false });
    } catch (e) { res.status(500).json({ success: false }); }
});

// --- New Admin Routes ---

// Get all users for Admin Panel
app.get('/api/admin/users', async (req, res) => {
    try {
        const users = await User.find({}, 'name phone coins');
        res.json(users);
    } catch (e) { res.status(500).send("Error fetching users"); }
});

// Update coins for a user
app.post('/api/admin/update-coins', async (req, res) => {
    try {
        const { userId, amount } = req.body;
        const user = await User.findById(userId);
        if (user) {
            user.coins += parseInt(amount); // Coins add chesthunnam
            await user.save();
            res.json({ success: true });
        } else {
            res.json({ success: false });
        }
    } catch (e) { res.status(500).json({ success: false }); }
});

app.listen(process.env.PORT || 3000);
