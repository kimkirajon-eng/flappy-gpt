const express = require("express");
const app = express();
const http = require("http").createServer(app);
const io = require("socket.io")(http, {
  cors: {
    origin: "*"
  }
});

app.use(express.static("public"));

const PORT = process.env.PORT || 3000;

let players = {};
let gameStarted = false;

let gameState = {
  players: {},
  pipes: []
};

// ------------------ OYUN RESET ------------------
function resetGame() {
  gameState.pipes = [];

  let startX = 400;

  for (let i = 0; i < 5; i++) {
    gameState.pipes.push({
      x: startX + i * 250,
      gapY: 100 + Math.random() * 200
    });
  }

  for (let id in players) {
    players[id].y = 200;
    players[id].velocity = 0;
  }
}

// ------------------ CONNECTION ------------------
io.on("connection", (socket) => {
  console.log("Yeni kullanıcı:", socket.id);

  // max 2 kişi
  if (Object.keys(players).length >= 2) {
    socket.emit("full");
    socket.disconnect();
    return;
  }

  // oyuncu oluştur
  players[socket.id] = {
    y: 200,
    velocity: 0,
    ready: false,
    character: null
  };

  socket.emit("playerId", socket.id);

  // ------------------ KARAKTER ------------------
  socket.on("selectCharacter", (char) => {
    if (players[socket.id]) {
      players[socket.id].character = char;
    }
  });

  // ------------------ READY ------------------
  socket.on("ready", () => {
    if (!players[socket.id]) return;

    players[socket.id].ready = true;

    const playerList = Object.values(players);

    const allReady =
      playerList.length === 2 &&
      playerList.every(p => p.ready && p.character);

    if (allReady) {
      console.log("Oyun başlıyor");
      gameStarted = true;
      resetGame();
    }
  });

  // ------------------ JUMP ------------------
  socket.on("jump", () => {
    if (!gameStarted) return;

    if (players[socket.id]) {
      players[socket.id].velocity = -8;
    }
  });

  // ------------------ DISCONNECT ------------------
  socket.on("disconnect", () => {
    console.log("Çıktı:", socket.id);

    delete players[socket.id];

    // oyun reset
    gameStarted = false;

    // kalan oyuncuların ready'sini sıfırla
    for (let id in players) {
      players[id].ready = false;
    }
  });
});

// ------------------ GAME LOOP ------------------
function gameLoop() {
  if (gameStarted) {

    // physics
    for (let id in players) {
      let p = players[id];

      p.velocity += 0.5; // gravity
      p.y += p.velocity;

      // yere çarpmasın diye limit
      if (p.y > 280) {
        p.y = 280;
        p.velocity = 0;
      }

      if (p.y < 0) {
        p.y = 0;
        p.velocity = 0;
      }
    }

    // pipe hareketi
    gameState.pipes.forEach(pipe => {
      pipe.x -= 2;
    });

    // pipe recycle
    if (gameState.pipes.length && gameState.pipes[0].x < -60) {
      gameState.pipes.shift();
      gameState.pipes.push({
        x: 400,
        gapY: 100 + Math.random() * 200
      });
    }

    // state güncelle
    gameState.players = players;

    io.emit("gameState", gameState);
  }

  setTimeout(gameLoop, 1000 / 30);
}

gameLoop();

// ------------------ SERVER START ------------------
http.listen(PORT, () => {
  console.log("Server çalışıyor:", PORT);
});
app.use(express.static("public"));
