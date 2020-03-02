import { Player } from "./Player";
import { Point, ServerMessageType } from "../Types";
import { BufferWriter } from "../tools/Buffer";

export default abstract class Level {
    protected readonly spawn: Point;
    // private map: ArrayBuffer;
    private objects: Array<any> = [];

    public OnPlayerJoin(player: Player) {
        player.OnMoveSafe(this.spawn, false, false);
    }

    public OnPlayerLeave(player: Player) {
        // TODO: Reset objects by player
    }

    public SendLevelData(player: Player, sync: number) {

        // gObjs = level.gObjs.filter(x => (x.type != gObjType.Wall || !x.hasOpened)),
        
        const numObjects = this.objects.length;

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

    public OnMoved(player: Player) {
        
    }
}