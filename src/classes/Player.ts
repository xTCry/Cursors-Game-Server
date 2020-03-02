import { WebSocket } from 'uWebSockets.js';
import uuidv4 from 'uuid/v4';
import { BufferWriter, BufferReader } from '../tools/Buffer';
import LevelManager from '../manager/LevelManager';
import { ClientMessageType, Point, ServerMessageType } from "../Types";

export class Player {
    public readonly uid: string = uuidv4();
    public readonly uniqueID: number;
    public levelID = null;
    private socket: WebSocket;
    private pos: Point = [0, 0];
    public sync: number = 0;
    private color: number = (Math.random() * (1 << 24)) | 0;

    constructor(socket: WebSocket, uniqueID: number) {
        this.socket = socket;
        this.socket.closed = false;
        this.socket.uid = this.uid;

        this.uniqueID = uniqueID;
    }

    Send(data: Buffer) {
        if (this.socket.closed) return;
        this.socket.send(data, true);
    }

    OnMessage(message: ArrayBuffer) {
        console.log('• Message:', message.byteLength, Buffer.from(message));

        if (message.byteLength < 2) {
            return;
        }

        const reader = new BufferReader(message);
        const type = reader.readU();

        switch (type) {
            case ClientMessageType.MOVE:
                try {
                    const x = reader.readU(16);
                    const y = reader.readU(16);
                    const sync = reader.readU(32);
                    this.OnMove([x, y], sync);
                } catch (e) {}
                break;
            case ClientMessageType.CLICK:
                try {
                    const x = reader.readU(16);
                    const y = reader.readU(16);
                    const sync = reader.readU(32);
                    console.log(`► Click: {${sync}} [${x}:${y}]`);
                    this.OnClick([x, y], sync);
                } catch (e) {}
                break;
        }
    }

    Resync() {
        this.sync++;
        const [x, y] = this.pos;
        const fastBuff = BufferWriter.fast([
            [ServerMessageType.TELEPORT_CLIENT],
            [x, 16],
            [y, 16],
            [this.sync, 32],
        ]);
        this.Send(fastBuff);
    }

    OnMove([x, y]: Point, sync: number) {
        console.log(`► Move: {${sync}} [${x}:${y}]`);
        if (sync >= this.sync) {
            const newPos: Point = this.CheckMovement(this.pos, [x, y]);

            this.pos = newPos;
            if (x == newPos[0] && y == newPos[1]) {
                return true;
            } else {
                this.Resync();
            }
        }
        return false;
    }

    OnMoveSafe(newPos: Point, check: boolean = true, sysncPos: boolean = true) {
        if(check) {
            return this.OnMove(newPos, this.sync);
        }
        else if(this.levelID !== null) {
            this.pos = newPos;
            if(sysncPos) {
                this.Resync();
            }

            LevelManager.GetLevel(this.levelID).OnMoved(this);
        }
        return false;
    }

    OnClick(pos: Point, sync: number) {
        if (this.OnMove(pos, sync)) {
            LevelManager.AddClick(pos);
        }
    }

    CheckMovement(start: Point, end: Point): Point {
        if (end[0] < 400 && end[1] < 300) {
            return end;
        }
        return start;
    }

    Serialize(writer: BufferWriter) {
        const [x, y] = this.pos;
        writer.writeU(this.uniqueID, 32);
        writer.writeU(x, 16);
        writer.writeU(y, 16);
        writer.writeU(this.color, 32);
    }
}