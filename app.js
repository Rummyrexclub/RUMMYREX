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

// 2. User Schema (Phone Unique ga undali)
const userSchema = new mongoose.Schema({
    name: { type: String, required: true },
    phone: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    coins: { type: Number, default: 1000 }
});
const User = mongoose.model('User', userSchema);

// 3. Login Route (Fixed Variable Mismatch)
app.post('/api/login', async (req, res) => {
    try {
        const { phone, password } = req.body;
        // Phone and Password rendu check chesthunnam
        const user = await User.findOne({ phone: phone, password: password });
        
        if (user) {
            res.json({ success: true, name: user.name, coins: user.coins });
        } else {
            res.json({ success: false, message: "Invalid Phone or Password! Check Admin Panel." });
        }
    } catch (e) { 
        res.json({ success: false, message: "Server Error during login!" }); 
    }
});

// 4. Signup Route
app.post('/api/signup', async (req, res) => {
    try {
        const { name, phone, password } = req.body;
        const newUser = new User({ name, phone, password });
        await newUser.save();
        res.json({ success: true, name: newUser.name, coins: newUser.coins });
    } catch (e) { 
        res.json({ success: false, message: "Signup Failed! Number already exists." }); 
    }
});

// 5. Admin Panel Routes
app.get('/api/admin/users', async (req, res) => {
    try {
        const users = await User.find({}, 'name phone coins');
        res.json(users);
    } catch (e) { res.status(500).send("Error fetching users"); }
});

app.post('/api/admin/update-coins', async (req, res) => {
    try {
        const { userId, amount } = req.body;
        await User.findByIdAndUpdate(userId, { $inc: { coins: parseInt(amount) } });
        res.json({ success: true });
    } catch (e) { res.json({ success: false }); }
});

// 6. Game Balance Update
app.post('/api/game/update-balance', async (req, res) => {
    try {
        const { name, amount } = req.body;
        const user = await User.findOneAndUpdate({ name: name }, { $inc: { coins: parseInt(amount) } }, { new: true });
        res.json({ success: true, newBalance: user.coins });
    } catch (e) { res.json({ success: false }); }
});

// 7. Hybrid Matchmaking Logic
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

const PORT = process.env.PORT || 10000;
server.listen(PORT, () => console.log(`SERVER RUNNING ON PORT ${PORT}`));
