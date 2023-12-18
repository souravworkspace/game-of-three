export enum MessageType {
  ERROR = 'ERROR',
  INFO = 'INFO',
  INIT_STATE = 'INIT_STATE',
  READY = 'READY',
  START = 'START',
  MOVE = 'MOVE',
  UPDATE_STATE = 'UPDATE_STATE'
}

export interface GameState {
  currentNumber: number;
  currentPlayerId: string | null;
  latestHistoryMsg: string;
}

export interface ErrorMessage {
  type: MessageType.ERROR;
  message: string;
}

export interface InfoMessage {
  type: MessageType.INFO;
  message: string;
}

export interface InitMessage {
  type: MessageType.INIT_STATE;
  state: GameState;
  history: string[];
}

export interface ReadyMessage {
  type: MessageType.READY;
  number: number;
}

export interface StartMessage {
  type: MessageType.START;
  number: number;
}

export interface MoveMessage {
  type: MessageType.MOVE;
  move: number;
}

export interface UpdateMessage {
  type: MessageType.UPDATE_STATE;
  state: GameState;
}

export type Message =
  | ErrorMessage
  | InfoMessage
  | InitMessage
  | ReadyMessage
  | StartMessage
  | MoveMessage
  | UpdateMessage;
