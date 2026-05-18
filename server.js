const express = require('express');
const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http, {
    cors: { origin: "*" }
});

app.use(express.static(__dirname + '/public'));

let players = {};
let globalHighestFloor = 1; // Lưu kỷ lục tầng cao nhất toàn phòng

io.on('connection', (socket) => {
    console.log(`Người chơi kết nối: ${socket.id}`);
    
    players[socket.id] = {
        id: socket.id,
        x: 400,
        y: 500,
        color: `hsl(${Math.random() * 360}, 85%, 60%)`,
        currentFloor: 1
    };

    socket.emit('currentPlayers', { players, globalHighestFloor });
    socket.broadcast.emit('newPlayer', players[socket.id]);

    socket.on('playerMovement', (movementData) => {
        if (players[socket.id]) {
            players[socket.id].x = movementData.x;
            players[socket.id].y = movementData.y;
            players[socket.id].currentFloor = movementData.currentFloor;
            
            // Nếu có người phá kỷ lục phòng, cập nhật và thông báo cho tất cả
            if (movementData.currentFloor > globalHighestFloor) {
                globalHighestFloor = movementData.currentFloor;
                io.emit('newHighScore', globalHighestFloor);
            }

            socket.broadcast.emit('playerMoved', players[socket.id]);
        }
    });

    socket.on('disconnect', () => {
        console.log(`Người chơi rời phòng: ${socket.id}`);
        delete players[socket.id];
        io.emit('playerDisconnected', socket.id);
    });
});

const PORT = process.env.PORT || 3000;
http.listen(PORT, "0.0.0.0", () => {
    console.log(`Server Endless Parkour đang chạy tại cổng: ${PORT}`);
});
