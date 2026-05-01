const socket = io();

let playerId = null;
let gameState = null;
let selectedChar = null;

const canvasTop = document.getElementById("canvasTop");
const canvasBottom = document.getElementById("canvasBottom");

const ctxTop = canvasTop.getContext("2d");
const ctxBottom = canvasBottom.getContext("2d");

canvasTop.width = canvasBottom.width = 400;
canvasTop.height = canvasBottom.height = 300;

socket.on("playerId", (id) => {
  playerId = id;
});

function selectChar(char) {
  selectedChar = char;
  socket.emit("selectCharacter", char);
}

function ready() {
  if (!selectedChar) {
    alert("Karakter seç!");
    return;
  }

  socket.emit("ready");
  document.getElementById("menu").classList.add("hidden");
  document.getElementById("game").classList.remove("hidden");
}

socket.on("gameState", (state) => {
  gameState = state;
});

document.addEventListener("click", () => {
  socket.emit("jump");
});

function drawPlayer(ctx, player) {
  ctx.fillStyle = player.character === "ceylan" ? "brown" : "green";
  ctx.fillRect(50, player.y, 20, 20);
}

function drawPipes(ctx, pipes) {
  ctx.fillStyle = "green";

  pipes.forEach((pipe) => {
    ctx.fillRect(pipe.x, 0, 40, pipe.gapY);
    ctx.fillRect(pipe.x, pipe.gapY + 120, 40, 400);
  });
}

function render() {
  if (!gameState) return;

  ctxTop.clearRect(0, 0, 400, 300);
  ctxBottom.clearRect(0, 0, 400, 300);

  let ids = Object.keys(gameState.players);

  if (ids.length < 2) return;

  let p1 = gameState.players[ids[0]];
  let p2 = gameState.players[ids[1]];

  drawPipes(ctxTop, gameState.pipes);
  drawPipes(ctxBottom, gameState.pipes);

  drawPlayer(ctxTop, p1);
  drawPlayer(ctxBottom, p2);

  requestAnimationFrame(render);
}

render();
