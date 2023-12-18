"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const http_1 = __importDefault(require("http"));
const url_1 = __importDefault(require("url"));
const ws_1 = __importDefault(require("ws"));
const path_1 = __importDefault(require("path"));
const config_1 = __importDefault(require("./config"));
const game_server_1 = require("./game-server");
const player_1 = require("./player");
const app = (0, express_1.default)();
const server = http_1.default.createServer(app);
const wss = new ws_1.default.Server({ server });
const gameServer = new game_server_1.GameServer();
wss.on('connection', (ws, req) => {
    const parameters = url_1.default.parse(req.url, true);
    const playerId = parameters.query.playerId;
    const player = new player_1.Player(playerId, ws);
    gameServer.registerPlayer(player);
    ws.on('message', (message) => {
        try {
            gameServer.handleMessage(player, message);
        }
        catch (err) {
            player.sendError(`Error! Something went wrong.`);
        }
    });
    ws.on('close', () => {
        gameServer.handleDisconnect(player);
    });
});
app.use(express_1.default.static(path_1.default.join(__dirname, '../client/build')));
app.get('*', (req, res) => {
    res.sendFile(path_1.default.join(__dirname, '../client/build', 'index.html'));
});
server.listen(config_1.default.PORT, () => {
    console.log(`Server is running on port ${config_1.default.PORT}`);
    const urlPrefix = `http://localhost`;
    console.log(`Open: ${urlPrefix}:${config_1.default.PORT}/player/1`);
    console.log(`Open: ${urlPrefix}:${config_1.default.PORT}/player/2`);
});
