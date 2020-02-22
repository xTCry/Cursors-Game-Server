import { TemplatedApp, WebSocket } from 'uWebSockets.js';
import uuidv4 from 'uuid/v4';
import { BufferWriter, BufferReader } from '../tools/Buffer';
import { ServerMsg, ClientMsg } from '../Types';
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
    public socket: WebSocket;
    public uid: string;
    public uniqueID: number;

    constructor(socket: WebSocket) {
        this.socket = socket;
        this.socket.closed = false;

        this.uid = this.socket.uid = uuidv4();
        this.uniqueID = playerManager.genUniqueID();
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
                    const ttl = reader.readU(32);
                    console.log(`► Move: {${ttl}} [${x}:${y}]`);
                } catch (e) {}
                break;
            case ClientMsg.CLICK:
                try {
                    const x = reader.readU(16);
                    const y = reader.readU(16);
                    const ttl = reader.readU(32);
                    console.log(`► Click: {${ttl}} [${x}:${y}]`);
                    LevelManager.AddCircle(x, y);
                } catch (e) {}
                break;
        }
    }
}

const playerManager = new PlayerManage();
export default playerManager;
