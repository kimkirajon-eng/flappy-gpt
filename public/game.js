const socket = io();

let playerId = null;
let gameState = null;
let selectedChar = null;
let gameStarted = false;

const statusText = document.getElementById("status");

const canvasTop = document.getElementById("canvasTop");
const canvasBottom = document.getElementById("canvasBottom");

const ctxTop = canvasTop.getContext("2d");
const ctxBottom = canvasBottom.getContext("2d");

canvasTop.width = canvasBottom.width = 400;
canvasTop.height = canvasBottom.height = 300;

socket.on("playerId", (id) => {
  playerId = id;
});

// ---------------- KARAKTER ----------------
function selectChar(char) {
  selectedChar = char;
  socket.emit("selectCharacter", char);

  document.getElementById("ceylanCard").classList.remove("selected");
  document.getElementById("hakkiCard").classList.remove("selected");

  document.getElementById(char + "Card").classList.add("selected");

  statusText.innerText = "Hazır ol ve bekle...";
}

// ---------------- READY ----------------
function ready() {
  if (!selectedChar) {
    alert("Karakter seç!");
    return;
  }

  socket.emit("ready");
  statusText.innerText = "Rakip bekleniyor...";
}

// ---------------- GAME STATE ----------------
socket.on("gameState", (state) => {
  gameState = state;

  // oyun başladıysa ekrana geç
  if (!gameStarted && Object.keys(state.players).length === 2) {
    gameStarted = true;

    document.getElementById("menu").classList.add("hidden");
    document.getElementById("game").classList.remove("hidden");
  }
});

// ---------------- INPUT ----------------
document.addEventListener("click", () => {
  if (gameStarted) {
    socket.emit("jump");
  }
});

// ---------------- DRAW ----------------
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

// ---------------- RENDER ----------------
function render() {
  requestAnimationFrame(render);

  if (!gameState) return;

  let ids = Object.keys(gameState.players);
  if (ids.length < 2) return;

  let me = gameState.players[playerId];
  let otherId = ids.find(id => id !== playerId);
  let other = gameState.players[otherId];

  ctxTop.clearRect(0, 0, 400, 300);
  ctxBottom.clearRect(0, 0, 400, 300);

  drawPipes(ctxTop, gameState.pipes);
  drawPipes(ctxBottom, gameState.pipes);

  drawPlayer(ctxTop, other);
  drawPlayer(ctxBottom, me);
}

render();
