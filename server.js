const express = require("express");
const app = express();
const http = require("http").createServer(app);
const io = require("socket.io")(http);

app.use(express.static("public"));

let players = {};
let gameStarted = false;

let gameState = {
  players: {},
  pipes: [],
};

function resetGame() {
  gameState.pipes = [];
  let x = 400;

  for (let i = 0; i < 5; i++) {
    gameState.pipes.push({
      x: x + i * 250,
      gapY: 100 + Math.random() * 200,
    });
  }
}

io.on("connection", (socket) => {
  console.log("user connected");

  if (Object.keys(players).length >= 2) {
    socket.disconnect();
    return;
  }

  players[socket.id] = {
    y: 200,
    velocity: 0,
    ready: false,
    character: null,
  };

  socket.emit("playerId", socket.id);

  socket.on("selectCharacter", (char) => {
    players[socket.id].character = char;
  });

  socket.on("ready", () => {
    players[socket.id].ready = true;

    const allReady =
      Object.values(players).length === 2 &&
      Object.values(players).every((p) => p.ready);

    if (allReady) {
      gameStarted = true;
      resetGame();

      for (let id in players) {
        players[id].y = 200;
        players[id].velocity = 0;
      }
    }
  });

  socket.on("jump", () => {
    if (gameStarted) {
      players[socket.id].velocity = -8;
    }
  });

  socket.on("disconnect", () => {
    delete players[socket.id];
    gameStarted = false;
  });
});

function gameLoop() {
  if (gameStarted) {
    for (let id in players) {
      let p = players[id];
      p.velocity += 0.5;
      p.y += p.velocity;
    }

    gameState.players = players;

    gameState.pipes.forEach((pipe) => {
      pipe.x -= 2;
    });

    if (gameState.pipes[0].x < -50) {
      gameState.pipes.shift();
      gameState.pipes.push({
        x: 400,
        gapY: 100 + Math.random() * 200,
      });
    }

    io.emit("gameState", gameState);
  }

  setTimeout(gameLoop, 1000 / 30);
}

gameLoop();

http.listen(3000, () => {
  console.log("Server running on port 3000");
});
