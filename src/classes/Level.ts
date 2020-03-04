import { Player } from './Player';
import { Point, ServerMessageType, EGameObjectType, Box, EWallColor } from '../Types';
import { BufferWriter } from '../tools/Buffer';
import { createLogger, Logger } from '../tools/logger';
import GameObject, { TextObject, WallObject } from './GameObject';
import levelManager from '../manager/LevelManager';
import { CreateUnduplicator, equalPoint, walk, unstuck } from '../tools/Utils';

export default abstract class Level {
    public log: Logger;
    protected readonly name: string;
    protected readonly spawn: Point;
    private isTick: boolean = true;
    private map: Uint8Array = new Uint8Array(400 * 300);
    private gameObjects: Array<GameObject> = CreateAutoSortGameObjects();
    private gameObjectsCounter: number = 0;
    public frameTick: number = 0;

    private sentTotalPlayersCount: number = 0;
    private playersMoved: Array<Player> = [];
    private toUpdate: Array<GameObject> = CreateUnduplicator();
    private toRemove: Array<number> = CreateUnduplicator();
    private clicks: Array<Point> = [];
    private lines: Array<Box> = [];

    protected abstract OnInit(): void;

    public Init() {
        this.log = createLogger(`LVL::${this.name}`);
        this.OnInit();
        this.AddGameObject(new TextObject([2, 6], 14, false, `Level: [${this.name}]`, 'ababab'));
    }

    public AddGameObject(obj: GameObject) {
        const [x, y, w, h] = obj.transform;
        if (x + w > 400 || y + h > 300) {
            throw Error(`Object outside of map [${x};${y}] {${obj}}`);
        }

        // TODO: remake this (there may be several addings of same object)
        try {
            this.gameObjects.push(obj);
            obj.SetLevel(this);
        } catch (e) {}

        for (let X = x; X < x + w; X++) {
            for (let Y = y; Y < y + h; Y++) {
                this.map[X + 400 * Y] |= 1 << obj.type;
            }
        }

        if (obj.type === EGameObjectType.WALL) {
            for (const player of this.players) {
                const [x, y] = player.pos;
                if (this.map[x + 400 * y] & (1 << EGameObjectType.WALL)) {
                    const p = unstuck([x, y], this.map);
                    this.log.info('Triggered WallStuckd => [%s]', p.join());
                    player.OnTeleport(p);
                }
            }
        }

        if (obj.id === null) {
            obj.id = ++this.gameObjectsCounter;
        } else {
            try {
                this.toUpdate.push(obj);
            } catch (e) {}
        }
        obj.OnTick();
    }

    public RemoveGameObject(obj: GameObject) {
        if (!this.gameObjects.includes(obj)) return;

        if (this.toUpdate.includes(obj)) {
            this.toUpdate.splice(
                this.toUpdate.findIndex(e => e === obj),
                1
            );
        }

        try {
            this.toRemove.push(obj.id);
        } catch (e) {}

        const [x, y, w, h] = obj.transform;
        for (let X = x; X < x + w; X++) {
            for (let Y = y; Y < y + h; Y++) {
                this.map[X + 400 * Y] &= ~(1 << obj.type);
            }
        }

        // Fix objs layers
        const objs = this.getGObjects(obj.type).filter(e => e.isActive);
        for (const obj2 of objs) {
            const [x2, y2, w2, h2] = obj2.transform;
            if (x + w < x2 || x > x2 + w2 || y + h < y2 || y > y2 + h2) break;
            for (let X = x; X < x + w; X++) {
                for (let Y = y; Y < y + h; Y++) {
                    this.map[X + 400 * Y] |= 1 << obj2.type;
                }
            }
        }
    }

    public ActiveAllWallObjectsByColor(color: EWallColor, state: boolean) {
        const objs = this.getGObjects(EGameObjectType.WALL).filter((e: WallObject) => e.color === color);
        for (const obj of objs) {
            // obj.isActive = state;
            obj[state ? 'Activate' : 'Deactivate']();
        }
    }

    public OnPlayerJoin(player: Player) {
        this.log.info(`► Player join to level`);
        player.OnMoveSafe(this.spawn, false, false);
        this.isTick = true;
    }

    public OnPlayerLeave(player: Player) {
        this.playersMoved.splice(
            this.playersMoved.findIndex(e => e === player),
            1
        );

        for (const obj of this.gameObjects) {
            if (obj.OnPlayerLeft(player)) {
                try {
                    this.toUpdate.push(obj);
                } catch (e) {}
            }
        }

        this.sentTotalPlayersCount = 0;
    }

    public SendLevelData(player: Player, sync: number) {
        const numObjects = this.gameObjects.length;

        const writer = new BufferWriter();

        // Event ID
        writer.writeU(ServerMessageType.LOAD_LEVEL);

        writer.writeU(this.spawn[0], 16);
        writer.writeU(this.spawn[1], 16);

        writer.writeU(numObjects, 16);

        for (const obj of this.gameObjects) {
            obj.Serialize(writer);
        }

        writer.writeU(sync, 32);

        player.Send(writer.get);
    }

    public TryTick() {
        if (!this.isTick) return;

        this.frameTick = Date.now(); //+= 50;

        try {
            this.Tick();
        } catch (e) {
            console.error(e);
        }
    }

    public StopTick() {
        this.isTick = false;
        for (const obj of this.gameObjects) {
            obj.OnReset();
        }
    }

    private Tick() {
        for (const obj of this.gameObjects) {
            if (obj.OnTick()) {
                try {
                    this.toUpdate.push(obj);
                } catch (e) {}
            }
        }

        // Check click Buttons
        for (const [x, y] of this.clicks) {
            const clickedObj = this.map[x + 400 * y];
            if (clickedObj) {
                if (clickedObj & (1 << EGameObjectType.BUTTON)) {
                    const objs = this.getGObjects(EGameObjectType.BUTTON);
                    for (const obj of objs) {
                        if (obj.CheckInside([x, y]) && obj.OnClick()) {
                            try {
                                this.toUpdate.push(obj);
                            } catch (e) {}
                        }
                    }
                }
            }
        }

        // Check hovered AreaCounter and Teleport
        for (const player of this.playersMoved) {
            const [x, y] = player.pos;
            const hoveredObj = this.map[x + 400 * y];
            if (hoveredObj) {
                if (hoveredObj & (1 << EGameObjectType.AREA_COUNTER)) {
                    const objs = this.getGObjects(EGameObjectType.AREA_COUNTER);
                    for (const obj of objs) {
                        if (obj.CheckInside([x, y]) && obj.OnHover(player)) {
                            try {
                                this.toUpdate.push(obj);
                            } catch (e) {}
                        }
                    }
                }

                if (hoveredObj & (1 << EGameObjectType.TELEPORT)) {
                    const objs = this.getGObjects(EGameObjectType.TELEPORT);
                    for (const obj of objs) {
                        if (obj.CheckInside([x, y])) {
                            obj.OnHover(player);
                        }
                    }
                }
            }
        }

        const players = this.players;
        let numPlayers = players.length < 100 ? players.length : 100;

        if (numPlayers === 0) {
            this.StopTick();
            return;
        }

        for (const player of players) {
            const [x, y] = player.pos;
            if (this.map[x + 400 * y] & (1 << EGameObjectType.WALL)) {
                const p = unstuck([x, y], this.map);
                this.log.info('[SS] Triggered WallStuckd => [%s]', p.join());
                player.OnTeleport(p);
            }
        }

        if (
            this.sentTotalPlayersCount != levelManager.totalPlayersCount ||
            this.playersMoved.length ||
            this.clicks.length ||
            this.lines.length ||
            this.toUpdate.length ||
            this.toRemove.length
        ) {
            const writer = new BufferWriter();

            writer.writeU(ServerMessageType.UPDATE_DATA);
            writer.writeU(numPlayers, 16);

            for (const player of players) {
                player.Serialize(writer);
                if (--numPlayers === 0) break;
            }

            writer.writeU(this.clicks.length, 16);
            for (const [x, y] of this.clicks) {
                writer.writeU(x, 16);
                writer.writeU(y, 16);
            }

            writer.writeU(this.toRemove.length, 16);
            for (const id of this.toRemove) {
                writer.writeU(id, 32);
            }

            writer.writeU(this.toUpdate.length, 16);
            for (const obj of this.toUpdate) {
                obj.Serialize(writer);
            }

            writer.writeU(this.lines.length, 16);
            for (const line of this.lines) {
                for (const dot of line) {
                    writer.writeU(dot, 16);
                }
            }

            writer.writeU(levelManager.totalPlayersCount, 16);

            for (const player of players) {
                player.Send(writer.get);
            }

            this.sentTotalPlayersCount = levelManager.totalPlayersCount;
        }

        this.playersMoved = [];
        this.clicks = [];
        this.lines = [];
        this.toUpdate = CreateUnduplicator();
        this.toRemove = CreateUnduplicator();
    }

    public OnMoved(player: Player) {
        this.playersMoved.push(player);
    }

    public AddClick(pos: Point) {
        if (this.clicks.length < 100) {
            this.clicks.push(pos);
        }
    }

    public AddLine(line: Box) {
        if (this.lines.length < 80 && this.players.length < 30) {
            this.lines.push(line);
        }
    }

    public CheckMovement(start: Point, end: Point): Point {
        start = walk(start, end, this.map);
        if (end[0] < 400 && end[1] < 300 && !equalPoint(start, end)) {
            return end;
        }
        return start;
    }

    public getGObjects(type: EGameObjectType): Array<GameObject> {
        return this.gameObjects.filter(e => e.type === type);
    }

    public get players() {
        return levelManager.getPlayers(this);
    }

    public get spawnPoint() {
        return this.spawn;
    }
}

const CreateAutoSortGameObjects = (target: Array<GameObject> = []) =>
    new Proxy<Array<GameObject>>(target, {
        set(target, p, value) {
            if (value instanceof GameObject) {
                if (target.includes(value)) {
                    return false;
                }
            }
            return Reflect.set(target, p, value);
        },
        get(target, p, receiver) {
            if (target[p] instanceof GameObject) {
                target.sort((a, b) => a.id - b.id);
            }
            return Reflect.get(target, p, receiver);
        },
    });
