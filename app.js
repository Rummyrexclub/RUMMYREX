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

// 1. Database Connection
mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log("DATABASE CONNECTED SUCCESS!"))
    .catch(err => console.log("DB CONNECTION ERROR:", err));

// 2. User Schema
const userSchema = new mongoose.Schema({
    name: { type: String, required: true },
    phone: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    coins: { type: Number, default: 1000 }
});
const User = mongoose.model('User', userSchema);

// 3. Auth Routes
app.post('/api/signup', async (req, res) => {
    try {
        const { name, phone, password } = req.body;
        const newUser = new User({ name, phone, password });
        await newUser.save();
        res.json({ success: true, name: newUser.name, coins: newUser.coins });
    } catch (e) { 
        res.json({ success: false, message: "Phone number already exists!" }); 
    }
});

app.post('/api/login', async (req, res) => {
    try {
        const user = await User.findOne({ phone: req.body.phone, password: req.body.password });
        if (user) {
            res.json({ success: true, name: user.name, coins: user.coins });
        } else {
            res.json({ success: false, message: "Invalid Phone or Password!" });
        }
    } catch (e) { res.json({ success: false }); }
});

// 4. Admin & Balance Routes
app.get('/api/admin/users', async (req, res) => {
    try {
        const users = await User.find({}, 'name phone coins');
        res.json(users);
    } catch (e) { res.status(500).send("Error"); }
});

app.post('/api/admin/update-coins', async (req, res) => {
    try {
        const { userId, amount } = req.body;
        const updatedUser = await User.findByIdAndUpdate(userId, { $inc: { coins: parseInt(amount) } }, { new: true });
        res.json({ success: true, newBalance: updatedUser.coins });
    } catch (e) { res.json({ success: false }); }
});

app.post('/api/game/update-balance', async (req, res) => {
    try {
        const { name, amount } = req.body;
        const user = await User.findOneAndUpdate({ name: name }, { $inc: { coins: parseInt(amount) } }, { new: true });
        res.json({ success: true, newBalance: user.coins });
    } catch (e) { res.json({ success: false }); }
});

// 5. Matchmaking
let waitingPlayers = [];
io.on('connection', (socket) => {
    socket.on('joinGame', (data) => {
        socket.userName = data.name;
        if (waitingPlayers.length > 0) {
            let opponent = waitingPlayers.shift();
            let roomId = `room_${Date.now()}`;
            socket.join(roomId); opponent.join(roomId);
            io.to(roomId).emit('gameStart', { players: [socket.userName, opponent.userName], isBot: false });
        } else {
            waitingPlayers.push(socket);
            setTimeout(() => {
                if (waitingPlayers.includes(socket)) {
                    waitingPlayers = waitingPlayers.filter(s => s !== socket);
                    socket.emit('gameStart', { players: [socket.userName, "Bot 1", "Bot 2", "Bot 3"], isBot: true });
                }
            }, 5000);
        }
    });
});

// 6. Start Server
const PORT = process.env.PORT || 10000;
server.listen(PORT, () => console.log(`Server Live on ${PORT}`));
