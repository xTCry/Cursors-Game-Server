import Level from '../Level';
import { Point, EWallColor } from '../../Types';
import { TextObject, TeleportObject, ButtonObject, WallObject, AreaCounterObject, RainbowButtonObject } from '../GameObject';
import LevelManager from '../../manager/LevelManager';

export default class LevelTest2 extends Level {
    name = 'Test Two';
    spawn: Point = [200, 150];

    OnInit() {
        this.AddGameObject(new TeleportObject([10, 10, 30, 30], LevelManager.GetLevel(LevelManager.levels.length - 1)));
        this.AddGameObject(new TeleportObject([0, 0, 400, 10]));

        this.AddGameObject(new WallObject([0, 290, 400, 10], EWallColor.PINK));
        this.AddGameObject(new WallObject([0, 50, 400, 10], EWallColor.PINK));

        this.AddGameObject(new TextObject([25, 59], 22, true, 'GO'));
        this.AddGameObject(new ButtonObject([100, 100, 40, 40], EWallColor.PINK, 10, 700));
        this.AddGameObject(new AreaCounterObject([150, 100, 40, 40], EWallColor.PINK, 1));
        this.AddGameObject(new RainbowButtonObject([200, 100, 40, 40], EWallColor.PINK, 50, 1000));
    }
}
