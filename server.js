const express = require("express");
const app = express();
const http = require("http").createServer(app);
const io = require("socket.io")(http);

app.use(express.static("public"));

const PORT = process.env.PORT || 3000;

let players = {};
let gameStarted = false;

let gameState = {
  players: {},
  pipes: []
};

// ---------------- RESET ----------------
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

// ---------------- COLLISION ----------------
function checkCollision(player, pipes) {
  for (let pipe of pipes) {

    let withinX = 70 > pipe.x && 50 < pipe.x + 40;

    let hitTop = player.y < pipe.gapY;
    let hitBottom = player.y + 20 > pipe.gapY + 120;

    if (withinX && (hitTop || hitBottom)) {
      return true;
    }
  }
  return false;
}

// ---------------- CONNECTION ----------------
io.on("connection", (socket) => {

  if (Object.keys(players).length >= 2) {
    socket.disconnect();
    return;
  }

  players[socket.id] = {
    y: 200,
    velocity: 0,
    ready: false,
    character: null
  };

  socket.emit("playerId", socket.id);

  socket.on("selectCharacter", (char) => {
    players[socket.id].character = char;
  });

  socket.on("ready", () => {
    players[socket.id].ready = true;

    const allReady =
      Object.values(players).length === 2 &&
      Object.values(players).every(p => p.ready && p.character);

    if (allReady) {
      gameStarted = true;
      resetGame();
    }
  });

  socket.on("jump", () => {
    if (gameStarted) {
      players[socket.id].velocity = -10;
    }
  });

  socket.on("disconnect", () => {
    delete players[socket.id];
    gameStarted = false;

    for (let id in players) {
      players[id].ready = false;
    }
  });
});

// ---------------- GAME LOOP ----------------
function gameLoop() {
  if (gameStarted) {

    for (let id in players) {
      let p = players[id];

      p.velocity += 0.6;
      p.velocity *= 0.98;
      p.y += p.velocity;

      if (p.y < 0) p.y = 0;
      if (p.y > 280) {
        p.y = 280;
        p.velocity = 0;
      }

      if (checkCollision(p, gameState.pipes)) {

        gameStarted = false;

        for (let pid in players) {
          players[pid].ready = false;
        }

        io.emit("gameOver");
        return;
      }
    }

    gameState.pipes.forEach(pipe => {
      pipe.x -= 2;
    });

    if (gameState.pipes[0].x < -60) {
      gameState.pipes.shift();
      gameState.pipes.push({
        x: 400,
        gapY: 100 + Math.random() * 200
      });
    }

    gameState.players = players;

    io.emit("gameState", gameState);
  }

  setTimeout(gameLoop, 1000 / 30);
}

gameLoop();

http.listen(PORT, () => {
  console.log("Server running:", PORT);
});
