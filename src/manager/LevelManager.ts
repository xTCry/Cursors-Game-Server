import PlayerManager, { Player } from './PlayerManager';
import { BufferWriter } from '../tools/Buffer';
import { ServerMsg } from '../Types';

interface ICircleData {
    x: number;
    y: number;
}
interface IUpdates {
    circles: Array<ICircleData>
}

class LevelManager {
    private _updates: IUpdates;

    constructor() {
        this._updates = {
            circles: [],
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
        writer.writeU(this.getPlayers().length, 16);
        
        // Test circles
        writer.writeU(this.updates.circles.length, 16);
        for (const circle of this.updates.circles) {
            writer.writeU(circle.x, 16);
            writer.writeU(circle.y, 16);
        }
        this.updates.circles = [];

        for (const player of players) {
            player.Send(writer.get);
        }
    }

    AddCircle(x: number, y: number) {
        this._updates.circles.push({ x, y });
    }

    public get updates(): IUpdates {
        return this._updates;
    }
}

const levelManager = new LevelManager();
export default levelManager;
