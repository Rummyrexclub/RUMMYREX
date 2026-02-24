const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const http = require('http'); // Multiplayer kosam
const { Server } = require('socket.io'); // Real-time action kosam

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "*" } });

app.use(express.json());
app.use(cors());
app.use(express.static('public'));

// Database Connection
mongoose.connect(process.env.MONGO_URI).then(() => console.log("DATABASE CONNECTED SUCCESS!"));

// User Schema
const User = mongoose.model('User', new mongoose.Schema({
    name: String, phone: String, password: String, 
    coins: { type: Number, default: 100 }
}));

// Multiplayer Logic (Socket.io)
io.on('connection', (socket) => {
    console.log('A player joined the table: ' + socket.id);
    
    socket.on('joinGame', (data) => {
        socket.join('rummyTable');
        console.log(`${data.name} is ready for 101/201 Pool`);
    });

    socket.on('disconnect', () => { console.log('Player left'); });
});

// Admin & Login Routes
app.post('/api/login', async (req, res) => {
    const user = await User.findOne(req.body);
    if (user) res.json({ success: true, name: user.name, coins: user.coins });
    else res.json({ success: false });
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

// Port Settings
server.listen(process.env.PORT || 3000, () => console.log("Rummy Engine Running..."));
