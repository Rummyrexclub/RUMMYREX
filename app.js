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

// 3. Auth Routes (Signup & Login)
app.post('/api/signup', async (req, res) => {
    try {
        const { name, phone, password } = req.body;
        const newUser = new User({ name, phone, password });
        await newUser.save();
        res.json({ success: true, name: newUser.name, coins: newUser.coins });
    } catch (e) { 
        res.json({ success: false, message: "Phone number already exists or invalid data!" }); 
    }
});

app.post('/api/login', async (req, res) => {
    try {
        const user = await User.findOne({
