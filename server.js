const express = require('express');
const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http, {
    cors: { origin: "*" }
});

app.use(express.static(__dirname + '/public'));

let players = {};

io.on('connection', (socket) => {
    console.log(`Người chơi kết nối: ${socket.id}`);
    
    // Tạo người chơi mới khi có kết nối
    players[socket.id] = {
        id: socket.id,
        x: 100,
        y: 400,
        color: `hsl(${Math.random() * 360}, 80%, 60%)`,
        currentFloor: 1
    };

    // Gửi danh sách người chơi hiện tại cho người mới vào
    socket.emit('currentPlayers', players);
    // Thông báo cho những người cũ biết có người mới
    socket.broadcast.emit('newPlayer', players[socket.id]);

    // Lắng nghe dữ liệu di chuyển từ client
    socket.on('playerMovement', (movementData) => {
        if (players[socket.id]) {
            players[socket.id].x = movementData.x;
            players[socket.id].y = movementData.y;
            players[socket.id].currentFloor = movementData.currentFloor;
            // Gửi vị trí mới này cho tất cả những người chơi khác
            socket.broadcast.emit('playerMoved', players[socket.id]);
        }
    });

    // Xử lý khi người chơi ngắt kết nối
    socket.on('disconnect', () => {
        console.log(`Người chơi rời phòng: ${socket.id}`);
        delete players[socket.id];
        io.emit('playerDisconnected', socket.id);
    });
});

const PORT = 3000;
http.listen(PORT, () => {
    console.log(`Server game đang chạy tại: http://localhost:${PORT}`);
});
