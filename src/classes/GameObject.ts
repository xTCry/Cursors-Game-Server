import { EGameObjectType, Box, Point } from '../Types';
import { BufferWriter } from '../tools/Buffer';
import { Player } from './Player';
import Level from './Level';

export default abstract class GameObject {
    public readonly type: EGameObjectType;
    public id: number;
    public transform: Box;
    public isInit: boolean = false;
    public level: Level;

    constructor(transform: Box, type: EGameObjectType) {
        this.transform = transform;
        this.type = type;
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

    public CheckInside(pos: Point): boolean {
        return false;
    }

    public OnReset(): void {
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

export class TeleportObject extends GameObject {
    private isBad: boolean = false;

    constructor(trans: Box, isBad: boolean = false) {
        super(trans, EGameObjectType.TELEPORT);
        this.isBad = isBad;
    }

    Serialize(writer: BufferWriter) {
        super.Serialize(writer);
        writer.writeU(this.isBad ? 1 : 0);
    }
}
