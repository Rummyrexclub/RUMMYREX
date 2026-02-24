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

// Matchmaking logic
let waitingPlayers = [];

io.on('connection', (socket) => {
    socket.on('joinGame', (data) => {
        socket.userName = data.name;
        
        if (waitingPlayers.length > 0) {
            let opponent = waitingPlayers.shift();
            let roomId = `room_${Date.now()}`;
            socket.join(roomId);
            opponent.join(roomId);
            io.to(roomId).emit('gameStart', { players: [socket.userName, opponent.userName], isBot: false });
        } else {
            waitingPlayers.push(socket);
            setTimeout(() => {
                if (waitingPlayers.includes(socket)) {
                    waitingPlayers = waitingPlayers.filter(s => s !== socket);
                    socket.emit('gameStart', { players: [socket.userName, "Bot 1", "Bot 2", "Bot 3"], isBot: true });
                }
            }, 4000); // 4 seconds aagi evaru lekapothe Bots ostharu
        }
    });
});

app.post('/api/game/update-balance', async (req, res) => {
    const { name, amount } = req.body;
    try {
        const user = await User.findOneAndUpdate({ name: name }, { $inc: { coins: parseInt(amount) } }, { new: true });
        res.json({ success: true, newBalance: user.coins });
    } catch (e) { res.status(500).json({ success: false }); }
});

app.post('/api/login', async (req, res) => {
    const user = await User.findOne(req.body);
    if (user) res.json({ success: true, name: user.name, coins: user.coins });
    else res.json({ success: false });
});

server.listen(process.env.PORT || 10000);
