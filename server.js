// Server setup with Express and Socket.io
const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const Game = require('./game');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);
app.use(express.static('public'));
const PORT = process.env.PORT || 5001;

const game = new Game();

io.on('connection', socket => {
  console.log('Connect', socket.id);
  if (!game.addPlayer(socket.id)) {
    socket.emit('message', 'Game full');
    return socket.disconnect();
  }
  // send initial state
  socket.emit('hand', game.hands[socket.id]);
  io.emit('stacks', game.getStacks());
  io.emit('royals', game.royals);
  io.emit('deckCount', game.deck.length);
  io.emit('currentTurn', game.getCurrentTurn());

  socket.on('draw', () => {
    const ok = game.draw(socket.id);
    if (!ok) { socket.emit('message', 'Not your turn'); return; }
    socket.emit('hand', game.hands[socket.id]);
    io.emit('deckCount', game.deck.length);
    io.emit('currentTurn', game.getCurrentTurn());
  });

  socket.on('play', ({ suit, rank }, stackIdx) => {
    const ok = game.play(socket.id, { suit, rank }, stackIdx);
    if (!ok) {
      const reason = game.getLastError() || 'Invalid move';
      socket.emit('message', reason);
      return;
    }
    io.emit('stacks', game.getStacks());
    socket.emit('hand', game.hands[socket.id]);
    io.emit('currentTurn', game.getCurrentTurn());
  });

  socket.on('move', ({ count, from, to }) => {
    if (count > 0 && game.stacks[from].length >= count) {
      game.move(count, from, to);
      io.emit('stacks', game.getStacks());
      io.emit('currentTurn', game.getCurrentTurn());
    } else {
      socket.emit('message', 'Invalid move');
    }
  });

  socket.on('playRoyal', ({ suit, rank }, royalIdx) => {
    const ok = game.playRoyal(socket.id, { suit, rank }, royalIdx);
    if (!ok) {
      const reason = game.getLastError() || 'Invalid move';
      socket.emit('message', reason);
      return;
    }
    io.emit('royals', game.royals);
    socket.emit('hand', game.hands[socket.id]);
    io.emit('currentTurn', game.getCurrentTurn());
  });

  socket.on('endTurn', () => {
    if (socket.id !== game.getCurrentTurn()) {
      socket.emit('message', 'Not your turn');
      return;
    }
    game.switchTurn();
    io.emit('currentTurn', game.getCurrentTurn());
  });

  socket.on('disconnect', () => {
    console.log('Disconnect', socket.id);
    delete game.hands[socket.id];
    game.reset();
    io.emit('message', 'Reset');
  });
});

server.listen(PORT, () => console.log('Running on', PORT));
