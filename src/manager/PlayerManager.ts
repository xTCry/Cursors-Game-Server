import { TemplatedApp, WebSocket } from 'uWebSockets.js';
import uuidv4 from 'uuid/v4';
import { BufferWriter, BufferReader } from '../tools/Buffer';
import { ServerMsg, ClientMsg, Point } from '../Types';
import LevelManager from './LevelManager';

type IPlayerList = { [key: string]: Player };

export class PlayerManage {
    public hub: TemplatedApp;
    public playersList: IPlayerList;
    private _playerCouner: number = 0;

    constructor() {
        this.hub = null;
        this.playersList = {};
    }

    init(hub: TemplatedApp) {
        this.hub = hub;
    }

    /**
     * Add new connected player
     * @param {WebSocket} socket
     */
    AddPlayer(socket: WebSocket): Player {
        const player = new Player(socket);
        this.playersList[player.uid] = player;

        // Send player ID
        const fastBuff = BufferWriter.fast([[ServerMsg.SET_CLIENT_ID], [player.uniqueID, 32]]);
        player.Send(fastBuff);

        // Join to Test Level
        // LevelManager.Join(player, 1);

        return player;
    }

    /**
     * Remove disconnected player
     * @param {WebSocket} socket
     */
    RemovePlayer(socket: WebSocket) {
        socket.closed = true;
        // const player = this.playersList[socket.uid];

        // LevelManager.Leave(player, player.data.level);

        delete this.playersList[socket.uid];
    }

    /**
     * Listener for New Message Packages
     * @param {WebSocket} socket
     * @param {ArrayBuffer} message
     */
    OnMessage(socket: WebSocket, message: ArrayBuffer) {
        if (socket.closed) {
            return;
        }

        this.playersList[socket.uid].OnMessage(message);
    }

    public genUniqueID(): number {
        return ++this._playerCouner;
    }
}

export class Player {
    public readonly uid: string = uuidv4();
    public readonly uniqueID: number = playerManager.genUniqueID();
    private socket: WebSocket;
    private pos: Point = { x: 0, y: 0 };
    private sync: number = 0;

    constructor(socket: WebSocket) {
        this.socket = socket;
        this.socket.closed = false;

        this.socket.uid = this.uid;
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
            case ClientMsg.MOVE:
                try {
                    const x = reader.readU(16);
                    const y = reader.readU(16);
                    const sync = reader.readU(32);
                    this.OnMove({ x, y }, sync);
                } catch (e) {}
                break;
            case ClientMsg.CLICK:
                try {
                    const x = reader.readU(16);
                    const y = reader.readU(16);
                    const sync = reader.readU(32);
                    console.log(`► Click: {${sync}} [${x}:${y}]`);
                    this.OnClick({ x, y }, sync);
                } catch (e) {}
                break;
        }
    }

    Resync() {
        this.sync++;

        const fastBuff = BufferWriter.fast([
            [ServerMsg.TELEPORT_CLIENT],
            [this.pos.x, 16],
            [this.pos.y, 16],
            [this.sync, 32],
        ]);
        this.Send(fastBuff);
    }

    OnMove({ x, y }: Point, sync: number) {
        console.log(`► Move: {${sync}} [${x}:${y}]`);
        if (sync >= this.sync) {
            const newPos: Point = this.CheckMovement(this.pos, { x, y });

            this.pos = newPos;
            if (x == newPos.x && y == newPos.y) {
                return true;
            } else {
                this.Resync();
            }
        }
        return false;
    }

    OnClick(pos: Point, sync: number) {
        if(this.OnMove(pos, sync)) {
            LevelManager.AddClick(pos);
        }
    }

    CheckMovement(start: Point, end: Point): Point {
        if (end.x < 400 && end.y < 300) {
            return end;
        }
        return start;
    }

    Serialize(writer: BufferWriter) {
        writer.writeU(this.uniqueID, 32);
        writer.writeU(this.pos.x, 16);
        writer.writeU(this.pos.y, 16);
    }
}

const playerManager = new PlayerManage();
export default playerManager;
