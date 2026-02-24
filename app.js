const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "*" } });

app.use(express.json());
app.use(cors());
app.use(express.static('public'));

mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log("DB CONNECTED"))
    .catch(err => console.log(err));

const User = mongoose.model('User', new mongoose.Schema({
    name: String, phone: String, password: String, 
    coins: { type: Number, default: 1000 }
}));

// API to Handle Win or Loss
app.post('/api/game/update-balance', async (req, res) => {
    const { name, amount } = req.body; // amount can be positive or negative
    try {
        const user = await User.findOneAndUpdate(
            { name: name },
            { $inc: { coins: parseInt(amount) } },
            { new: true }
        );
        res.json({ success: true, newBalance: user.coins });
    } catch (e) {
        res.status(500).json({ success: false });
    }
});

app.post('/api/login', async (req, res) => {
    const user = await User.findOne(req.body);
    if (user) res.json({ success: true, name: user.name, coins: user.coins });
    else res.json({ success: false });
});

server.listen(process.env.PORT || 10000, () => console.log("Server Running"));
