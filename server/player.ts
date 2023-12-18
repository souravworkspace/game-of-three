import WebSocket from 'ws';
import { ErrorMessage, InfoMessage, Message, MessageType } from './messages';

export enum PlayerId {
  ONE = '1',
  TWO = '2'
}

export class Player {
  private id: string;
  private ws: WebSocket;

  constructor(id: string, ws: WebSocket) {
    this.id = id;
    this.ws = ws;
    if (id != PlayerId.ONE && id != PlayerId.TWO) {
      this.sendError(`Invalid Player Id! only allowed values are 1,2.`);
    }
  }

  public getId(): string {
    return this.id;
  }

  public sendError(message: string): void {
    const msg: ErrorMessage = {
      type: MessageType.ERROR,
      message
    };
    this.sendMessage(msg);
  }

  public sendInfo(message: string): void {
    const msg: InfoMessage = {
      type: MessageType.INFO,
      message
    };
    this.sendMessage(msg);
  }

  public sendMessage(message: Message): void {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(message));
    }
  }
}
