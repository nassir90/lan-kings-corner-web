// Minimal game logic for multiplayer card game
class Game {
  constructor() {
    this.reset();
  }
  reset() {
    // deck & piles
    this.deck = this.createDeck();
    this.shuffle();
    this.stacks = [[], [], [], []];
    this.royals = [[], [], [], []];
    // players & hands & turn
    this.players = [];
    this.hands = {};
    this.currentTurn = null;
  }
  createDeck() {
    const suits = ['hearts','diamonds','clubs','spades'];
    const colors = {hearts:'red',diamonds:'red',clubs:'black',spades:'black'};
    const ranks = [1,2,3,4,5,6,7,8,9,10,11,12,13];
    let deck = [];
    suits.forEach(s => ranks.forEach(r => deck.push({suit:s, rank:r, color:colors[s]})));
    return deck;
  }
  shuffle() {
    for (let i = this.deck.length - 1; i > 0; i--) {
      let j = Math.floor(Math.random() * (i + 1));
      [this.deck[i], this.deck[j]] = [this.deck[j], this.deck[i]];
    }
  }
  addPlayer(id) {
    if (this.players.length >= 2) return false;
    // register player
    this.players.push(id);
    this.hands[id] = this.deck.splice(0, 6);
    // when two players, init stacks & set turn
    if (this.players.length === 2) {
      for (let i = 0; i < 4; i++) {
        let idx = this.deck.findIndex(c => c.rank < 11);
        this.stacks[i].push(this.deck.splice(idx, 1)[0]);
      }
      this.currentTurn = this.players[0];
    }
    return true;
  }
  draw(id) {
    // only current player can draw
    if (id !== this.currentTurn) return false;
    const card = this.deck.shift();
    if (card) this.hands[id].push(card);
    return card;
  }
  play(id, card, stackIdx) {
    // check turn
    if (id !== this.currentTurn) return false;
    if (!this.hands[id]) return false;
    const hand = this.hands[id];
    const i = hand.findIndex(c => c.suit === card.suit && c.rank === card.rank);
    if (i < 0) return false;
    const stack = this.stacks[stackIdx];
    const top = stack[stack.length - 1];
    if (!top || (top.color !== card.color && top.rank > card.rank)) {
      stack.push(hand.splice(i, 1)[0]);
      return true;
    }
    return false;
  }
  playRoyal(id, card, royalIdx) {
    // check turn
    if (id !== this.currentTurn) return false;
    if (!this.hands[id]) return false;
    const hand = this.hands[id];
    const i = hand.findIndex(c => c.suit === card.suit && c.rank === card.rank);
    if (i < 0) return false;
    const pile = this.royals[royalIdx];
    const len = pile.length;
    if ((len === 0 && card.rank !== 13) ||
        (len === 1 && (card.rank !== 12 || card.color === pile[0].color)) ||
        (len === 2 && (card.rank !== 11 || card.color === pile[1].color))) {
      return false;
    }
    pile.push(hand.splice(i, 1)[0]);
    return true;
  }
  move(count, fromIdx, toIdx) {
    // only on turn
    const id = this.currentTurn;
    // no id here, assume server enforces player on event
    const from = this.stacks[fromIdx];
    const to = this.stacks[toIdx];
    const tail = from.splice(from.length - count, count);
    to.push(...tail);
    return true;
  }
  switchTurn() {
    const [a, b] = this.players;
    this.currentTurn = this.currentTurn === a ? b : a;
  }
  getCurrentTurn() { return this.currentTurn; }
  getStacks() { return this.stacks; }
}
module.exports = Game;
