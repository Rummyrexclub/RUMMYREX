const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const app = express();

app.use(express.json());
app.use(cors());
app.use(express.static('public'));

const dbURI = process.env.MONGO_URI;
mongoose.connect(dbURI).then(() => console.log("DATABASE CONNECTED SUCCESS!"));

const User = mongoose.model('User', new mongoose.Schema({
    name: String, phone: String, password: String, 
    coins: { type: Number, default: 100 }
}));

// --- Admin: Get Users ---
app.get('/api/admin/users', async (req, res) => {
    try {
        const users = await User.find({}, 'name phone coins');
        res.json(users);
    } catch (e) { res.status(500).json({ error: "failed" }); }
});

// --- Admin: Update Coins (THE FIX) ---
app.post('/api/admin/update-coins', async (req, res) => {
    try {
        const { userId, amount } = req.body;
        const numAmount = parseInt(amount); // String ni Number ga marchali

        // Database logic: User ni vethiki coins ni unna vatiki add cheyyadam
        const user = await User.findByIdAndUpdate(
            userId, 
            { $inc: { coins: numAmount } }, 
            { new: true }
        );

        if (user) {
            console.log("Coins Updated for: " + user.name);
            res.json({ success: true, newBalance: user.coins });
        } else {
            res.json({ success: false });
        }
    } catch (e) { res.status(500).json({ success: false }); }
});

// Signup & Login
app.post('/api/signup', async (req, res) => {
    try { const user = new User(req.body); await user.save(); res.json({ success: true }); }
    catch (e) { res.status(500).json({ success: false }); }
});
app.post('/api/login', async (req, res) => {
    try {
        const { phone, password } = req.body;
        const user = await User.findOne({ phone, password });
        if (user) res.json({ success: true, name: user.name, coins: user.coins });
        else res.json({ success: false });
    } catch (e) { res.status(500).json({ success: false }); }
});

app.listen(process.env.PORT || 3000);
