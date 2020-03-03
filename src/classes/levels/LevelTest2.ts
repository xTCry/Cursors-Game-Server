import Level from '../Level';
import { Point } from '../../Types';
import { TextObject, TeleportObject } from '../GameObject';
import LevelManager from '../../manager/LevelManager';

export default class LevelTest2 extends Level {
    name = 'Test Two';
    spawn: Point = [200, 150];

    OnInit() {
        this.AddGameObject(new TextObject([20, 60], 24, true, 'GO'));
        this.AddGameObject(new TeleportObject([10, 10, 30, 30]));

		this.AddGameObject(new TeleportObject([10, 280, 380, 10], LevelManager.GetLevel(LevelManager.levels.length - 1)));
    }
}
