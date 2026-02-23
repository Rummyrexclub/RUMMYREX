const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const app = express();

app.use(express.json());
app.use(cors());
app.use(express.static('public'));

// Secure Connection - No more hardcoded passwords
const dbURI = process.env.MONGO_URI;

mongoose.connect(dbURI)
  .then(() => console.log("DATABASE CONNECTED SUCCESS!"))
  .catch(err => console.log("DB ERROR: Check Render Env Variables"));

const User = mongoose.model('User', new mongoose.Schema({
    name: String, phone: String, password: String, coins: { type: Number, default: 100 }
}));

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
        if (user) res.json({ success: true, name: user.name });
        else res.json({ success: false });
    } catch (e) { res.status(500).json({ success: false }); }
});

app.listen(process.env.PORT || 3000);
