import { Player } from './Player';
import { Point, ServerMessageType, EGameObjectType, Box } from '../Types';
import { BufferWriter } from '../tools/Buffer';
import { createLogger, Logger } from '../tools/logger';
import GameObject from './GameObject';
import levelManager from '../manager/LevelManager';

export default abstract class Level {
    public log: Logger;
    protected readonly name: string;
    protected readonly spawn: Point;
    private isTick: boolean = true;
    private map: Uint8Array = new Uint8Array(400 * 300);
    private gameObjects: Array<GameObject> = [];

    private sentTotalPlayersCount: number = 0;
    private playersMoved: Array<Player> = [];
    private toUpdate: Array<GameObject> = [];
    private toRemove: Array<number> = [];
    private clicks: Array<Point> = [];
    private lines: Array<Box> = [];

    protected abstract OnInit(): void;

    public Init() {
        this.log = createLogger(`LVL::${this.name}`);
        this.OnInit();
    }

    protected AddGameObject(obj: GameObject) {
        this.gameObjects.push(obj);
        if (obj.isInit) return;

        const [x, y, w, h] = obj.transform;
        if (x + w > 400 || y + h > 300) {
            throw Error(`Object outside of map [${x};${y}]`);
        }

        for (let X = x; X < x + w; X++) {
            for (let Y = y; Y < y + h; Y++) {
                this.map[X + 400 * Y] |= 1 << obj.type;
            }
        }

        obj.OnTick();
        this.toUpdate.push(obj);
    }

    public OnPlayerJoin(player: Player) {
        player.OnMoveSafe(this.spawn, false, false);
    }

    public OnPlayerLeave(player: Player) {
        // TODO: Reset objects by player
    }

    public SendLevelData(player: Player, sync: number) {
        // gObjs = level.gObjs.filter(x => (x.type != gObjType.Wall || !x.hasOpened)),

        const numObjects = this.gameObjects.length;

        const writer = new BufferWriter();

        // Event ID
        writer.writeU(ServerMessageType.LOAD_LEVEL);

        writer.writeU(this.spawn[0], 16);
        writer.writeU(this.spawn[1], 16);

        writer.writeU(numObjects, 16);

        // var sObjs = gObjs.sort((a, b)=> ((a.type > b.type) ? 1 : ((b.type > a.type) ? -1 : 0)) );

        // for(const obj of this.objects) {
        // obj.w(writer);
        // }

        writer.writeU(sync, 32);

        player.Send(writer.get);
    }

    public TryTick() {
        if (!this.isTick || !this.players.length) return;

        try {
            this.Tick();
        } catch (e) {}
    }

    private Tick() {
        const players = this.players;

        for (const obj of this.gameObjects) {
            if (obj.OnTick()) {
                this.toUpdate.push(obj);
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
                            this.toUpdate.push(obj);
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
                            this.toUpdate.push(obj);
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

        let numPlayers = players.length < 100 ? players.length : 100;

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
        this.toUpdate = [];
        this.toRemove = [];
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
        // TODO: ... check collisions

        if (end[0] < 400 && end[1] < 300) {
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
}
