import PlayerManager from './PlayerManager';
import { Player } from '../classes/Player';
import { createLogger, Logger } from '../tools/logger';
import Level from '../classes/Level';
import LevelTest from '../classes/levels/LevelTest';
import LevelTest2 from '../classes/levels/LevelTest2';

class LevelManager {
    private readonly log: Logger = createLogger('LM');
    public levels: Array<Level> = [];

    public async InitializeLevels() {
        // TODO: load level from storage

        // test
        this.AddLevels([
            new LevelTest(),
            new LevelTest2(),
        ]);

        for (const level of this.levels) {
            level.Init();
        }

        this.log.info('Levels loaded');
    }

    private AddLevels(levels: Level[]) {
        this.levels.push(...levels);
    }

    public GetLevel(levelID: number) {
        return this.levels[levelID];
    }

    public GetNextLevel(level: Level) {
        const levelID = this.levels.findIndex(e => e === level);
        return !~levelID || levelID > this.levels.length ? null : this.levels[levelID + 1];
    }

    /**
     * Connect the player to a {level},
     * previously disconnecting
     * him from {levelID} curentLevel (if any)
     */
    public Join(player: Player, level: number | Level) {
        const newLevelID = level instanceof Level ? this.levels.findIndex(e => e === level) : level;

        if (player.levelID !== null && player.levelID !== newLevelID) {
            this.Leave(player);
        }

        if (this.GetLevel(newLevelID)) {
            player.levelID = newLevelID;

            const newLevel = this.GetLevel(newLevelID);
            newLevel.OnPlayerJoin(player);
            newLevel.SendLevelData(player, ++player.sync);
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
