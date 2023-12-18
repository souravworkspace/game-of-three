import { GameServer } from '../game-server';
import { Player } from '../player';
import { MessageType, MoveMessage } from '../messages';

describe('GameServer', () => {
  let gameServer: GameServer;
  let player1: Player;
  let player2: Player;

  beforeEach(() => {
    gameServer = new GameServer();
    player1 = new Player('1', {} as any);
    player2 = new Player('2', {} as any);
  });

  it('should register players', () => {
    gameServer.registerPlayer(player1);
    gameServer.registerPlayer(player2);

    expect(gameServer['player1']).toEqual(player1);
    expect(gameServer['player2']).toEqual(player2);
  });

  it('should set initial game state on registering players', () => {
    gameServer.registerPlayer(player1);
    gameServer.registerPlayer(player2);

    expect(gameServer['status']).toBe('READY');
    expect(gameServer['currentPlayer']).toEqual(player1);
    expect(gameServer['currentNumber']).toBeGreaterThanOrEqual(0);
    expect(gameServer['currentNumber']).toBeLessThanOrEqual(9999);
  });

  it('should handle start correctly', () => {
    gameServer.registerPlayer(player1);
    gameServer.registerPlayer(player2);

    gameServer.handleStart(player1);

    expect(gameServer['status']).toBe('IN_PROGRESS');
    expect(gameServer['currentPlayer']).toEqual(player2);
    expect(gameServer['currentNumber']).toBeGreaterThanOrEqual(0);
    expect(gameServer['currentNumber']).toBeLessThanOrEqual(9999);
  });

  it('should handle move and win', () => {
    gameServer.registerPlayer(player1);
    gameServer.registerPlayer(player2);

    gameServer.handleStart(player1);

    gameServer['currentNumber'] = 56;
    const message: MoveMessage = {
      type: MessageType.MOVE,
      move: 1,
    }
    gameServer.handleMove(player2, message);

    expect(gameServer['status']).toBe('IN_PROGRESS');
    expect(gameServer['currentPlayer']).toEqual(player1);
    expect(gameServer['currentNumber']).toEqual(19);

    message.move = -1;
    gameServer.handleMove(player1, message);

    expect(gameServer['status']).toBe('IN_PROGRESS');
    expect(gameServer['currentPlayer']).toEqual(player2);
    expect(gameServer['currentNumber']).toEqual(6);

    message.move = 0;
    gameServer.handleMove(player2, message);

    expect(gameServer['status']).toBe('IN_PROGRESS');
    expect(gameServer['currentPlayer']).toEqual(player1);
    expect(gameServer['currentNumber']).toEqual(2);

    message.move = 1;
    gameServer.handleMove(player1, message);

    expect(gameServer['status']).toBe('GAME_OVER');
    expect(gameServer['currentNumber']).toEqual(1);
  });

  it('should handle disconnect', () => {
    gameServer.registerPlayer(player1);
    gameServer.registerPlayer(player2);
    gameServer.handleDisconnect(player1);

    expect(gameServer['status']).toBe('READY');
    expect(gameServer['player1']).toBeNull();
    expect(gameServer['currentPlayer']).toBeNull();  
  });
});