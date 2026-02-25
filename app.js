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

// Database Connection
mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log("✅ DATABASE CONNECTED SUCCESS"))
    .catch(err => console.log("❌ DB CONNECTION ERROR:", err));

const User = mongoose.model('User', new mongoose.Schema({
    name: { type: String, required: true },
    phone: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    coins: { type: Number, default: 1000 }
}));

// Official Matchmaking & Global Timer Logic
let rooms = {};

io.on('connection', (socket) => {
    socket.on('joinGame', (data) => {
        const mode = data.mode || 6; // Default to 6 players if not sent
        let rId = `room_${mode}_${socket.id}`; // Instant room for gameplay
        socket.join(rId);

        if(!rooms[rId]) {
            rooms[rId] = { timer: 30 };
            setInterval(() => {
                if(rooms[rId].timer > 0) {
                    rooms[rId].timer--;
                    io.to(rId).emit('timerUpdate', rooms[rId].timer);
                } else { rooms[rId].timer = 30; }
            }, 1000);
        }

        const bots = mode === 2 ? ["Opponent"] : ["Bot 1", "Bot 2", "Bot 3", "Bot 4", "Bot 5"];
        io.to(rId).emit('gameStart', { players: [data.name, ...bots], mode: mode });
    });
});

// Auth Routes
app.post('/api/login', async (req, res) => {
    const user = await User.findOne({ phone: req.body.phone, password: req.body.password });
    if(user) res.json({ success: true, name: user.name, coins: user.coins });
    else res.json({ success: false, message: "Invalid Details!" });
});

app.post('/api/signup', async (req, res) => {
    try {
        const user = new User(req.body);
        await user.save();
        res.json({ success: true, name: user.name, coins: user.coins });
    } catch (e) { res.json({ success: false, message: "Signup Failed!" }); }
});

app.get('/api/admin/users', async (req, res) => {
    const users = await User.find({}, 'name phone coins');
    res.json(users);
});

const PORT = process.env.PORT || 10000;
server.listen(PORT, () => console.log(`🚀 SERVER RUNNING ON PORT ${PORT}`));
