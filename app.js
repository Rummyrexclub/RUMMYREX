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

mongoose.connect(process.env.MONGO_URI).then(() => console.log("✅ DB CONNECTED"));

const User = mongoose.model('User', new mongoose.Schema({
    name: String, phone: { type: String, unique: true },
    password: String, coins: { type: Number, default: 1000 }
}));

let rooms = {};

io.on('connection', (socket) => {
    socket.on('joinGame', (data) => {
        const mode = parseInt(data.mode);
        let rId = `room_${socket.id}`;
        socket.join(rId);

        if(!rooms[rId]) {
            rooms[rId] = { 
                timer: 30, 
                turn: 0, // 0 is YOU, 1-5 are Bots
                totalPlayers: mode 
            };
            
            // Turn Management Logic
            setInterval(() => {
                if(rooms[rId].timer > 0) {
                    rooms[rId].timer--;
                } else {
                    // Turn Change Logic
                    rooms[rId].timer = 30;
                    rooms[rId].turn = (rooms[rId].turn + 1) % rooms[rId].totalPlayers;
                    
                    // Bot Move Signal
                    if(rooms[rId].turn !== 0) {
                        io.to(rId).emit('botMove', { botIndex: rooms[rId].turn });
                    }
                }
                io.to(rId).emit('updateState', { 
                    timer: rooms[rId].timer, 
                    turn: rooms[rId].turn 
                });
            }, 1000);
        }
        
        const bots = mode === 2 ? ["Opponent"] : ["Bot 1", "Bot 2", "Bot 3", "Bot 4", "Bot 5"];
        io.to(rId).emit('gameStart', { players: [data.name, ...bots], mode: mode });
    });
});

app.post('/api/login', async (req, res) => {
    const user = await User.findOne({ phone: req.body.phone, password: req.body.password });
    if(user) res.json({ success: true, name: user.name, coins: user.coins });
    else res.json({ success: false });
});

server.listen(process.env.PORT || 10000);
