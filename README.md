# King's Corner Web Version

**Original project:** https://github.com/Give-a-Go/lan-tic-tac-toe

A simple multiplayer rack-and-pile card game built with Node.js, Express and Socket.IO. Two players draw, play cards on four shared stacks or build royal sequences, and explicitly end their turn when ready.

This is a vibe coded project. No vim shortcuts or emacs key chords were performed in making it. No APIs were looked up. Pure vibes.

## Overview

A head-to-head card game for two players. Each player has a private hand and both share a central field with four suit stacks and four royal slots.

## Rules

- Each player starts with 6 face-down cards only they can see.
- A central deck holds the remainder of the cards.
- Four side stacks are initialized with one non-royal card each.
- Corners hold royal foundations (King→Queen→Jack alternating colors, then empty, then next color).
- On their turn, a player:
  1. Draws one card from the central deck (if available).
  2. May place one card from hand onto a side stack if it is empty or the top card is opposite color and strictly lower rank.
  3. May place royals onto corner slots following the K→Q→J sequence with alternating colors.
  4. May move a sequence of cards (strict descending alternating colors) onto another side stack if legal.
- First to empty their hand wins.

## Architecture

- **Server**: Node.js with Express and Socket.io maintaining game state and enforcing rules.
- **Client**: Static HTML/CSS/JS served from `public/`, connecting via Socket.io.

## File Structure

```
server.js        # Game server
game.js          # Game logic module
PROJECT_DESCRIPTION.md
public/
  ├── index.html # UI layout
  ├── style.css  # Basic styling
  └── client.js  # Client-side Socket.io and UI handlers
