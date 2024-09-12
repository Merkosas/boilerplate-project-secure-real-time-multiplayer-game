import Player from './Player.mjs';
import Collectible from './Collectible.mjs';

const socket = io();
const canvas = document.getElementById('game-window');
const context = canvas.getContext('2d');

// Initialize game state
let players = [];
let collectibles = [];

socket.on('connect', () => {
  console.log('Connected to server');
});

socket.on('updateGameState', (gameState) => {
  players = gameState.players;
  collectibles = gameState.collectibles;
  renderGame();
});

function renderGame() {
  context.clearRect(0, 0, canvas.width, canvas.height);

  // Render players
  players.forEach(player => {
    context.fillStyle = 'blue';
    context.fillRect(player.x, player.y, 20, 20);
  });

  // Render collectibles
  collectibles.forEach(item => {
    context.fillStyle = 'green';
    context.fillRect(item.x, item.y, 10, 10);
  });
}

// Handle player movement
document.addEventListener('keydown', (event) => {
  let direction;
  switch (event.key) {
    case 'ArrowUp':
    case 'w':
      direction = 'up';
      break;
    case 'ArrowDown':
    case 's':
      direction = 'down';
      break;
    case 'ArrowLeft':
    case 'a':
      direction = 'left';
      break;
    case 'ArrowRight':
    case 'd':
      direction = 'right';
      break;
  }
  if (direction) {
    socket.emit('movePlayer', direction);
  }
});
