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
.then(() => console.log("✅ DB Connected"));

const User = mongoose.model('User', new mongoose.Schema({
    name: String,
    phone: { type: String, unique: true },
    password: String,
    coins: { type: Number, default: 1000 }
}));

let rooms = {};


// ================= CARD FUNCTIONS =================

function createDeck() {
    const suits = ["♠","♥","♦","♣"];
    const values = ["A","2","3","4","5","6","7","8","9","10","J","Q","K"];
    let deck = [];

    for (let suit of suits) {
        for (let value of values) {
            deck.push(value + suit);
        }
    }
    return deck;
}

function shuffle(deck) {
    for (let i = deck.length - 1; i > 0; i--) {
        let j = Math.floor(Math.random() * (i + 1));
        [deck[i], deck[j]] = [deck[j], deck[i]];
    }
    return deck;
}

function distribute(playersCount, deck) {
    let players = [];

    for (let i = 0; i < playersCount; i++) {
        players.push({ cards: [], score: 0 });
    }

    for (let i = 0; i < 13; i++) {
        for (let j = 0; j < playersCount; j++) {
            players[j].cards.push(deck.pop());
        }
    }

    return players;
}


// ================= SOCKET =================

io.on('connection', (socket) => {

    socket.on('joinGame', (data) => {

        const mode = parseInt(data.mode) || 2;
        const roomId = "room_" + socket.id;

        socket.join(roomId);

        let deck = shuffle([...createDeck(), ...createDeck()]);
        let playersData = distribute(mode, deck);

        rooms[roomId] = {
            timer: 30,
            turn: 0,
            totalPlayers: mode,
            deck: deck,
            players: playersData,
            openCard: deck.pop()
        };

        const bots = mode === 2
            ? ["Opponent"]
            : ["Bot 1","Bot 2","Bot 3","Bot 4","Bot 5"];

        io.to(roomId).emit('gameStart', {
            players: [data.name, ...bots.slice(0, mode-1)],
            mode: mode,
            myCards: playersData[0].cards,
            openCard: rooms[roomId].openCard,
            turn: 0,
            timer: 30
        });

        const interval = setInterval(() => {

            if (!rooms[roomId]) return clearInterval(interval);

            if (rooms[roomId].timer > 0) {
                rooms[roomId].timer--;
            } else {
                rooms[roomId].timer = 30;
                rooms[roomId].turn =
                    (rooms[roomId].turn + 1) % rooms[roomId].totalPlayers;
            }

            io.to(roomId).emit('updateState', {
                turn: rooms[roomId].turn,
                timer: rooms[roomId].timer
            });

        }, 1000);
    });


    socket.on("drawCard", () => {
        const roomId = "room_" + socket.id;
        if(!rooms[roomId]) return;

        const card = rooms[roomId].deck.pop();
        rooms[roomId].players[0].cards.push(card);

        io.to(roomId).emit("cardDrawn", { card });
    });


    socket.on("discardCard", (data) => {
        const roomId = "room_" + socket.id;
        if(!rooms[roomId]) return;

        rooms[roomId].openCard = data.card;

        rooms[roomId].turn =
            (rooms[roomId].turn + 1) % rooms[roomId].totalPlayers;

        io.to(roomId).emit("cardDiscarded", {
            openCard: data.card,
            turn: rooms[roomId].turn
        });
    });

});


app.post('/api/login', async (req, res) => {
    const user = await User.findOne({
        phone: req.body.phone,
        password: req.body.password
    });

    if(user)
        res.json({ success: true, name: user.name, coins: user.coins });
    else
        res.json({ success: false });
});

server.listen(process.env.PORT || 10000);
