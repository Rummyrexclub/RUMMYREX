const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const app = express();

app.use(express.json());
app.use(cors());
app.use(express.static('public'));

// Secure Connection using Environment Variable
const dbURI = process.env.MONGO_URI;

mongoose.connect(dbURI)
  .then(() => console.log("DATABASE CONNECTED SUCCESS!"))
  .catch(err => console.log("DB ERROR: Check MONGO_URI in Render"));

// User Schema with Coins
const User = mongoose.model('User', new mongoose.Schema({
    name: String, 
    phone: String, 
    password: String, 
    coins: { type: Number, default: 100 }
}));

// --- Signup Route ---
app.post('/api/signup', async (req, res) => {
    try {
        const user = new User(req.body);
        await user.save();
        res.json({ success: true });
    } catch (e) { res.status(500).json({ success: false }); }
});

// --- Login Route ---
app.post('/api/login', async (req, res) => {
    try {
        const { phone, password } = req.body;
        const user = await User.findOne({ phone, password });
        if (user) {
            res.json({ success: true, name: user.name, coins: user.coins });
        } else {
            res.json({ success: false });
        }
    } catch (e) { res.status(500).json({ success: false }); }
});

// --- ADMIN: Get All Users ---
app.get('/api/admin/users', async (req, res) => {
    try {
        const users = await User.find({}, 'name phone coins');
        res.json(users);
    } catch (e) { res.status(500).json({ error: "Fetch failed" }); }
});

// --- ADMIN: Update Coins (FIXED LOGIC) ---
app.post('/api/admin/update-coins', async (req, res) => {
    try {
        const { userId, amount } = req.body;
        // Coins ni Number ga marchi database update chesthunnam
        const updatedUser = await User.findByIdAndUpdate(
            userId, 
            { $inc: { coins: parseInt(amount) } }, 
            { new: true }
        );
        if (updatedUser) {
            res.json({ success: true, newBalance: updatedUser.coins });
        } else {
            res.json({ success: false });
        }
    } catch (e) { res.status(500).json({ success: false }); }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
