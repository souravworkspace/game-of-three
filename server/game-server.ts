import WebSocket from 'ws';
import { Player, PlayerId } from './player';
import {
  GameState,
  InitMessage,
  Message,
  MessageType,
  MoveMessage,
  ReadyMessage,
  UpdateMessage
} from './messages';

enum GameStatus {
  WAITING = 'WAITING',
  READY = 'READY',
  IN_PROGRESS = 'IN_PROGRESS',
  GAME_OVER = 'GAME_OVER'
}

export class GameServer {
  private status: GameStatus;
  private player1: Player | null;
  private player2: Player | null;
  private currentNumber: number;
  private currentPlayer: Player | null;
  private gamePlayHistory: string[] = [];

  constructor() {
    this.status = GameStatus.WAITING;
    this.player1 = null;
    this.player2 = null;
    this.currentPlayer = null;
  }

  private getRandomNumber(): number {
    return Math.floor(Math.random() * 10000);
  }

  private getGameState(): GameState {
    return {
      currentNumber: this.currentNumber,
      currentPlayerId: this.currentPlayer && this.currentPlayer.getId(),
      latestHistoryMsg: this.gamePlayHistory[this.gamePlayHistory.length - 1]
    };
  }

  private getOpponentPlayer(player: Player): Player | null {
    return player.getId() === PlayerId.ONE ? this.player2 : this.player1;
  }

  private setCurrentNumber(num: number): void {
    this.currentNumber = num;
  }

  private setCurrentPlayer(player: Player): void {
    this.currentPlayer = player;
  }

  private appendPlayHistory(msg: string): void {
    this.gamePlayHistory.push(msg);
    console.log(msg);
  }

  private broadcastState(): void {
    const updateMsg: UpdateMessage = {
      type: MessageType.UPDATE_STATE,
      state: this.getGameState()
    };
    if (this.player1) this.player1.sendMessage(updateMsg);
    if (this.player2) this.player2.sendMessage(updateMsg);
  }

  public registerPlayer(player: Player): void {
    if (player.getId() === PlayerId.ONE) {
      this.player1 = player;
      if (this.player2) this.player2.sendInfo(`Player1 joined.`);
    } else if (player.getId() === PlayerId.TWO) {
      this.player2 = player;
      if (this.player1) this.player1.sendInfo('Player2 joined.');
    }

    if (!this.currentPlayer) this.currentPlayer = player; // Who joins first, gets to play first

    const initMsg: InitMessage = {
      type: MessageType.INIT_STATE,
      state: this.getGameState(),
      history: this.gamePlayHistory
    };
    player.sendMessage(initMsg);
    const allowedGameStatus = [GameStatus.WAITING, GameStatus.READY];
    if (
      allowedGameStatus.includes(this.status) &&
      this.player1 &&
      this.player2
    ) {
      this.setCurrentNumber(this.getRandomNumber());
      const readyMsg: ReadyMessage = {
        type: MessageType.READY,
        number: this.currentNumber
      };
      this.status = GameStatus.READY;
      this.currentPlayer.sendMessage(readyMsg);
    }
  }

  public handleMessage(player: Player, message: WebSocket.Data) {
    const data = JSON.parse(message.toString()) as Message;
    if (this.currentPlayer && player.getId() === this.currentPlayer.getId()) {
      if (data.type === MessageType.START) {
        this.handleStart(player);
      } else if (data.type === MessageType.MOVE) {
        this.handleMove(player, data);
      } else {
        player.sendError(`Invalid message of type: ${data.type}`);
      }
    } else {
      player.sendError(`Not your turn!`);
    }
  }

  public handleStart(player: Player): void {
    const opponent = this.getOpponentPlayer(player);
    if (this.status === GameStatus.READY && opponent) {
      this.status = GameStatus.IN_PROGRESS;
      this.appendPlayHistory(
        `Player${player.getId()} Started: ${this.currentNumber}.`
      );
      this.setCurrentPlayer(opponent);
      this.broadcastState();
    } else {
      player.sendError(`Game not in Ready State!`);
    }
  }

  public handleMove(player: Player, message: MoveMessage): void {
    const opponent = this.getOpponentPlayer(player);
    if (this.status === GameStatus.IN_PROGRESS && opponent) {
      const isValidMove = (this.currentNumber + message.move) % 3 === 0;
      if (isValidMove) {
        const newNumber = (this.currentNumber + message.move) / 3;
        if (newNumber === 1) {
          this.status = GameStatus.GAME_OVER;
          this.appendPlayHistory(
            `Player${player.getId()} Won!: ${this.currentNumber} + (${
              message.move
            }) = ${newNumber}`
          );
          this.setCurrentNumber(newNumber);
          this.broadcastState();
        } else {
          this.appendPlayHistory(
            `Player${player.getId()} Move: ${this.currentNumber} + (${
              message.move
            }) = ${newNumber}`
          );
          this.setCurrentNumber(newNumber);
          this.setCurrentPlayer(opponent);
          this.broadcastState();
        }
      } else {
        player.sendError(
          'Invalid move! result could not be divided by 3. Please try again!'
        );
      }
    } else {
      player.sendError(
        `Game is not in progress! currently in ${this.status} state!`
      );
    }
  }

  public handleDisconnect(player: Player) {
    const opponent = this.getOpponentPlayer(player);
    if (player.getId() === PlayerId.ONE) {
      this.player1 = null;
    } else {
      this.player2 = null;
    }
    if (this.currentPlayer === player) this.currentPlayer = null;
    if (opponent) opponent.sendInfo(`Player${player.getId()} Disconnected!`);
  }
}
