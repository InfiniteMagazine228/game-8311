const express = require('express');
const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http, {
    cors: { origin: "*" }
});

// Chỉ định thư mục public chứa giao diện game tĩnh
app.use(express.static(__dirname + '/public'));

let players = {};
let globalHighestFloor = 1; // Lưu kỷ lục tầng cao nhất của phòng chơi

io.on('connection', (socket) => {
    console.log(`Người chơi kết nối: ${socket.id}`);
    
    // Khởi tạo thông tin người chơi mới
    players[socket.id] = {
        id: socket.id,
        x: 400,
        y: 500,
        color: `hsl(${Math.random() * 360}, 85%, 60%)`,
        currentFloor: 1
    };

    // Gửi dữ liệu hiện tại cho người chơi mới tham gia
    socket.emit('currentPlayers', { players, globalHighestFloor });
    
    // Thông báo cho những người cũ biết có thành viên mới
    socket.broadcast.emit('newPlayer', players[socket.id]);

    // Lắng nghe dữ liệu di chuyển liên tục từ người chơi
    socket.on('playerMovement', (movementData) => {
        if (players[socket.id]) {
            players[socket.id].x = movementData.x;
            players[socket.id].y = movementData.y;
            players[socket.id].currentFloor = movementData.currentFloor;
            
            // Xử lý kỷ lục phòng chơi nếu có người leo cao hơn
            if (movementData.currentFloor > globalHighestFloor) {
                globalHighestFloor = movementData.currentFloor;
                io.emit('newHighScore', globalHighestFloor);
            }

            // Phát lại vị trí mới cho những người chơi khác biết để vẽ lên màn hình
            socket.broadcast.emit('playerMoved', players[socket.id]);
        }
    });

    // Xử lý khi người chơi đóng tab hoặc mất mạng
    socket.on('disconnect', () => {
        console.log(`Người chơi rời phòng: ${socket.id}`);
        delete players[socket.id];
        io.emit('playerDisconnected', socket.id);
    });
});

// BẮT BUỘC TRÊN CLOUD: Lấy cổng động do Railway cấp, nếu chạy local sẽ dùng cổng 3000
const PORT = process.env.PORT || 8080;
http.listen(PORT, "0.0.0.0", () => {
    console.log(`Server Endless Parkour đang vận hành tại cổng: ${PORT}`);
});
