import PlayerManager from './PlayerManager';
import { BufferWriter } from '../tools/Buffer';
import { ServerMessageType, Point } from '../Types';
import { Player } from '../classes/Player';
import { createLogger, Logger } from '../tools/logger';
import Level from '../classes/Level';

interface IUpdates {
    clicks: Array<Point>
}

class LevelManager {
    private readonly log: Logger = createLogger('LM');
    private levels: Array<Level> = [];
    private _updates: IUpdates = {
        clicks: [],
    };

    public async InitializeLevels() {
        // TODO: ...

        class TestLevel extends Level {
            spawn: Point = [0, 0];
        }

        // test
        this.AddLevel(new TestLevel());

        this.log.info('Levels loaded');
    }

    private AddLevel(level: Level) {
        this.levels.push(level);
    }

    public GetLevel(levelID: number) {
        return this.levels[levelID];
    }

    /**
     * Connect the player to a {newLevelID} level,
     * previously disconnecting
     * him from {levelID} curentLevel (if any)
     */
    public Join(player: Player, newLevelID: number) {
        if (player.levelID !== null && player.levelID !== newLevelID) {
            this.Leave(player);
        }

        if (this.GetLevel(newLevelID)) {
            player.levelID = newLevelID;

            const level = this.GetLevel(newLevelID);
            level.OnPlayerJoin(player);
            level.SendLevelData(player, ++player.sync);
        } else {
            throw TypeError(`Level by ID '${newLevelID}' not found`);
        }
    }

    public Leave(player: Player, levelID: number = player.levelID) {
        this.GetLevel(levelID).OnPlayerLeave(player);

        player.levelID = null;
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
        writer.writeU(ServerMessageType.UPDATE_DATA);
        writer.writeU(players.length, 16); // in level

        for (const player of players) {
            player.Serialize(writer);
        }

        writer.writeU(this.updates.clicks.length, 16);
        for (const [x, y] of this.updates.clicks) {
            writer.writeU(x, 16);
            writer.writeU(y, 16);
        }
        this.updates.clicks = [];

        writer.writeU(0, 16); // walls removed
        writer.writeU(0, 16); // updateObjs
        writer.writeU(0, 16); // drawing

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
