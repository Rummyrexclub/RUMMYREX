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
    .then(() => console.log("DATABASE CONNECTED SUCCESS!"))
    .catch(err => console.log("DB Error:", err));

const User = mongoose.model('User', new mongoose.Schema({
    name: String, phone: String, password: String, 
    coins: { type: Number, default: 100 }
}));

io.on('connection', (socket) => {
    socket.on('joinGame', (data) => {
        socket.join('rummyTable');
    });
});

app.post('/api/login', async (req, res) => {
    try {
        const user = await User.findOne(req.body);
        if (user) res.json({ success: true, name: user.name, coins: user.coins });
        else res.json({ success: false });
    } catch(e) { res.status(500).json({success: false}); }
});

app.get('/api/admin/users', async (req, res) => {
    const users = await User.find({}, 'name phone coins');
    res.json(users);
});

app.post('/api/admin/update-coins', async (req, res) => {
    const { userId, amount } = req.body;
    await User.findByIdAndUpdate(userId, { $inc: { coins: parseInt(amount) } });
    res.json({ success: true });
});

server.listen(process.env.PORT || 10000, () => console.log("Server Live"));
