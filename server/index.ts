import express, { Request, Response } from 'express';
import http, { IncomingMessage } from 'http';
import url from 'url';
import WebSocket from 'ws';
import path from 'path';
import config from './config';
import { GameServer } from './game-server';
import { Player } from './player';

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

const gameServer = new GameServer();

wss.on('connection', (ws: WebSocket, req: IncomingMessage) => {
  const parameters = url.parse(req.url as string, true);
  const playerId = parameters.query.playerId as string;
  const player = new Player(playerId, ws);
  gameServer.registerPlayer(player);

  ws.on('message', (message: WebSocket.Data) => {
    try {
      gameServer.handleMessage(player, message);
    } catch (err) {
      player.sendError(`Error! Something went wrong.`);
    }
  });

  ws.on('close', () => {
    gameServer.handleDisconnect(player);
  });
});

app.use(express.static(path.join(__dirname, '../client/build')));

app.get('*', (req: Request, res: Response) => {
  res.sendFile(path.join(__dirname, '../client/build', 'index.html'));
});

server.listen(config.PORT, () => {
  console.log(`Server is running on port ${config.PORT}`);
  const urlPrefix = `http://localhost`;
  console.log(`Open: ${urlPrefix}:${config.PORT}/player/1`);
  console.log(`Open: ${urlPrefix}:${config.PORT}/player/2`);
});
