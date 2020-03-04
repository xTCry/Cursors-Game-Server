import { EGameObjectType, Box, Point, EWallColor, ETeleportColor } from '../Types';
import { BufferWriter } from '../tools/Buffer';
import { Player } from './Player';
import Level from './Level';
import levelManager from '../manager/LevelManager';
import { CreateUnduplicator } from '../tools/Utils';

export default abstract class GameObject {
    public readonly type: EGameObjectType;
    public id: number = null;
    public transform: Box;
    public isInit: boolean = false;
    public isActive: boolean = true;
    public actCounter: number = 0;
    public level: Level = null;

    constructor(transform: Box, type: EGameObjectType) {
        this.transform = transform;
        this.type = type;
    }

    public Activate() {
        // this.level.log.info('Activate Wall [%d] (%d)', this.id, this.actCounter);
        if (this.actCounter !== 0 && --this.actCounter === 0) {
            this.isActive = true;
            this.level.AddGameObject(this);
        }
    }

    public Deactivate() {
        // this.level.log.info('Deactivate Wall [%d] (%d)', this.id, this.actCounter);
        if (this.actCounter === 0) {
            this.isActive = false;
            this.level.RemoveGameObject(this);
        }
        this.actCounter++;
    }

    public OnTick(): boolean {
        return false;
    }

    public OnClick(): boolean {
        return false;
    }

    public OnHover(player: Player): boolean {
        return false;
    }

    public OnPlayerLeft(player: Player): boolean {
        return false;
    }

    public CheckInside([xPos, yPos]: Point): boolean {
        const [x, y, w, h] = this.transform;
        return xPos >= x && yPos >= y && xPos < x + w && yPos < y + h;
    }

    public OnReset(): void {
        // this.level.log.info('OnReset %s', this.constructor.name);
        return;
    }

    public SetLevel(level: Level) {
        this.level = level;
    }

    public Serialize(writer: BufferWriter) {
        this.MainSerialize(writer);
    }

    protected MainSerialize(writer: BufferWriter, wh: boolean = true) {
        const [x, y, w, h] = this.transform;
        writer.writeU(this.id, 32);
        writer.writeU(this.type);
        writer.writeU(x, 16);
        writer.writeU(y, 16);
        wh && writer.writeU(w, 16);
        wh && writer.writeU(h, 16);
        // next super()...
    }
}

export class TextObject extends GameObject {
    private text: string = '';
    private size: number = 1;
    private isCenter: boolean = false;
    private color: string = 'black';

    constructor(pos: Point, size: number, isCenter: boolean, text: string, color: string = '000000') {
        super([...pos, 0, 0] as Box, EGameObjectType.TEXT);

        this.size = size;
        this.isCenter = isCenter;
        this.color = color;
        this.text = text;
    }

    Serialize(writer: BufferWriter) {
        this.MainSerialize(writer, false);

        writer.writeU(this.size);
        writer.writeU(this.isCenter ? 1 : 0);

        // writer.writeBuffer(new Buffer(this.text));
        writer.writeU(parseInt(this.color, 16), 32);

        for (const e of this.text.split('').map(char => char.charCodeAt(0))) {
            writer.writeU(e, 16);
        }
        writer.writeU(0, 16);
    }
}

export class WallObject extends GameObject {
    public readonly color: EWallColor;

    constructor(trans: Box, color: EWallColor) {
        super(trans, EGameObjectType.WALL);

        this.color = color;
    }

    Serialize(writer: BufferWriter) {
        super.Serialize(writer);
        writer.writeU(this.color, 32);
    }
}

export class TeleportObject extends GameObject {
    private toLevel: Level = null;
    private toPoint: Point = null;
    private appearance: ETeleportColor = 0;

    /**
     * [Red] Teleport to level spawn
     */
    constructor(trans: Box);
    /**
     * [Green] Teleport to level {point}
     * @param point
     */
    constructor(trans: Box, point: Point);
    /**
     * [Green] Teleport to {level}
     * @param level
     */
    constructor(trans: Box, level: Level);

    constructor(trans: Box, level: Point | Level = null) {
        super(trans, EGameObjectType.TELEPORT);

        if (!level) {
            this.appearance = ETeleportColor.RED;
        } else if (level instanceof Level) {
            this.toPoint = level.spawnPoint;
            this.toLevel = level;
            this.appearance = ETeleportColor.GREEN;
        } else if (level instanceof Array) {
            this.toPoint = level;
            this.appearance = ETeleportColor.GREEN;
        } else {
            throw Error(`what?`);
        }
    }

    OnHover(player: Player) {
        if (this.toLevel) {
            levelManager.Join(player, this.toLevel);
        } else {
            if (this.toPoint) {
                player.OnTeleport(this.toPoint);
            } else {
                player.OnTeleport(this.level.spawnPoint);
            }
        }
        return false;
    }

    Serialize(writer: BufferWriter) {
        super.Serialize(writer);
        writer.writeU(this.appearance);
    }
}

export class AreaCounterObject extends GameObject {
    private count: number = 0;
    private countMax: number = 0;
    private color: EWallColor;
    private onArea: Array<Player> = CreateUnduplicator();

    constructor(trans: Box, color: EWallColor, count: number) {
        super(trans, EGameObjectType.AREA_COUNTER);

        this.color = color;
        this.count = this.countMax = count;
    }

    Recount() {
        let newCount = (e => (e <= 0 ? 0 : e))(this.countMax - this.onArea.length);
        let oldCount = this.count;

        // this.level.log.info('AreaCounter (%d): [%s]', newCount, this.onArea.map(e => e.uniqueID).join());

        if (this.count !== newCount) {
            this.count = newCount;
            if (oldCount === 0) {
                this.level.ActiveAllWallObjectsByColor(this.color, true);
            } else if (this.count === 0) {
                this.level.ActiveAllWallObjectsByColor(this.color, false);
            }
            return true;
        }

        return false;
    }

    OnHover(player: Player) {
        try {
            this.onArea.push(player);
            return this.Recount();
        } catch (e) {}

        return false;
    }

    OnPlayerLeft(player: Player) {
        try {
            this.onArea.splice(
                this.onArea.findIndex(e => e === player),
                1
            );
            return this.Recount();
        } catch (e) {}

        return false;
    }

    OnTick() {
        let isUpd = false;
        for (const player of this.onArea) {
            if (!this.CheckInside(player.pos)) {
                this.onArea.splice(
                    this.onArea.findIndex(e => e === player),
                    1
                );
                isUpd = true;
            }
        }
        return isUpd ? this.Recount() : false;
    }

    OnReset() {
        this.count = this.countMax;
        this.Recount();
    }

    Serialize(writer: BufferWriter) {
        super.Serialize(writer);
        writer.writeU(this.count, 16);
        writer.writeU(this.color, 32);
    }
}

export class ButtonObject extends GameObject {
    protected count: number = 0;
    protected countMax: number = 0;
    protected speed: number = 0;
    protected lastClickAt: number = 0;
    protected color: EWallColor;

    constructor(trans: Box, color: EWallColor, count: number, speed: number) {
        super(trans, EGameObjectType.BUTTON);

        this.color = color;
        this.count = this.countMax = count;
        this.speed = speed;
    }

    OnClick() {
        let isUpd = false;

        if (this.count > 0) {
            this.count--;
            isUpd = true;
        }

        if (this.count === 0) {
            this.lastClickAt = this.level.frameTick + this.speed * 1.5;
            if (isUpd) {
                this.level.ActiveAllWallObjectsByColor(this.color, false);
            }
        }
        return isUpd;
    }

    OnTick() {
        const t = this.level.frameTick;
        const diff = ((t - this.lastClickAt) / this.speed) | 0;

        if (diff > 0 && this.count < this.countMax) {
            if (this.count === 0) {
                this.level.ActiveAllWallObjectsByColor(this.color, true);
            }

            this.count += diff;
            this.count = this.count >= this.countMax ? this.countMax : this.count;
            this.lastClickAt += diff * this.speed;

            return true;
        } else if (this.count >= this.countMax) {
            this.lastClickAt = t;
        }
        return false;
    }

    OnReset() {
        if (this.count === 0) {
            this.level.ActiveAllWallObjectsByColor(this.color, true);
        }
        this.lastClickAt = 0;
        this.count = this.countMax;
    }

    Serialize(writer: BufferWriter) {
        super.Serialize(writer);
        writer.writeU(this.count, 16);
        writer.writeU(this.color, 32);
    }
}

export class RainbowButtonObject extends ButtonObject {
    protected fakeColor: EWallColor;

    constructor(trans: Box, color: EWallColor, count: number, speed: number) {
        super(trans, color, count, speed);
        this.fakeColor = color;
    }

    OnTick() {
        const t = this.level.frameTick;

        const getColorOfs = (e = 0, speed = 30) => Math.sin(0.02 * (t / speed) + e) * 127 + 128;
        const newColor = (getColorOfs() << 16) | (getColorOfs(2) << 8) | getColorOfs(4);

        const isUpd = newColor != this.fakeColor;
        if (isUpd) {
            this.fakeColor = newColor;
        }

        const newSpeed = this.speed * ((1 / this.countMax) * (this.count + 1));
        const diff = ((t - this.lastClickAt) / newSpeed) | 0;

        if (diff > 0 && this.count < this.countMax) {
            if (this.count === 0) {
                this.level.ActiveAllWallObjectsByColor(this.color, true);
            }

            this.count += diff;
            this.count = this.count >= this.countMax ? this.countMax : this.count;
            this.lastClickAt += diff * newSpeed;

            return true;
        } else if (this.count >= this.countMax) {
            this.lastClickAt = t;
        }
        return isUpd;
    }

    Serialize(writer: BufferWriter) {
        super.MainSerialize(writer);
        writer.writeU(this.count, 16);
        writer.writeU(this.fakeColor, 32);
    }
}
