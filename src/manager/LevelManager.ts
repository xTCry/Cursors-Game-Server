import PlayerManager from './PlayerManager';
import { Player } from '../classes/Player';
import { createLogger, Logger } from '../tools/logger';
import Level from '../classes/Level';
import LevelTest from '../classes/levels/LevelTest';

class LevelManager {
    private readonly log: Logger = createLogger('LM');
    private levels: Array<Level> = [];

    public async InitializeLevels() {
        // TODO: load level from storage

        // test
        this.AddLevel(new LevelTest());

        for (const level of this.levels) {
            level.Init();
        }

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

    public getPlayers(level: Level = null): Array<Player> {
        if (level) {
            const levelID = this.levels.findIndex(e => e == level);
            return Object.values(PlayerManager.playersList).filter(e => e.levelID == levelID);
        }

        return Object.values(PlayerManager.playersList);
    }

    public get totalPlayersCount() {
        return this.getPlayers().length;
    }

    Tick() {
        for (const level of this.levels) {
            level.TryTick();
        }
    }
}

const levelManager = new LevelManager();
export default levelManager;
