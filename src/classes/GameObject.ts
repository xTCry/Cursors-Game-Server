import { EGameObjectType, Box, Point } from '../Types';
import { BufferWriter } from '../tools/Buffer';
import { Player } from './Player';

export default abstract class GameObject {
    public readonly id: number;
    public readonly type: EGameObjectType;
    public readonly transform: Box;
    public isInit: boolean = false;

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
