import { WebSocket } from 'uWebSockets.js';
import LevelManager from './LevelManager';
import { BufferWriter } from '../tools/Buffer';
import { ServerMessageType, IPlayersList } from '../Types';
import { Logger, createLogger } from '../tools/logger';
import { Player } from '../classes/Player';

export class PlayerManager {
    private readonly log: Logger = createLogger('PM');
    public playersList: IPlayersList = {};
    private _playerCouner: number = 0;

    /**
     * Add new connected player
     * @param {WebSocket} socket
     */
    AddPlayer(socket: WebSocket): Player {
        const player = new Player(socket, this.genUniqueID());
        this.playersList[player.uid] = player;

        // Send player ID
        const fastBuff = BufferWriter.fast([[ServerMessageType.SET_CLIENT_ID], [player.uniqueID, 32]]);
        player.Send(fastBuff);

        this.log.info('New player connected');

        // Join to Test Level
        LevelManager.Join(player, 0);

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

const playerManager = new PlayerManager();
export default playerManager;
