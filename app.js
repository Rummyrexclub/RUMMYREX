const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const mongoose = require('mongoose');
const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "*" } });

app.use(express.static('public'));

// Game logic setup
let activeGames = {};

io.on('connection', (socket) => {
    socket.on('joinGame', (data) => {
        let roomId = "official_room";
        socket.join(roomId);

        // Turn management & Global Timer logic
        if (!activeGames[roomId]) {
            activeGames[roomId] = { timer: 30, turn: 0 };
            setInterval(() => {
                if (activeGames[roomId].timer > 0) {
                    activeGames[roomId].timer--;
                    io.to(roomId).emit('timerSync', activeGames[roomId].timer);
                } else {
                    activeGames[roomId].timer = 30; // Auto reset
                }
            }, 1000);
        }
        socket.emit('gameStart', { status: 'live' });
    });
});

server.listen(process.env.PORT || 10000, () => console.log("Engine Running"));
