import Level from '../Level';
import { Point, EWallColor } from '../../Types';
import { TextObject, TeleportObject, RainbowButtonObject } from '../GameObject';
import LevelManager from '../../manager/LevelManager';

export default class LevelEnd extends Level {
    name = 'End';
    spawn: Point = [200, 200];

    OnInit() {
        this.AddGameObject(new TeleportObject([0, 0, 30, 1], LevelManager.GetLevel(0)));
        this.AddGameObject(new TextObject([200, 150], 220, true, 'The end.'));
        this.AddGameObject(new RainbowButtonObject([0, 250, 400, 50], EWallColor.WHITE, new Date().getFullYear(), 1000));
    }
}
