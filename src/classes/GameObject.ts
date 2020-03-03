import { EGameObjectType, Box, Point, EWallColor, ETeleportColor } from '../Types';
import { BufferWriter } from '../tools/Buffer';
import { Player } from './Player';
import Level from './Level';
import levelManager from '../manager/LevelManager';

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
        if (this.actCounter !== 0 && --this.actCounter == 0) {
            this.isActive = true;
            this.level.AddGameObject(this);
        }
    }

    public Deactivate() {
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
        const [x, y, w, h] = this.transform;
        writer.writeU(this.id, 32);
        writer.writeU(this.type);
        writer.writeU(x, 16);
        writer.writeU(y, 16);
        writer.writeU(w, 16);
        writer.writeU(h, 16);
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
        const [x, y] = this.transform;
        writer.writeU(this.id, 32);
        writer.writeU(this.type);
        writer.writeU(x, 16);
        writer.writeU(y, 16);

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

export class ButtonObject extends GameObject {
    private count: number = 0;
    private countMax: number = 0;
    private speed: number = 0;
    private lastClickAt: number = 0;
    private color: EWallColor;

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
