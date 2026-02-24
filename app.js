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
    .then(() => console.log("✅ DB CONNECTED"))
    .catch(err => console.log("❌ DB ERROR:", err));

const User = mongoose.model('User', new mongoose.Schema({
    name: String, phone: { type: String, unique: true },
    password: String, coins: { type: Number, default: 1000 }
}));

// Turn & Room Logic for Official Gameplay
let rooms = {};

io.on('connection', (socket) => {
    socket.on('joinGame', (data) => {
        let rId = "official_room";
        socket.join(rId);
        
        // Active Timer Sync
        if(!rooms[rId]) {
            rooms[rId] = { timer: 30 };
            setInterval(() => {
                if(rooms[rId].timer > 0) {
                    rooms[rId].timer--;
                    io.to(rId).emit('timerUpdate', rooms[rId].timer);
                } else { rooms[rId].timer = 30; }
            }, 1000);
        }
        // Send initial game data
        io.to(rId).emit('gameStart', { status: 'live' });
    });
});

app.post('/api/login', async (req, res) => {
    const user = await User.findOne({ phone: req.body.phone, password: req.body.password });
    if(user) res.json({ success: true, name: user.name, coins: user.coins });
    else res.json({ success: false });
});

server.listen(process.env.PORT || 10000, () => console.log("🚀 ENGINE LIVE"));
