"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GameServer = void 0;
const player_1 = require("./player");
const messages_1 = require("./messages");
var GameStatus;
(function (GameStatus) {
    GameStatus["WAITING"] = "WAITING";
    GameStatus["READY"] = "READY";
    GameStatus["IN_PROGRESS"] = "IN_PROGRESS";
    GameStatus["GAME_OVER"] = "GAME_OVER";
})(GameStatus || (GameStatus = {}));
class GameServer {
    status;
    player1;
    player2;
    currentNumber;
    currentPlayer;
    gamePlayHistory = [];
    constructor() {
        this.status = GameStatus.WAITING;
        this.player1 = null;
        this.player2 = null;
        this.currentPlayer = null;
    }
    getRandomNumber() {
        return Math.floor(Math.random() * 10000);
    }
    getGameState() {
        return {
            currentNumber: this.currentNumber,
            currentPlayerId: this.currentPlayer && this.currentPlayer.getId(),
            latestHistoryMsg: this.gamePlayHistory[this.gamePlayHistory.length - 1]
        };
    }
    getOpponentPlayer(player) {
        return player.getId() === player_1.PlayerId.ONE ? this.player2 : this.player1;
    }
    setCurrentNumber(num) {
        this.currentNumber = num;
    }
    setCurrentPlayer(player) {
        this.currentPlayer = player;
    }
    appendPlayHistory(msg) {
        this.gamePlayHistory.push(msg);
        console.log(msg);
    }
    broadcastState() {
        const updateMsg = {
            type: messages_1.MessageType.UPDATE_STATE,
            state: this.getGameState()
        };
        if (this.player1)
            this.player1.sendMessage(updateMsg);
        if (this.player2)
            this.player2.sendMessage(updateMsg);
    }
    registerPlayer(player) {
        if (player.getId() === player_1.PlayerId.ONE) {
            this.player1 = player;
            if (this.player2)
                this.player2.sendInfo(`Player1 joined.`);
        }
        else if (player.getId() === player_1.PlayerId.TWO) {
            this.player2 = player;
            if (this.player1)
                this.player1.sendInfo('Player2 joined.');
        }
        if (!this.currentPlayer)
            this.currentPlayer = player; // Who joins first, gets to play first
        const initMsg = {
            type: messages_1.MessageType.INIT_STATE,
            state: this.getGameState(),
            history: this.gamePlayHistory
        };
        player.sendMessage(initMsg);
        const allowedGameStatus = [GameStatus.WAITING, GameStatus.READY];
        if (allowedGameStatus.includes(this.status) &&
            this.player1 &&
            this.player2) {
            this.setCurrentNumber(this.getRandomNumber());
            const readyMsg = {
                type: messages_1.MessageType.READY,
                number: this.currentNumber
            };
            this.status = GameStatus.READY;
            this.currentPlayer.sendMessage(readyMsg);
        }
    }
    handleMessage(player, message) {
        const data = JSON.parse(message.toString());
        if (this.currentPlayer && player.getId() === this.currentPlayer.getId()) {
            if (data.type === messages_1.MessageType.START) {
                this.handleStart(player);
            }
            else if (data.type === messages_1.MessageType.MOVE) {
                this.handleMove(player, data);
            }
            else {
                player.sendError(`Invalid message of type: ${data.type}`);
            }
        }
        else {
            player.sendError(`Not your turn!`);
        }
    }
    handleStart(player) {
        const opponent = this.getOpponentPlayer(player);
        if (this.status === GameStatus.READY && opponent) {
            this.status = GameStatus.IN_PROGRESS;
            this.appendPlayHistory(`Player${player.getId()} Started: ${this.currentNumber}.`);
            this.setCurrentPlayer(opponent);
            this.broadcastState();
        }
        else {
            player.sendError(`Game not in Ready State!`);
        }
    }
    handleMove(player, message) {
        const opponent = this.getOpponentPlayer(player);
        if (this.status === GameStatus.IN_PROGRESS && opponent) {
            const isValidMove = (this.currentNumber + message.move) % 3 === 0;
            if (isValidMove) {
                const newNumber = (this.currentNumber + message.move) / 3;
                if (newNumber === 1) {
                    this.status = GameStatus.GAME_OVER;
                    this.appendPlayHistory(`Player${player.getId()} Won!: ${this.currentNumber} + (${message.move}) = ${newNumber}`);
                    this.setCurrentNumber(newNumber);
                    this.broadcastState();
                }
                else {
                    this.appendPlayHistory(`Player${player.getId()} Move: ${this.currentNumber} + (${message.move}) = ${newNumber}`);
                    this.setCurrentNumber(newNumber);
                    this.setCurrentPlayer(opponent);
                    this.broadcastState();
                }
            }
            else {
                player.sendError('Invalid move! result could not be divided by 3. Please try again!');
            }
        }
        else {
            player.sendError(`Game is not in progress! currently in ${this.status} state!`);
        }
    }
    handleDisconnect(player) {
        const opponent = this.getOpponentPlayer(player);
        if (player.getId() === player_1.PlayerId.ONE) {
            this.player1 = null;
        }
        else {
            this.player2 = null;
        }
        if (this.currentPlayer === player)
            this.currentPlayer = null;
        if (opponent)
            opponent.sendInfo(`Player${player.getId()} Disconnected!`);
    }
}
exports.GameServer = GameServer;
