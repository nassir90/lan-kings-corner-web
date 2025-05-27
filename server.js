const express = require("express");
const http = require("http");
const socketIo = require("socket.io");
const os = require("os");
const app = express();
const server = http.createServer(app);
const io = socketIo(server);

app.use(express.static("public")); // Serve frontend files from "public" folder

const PORT = 5001;

let players = {}; // Store player sockets
let board = Array(9).fill(null);
let currentTurn = "X";

io.on("connection", (socket) => {
  console.log("A player connected:", socket.id);

  if (Object.keys(players).length < 2) {
    let symbol = Object.keys(players).length === 0 ? "X" : "O";
    players[socket.id] = symbol;
    socket.emit("playerSymbol", symbol);
    io.emit("updateBoard", board);
  } else {
    socket.emit("message", "Game full! Wait for players to finish.");
    socket.disconnect();
  }

  socket.on("makeMove", (index) => {
    if (players[socket.id] !== currentTurn || board[index] !== null) return;

    board[index] = currentTurn;
    currentTurn = currentTurn === "X" ? "O" : "X";
    io.emit("updateBoard", board);

    // Check for a winner
    let winner = checkWinner();
    if (winner) {
      io.emit("gameOver", `${winner} wins!`);
      resetGame();
    }
  });

  socket.on("disconnect", () => {
    console.log("A player disconnected:", socket.id);
    delete players[socket.id];
    resetGame();
    io.emit("message", "A player left. Game reset.");
  });
});

function checkWinner() {
  const winPatterns = [
    [0, 1, 2],
    [3, 4, 5],
    [6, 7, 8],
    [0, 3, 6],
    [1, 4, 7],
    [2, 5, 8],
    [0, 4, 8],
    [2, 4, 6],
  ];
  for (let pattern of winPatterns) {
    const [a, b, c] = pattern;
    if (board[a] && board[a] === board[b] && board[a] === board[c]) {
      return board[a];
    }
  }
  return board.includes(null) ? null : "Draw";
}

function resetGame() {
  board = Array(9).fill(null);
  currentTurn = "X";
}

function getLocalIP() {
  const interfaces = os.networkInterfaces();

  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name]) {
      // Skip over internal (i.e. 127.0.0.1) and non-IPv4 addresses
      if (iface.family === "IPv4" && !iface.internal) {
        return iface.address;
      }
    }
  }

  return "127.0.0.1"; // fallback
}

server.listen(PORT, () => {
  console.log("Server running on http://" + getLocalIP() + ":" + PORT);
});
