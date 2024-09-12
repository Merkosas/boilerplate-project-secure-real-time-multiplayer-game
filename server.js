require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const expect = require('chai');
const socket = require('socket.io');
const cors = require('cors');
const helmet = require('helmet');
const nocache = require('nocache');

const fccTestingRoutes = require('./routes/fcctesting.js');
const runner = require('./test-runner.js');

const app = express();

app.use('/public', express.static(process.cwd() + '/public'));
app.use('/assets', express.static(process.cwd() + '/assets'));

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Security headers
app.use(helmet());
app.use(helmet.noSniff());
app.use(helmet.xssFilter());
app.use(nocache());
app.use((req, res, next) => {
  res.setHeader('X-Powered-By', 'PHP 7.4.3');
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');
  res.setHeader('Surrogate-Control', 'no-store');
  next();
});

//For FCC testing purposes and enables user to connect from outside the hosting platform
app.use(cors({ origin: '*' }));

// Index page (static HTML)
app.route('/')
  .get(function (req, res) {
    res.sendFile(process.cwd() + '/views/index.html');
  });

//For FCC testing purposes
fccTestingRoutes(app);

// 404 Not Found Middleware
app.use(function (req, res, next) {
  res.status(404)
    .type('text')
    .send('Not Found');
});

const portNum = process.env.PORT || 3000;

// Set up server and tests
const server = app.listen(portNum, () => {
  console.log(`Listening on port ${portNum}`);
  if (process.env.NODE_ENV === 'test') {
    console.log('Running Tests...');
    setTimeout(function () {
      try {
        runner.run();
      } catch (error) {
        console.log('Tests are not valid:');
        console.error(error);
      }
    }, 1500);
  }
});

const io = socket(server);

let players = [];
let collectibles = [];

io.on('connection', async (socket) => {
  console.log('New player connected');

  // Dynamically import Player and Collectible classes
  const { default: Player } = await import('./public/Player.mjs');
  const { default: Collectible } = await import('./public/Collectible.mjs');

  // Create a new player
  const newPlayer = new Player({ x: 100, y: 100, score: 0, id: socket.id });
  players.push(newPlayer);

  // Send initial game state to the new player
  socket.emit('updateGameState', { players, collectibles });

  // Handle player movement
  socket.on('movePlayer', (direction) => {
    const player = players.find(p => p.id === socket.id);
    if (player) {
      player.movePlayer(direction, 5);
      io.emit('updateGameState', { players, collectibles });
    }
  });

  // Handle player disconnect
  socket.on('disconnect', () => {
    console.log('Player disconnected');
    players = players.filter(p => p.id !== socket.id);
    io.emit('updateGameState', { players, collectibles });
  });
});

module.exports = app; // For testing
