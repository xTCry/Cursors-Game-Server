import Level from '../Level';
import { Point, EWallColor } from '../../Types';
import { TextObject, TeleportObject, WallObject } from '../GameObject';
import LevelManager from '../../manager/LevelManager';

export default class LevelTest extends Level {
    name = 'Test';
    spawn: Point = [200, 50];

    OnInit() {
        this.AddGameObject(new WallObject([0, 0, 10, 300], EWallColor.BLACK));
        this.AddGameObject(new WallObject([390, 0, 10, 300], EWallColor.BLACK));
        this.AddGameObject(new WallObject([0, 0, 400, 10], EWallColor.BLACK));
        this.AddGameObject(new WallObject([0, 290, 400, 10], EWallColor.BLACK));

        this.AddGameObject(new TextObject([200, 100], 24, true, 'HelloW', 'fa15c1'));

        this.AddGameObject(new TeleportObject([10, 280, 380, 10], LevelManager.GetNextLevel(this)));
    }
}
