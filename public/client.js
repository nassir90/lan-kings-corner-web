const socket = io();
const handEl = document.getElementById('hand');
const boardEl = document.getElementById('board');
// drop zones are cells with class .stack or .royal
const drawBtn = document.getElementById('draw');
const endTurnBtn = document.getElementById('endTurn');
const deckCountEl = document.getElementById('deckCount');
const msgEl = document.getElementById('message');
let clientStacks = [];
let myId = null, currentTurn = null;
const EMOJI = {hearts: '♥️', diamonds: '♦️', clubs: '♣️', spades: '♠️'};

function renderHand(cards){
  handEl.innerHTML = '';
  cards.forEach(c => {
    let d = document.createElement('div');
    d.className = `card ${c.color}`;
    const rankLabel = c.rank===11 ? 'J' : c.rank===12 ? 'Q' : c.rank===13 ? 'K' : c.rank;
    d.textContent = `${rankLabel}${EMOJI[c.suit]}`;
    d.draggable = true;
    d.addEventListener('dragstart', e => {
      e.dataTransfer.setData('card', JSON.stringify(c));
    });
    handEl.appendChild(d);
  });
}

function renderStacks(stacks){
  clientStacks = stacks;
  stacks.forEach((s, i) => {
    const cell = boardEl.querySelector(`.cell.stack[data-idx="${i}"]`);
    cell.innerHTML = '';
    s.forEach((card, idx) => {
      let d = document.createElement('div');
      d.className = `card ${card.color}`;
      const rankLabel = card.rank===11 ? 'J' : card.rank===12 ? 'Q' : card.rank===13 ? 'K' : card.rank;
      d.textContent = `${rankLabel}${EMOJI[card.suit]}`;
      d.draggable = true;
      d.addEventListener('dragstart', e => {
        e.dataTransfer.setData('move', JSON.stringify({ from: i, pos: idx }));
      });
      cell.appendChild(d);
    });
  });
}

function renderRoyals(royals){
  royals.forEach((col, i) => {
    const cell = boardEl.querySelector(`.cell.royal[data-idx="${i}"]`);
    cell.innerHTML = '';
    col.forEach(card => {
      let d = document.createElement('div');
      d.className = `card ${card.color}`;
      const rankLabel = card.rank===11 ? 'J' : card.rank===12 ? 'Q' : card.rank===13 ? 'K' : card.rank;
      d.textContent = `${rankLabel}${EMOJI[card.suit]}`;
      cell.appendChild(d);
    });
  });
}

// Setup drag-and-drop handlers for stacks and royals
function setupDrops(){
  boardEl.querySelectorAll('.cell.stack').forEach(cell => {
    cell.addEventListener('dragover', e => e.preventDefault());
    cell.addEventListener('drop', e => {
      e.preventDefault();
      const move = e.dataTransfer.getData('move');
      const to = parseInt(cell.dataset.idx);
      if (move) {
        const {from, pos} = JSON.parse(move);
        const count = clientStacks[from].length - pos;
        socket.emit('move', {from, to, count});
      } else {
        let card = JSON.parse(e.dataTransfer.getData('card'));
        socket.emit('play', card, to);
      }
    });
  });
  boardEl.querySelectorAll('.cell.royal').forEach(cell => {
    cell.addEventListener('dragover', e => e.preventDefault());
    cell.addEventListener('drop', e => {
      let card = JSON.parse(e.dataTransfer.getData('card'));
      let idx = parseInt(cell.dataset.idx);
      socket.emit('playRoyal', card, idx);
    });
  });
}

drawBtn.onclick = _ => socket.emit('draw');
endTurnBtn.onclick = _ => socket.emit('endTurn');

socket.on('hand', cards => { renderHand(cards); setupDrops(); });
socket.on('stacks', stacks => { renderStacks(stacks); setupDrops(); });
socket.on('royals', royals => { renderRoyals(royals); setupDrops(); });
socket.on('deckCount', c=>deckCountEl.textContent=`Deck: ${c}`);
socket.on('message', m=>msgEl.textContent=m);
socket.on('currentTurn', id => {
  currentTurn = id;
  drawBtn.disabled = myId !== id;
  endTurnBtn.disabled = myId !== id;
  msgEl.textContent = myId===id ? 'Your turn' : 'Waiting...';
});
socket.on('connect', () => { myId = socket.id; });
