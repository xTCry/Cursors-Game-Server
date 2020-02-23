import PlayerManager, { Player } from './PlayerManager';
import { BufferWriter } from '../tools/Buffer';
import { ServerMsg, Point } from '../Types';

interface IUpdates {
    clicks: Array<Point>
}

class LevelManager {
    private _updates: IUpdates;

    constructor() {
        this._updates = {
            clicks: [],
        };
    }

    getPlayers(): Array<Player> {
        return Object.values(PlayerManager.playersList);
    }

    Tick() {
        this.BroadcastData();
    }

    // For test without level
    BroadcastData() {
        const players = this.getPlayers();

        const writer = new BufferWriter();
        writer.writeU(ServerMsg.UPDATE_DATA);
        writer.writeU(players.length, 16); // in level
        
		for (const player of players) {
			player.Serialize(writer);
        }
        
        writer.writeU(this.updates.clicks.length, 16);
        for (const pos of this.updates.clicks) {
            writer.writeU(pos.x, 16);
            writer.writeU(pos.y, 16);
        }
        this.updates.clicks = [];
        
        writer.writeU(players.length, 16);

        for (const player of players) {
            player.Send(writer.get);
        }
    }

    AddClick(pos: Point) {
        this._updates.clicks.push(pos);
    }

    public get updates(): IUpdates {
        return this._updates;
    }
}

const levelManager = new LevelManager();
export default levelManager;
