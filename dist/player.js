"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Player = exports.PlayerId = void 0;
const ws_1 = __importDefault(require("ws"));
const messages_1 = require("./messages");
var PlayerId;
(function (PlayerId) {
    PlayerId["ONE"] = "1";
    PlayerId["TWO"] = "2";
})(PlayerId || (exports.PlayerId = PlayerId = {}));
class Player {
    id;
    ws;
    constructor(id, ws) {
        this.id = id;
        this.ws = ws;
        if (id != PlayerId.ONE && id != PlayerId.TWO) {
            this.sendError(`Invalid Player Id! only allowed values are 1,2.`);
        }
    }
    getId() {
        return this.id;
    }
    sendError(message) {
        const msg = {
            type: messages_1.MessageType.ERROR,
            message
        };
        this.sendMessage(msg);
    }
    sendInfo(message) {
        const msg = {
            type: messages_1.MessageType.INFO,
            message
        };
        this.sendMessage(msg);
    }
    sendMessage(message) {
        if (this.ws && this.ws.readyState === ws_1.default.OPEN) {
            this.ws.send(JSON.stringify(message));
        }
    }
}
exports.Player = Player;
