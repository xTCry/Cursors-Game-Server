import Level from '../Level';
import { Point, EWallColor } from '../../Types';
import { TextObject, TeleportObject, ButtonObject, WallObject } from '../GameObject';
import LevelManager from '../../manager/LevelManager';

export default class LevelTest2 extends Level {
    name = 'Test Two';
    spawn: Point = [200, 150];

    OnInit() {
        this.AddGameObject(new TeleportObject([10, 10, 30, 30], LevelManager.GetLevel(0/* LevelManager.levels.length - 1 */)));
        this.AddGameObject(new TeleportObject([0, 0, 400, 10]));

        this.AddGameObject(new WallObject([0, 290, 400, 10], EWallColor.PINK));
        this.AddGameObject(new WallObject([0, 50, 400, 10], EWallColor.PINK));

        this.AddGameObject(new TextObject([20, 60], 22, true, 'GO'));
        this.AddGameObject(new ButtonObject([100, 100, 40, 40], EWallColor.PINK, 10, 700));
    }
}
